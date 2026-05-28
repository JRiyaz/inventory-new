import re
from typing import Annotated

from pydantic import BeforeValidator


def sanitize_string(value: str) -> str:
    """
    Globally sanitizes input text strings to prevent HTML Injection and XSS payloads.
    Strips out script blocks and removes all HTML brackets.
    """
    if not isinstance(value, str):
        return value
    # Strip out complete <script> blocks
    clean = re.sub(r"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>", "", value, flags=re.IGNORECASE)
    # Remove remaining HTML elements/tags
    clean = re.sub(r"<[^>]*>", "", clean)
    return clean.strip()


# Modern Pydantic v2 Type Annotated before validator for automatic data sanitization
SanitizedStr = Annotated[str, BeforeValidator(lambda v: sanitize_string(v) if isinstance(v, str) else v)]
