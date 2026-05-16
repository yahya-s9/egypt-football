import Link from "next/link";
import { getMatchesWithScorers, getPlayers } from "@/lib/data";


function resultClass(eg: number, opp: number) {
  if (eg > opp) return "text-green-600 font-bold";
  if (eg < opp) return "text-eg-red font-bold";
  return "text-amber-600 font-bold";
}

function resultLabel(eg: number, opp: number) {
  if (eg > opp) return { text: "W", cls: "bg-green-100 text-green-700" };
  if (eg < opp) return { text: "L", cls: "bg-red-100 text-eg-red" };
  return { text: "D", cls: "bg-amber-50 text-amber-600" };
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return date; }
}

export default async function Home() {
  const [players, matches] = await Promise.all([getPlayers(), getMatchesWithScorers()]);
  const recent = matches.slice(0, 6);
  const wins   = matches.filter(m => m.egyptGoals > m.opponentGoals).length;
  const draws  = matches.filter(m => m.egyptGoals === m.opponentGoals).length;
  const losses = matches.filter(m => m.egyptGoals < m.opponentGoals).length;
  const mostCapped = [...players].sort((a, b) => b.caps - a.caps)[0];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Hero banner ───────────────────────────────────────────── */}
      <div className="bg-eg-red rounded-xl overflow-hidden mb-8">
        <div className="px-8 py-10 flex items-center gap-6 relative">
          {/* Faint pattern overlay */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
            backgroundSize: "16px 16px",
          }} />
          <span className="text-6xl relative">🇪🇬</span>
          <div className="relative">
            <p className="text-red-200 text-xs font-semibold tracking-widest uppercase mb-1">
              Official Historical Record
            </p>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-none mb-2">
              Egypt Football
            </h1>
            <p className="text-red-100 text-sm">
              Every player · Every match · Every goal — from 1920 to today
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              {[
                { href: "/players", label: "Browse Players" },
                { href: "/matches", label: "Match History" },
                { href: "/records", label: "All-Time Records" },
              ].map(({ href, label }) => (
                <Link key={href} href={href}
                  className="bg-white text-eg-red font-bold text-xs px-4 py-2 rounded-lg hover:bg-red-50 transition-colors tracking-wide uppercase">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Matches Played", value: matches.length },
          { label: "Total Wins",     value: wins,   note: `${Math.round((wins/matches.length)*100)}% win rate` },
          { label: "Players Capped", value: players.length },
          { label: "Most Capped",    value: mostCapped?.name ?? "—", note: `${mostCapped?.caps ?? 0} caps`, small: true },
        ].map(({ label, value, note, small }) => (
          <div key={label} className="bg-white rounded-xl border border-eg-border p-5 shadow-sm">
            <p className="text-eg-muted text-xs font-semibold tracking-widest uppercase mb-2">{label}</p>
            <p className={`font-black text-eg-text leading-none ${small ? "text-xl" : "text-3xl"}`}>{value}</p>
            {note && <p className="text-eg-subtle text-xs mt-1.5">{note}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Recent results (2/3 width) ────────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-eg-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-eg-border">
            <h2 className="section-heading">Recent Results</h2>
            <Link href="/matches" className="text-xs text-eg-red font-semibold hover:underline">
              View all →
            </Link>
          </div>
          {recent.map((m, i) => {
            const r = resultLabel(m.egyptGoals, m.opponentGoals);
            return (
              <div key={m.id}
                className={`flex items-center px-6 py-3 gap-4 ${i < recent.length - 1 ? "border-b border-eg-border" : ""} hover:bg-eg-surface-2 transition-colors`}>
                <span className="text-eg-subtle text-xs tabular-nums w-24 shrink-0">{formatDate(m.date)}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${r.cls} shrink-0 w-6 text-center`}>{r.text}</span>
                <span className="font-semibold text-sm flex-1 truncate">{m.isHome ? "" : "@ "}{m.opponent}</span>
                <span className={`text-sm tabular-nums shrink-0 ${resultClass(m.egyptGoals, m.opponentGoals)}`}>
                  {m.egyptGoals}–{m.opponentGoals}
                </span>
                <span className="text-eg-subtle text-xs hidden sm:block shrink-0 truncate max-w-32">{m.competition}</span>
              </div>
            );
          })}
        </div>

        {/* ── All-time record (1/3 width) ───────────────────────── */}
        <div className="bg-white rounded-xl border border-eg-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-eg-border">
            <h2 className="section-heading">All-Time Record</h2>
          </div>
          <div className="p-6">
            {/* Bar */}
            <div className="flex h-3 rounded-full overflow-hidden mb-5">
              <div className="bg-green-500 h-full" style={{ width: `${(wins/matches.length)*100}%` }} />
              <div className="bg-amber-400 h-full" style={{ width: `${(draws/matches.length)*100}%` }} />
              <div className="bg-eg-red h-full" style={{ width: `${(losses/matches.length)*100}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { label: "Won",   value: wins,   cls: "text-green-600" },
                { label: "Drawn", value: draws,  cls: "text-amber-500" },
                { label: "Lost",  value: losses, cls: "text-eg-red" },
              ].map(({ label, value, cls }) => (
                <div key={label} className="text-center bg-eg-bg rounded-lg py-3">
                  <div className={`text-2xl font-black ${cls}`}>{value}</div>
                  <div className="text-xs text-eg-muted mt-0.5 uppercase tracking-wide">{label}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-eg-border pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-eg-muted">Played</span>
                <span className="font-bold">{matches.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-eg-muted">Win rate</span>
                <span className="font-bold">{Math.round((wins/matches.length)*100)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-eg-muted">Goals for</span>
                <span className="font-bold">{matches.reduce((s,m)=>s+m.egyptGoals,0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-eg-muted">Goals against</span>
                <span className="font-bold">{matches.reduce((s,m)=>s+m.opponentGoals,0)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
