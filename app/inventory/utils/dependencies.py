from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

from .security import decode_access_token

# Configure standard OAuth2 scheme dependency mapping (relies on shared token URL or direct headers)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")


class AuthenticatedUser(BaseModel):
    username: str
    role: str


async def get_current_user(token: str = Depends(oauth2_scheme)) -> AuthenticatedUser:
    """
    Dependency that decodes the JWT access token and returns a verified AuthenticatedUser object.
    Supports complete decoupled execution.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate active JWT session token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    username: str | None = payload.get("sub")
    role: str | None = payload.get("role")
    if username is None or role is None:
        raise credentials_exception

    return AuthenticatedUser(username=username, role=role)


class RoleChecker:
    """
    Dependency class to guard endpoints utilizing Role-Based Access Control (RBAC).
    """

    def __init__(self, allowed_roles: list[str]) -> None:
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Action denied: insufficient role privileges"
            )
        return current_user
