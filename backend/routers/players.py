import logging
import time
from fastapi import APIRouter, HTTPException
from nba_api.stats.endpoints import leaguedashplayerstats, commonteamroster
import pandas as pd

from config import CURRENT_SEASON

router = APIRouter()
logger = logging.getLogger("nba.players")


@router.get("/team/{team_id}")
def get_team_roster(team_id: int):
    logger.info("Fetching roster for team_id=%d", team_id)
    try:
        t0 = time.perf_counter()
        roster = commonteamroster.CommonTeamRoster(team_id=team_id, season=CURRENT_SEASON)
        df = roster.get_data_frames()[0]
        logger.info("Roster fetched in %.0fms (%d players)", (time.perf_counter() - t0) * 1000, len(df))
        return [
            {
                "playerId": int(row["PLAYER_ID"]),
                "name": row["PLAYER"],
                "number": row["NUM"],
                "position": row["POSITION"],
                "age": row["AGE"],
            }
            for _, row in df.iterrows()
        ]
    except Exception as e:
        logger.exception("Error fetching roster for team_id=%d", team_id)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{player_id}/stats")
def get_player_advanced_stats(player_id: int):
    logger.info("Fetching advanced stats for player_id=%d", player_id)
    try:
        t0 = time.perf_counter()
        dash = leaguedashplayerstats.LeagueDashPlayerStats(
            season=CURRENT_SEASON,
            measure_type_detailed_defense="Advanced",
            per_mode_detailed="PerGame",
        )
        df = dash.get_data_frames()[0]
        df = df.fillna(0)
        logger.info("Advanced player stats fetched in %.0fms", (time.perf_counter() - t0) * 1000)
        row = df[df["PLAYER_ID"] == player_id]
        if row.empty:
            raise HTTPException(status_code=404, detail="Player not found")
        row = row.iloc[0]

        t1 = time.perf_counter()
        base_dash = leaguedashplayerstats.LeagueDashPlayerStats(
            season=CURRENT_SEASON,
            measure_type_detailed_defense="Base",
            per_mode_detailed="PerGame",
        )
        base_df = base_dash.get_data_frames()[0]
        base_df = base_df.fillna(0)
        logger.info("Base player stats fetched in %.0fms", (time.perf_counter() - t1) * 1000)
        base_row = base_df[base_df["PLAYER_ID"] == player_id].iloc[0]

        return {
            "playerId": player_id,
            "name": row["PLAYER_NAME"],
            "teamId": int(row["TEAM_ID"]),
            "pts": round(float(base_row["PTS"]), 1),
            "ast": round(float(base_row["AST"]), 1),
            "reb": round(float(base_row["REB"]), 1),
            "stl": round(float(base_row["STL"]), 1),
            "blk": round(float(base_row["BLK"]), 1),
            "per": round(float(row.get("PIE", 0)) * 100, 1),
            "trueShootingPct": round(float(row["TS_PCT"]) * 100, 1),
            "usagePct": round(float(row["USG_PCT"]) * 100, 1),
            "offRating": round(float(row["OFF_RATING"]), 1),
            "defRating": round(float(row["DEF_RATING"]), 1),
            "netRating": round(float(row["NET_RATING"]), 1),
            "astPct": round(float(row["AST_PCT"]) * 100, 1),
            "tovPct": round(float(row.get("TM_TOV_PCT", 0)) * 100, 1),
            "rebPct": round(float(row["REB_PCT"]) * 100, 1),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching stats for player_id=%d", player_id)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/compare")
def compare_players(player_ids: str):
    """Comma-separated player IDs, e.g. ?player_ids=203999,1629029"""
    ids = [int(x) for x in player_ids.split(",")]
    return [get_player_advanced_stats(pid) for pid in ids]
