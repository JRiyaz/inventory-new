from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_db
from ..models.domain import Supplier
from ..schemas.supplier import SupplierCreate, SupplierResponse, SupplierUpdate
from ..utils.dependencies import RoleChecker

router = APIRouter(prefix="/suppliers", tags=["Suppliers Catalog"])


@router.get("", response_model=list[SupplierResponse])
async def list_suppliers(page: int = 1, limit: int = 10, db: AsyncSession = Depends(get_db)):
    """
    Returns a paginated list of all active suppliers.
    """
    offset = (page - 1) * limit
    result = await db.execute(select(Supplier).offset(offset).limit(limit))
    return result.scalars().all()


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(supplier_id: int, db: AsyncSession = Depends(get_db)):
    """
    Retrieves details for a specific supplier.
    """
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return supplier


@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
async def create_supplier(
    payload: SupplierCreate, current_user=Depends(RoleChecker(["Admin", "Agent"])), db: AsyncSession = Depends(get_db)
):
    """
    Registers a new supplier in the catalog (Admin/Agent only).
    """
    code_check = await db.execute(select(Supplier).where(Supplier.code == payload.code))
    if code_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Supplier code already exists")

    supplier = Supplier(
        code=payload.code,
        name=payload.name,
        contact_email=payload.contact_email,
        phone=payload.phone,
        address=payload.address,
    )
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return supplier


@router.put("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: int,
    payload: SupplierUpdate,
    current_user=Depends(RoleChecker(["Admin", "Agent"])),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates an existing supplier's details (Admin/Agent only).
    """
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(supplier, key, value)

    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return supplier
