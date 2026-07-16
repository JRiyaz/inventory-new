from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .middleware import (
    CorrelationIdAndProfilingMiddleware,
    CsrfDoubleSubmitMiddleware,
    OwaspAuthCookiesMiddleware,
)
from .logger import logger
from .lifecycle import lifespan, router as lifecycle_router

from .inventory.routers import po_router, products_router, stock_router, suppliers_router, warehouses_router
from .store.routers import customers_router, offers_router, orders_router, payments_router
from .user.routers import auth_router, chat_router, user_router
from .ui import router as ui_router
from .user.utils.rate_limiter import rate_limiter


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


app.add_middleware(CorrelationIdAndProfilingMiddleware)
app.add_middleware(OwaspAuthCookiesMiddleware)
app.add_middleware(CsrfDoubleSubmitMiddleware)


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
app.include_router(offers_router, prefix="/api")
app.include_router(lifecycle_router)
app.include_router(ui_router)
