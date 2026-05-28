from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_db
from ..models.domain import User
from ..schemas.user import Token, UserLogin, UserRegister
from ..utils.audit import create_audit_entry
from ..utils.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(request: Request, payload: UserRegister, db: AsyncSession = Depends(get_db)):
    """
    Asynchronously registers a new user profile.
    Automatically bootstraps the first user in the database to be an 'Admin'.
    """
    # Defensive check against duplicate username
    username_result = await db.execute(select(User).where(User.username == payload.username))
    if username_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered in database")

    # Defensive check against duplicate email
    email_result = await db.execute(select(User).where(User.email == payload.email))
    if email_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email address already registered in database"
        )

    # Bootstrapping rule: First profile becomes Admin
    count_result = await db.execute(select(User))
    has_any = count_result.first() is not None
    assigned_role = "Customer" if has_any else "Admin"

    hashed_password = hash_password(payload.password)
    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hashed_password,
        name=payload.name,
        company=payload.company,
        role=assigned_role,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Log modern asynchronous audit event
    correlation_id = request.headers.get("x-correlation-id")
    await create_audit_entry(
        db=db,
        action="REGISTER",
        resource="Users",
        details=f"User profile created successfully with role: {user.role}",
        user_id=user.id,
        username=user.username,
        ip_address=request.client.host if request.client else None,
        correlation_id=correlation_id,
    )

    # Issue JWT token immediately after registration
    token_data = {"sub": user.username, "role": user.role}
    access_token = create_access_token(token_data)
    return Token(access_token=access_token, role=user.role, username=user.username)


@router.post("/login", response_model=Token)
async def login(request: Request, payload: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Authenticates a user and issues an access JWT token.
    """
    # Search by either username or email for flexibility
    result = await db.execute(
        select(User).where((User.username == payload.username) | (User.email == payload.username))
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username/email or credentials supplied"
        )

    if user.status != "Active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your profile has been suspended")

    # Log login success
    correlation_id = request.headers.get("x-correlation-id")
    await create_audit_entry(
        db=db,
        action="LOGIN",
        resource="Authentication",
        details="Authentication successful",
        user_id=user.id,
        username=user.username,
        ip_address=request.client.host if request.client else None,
        correlation_id=correlation_id,
    )

    # Issue token
    token_data = {"sub": user.username, "role": user.role}
    access_token = create_access_token(token_data)
    return Token(access_token=access_token, role=user.role, username=user.username)


@router.get("/check-username")
async def check_username_exists(username: str, db: AsyncSession = Depends(get_db)):
    """
    Checks if a username is already taken in the system.
    Supports asynchronous validation in the Angular registration MFE.
    """
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    return {"exists": user is not None}
