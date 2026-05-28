from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True, nullable=False)
    email: str = Field(unique=True, index=True, nullable=False)
    password_hash: str = Field(nullable=False)
    name: str = Field(nullable=False)
    company: str | None = Field(default=None)
    role: str = Field(default="Customer", nullable=False)  # Customer, Admin, Agent
    status: str = Field(default="Active", nullable=False)  # Active, Suspended
    avatar_url: str | None = Field(default=None)
    join_date: datetime = Field(default_factory=lambda: datetime.now(UTC), nullable=False)


class UserPermission(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    role: str = Field(unique=True, index=True, nullable=False)
    can_read: bool = Field(default=True, nullable=False)
    can_write: bool = Field(default=False, nullable=False)
    can_update: bool = Field(default=False, nullable=False)
    can_delete: bool = Field(default=False, nullable=False)


class UserSettings(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True, index=True, nullable=False)
    theme: str = Field(default="void-blue", nullable=False)
    loader_animation: str = Field(default="bloom", nullable=False)
    animation_tempo: int = Field(default=800, nullable=False)
    display_images: bool = Field(default=True, nullable=False)
    dnd: bool = Field(default=False, nullable=False)
    urgent_persistence: bool = Field(default=False, nullable=False)
    notification_duration: int = Field(default=4000, nullable=False)
    notification_placement: str = Field(default="top-right", nullable=False)


class AuditLog(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int | None = Field(default=None, index=True)
    username: str | None = Field(default=None)
    action: str = Field(nullable=False)  # LOGIN, REGISTER, UPDATE_ROLE, UPDATE_PROFILE
    resource: str = Field(nullable=False)  # Users, Authentication, Roles
    details: str = Field(nullable=False)  # Detailed log description
    ip_address: str | None = Field(default=None)
    correlation_id: str | None = Field(default=None)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC), nullable=False)
