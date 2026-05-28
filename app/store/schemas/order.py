from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from ..utils.sanitizer import SanitizedStr


class SalesOrderItemCreate(BaseModel):
    product_id: int
    sku: SanitizedStr = Field(..., min_length=3, max_length=50)
    name: SanitizedStr = Field(..., min_length=1, max_length=150)
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., ge=0.0)


class SalesOrderCreate(BaseModel):
    customer_id: int
    items: list[SalesOrderItemCreate] = Field(..., min_length=1)


class SalesOrderUpdate(BaseModel):
    status: SanitizedStr | None = Field(default=None)
    payment_status: SanitizedStr | None = Field(default=None)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in ("Pending", "Paid", "Completed", "Cancelled"):
            raise ValueError("Status must be Pending, Paid, Completed, or Cancelled")
        return v

    @field_validator("payment_status")
    @classmethod
    def validate_payment_status(cls, v: str | None) -> str | None:
        if v is not None and v not in ("Unpaid", "Paid", "Refunded"):
            raise ValueError("Payment status must be Unpaid, Paid, or Refunded")
        return v


class SalesOrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    sku: str
    name: str
    quantity: int
    unit_price: float

    class Config:
        from_attributes = True


class SalesOrderResponse(BaseModel):
    id: int
    order_number: str
    customer_id: int
    status: str
    total_amount: float
    payment_status: str
    created_at: datetime
    updated_at: datetime
    items: list[SalesOrderItemResponse] = []

    class Config:
        from_attributes = True
