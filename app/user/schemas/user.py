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
    two_factor_enabled: bool

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
    email_alerts: bool

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
    email_alerts: bool | None = None


class UserRoleUpdate(BaseModel):
    role: SanitizedStr

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("Admin", "Customer", "Agent"):
            raise ValueError("Role must be Admin, Customer, or Agent")
        return v


class UserAdminUpdate(BaseModel):
    name: SanitizedStr = Field(..., min_length=1, max_length=100)
    email: SanitizedStr
    role: SanitizedStr
    status: SanitizedStr
    company: SanitizedStr | None = Field(default=None, max_length=100)
    password: str | None = Field(default=None)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not re.match(r"^\S+@\S+\.\S+$", v):
            raise ValueError("Invalid email address format")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("Admin", "Customer", "Agent"):
            raise ValueError("Role must be Admin, Customer, or Agent")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("Active", "Suspended"):
            raise ValueError("Status must be Active or Suspended")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str | None) -> str | None:
        if v is not None and len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class ForgotPasswordRequest(BaseModel):
    email: SanitizedStr

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not re.match(r"^\S+@\S+\.\S+$", v):
            raise ValueError("Invalid email address format")
        return v


class PasswordResetConfirm(BaseModel):
    email: SanitizedStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not re.match(r"^\S+@\S+\.\S+$", v):
            raise ValueError("Invalid email address format")
        return v


class TwoFactorSetupResponse(BaseModel):
    secret: str
    qr_code_url: str


class TwoFactorVerifyRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)


class TwoFactorLoginRequest(BaseModel):
    username: SanitizedStr
    code: str = Field(..., min_length=6, max_length=6)
