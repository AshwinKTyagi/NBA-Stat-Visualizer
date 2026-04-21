import { useEffect, useState } from 'react';
import { teamsApi } from '../api/client';
import type { StandingsTeam } from '../api/client';

function ConferenceTable({ teams, conference }: { teams: StandingsTeam[]; conference: string }) {
  const conf = teams
    .filter((t) => t.conference === conference)
    .sort((a, b) => a.conferenceRank - b.conferenceRank);

  return (
    <div className="standings-conference">
      <div className="standings-conf-label">{conference}ern Conference</div>
      <table className="standings-table">
        <thead>
          <tr>
            <th className="col-rank">#</th>
            <th className="col-team">Team</th>
            <th className="col-stat">W</th>
            <th className="col-stat">L</th>
            <th className="col-stat">PCT</th>
            <th className="col-stat col-hide-sm">L10</th>
            <th className="col-stat col-hide-sm">Home</th>
            <th className="col-stat col-hide-sm">Away</th>
          </tr>
        </thead>
        <tbody>
          {conf.map((team, i) => {
            const isPlayIn = team.playoffRank >= 7 && team.playoffRank <= 10;
            const isEliminated = team.playoffRank > 10;
            const showPlayInLine = i > 0 && conf[i - 1].playoffRank === 6 && team.playoffRank === 7;
            const showElimLine = i > 0 && conf[i - 1].playoffRank === 10 && team.playoffRank === 11;

            return (
              <>
                {showPlayInLine && (
                  <tr key={`pi-${team.teamId}`} className="standings-cutoff-row">
                    <td colSpan={8}><span>Play-In</span></td>
                  </tr>
                )}
                {showElimLine && (
                  <tr key={`el-${team.teamId}`} className="standings-cutoff-row eliminated">
                    <td colSpan={8}><span>Eliminated</span></td>
                  </tr>
                )}
                <tr
                  key={team.teamId}
                  className={`standings-row ${isPlayIn ? 'play-in' : ''} ${isEliminated ? 'eliminated' : ''}`}
                >
                  <td className="col-rank">
                    <span className="rank-badge">{team.conferenceRank}</span>
                  </td>
                  <td className="col-team">
                    <span className="team-abbrev">{team.abbreviation || team.teamName.substring(0, 3).toUpperCase()}</span>
                    <span className="team-full-name">{team.teamName}</span>
                  </td>
                  <td className="col-stat">{team.wins}</td>
                  <td className="col-stat">{team.losses}</td>
                  <td className="col-stat">{team.winPct.toFixed(3)}</td>
                  <td className="col-stat col-hide-sm">{team.lastTen || '—'}</td>
                  <td className="col-stat col-hide-sm">{team.homeRecord || '—'}</td>
                  <td className="col-stat col-hide-sm">{team.awayRecord || '—'}</td>
                </tr>
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function StandingsPage() {
  const [standings, setStandings] = useState<StandingsTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    teamsApi
      .getStandings()
      .then(setStandings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="loading">
      <div className="loading-dots">
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
      </div>
      Loading Standings
    </div>
  );

  if (error) return (
    <div className="error">
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{error}</pre>
      <button className="retry-btn" onClick={load}>↺ Retry</button>
    </div>
  );

  return (
    <section className="section">
      <div className="section-label">2025–26 League Standings</div>
      <div className="standings-grid">
        <ConferenceTable teams={standings} conference="East" />
        <ConferenceTable teams={standings} conference="West" />
      </div>
    </section>
  );
}
