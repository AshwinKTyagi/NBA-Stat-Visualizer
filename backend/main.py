import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
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
    allow_origins=["http://localhost:5173"],
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
