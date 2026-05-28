import ipaddress
import socket
from urllib.parse import urlparse

from ..config import settings

type DomainAllowlist = list[str] | None


def is_url_safe(url: str, allowed_domains: DomainAllowlist = None) -> bool:
    """
    SSRF defense mechanism with configurable development override.
    Validates that the provided URL does not resolve to private, loopback,
    or cloud metadata service IP ranges, preventing Server-Side Request Forgery.
    """
    try:
        parsed_url = urlparse(url)
        if parsed_url.scheme not in ("http", "https"):
            return False

        hostname = parsed_url.hostname
        if not hostname:
            return False

        if allowed_domains is not None:
            if hostname not in allowed_domains:
                return False

        # In local development environment, we permit localhost inter-service calls
        if settings.ENVIRONMENT == "development" and hostname in ("localhost", "127.0.0.1", "::1"):
            return True

        addr_info = socket.getaddrinfo(hostname, parsed_url.port or (80 if parsed_url.scheme == "http" else 443))
        for res in addr_info:
            ip_str = res[4][0]
            ip = ipaddress.ip_address(ip_str)

            if (
                ip.is_loopback
                or ip.is_private
                or ip.is_link_local
                or ip.is_multicast
                or ip.is_reserved
                or ip.is_unspecified
            ):
                return False

        return True
    except Exception:
        return False
