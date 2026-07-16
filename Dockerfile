# Stage 1: Build Angular frontend
FROM node:22-alpine AS frontend

# Set working directory
WORKDIR /ui

# Install pnpm
RUN npm install -g pnpm@11.1.2

# Copy dependency files first for better caching
COPY ui/package.json ui/pnpm-workspace.yaml ui/pnpm-lock.yaml ./

# Install dependencies
# Angular build requires devDependencies
RUN pnpm install --frozen-lockfile

# Copy frontend source files
COPY ui/web ./web
COPY ui/public ./public

# Copy Angular/TypeScript config files
COPY ui/tsconfig.json ui/tsconfig.app.json ui/tsconfig.spec.json ui/angular.json ui/.postcssrc.json ./

# Build frontend
RUN pnpm run build

# -----------------------------
# Stage 2: Build Python backend
# -----------------------------
# Use same Python version, otherwise it will break compiled wheels
FROM python:3.14.5-alpine AS backend

# Python settings
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install uv
RUN pip install --no-cache-dir uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install production dependencies only
RUN uv sync --locked --no-dev

# Copy backend source code
COPY app ./app

# Compile Python files
RUN python -m compileall -b app

# Optional: remove .py files
RUN find app -name "*.py" -type f -delete

# -----------------------------
# Stage 3: Final runtime image
# -----------------------------
FROM python:3.14.5-alpine AS runner

# Python settings
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Set working directory
WORKDIR /app

# Copy built frontend files
COPY --from=frontend /ui/dist/inventory/browser ./ui/dist/inventory/browser

# Copy Python virtual environment
COPY --from=backend /app/.venv /app/.venv

# Copy backend application
COPY --from=backend /app/app ./app

# Copy startup script
COPY run.py ./

# Add virtual environment to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Expose application port
EXPOSE 3000

# Start FastAPI app
CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "3000"]
