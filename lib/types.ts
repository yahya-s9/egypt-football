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
  caps: number;           // auto-calculated from lineup data; falls back to playerCaps column
  goals: number;          // auto-calculated from lineup data; falls back to playerGoals column
  primaryCountry: string;
  countries: string[];
  photoUrl: string;
  transfermarktUrl: string;
  position: string;       // GK | DEF | MF | FW
  careerStart: string;    // e.g. "1985" — first Egypt appearance
  careerEnd: string;      // e.g. "2006" — last Egypt appearance ("" = still active)
  fullName: string;       // e.g. "Mostafa Ahmed Abdelaziz Mohamed Shobeir" — shown on detail page
  nickname: string;       // e.g. "Oufa" — also accepted in lineup column
  clubs: Club[];
};

// One entry per player in the starting XI for a match.
// Format in sheet:  "Mohamed Salah (2), Mostafa Mohamed (1), Omar Marmoush"
// goals = 0 means the player appeared but didn't score.
export type LineupEntry = {
  playerName: string;
  goals: number;
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
  gk: LineupEntry[];          // "gk" column
  defenders: LineupEntry[];   // "defenders" column
  midfielders: LineupEntry[]; // "midfielders" column
  attackers: LineupEntry[];   // "attackers" column
  subs: LineupEntry[];        // "subs" column
  lineup: LineupEntry[];      // computed: gk + defenders + midfielders + attackers
};

export type MatchWithScorers = Match; // lineup already contains scorer info
export type PlayerWithAppearances = Player & { appearances: Match[] };
