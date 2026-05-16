import type { Player, Match, Goal } from "./types";

export const MOCK_PLAYERS: Player[] = [
  {
    id: "hossam-hassan",
    name: "Hossam Hassan",
    birthYear: 1966,
    birthCity: "Kafr El Sheikh",
    caps: 184,
    primaryCountry: "Egypt",
    photoUrl: "",
    clubs: [
      { clubName: "Al Ahly", clubCountry: "Egypt", yearsActive: "1984–1992" },
      { clubName: "Zamalek", clubCountry: "Egypt", yearsActive: "1992–2001" },
      { clubName: "Al Ahly", clubCountry: "Egypt", yearsActive: "2001–2006" },
    ],
  },
  {
    id: "ahmed-hassan",
    name: "Ahmed Hassan",
    birthYear: 1975,
    birthCity: "Kafr El Sheikh",
    caps: 184,
    primaryCountry: "Egypt",
    photoUrl: "",
    clubs: [
      { clubName: "Zamalek", clubCountry: "Egypt", yearsActive: "1993–2000" },
      { clubName: "Beşiktaş", clubCountry: "Turkey", yearsActive: "2000–2005" },
      { clubName: "Al Ahly", clubCountry: "Egypt", yearsActive: "2005–2012" },
    ],
  },
  {
    id: "essam-el-hadary",
    name: "Essam El-Hadary",
    birthYear: 1973,
    birthCity: "Damietta",
    caps: 169,
    primaryCountry: "Egypt",
    photoUrl: "",
    clubs: [
      { clubName: "Al Ahly", clubCountry: "Egypt", yearsActive: "1993–2010" },
      { clubName: "Sion", clubCountry: "Switzerland", yearsActive: "2010–2011" },
      { clubName: "Al-Taawoun", clubCountry: "Saudi Arabia", yearsActive: "2016–2018" },
    ],
  },
  {
    id: "ahmed-fathy",
    name: "Ahmed Fathy",
    birthYear: 1984,
    birthCity: "Port Said",
    caps: 105,
    primaryCountry: "Egypt",
    photoUrl: "",
    clubs: [
      { clubName: "Al Masry", clubCountry: "Egypt", yearsActive: "2003–2007" },
      { clubName: "Hull City", clubCountry: "England", yearsActive: "2007–2010" },
      { clubName: "Al Ahly", clubCountry: "Egypt", yearsActive: "2010–2019" },
    ],
  },
  {
    id: "mohamed-salah",
    name: "Mohamed Salah",
    birthYear: 1992,
    birthCity: "Nagrig",
    caps: 103,
    primaryCountry: "Egypt",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Mohamed_Salah_2018.jpg/220px-Mohamed_Salah_2018.jpg",
    clubs: [
      { clubName: "El Mokawloon", clubCountry: "Egypt", yearsActive: "2010–2012" },
      { clubName: "Chelsea", clubCountry: "England", yearsActive: "2014–2016" },
      { clubName: "Roma", clubCountry: "Italy", yearsActive: "2016–2017" },
      { clubName: "Liverpool", clubCountry: "England", yearsActive: "2017–2025" },
    ],
  },
  {
    id: "wael-gomaa",
    name: "Wael Gomaa",
    birthYear: 1981,
    birthCity: "Cairo",
    caps: 69,
    primaryCountry: "Egypt",
    photoUrl: "",
    clubs: [{ clubName: "Al Ahly", clubCountry: "Egypt", yearsActive: "2000–2012" }],
  },
  {
    id: "amr-zaki",
    name: "Amr Zaki",
    birthYear: 1983,
    birthCity: "Damietta",
    caps: 56,
    primaryCountry: "Egypt",
    photoUrl: "",
    clubs: [
      { clubName: "Zamalek", clubCountry: "Egypt", yearsActive: "2002–2007" },
      { clubName: "Wigan Athletic", clubCountry: "England", yearsActive: "2007–2009" },
      { clubName: "Hull City", clubCountry: "England", yearsActive: "2009–2010" },
    ],
  },
  {
    id: "hossam-ghaly",
    name: "Hossam Ghaly",
    birthYear: 1981,
    birthCity: "Mansoura",
    caps: 60,
    primaryCountry: "Egypt",
    photoUrl: "",
    clubs: [
      { clubName: "Al Ahly", clubCountry: "Egypt", yearsActive: "2000–2007" },
      { clubName: "Tottenham Hotspur", clubCountry: "England", yearsActive: "2006–2009" },
      { clubName: "Feyenoord", clubCountry: "Netherlands", yearsActive: "2009–2011" },
    ],
  },
  {
    id: "mohamed-aboutrika",
    name: "Mohamed Aboutrika",
    birthYear: 1978,
    birthCity: "Cairo",
    caps: 101,
    primaryCountry: "Egypt",
    photoUrl: "",
    clubs: [{ clubName: "Al Ahly", clubCountry: "Egypt", yearsActive: "2000–2013" }],
  },
];

