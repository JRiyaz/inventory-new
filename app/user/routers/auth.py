import secrets
from datetime import UTC, datetime, timedelta

import pyotp
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_db
from ..models.domain import PasswordResetOTP, User, UserSettings
from ..schemas.user import (
    ForgotPasswordRequest,
    PasswordResetConfirm,
    Token,
    TwoFactorLoginRequest,
    TwoFactorSetupResponse,
    TwoFactorVerifyRequest,
    UserLogin,
    UserRegister,
)
from ..utils.audit import create_audit_entry
from ..utils.dependencies import get_current_user
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


@router.post("/login")
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

    # If 2FA is enabled, intercept and return requires_2fa state
    if user.two_factor_enabled:
        return {"status": "requires_2fa", "username": user.username}

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


@router.post("/logout")
async def logout(response: Response):
    """
    Clears both session_token and csrftoken cookies.
    """
    response.delete_cookie(key="session_token", path="/")
    response.delete_cookie(key="csrftoken", path="/")
    return {"detail": "Successfully logged out"}


@router.get("/check-username")
async def check_username_exists(username: str, db: AsyncSession = Depends(get_db)):
    """
    Checks if a username is already taken in the system.
    Supports asynchronous validation in the Angular registration MFE.
    """
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    return {"exists": user is not None}


