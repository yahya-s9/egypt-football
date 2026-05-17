export type Club = {
  clubName: string;
  clubCountry: string;
  yearsActive: string;
};

export type Player = {
  id: string;
  name: string;
  birthYear: number;
  birthCity: string;
  caps: number;
  primaryCountry: string;
  countries: string[];
  photoUrl: string;
  transfermarktUrl: string;
  clubs: Club[];
};

export type Match = {
  id: string;
  date: string;           // YYYY-MM-DD
  opponent: string;
  egyptGoals: number;
  opponentGoals: number;
  competition: string;
  venue: string;
  city: string;
  isHome: boolean;
};

export type Goal = {
  matchId: string;
  playerId: string;
  playerName: string;
  type: "goal" | "assist" | "og";
  minute: number;
};

export type MatchWithScorers = Match & { scorers: Goal[] };
export type PlayerWithAppearances = Player & { appearances: MatchWithScorers[] };
