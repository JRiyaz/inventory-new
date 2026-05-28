import re

from pydantic import BaseModel, Field, field_validator

from ..utils.sanitizer import SanitizedStr


class SupplierCreate(BaseModel):
    code: SanitizedStr = Field(..., min_length=2, max_length=50)
    name: SanitizedStr = Field(..., min_length=1, max_length=150)
    contact_email: SanitizedStr = Field(..., max_length=100)
    phone: SanitizedStr | None = Field(default=None, max_length=50)
    address: SanitizedStr | None = Field(default=None, max_length=300)

    @field_validator("contact_email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not re.match(r"^\S+@\S+\.\S+$", v):
            raise ValueError("Invalid email format")
        return v


class SupplierUpdate(BaseModel):
    code: SanitizedStr | None = Field(default=None, min_length=2, max_length=50)
    name: SanitizedStr | None = Field(default=None, min_length=1, max_length=150)
    contact_email: SanitizedStr | None = Field(default=None, max_length=100)
    phone: SanitizedStr | None = Field(default=None, max_length=50)
    address: SanitizedStr | None = Field(default=None, max_length=300)

    @field_validator("contact_email")
    @classmethod
    def validate_email(cls, v: str | None) -> str | None:
        if v is not None and not re.match(r"^\S+@\S+\.\S+$", v):
            raise ValueError("Invalid email format")
        return v


class SupplierResponse(BaseModel):
    id: int
    code: str
    name: str
    contact_email: str
    phone: str | None
    address: str | None

    class Config:
        from_attributes = True
