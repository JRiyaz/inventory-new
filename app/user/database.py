from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from .config import settings

# Create highly optimized asynchronous SQLite engine with session pooling
engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True, connect_args={"check_same_thread": False})

# Configure async session factory
async_session_maker = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False, autocommit=False, autoflush=False
)


async def seed_data(session: AsyncSession) -> None:
    from sqlmodel import select
    from user.models.domain import User, UserPermission, UserSettings
    from user.utils.security import hash_password

    # 1. Seed Access Control CRUD Permissions
    permissions = [
        UserPermission(role="Admin", can_read=True, can_write=True, can_update=True, can_delete=True),
        UserPermission(role="Agent", can_read=True, can_write=True, can_update=True, can_delete=False),
        UserPermission(role="Customer", can_read=True, can_write=False, can_update=False, can_delete=False),
    ]
    for perm in permissions:
        res = await session.execute(select(UserPermission).where(UserPermission.role == perm.role))
        if not res.scalar_one_or_none():
            session.add(perm)

    # 2. Seed Admin User (Full Access Rights)
    admin_res = await session.execute(select(User).where(User.username == "admin"))
    if not admin_res.scalar_one_or_none():
        admin_user = User(
            username="admin",
            email="admin@company.com",
            password_hash=hash_password("adminpassword"),
            name="Super Admin",
            company="System Corp",
            role="Admin",
            status="Active",
            avatar_url="https://ui-avatars.com/api/?name=Super+Admin&background=3b429f&color=fff&size=80",
        )
        session.add(admin_user)
        await session.flush()

        # Seed default settings for admin
        admin_settings = UserSettings(
            user_id=admin_user.id,
            theme="void-blue",
            loader_animation="bloom",
            animation_tempo=800,
            display_images=True,
            dnd=False,
            urgent_persistence=False,
            notification_duration=4000,
            notification_placement="top-right",
        )
        session.add(admin_settings)

    # 3. Seed Viewer User (Minimal Access Rights)
    viewer_res = await session.execute(select(User).where(User.username == "viewer"))
    if not viewer_res.scalar_one_or_none():
        viewer_user = User(
            username="viewer",
            email="viewer@company.com",
            password_hash=hash_password("viewerpassword"),
            name="Guest Viewer",
            company="Viewer Inc",
            role="Customer",
            status="Active",
            avatar_url="https://ui-avatars.com/api/?name=Guest+Viewer&background=e11d48&color=fff&size=80",
        )
        session.add(viewer_user)
        await session.flush()

        # Seed default settings for viewer
        viewer_settings = UserSettings(
            user_id=viewer_user.id,
            theme="glass",
            loader_animation="pulse",
            animation_tempo=400,
            display_images=True,
            dnd=True,
            urgent_persistence=False,
            notification_duration=2000,
            notification_placement="top-left",
        )
        session.add(viewer_settings)

    await session.commit()


async def init_db() -> None:
    """
    Asynchronously initializes database schemas.
    Configurable to either overwrite (drop and recreate), create if not exists, or skip.
    """
    if settings.DB_OVERWRITE_TABLES:
        async with engine.begin() as conn:
            # Drop all existing tables and rebuild schema fresh
            await conn.run_sync(SQLModel.metadata.drop_all)
            await conn.run_sync(SQLModel.metadata.create_all)
    elif settings.DB_CREATE_TABLES:
        async with engine.begin() as conn:
            # Safely create tables if they do not exist
            await conn.run_sync(SQLModel.metadata.create_all)

    # Proactively seed default system data
    async with async_session_maker() as session:
        await seed_data(session)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
