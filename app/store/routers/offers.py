from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_db
from ..models.domain import Offer
from ..schemas.offer import OfferCreate, OfferResponse
from ..utils.dependencies import RoleChecker

router = APIRouter(prefix="/offers", tags=["Discount Offers"])


@router.get("", response_model=list[OfferResponse])
async def list_offers(productId: int | None = None, category: str | None = None, db: AsyncSession = Depends(get_db)):
    """
    Returns all discount offers in the system.
    Supports filtering by productId or category.
    """
    query = select(Offer)
    if productId is not None:
        query = query.where(Offer.product_id == productId)
    if category is not None:
        query = query.where(Offer.category == category)

    result = await db.execute(query)
    offers = result.scalars().all()

    # Map model properties to schema properties for proper camelCase response serialization
    response = []
    for offer in offers:
        resp = OfferResponse(
            id=offer.id,
            title=offer.title,
            description=offer.description,
            discount=offer.discount,
            category=offer.category,
            productId=offer.product_id,
            expiryDate=offer.expiry_date,
            color=offer.color,
        )
        response.append(resp)
    return response


@router.post("", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
async def create_offer(
    payload: OfferCreate, current_user=Depends(RoleChecker(["Admin", "Agent"])), db: AsyncSession = Depends(get_db)
):
    """
    Creates a new promotional offer (Admin/Agent only).
    """
    offer = Offer(
        title=payload.title,
        description=payload.description,
        discount=payload.discount,
        category=payload.category,
        product_id=payload.productId,
        expiry_date=payload.expiryDate,
        color=payload.color,
    )
    db.add(offer)
    await db.commit()
    await db.refresh(offer)

    return OfferResponse(
        id=offer.id,
        title=offer.title,
        description=offer.description,
        discount=offer.discount,
        category=offer.category,
        productId=offer.product_id,
        expiryDate=offer.expiry_date,
        color=offer.color,
    )


@router.put("/{offer_id}", response_model=OfferResponse)
async def update_offer(
    offer_id: int,
    payload: OfferCreate,
    current_user=Depends(RoleChecker(["Admin", "Agent"])),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates an existing offer's details (Admin/Agent only).
    """
    result = await db.execute(select(Offer).where(Offer.id == offer_id))
    offer = result.scalar_one_or_none()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    offer.title = payload.title
    offer.description = payload.description
    offer.discount = payload.discount
    offer.category = payload.category
    offer.product_id = payload.productId
    offer.expiry_date = payload.expiryDate
    offer.color = payload.color

    db.add(offer)
    await db.commit()
    await db.refresh(offer)

    return OfferResponse(
        id=offer.id,
        title=offer.title,
        description=offer.description,
        discount=offer.discount,
        category=offer.category,
        productId=offer.product_id,
        expiryDate=offer.expiry_date,
        color=offer.color,
    )


@router.delete("/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_offer(offer_id: int, current_user=Depends(RoleChecker(["Admin"])), db: AsyncSession = Depends(get_db)):
    """
    Deletes an offer from the ledger (Admin only).
    """
    result = await db.execute(select(Offer).where(Offer.id == offer_id))
    offer = result.scalar_one_or_none()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    await db.delete(offer)
    await db.commit()