export const MOCK_MATCHES: Match[] = [
  { id: "1920-08-28-italy", date: "1920-08-28", opponent: "Italy", egyptGoals: 1, opponentGoals: 4, competition: "Olympics 1920", venue: "Stade Olympique d'Anvers", city: "Antwerp", isHome: false },
  { id: "1934-05-27-hungary", date: "1934-05-27", opponent: "Hungary", egyptGoals: 2, opponentGoals: 4, competition: "FIFA World Cup 1934", venue: "Stadio Nazionale del PNF", city: "Rome", isHome: false },
  { id: "1957-02-16-ethiopia", date: "1957-02-16", opponent: "Ethiopia", egyptGoals: 4, opponentGoals: 0, competition: "AFCON 1957 Final", venue: "Municipal Stadium", city: "Khartoum", isHome: false },
  { id: "1986-03-13-cameroon", date: "1986-03-13", opponent: "Cameroon", egyptGoals: 0, opponentGoals: 0, competition: "AFCON 1986 Final", venue: "Cairo International Stadium", city: "Cairo", isHome: true },
  { id: "1998-02-28-south-africa", date: "1998-02-28", opponent: "South Africa", egyptGoals: 2, opponentGoals: 0, competition: "AFCON 1998 Final", venue: "Ouagadougou Stadium", city: "Ouagadougou", isHome: false },
  { id: "2006-02-10-ivory-coast", date: "2006-02-10", opponent: "Ivory Coast", egyptGoals: 0, opponentGoals: 0, competition: "AFCON 2006 Final", venue: "Cairo International Stadium", city: "Cairo", isHome: true },
  { id: "2008-02-10-cameroon", date: "2008-02-10", opponent: "Cameroon", egyptGoals: 1, opponentGoals: 0, competition: "AFCON 2008 Final", venue: "Estadio Nacional de Ghana", city: "Accra", isHome: false },
  { id: "2010-01-31-ghana", date: "2010-01-31", opponent: "Ghana", egyptGoals: 1, opponentGoals: 0, competition: "AFCON 2010 Final", venue: "Estadio de Bata", city: "Bata", isHome: false },
  { id: "2018-06-15-uruguay", date: "2018-06-15", opponent: "Uruguay", egyptGoals: 0, opponentGoals: 1, competition: "FIFA World Cup 2018", venue: "Ekaterinburg Arena", city: "Yekaterinburg", isHome: false },
  { id: "2018-06-19-russia", date: "2018-06-19", opponent: "Russia", egyptGoals: 1, opponentGoals: 3, competition: "FIFA World Cup 2018", venue: "Saint Petersburg Stadium", city: "St Petersburg", isHome: false },
  { id: "2018-06-25-saudi-arabia", date: "2018-06-25", opponent: "Saudi Arabia", egyptGoals: 2, opponentGoals: 2, competition: "FIFA World Cup 2018", venue: "Volgograd Arena", city: "Volgograd", isHome: false },
  { id: "2022-01-11-nigeria", date: "2022-01-11", opponent: "Nigeria", egyptGoals: 1, opponentGoals: 0, competition: "AFCON 2021", venue: "Stade Roumde Adjia", city: "Garoua", isHome: false },
  { id: "2022-02-06-senegal", date: "2022-02-06", opponent: "Senegal", egyptGoals: 0, opponentGoals: 0, competition: "AFCON 2021 Final", venue: "Stade d'Olembe", city: "Yaoundé", isHome: false },
  { id: "2025-06-20-morocco", date: "2025-06-20", opponent: "Morocco", egyptGoals: 1, opponentGoals: 2, competition: "WCQ 2026", venue: "Cairo International Stadium", city: "Cairo", isHome: true },
  { id: "2025-09-09-sierra-leone", date: "2025-09-09", opponent: "Sierra Leone", egyptGoals: 3, opponentGoals: 0, competition: "WCQ 2026", venue: "Cairo International Stadium", city: "Cairo", isHome: true },
];

