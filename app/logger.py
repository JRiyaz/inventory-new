import logging
import sys


class TraceFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        if not hasattr(record, "correlation_id"):
            record.correlation_id = "GLOBAL"
        return super().format(record)


handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(TraceFormatter("%(asctime)s [%(levelname)s] [CID: %(correlation_id)s] %(name)s - %(message)s"))

logging.basicConfig(level=logging.INFO, handlers=[handler])
logger = logging.getLogger("api-monolith")
