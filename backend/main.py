import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

# Patch nba_api to use Chrome TLS fingerprint via curl_cffi.
# NBA.com (Akamai) silently drops requests from Python's default TLS stack.
import nba_api.library.http as _nba_http
from curl_cffi import requests as _cffi_requests

class _ChromeSession:
    @staticmethod
    def get(*args, **kwargs):
        kwargs.setdefault("impersonate", "chrome120")
        kwargs.setdefault("timeout", 60)
        return _cffi_requests.get(*args, **kwargs)

_nba_http.requests = _ChromeSession()

from config import CORS_ORIGIN, CORS_ORIGIN_REGEX
from routers import teams, players, matchups

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("nba")

app = FastAPI(title="NBA Stat Visualizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN],
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    logger.info("→ %s %s", request.method, request.url.path)
    response = await call_next(request)
    elapsed = (time.perf_counter() - start) * 1000
    logger.info("← %s %s  %dms", response.status_code, request.url.path, elapsed)
    return response


app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(matchups.router, prefix="/api/matchups", tags=["matchups"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
