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
import type { PlayerStats } from "../api/client";

interface Props {
  players: PlayerStats[];
}

const COLORS = ["#e63946", "#4895ef"];

const RADAR_STATS: { key: keyof PlayerStats; label: string; max: number }[] = [
  { key: "pts",            label: "PTS",     max: 35 },
  { key: "ast",            label: "AST",     max: 12 },
  { key: "reb",            label: "REB",     max: 14 },
  { key: "trueShootingPct",label: "TS%",     max: 70 },
  { key: "usagePct",       label: "USG%",    max: 40 },
  { key: "netRating",      label: "Net Rtg", max: 15 },
  { key: "stl",            label: "STL",     max: 3  },
  { key: "blk",            label: "BLK",     max: 3  },
];

export default function PlayerRadarChart({ players }: Props) {
  if (players.length === 0) return null;

  const data = RADAR_STATS.map(({ key, label, max }) => {
    const entry: Record<string, string | number> = { stat: label };
    players.forEach((p) => {
      const raw = p[key] as number;
      entry[p.name] = Math.min(Math.max(Math.round((raw / max) * 100), 0), 100);
      entry[`${p.name}_raw`] = raw;
    });
    return entry;
  });

  return (
    <div className="radar-chart-wrapper">
      <ResponsiveContainer width="100%" height={420}>
        <RadarChart data={data} margin={{ top: 24, right: 36, bottom: 24, left: 36 }}>
          <PolarGrid stroke="#1c2a3a" />
          <PolarAngleAxis
            dataKey="stat"
            tick={{ fill: "#5e7590", fontSize: 12, fontFamily: "'Exo 2', sans-serif", fontWeight: 700 }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          {players.map((p, i) => (
            <Radar
              key={p.playerId}
              name={p.name}
              dataKey={p.name}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ))}
          <Legend
            wrapperStyle={{ fontSize: "0.78rem", fontFamily: "'Exo 2', sans-serif", fontWeight: 600 }}
          />
          <Tooltip
            contentStyle={{
              background: "#0d1220",
              border: "1px solid #1c2a3a",
              borderRadius: "8px",
              fontSize: "0.8rem",
              fontFamily: "'DM Mono', monospace",
            }}
            formatter={(val: number, name: string, props: { payload?: Record<string, number> }) => {
              const raw = props.payload?.[`${name}_raw`] ?? val;
              return [`${raw}`, name];
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
