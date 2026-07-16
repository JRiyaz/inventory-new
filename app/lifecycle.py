import time
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI

from .logger import logger

router = APIRouter()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing unified Monolith database schemas...")
    try:
        # Import the global init_db or we just call init_user_db, but prevent dropping tables 3 times.
        # Since all models share SQLModel.metadata, calling init_db once will create all tables.
        # However, we'll just call the user init_db because it seeds the user data.
        # First, ensure that models are all imported (routers do this).
        from .user.database import init_db as init_user_db

        # We only need to call one init_db since metadata is shared and will create tables for all routers imported.
        await init_user_db()
        logger.info("All Monolith SQLModel database tables successfully seeded and configured.")
    except Exception as e:
        logger.error(f"Error during monolith database setup: {e}")
        raise e
    yield
    logger.info("Shutting down Monolith backend gracefully.")


@router.get("/health", tags=["Health Aggregated"])
async def health():
    return {
        "status": "healthy",
        "service": "monolith-backend",
        "timestamp": time.time(),
        "environment": "development",
        "port": 3000,
    }
