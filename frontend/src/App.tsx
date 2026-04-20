import { useEffect, useState } from "react";
import { teamsApi } from "./api/client";
import type { PlayoffTeam } from "./api/client";
import PlayoffBracket from "./components/PlayoffBracket";
import MatchupView from "./components/MatchupView";
import "./App.css";

export default function App() {
  const [playoffTeams, setPlayoffTeams] = useState<PlayoffTeam[]>([]);
  const [selectedMatchup, setSelectedMatchup] = useState<{ team1Id: number; team2Id: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    teamsApi
      .getPlayoffPicture()
      .then(setPlayoffTeams)
      .catch((e) => {
        const isNetwork = e?.code === "ERR_NETWORK" || e?.message === "Network Error";
        setError(
          isNetwork
            ? "Backend not reachable — make sure the API server is running on port 8000.\n\nRun: backend/.venv/bin/uvicorn main:app --reload --app-dir backend"
            : e.message
        );
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const team1Playoff = selectedMatchup
    ? playoffTeams.find((t) => t.teamId === selectedMatchup.team1Id)
    : undefined;
  const team2Playoff = selectedMatchup
    ? playoffTeams.find((t) => t.teamId === selectedMatchup.team2Id)
    : undefined;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-wordmark">
          <div className="header-icon">🏀</div>
          <div className="header-text">
            <h1>Playoff Analyzer</h1>
            <p className="subtitle">2024–25 Season · Advanced Stats</p>
          </div>
        </div>
        <div className="live-badge">
          <span className="live-dot" />
          Live Season
        </div>
      </header>

      <main>
        {loading && (
          <div className="loading">
            <div className="loading-dots">
              <div className="loading-dot" />
              <div className="loading-dot" />
              <div className="loading-dot" />
            </div>
            Loading Playoff Picture
          </div>
        )}

        {error && (
          <div className="error">
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{error}</pre>
            <button className="retry-btn" onClick={load}>↺ Retry</button>
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="section">
              <div className="section-label">2024–25 Playoff Picture</div>
              <PlayoffBracket
                teams={playoffTeams}
                selectedMatchup={selectedMatchup}
                onSelectMatchup={(t1, t2) => setSelectedMatchup({ team1Id: t1, team2Id: t2 })}
              />
            </section>

            {selectedMatchup ? (
              <MatchupView
                team1Id={selectedMatchup.team1Id}
                team2Id={selectedMatchup.team2Id}
                team1Playoff={team1Playoff}
                team2Playoff={team2Playoff}
                onClose={() => setSelectedMatchup(null)}
              />
            ) : (
              <div className="empty-state">
                <span className="empty-state-icon">↑</span>
                <p>Select a first-round matchup above to see the full analysis</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
