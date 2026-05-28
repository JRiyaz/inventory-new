import random

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_db
from ..models.domain import (
    Product,
    PurchaseOrder,
    PurchaseOrderItem,
    StockLevel,
    StockMovement,
    Supplier,
    Warehouse,
)
from ..schemas.po import (
    PurchaseOrderCreate,
    PurchaseOrderItemResponse,
    PurchaseOrderResponse,
    PurchaseOrderUpdate,
)
from ..utils.dependencies import AuthenticatedUser, RoleChecker

router = APIRouter(prefix="/purchaseOrders", tags=["Purchase Orders & Procurement"])


@router.get("", response_model=list[PurchaseOrderResponse])
async def list_purchase_orders(
    response: Response,
    page: int = 1,
    _page: int = 1,
    limit: int = 10,
    _limit: int = 10,
    _sort: str | None = None,
    _order: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Returns all purchase orders in the system (paginated).
    Includes their detailed items.
    """
    active_page = page if page != 1 else _page
    active_limit = limit if limit != 10 else _limit

    query = select(PurchaseOrder)
    count_query = select(func.count()).select_from(PurchaseOrder)

    if _sort == "date":
        if _order == "desc":
            query = query.order_by(PurchaseOrder.created_at.desc())
        else:
            query = query.order_by(PurchaseOrder.created_at.asc())

    total_count_res = await db.execute(count_query)
    total_count = total_count_res.scalar_one()

    offset = (active_page - 1) * active_limit
    query = query.offset(offset).limit(active_limit)
    result = await db.execute(query)
    pos = result.scalars().all()

    res_list = []
    for po in pos:
        item_res = await db.execute(select(PurchaseOrderItem).where(PurchaseOrderItem.po_id == po.id))
        items = item_res.scalars().all()

        po_dict = PurchaseOrderResponse.model_validate(po)
        po_dict.items = [PurchaseOrderItemResponse.model_validate(item) for item in items]
        res_list.append(po_dict)

    response.headers["X-Total-Count"] = str(total_count)
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"

    return res_list


@router.get("/{po_id}", response_model=PurchaseOrderResponse)
async def get_purchase_order(po_id: int, db: AsyncSession = Depends(get_db)):
    """
    Retrieves a single purchase order by its ID.
    """
    result = await db.execute(select(PurchaseOrder).where(PurchaseOrder.id == po_id))
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")

    item_res = await db.execute(select(PurchaseOrderItem).where(PurchaseOrderItem.po_id == po.id))
    items = item_res.scalars().all()

    response = PurchaseOrderResponse.model_validate(po)
    response.items = [PurchaseOrderItemResponse.model_validate(item) for item in items]
    return response


@router.post("", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_purchase_order(
    payload: PurchaseOrderCreate,
    current_user: AuthenticatedUser = Depends(RoleChecker(["Admin", "Agent"])),
    db: AsyncSession = Depends(get_db),
):
    """
    Drafts and creates a new procurement purchase order (Admin/Agent only).
    Automatically generates unique PO numbers and calculates total values.
    """
    # Verify supplier exists
    sup_check = await db.execute(select(Supplier).where(Supplier.id == payload.supplier_id))
    if not sup_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target supplier not found")

    # Validate all products exist and calculate total PO cost
    total_cost = 0.0
    for item in payload.items:
        prod_check = await db.execute(select(Product).where(Product.id == item.product_id))
        if not prod_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Product with ID {item.product_id} not found in catalog"
            )
        total_cost += item.quantity_ordered * item.unit_cost

    # Generate a unique PO number (e.g. PO-XXXXX)
    random_id = random.randint(1000, 99999)
    po_number = f"PO-{random_id}"

    po = PurchaseOrder(po_number=po_number, supplier_id=payload.supplier_id, status="Draft", total_cost=total_cost)
    db.add(po)
    await db.commit()
    await db.refresh(po)

    # Insert items
    response_items = []
    for item in payload.items:
        po_item = PurchaseOrderItem(
            po_id=po.id,
            product_id=item.product_id,
            quantity_ordered=item.quantity_ordered,
            quantity_received=0,
            unit_cost=item.unit_cost,
        )
        db.add(po_item)
        response_items.append(po_item)

    await db.commit()

    for item in response_items:
        await db.refresh(item)

    response = PurchaseOrderResponse.model_validate(po)
    response.items = [PurchaseOrderItemResponse.model_validate(item) for item in response_items]
    return response


@router.put("/{po_id}", response_model=PurchaseOrderResponse)
async def update_purchase_order_status(
    po_id: int,
    payload: PurchaseOrderUpdate,
    current_user: AuthenticatedUser = Depends(RoleChecker(["Admin", "Agent"])),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates a purchase order. If status transitions to 'Received',
    the system automatically credits stock levels in the primary warehouse
    and logs stock auditing events.
    """
    result = await db.execute(select(PurchaseOrder).where(PurchaseOrder.id == po_id))
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not located")

    old_status = po.status

    if payload.status:
        po.status = payload.status
    if payload.delivery_date:
        po.delivery_date = payload.delivery_date

    db.add(po)

    # Handle auto-crediting stock when PO status transitions to "Received"
    if payload.status == "Received" and old_status != "Received":
        # Fetch active warehouse to place the incoming stock (fallback to id=1)
        wh_result = await db.execute(select(Warehouse).where(Warehouse.status == "Active").limit(1))
        warehouse = wh_result.scalar_one_or_none()
        if not warehouse:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active warehouse facility available to receive stock",
            )

        # Retrieve all items in the PO
        item_res = await db.execute(select(PurchaseOrderItem).where(PurchaseOrderItem.po_id == po.id))
        items = item_res.scalars().all()

        for item in items:
            # Mark all ordered quantities as successfully received
            item.quantity_received = item.quantity_ordered
            db.add(item)

            # Credit local stock level
            stock_res = await db.execute(
                select(StockLevel).where(
                    StockLevel.product_id == item.product_id, StockLevel.warehouse_id == warehouse.id
                )
            )
            stock = stock_res.scalar_one_or_none()
            if not stock:
                stock = StockLevel(product_id=item.product_id, warehouse_id=warehouse.id, quantity=0)
            stock.quantity += item.quantity_ordered
            db.add(stock)

            # Record stock movements audit outbox entry
            movement = StockMovement(
                product_id=item.product_id,
                warehouse_id=warehouse.id,
                quantity_changed=item.quantity_ordered,
                type="INCOMING",
                reference=po.po_number,
                details=f"Received procurement stock from {po.po_number}",
                username=current_user.username,
            )
            db.add(movement)

    await db.commit()
    await db.refresh(po)

    # Fetch updated items for output validation
    item_res = await db.execute(select(PurchaseOrderItem).where(PurchaseOrderItem.po_id == po.id))
    items = item_res.scalars().all()

    response = PurchaseOrderResponse.model_validate(po)
    response.items = [PurchaseOrderItemResponse.model_validate(i) for i in items]
    return response


