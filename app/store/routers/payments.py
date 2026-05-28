import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_db
from ..models.domain import Customer, SalesOrder, SalesPayment
from ..schemas.payment import SalesPaymentCreate, SalesPaymentResponse
from ..utils.dependencies import AuthenticatedUser, RoleChecker
from ..utils.email import send_invoice_receipt_email

router = APIRouter(prefix="/payments", tags=["Payments Ledger"])


@router.get("", response_model=list[SalesPaymentResponse])
async def list_payments(page: int = 1, limit: int = 10, db: AsyncSession = Depends(get_db)):
    """
    Returns all processed payments in the ledger (paginated).
    """
    offset = (page - 1) * limit
    result = await db.execute(select(SalesPayment).offset(offset).limit(limit))
    return result.scalars().all()


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
