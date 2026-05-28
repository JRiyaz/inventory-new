import re

from pydantic import BaseModel, Field, field_validator

from ..utils.sanitizer import SanitizedStr


class CustomerCreate(BaseModel):
    name: SanitizedStr = Field(..., min_length=1, max_length=150)
    email: SanitizedStr = Field(..., max_length=100)
    phone: SanitizedStr | None = Field(default=None, max_length=50)
    address: SanitizedStr | None = Field(default=None, max_length=300)
    company: SanitizedStr | None = Field(default=None, max_length=150)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not re.match(r"^\S+@\S+\.\S+$", v):
            raise ValueError("Invalid email format")
        return v


class CustomerUpdate(BaseModel):
    name: SanitizedStr | None = Field(default=None, min_length=1, max_length=150)
    email: SanitizedStr | None = Field(default=None, max_length=100)
    phone: SanitizedStr | None = Field(default=None, max_length=50)
    address: SanitizedStr | None = Field(default=None, max_length=300)
    company: SanitizedStr | None = Field(default=None, max_length=150)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str | None) -> str | None:
        if v is not None and not re.match(r"^\S+@\S+\.\S+$", v):
            raise ValueError("Invalid email format")
        return v


class CustomerResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None
    address: str | None
    company: str | None

    class Config:
        from_attributes = True