@router.post("/auto-draft", response_model=list[PurchaseOrderResponse])
async def auto_draft_replenishment_orders(
    current_user: AuthenticatedUser = Depends(RoleChecker(["Admin", "Agent"])), db: AsyncSession = Depends(get_db)
):
    """
    Predictive Logistics: Automatically scans for low-stock items (quantity < min_stock),
    groups them by primary supplier, and generates Draft Purchase Orders to replenish inventory.
    """
    # 1. Fetch all low-stock levels
    levels_res = await db.execute(select(StockLevel).where(StockLevel.quantity < StockLevel.min_stock))
    low_stocks = levels_res.scalars().all()

    if not low_stocks:
        return []

    # Fetch default fallback supplier if any product lacks a supplier relation
    default_sup_res = await db.execute(select(Supplier).limit(1))
    default_supplier = default_sup_res.scalar_one_or_none()

    if not default_supplier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No suppliers registered. Cannot auto-draft replenishment POs.",
        )

    # 2. Group products by supplier_id
    supplier_groups: dict[int, list[tuple[Product, StockLevel]]] = {}

    for stock in low_stocks:
        prod_res = await db.execute(select(Product).where(Product.id == stock.product_id))
        product = prod_res.scalar_one_or_none()

        if not product:
            continue

        sup_id = product.supplier_id or default_supplier.id
        if sup_id not in supplier_groups:
            supplier_groups[sup_id] = []
        supplier_groups[sup_id].append((product, stock))

    # 3. Create POs atomically for each supplier group
    drafted_pos = []

    for sup_id, items in supplier_groups.items():
        # Replenishment PO generation
        random_id = random.randint(1000, 99999)
        po_number = f"PO-REPL-{random_id}"

        po = PurchaseOrder(po_number=po_number, supplier_id=sup_id, status="Draft", total_cost=0.0)
        db.add(po)
        await db.commit()
        await db.refresh(po)

        total_cost = 0.0
        po_items = []

        for product, stock in items:
            # Replenish stock to 3x the minimum stock level
            replenish_quantity = (stock.min_stock * 3) - stock.quantity
            unit_cost = round(product.price * 0.7, 2)  # Wholesale cost is 70% of retail price

            po_item = PurchaseOrderItem(
                po_id=po.id,
                product_id=product.id,
                quantity_ordered=replenish_quantity,
                quantity_received=0,
                unit_cost=unit_cost,
            )
            db.add(po_item)
            po_items.append(po_item)
            total_cost += replenish_quantity * unit_cost

        # Update PO cost header
        po.total_cost = round(total_cost, 2)
        db.add(po)
        await db.commit()
        await db.refresh(po)

        # Refresh all created item lines
        po_item_responses = []
        for pi in po_items:
            await db.refresh(pi)
            po_item_responses.append(PurchaseOrderItemResponse.model_validate(pi))

        po_response = PurchaseOrderResponse.model_validate(po)
        po_response.items = po_item_responses
        drafted_pos.append(po_response)

    return drafted_pos
