import os

from fastapi import APIRouter

from .logger import logger

router = APIRouter()

DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ui", "dist", "inventory", "browser"))

if os.path.exists(DIST_DIR):
    logger.info(f"Mounting SPA static folder from {DIST_DIR}")
    router.frontend("/", directory=DIST_DIR, fallback="index.html")
else:
    logger.warning(f"Frontend dist folder not found at {DIST_DIR}. Frontend static hosting will not be active.")
