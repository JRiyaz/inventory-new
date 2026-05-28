from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_db
from ..models.domain import AuditLog, User, UserPermission, UserSettings
from ..schemas.user import UserResponse, UserRoleUpdate, UserSettingsResponse, UserSettingsUpdate
from ..utils.audit import create_audit_entry
from ..utils.dependencies import RoleChecker, get_current_user

router = APIRouter(prefix="/user", tags=["User Profiles"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the currently authenticated user's profile details.
    """
    return current_user


@router.get("/list", response_model=list[UserResponse])
async def list_users(
    page: int = 1,
    limit: int = 10,
    current_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """
    Lists users in the system (Admin only, paginated).
    """
    offset = (page - 1) * limit
    result = await db.execute(select(User).offset(offset).limit(limit))
    return result.scalars().all()


@router.put("/role/{user_id}", response_model=UserResponse)
async def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    request: Request,
    current_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """
    Reassigns a user role (Admin only).
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not located")

    old_role = user.role
    user.role = payload.role
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Log modern asynchronous audit event
    correlation_id = request.headers.get("x-correlation-id")
    await create_audit_entry(
        db=db,
        action="UPDATE_ROLE",
        resource="Users",
        details=f"Modified role for user {user.username} from {old_role} to {payload.role}",
        user_id=current_user.id,
        username=current_user.username,
        ip_address=request.client.host if request.client else None,
        correlation_id=correlation_id,
    )
    return user


@router.put("/suspend/{user_id}", response_model=UserResponse)
async def toggle_suspend_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """
    Suspends or activates a user profile (Admin only).
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not located")

    # Prevent self-suspension
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Self-suspension is denied")

    old_status = user.status
    new_status = "Suspended" if old_status == "Active" else "Active"
    user.status = new_status
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Log audit event
    correlation_id = request.headers.get("x-correlation-id")
    await create_audit_entry(
        db=db,
        action="TOGGLE_SUSPEND",
        resource="Users",
        details=f"Changed status for {user.username} from {old_status} to {new_status}",
        user_id=current_user.id,
        username=current_user.username,
        ip_address=request.client.host if request.client else None,
        correlation_id=correlation_id,
    )
    return user


@router.get("/audit", response_model=list[dict])
async def get_audit_logs(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(RoleChecker(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetches raw audit logs (Admin only, paginated).
    """
    offset = (page - 1) * limit
    result = await db.execute(select(AuditLog).order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit))
    logs = result.scalars().all()
    return [
        {
            "id": i.id,
            "action": i.action,
            "resource": i.resource,
            "details": i.details,
            "username": i.username,
            "timestamp": i.timestamp,
        }
        for i in logs
    ]


@router.get("/settings", response_model=UserSettingsResponse)
async def get_user_settings(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Returns the currently authenticated user's settings profile.
    """
    res = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    settings = res.scalar_one_or_none()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


@router.put("/settings", response_model=UserSettingsResponse)
async def update_user_settings(
    payload: UserSettingsUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """
    Saves/updates the user's settings in the database.
    """
    res = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    settings = res.scalar_one_or_none()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
        await db.flush()

    data = payload.model_dump(exclude_unset=True)
    for key, val in data.items():
        setattr(settings, key, val)

    db.add(settings)
    await db.commit()
    await db.refresh(settings)
    return settings


@router.get("/permissions", response_model=list[dict])
async def get_all_permissions(current_user: User = Depends(RoleChecker(["Admin"])), db: AsyncSession = Depends(get_db)):
    """
    Gets permissions mapping for all system roles.
    """
    res = await db.execute(select(UserPermission))
    return [
        {
            "role": p.role,
            "can_read": p.can_read,
            "can_write": p.can_write,
            "can_update": p.can_update,
            "can_delete": p.can_delete,
        }
        for p in res.scalars().all()
    ]


@router.put("/permissions/{role}")
async def update_role_permissions(
    role: str, payload: dict, current_user: User = Depends(RoleChecker(["Admin"])), db: AsyncSession = Depends(get_db)
):
    """
    Updates permission mapping for a specific role.
    """
    res = await db.execute(select(UserPermission).where(UserPermission.role == role))
    perm = res.scalar_one_or_none()
    if not perm:
        perm = UserPermission(role=role)
        db.add(perm)

    perm.can_read = payload.get("can_read", perm.can_read)
    perm.can_write = payload.get("can_write", perm.can_write)
    perm.can_update = payload.get("can_update", perm.can_update)
    perm.can_delete = payload.get("can_delete", perm.can_delete)

    db.add(perm)
    await db.commit()
    return {"status": "success", "role": role}