@router.post("/login/2fa")
async def login_2fa(payload: TwoFactorLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Validates a 6-digit TOTP code and logs the user in if successful.
    """
    result = await db.execute(select(User).where(User.username == payload.username))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.status != "Active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your profile has been suspended")

    if not user.two_factor_enabled or not user.two_factor_secret:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is not enabled for this account")

    totp = pyotp.TOTP(user.two_factor_secret)
    if not totp.verify(payload.code):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid verification code")

    # Issue token
    token_data = {"sub": user.username, "role": user.role}
    access_token = create_access_token(token_data)
    return Token(access_token=access_token, role=user.role, username=user.username)


@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
async def setup_2fa(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Generates a new TOTP secret for the logged-in user and returns manual entry key and QR code URI.
    """
    secret = pyotp.random_base32()
    current_user.two_factor_secret = secret
    db.add(current_user)
    await db.commit()

    # Create standard provisioning URI
    provisioning_uri = pyotp.totp.TOTP(secret).provisioning_uri(name=current_user.email, issuer_name="InventorySystem")

    # Use public secure chart API for QR code rendering
    qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={provisioning_uri}"

    return TwoFactorSetupResponse(secret=secret, qr_code_url=qr_code_url)


@router.post("/2fa/verify")
async def verify_2fa(
    payload: TwoFactorVerifyRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """
    Confirms and enables 2-Factor Authentication for the user.
    """
    if not current_user.two_factor_secret:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA has not been setup yet")

    totp = pyotp.TOTP(current_user.two_factor_secret)
    if not totp.verify(payload.code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")

    current_user.two_factor_enabled = True
    db.add(current_user)
    await db.commit()

    # Send security email notification
    settings_res = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    user_settings = settings_res.scalar_one_or_none()

    from ..utils.email import EmailService

    EmailService.send_email(
        to_email=current_user.email,
        subject="Security Update: 2FA Enabled",
        html_content=f"<h3>2-Factor Authentication Enabled</h3><p>Hello {current_user.name}, 2FA has been successfully enabled on your Inventory Management account.</p>",
        text_content=f"Hello {current_user.name}, 2-Factor Authentication has been successfully enabled on your account.",
        user_settings=user_settings,
    )

    return {"status": "success", "message": "2FA successfully activated"}


@router.post("/2fa/disable")
async def disable_2fa(
    payload: TwoFactorVerifyRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """
    Disables 2-Factor Authentication for the user.
    """
    if not current_user.two_factor_enabled or not current_user.two_factor_secret:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is not enabled")

    totp = pyotp.TOTP(current_user.two_factor_secret)
    if not totp.verify(payload.code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")

    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    db.add(current_user)
    await db.commit()

    # Send security email notification
    settings_res = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    user_settings = settings_res.scalar_one_or_none()

    from ..utils.email import EmailService

    EmailService.send_email(
        to_email=current_user.email,
        subject="Security Update: 2FA Disabled",
        html_content=f"<h3>2-Factor Authentication Disabled</h3><p>Hello {current_user.name}, 2FA has been disabled on your account. If you did not do this, secure your profile immediately.</p>",
        text_content=f"Hello {current_user.name}, 2-Factor Authentication has been disabled on your account.",
        user_settings=user_settings,
    )

    return {"status": "success", "message": "2FA successfully deactivated"}


@router.get("/oauth/{provider}")
async def oauth_login(provider: str):
    """
    Simulates OAuth redirection. Redirects immediately to the callback with mock profile credentials.
    """
    if provider not in ("google", "facebook", "apple"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported OAuth provider")

    # Generate a beautiful random mock email/name based on provider
    mock_email = f"dev_{provider}_{secrets.token_hex(4)}@company.com"
    mock_name = f"Developer {provider.capitalize()}"

    # Redirect to callback
    redirect_url = f"/api/auth/oauth/callback?provider={provider}&email={mock_email}&name={mock_name}"
    return RedirectResponse(url=redirect_url)


@router.get("/oauth/callback")
async def oauth_callback(provider: str, email: str, name: str, db: AsyncSession = Depends(get_db)):
    """
    Simulated OAuth Callback. Registers the OAuth user if not present, and issues standard login credentials.
    """
    username = email.split("@")[0]

    # Search for user by email or username
    result = await db.execute(select(User).where((User.email == email) | (User.username == username)))
    user = result.scalar_one_or_none()

    if not user:
        # Create fresh user profile
        from ..utils.security import hash_password

        dummy_pwd = secrets.token_hex(16)
        user = User(
            username=username,
            email=email,
            password_hash=hash_password(dummy_pwd),
            name=name,
            company=f"{provider.capitalize()} User",
            role="Customer",
            status="Active",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Issue JWT token
    token_data = {"sub": user.username, "role": user.role}
    access_token = create_access_token(token_data)

    # Construct SPA RedirectResponse setting secure cookies
    response = RedirectResponse(url="http://localhost:4000/inventory")

    # Set access token cookie
    response.set_cookie(key="session_token", value=access_token, httponly=True, samesite="lax", path="/")

    # Set CSRF token cookie
    csrf_token = secrets.token_hex(32)
    response.set_cookie(key="csrftoken", value=csrf_token, httponly=False, samesite="lax", path="/")

    return response


@router.post("/forgot-password/request")
async def request_forgot_password_otp(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Verifies that the email exists, generates a 6-digit verification OTP, and sends it via EmailService.
    """
    # 1. Check if email exists
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user:
        # To prevent user enumeration attacks, we still return a successful response!
        return {"status": "success", "message": "If this email is registered, an OTP code has been sent."}

    # 2. Generate 6-digit numeric OTP code
    otp_code = "".join(secrets.choice("0123456789") for _ in range(6))
    expiration = datetime.now(UTC) + timedelta(minutes=5)

    # 3. Save to PasswordResetOTP table
    # Delete any existing OTPs for this email first
    existing_otps = await db.execute(select(PasswordResetOTP).where(PasswordResetOTP.email == payload.email))
    for entry in existing_otps.scalars().all():
        await db.delete(entry)

    otp_record = PasswordResetOTP(email=payload.email, otp=otp_code, expires_at=expiration)
    db.add(otp_record)
    await db.commit()

    # 4. Fetch user settings for email preferences
    settings_res = await db.execute(select(UserSettings).where(UserSettings.user_id == user.id))
    user_settings = settings_res.scalar_one_or_none()

    # 5. Send Email Alert
    from ..utils.email import EmailService

    EmailService.send_otp_email(to_email=payload.email, otp=otp_code, user_settings=user_settings)

    return {"status": "success", "message": "Verification OTP code has been successfully dispatched."}


@router.post("/forgot-password/reset")
async def reset_password_confirm(payload: PasswordResetConfirm, db: AsyncSession = Depends(get_db)):
    """
    Verifies the OTP token and sets the new hashed password for the user.
    """
    # 1. Verify OTP exists and is valid
    result = await db.execute(
        select(PasswordResetOTP).where(PasswordResetOTP.email == payload.email, PasswordResetOTP.otp == payload.otp)
    )
    otp_record = result.scalar_one_or_none()

    if not otp_record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification OTP code")

    # Check expiration
    current_time = datetime.now(UTC)
    expires_at = (
        otp_record.expires_at.replace(tzinfo=UTC) if otp_record.expires_at.tzinfo is None else otp_record.expires_at
    )

    if current_time > expires_at:
        await db.delete(otp_record)
        await db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification OTP code has expired")

    # 2. Reset user's password
    user_res = await db.execute(select(User).where(User.email == payload.email))
    user = user_res.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated user not found")

    from ..utils.security import hash_password

    user.password_hash = hash_password(payload.new_password)
    db.add(user)

    # 3. Clean up OTP record
    await db.delete(otp_record)
    await db.commit()

    # 4. Trigger Email Alerts
    settings_res = await db.execute(select(UserSettings).where(UserSettings.user_id == user.id))
    user_settings = settings_res.scalar_one_or_none()

    from ..utils.email import EmailService

    EmailService.send_password_change_alert(to_email=user.email, name=user.name, user_settings=user_settings)

    return {"status": "success", "message": "Your password has been successfully updated."}
