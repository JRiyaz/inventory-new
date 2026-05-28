import httpx
from fastapi import HTTPException, status

from ..config import settings
from .ssrf import is_url_safe


async def deduct_inventory_stock(product_id: int, quantity: int, order_number: str, token: str) -> bool:
    """
    Asynchronously calls the remote Inventory Service to verify stock and deduct items.
    Protects against SSRF strictly by validating hostnames and IPs before making the request.
    """
    endpoint = f"{settings.INVENTORY_SERVICE_URL}/api/stock/adjust"

    # 1. SSRF Guard Check
    if not is_url_safe(endpoint):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Security error: Outbound request failed SSRF safety checks.",
        )

    # 2. Make outbound inter-service request
    payload = {
        "product_id": product_id,
        "warehouse_id": 1,  # Assuming default/primary warehouse facility
        "quantity_changed": -quantity,  # Subtract quantity
        "type": "OUTGOING",
        "reference": order_number,
        "details": f"Store Checkout Purchase: Order {order_number}",
    }

    # Pass the authenticated user's JWT token along for authorization mapping!
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(endpoint, json=payload, headers=headers, timeout=5.0)
            if response.status_code == status.HTTP_200_OK:
                return True
            elif response.status_code == status.HTTP_400_BAD_REQUEST:
                detail = response.json().get("detail", "Insufficient stock levels in warehouse")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail=f"Inventory checkout failure: {detail}"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Inventory Service returned an unexpected response status.",
                )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Could not connect to Inventory Service: {exc}"
            )
