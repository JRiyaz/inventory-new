import time

from fastapi import HTTPException, status
from starlette.requests import HTTPConnection

from ..config import settings


class InMemoryRateLimiter:
    """
    A premium, high-performance in-memory sliding window rate limiter.
    Completely thread-safe and lightweight (requires no Redis/external state).
    Highly configurable and reusable across all microservices.
    """

    def __init__(
        self, requests: int | None = None, window_seconds: int | None = None, enabled: bool | None = None
    ) -> None:
        self.requests = requests if requests is not None else settings.RATE_LIMIT_REQUESTS
        self.window_seconds = window_seconds if window_seconds is not None else settings.RATE_LIMIT_WINDOW_SECONDS
        self.enabled = enabled if enabled is not None else settings.RATE_LIMIT_ENABLED

        self.history: dict[str, list[float]] = {}

    async def __call__(self, request: HTTPConnection) -> None:
        if not self.enabled:
            return

        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()

        if client_ip not in self.history:
            self.history[client_ip] = []

        timestamps = self.history[client_ip]

        cutoff = current_time - self.window_seconds
        while timestamps and timestamps[0] < cutoff:
            timestamps.pop(0)

        if len(timestamps) >= self.requests:
            retry_after = int(self.window_seconds - (current_time - timestamps[0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Please try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )

        timestamps.append(current_time)


# Initialize standard global rate limiter dependency
rate_limiter = InMemoryRateLimiter()
