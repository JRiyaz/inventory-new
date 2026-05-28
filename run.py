import uvicorn

from app import config


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
