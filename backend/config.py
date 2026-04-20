import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

CURRENT_SEASON: str = os.getenv("CURRENT_SEASON", "2024-25")
CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "http://localhost:5173")
