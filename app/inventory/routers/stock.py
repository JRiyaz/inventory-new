from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_db
from ..models.domain import Product, StockLevel, StockMovement, Warehouse
from ..schemas.stock import StockAdjustment, StockLevelResponse, StockMovementResponse
from ..utils.dependencies import AuthenticatedUser, RoleChecker

router = APIRouter(prefix="/stock", tags=["Stock Management & Auditing"])


@router.get("/levels", response_model=list[StockLevelResponse])
async def get_stock_levels(
    product_id: int | None = None, warehouse_id: int | None = None, db: AsyncSession = Depends(get_db)
):
    """
    Retrieves current stock levels. Supports filtering by product and/or warehouse.
    """
    query = select(StockLevel)
    if product_id is not None:
        query = query.where(StockLevel.product_id == product_id)
    if warehouse_id is not None:
        query = query.where(StockLevel.warehouse_id == warehouse_id)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/movements", response_model=list[StockMovementResponse])
async def get_stock_movements(
    page: int = 1, limit: int = 20, product_id: int | None = None, db: AsyncSession = Depends(get_db)
):
    """
    Fetches raw stock movements audit trail logs (paginated).
    """
    offset = (page - 1) * limit
    query = select(StockMovement).order_by(StockMovement.timestamp.desc())

    if product_id is not None:
        query = query.where(StockMovement.product_id == product_id)

    result = await db.execute(query.offset(offset).limit(limit))
    return result.scalars().all()


@router.post("/adjust", response_model=StockLevelResponse)
async def adjust_stock_level(
    payload: StockAdjustment,
    current_user: AuthenticatedUser = Depends(RoleChecker(["Admin", "Agent"])),
    db: AsyncSession = Depends(get_db),
):
    """
    Performs stock additions, deductions, or audit adjustments.
    Strictly transaction-safe: creates audit movements and protects against negative stock.
    """
    # Verify that the product and warehouse actually exist first
    product_check = await db.execute(select(Product).where(Product.id == payload.product_id))
    if not product_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target product not found in catalog")

    warehouse_check = await db.execute(select(Warehouse).where(Warehouse.id == payload.warehouse_id))
    if not warehouse_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target warehouse facility not found")

    # Fetch or initialize StockLevel record
    stock_query = select(StockLevel).where(
        StockLevel.product_id == payload.product_id, StockLevel.warehouse_id == payload.warehouse_id
    )
    stock_res = await db.execute(stock_query)
    stock = stock_res.scalar_one_or_none()

    if not stock:
        # If it doesn't exist and we are subtracting, block it
        if payload.quantity_changed < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Negative stock levels are prohibited. Available: 0"
            )
        stock = StockLevel(product_id=payload.product_id, warehouse_id=payload.warehouse_id, quantity=0)
        db.add(stock)

    # Calculate and check prospective stock levels
    prospective_quantity = stock.quantity + payload.quantity_changed
    if prospective_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Deduction denied: would cause negative stock. Available quantity: {stock.quantity}",
        )

    # Apply quantity modification
    stock.quantity = prospective_quantity
    db.add(stock)

    # Inject Audit Outbox Stock Movement record
    movement = StockMovement(
        product_id=payload.product_id,
        warehouse_id=payload.warehouse_id,
        quantity_changed=payload.quantity_changed,
        type=payload.type,
        reference=payload.reference,
        details=payload.details,
        username=current_user.username,
    )
    db.add(movement)

    # Commit atomic unit of work transaction
    await db.commit()
    await db.refresh(stock)
    return stock
