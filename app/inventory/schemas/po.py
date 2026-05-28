from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from ..utils.sanitizer import SanitizedStr


class PurchaseOrderItemCreate(BaseModel):
    product_id: int
    quantity_ordered: int = Field(..., gt=0)
    unit_cost: float = Field(..., ge=0.0)


class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    items: list[PurchaseOrderItemCreate] = Field(..., min_length=1)


class PurchaseOrderUpdate(BaseModel):
    status: SanitizedStr | None = Field(default=None)
    delivery_date: datetime | None = Field(default=None)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in ("Draft", "Sent", "Received", "Cancelled"):
            raise ValueError("Status must be Draft, Sent, Received, or Cancelled")
        return v


class PurchaseOrderItemResponse(BaseModel):
    id: int
    po_id: int
    product_id: int
    quantity_ordered: int
    quantity_received: int
    unit_cost: float

    class Config:
        from_attributes = True


class PurchaseOrderResponse(BaseModel):
    id: int
    po_number: str
    supplier_id: int
    status: str
    total_cost: float
    created_at: datetime
    delivery_date: datetime | None
    items: list[PurchaseOrderItemResponse] = []

    class Config:
        from_attributes = True
