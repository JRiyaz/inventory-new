from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_db
from ..models.domain import Customer
from ..schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate
from ..utils.dependencies import RoleChecker

router = APIRouter(prefix="/customers", tags=["Customer Profiles"])


@router.get("", response_model=list[CustomerResponse])
async def list_customers(page: int = 1, limit: int = 10, db: AsyncSession = Depends(get_db)):
    """
    Returns a paginated list of all customer profiles.
    """
    offset = (page - 1) * limit
    result = await db.execute(select(Customer).offset(offset).limit(limit))
    return result.scalars().all()


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    """
    Retrieves billing details for a specific customer.
    """
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer billing profile not found")
    return customer


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    payload: CustomerCreate, current_user=Depends(RoleChecker(["Admin", "Agent"])), db: AsyncSession = Depends(get_db)
):
    """
    Creates a new customer billing profile (Admin/Agent only).
    """
    email_check = await db.execute(select(Customer).where(Customer.email == payload.email))
    if email_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email address already registered")

    customer = Customer(
        name=payload.name, email=payload.email, phone=payload.phone, address=payload.address, company=payload.company
    )
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    current_user=Depends(RoleChecker(["Admin", "Agent"])),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates billing details for an existing customer (Admin/Agent only).
    """
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer billing profile not found")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(customer, key, value)

    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer
