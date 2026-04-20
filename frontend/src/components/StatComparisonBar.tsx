import type { StatComparison, TeamStats } from "../api/client";

interface Props {
  comparison: StatComparison[];
  team1: TeamStats;
  team2: TeamStats;
}

export default function StatComparisonBar({ comparison, team1, team2 }: Props) {
  return (
    <div className="stat-comparison">
      <div className="stat-comparison-header">
        <span className="team-label left">{team1.teamName}</span>
        <span className="stat-comparison-title">Stat · Advantage</span>
        <span className="team-label right">{team2.teamName}</span>
      </div>
      <div className="stat-comparison-body">
        {comparison.map((row) => {
          const total = row.team1Value + row.team2Value;
          const pct1 = total === 0 ? 50 : (row.team1Value / total) * 100;
          const isTeam1Better = row.advantage === team1.teamName;
          return (
            <div key={row.key} className="stat-row">
              <span className={`stat-val left ${isTeam1Better ? "winner" : ""}`}>
                {row.team1Value}
              </span>
              <div className="bar-wrapper">
                <span className="stat-name">{row.stat}</span>
                <div className="bar">
                  <div className="bar-fill left"  style={{ width: `${pct1}%` }} />
                  <div className="bar-fill right" style={{ width: `${100 - pct1}%` }} />
                </div>
              </div>
              <span className={`stat-val right ${!isTeam1Better ? "winner" : ""}`}>
                {row.team2Value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
