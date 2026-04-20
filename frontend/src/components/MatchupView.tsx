import { useEffect, useState } from "react";
import { matchupsApi, playersApi } from "../api/client";
import type { MatchupData, RosterPlayer, PlayerStats, PlayoffTeam } from "../api/client";
import StatComparisonBar from "./StatComparisonBar";
import PlayerRadarChart from "./PlayerRadarChart";

interface Props {
  team1Id: number;
  team2Id: number;
  team1Playoff?: PlayoffTeam;
  team2Playoff?: PlayoffTeam;
  onClose: () => void;
}

export default function MatchupView({
  team1Id,
  team2Id,
  team1Playoff,
  team2Playoff,
  onClose,
}: Props) {
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

  if (loading) return (
    <div className="matchup-view">
      <button className="matchup-back" onClick={onClose}>← Back</button>
      <div className="loading">
        <div className="loading-dots">
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
        </div>
        Loading Matchup Data
      </div>
    </div>
  );

  if (error) return (
    <div className="matchup-view">
      <button className="matchup-back" onClick={onClose}>← Back to Bracket</button>
      <div className="error">Error: {error}</div>
    </div>
  );

  if (!matchup) return null;

  return (
    <div className="matchup-view">
      <button className="matchup-back" onClick={onClose}>← Back to Bracket</button>

      {/* VS Hero */}
      <div className="matchup-hero">
        <div className="hero-team">
          {team1Playoff && (
            <div className="hero-seed-conf">
              #{team1Playoff.playoffRank} · {team1Playoff.conference}
            </div>
          )}
          <div className="hero-name">{matchup.team1.teamName}</div>
          {team1Playoff && (
            <div className="hero-record">{team1Playoff.wins}–{team1Playoff.losses}</div>
          )}
        </div>

        <div className="hero-vs">
          <div className="hero-vs-line" />
          <div className="hero-vs-text">VS</div>
          <div className="hero-vs-line" />
        </div>

        <div className="hero-team right">
          {team2Playoff && (
            <div className="hero-seed-conf">
              #{team2Playoff.playoffRank} · {team2Playoff.conference}
            </div>
          )}
          <div className="hero-name">{matchup.team2.teamName}</div>
          {team2Playoff && (
            <div className="hero-record">{team2Playoff.wins}–{team2Playoff.losses}</div>
          )}
        </div>
      </div>

      {/* Team Stats */}
      <section className="section">
        <h3>Team Stats Comparison</h3>
        <StatComparisonBar
          comparison={matchup.comparison}
          team1={matchup.team1}
          team2={matchup.team2}
        />
      </section>

      {/* Player Radar */}
      <section className="section">
        <h3>Player Radar Comparison</h3>

        <div className="player-selection-info">
          <span className="selection-count">
            <span>{selectedPlayers.length}</span> / 2 players selected
          </span>
          {selectedPlayers.length > 0 && (
            <button className="clear-selection-btn" onClick={() => setSelectedPlayers([])}>
              Clear
            </button>
          )}
        </div>

        <div className="roster-pickers">
          {[
            { roster: roster1, team: matchup.team1.teamName },
            { roster: roster2, team: matchup.team2.teamName },
          ].map(({ roster, team }) => (
            <div key={team} className="roster-col">
              <div className="roster-col-header">
                <h4>{team}</h4>
              </div>
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
          ))}
        </div>

        {selectedPlayers.length > 0 && <PlayerRadarChart players={selectedPlayers} />}
      </section>
    </div>
  );
}
