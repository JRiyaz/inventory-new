from .po import router as po_router
from .products import router as products_router
from .stock import router as stock_router
from .suppliers import router as suppliers_router
from .warehouses import router as warehouses_router

__all__ = ["products_router", "warehouses_router", "stock_router", "suppliers_router", "po_router"]
