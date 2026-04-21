import { useRef, useState } from 'react';
import type { PlayoffTeam } from '../api/client';

interface Props {
  teams: PlayoffTeam[];
  selectedMatchup: { team1Id: number; team2Id: number } | null;
  onSelectMatchup: (team1Id: number, team2Id: number) => void;
}

interface MatchupSlot {
  topTeam: PlayoffTeam | null;
  bottomTeam: PlayoffTeam | null;
  clickable: boolean;
}

function TeamRow({
  team,
  isPlayIn,
  isWinner,
}: {
  team: PlayoffTeam | null;
  isPlayIn?: boolean;
  isWinner?: boolean;
}) {
  if (!team) {
    return (
      <div className="bk-team bk-team--tbd">
        <span className="bk-seed">?</span>
        <span className="bk-name">TBD</span>
      </div>
    );
  }
  return (
    <div
      className={`bk-team ${isWinner ? 'bk-team--winner' : ''}`}
      title={`${team.teamName} (${team.wins}–${team.losses})`}
    >
      <span className="bk-seed">
        {team.playoffRank}
        {isPlayIn && <sup className="bk-pi">PI</sup>}
      </span>
      <span className="bk-name">{team.teamName}</span>
      {!isPlayIn && <span className="bk-series-w">{team.seriesWins}</span>}
    </div>
  );
}

