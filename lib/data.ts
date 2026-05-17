import { fetchSheet } from "./sheets";
import type { Player, Match, Goal, MatchWithScorers, PlayerWithAppearances } from "./types";

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Players ─────────────────────────────────────────────────────────────────
// Sheet tab: "Players"
// Headers:   playerName · playerBirthYear · playerBirthCity · playerCountries · playerClubs · playerCaps
// Optional:  photoUrl

export async function getPlayers(): Promise<Player[]> {
  const rows = await fetchSheet("Players");
  return rows
    .filter((r) => r.playerName?.trim())
    .map((row) => {
      const name = row.playerName.trim();
      const countries = (row.playerCountries ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const clubs = (row.playerClubs ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return {
        id: toSlug(name),
        name,
        birthYear: parseInt(row.playerBirthYear) || 0,
        birthCity: row.playerBirthCity?.trim() ?? "",
        caps: parseInt(row.playerCaps) || 0,
        primaryCountry: countries[0] ?? "Egypt",
        countries,
        photoUrl: row.photoUrl?.trim() ?? "",
        transfermarktUrl: row.transfermarktUrl?.trim() ?? "",
        clubs: clubs.map((c) => ({ clubName: c, clubCountry: "", yearsActive: "" })),
      };
    });
}

// ── Matches ──────────────────────────────────────────────────────────────────
// Sheet tab: "matches"
// Headers:   date · opponent · egyptGoals · opponentGoals · competition · venue · city · isHome
// (no manual id column — generated automatically from date + opponent)

export function matchId(date: string, opponent: string): string {
  return `${date}-${toSlug(opponent)}`;
}

export async function getMatches(): Promise<Match[]> {
  const rows = await fetchSheet("matches");
  return rows
    .filter((r) => r.date && r.opponent)
    .map((row) => ({
      id: matchId(row.date, row.opponent),
      date: row.date.trim(),
      opponent: row.opponent.trim(),
      egyptGoals: parseInt(row.egyptGoals) || 0,
      opponentGoals: parseInt(row.opponentGoals) || 0,
      competition: row.competition?.trim() ?? "",
      venue: row.venue?.trim() ?? "",
      city: row.city?.trim() ?? "",
      isHome: ["true", "yes", "1"].includes((row.isHome ?? "").toLowerCase()),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ── Goals ────────────────────────────────────────────────────────────────────
// Sheet tab: "goals"
// Headers:   date · opponent · playerName · type · minute
// (date + opponent identify the match; playerName identifies the scorer)
// type values: goal | assist | og

export async function getGoals(): Promise<Goal[]> {
  const rows = await fetchSheet("goals");
  return rows
    .filter((r) => r.date && r.opponent && r.playerName)
    .map((row) => ({
      matchId: matchId(row.date, row.opponent),
      playerId: toSlug(row.playerName),
      playerName: row.playerName.trim(),
      type: (["goal", "assist", "og"].includes(row.type) ? row.type : "goal") as Goal["type"],
      minute: parseInt(row.minute) || 0,
    }));
}

// ── Joined helpers ───────────────────────────────────────────────────────────

export async function getMatchesWithScorers(): Promise<MatchWithScorers[]> {
  const [matches, goals] = await Promise.all([getMatches(), getGoals()]);
  return matches.map((m) => ({
    ...m,
    scorers: goals.filter((g) => g.matchId === m.id),
  }));
}

export async function getPlayerBySlug(slug: string): Promise<PlayerWithAppearances | null> {
  const [players, matchesWithScorers] = await Promise.all([
    getPlayers(),
    getMatchesWithScorers(),
  ]);
  const player = players.find((p) => p.id === slug);
  if (!player) return null;
  const appearances = matchesWithScorers.filter((m) =>
    m.scorers.some((g) => toSlug(g.playerName) === slug)
  );
  return { ...player, appearances };
}

// ── Records ──────────────────────────────────────────────────────────────────

export async function getRecords() {
  const [players, matchesWithScorers] = await Promise.all([
    getPlayers(),
    getMatchesWithScorers(),
  ]);
  const goals = matchesWithScorers.flatMap((m) => m.scorers);

  const wins   = matchesWithScorers.filter((m) => m.egyptGoals > m.opponentGoals).length;
  const draws  = matchesWithScorers.filter((m) => m.egyptGoals === m.opponentGoals).length;
  const losses = matchesWithScorers.filter((m) => m.egyptGoals < m.opponentGoals).length;

  // Goals by player name slug
  const goalCounts: Record<string, number> = {};
  goals.filter((g) => g.type === "goal").forEach((g) => {
    const key = toSlug(g.playerName);
    goalCounts[key] = (goalCounts[key] ?? 0) + 1;
  });

  const topScorers = players
    .map((p) => ({ player: p, goals: goalCounts[p.id] ?? 0 }))
    .filter((x) => x.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 20);

  const mostCapped = [...players].sort((a, b) => b.caps - a.caps).slice(0, 20);

  // By competition
  const compMap: Record<string, { p: number; w: number; d: number; l: number; gf: number; ga: number }> = {};
  for (const m of matchesWithScorers) {
    if (!compMap[m.competition]) compMap[m.competition] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
    const c = compMap[m.competition];
    c.p++; c.gf += m.egyptGoals; c.ga += m.opponentGoals;
    if (m.egyptGoals > m.opponentGoals) c.w++;
    else if (m.egyptGoals === m.opponentGoals) c.d++;
    else c.l++;
  }
  const byCompetition = Object.entries(compMap)
    .map(([name, s]) => ({ name, ...s }))
    .sort((a, b) => b.p - a.p);

  // Head-to-head
  const oppMap: Record<string, { p: number; w: number; d: number; l: number }> = {};
  for (const m of matchesWithScorers) {
    if (!oppMap[m.opponent]) oppMap[m.opponent] = { p: 0, w: 0, d: 0, l: 0 };
    const o = oppMap[m.opponent];
    o.p++;
    if (m.egyptGoals > m.opponentGoals) o.w++;
    else if (m.egyptGoals === m.opponentGoals) o.d++;
    else o.l++;
  }
  const headToHead = Object.entries(oppMap)
    .map(([opponent, s]) => ({ opponent, ...s }))
    .sort((a, b) => b.p - a.p)
    .slice(0, 15);

  return { totalMatches: matchesWithScorers.length, wins, draws, losses, mostCapped, topScorers, byCompetition, headToHead };
}
