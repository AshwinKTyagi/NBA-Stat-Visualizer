import { PlayoffTeam } from "../api/client";

interface Props {
  teams: PlayoffTeam[];
  onSelectMatchup: (team1Id: number, team2Id: number) => void;
}

function ConferenceSide({ teams, conference, onSelectMatchup }: { teams: PlayoffTeam[]; conference: string; onSelectMatchup: Props["onSelectMatchup"] }) {
  const conf = teams.filter((t) => t.conference === conference).sort((a, b) => a.playoffRank - b.playoffRank);
  const seeds = [1, 8, 4, 5, 3, 6, 2, 7];

  return (
    <div className="conference-side">
      <h2>{conference}ern Conference</h2>
      <div className="seeds">
        {seeds.map((seed) => {
          const team = conf.find((t) => t.playoffRank === seed);
          if (!team) return <div key={seed} className="seed-slot empty">TBD</div>;
          return (
            <div key={seed} className="seed-slot">
              <span className="seed-num">{seed}</span>
              <span className="team-name">{team.teamName}</span>
              <span className="record">{team.wins}-{team.losses}</span>
            </div>
          );
        })}
      </div>
      <div className="first-round-matchups">
        {[[1, 8], [4, 5], [3, 6], [2, 7]].map(([s1, s2]) => {
          const t1 = conf.find((t) => t.playoffRank === s1);
          const t2 = conf.find((t) => t.playoffRank === s2);
          if (!t1 || !t2) return null;
          return (
            <button
              key={`${s1}-${s2}`}
              className="matchup-btn"
              onClick={() => onSelectMatchup(t1.teamId, t2.teamId)}
            >
              ({s1}) {t1.teamName} vs ({s2}) {t2.teamName}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PlayoffBracket({ teams, onSelectMatchup }: Props) {
  return (
    <div className="playoff-bracket">
      <ConferenceSide teams={teams} conference="East" onSelectMatchup={onSelectMatchup} />
      <ConferenceSide teams={teams} conference="West" onSelectMatchup={onSelectMatchup} />
    </div>
  );
}
