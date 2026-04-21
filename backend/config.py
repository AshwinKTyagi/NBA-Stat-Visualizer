import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

CURRENT_SEASON: str = os.getenv("CURRENT_SEASON", "2024-25")
CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "http://localhost:5173")

# Allow any localhost port in development
import re as _re
CORS_ORIGIN_REGEX: str | None = (
    r"http://localhost:\d+"
    if _re.match(r"http://localhost:\d+", CORS_ORIGIN)
    else None
)
