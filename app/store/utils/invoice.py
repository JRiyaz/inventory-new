from ..models.domain import Customer, SalesOrder, SalesOrderItem


async def generate_invoice_html(order: SalesOrder, items: list[SalesOrderItem], customer: Customer) -> str:
    """
    Asynchronously generates a premium, visually stunning, theme-aware HTML invoice receipt.
    Uses glassmorphic styling, elegant typography, and absolute clean layout.
    """

    # Formatting helper for currency
    def fmt_currency(val: float) -> str:
        return f"${val:,.2f}"

    # Build invoice table rows
    item_rows_html = ""
    for idx, item in enumerate(items, 1):
        total = item.quantity * item.unit_price
        item_rows_html += f"""
        <tr class="item-row">
            <td>{idx}</td>
            <td><strong>{item.sku}</strong> - {item.name}</td>
            <td class="text-right">{fmt_currency(item.unit_price)}</td>
            <td class="text-center">{item.quantity}</td>
            <td class="text-right font-medium">{fmt_currency(total)}</td>
        </tr>
        """

    # Modern CSS styled template matching glassmorphic pure aesthetics
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Receipt Invoice: {order.order_number}</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
            :root {{
                --bg-glass: rgba(255, 255, 255, 0.45);
                --border-glass: rgba(255, 255, 255, 0.3);
                --text-primary: #1e293b;
                --text-secondary: #64748b;
                --accent-color: #10b981; /* Emerald theme matching UI-Shared */
            }}
            * {{
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }}
            body {{
                font-family: 'Plus Jakarta Sans', sans-serif;
                color: var(--text-primary);
                background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                padding: 40px 20px;
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
            }}
            .invoice-card {{
                background: var(--bg-glass);
                backdrop-filter: blur(32px);
                -webkit-backdrop-filter: blur(32px);
                border: 1px solid var(--border-glass);
                border-radius: 24px;
                padding: 48px;
                width: 100%;
                max-width: 800px;
                box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
            }}
            .invoice-header {{
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 40px;
                border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                padding-bottom: 30px;
            }}
            .brand-name {{
                font-size: 28px;
                font-weight: 700;
                color: var(--accent-color);
                letter-spacing: -0.5px;
            }}
            .invoice-title {{
                text-align: right;
            }}
            .invoice-title h1 {{
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 4px;
            }}
            .invoice-title span {{
                font-size: 14px;
                color: var(--text-secondary);
            }}
            .meta-section {{
                display: flex;
                justify-content: space-between;
                margin-bottom: 40px;
                gap: 20px;
            }}
            .meta-block h3 {{
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--text-secondary);
                margin-bottom: 8px;
            }}
            .meta-block p {{
                font-size: 15px;
                line-height: 1.5;
            }}
            .invoice-table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 40px;
            }}
            .invoice-table th {{
                text-align: left;
                padding: 12px 16px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: var(--text-secondary);
                border-bottom: 2px solid rgba(0, 0, 0, 0.05);
            }}
            .invoice-table td {{
                padding: 16px;
                font-size: 15px;
                border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                vertical-align: middle;
            }}
            .text-right {{ text-align: right !important; }}
            .text-center {{ text-align: center !important; }}
            .font-medium {{ font-weight: 500; }}
            .invoice-summary {{
                display: flex;
                justify-content: flex-end;
            }}
            .summary-card {{
                width: 100%;
                max-width: 320px;
            }}
            .summary-row {{
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                font-size: 15px;
            }}
            .summary-row.total {{
                border-top: 2px solid rgba(0, 0, 0, 0.05);
                padding-top: 16px;
                margin-top: 8px;
                font-size: 20px;
                font-weight: 700;
                color: var(--accent-color);
            }}
            .footer {{
                text-align: center;
                font-size: 13px;
                color: var(--text-secondary);
                margin-top: 40px;
                border-top: 1px solid rgba(0, 0, 0, 0.05);
                padding-top: 20px;
            }}
            @media print {{
                body {{
                    background: none;
                    padding: 0;
                }}
                .invoice-card {{
                    box-shadow: none;
                    border: none;
                    background: none;
                    padding: 0;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="invoice-card">
            <div class="invoice-header">
                <div>
                    <div class="brand-name">STOREFRONT</div>
                    <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Premium Micro-Store API</p>
                </div>
                <div class="invoice-title">
                    <h1>INVOICE</h1>
                    <span>Invoice #: <strong>{order.order_number}</strong></span>
                </div>
            </div>

            <div class="meta-section">
                <div class="meta-block">
                    <h3>Billed To:</h3>
                    <p><strong>{customer.name}</strong></p>
                    {f"<p>{customer.company}</p>" if customer.company else ""}
                    {f"<p>{customer.address}</p>" if customer.address else ""}
                    {f"<p>{customer.email}</p>" if customer.email else ""}
                </div>
                <div class="meta-block" style="text-align: right;">
                    <h3>Invoice Date:</h3>
                    <p>{order.created_at.strftime("%B %d, %Y")}</p>
                    <h3 style="margin-top: 16px;">Status:</h3>
                    <p><span style="color: var(--accent-color); font-weight: 600;">{order.status.upper()}</span></p>
                </div>
            </div>

            <table class="invoice-table">
                <thead>
                    <tr>
                        <th style="width: 50px;">#</th>
                        <th>Item Details</th>
                        <th class="text-right" style="width: 120px;">Unit Price</th>
                        <th class="text-center" style="width: 80px;">Qty</th>
                        <th class="text-right" style="width: 140px;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {item_rows_html}
                </tbody>
            </table>

            <div class="invoice-summary">
                <div class="summary-card">
                    <div class="summary-row">
                        <span style="color: var(--text-secondary);">Subtotal:</span>
                        <span class="font-medium">{fmt_currency(order.total_amount)}</span>
                    </div>
                    <div class="summary-row">
                        <span style="color: var(--text-secondary);">Tax (0%):</span>
                        <span class="font-medium">$0.00</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total Due:</span>
                        <span>{fmt_currency(order.total_amount)}</span>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p>Thank you for choosing our storefront services!</p>
                <p style="margin-top: 4px; font-size: 11px;">If you have any questions, please contact support at support@storefront.local</p>
            </div>
        </div>
    </body>
    </html>
    """
    return html_content
