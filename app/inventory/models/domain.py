from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


class Product(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    sku: str = Field(unique=True, index=True, nullable=False)
    name: str = Field(nullable=False)
    description: str | None = Field(default=None)
    price: float = Field(nullable=False)
    category: str = Field(nullable=False)
    status: str = Field(default="Active", nullable=False)  # Active, Inactive, Discontinued
    image_url: str | None = Field(default=None)
    supplier_id: int | None = Field(default=None, foreign_key="supplier.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC), nullable=False)


class Warehouse(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    code: str = Field(unique=True, index=True, nullable=False)  # e.g., WH-NY-01
    name: str = Field(nullable=False)
    location: str = Field(nullable=False)
    status: str = Field(default="Active", nullable=False)  # Active, Maintenance


class StockLevel(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", nullable=False, index=True)
    warehouse_id: int = Field(foreign_key="warehouse.id", nullable=False, index=True)
    quantity: int = Field(default=0, nullable=False)
    min_stock: int = Field(default=5, nullable=False)


class StockMovement(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", nullable=False, index=True)
    warehouse_id: int = Field(foreign_key="warehouse.id", nullable=False, index=True)
    quantity_changed: int = Field(nullable=False)  # positive = addition, negative = deduction
    type: str = Field(nullable=False)  # INCOMING, OUTGOING, RECONCILIATION, ADJUSTMENT
    reference: str | None = Field(default=None)  # e.g., PO-1234 or SO-5678
    details: str | None = Field(default=None)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC), nullable=False)
    user_id: int | None = Field(default=None)
    username: str | None = Field(default=None)


class Supplier(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    code: str = Field(unique=True, index=True, nullable=False)  # e.g., SUP-001
    name: str = Field(nullable=False)
    contact_email: str = Field(nullable=False)
    phone: str | None = Field(default=None)
    address: str | None = Field(default=None)


class PurchaseOrder(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    po_number: str = Field(unique=True, index=True, nullable=False)  # e.g., PO-2026-0001
    supplier_id: int = Field(foreign_key="supplier.id", nullable=False, index=True)
    status: str = Field(default="Draft", nullable=False)  # Draft, Sent, Received, Cancelled
    total_cost: float = Field(default=0.0, nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC), nullable=False)
    delivery_date: datetime | None = Field(default=None)


class PurchaseOrderItem(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    po_id: int = Field(foreign_key="purchaseorder.id", nullable=False, index=True)
    product_id: int = Field(foreign_key="product.id", nullable=False, index=True)
    quantity_ordered: int = Field(nullable=False)
    quantity_received: int = Field(default=0, nullable=False)
    unit_cost: float = Field(nullable=False)
