import time
import uuid

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from .logger import logger


async def iterate_in_chunks(body):
    for chunk in body:
        yield chunk


class CorrelationIdAndProfilingMiddleware(BaseHTTPMiddleware):
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        await super().__call__(scope, receive, send)

    async def dispatch(self, request: Request, call_next):
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


class OwaspAuthCookiesMiddleware(BaseHTTPMiddleware):
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        await super().__call__(scope, receive, send)

    async def dispatch(self, request: Request, call_next):
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
        if request.url.path in (
            "/api/auth/login",
            "/api/auth/login/2fa",
            "/api/auth/register",
        ) and response.status_code in (200, 201):
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

                    import secrets

                    csrf_token = secrets.token_hex(32)

                    new_response = Response(content=clean_content, status_code=response.status_code, headers=headers)
                    new_response.set_cookie(
                        key="session_token", value=token, httponly=True, samesite="strict", path="/"
                    )
                    new_response.set_cookie(key="csrftoken", value=csrf_token, httponly=False, samesite="lax", path="/")
                    return new_response
            except Exception as e:
                logger.error(f"Failed to extract login cookie in monolith middleware: {e}")

        return response


class CsrfDoubleSubmitMiddleware(BaseHTTPMiddleware):
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        await super().__call__(scope, receive, send)

    async def dispatch(self, request: Request, call_next):
        # Only validate API requests that are state-modifying (POST, PUT, DELETE, PATCH)
        if request.url.path.startswith("/api") and request.method in ("POST", "PUT", "DELETE", "PATCH"):
            # Skip if it is a login or register endpoint
            if request.url.path not in ("/api/auth/login", "/api/auth/login/2fa", "/api/auth/register"):
                # Check if session cookie is present
                session_token = request.cookies.get("session_token")
                if session_token:
                    # Enforce CSRF validation
                    csrf_cookie = request.cookies.get("csrftoken")
                    csrf_header = request.headers.get("x-csrf-token") or request.headers.get("x-xsrf-token")

                    if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
                        logger.warning(
                            f"CSRF validation failed: cookie={csrf_cookie}, header={csrf_header}",
                            extra={"correlation_id": getattr(request.state, "correlation_id", "GLOBAL")},
                        )
                        return JSONResponse(
                            status_code=403, content={"detail": "CSRF token validation failed or missing"}
                        )

        return await call_next(request)
