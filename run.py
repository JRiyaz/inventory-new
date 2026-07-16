import uvicorn

from app import config


def main():
    """
    Consolidated Monolith Backend Server Launcher.
    Runs on Port 3000 (required by the frontend development environment).
    """
    conf = config.settings
    port = conf.PORT if conf.PORT else 3000

    if conf.ENVIRONMENT == "development":
        print("\n" + "="*80)
        print(f" TIP: The Angular frontend is configured to call API on Port 3000.")
        print(f"      Running backend on Port {port}. Always use 'uv run run.py' to keep")
        print(f"      this port aligned and avoid connection/login issues.")
        print("="*80 + "\n")

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=True if conf.ENVIRONMENT == "development" else False,
    )


if __name__ == "__main__":
    main()


# uv run run.py
# uv run uvicorn app:app
