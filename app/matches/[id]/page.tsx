import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getMatches, getMatchById, getPlayers, toSlug } from "@/lib/data";
import type { LineupEntry, Player } from "@/lib/types";

export const revalidate = 3600;

export async function generateStaticParams() {
  const matches = await getMatches();
  return matches.map(m => ({ id: m.id }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const match = await getMatchById(id);
  if (!match) return { title: "Match Not Found" };
  return { title: `Egypt vs ${match.opponent} — ${match.date.slice(0, 4)}` };
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch { return date; }
}

function PlayerRow({ entry, players }: { entry: LineupEntry; players: Player[] }) {
  const player = players.find(
    p => p.id === toSlug(entry.playerName) ||
         (p.nickname && toSlug(p.nickname) === toSlug(entry.playerName))
  );

  return (
    <div className="flex items-center justify-between py-2 border-b border-eg-border last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full overflow-hidden bg-eg-bg border border-eg-border shrink-0 flex items-center justify-center">
          {player?.photoUrl ? (
            <img src={player.photoUrl} alt={entry.playerName}
              className="w-full h-full object-cover object-top" />
          ) : (
            <span className="font-black text-eg-muted" style={{ fontSize: 8 }}>
              {entry.playerName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        {player ? (
          <Link href={`/players/${player.id}`}
            className="font-semibold text-sm text-eg-text hover:text-eg-red transition-colors">
            {player.name}
          </Link>
        ) : (
          <span className="font-semibold text-sm text-eg-text">{entry.playerName}</span>
        )}
      </div>
      {entry.goals > 0 && (
        <span className="text-sm font-semibold text-eg-text shrink-0 ml-3">
          ⚽{entry.goals > 1 ? ` ×${entry.goals}` : ""}
        </span>
      )}
    </div>
  );
}

function PositionSection({
  label, entries, players, accent,
}: {
  label: string;
  entries: LineupEntry[];
  players: Player[];
  accent: string;
}) {
  if (entries.length === 0) return null;
  return (
    <div>
      <div className={`text-[10px] font-black tracking-widest uppercase px-1 mb-1.5 ${accent}`}>
        {label}
      </div>
      {entries.map((e, i) => (
        <PlayerRow key={i} entry={e} players={players} />
      ))}
    </div>
  );
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [match, players] = await Promise.all([getMatchById(id), getPlayers()]);
  if (!match) notFound();

  const hasLineup = match.lineup.length > 0 || match.subs.length > 0;
  const scorers = [...match.lineup, ...match.subs].filter(e => e.goals > 0);

  const result =
    match.egyptGoals > match.opponentGoals ? { label: "Victory", cls: "bg-green-100 text-green-700" } :
    match.egyptGoals < match.opponentGoals ? { label: "Defeat",  cls: "bg-red-100 text-eg-red"      } :
                                             { label: "Draw",    cls: "bg-amber-50 text-amber-600"   };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/matches" className="text-eg-muted text-xs hover:text-eg-red transition-colors mb-6 inline-block">
        ← All Matches
      </Link>

      {/* Result card */}
      <div className="bg-white rounded-xl border border-eg-border shadow-sm overflow-hidden mb-6">
        <div className="h-1 bg-eg-red" />
        <div className="px-6 sm:px-10 py-8">

          <div className="flex flex-wrap items-center gap-2 mb-6 text-xs text-eg-muted font-semibold uppercase tracking-widest">
            <span>{match.competition}</span>
            <span className="text-eg-border">·</span>
            <span>{formatDate(match.date)}</span>
            {match.venue && <>
              <span className="text-eg-border">·</span>
              <span>{match.venue}{match.city ? `, ${match.city}` : ""}</span>
            </>}
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-6 sm:gap-12">
            <div className="text-center flex-1">
              <div className="text-xl sm:text-2xl font-black text-eg-text">🇪🇬 Egypt</div>
              <div className="text-eg-muted text-xs mt-1 uppercase tracking-wide">{match.isHome ? "Home" : "Away"}</div>
            </div>
            <div className="text-center">
              <div className="text-5xl sm:text-7xl font-black text-eg-text tabular-nums leading-none">
                {match.egyptGoals}–{match.opponentGoals}
              </div>
              <div className="mt-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest ${result.cls}`}>
                  {result.label}
                </span>
              </div>
            </div>
            <div className="text-center flex-1">
              <div className="text-xl sm:text-2xl font-black text-eg-text">{match.opponent}</div>
              <div className="text-eg-muted text-xs mt-1 uppercase tracking-wide">{match.isHome ? "Away" : "Home"}</div>
            </div>
          </div>

          {scorers.length > 0 && (
            <div className="mt-5 pt-4 border-t border-eg-border text-center text-sm text-eg-muted">
              ⚽ {scorers.map(e => `${e.playerName}${e.goals > 1 ? ` (${e.goals})` : ""}`).join(", ")}
            </div>
          )}
        </div>
      </div>

      {/* Lineup + Subs */}
      {hasLineup ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Starting XI by position */}
          <div className="bg-white rounded-xl border border-eg-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-eg-border flex items-center justify-between">
              <h2 className="section-heading">Starting XI</h2>
              <span className="text-eg-muted text-xs">{match.lineup.length} players</span>
            </div>
            <div className="px-5 py-3 space-y-4">
              <PositionSection label="Goalkeeper"  entries={match.gk}          players={players} accent="text-amber-600" />
              <PositionSection label="Defenders"   entries={match.defenders}   players={players} accent="text-blue-600"  />
              <PositionSection label="Midfielders" entries={match.midfielders} players={players} accent="text-green-600" />
              <PositionSection label="Attackers"   entries={match.attackers}   players={players} accent="text-eg-red"    />
            </div>
          </div>

          {/* Substitutes */}
          <div className="bg-white rounded-xl border border-eg-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-eg-border flex items-center justify-between">
              <h2 className="section-heading">Substitutes</h2>
              <span className="text-eg-muted text-xs">{match.subs.length} players</span>
            </div>
            <div className="px-5 py-3">
              {match.subs.length === 0 ? (
                <p className="py-4 text-eg-muted text-sm text-center">No substitutes recorded</p>
              ) : (
                match.subs.map((e, i) => <PlayerRow key={i} entry={e} players={players} />)
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white rounded-xl border border-eg-border shadow-sm p-8 text-center text-eg-muted text-sm">
          No lineup recorded for this match yet.
          <br />
          <span className="text-xs mt-1 block text-eg-subtle">
            Add <code className="bg-eg-bg px-1 rounded">gk</code>,{" "}
            <code className="bg-eg-bg px-1 rounded">defenders</code>,{" "}
            <code className="bg-eg-bg px-1 rounded">midfielders</code>,{" "}
            <code className="bg-eg-bg px-1 rounded">attackers</code> columns to your matches sheet.
          </span>
        </div>
      )}
    </main>
  );
}
