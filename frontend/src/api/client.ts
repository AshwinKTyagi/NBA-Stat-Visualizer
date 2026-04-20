import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8000/api" });

export interface Team {
  id: number;
  name: string;
  abbreviation: string;
}

export interface PlayoffTeam {
  teamId: number;
  teamName: string;
  abbreviation: string;
  conference: string;
  playoffRank: number;
  wins: number;
  losses: number;
  winPct: number;
}

export interface TeamStats {
  teamId: number;
  teamName: string;
  offRating: number;
  defRating: number;
  netRating: number;
  pace: number;
  trueShootingPct: number;
  astPct: number;
  rebPct: number;
  tovPct: number;
  efgPct: number;
  piePct: number;
}

export interface StatComparison {
  stat: string;
  key: string;
  team1Value: number;
  team2Value: number;
  advantage: string;
}

export interface MatchupData {
  team1: TeamStats;
  team2: TeamStats;
  comparison: StatComparison[];
}

export interface PlayerStats {
  playerId: number;
  name: string;
  teamId: number;
  pts: number;
  ast: number;
  reb: number;
  stl: number;
  blk: number;
  per: number;
  trueShootingPct: number;
  usagePct: number;
  offRating: number;
  defRating: number;
  netRating: number;
  astPct: number;
  tovPct: number;
  rebPct: number;
}

export interface RosterPlayer {
  playerId: number;
  name: string;
  number: string;
  position: string;
  age: string;
}

export const teamsApi = {
  getAll: () => api.get<Team[]>("/teams").then((r) => r.data),
  getPlayoffPicture: () => api.get<PlayoffTeam[]>("/teams/playoff-picture").then((r) => r.data),
  getStats: (teamId: number) => api.get<TeamStats>(`/teams/${teamId}/stats`).then((r) => r.data),
};

export const playersApi = {
  getRoster: (teamId: number) => api.get<RosterPlayer[]>(`/players/team/${teamId}`).then((r) => r.data),
  getStats: (playerId: number) => api.get<PlayerStats>(`/players/${playerId}/stats`).then((r) => r.data),
  compare: (playerIds: number[]) =>
    api.get<PlayerStats[]>(`/players/compare?player_ids=${playerIds.join(",")}`).then((r) => r.data),
};

export const matchupsApi = {
  getMatchup: (team1Id: number, team2Id: number) =>
    api.get<MatchupData>(`/matchups/${team1Id}/${team2Id}`).then((r) => r.data),
};