export const MOCK_GOALS: Goal[] = [
  { matchId: "1957-02-16-ethiopia", playerId: "hossam-hassan", playerName: "Hossam Hassan", type: "goal", minute: 12 },
  { matchId: "1957-02-16-ethiopia", playerId: "hossam-hassan", playerName: "Hossam Hassan", type: "goal", minute: 44 },
  { matchId: "1998-02-28-south-africa", playerId: "hossam-hassan", playerName: "Hossam Hassan", type: "goal", minute: 18 },
  { matchId: "1998-02-28-south-africa", playerId: "hossam-hassan", playerName: "Hossam Hassan", type: "goal", minute: 63 },
  { matchId: "2008-02-10-cameroon", playerId: "mohamed-aboutrika", playerName: "Mohamed Aboutrika", type: "goal", minute: 77 },
  { matchId: "2010-01-31-ghana", playerId: "mohamed-aboutrika", playerName: "Mohamed Aboutrika", type: "goal", minute: 85 },
  { matchId: "2010-01-31-ghana", playerId: "ahmed-hassan", playerName: "Ahmed Hassan", type: "assist", minute: 85 },
  { matchId: "2018-06-19-russia", playerId: "mohamed-salah", playerName: "Mohamed Salah", type: "goal", minute: 73 },
  { matchId: "2018-06-25-saudi-arabia", playerId: "mohamed-salah", playerName: "Mohamed Salah", type: "goal", minute: 22 },
  { matchId: "2018-06-25-saudi-arabia", playerId: "amr-zaki", playerName: "Amr Zaki", type: "goal", minute: 45 },
  { matchId: "2022-01-11-nigeria", playerId: "mohamed-salah", playerName: "Mohamed Salah", type: "goal", minute: 57 },
  { matchId: "2025-06-20-morocco", playerId: "mohamed-salah", playerName: "Mohamed Salah", type: "goal", minute: 11 },
  { matchId: "2025-09-09-sierra-leone", playerId: "mohamed-salah", playerName: "Mohamed Salah", type: "goal", minute: 9 },
  { matchId: "2025-09-09-sierra-leone", playerId: "mohamed-salah", playerName: "Mohamed Salah", type: "goal", minute: 55 },
  { matchId: "2025-09-09-sierra-leone", playerId: "amr-zaki", playerName: "Amr Zaki", type: "goal", minute: 78 },
];

// mockSheetData keys must match the actual Google Sheet tab names exactly.
// "Players" (capital P) is the real tab name.
// matches/goals tabs are empty so these are their mock row objects.
export const mockSheetData: Record<string, Record<string, string>[]> = {
  // Matches mock rows — column names mirror what the user should add as headers
  matches: MOCK_MATCHES.map((m) => ({
    date: m.date,
    opponent: m.opponent,
    egyptGoals: String(m.egyptGoals),
    opponentGoals: String(m.opponentGoals),
    competition: m.competition,
    venue: m.venue,
    city: m.city,
    isHome: String(m.isHome),
  })),
  // Goals mock rows — date + opponent identify the match, no raw IDs needed
  goals: MOCK_GOALS.map((g) => {
    // Reverse-engineer date and opponent from matchId (format: "YYYY-MM-DD-opponent-slug")
    const match = MOCK_MATCHES.find((m) => m.id === g.matchId);
    return {
      date: match?.date ?? "",
      opponent: match?.opponent ?? "",
      playerName: g.playerName,
      type: g.type,
      minute: String(g.minute),
    };
  }),
  // Players mock rows — column names match the real "Players" tab headers
  Players: MOCK_PLAYERS.map((p) => ({
    playerName: p.name,
    playerBirthYear: String(p.birthYear),
    playerBirthCity: p.birthCity,
    playerCountries: p.primaryCountry,
    playerClubs: p.clubs.map((c) => c.clubName).join(", "),
    playerCaps: String(p.caps),
    photoUrl: p.photoUrl,
  })),
};
