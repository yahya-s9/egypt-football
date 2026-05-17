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

function ResultBanner({ eg, opp }: { eg: number; opp: number }) {
  const { label, cls } =
    eg > opp ? { label: "Victory",   cls: "bg-green-100 text-green-700" } :
    eg < opp ? { label: "Defeat",    cls: "bg-red-100 text-eg-red"      } :
               { label: "Draw",      cls: "bg-amber-50 text-amber-600"  };
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest ${cls}`}>
      {label}
    </span>
  );
}

function PlayerRow({
  entry, players, isSub,
}: {
  entry: LineupEntry;
  players: Player[];
  isSub: boolean;
}) {
  const player = players.find(
    p => p.id === toSlug(entry.playerName) ||
         (p.nickname && toSlug(p.nickname) === toSlug(entry.playerName))
  );
  const slug = player?.id ?? toSlug(entry.playerName);

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-eg-border last:border-0 group">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden bg-eg-bg border border-eg-border shrink-0 flex items-center justify-center">
          {player?.photoUrl ? (
            <img src={player.photoUrl} alt={entry.playerName}
              className="w-full h-full object-cover object-top" />
          ) : (
            <span className="text-[9px] font-black text-eg-muted">
              {entry.playerName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <Link
            href={player ? `/players/${slug}` : "#"}
            className={`font-semibold text-sm ${player ? "text-eg-text hover:text-eg-red transition-colors" : "text-eg-muted cursor-default"}`}
          >
            {player ? player.name : entry.playerName}
          </Link>
          {isSub && (
            <span className="ml-2 text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
              Sub
            </span>
          )}
        </div>
      </div>
      {entry.goals > 0 && (
        <span className="text-sm font-semibold text-eg-text shrink-0">
          ⚽{entry.goals > 1 ? ` ×${entry.goals}` : ""}
        </span>
      )}
    </div>
  );
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [match, players] = await Promise.all([getMatchById(id), getPlayers()]);
  if (!match) notFound();

  const hasLineup = match.lineup.length > 0 || match.subs.length > 0;
  const scorers = [...match.lineup, ...match.subs].filter(e => e.goals > 0);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/matches" className="text-eg-muted text-xs hover:text-eg-red transition-colors mb-6 inline-block">
        ← All Matches
      </Link>

      {/* Match header card */}
      <div className="bg-white rounded-xl border border-eg-border shadow-sm overflow-hidden mb-6">
        <div className="h-1 bg-eg-red" />
        <div className="px-6 sm:px-10 py-8">

          {/* Competition + date */}
          <div className="flex flex-wrap items-center gap-3 mb-5 text-xs text-eg-muted font-semibold uppercase tracking-widest">
            <span>{match.competition}</span>
            <span className="text-eg-border">·</span>
            <span>{formatDate(match.date)}</span>
            {match.venue && (
              <>
                <span className="text-eg-border">·</span>
                <span>{match.venue}{match.city ? `, ${match.city}` : ""}</span>
              </>
            )}
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 py-4">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-eg-text">🇪🇬 Egypt</div>
              <div className="text-eg-muted text-xs mt-1 uppercase tracking-widest">
                {match.isHome ? "Home" : "Away"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-5xl sm:text-7xl font-black text-eg-text tabular-nums leading-none">
                {match.egyptGoals}–{match.opponentGoals}
              </div>
              <div className="mt-3">
                <ResultBanner eg={match.egyptGoals} opp={match.opponentGoals} />
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-eg-text">{match.opponent}</div>
              <div className="text-eg-muted text-xs mt-1 uppercase tracking-widest">
                {match.isHome ? "Away" : "Home"}
              </div>
            </div>
          </div>

          {/* Scorers summary */}
          {scorers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-eg-border text-center text-sm text-eg-muted">
              ⚽{" "}
              {scorers.map(e =>
                `${e.playerName}${e.goals > 1 ? ` (${e.goals})` : ""}`
              ).join(", ")}
            </div>
          )}
        </div>
      </div>

      {/* Lineup */}
      {hasLineup ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Starting XI */}
          <div className="bg-white rounded-xl border border-eg-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-eg-border flex items-center gap-2">
              <h2 className="section-heading">Starting XI</h2>
              <span className="text-eg-muted text-xs">({match.lineup.length})</span>
            </div>
            <div className="px-5">
              {match.lineup.length === 0 ? (
                <p className="py-6 text-eg-muted text-sm text-center">No lineup data</p>
              ) : (
                match.lineup.map((entry, i) => (
                  <PlayerRow key={i} entry={entry} players={players} isSub={false} />
                ))
              )}
            </div>
          </div>

          {/* Substitutes */}
          <div className="bg-white rounded-xl border border-eg-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-eg-border flex items-center gap-2">
              <h2 className="section-heading">Substitutes</h2>
              <span className="text-eg-muted text-xs">({match.subs.length})</span>
            </div>
            <div className="px-5">
              {match.subs.length === 0 ? (
                <p className="py-6 text-eg-muted text-sm text-center">No substitutes recorded</p>
              ) : (
                match.subs.map((entry, i) => (
                  <PlayerRow key={i} entry={entry} players={players} isSub={true} />
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-eg-border shadow-sm p-8 text-center text-eg-muted text-sm">
          No lineup data recorded for this match yet.
          <br />
          <span className="text-xs mt-1 block">Add a <code className="bg-eg-bg px-1 rounded">lineup</code> column to your matches sheet to track it.</span>
        </div>
      )}
    </main>
  );
}
