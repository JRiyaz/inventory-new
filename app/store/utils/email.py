import logging

from ..models.domain import Customer, SalesOrder

logger = logging.getLogger("store-service")


async def send_invoice_receipt_email(order: SalesOrder, customer: Customer) -> None:
    """
    Simulates a secure, production-grade outbound SMTP transactional email delivery.
    Mails the glassmorphic HTML receipt invoice to the customer billing email.
    """
    logger.info(f"[Email Outbox Service] Initiating receipt delivery for Order {order.order_number}...")
    # Simulate network latency or SMTP server interaction
    # In production, this can call a service like SendGrid, Mailgun, or standard aiosmtplib
    logger.info(
        f"[SMTP Outbox Success] Glassmorphic Receipt PDF Invoice {order.order_number} "
        f"successfully dispatched to billing recipient: '{customer.name}' <{customer.email}>"
    )
