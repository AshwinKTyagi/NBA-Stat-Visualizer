import logging
import time
from fastapi import APIRouter, HTTPException
from nba_api.stats.endpoints import leaguedashplayerstats, commonteamroster
import pandas as pd

from config import CURRENT_SEASON

router = APIRouter()
logger = logging.getLogger("nba.players")

_IMPACT_STATS = {
    "pts": 35, "ast": 12, "reb": 14,
    "trueShootingPct": 70, "usagePct": 40,
    "netRating": 15, "stl": 3, "blk": 3,
}


def _compute_impact(stats: dict) -> float:
    scores = [
        max(0.0, min(100.0, stats.get(stat, 0) / mx * 100))
        for stat, mx in _IMPACT_STATS.items()
    ]
    return round(sum(scores) / len(scores), 1)


@router.get("/team/{team_id}")
def get_team_roster(team_id: int):
    logger.info("Fetching roster for team_id=%d", team_id)
    try:
        t0 = time.perf_counter()
        roster_data = commonteamroster.CommonTeamRoster(team_id=team_id, season=CURRENT_SEASON)
        df = roster_data.get_data_frames()[0]
        logger.info("Roster fetched in %.0fms (%d players)", (time.perf_counter() - t0) * 1000, len(df))

        roster = [
            {
                "playerId": int(row["PLAYER_ID"]),
                "name": row["PLAYER"],
                "number": row["NUM"],
                "position": row["POSITION"],
                "age": row["AGE"],
            }
            for _, row in df.iterrows()
        ]

        # Fetch team stats to compute impact and sort roster
        try:
            t1 = time.perf_counter()
            adv_df = leaguedashplayerstats.LeagueDashPlayerStats(
                season=CURRENT_SEASON,
                measure_type_detailed_defense="Advanced",
                per_mode_detailed="PerGame",
                team_id_nullable=team_id,
            ).get_data_frames()[0].fillna(0)

            base_df = leaguedashplayerstats.LeagueDashPlayerStats(
                season=CURRENT_SEASON,
                measure_type_detailed_defense="Base",
                per_mode_detailed="PerGame",
                team_id_nullable=team_id,
            ).get_data_frames()[0].fillna(0)

            logger.info("Team player stats fetched in %.0fms", (time.perf_counter() - t1) * 1000)

            impact_by_id: dict[int, float] = {}
            for _, arow in adv_df.iterrows():
                pid = int(arow["PLAYER_ID"])
                brows = base_df[base_df["PLAYER_ID"] == pid]
                if brows.empty:
                    continue
                b = brows.iloc[0]
                impact_by_id[pid] = _compute_impact({
                    "pts": float(b["PTS"]),
                    "ast": float(b["AST"]),
                    "reb": float(b["REB"]),
                    "stl": float(b["STL"]),
                    "blk": float(b["BLK"]),
                    "trueShootingPct": float(arow["TS_PCT"]) * 100,
                    "usagePct": float(arow["USG_PCT"]) * 100,
                    "netRating": float(arow["NET_RATING"]),
                })

            for p in roster:
                p["impact"] = impact_by_id.get(p["playerId"], 0.0)

            roster.sort(key=lambda p: p["impact"], reverse=True)
        except Exception:
            logger.warning("Could not compute impact scores for team_id=%d", team_id)
            for p in roster:
                p["impact"] = 0.0

        return roster
    except HTTPException:
        raise
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

        stats = {
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
        stats["impact"] = _compute_impact(stats)
        return stats
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
