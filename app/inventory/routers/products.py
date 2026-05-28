from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import or_, select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_db
from ..models.domain import Product
from ..schemas.product import ProductCreate, ProductResponse, ProductUpdate
from ..utils.dependencies import RoleChecker

router = APIRouter(prefix="/products", tags=["Products Catalog"])


@router.get("", response_model=list[ProductResponse])
async def list_products(
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Returns a paginated list of all products in the catalog.
    Supports search query and category filtering.
    """
    offset = (page - 1) * limit
    query = select(Product)

    # Apply search filter
    if search:
        query = query.where(
            or_(Product.name.contains(search), Product.sku.contains(search), Product.description.contains(search))
        )

    # Apply category filter
    if category:
        query = query.where(Product.category == category)

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """
    Retrieves a single product from the catalog.
    """
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate, current_user=Depends(RoleChecker(["Admin", "Agent"])), db: AsyncSession = Depends(get_db)
):
    """
    Creates a new product in the catalog (Admin/Agent only).
    """
    # Check for duplicate SKU
    sku_check = await db.execute(select(Product).where(Product.sku == payload.sku))
    if sku_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product SKU already exists in catalog")

    product = Product(
        sku=payload.sku,
        name=payload.name,
        description=payload.description,
        price=payload.price,
        category=payload.category,
        status=payload.status,
        image_url=payload.image_url,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    current_user=Depends(RoleChecker(["Admin", "Agent"])),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates an existing product's details (Admin/Agent only).
    """
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found in catalog")

    # Update fields dynamically
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(product, key, value)

    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int, current_user=Depends(RoleChecker(["Admin"])), db: AsyncSession = Depends(get_db)
):
    """
    Permanently deletes a product from the catalog (Admin only).
    """
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found in catalog")

    await db.delete(product)
    await db.commit()


@router.get("/check-sku/exists")
async def check_sku_exists(sku: str, db: AsyncSession = Depends(get_db)):
    """
    Checks if a Product SKU already exists in the catalog.
    Supports real-time async form validations in the Angular catalog MFE.
    """
    result = await db.execute(select(Product).where(Product.sku == sku))
    product = result.scalar_one_or_none()
    return {"exists": product is not None}
