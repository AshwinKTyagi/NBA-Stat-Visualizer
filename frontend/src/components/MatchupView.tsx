import { useEffect, useState } from "react";
import { matchupsApi, playersApi, MatchupData, RosterPlayer, PlayerStats } from "../api/client";
import StatComparisonBar from "./StatComparisonBar";
import PlayerRadarChart from "./PlayerRadarChart";

interface Props {
  team1Id: number;
  team2Id: number;
}

export default function MatchupView({ team1Id, team2Id }: Props) {
  const [matchup, setMatchup] = useState<MatchupData | null>(null);
  const [roster1, setRoster1] = useState<RosterPlayer[]>([]);
  const [roster2, setRoster2] = useState<RosterPlayer[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelectedPlayers([]);
    Promise.all([
      matchupsApi.getMatchup(team1Id, team2Id),
      playersApi.getRoster(team1Id),
      playersApi.getRoster(team2Id),
    ])
      .then(([m, r1, r2]) => {
        setMatchup(m);
        setRoster1(r1);
        setRoster2(r2);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [team1Id, team2Id]);

  async function togglePlayer(player: RosterPlayer) {
    const exists = selectedPlayers.find((p) => p.playerId === player.playerId);
    if (exists) {
      setSelectedPlayers((prev) => prev.filter((p) => p.playerId !== player.playerId));
      return;
    }
    if (selectedPlayers.length >= 2) return;
    const stats = await playersApi.getStats(player.playerId);
    setSelectedPlayers((prev) => [...prev, stats]);
  }

  if (loading) return <div className="loading">Loading matchup data...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!matchup) return null;

  return (
    <div className="matchup-view">
      <h2 className="matchup-title">
        {matchup.team1.teamName} vs {matchup.team2.teamName}
      </h2>

      <section className="section">
        <h3>Team Stats Comparison</h3>
        <StatComparisonBar comparison={matchup.comparison} team1={matchup.team1} team2={matchup.team2} />
      </section>

      <section className="section">
        <h3>Player Radar Comparison</h3>
        <p className="hint">Select up to 2 players from either roster to compare</p>
        <div className="roster-pickers">
          {[{ roster: roster1, team: matchup.team1.teamName }, { roster: roster2, team: matchup.team2.teamName }].map(
            ({ roster, team }) => (
              <div key={team} className="roster-col">
                <h4>{team}</h4>
                <ul className="roster-list">
                  {roster.map((p) => {
                    const selected = selectedPlayers.some((s) => s.playerId === p.playerId);
                    const disabled = !selected && selectedPlayers.length >= 2;
                    return (
                      <li key={p.playerId}>
                        <button
                          className={`player-btn ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                          onClick={() => !disabled && togglePlayer(p)}
                          disabled={disabled}
                        >
                          <span className="player-num">#{p.number}</span>
                          <span className="player-name">{p.name}</span>
                          <span className="player-pos">{p.position}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )
          )}
        </div>
        {selectedPlayers.length > 0 && <PlayerRadarChart players={selectedPlayers} />}
      </section>
    </div>
  );
}
