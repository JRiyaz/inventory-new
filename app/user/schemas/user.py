import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from ..utils.sanitizer import SanitizedStr


class UserRegister(BaseModel):
    username: SanitizedStr = Field(..., min_length=3, max_length=50)
    email: SanitizedStr
    password: str = Field(..., min_length=6)
    name: SanitizedStr = Field(..., min_length=1, max_length=100)
    company: SanitizedStr | None = Field(default=None, max_length=100)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not re.match(r"^\S+@\S+\.\S+$", v):
            raise ValueError("Invalid email address format")
        return v


class UserLogin(BaseModel):
    username: SanitizedStr = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    name: str
    company: str | None
    role: str
    status: str
    avatar_url: str | None = None
    join_date: datetime

    class Config:
        from_attributes = True  # Modern Pydantic v2 configuration (replaces orm_mode = True)


class UserSettingsResponse(BaseModel):
    theme: str
    loader_animation: str
    animation_tempo: int
    display_images: bool
    dnd: bool
    urgent_persistence: bool
    notification_duration: int
    notification_placement: str

    class Config:
        from_attributes = True


class UserSettingsUpdate(BaseModel):
    theme: str | None = None
    loader_animation: str | None = None
    animation_tempo: int | None = None
    display_images: bool | None = None
    dnd: bool | None = None
    urgent_persistence: bool | None = None
    notification_duration: int | None = None
    notification_placement: str | None = None


class UserRoleUpdate(BaseModel):
    role: SanitizedStr

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("Admin", "Customer", "Agent"):
            raise ValueError("Role must be Admin, Customer, or Agent")
        return v
