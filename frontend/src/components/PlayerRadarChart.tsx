import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { PlayerStats } from "../api/client";

interface Props {
  players: PlayerStats[];
}

const COLORS = ["#e63946", "#457b9d"];

const RADAR_STATS: { key: keyof PlayerStats; label: string; max: number }[] = [
  { key: "pts", label: "PTS", max: 35 },
  { key: "ast", label: "AST", max: 12 },
  { key: "reb", label: "REB", max: 14 },
  { key: "trueShootingPct", label: "TS%", max: 70 },
  { key: "usagePct", label: "USG%", max: 40 },
  { key: "netRating", label: "Net Rtg", max: 15 },
  { key: "stl", label: "STL", max: 3 },
  { key: "blk", label: "BLK", max: 3 },
];

export default function PlayerRadarChart({ players }: Props) {
  if (players.length === 0) return null;

  const data = RADAR_STATS.map(({ key, label, max }) => {
    const entry: Record<string, string | number> = { stat: label };
    players.forEach((p) => {
      const raw = p[key] as number;
      entry[p.name] = Math.min(Math.round((raw / max) * 100), 100);
    });
    return entry;
  });

  return (
    <div className="radar-chart-wrapper">
      <ResponsiveContainer width="100%" height={420}>
        <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid />
          <PolarAngleAxis dataKey="stat" tick={{ fill: "#ccc", fontSize: 13 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          {players.map((p, i) => (
            <Radar
              key={p.playerId}
              name={p.name}
              dataKey={p.name}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.25}
            />
          ))}
          <Legend />
          <Tooltip formatter={(val: number, name: string) => [`${val}`, name]} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
