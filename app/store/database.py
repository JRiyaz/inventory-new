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


async def init_db() -> None:
    """
    Asynchronously initializes database schemas for Sales.
    Configurable to either overwrite (drop and recreate), create if not exists, or skip.
    """
    if settings.DB_OVERWRITE_TABLES:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.drop_all)
            await conn.run_sync(SQLModel.metadata.create_all)
    elif settings.DB_CREATE_TABLES:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
