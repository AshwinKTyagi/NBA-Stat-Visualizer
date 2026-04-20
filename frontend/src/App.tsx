import { useEffect, useState } from "react";
import { teamsApi, PlayoffTeam } from "./api/client";
import PlayoffBracket from "./components/PlayoffBracket";
import MatchupView from "./components/MatchupView";
import "./App.css";

export default function App() {
  const [playoffTeams, setPlayoffTeams] = useState<PlayoffTeam[]>([]);
  const [selectedMatchup, setSelectedMatchup] = useState<{ team1Id: number; team2Id: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    teamsApi
      .getPlayoffPicture()
      .then(setPlayoffTeams)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>NBA Playoff Matchup Analyzer</h1>
        <p className="subtitle">2024-25 Season · Advanced Stats</p>
      </header>

      <main className="app-main">
        {loading && <div className="loading">Loading playoff picture...</div>}
        {error && <div className="error">Could not load data: {error}</div>}

        {!loading && !error && (
          <>
            <section className="section">
              <h2>Playoff Picture</h2>
              <p className="hint">Click a first-round matchup to analyze it</p>
              <PlayoffBracket
                teams={playoffTeams}
                onSelectMatchup={(t1, t2) => setSelectedMatchup({ team1Id: t1, team2Id: t2 })}
              />
            </section>

            {selectedMatchup && (
              <MatchupView team1Id={selectedMatchup.team1Id} team2Id={selectedMatchup.team2Id} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
