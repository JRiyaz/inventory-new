from sqlmodel.ext.asyncio.session import AsyncSession

from ..models.domain import AuditLog


async def create_audit_entry(
    db: AsyncSession,
    action: str,
    resource: str,
    details: str,
    user_id: int | None = None,
    username: str | None = None,
    ip_address: str | None = None,
    correlation_id: str | None = None,
) -> None:
    """
    Creates an asynchronous AuditLog entry in the database.
    Highly reusable helper for all microservice boundaries.
    """
    audit = AuditLog(
        user_id=user_id,
        username=username,
        action=action,
        resource=resource,
        details=details,
        ip_address=ip_address,
        correlation_id=correlation_id,
    )
    db.add(audit)
    await db.commit()
