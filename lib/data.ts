import { fetchSheet } from "./sheets";
import type { Player, Match, LineupEntry, PlayerWithAppearances } from "./types";

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Lineup parser ────────────────────────────────────────────────────────────
// Parses: "Mohamed Salah (2), Mostafa Mohamed (1), Omar Marmoush"
// into:   [{ playerName: "Mohamed Salah", goals: 2 }, ...]

export function parseLineup(str: string): LineupEntry[] {
  if (!str?.trim()) return [];
  return str
    .split(",")
    .map(entry => {
      const trimmed = entry.trim();
      const m = trimmed.match(/^(.+?)(?:\s*\((\d+)\))?$/);
      if (!m) return null;
      return { playerName: m[1].trim(), goals: m[2] ? parseInt(m[2]) : 0 };
    })
    .filter((e): e is LineupEntry => e !== null && e.playerName.length > 0);
}

// ── Matches ──────────────────────────────────────────────────────────────────
// Sheet tab: "matches"
// Columns:   date · opponent · egyptGoals · opponentGoals · competition · venue · city · isHome · lineup

export function matchId(date: string, opponent: string): string {
  return `${date}-${toSlug(opponent)}`;
}

export async function getMatches(): Promise<Match[]> {
  const rows = await fetchSheet("matches");
  return rows
    .filter(r => r.date && r.opponent)
    .map(row => ({
      id: matchId(row.date, row.opponent),
      date: row.date.trim(),
      opponent: row.opponent.trim(),
      egyptGoals: parseInt(row.egyptGoals) || 0,
      opponentGoals: parseInt(row.opponentGoals) || 0,
      competition: row.competition?.trim() ?? "",
      venue: row.venue?.trim() ?? "",
      city: row.city?.trim() ?? "",
      isHome: ["true", "yes", "1"].includes((row.isHome ?? "").toLowerCase()),
      lineup: parseLineup(row.lineup ?? ""),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ── Players ──────────────────────────────────────────────────────────────────
// Sheet tab: "Players"
// Columns:   playerName · playerBirthYear · playerBirthCity · playerCountries
//            · playerClubs · playerCaps · photoUrl · transfermarktUrl
//
// Caps are auto-calculated by counting match lineup appearances.
// The playerCaps column is used as a fallback for players with no lineup data.

export async function getPlayers(): Promise<Player[]> {
  const [playerRows, matches] = await Promise.all([
    fetchSheet("Players"),
    getMatches(),
  ]);

  // Count appearances per player name slug from lineup data
  const capCounts: Record<string, number> = {};
  const goalCounts: Record<string, number> = {};
  for (const m of matches) {
    for (const e of m.lineup) {
      const key = toSlug(e.playerName);
      capCounts[key] = (capCounts[key] ?? 0) + 1;
      goalCounts[key] = (goalCounts[key] ?? 0) + e.goals;
    }
  }

  return playerRows
    .filter(r => r.playerName?.trim())
    .map(row => {
      const name = row.playerName.trim();
      const slug = toSlug(name);
      const countries = (row.playerCountries ?? "")
        .split(",").map(s => s.trim()).filter(Boolean);
      const clubs = (row.playerClubs ?? "")
        .split(",").map(s => s.trim()).filter(Boolean);

      const capsFromLineup = capCounts[slug] ?? 0;
      const capsFromSheet  = parseInt(row.playerCaps) || 0;

      return {
        id: slug,
        name,
        birthYear: parseInt(row.playerBirthYear) || 0,
        birthCity: row.playerBirthCity?.trim() ?? "",
        caps: capsFromLineup > 0 ? capsFromLineup : capsFromSheet,
        primaryCountry: countries[0] ?? "Egypt",
        countries,
        photoUrl: row.photoUrl?.trim() ?? "",
        transfermarktUrl: row.transfermarktUrl?.trim() ?? "",
        clubs: clubs.map(c => ({ clubName: c, clubCountry: "", yearsActive: "" })),
      };
    });
}

// ── Joined helpers ────────────────────────────────────────────────────────────

// Kept for API compatibility — Match already has lineup so this is a no-op join.
export async function getMatchesWithScorers() {
  return getMatches();
}

export async function getPlayerBySlug(slug: string): Promise<PlayerWithAppearances | null> {
  const [players, matches] = await Promise.all([getPlayers(), getMatches()]);
  const player = players.find(p => p.id === slug);
  if (!player) return null;
  const appearances = matches.filter(m =>
    m.lineup.some(e => toSlug(e.playerName) === slug)
  );
  return { ...player, appearances };
}

// ── Records ───────────────────────────────────────────────────────────────────

export async function getRecords() {
  const [players, matches] = await Promise.all([getPlayers(), getMatches()]);

  const wins   = matches.filter(m => m.egyptGoals > m.opponentGoals).length;
  const draws  = matches.filter(m => m.egyptGoals === m.opponentGoals).length;
  const losses = matches.filter(m => m.egyptGoals < m.opponentGoals).length;

  // Goals per player from lineup data
  const goalCounts: Record<string, number> = {};
  for (const m of matches) {
    for (const e of m.lineup) {
      if (e.goals > 0) {
        const key = toSlug(e.playerName);
        goalCounts[key] = (goalCounts[key] ?? 0) + e.goals;
      }
    }
  }

  const topScorers = players
    .map(p => ({ player: p, goals: goalCounts[p.id] ?? 0 }))
    .filter(x => x.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 20);

  const mostCapped = [...players].sort((a, b) => b.caps - a.caps).slice(0, 20);

  // By competition
  const compMap: Record<string, { p: number; w: number; d: number; l: number; gf: number; ga: number }> = {};
  for (const m of matches) {
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
  for (const m of matches) {
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

  return { totalMatches: matches.length, wins, draws, losses, mostCapped, topScorers, byCompetition, headToHead };
}
