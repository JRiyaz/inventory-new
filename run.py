import uvicorn

from app import app, config

__all__ = ["app"]

# # Dynamically add the app/ directory to sys.path so modules resolve correctly on boot
# APP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "app"))
# if APP_DIR not in sys.path:
#     sys.path.insert(0, APP_DIR)


def main():
    """
    Consolidated Monolith Backend Server Launcher.
    Runs on Port 3000.
    """
    conf = config.settings
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=conf.PORT if conf.PORT else 3000,
        reload=True if conf.ENVIRONMENT == "development" else False,
    )


if __name__ == "__main__":
    main()
