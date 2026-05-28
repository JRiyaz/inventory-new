from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_db
from ..models.domain import Warehouse
from ..schemas.warehouse import WarehouseCreate, WarehouseResponse, WarehouseUpdate
from ..utils.dependencies import RoleChecker

router = APIRouter(prefix="/warehouses", tags=["Warehouses Operations"])


@router.get("", response_model=list[WarehouseResponse])
async def list_warehouses(page: int = 1, limit: int = 10, db: AsyncSession = Depends(get_db)):
    """
    Returns a paginated list of all active warehouses.
    """
    offset = (page - 1) * limit
    result = await db.execute(select(Warehouse).offset(offset).limit(limit))
    return result.scalars().all()


@router.get("/{warehouse_id}", response_model=WarehouseResponse)
async def get_warehouse(warehouse_id: int, db: AsyncSession = Depends(get_db)):
    """
    Retrieves details for a specific warehouse.
    """
    result = await db.execute(select(Warehouse).where(Warehouse.id == warehouse_id))
    warehouse = result.scalar_one_or_none()
    if not warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")
    return warehouse


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