function MatchupCard({
  slot,
  active,
  onClick,
  compact,
}: {
  slot: MatchupSlot;
  active: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  const Tag = slot.clickable ? 'button' : 'div';
  const threshold = compact ? 1 : 4;
  const topIsWinner = (slot.topTeam?.seriesWins ?? 0) >= threshold && !!slot.topTeam;
  const bottomIsWinner = (slot.bottomTeam?.seriesWins ?? 0) >= threshold && !!slot.bottomTeam;
  return (
    <Tag
      className={`bk-card ${active ? 'bk-card--active' : ''} ${!slot.clickable ? 'bk-card--tbd' : ''} ${compact ? 'bk-card--compact' : ''}`}
      onClick={slot.clickable ? onClick : undefined}
      title={
        slot.topTeam && slot.bottomTeam
          ? `${slot.topTeam.teamName} vs ${slot.bottomTeam.teamName}`
          : undefined
      }
    >
      <TeamRow team={slot.topTeam} isPlayIn={compact} isWinner={topIsWinner} />
      <div className="bk-divider" />
      <TeamRow team={slot.bottomTeam} isPlayIn={compact} isWinner={bottomIsWinner} />
    </Tag>
  );
}

function isMatchupActive(
  selected: Props['selectedMatchup'],
  t1: PlayoffTeam | null,
  t2: PlayoffTeam | null
) {
  if (!selected || !t1 || !t2) return false;
  return (
    (selected.team1Id === t1.teamId && selected.team2Id === t2.teamId) ||
    (selected.team1Id === t2.teamId && selected.team2Id === t1.teamId)
  );
}

function slotHasWinner(slot: MatchupSlot, threshold = 4) {
  return (
    ((slot.topTeam?.seriesWins ?? 0) >= threshold && !!slot.topTeam) ||
    ((slot.bottomTeam?.seriesWins ?? 0) >= threshold && !!slot.bottomTeam)
  );
}

function ConferenceBracket({
  teams,
  conference,
  side,
  selectedMatchup,
  onSelectMatchup,
}: {
  teams: PlayoffTeam[];
  conference: string;
  side: 'east' | 'west';
  selectedMatchup: Props['selectedMatchup'];
  onSelectMatchup: Props['onSelectMatchup'];
}) {
  const conf = teams.filter((t) => t.conference === conference);
  const seed = (n: number) => conf.find((t) => t.playoffRank === n) ?? null;

  // Play-in: 7v8 and 9v10
  const playInSlots: MatchupSlot[] = [
    { topTeam: seed(7), bottomTeam: seed(8), clickable: false },
    { topTeam: seed(9), bottomTeam: seed(10), clickable: false },
  ];

  // R1: 1v8, 4v5, 3v6, 2v7  (seeds 7 & 8 come from play-in)
  const r1Slots: MatchupSlot[] = [
    { topTeam: seed(1), bottomTeam: seed(8), clickable: !!(seed(1) && seed(8)) },
    { topTeam: seed(4), bottomTeam: seed(5), clickable: !!(seed(4) && seed(5)) },
    { topTeam: seed(3), bottomTeam: seed(6), clickable: !!(seed(3) && seed(6)) },
    { topTeam: seed(2), bottomTeam: seed(7), clickable: !!(seed(2) && seed(7)) },
  ];

  // Conf Semis & Finals — TBD
  const qfSlots: MatchupSlot[] = [
    { topTeam: null, bottomTeam: null, clickable: false },
    { topTeam: null, bottomTeam: null, clickable: false },
  ];
  const cfSlot: MatchupSlot = { topTeam: null, bottomTeam: null, clickable: false };

  return (
    <div className={`bk-conference bk-conference--${side}`}>
      {/* Play-In column */}
      <div className="bk-round bk-round--playin">
        <div className="bk-round-label">Play-In</div>
        <div className="bk-round-slots bk-round-slots--playin">
          {playInSlots.map((slot, i) => (
            <div key={i} className="bk-slot-wrap">
              <MatchupCard slot={slot} active={false} compact />
            </div>
          ))}
        </div>
      </div>

      <div className="bk-playin-arrow">→</div>

      {/* Round 1 */}
      <div className="bk-round bk-round--r1">
        <div className="bk-round-label">Round 1</div>
        <div className="bk-round-slots">
          {r1Slots.map((slot, i) => (
            <div key={i} className={`bk-slot-wrap bk-pair-${i % 2 === 0 ? 'top' : 'bottom'}`}>
              <MatchupCard
                slot={slot}
                active={isMatchupActive(selectedMatchup, slot.topTeam, slot.bottomTeam)}
                onClick={() =>
                  slot.topTeam && slot.bottomTeam &&
                  onSelectMatchup(slot.topTeam.teamId, slot.bottomTeam.teamId)
                }
              />
              {i % 2 === 0 && (
                <div className={`bk-connector bk-connector--top ${slotHasWinner(slot) ? 'bk-connector--bold' : ''}`} />
              )}
              {i % 2 === 1 && (
                <div className={`bk-connector bk-connector--bottom ${slotHasWinner(slot) ? 'bk-connector--bold' : ''}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conf Semis */}
      <div className="bk-round bk-round--qf">
        <div className="bk-round-label">Conf Semis</div>
        <div className="bk-round-slots">
          {qfSlots.map((slot, i) => (
            <div key={i} className={`bk-slot-wrap bk-pair-${i % 2 === 0 ? 'top' : 'bottom'}`}>
              <MatchupCard slot={slot} active={false} />
              {i % 2 === 0 && (
                <div className={`bk-connector bk-connector--top ${slotHasWinner(slot) ? 'bk-connector--bold' : ''}`} />
              )}
              {i % 2 === 1 && (
                <div className={`bk-connector bk-connector--bottom ${slotHasWinner(slot) ? 'bk-connector--bold' : ''}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conf Finals */}
      <div className="bk-round bk-round--cf">
        <div className="bk-round-label">Conf Finals</div>
        <div className="bk-round-slots">
          <div className="bk-slot-wrap">
            <MatchupCard slot={cfSlot} active={false} />
            <div className={`bk-connector bk-connector--finals ${slotHasWinner(cfSlot) ? 'bk-connector--bold' : ''}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FinalsSlot() {
  const slot: MatchupSlot = { topTeam: null, bottomTeam: null, clickable: false };
  return (
    <div className="bk-finals">
      <div className="bk-round-label">NBA Finals</div>
      <MatchupCard slot={slot} active={false} />
    </div>
  );
}

export default function PlayoffBracket({ teams, selectedMatchup, onSelectMatchup }: Props) {
  const [scale, setScale] = useState(1);
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(2.0, Math.max(0.4, s - e.deltaY * 0.001)));
  };

  const recenter = () => {
    if (wrapRef.current) {
      const el = wrapRef.current;
      const fitScale = el.clientWidth / el.scrollWidth;
      setScale(Math.max(0.4, fitScale));
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    }
  };

  return (
    <div className="bk-zoom-outer">
      <div className="bk-zoom-wrap" ref={wrapRef} onWheel={handleWheel}>
        <div
          className="bk-bracket"
          style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
        >
        <ConferenceBracket
          teams={teams}
          conference="East"
          side="east"
          selectedMatchup={selectedMatchup}
          onSelectMatchup={onSelectMatchup}
        />
        <FinalsSlot />
        <ConferenceBracket
          teams={teams}
          conference="West"
          side="west"
          selectedMatchup={selectedMatchup}
          onSelectMatchup={onSelectMatchup}
        />
        </div>
      </div>
      <button className="bk-recenter" onClick={recenter} title="Reset zoom and center bracket">
        ⊙ Recenter
      </button>
    </div>
  );
}
