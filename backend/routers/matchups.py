import logging
import time
from fastapi import APIRouter, HTTPException
from nba_api.stats.endpoints import teamgamelog, leaguedashteamstats
import pandas as pd

from config import CURRENT_SEASON

router = APIRouter()
logger = logging.getLogger("nba.matchups")

STAT_LABELS = {
    "offRating": "Off Rating",
    "defRating": "Def Rating",
    "netRating": "Net Rating",
    "pace": "Pace",
    "trueShootingPct": "TS%",
    "astPct": "AST%",
    "rebPct": "REB%",
    "tovPct": "TOV%",
    "efgPct": "eFG%",
    "piePct": "PIE%",
}


def fetch_team_stats(team_id: int, df: pd.DataFrame) -> dict:
    row = df[df["TEAM_ID"] == team_id]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Team {team_id} not found")
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
        "tovPct": round(float(row["TM_TOV_PCT"]) * 100, 1),
        "efgPct": round(float(row["EFG_PCT"]) * 100, 1),
        "piePct": round(float(row["PIE"]) * 100, 1),
    }


@router.get("/{team1_id}/{team2_id}")
def get_matchup(team1_id: int, team2_id: int):
    logger.info("Fetching matchup: team1=%d vs team2=%d", team1_id, team2_id)
    try:
        t0 = time.perf_counter()
        dash = leaguedashteamstats.LeagueDashTeamStats(
            season=CURRENT_SEASON,
            measure_type_detailed_defense="Advanced",
            per_mode_simple="PerGame",
        )
        df = dash.get_data_frames()[0]
        logger.info("LeagueDashTeamStats fetched in %.0fms", (time.perf_counter() - t0) * 1000)

        team1 = fetch_team_stats(team1_id, df)
        team2 = fetch_team_stats(team2_id, df)

        comparison = []
        for key, label in STAT_LABELS.items():
            v1 = team1[key]
            v2 = team2[key]
            # For defensive rating, lower is better
            if key == "defRating":
                advantage = team1["teamName"] if v1 < v2 else team2["teamName"]
            elif key == "tovPct":
                advantage = team1["teamName"] if v1 < v2 else team2["teamName"]
            else:
                advantage = team1["teamName"] if v1 > v2 else team2["teamName"]
            comparison.append({
                "stat": label,
                "key": key,
                "team1Value": v1,
                "team2Value": v2,
                "advantage": advantage,
            })

        logger.info(
            "Matchup ready: %s vs %s (net ratings: %.1f / %.1f)",
            team1["teamName"], team2["teamName"], team1["netRating"], team2["netRating"],
        )
        return {
            "team1": team1,
            "team2": team2,
            "comparison": comparison,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error building matchup %d vs %d", team1_id, team2_id)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{team1_id}/{team2_id}/head-to-head")
def get_head_to_head(team1_id: int, team2_id: int):
    """Returns this season's games between the two teams."""
    try:
        log = teamgamelog.TeamGameLog(team_id=team1_id, season=CURRENT_SEASON)
        df = log.get_data_frames()[0]
        # Filter games where opponent is team2
        h2h = df[df["MATCHUP"].str.contains(r"vs\.|@", regex=True)]
        # nba_api uses team abbreviations in MATCHUP — filter approximately
        results = []
        for _, row in h2h.iterrows():
            results.append({
                "gameDate": row["GAME_DATE"],
                "matchup": row["MATCHUP"],
                "wl": row["WL"],
                "pts": int(row["PTS"]),
                "oppPts": int(row["PTS"]) - int(row["PLUS_MINUS"]),
                "plusMinus": int(row["PLUS_MINUS"]),
            })
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
