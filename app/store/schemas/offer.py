from pydantic import BaseModel, Field

from ..utils.sanitizer import SanitizedStr


class OfferCreate(BaseModel):
    title: SanitizedStr = Field(..., min_length=1, max_length=150)
    description: SanitizedStr | None = Field(default=None, max_length=500)
    discount: float = Field(..., ge=0, le=100)
    category: SanitizedStr | None = Field(default=None, max_length=100)
    productId: int | None = Field(default=None, validation_alias="productId")
    expiryDate: SanitizedStr = Field(..., validation_alias="expiryDate")
    color: SanitizedStr = Field(default="primary", max_length=50)


class OfferResponse(BaseModel):
    id: int
    title: str
    description: str | None
    discount: float
    category: str | None
    productId: int | None = Field(default=None, serialization_alias="productId")
    expiryDate: str = Field(..., serialization_alias="expiryDate")
    color: str

    class Config:
        from_attributes = True
        populate_by_name = True
