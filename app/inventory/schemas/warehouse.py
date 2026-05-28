from pydantic import BaseModel, Field, field_validator

from ..utils.sanitizer import SanitizedStr


class WarehouseCreate(BaseModel):
    code: SanitizedStr = Field(..., min_length=2, max_length=50)
    name: SanitizedStr = Field(..., min_length=1, max_length=150)
    location: SanitizedStr = Field(..., min_length=1, max_length=250)
    status: SanitizedStr = Field(default="Active")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("Active", "Maintenance"):
            raise ValueError("Status must be Active or Maintenance")
        return v


class WarehouseUpdate(BaseModel):
    code: SanitizedStr | None = Field(default=None, min_length=2, max_length=50)
    name: SanitizedStr | None = Field(default=None, min_length=1, max_length=150)
    location: SanitizedStr | None = Field(default=None, min_length=1, max_length=250)
    status: SanitizedStr | None = Field(default=None)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in ("Active", "Maintenance"):
            raise ValueError("Status must be Active or Maintenance")
        return v


class WarehouseResponse(BaseModel):
    id: int
    code: str
    name: str
    location: str
    status: str

    class Config:
        from_attributes = True
