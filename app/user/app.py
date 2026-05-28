import logging
import sys
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routers.auth import router as auth_router
from .routers.chat import router as chat_router
from .routers.user import router as user_router
from .utils.rate_limiter import rate_limiter


# Custom robust formatter that dynamically supplies "GLOBAL" if correlation_id is not injected
class TraceFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        if not hasattr(record, "correlation_id"):
            record.correlation_id = "GLOBAL"
        return super().format(record)


# Create console stdout stream handler using the premium trace formatter
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(TraceFormatter("%(asctime)s [%(levelname)s] [CID: %(correlation_id)s] %(name)s - %(message)s"))

# Initialize global logging configuration
logging.basicConfig(level=logging.INFO, handlers=[handler])
logger = logging.getLogger("user-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Modern lifespan context manager handling asynchronous database engine bootstrapping
    and graceful resource teardowns on shutdown.
    """
    logger.info("Initializing User Service micro-backend...")
    try:
        await init_db()
        logger.info("Asynchronous SQLite database schemas initialized successfully.")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}", extra={"correlation_id": "STARTUP"})
        raise e
    yield
    logger.info("Shutting down User Service micro-backend gracefully.")


# Initialize premium, feature-rich FastAPI application
app = FastAPI(
    title="User & Authentication Microservice",
    description="De-coupled Authentication, Authorization, Audit Logs, and WebSocket Support Chat service.",
    version="1.0.0",
    lifespan=lifespan,
    dependencies=[Depends(rate_limiter)],
)

# CORS configurations for cross-origin Angular MFE integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual micro-frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom correlation ID and request profiling middleware
@app.middleware("http")
async def correlation_id_and_profiling_middleware(request: Request, call_next):
    # Extract existing correlation header or generate a fresh trace ID
    correlation_id = request.headers.get("x-correlation-id") or str(uuid.uuid4())

    # Store correlation ID in request state for downstream handlers
    request.state.correlation_id = correlation_id

    # Set log context variables
    start_time = time.perf_counter()

    # Execute route handler chain with correlation trace active
    try:
        response: Response = await call_next(request)
    except Exception as e:
        logger.error(
            f"Unhandled server exception during request {request.method} {request.url.path}: {e}",
            extra={"correlation_id": correlation_id},
        )
        raise e

    process_time = (time.perf_counter() - start_time) * 1000

    # Log HTTP status and processing performance metrics
    logger.info(
        f"{request.method} {request.url.path} responded {response.status_code} in {process_time:.2f}ms",
        extra={"correlation_id": correlation_id},
    )

    # Inject tracing header back into HTTP client response
    response.headers["x-correlation-id"] = correlation_id
    return response


# Mount decoupled v1 business API routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(user_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")


@app.get("/health", tags=["Health & Diagnostics"])
async def health_check():
    """
    Diagnostic endpoint verifying microservice status.
    """
    return {"status": "healthy", "service": "user-service", "timestamp": time.time(), "environment": "development"}
