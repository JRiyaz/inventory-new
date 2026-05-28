from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import func, or_, select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_db
from ..models.domain import Customer
from ..schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate
from ..utils.dependencies import RoleChecker

router = APIRouter(prefix="/customers", tags=["Customer Profiles"])


@router.get("", response_model=list[CustomerResponse])
async def list_customers(
    response: Response,
    page: int = 1,
    _page: int = 1,
    limit: int = 10,
    _limit: int = 10,
    q: str | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Returns a paginated list of all customer profiles.
    """
    active_page = page if page != 1 else _page
    active_limit = limit if limit != 10 else _limit
    active_search = q or search

    query = select(Customer)
    count_query = select(func.count()).select_from(Customer)

    if active_search:
        search_filter = or_(
            Customer.name.contains(active_search),
            Customer.email.contains(active_search),
            Customer.company.contains(active_search),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total_count_res = await db.execute(count_query)
    total_count = total_count_res.scalar_one()

    offset = (active_page - 1) * active_limit
    query = query.offset(offset).limit(active_limit)

    result = await db.execute(query)
    customers = result.scalars().all()

    response.headers["X-Total-Count"] = str(total_count)
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"

    return customers


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
