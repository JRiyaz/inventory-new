import jwt

from ..config import settings


def decode_access_token(token: str) -> dict | None:
    """
    Decodes and validates a JSON Web Token (JWT) using the shared symmetric secret,
    returning decoded claims or None if invalid.
    """
    try:
        decoded_token = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return decoded_token
    except jwt.PyJWTError:
        return None
