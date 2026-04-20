# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (FastAPI + nba_api)
```bash
# Start backend dev server (from repo root)
backend/.venv/bin/uvicorn main:app --reload --app-dir backend

# Install/update Python deps
backend/.venv/bin/pip install -r backend/requirements.txt
```

### Frontend (React + TypeScript + Vite)
```bash
# Start frontend dev server
cd frontend && npm run dev

# Build for production
cd frontend && npm run build

# Type-check
cd frontend && npm run tsc --noEmit
```

Both servers must run concurrently. Backend on `:8000`, frontend on `:5173`.

## Architecture

### Backend (`backend/`)
- `main.py` — FastAPI app with CORS; mounts three routers under `/api`
- `routers/teams.py` — `/api/teams`: all teams, playoff picture (seed 1–8 per conference), and per-team advanced stats
- `routers/players.py` — `/api/players`: team rosters and per-player advanced stats (two nba_api calls: Advanced + Base measure types)
- `routers/matchups.py` — `/api/matchups/{team1}/{team2}`: head-to-head stat comparison with per-stat advantage labels

All data comes from `nba_api` (NBA.com stats API). Season constant `CURRENT_SEASON = "2024-25"` is defined in each router — update it each season. nba_api calls are synchronous and can be slow (NBA.com rate-limits); consider caching if needed.

### Frontend (`frontend/src/`)
- `api/client.ts` — typed axios wrappers for all backend endpoints; all TypeScript interfaces live here
- `App.tsx` — root: fetches playoff picture, renders `PlayoffBracket`, passes selected matchup down to `MatchupView`
- `components/PlayoffBracket.tsx` — shows East/West seeds 1–8, first-round matchup buttons
- `components/MatchupView.tsx` — orchestrates a full matchup: fetches matchup data + rosters, renders stat bars and player selector
- `components/StatComparisonBar.tsx` — dual-sided bar chart for team stat comparisons
- `components/PlayerRadarChart.tsx` — Recharts `RadarChart` normalizing player stats to 0–100 scale; supports up to 2 players

### Data flow
1. User clicks a first-round matchup in `PlayoffBracket`
2. `MatchupView` fetches `/api/matchups/{t1}/{t2}` (advanced team stats + comparison) and both rosters in parallel
3. User selects up to 2 players → individual `/api/players/{id}/stats` calls → `PlayerRadarChart` renders
