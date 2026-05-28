import logging
import os
import sys
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .inventory.routers import po_router, products_router, stock_router, suppliers_router, warehouses_router
from .store.routers import customers_router, orders_router, payments_router
from .user.routers import auth_router, chat_router, user_router
from .user.utils.rate_limiter import rate_limiter


# Custom logger setup
class TraceFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        if not hasattr(record, "correlation_id"):
            record.correlation_id = "GLOBAL"
        return super().format(record)


handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(TraceFormatter("%(asctime)s [%(levelname)s] [CID: %(correlation_id)s] %(name)s - %(message)s"))

logging.basicConfig(level=logging.INFO, handlers=[handler])
logger = logging.getLogger("api-monolith")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing unified Monolith database schemas...")
    try:
        # Import the global init_db or we just call init_user_db, but prevent dropping tables 3 times.
        # Since all models share SQLModel.metadata, calling init_db once will create all tables.
        # However, we'll just call the user init_db because it seeds the user data.
        # First, ensure that models are all imported (routers do this).
        from user.database import init_db as init_user_db

        # We only need to call one init_db since metadata is shared and will create tables for all routers imported.
        await init_user_db()
        logger.info("All Monolith SQLModel database tables successfully seeded and configured.")
    except Exception as e:
        logger.error(f"Error during monolith database setup: {e}")
        raise e
    yield
    logger.info("Shutting down Monolith backend gracefully.")


# Initialize single monolithic FastAPI app
app = FastAPI(
    title="Monolithic Inventory & Management API",
    description="Unified API combining User/Auth, Catalog/Inventory, and Checkout/Storefront services.",
    version="1.0.0",
    lifespan=lifespan,
    dependencies=[Depends(rate_limiter)],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000", "http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request trace & correlation profiling middleware
@app.middleware("http")
async def correlation_id_and_profiling_middleware(request: Request, call_next):
    # Skip profiling for static file serving to avoid spamming logs
    path = request.url.path
    if path.startswith("/static") or (not path.startswith("/api") and path != "/health" and "." in path):
        return await call_next(request)

    correlation_id = request.headers.get("x-correlation-id") or str(uuid.uuid4())
    request.state.correlation_id = correlation_id
    start_time = time.perf_counter()

    try:
        response: Response = await call_next(request)
    except Exception as e:
        logger.error(
            f"Unhandled server exception during request {request.method} {path}: {e}",
            extra={"correlation_id": correlation_id},
        )
        raise e

    process_time = (time.perf_counter() - start_time) * 1000
    logger.info(
        f"{request.method} {path} responded {response.status_code} in {process_time:.2f}ms",
        extra={"correlation_id": correlation_id},
    )

    response.headers["x-correlation-id"] = correlation_id
    return response


# Intercept and cookies injection logic for secure HttpOnly cookie auth!
@app.middleware("http")
async def owasp_auth_cookies_middleware(request: Request, call_next):
    # If request is an API request, check if session_token cookie is present and inject as Auth header!
    if request.url.path.startswith("/api"):
        session_token = request.cookies.get("session_token")
        if session_token:
            # Inject Bearer token downstream
            headers = dict(request.scope["headers"])
            headers[b"authorization"] = f"Bearer {session_token}".encode("latin-1")
            request.scope["headers"] = list(headers.items())

    response: Response = await call_next(request)

    # Intercept login/register response and inject as secure HttpOnly cookie
    if request.url.path in ("/api/auth/login", "/api/auth/register") and response.status_code in (200, 201):
        try:
            # We must buffer the response body to extract token
            import json

            body = [section async for section in response.body_iterator]
            response.body_iterator = iterate_in_chunks(body)
            full_body = b"".join(body).decode("utf-8")
            payload = json.loads(full_body)

            token = payload.get("access_token")
            if token:
                clean_payload = {k: v for k, v in payload.items() if k != "access_token"}
                clean_content = json.dumps(clean_payload).encode("utf-8")

                # Create a fresh response with modified body and secure HttpOnly cookie
                headers = dict(response.headers)
                headers.pop("content-length", None)
                headers.pop("Content-Length", None)

                new_response = Response(content=clean_content, status_code=response.status_code, headers=headers)
                new_response.set_cookie(key="session_token", value=token, httponly=True, samesite="strict", path="/")
                return new_response
        except Exception as e:
            logger.error(f"Failed to extract login cookie in monolith middleware: {e}")

    return response


async def iterate_in_chunks(body):
    for chunk in body:
        yield chunk


# Mount API routers (Unified under Port 3000 flat /api namespaces)
app.include_router(auth_router, prefix="/api")
app.include_router(user_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(warehouses_router, prefix="/api")
app.include_router(stock_router, prefix="/api")
app.include_router(suppliers_router, prefix="/api")
app.include_router(po_router, prefix="/api")
app.include_router(customers_router, prefix="/api")
app.include_router(orders_router, prefix="/api")
app.include_router(payments_router, prefix="/api")


@app.get("/health", tags=["Health Aggregated"])
async def health():
    return {
        "status": "healthy",
        "service": "monolith-backend",
        "timestamp": time.time(),
        "environment": "development",
        "port": 3000,
    }


# SPA Static Files Hosting setup

# Dynamically add the current directory to sys.path so modules resolve correctly
CURRENT_DIR = os.path.abspath(os.path.dirname(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)
DIST_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "dist", "inventory", "browser"))

if os.path.exists(DIST_DIR):
    logger.info(f"Mounting SPA static folder from {DIST_DIR}")
    app.mount("/static", StaticFiles(directory=DIST_DIR), name="static")

    @app.get("/{catchall:path}")
    async def serve_spa(catchall: str):
        if catchall.startswith("api/") or catchall == "health":
            raise HTTPException(status_code=404, detail="API endpoint not found")

        # Check if the requested file exists in the build dir
        file_path = os.path.join(DIST_DIR, catchall)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)

        return FileResponse(os.path.join(DIST_DIR, "index.html"))
else:
    logger.warning(f"Frontend dist folder not found at {DIST_DIR}. Frontend static hosting will not be active.")
