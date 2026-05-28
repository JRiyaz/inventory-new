from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from ..utils.sanitizer import SanitizedStr


class ProductCreate(BaseModel):
    sku: SanitizedStr = Field(..., min_length=3, max_length=50)
    name: SanitizedStr = Field(..., min_length=1, max_length=150)
    description: SanitizedStr | None = Field(default=None, max_length=1000)
    price: float = Field(..., ge=0.0)
    category: SanitizedStr = Field(..., min_length=1, max_length=100)
    status: SanitizedStr = Field(default="Active")
    image_url: SanitizedStr | None = Field(default=None, max_length=500)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("Active", "Inactive", "Discontinued"):
            raise ValueError("Status must be Active, Inactive, or Discontinued")
        return v


class ProductUpdate(BaseModel):
    sku: SanitizedStr | None = Field(default=None, min_length=3, max_length=50)
    name: SanitizedStr | None = Field(default=None, min_length=1, max_length=150)
    description: SanitizedStr | None = Field(default=None, max_length=1000)
    price: float | None = Field(default=None, ge=0.0)
    category: SanitizedStr | None = Field(default=None, min_length=1, max_length=100)
    status: SanitizedStr | None = Field(default=None)
    image_url: SanitizedStr | None = Field(default=None, max_length=500)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in ("Active", "Inactive", "Discontinued"):
            raise ValueError("Status must be Active, Inactive, or Discontinued")
        return v


class ProductResponse(BaseModel):
    id: int
    sku: str
    name: str
    description: str | None
    price: float
    category: str
    status: str
    image_url: str | None
    created_at: datetime

    class Config:
        from_attributes = True
