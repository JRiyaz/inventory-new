from datetime import datetime

from pydantic import BaseModel, Field

from ..utils.sanitizer import SanitizedStr


class StockAdjustment(BaseModel):
    product_id: int
    warehouse_id: int
    quantity_changed: int = Field(..., ne=0)  # Cannot be 0
    type: SanitizedStr = Field(default="ADJUSTMENT")  # ADJUSTMENT, RECONCILIATION, etc.
    reference: SanitizedStr | None = Field(default=None)
    details: SanitizedStr | None = Field(default=None)


class StockLevelResponse(BaseModel):
    id: int
    product_id: int
    warehouse_id: int
    quantity: int
    min_stock: int

    class Config:
        from_attributes = True


class StockMovementResponse(BaseModel):
    id: int
    product_id: int
    warehouse_id: int
    quantity_changed: int
    type: str
    reference: str | None
    details: str | None
    timestamp: datetime
    username: str | None

    class Config:
        from_attributes = True
