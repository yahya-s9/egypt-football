"use client";

import { useState, useMemo } from "react";
import type { MatchWithScorers } from "@/lib/types";

function ResultBadge({ eg, opp }: { eg: number; opp: number }) {
  if (eg > opp) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">W</span>;
  if (eg < opp) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-eg-red">L</span>;
  return          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">D</span>;
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return date; }
}

export default function MatchTable({ matches }: { matches: MatchWithScorers[] }) {
  const [competition, setCompetition] = useState("all");
  const [result,      setResult]      = useState("all");
  const [homeAway,    setHomeAway]    = useState("all");
  const [search,      setSearch]      = useState("");

  const competitions = useMemo(() => {
    const seen = new Set<string>();
    matches.forEach(m => seen.add(m.competition));
    return ["all", ...Array.from(seen).sort()];
  }, [matches]);

  const filtered = useMemo(() => matches.filter(m => {
    if (competition !== "all" && m.competition !== competition) return false;
    if (homeAway === "home" && !m.isHome)  return false;
    if (homeAway === "away" && m.isHome)   return false;
    if (result === "w" && m.egyptGoals <= m.opponentGoals) return false;
    if (result === "d" && m.egyptGoals !== m.opponentGoals) return false;
    if (result === "l" && m.egyptGoals >= m.opponentGoals) return false;
    if (search && !m.opponent.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [matches, competition, result, homeAway, search]);

  const sel = "bg-white border border-eg-border rounded-lg px-3 py-2 text-xs text-eg-text outline-none focus:border-eg-red/50 focus:ring-2 focus:ring-eg-red/10 transition-all shadow-sm cursor-pointer";

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <input
          type="text"
          placeholder="Search opponent…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white border border-eg-border rounded-lg px-3 py-2 text-xs text-eg-text placeholder:text-eg-subtle outline-none focus:border-eg-red/50 focus:ring-2 focus:ring-eg-red/10 transition-all shadow-sm w-44"
        />
        <select value={competition} onChange={e => setCompetition(e.target.value)} className={sel}>
          {competitions.map(c => <option key={c} value={c}>{c === "all" ? "All competitions" : c}</option>)}
        </select>
        <select value={result} onChange={e => setResult(e.target.value)} className={sel}>
          <option value="all">All results</option>
          <option value="w">Wins only</option>
          <option value="d">Draws only</option>
          <option value="l">Losses only</option>
        </select>
        <select value={homeAway} onChange={e => setHomeAway(e.target.value)} className={sel}>
          <option value="all">Home & Away</option>
          <option value="home">Home</option>
          <option value="away">Away</option>
        </select>
        <span className="self-center text-xs text-eg-muted">{filtered.length} of {matches.length}</span>
      </div>

      <div className="table-scroll rounded-xl border border-eg-border shadow-sm bg-white overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-eg-surface-2 border-b border-eg-border">
              {["Date","Opponent","Score","Result","Competition","Venue","Scorers"].map((h, i) => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold tracking-widest uppercase text-eg-muted ${i >= 4 ? (i === 4 ? "hidden sm:table-cell" : i === 5 ? "hidden md:table-cell" : "hidden lg:table-cell") : ""} ${h === "Score" || h === "Result" ? "text-center" : "text-left"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-eg-muted text-sm">No matches found.</td></tr>
            )}
            {filtered.map((m, i) => {
              const scorers = m.lineup.filter(e => e.goals > 0);
              return (
                <tr key={m.id} className={`border-b border-eg-border last:border-0 hover:bg-eg-surface-2 transition-colors ${i % 2 === 1 ? "bg-eg-bg/40" : ""}`}>
                  <td className="px-4 py-3 text-eg-muted text-xs tabular-nums whitespace-nowrap">{formatDate(m.date)}</td>
                  <td className="px-4 py-3 font-semibold text-eg-text whitespace-nowrap">
                    {m.isHome ? "" : <span className="text-eg-muted text-xs mr-1">@</span>}{m.opponent}
                  </td>
                  <td className="px-4 py-3 text-center font-black tabular-nums whitespace-nowrap text-eg-text">{m.egyptGoals}–{m.opponentGoals}</td>
                  <td className="px-4 py-3 text-center"><ResultBadge eg={m.egyptGoals} opp={m.opponentGoals} /></td>
                  <td className="px-4 py-3 text-eg-muted text-xs hidden sm:table-cell whitespace-nowrap">{m.competition}</td>
                  <td className="px-4 py-3 text-eg-muted text-xs hidden md:table-cell">{m.venue}{m.city ? `, ${m.city}` : ""}</td>
                  <td className="px-4 py-3 text-xs text-eg-muted hidden lg:table-cell">
                    {scorers.length > 0
                      ? scorers.map(e => e.goals > 1 ? `${e.playerName} (${e.goals})` : e.playerName).join(", ")
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
