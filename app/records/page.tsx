import type { Metadata } from "next";
import Link from "next/link";
import { getRecords, toSlug } from "@/lib/data";

export const metadata: Metadata = { title: "All-Time Records" };
export const revalidate = 3600;

export default async function RecordsPage() {
  const { totalMatches, wins, draws, losses, mostCapped, topScorers, byCompetition, headToHead } = await getRecords();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="section-heading mb-2">All-Time Records</h1>
        <p className="text-2xl sm:text-3xl font-black text-eg-text">Statistics & leaderboards</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Matches", value: totalMatches, cls: "text-eg-text" },
          { label: "Wins",          value: wins,         cls: "text-green-600" },
          { label: "Draws",         value: draws,        cls: "text-amber-500" },
          { label: "Losses",        value: losses,       cls: "text-eg-red" },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-eg-border shadow-sm p-5 text-center">
            <div className={`text-4xl font-black ${cls}`}>{value}</div>
            <div className="text-xs text-eg-muted uppercase tracking-wider mt-2">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Most capped */}
        <section className="bg-white rounded-xl border border-eg-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-eg-border">
            <h2 className="section-heading">Most Capped Players</h2>
          </div>
          {mostCapped.map((p, i) => (
            <div key={p.id} className={`flex items-center gap-4 px-6 py-3 border-b border-eg-border last:border-0 hover:bg-eg-surface-2 transition-colors ${i % 2 === 1 ? "bg-eg-bg/40" : ""}`}>
              <span className="text-eg-muted tabular-nums text-xs w-6 shrink-0">{i + 1}</span>
              <Link href={`/players/${toSlug(p.name)}`} className="flex-1 font-semibold text-sm text-eg-text hover:text-eg-red transition-colors truncate">
                {p.name}
              </Link>
              <span className="bg-eg-red text-white font-bold text-xs px-2.5 py-1 rounded-full tabular-nums shrink-0">
                {p.caps}
              </span>
            </div>
          ))}
        </section>

        {/* Top scorers */}
        <section className="bg-white rounded-xl border border-eg-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-eg-border">
            <h2 className="section-heading">Top Scorers</h2>
          </div>
          {topScorers.length === 0 && (
            <p className="px-6 py-5 text-eg-muted text-sm">No scorer data yet.</p>
          )}
          {topScorers.map(({ player, goals }, i) => (
            <div key={player.id} className={`flex items-center gap-4 px-6 py-3 border-b border-eg-border last:border-0 hover:bg-eg-surface-2 transition-colors ${i % 2 === 1 ? "bg-eg-bg/40" : ""}`}>
              <span className="text-eg-muted tabular-nums text-xs w-6 shrink-0">{i + 1}</span>
              <Link href={`/players/${toSlug(player.name)}`} className="flex-1 font-semibold text-sm text-eg-text hover:text-eg-red transition-colors truncate">
                {player.name}
              </Link>
              <span className="bg-amber-100 text-amber-700 font-bold text-xs px-2.5 py-1 rounded-full tabular-nums shrink-0">
                ⚽ {goals}
              </span>
            </div>
          ))}
        </section>
      </div>

      {/* By competition */}
      <section className="bg-white rounded-xl border border-eg-border shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-eg-border">
          <h2 className="section-heading">Record by Competition</h2>
        </div>
        <div className="table-scroll">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-eg-surface-2 border-b border-eg-border">
                {["Competition","P","W","D","L","GF","GA","GD"].map(h => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold tracking-widest uppercase text-eg-muted ${h === "Competition" ? "text-left" : "text-center"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byCompetition.map((c, i) => (
                <tr key={c.name} className={`border-b border-eg-border last:border-0 hover:bg-eg-surface-2 transition-colors ${i % 2 === 1 ? "bg-eg-bg/40" : ""}`}>
                  <td className="px-4 py-3 font-semibold text-eg-text">{c.name}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-eg-muted">{c.p}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-green-600 font-semibold">{c.w}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-amber-500 font-semibold">{c.d}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-eg-red font-semibold">{c.l}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-eg-muted">{c.gf}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-eg-muted">{c.ga}</td>
                  <td className={`px-4 py-3 text-center tabular-nums font-semibold ${c.gf-c.ga > 0 ? "text-green-600" : c.gf-c.ga < 0 ? "text-eg-red" : "text-eg-muted"}`}>
                    {c.gf-c.ga > 0 ? "+" : ""}{c.gf - c.ga}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Head-to-head */}
      <section className="bg-white rounded-xl border border-eg-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-eg-border">
          <h2 className="section-heading">Head-to-Head vs Top Opponents</h2>
        </div>
        <div className="table-scroll">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-eg-surface-2 border-b border-eg-border">
                {["Opponent","P","W","D","L","Win %"].map(h => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold tracking-widest uppercase text-eg-muted ${h === "Opponent" ? "text-left" : "text-center"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {headToHead.map((o, i) => (
                <tr key={o.opponent} className={`border-b border-eg-border last:border-0 hover:bg-eg-surface-2 transition-colors ${i % 2 === 1 ? "bg-eg-bg/40" : ""}`}>
                  <td className="px-4 py-3 font-semibold text-eg-text">{o.opponent}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-eg-muted">{o.p}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-green-600 font-semibold">{o.w}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-amber-500 font-semibold">{o.d}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-eg-red font-semibold">{o.l}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-eg-muted">{Math.round((o.w/o.p)*100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
