from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from ..utils.sanitizer import SanitizedStr


class SalesPaymentCreate(BaseModel):
    order_id: int
    payment_method: SanitizedStr = Field(..., min_length=1, max_length=100)
    transaction_reference: SanitizedStr | None = Field(default=None, max_length=200)

    @field_validator("payment_method")
    @classmethod
    def validate_method(cls, v: str) -> str:
        if v not in ("Cash", "Credit Card", "Bank Transfer", "PayPal"):
            raise ValueError("Payment method must be Cash, Credit Card, Bank Transfer, or PayPal")
        return v


class SalesPaymentResponse(BaseModel):
    id: int
    order_id: int
    amount: float
    payment_method: str
    transaction_reference: str | None
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True
