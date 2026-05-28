from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_db
from ..models.domain import StockLevel, Warehouse
from ..schemas.warehouse import WarehouseCreate, WarehouseResponse, WarehouseUpdate
from ..utils.dependencies import RoleChecker

router = APIRouter(prefix="/warehouses", tags=["Warehouses Operations"])


@router.get("", response_model=list[WarehouseResponse])
async def list_warehouses(page: int = 1, limit: int = 10, db: AsyncSession = Depends(get_db)):
    """
    Returns a paginated list of all active warehouses with dynamic stock and utilization.
    """
    offset = (page - 1) * limit
    result = await db.execute(select(Warehouse).offset(offset).limit(limit))
    warehouses = result.scalars().all()

    response = []
    for wh in warehouses:
        stock_res = await db.execute(select(func.sum(StockLevel.quantity)).where(StockLevel.warehouse_id == wh.id))
        total_stock = stock_res.scalar() or 0

        capacity = 5000
        utilization = round((total_stock / capacity) * 100, 1) if total_stock else 0.0
        if utilization > 100:
            utilization = 100.0

        zones = [
            {"id": f"z-{wh.id}-1", "name": f"Shelf A-{wh.id}", "description": "High-density shelves"},
            {"id": f"z-{wh.id}-2", "name": f"Shelf B-{wh.id}", "description": "Pallet storage"},
            {"id": f"z-{wh.id}-3", "name": f"Shelf C-{wh.id}", "description": "Receiving bay"},
        ]

        wh_response = WarehouseResponse(
            id=wh.id,
            code=wh.code,
            name=wh.name,
            location=wh.location,
            status=wh.status,
            currentStock=total_stock,
            utilization=utilization,
            zones=zones,
        )
        response.append(wh_response)

    return response


@router.get("/{warehouse_id}", response_model=WarehouseResponse)
async def get_warehouse(warehouse_id: int, db: AsyncSession = Depends(get_db)):
    """
    Retrieves details for a specific warehouse.
    """
    result = await db.execute(select(Warehouse).where(Warehouse.id == warehouse_id))
    wh = result.scalar_one_or_none()
    if not wh:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")

    stock_res = await db.execute(select(func.sum(StockLevel.quantity)).where(StockLevel.warehouse_id == wh.id))
    total_stock = stock_res.scalar() or 0

    capacity = 5000
    utilization = round((total_stock / capacity) * 100, 1) if total_stock else 0.0
    if utilization > 100:
        utilization = 100.0

    zones = [
        {"id": f"z-{wh.id}-1", "name": f"Shelf A-{wh.id}", "description": "High-density shelves"},
        {"id": f"z-{wh.id}-2", "name": f"Shelf B-{wh.id}", "description": "Pallet storage"},
        {"id": f"z-{wh.id}-3", "name": f"Shelf C-{wh.id}", "description": "Receiving bay"},
    ]

    return WarehouseResponse(
        id=wh.id,
        code=wh.code,
        name=wh.name,
        location=wh.location,
        status=wh.status,
        currentStock=total_stock,
        utilization=utilization,
        zones=zones,
    )


@router.post("", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
async def create_warehouse(
    payload: WarehouseCreate, current_user=Depends(RoleChecker(["Admin", "Agent"])), db: AsyncSession = Depends(get_db)
):
    """
    Creates a new warehouse facility (Admin/Agent only).
    """
    code_check = await db.execute(select(Warehouse).where(Warehouse.code == payload.code))
    if code_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Warehouse code already exists")

    warehouse = Warehouse(code=payload.code, name=payload.name, location=payload.location, status=payload.status)
    db.add(warehouse)
    await db.commit()
    await db.refresh(warehouse)
    return warehouse


@router.put("/{warehouse_id}", response_model=WarehouseResponse)
async def update_warehouse(
    warehouse_id: int,
    payload: WarehouseUpdate,
    current_user=Depends(RoleChecker(["Admin", "Agent"])),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates an existing warehouse's details (Admin/Agent only).
    """
    result = await db.execute(select(Warehouse).where(Warehouse.id == warehouse_id))
    warehouse = result.scalar_one_or_none()
    if not warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(warehouse, key, value)

    db.add(warehouse)
    await db.commit()
    await db.refresh(warehouse)
    return warehouse
