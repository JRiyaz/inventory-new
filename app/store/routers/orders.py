import random

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_db
from ..models.domain import Customer, SalesOrder, SalesOrderItem
from ..schemas.order import SalesOrderCreate, SalesOrderItemResponse, SalesOrderResponse
from ..utils.inventory_client import deduct_inventory_stock
from ..utils.invoice import generate_invoice_html

router = APIRouter(prefix="/orders", tags=["Storefront Orders & Checkouts"])

# Standard OAuth2 scheme to extract the raw bearer token easily
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")


@router.get("", response_model=list[SalesOrderResponse])
async def list_orders(page: int = 1, limit: int = 10, db: AsyncSession = Depends(get_db)):
    """
    Returns all storefront orders (paginated), including their items.
    """
    offset = (page - 1) * limit
    result = await db.execute(select(SalesOrder).offset(offset).limit(limit))
    orders = result.scalars().all()

    response = []
    for order in orders:
        item_res = await db.execute(select(SalesOrderItem).where(SalesOrderItem.order_id == order.id))
        items = item_res.scalars().all()

        order_dict = SalesOrderResponse.model_validate(order)
        order_dict.items = [SalesOrderItemResponse.model_validate(item) for item in items]
        response.append(order_dict)

    return response


@router.get("/{order_id}", response_model=SalesOrderResponse)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    """
    Retrieves a single order by its ID.
    """
    result = await db.execute(select(SalesOrder).where(SalesOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    item_res = await db.execute(select(SalesOrderItem).where(SalesOrderItem.order_id == order.id))
    items = item_res.scalars().all()

    response = SalesOrderResponse.model_validate(order)
    response.items = [SalesOrderItemResponse.model_validate(item) for item in items]
    return response


@router.get("/{order_id}/invoice", response_class=HTMLResponse)
async def get_order_invoice(order_id: int, db: AsyncSession = Depends(get_db)):
    """
    Generates and renders a premium, highly elegant, glassmorphic HTML invoice
    for the completed order checkout (Print-ready).
    """
    # Fetch Order
    order_res = await db.execute(select(SalesOrder).where(SalesOrder.id == order_id))
    order = order_res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Fetch Customer
    customer_res = await db.execute(select(Customer).where(Customer.id == order.customer_id))
    customer = customer_res.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated customer profile not located")

    # Fetch Items
    items_res = await db.execute(select(SalesOrderItem).where(SalesOrderItem.order_id == order.id))
    items = items_res.scalars().all()

    # Generate receipt HTML
    html_content = await generate_invoice_html(order, items, customer)
    return HTMLResponse(content=html_content)


@router.post("", response_model=SalesOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order_checkout(
    payload: SalesOrderCreate, raw_token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
):
    """
    Submits a transaction-safe storefront order checkout.
    Verifies stock levels on remote Inventory Service using authenticated SSRF-guarded calls
    before creating order items inside an atomic local transaction database boundary.
    """
    # Verify customer profile exists
    cust_check = await db.execute(select(Customer).where(Customer.id == payload.customer_id))
    if not cust_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Billing customer profile not located")

    # Generate unique Order number (e.g. SO-12345)
    random_id = random.randint(10000, 99999)
    order_number = f"SO-{random_id}"

    # Calculate total Checkout amount
    total_amount = sum(item.quantity * item.unit_price for item in payload.items)

    # First, make external calls to deduct/verify stock in Inventory Service!
    # If any fail due to insufficient stock, raise exception and abort transaction before adding any local records!
    for item in payload.items:
        # Calls Inventory Service synchronously via HTTPX client, passing token along for security
        await deduct_inventory_stock(
            product_id=item.product_id, quantity=item.quantity, order_number=order_number, token=raw_token
        )

    # Create SalesOrder header record inside transaction
    order = SalesOrder(
        order_number=order_number,
        customer_id=payload.customer_id,
        status="Pending",
        total_amount=total_amount,
        payment_status="Unpaid",
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)

    # Insert items
    response_items = []
    for item in payload.items:
        order_item = SalesOrderItem(
            order_id=order.id,
            product_id=item.product_id,
            sku=item.sku,
            name=item.name,
            quantity=item.quantity,
            unit_price=item.unit_price,
        )
        db.add(order_item)
        response_items.append(order_item)

    await db.commit()

    for item in response_items:
        await db.refresh(item)

    response = SalesOrderResponse.model_validate(order)
    response.items = [SalesOrderItemResponse.model_validate(item) for item in response_items]
    return response
