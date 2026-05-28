from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


class Customer(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(nullable=False)
    email: str = Field(unique=True, index=True, nullable=False)
    phone: str | None = Field(default=None)
    address: str | None = Field(default=None)
    company: str | None = Field(default=None)
    avatar_url: str | None = Field(default=None)


class SalesOrder(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    order_number: str = Field(unique=True, index=True, nullable=False)  # e.g., SO-12345
    customer_id: int = Field(foreign_key="customer.id", nullable=False, index=True)
    status: str = Field(default="Pending", nullable=False)  # Pending, Paid, Completed, Cancelled
    total_amount: float = Field(default=0.0, nullable=False)
    payment_status: str = Field(default="Unpaid", nullable=False)  # Unpaid, Paid, Refunded
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC), nullable=False)


class SalesOrderItem(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="salesorder.id", nullable=False, index=True)
    product_id: int = Field(nullable=False, index=True)  # Denormalized remote reference ID
    sku: str = Field(nullable=False)  # Remote SKU reference
    name: str = Field(nullable=False)  # Denormalized product name
    quantity: int = Field(nullable=False)
    unit_price: float = Field(nullable=False)


class SalesPayment(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="salesorder.id", nullable=False, index=True)
    amount: float = Field(nullable=False)
    payment_method: str = Field(nullable=False)  # Cash, Credit Card, Bank Transfer, PayPal
    transaction_reference: str | None = Field(default=None)
    status: str = Field(default="Completed", nullable=False)  # Completed, Failed, Refunded
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC), nullable=False)
