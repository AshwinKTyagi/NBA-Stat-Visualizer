import logging
import time
from fastapi import APIRouter, HTTPException
from nba_api.stats.endpoints import leaguestandings, leaguedashteamstats
from nba_api.stats.static import teams as nba_teams_static
import pandas as pd

from config import CURRENT_SEASON

router = APIRouter()
logger = logging.getLogger("nba.teams")


@router.get("")
def get_all_teams():
    all_teams = nba_teams_static.get_teams()
    return [{"id": t["id"], "name": t["full_name"], "abbreviation": t["abbreviation"]} for t in all_teams]


@router.get("/playoff-picture")
def get_playoff_picture():
    logger.info("Fetching playoff standings from nba_api (season=%s)", CURRENT_SEASON)
    t0 = time.perf_counter()
    standings = leaguestandings.LeagueStandings(season=CURRENT_SEASON)
    logger.info("LeagueStandings fetched in %.0fms", (time.perf_counter() - t0) * 1000)
    df = standings.get_data_frames()[0]
    df = df[df["PlayoffRank"].notna() & (df["PlayoffRank"] != "")]
    df["PlayoffRank"] = pd.to_numeric(df["PlayoffRank"], errors="coerce")
    df = df[df["PlayoffRank"] <= 8].sort_values(["Conference", "PlayoffRank"])

    result = []
    for _, row in df.iterrows():
        result.append({
            "teamId": int(row["TeamID"]),
            "teamName": row["TeamName"],
            "abbreviation": row["TeamSlug"].upper() if "TeamSlug" in row else "",
            "conference": row["Conference"],
            "playoffRank": int(row["PlayoffRank"]),
            "wins": int(row["WINS"]),
            "losses": int(row["LOSSES"]),
            "winPct": float(row["WinPCT"]),
        })
    return result


@router.get("/standings")
def get_standings():
    logger.info("Fetching full standings from nba_api (season=%s)", CURRENT_SEASON)
    t0 = time.perf_counter()
    standings = leaguestandings.LeagueStandings(season=CURRENT_SEASON)
    logger.info("LeagueStandings fetched in %.0fms", (time.perf_counter() - t0) * 1000)
    df = standings.get_data_frames()[0]
    df["PlayoffRank"] = pd.to_numeric(df["PlayoffRank"], errors="coerce")
    df["ConferenceGamesBack"] = pd.to_numeric(df.get("ConferenceGamesBack", pd.Series(dtype=float)), errors="coerce")
    df = df.sort_values(["Conference", "PlayoffRank"])

    result = []
    for _, row in df.iterrows():
        playoff_rank = int(row["PlayoffRank"]) if pd.notna(row["PlayoffRank"]) else 99
        result.append({
            "teamId": int(row["TeamID"]),
            "teamName": row["TeamName"],
            "abbreviation": row["TeamSlug"].upper() if "TeamSlug" in row else "",
            "conference": row["Conference"],
            "conferenceRank": playoff_rank,
            "wins": int(row["WINS"]),
            "losses": int(row["LOSSES"]),
            "winPct": float(row["WinPCT"]),
            "homeRecord": str(row.get("HOME", "")),
            "awayRecord": str(row.get("ROAD", "")),
            "lastTen": str(row.get("L10", "")),
            "playoffRank": playoff_rank,
        })
    return result


@router.get("/{team_id}/stats")
def get_team_advanced_stats(team_id: int):
    logger.info("Fetching advanced stats for team_id=%d", team_id)
    try:
        t0 = time.perf_counter()
        dash = leaguedashteamstats.LeagueDashTeamStats(
            season=CURRENT_SEASON,
            measure_type_detailed_defense="Advanced",
            per_mode_detailed="PerGame",
        )
        df = dash.get_data_frames()[0]
        df = df.fillna(0)
        logger.info("LeagueDashTeamStats fetched in %.0fms", (time.perf_counter() - t0) * 1000)
        row = df[df["TEAM_ID"] == team_id]
        if row.empty:
            raise HTTPException(status_code=404, detail="Team not found")
        row = row.iloc[0]
        return {
            "teamId": team_id,
            "teamName": row["TEAM_NAME"],
            "offRating": round(float(row["OFF_RATING"]), 1),
            "defRating": round(float(row["DEF_RATING"]), 1),
            "netRating": round(float(row["NET_RATING"]), 1),
            "pace": round(float(row["PACE"]), 1),
            "trueShootingPct": round(float(row["TS_PCT"]) * 100, 1),
            "astPct": round(float(row["AST_PCT"]) * 100, 1),
            "rebPct": round(float(row["REB_PCT"]) * 100, 1),
            "tovPct": round(float(row.get("TM_TOV_PCT", 0)) * 100, 1),
            "efgPct": round(float(row.get("EFG_PCT", 0)) * 100, 1),
            "piePct": round(float(row["PIE"]) * 100, 1),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching stats for team_id=%d", team_id)
        raise HTTPException(status_code=500, detail=str(e))
