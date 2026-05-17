"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Player } from "@/lib/types";
import { toSlug } from "@/lib/data";

type SortKey = "name" | "caps" | "birthYear";

export default function PlayerTable({ players }: { players: Player[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort]     = useState<SortKey>("caps");
  const [dir, setDir]       = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return players
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.nickname.toLowerCase().includes(q) ||
        p.birthCity.toLowerCase().includes(q) ||
        p.clubs.some(c => c.clubName.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        const av = a[sort] as string | number;
        const bv = b[sort] as string | number;
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return dir === "asc" ? cmp : -cmp;
      });
  }, [players, search, sort, dir]);

  function toggleSort(key: SortKey) {
    if (sort === key) setDir(d => d === "asc" ? "desc" : "asc");
    else { setSort(key); setDir("desc"); }
  }

  function Arrow({ col }: { col: SortKey }) {
    if (sort !== col) return <span className="text-gray-300 ml-1">⇅</span>;
    return <span className="text-eg-red ml-1">{dir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Search players, clubs, cities…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-72 bg-white border border-eg-border rounded-lg px-3 py-2 text-sm text-eg-text placeholder:text-eg-subtle outline-none focus:border-eg-red/50 focus:ring-2 focus:ring-eg-red/10 transition-all shadow-sm"
        />
        <span className="text-xs text-eg-muted">{filtered.length} of {players.length} players</span>
      </div>

      <div className="table-scroll rounded-xl border border-eg-border shadow-sm bg-white overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-eg-surface-2 border-b border-eg-border">
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase text-eg-muted w-10">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase text-eg-muted cursor-pointer hover:text-eg-text select-none" onClick={() => toggleSort("name")}>
                Player <Arrow col="name" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase text-eg-muted cursor-pointer hover:text-eg-text select-none" onClick={() => toggleSort("birthYear")}>
                Born <Arrow col="birthYear" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase text-eg-muted hidden sm:table-cell">City</th>
              <th className="px-4 py-3 text-right text-xs font-semibold tracking-widest uppercase text-eg-muted cursor-pointer hover:text-eg-text select-none" onClick={() => toggleSort("caps")}>
                Caps <Arrow col="caps" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase text-eg-muted hidden md:table-cell">Clubs</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-eg-muted text-sm">No players found.</td>
              </tr>
            )}
            {filtered.map((player, i) => (
              <tr key={player.id} className="border-b border-eg-border last:border-0 hover:bg-eg-surface-2 transition-colors">
                <td className="px-4 py-3 text-eg-subtle tabular-nums text-xs">{i + 1}</td>
                <td className="px-4 py-3 font-semibold">
                  <Link href={`/players/${toSlug(player.name)}`} className="text-eg-text hover:text-eg-red transition-colors">
                    {player.name}
                  </Link>
                  {player.nickname && (
                    <span className="ml-2 text-eg-muted text-xs">"{player.nickname}"</span>
                  )}
                </td>
                <td className="px-4 py-3 text-eg-muted tabular-nums">{player.birthYear || "—"}</td>
                <td className="px-4 py-3 text-eg-muted hidden sm:table-cell">{player.birthCity || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-block bg-eg-red text-white font-bold text-xs px-2.5 py-0.5 rounded-full tabular-nums">
                    {player.caps}
                  </span>
                </td>
                <td className="px-4 py-3 text-eg-muted text-xs hidden md:table-cell">
                  {player.clubs.map(c => c.clubName).join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
