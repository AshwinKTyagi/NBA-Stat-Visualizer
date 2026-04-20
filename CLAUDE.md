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

```bash
# Start both servers with one command (from repo root)
npm run dev
```

## Architecture

### Backend (`backend/`)
- `main.py` — FastAPI app with CORS; mounts three routers under `/api`
- `routers/teams.py` — `/api/teams`: all teams, playoff picture (seed 1–8 per conference), and per-team advanced stats
- `routers/players.py` — `/api/players`: team rosters and per-player advanced stats (two nba_api calls: Advanced + Base measure types)
- `routers/matchups.py` — `/api/matchups/{team1}/{team2}`: head-to-head stat comparison with per-stat advantage labels

All data comes from `nba_api` (NBA.com stats API). `CURRENT_SEASON` is read from `backend/.env` — update it each season. nba_api calls are synchronous and slow; NBA.com uses Akamai bot detection, so all requests are routed through `curl_cffi` (Chrome TLS impersonation) patched onto `nba_api.library.http` in `main.py`. Consider caching if latency becomes an issue.

`backend/config.py` centralises all env-driven config (`CURRENT_SEASON`, `CORS_ORIGIN`). Import from there — never hardcode season or origin strings in routers.

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

### Frontend notes
- **Vite 8 uses rolldown** — TypeScript interfaces must be imported with `import type`, not plain `import`. Violating this causes a silent `MISSING_EXPORT` error and a blank page.
- All TypeScript interfaces live in `api/client.ts`. When importing them in components, always use `import type { ... } from "../api/client"`.
- Env var `VITE_API_BASE_URL` is set in `frontend/.env.local` (gitignored). Template in `frontend/.env.example`.

## Git Workflow

**Never commit directly to `main`.** All work goes on a feature branch and merges via PR.

### Branch naming
| Type | Pattern | Example |
|---|---|---|
| Feature | `feature/<short-description>` | `feature/player-comparison` |
| Bug fix | `fix/<short-description>` | `fix/radar-negative-values` |
| Docs / config | `docs/<short-description>` | `docs/git-workflow` |
| Chore / deps | `chore/<short-description>` | `chore/update-recharts` |

### Daily workflow
```bash
# 1. Always branch from an up-to-date main
git checkout main && git pull

# 2. Create your feature branch
git checkout -b feature/my-feature

# 3. Work, commit often with clear messages
git add <files>
git commit -m "feat: add player comparison panel"

# 4. Push and open a PR
git push -u origin feature/my-feature
gh pr create --title "Add player comparison panel" --body "..."

# 5. After merge, clean up
git checkout main && git pull
git branch -d feature/my-feature
```

### Commit message convention
```
<type>: <short summary>

Types: feat | fix | style | refactor | chore | docs
```

### Protected branch rules (set in GitHub)
- `main` requires a PR — no direct pushes
- At least 1 approval before merge (optional for solo work, recommended when collaborating)
- Delete branch after merge
