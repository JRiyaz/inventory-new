import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response, status
from sqlmodel import func, or_, select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_db
from ..models.domain import Customer, SalesOrder, SalesPayment
from ..schemas.payment import SalesPaymentCreate, SalesPaymentResponse
from ..utils.dependencies import AuthenticatedUser, RoleChecker
from ..utils.email import send_invoice_receipt_email

router = APIRouter(prefix="/payments", tags=["Payments Ledger"])


@router.get("", response_model=list[SalesPaymentResponse])
async def list_payments(
    response: Response,
    page: int = 1,
    _page: int = 1,
    limit: int = 10,
    _limit: int = 10,
    q: str | None = None,
    search: str | None = None,
    status: str | None = None,
    _sort: str | None = None,
    _order: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Returns all processed payments in the ledger (paginated).
    """
    active_page = page if page != 1 else _page
    active_limit = limit if limit != 10 else _limit
    active_search = q or search

    query = select(SalesPayment)
    count_query = select(func.count()).select_from(SalesPayment)

    if active_search:
        search_filter = or_(
            SalesPayment.payment_method.contains(active_search),
            SalesPayment.transaction_reference.contains(active_search),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if status and status != "All Status":
        query = query.where(SalesPayment.status == status)
        count_query = count_query.where(SalesPayment.status == status)

    if _sort:
        column = getattr(SalesPayment, _sort, None)
        if column:
            if _order == "desc":
                query = query.order_by(column.desc())
            else:
                query = query.order_by(column.asc())
    else:
        query = query.order_by(SalesPayment.id.desc())

    total_count_res = await db.execute(count_query)
    total_count = total_count_res.scalar_one()

    offset = (active_page - 1) * active_limit
    query = query.offset(offset).limit(active_limit)
    result = await db.execute(query)
    payments = result.scalars().all()

    response.headers["X-Total-Count"] = str(total_count)
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"

    return payments


@router.get("/{payment_id}", response_model=SalesPaymentResponse)
async def get_payment(payment_id: int, db: AsyncSession = Depends(get_db)):
    """
    Retrieves details for a specific payment.
    """
    result = await db.execute(select(SalesPayment).where(SalesPayment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment transaction not located")
    return payment


@router.post("", response_model=SalesPaymentResponse, status_code=status.HTTP_201_CREATED)
async def process_payment(
    payload: SalesPaymentCreate,
    background_tasks: BackgroundTasks,
    current_user: AuthenticatedUser = Depends(RoleChecker(["Admin", "Agent"])),
    db: AsyncSession = Depends(get_db),
):
    """
    Processes a storefront order checkout payment.
    Strictly transaction-safe: marks order Paid and updates payments ledger.
    Triggers asynchronous delivery of the receipt invoice to the customer billing email.
    """
    # Fetch Target SalesOrder
    order_res = await db.execute(select(SalesOrder).where(SalesOrder.id == payload.order_id))
    order = order_res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target order not located")

    # Validate Order Status
    if order.payment_status == "Paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Payment transaction aborted: order already marked Paid"
        )
    if order.status == "Cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Payment transaction aborted: order has been cancelled"
        )

    # Fetch Customer to retrieve billing email
    cust_res = await db.execute(select(Customer).where(Customer.id == order.customer_id))
    customer = cust_res.scalar_one_or_none()

    # Process and log transaction details
    tx_ref = payload.transaction_reference or f"TXN-{uuid.uuid4().hex[:12].upper()}"

    # Create Payment record inside transaction
    payment = SalesPayment(
        order_id=payload.order_id,
        amount=order.total_amount,
        payment_method=payload.payment_method,
        transaction_reference=tx_ref,
        status="Completed",
    )
    db.add(payment)

    # Credit SalesOrder statuses
    order.payment_status = "Paid"
    order.status = "Paid"
    db.add(order)

    # Commit atomic payment transaction
    await db.commit()
    await db.refresh(payment)

    # Trigger background receipt dispatch asynchronously
    if customer:
        background_tasks.add_task(send_invoice_receipt_email, order, customer)

    return payment
