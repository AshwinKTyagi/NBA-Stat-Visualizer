import type { PlayoffTeam } from "../api/client";

interface Props {
  teams: PlayoffTeam[];
  selectedMatchup: { team1Id: number; team2Id: number } | null;
  onSelectMatchup: (team1Id: number, team2Id: number) => void;
}

function ConferenceSide({
  teams,
  conference,
  selectedMatchup,
  onSelectMatchup,
}: {
  teams: PlayoffTeam[];
  conference: string;
  selectedMatchup: Props["selectedMatchup"];
  onSelectMatchup: Props["onSelectMatchup"];
}) {
  const conf = teams
    .filter((t) => t.conference === conference)
    .sort((a, b) => a.playoffRank - b.playoffRank);

  function isActive(t1: PlayoffTeam, t2: PlayoffTeam) {
    if (!selectedMatchup) return false;
    const { team1Id, team2Id } = selectedMatchup;
    return (
      (team1Id === t1.teamId && team2Id === t2.teamId) ||
      (team1Id === t2.teamId && team2Id === t1.teamId)
    );
  }

  return (
    <div className="conference-side">
      <div className="conference-label">{conference}ern Conference</div>

      <div className="seeds">
        {[1, 8, 4, 5, 3, 6, 2, 7].map((seed) => {
          const team = conf.find((t) => t.playoffRank === seed);
          if (!team) return <div key={seed} className="seed-slot empty">TBD</div>;
          return (
            <div key={seed} className="seed-slot">
              <span className="seed-num">{seed}</span>
              <span className="team-name">{team.teamName}</span>
              <span className="record">{team.wins}–{team.losses}</span>
            </div>
          );
        })}
      </div>

      <div className="matchups-label">First Round Matchups</div>
      <div className="matchup-cards">
        {([[1, 8], [4, 5], [3, 6], [2, 7]] as [number, number][]).map(([s1, s2]) => {
          const t1 = conf.find((t) => t.playoffRank === s1);
          const t2 = conf.find((t) => t.playoffRank === s2);
          if (!t1 || !t2) return null;
          return (
            <button
              key={`${s1}-${s2}`}
              className={`matchup-card ${isActive(t1, t2) ? "active" : ""}`}
              onClick={() => onSelectMatchup(t1.teamId, t2.teamId)}
            >
              <div className="matchup-card-team">
                <span className="mc-seed">{s1}</span>
                <span className="mc-name">{t1.teamName}</span>
                <span className="mc-record">{t1.wins}–{t1.losses}</span>
              </div>
              <div className="matchup-card-team">
                <span className="mc-seed">{s2}</span>
                <span className="mc-name">{t2.teamName}</span>
                <span className="mc-record">{t2.wins}–{t2.losses}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PlayoffBracket({ teams, selectedMatchup, onSelectMatchup }: Props) {
  return (
    <div className="bracket-conferences">
      <ConferenceSide
        teams={teams}
        conference="East"
        selectedMatchup={selectedMatchup}
        onSelectMatchup={onSelectMatchup}
      />
      <div className="bracket-divider" />
      <ConferenceSide
        teams={teams}
        conference="West"
        selectedMatchup={selectedMatchup}
        onSelectMatchup={onSelectMatchup}
      />
    </div>
  );
}
