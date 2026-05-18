import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlayers, getPlayerBySlug, toSlug } from "@/lib/data";
import { extractTransfermarktId, getMarketValue } from "@/lib/transfermarkt";
import MarketValueChart from "@/components/MarketValueChart";


export const revalidate = 3600;

export async function generateStaticParams() {
  const players = await getPlayers();
  return players.map(p => ({ slug: toSlug(p.name) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const player = await getPlayerBySlug(slug);
  return { title: player?.name ?? "Player Not Found" };
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return date; }
}

function ResultBadge({ eg, opp }: { eg: number; opp: number }) {
  if (eg > opp) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">W</span>;
  if (eg < opp) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-eg-red">L</span>;
  return          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">D</span>;
}

export default async function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const player = await getPlayerBySlug(slug);
  if (!player) notFound();

  const tmId = player.transfermarktUrl ? extractTransfermarktId(player.transfermarktUrl) : null;
  const marketValue = tmId ? await getMarketValue(tmId) : null;

  const initials = player.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/players" className="text-eg-muted text-xs hover:text-eg-red transition-colors mb-5 inline-flex items-center gap-1">
        ← All Players
      </Link>

      {/* Player header card */}
      <div className="bg-white rounded-xl border border-eg-border shadow-sm overflow-hidden mb-6">
        {/* Red top bar */}
        <div className="h-1 bg-eg-red" />
        <div className="px-6 sm:px-8 py-8 flex items-start gap-6">
          {player.photoUrl ? (
            <img
              src={player.photoUrl}
              alt={player.name}
              className="w-20 h-24 sm:w-28 sm:h-32 rounded-xl object-cover object-top border border-eg-border shrink-0 shadow-sm"
            />
          ) : (
            <div className="w-20 h-24 sm:w-28 sm:h-32 rounded-xl bg-eg-bg border border-eg-border flex items-center justify-center shrink-0">
              <span className="text-3xl font-black text-eg-muted">{initials}</span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-eg-red text-xs font-bold tracking-widest uppercase">🇪🇬 Egypt</p>
              {player.position && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${
                  player.position === "GK"  ? "bg-amber-100 text-amber-700" :
                  player.position === "DEF" ? "bg-blue-100 text-blue-700"   :
                  player.position === "MF"  ? "bg-green-100 text-green-700" :
                  player.position === "FW"  ? "bg-red-100 text-eg-red"      :
                  "bg-eg-bg text-eg-muted"
                }`}>{player.position}</span>
              )}
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-eg-text leading-none mb-1">{player.name}</h1>
            {player.fullName && (
              <p className="text-eg-muted text-sm mb-1">{player.fullName}</p>
            )}
            {player.nickname && (
              <p className="text-eg-red font-bold text-sm mb-2">"{player.nickname}"</p>
            )}
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-eg-muted">
              {(player.careerStart) && (
                <span className="font-semibold text-eg-text">
                  {player.careerStart}{player.careerEnd && player.careerEnd !== player.careerStart ? `–${player.careerEnd}` : "–present"}
                </span>
              )}
              {player.birthYear > 0 && (
                <span>Born {player.birthYear}{player.birthCity ? `, ${player.birthCity}` : ""}</span>
              )}
              {player.countries.length > 0 && (
                <span>
                  {player.countries.length === 1 ? "Nationality" : "Nationalities"}:{" "}
                  {player.countries.join(" · ")}
                </span>
              )}
              {player.transfermarktUrl && (
                <a
                  href={player.transfermarktUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-eg-red hover:underline font-semibold"
                >
                  Transfermarkt ↗
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="border-t border-eg-border grid grid-cols-3 divide-x divide-eg-border bg-eg-surface-2">
          {[
            { label: "Caps",      value: player.caps },
            { label: "Goals",     value: player.goals },
            { label: "In Record", value: player.appearances.length },
          ].map(({ label, value }) => (
            <div key={label} className="text-center py-4 px-4">
              <div className="text-2xl font-black text-eg-text">{value}</div>
              <div className="text-xs text-eg-muted uppercase tracking-wider mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Clubs */}
      {player.clubs.length > 0 && (
        <div className="mb-6">
          <h2 className="section-heading mb-3">Club Career</h2>
          <div className="flex flex-wrap gap-2 mt-3">
            {player.clubs.map((c, i) => (
              <Link key={i} href={`/clubs/${toSlug(c.clubName)}`}
                className="bg-white border border-eg-border rounded-lg px-4 py-2.5 text-sm shadow-sm hover:border-eg-red/40 hover:shadow-md transition-all">
                <span className="font-semibold text-eg-text hover:text-eg-red transition-colors">{c.clubName}</span>
                {c.clubCountry && <span className="text-eg-muted ml-2 text-xs">{c.clubCountry}</span>}
                {c.yearsActive && <span className="text-eg-subtle ml-2 text-xs">· {c.yearsActive}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Market value chart */}
      {marketValue && marketValue.history.length > 1 && (
        <div className="mb-6 bg-white rounded-xl border border-eg-border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-heading">Market Value History</h2>
            {player.transfermarktUrl && (
              <a href={player.transfermarktUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-eg-red hover:underline font-semibold">
                View on Transfermarkt ↗
              </a>
            )}
          </div>
          <MarketValueChart
            history={marketValue.history}
            currentValue={marketValue.currentValue}
          />
        </div>
      )}

      {/* Appearances */}
      {player.appearances.length > 0 ? (
        <div>
          <h2 className="section-heading mb-3">Recorded Appearances ({player.appearances.length})</h2>
          <div className="table-scroll rounded-xl border border-eg-border shadow-sm bg-white overflow-hidden mt-3">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-eg-surface-2 border-b border-eg-border">
                  {["Date","Opponent","Score","Result","Competition","Role","Goals"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold tracking-widest uppercase text-eg-muted ${h === "Score" || h === "Result" ? "text-center" : "text-left"} ${i === 4 ? "hidden sm:table-cell" : ""} ${i === 5 ? "hidden sm:table-cell" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {player.appearances.map((m, i) => {
                  const lineupEntry = m.lineup.find(e => toSlug(e.playerName) === slug);
                  const subEntry    = m.subs.find(e => toSlug(e.playerName) === slug);
                  const entry = lineupEntry ?? subEntry;
                  const isSub = !lineupEntry && !!subEntry;
                  return (
                    <tr key={m.id} className={`border-b border-eg-border last:border-0 hover:bg-eg-surface-2 transition-colors ${i % 2 === 1 ? "bg-eg-bg/40" : ""}`}>
                      <td className="px-4 py-3 text-eg-muted text-xs tabular-nums whitespace-nowrap">{formatDate(m.date)}</td>
                      <td className="px-4 py-3 font-semibold text-eg-text">{m.opponent}</td>
                      <td className="px-4 py-3 text-center font-black tabular-nums">{m.egyptGoals}–{m.opponentGoals}</td>
                      <td className="px-4 py-3 text-center"><ResultBadge eg={m.egyptGoals} opp={m.opponentGoals} /></td>
                      <td className="px-4 py-3 text-eg-muted text-xs hidden sm:table-cell">{m.competition}</td>
                      <td className="px-4 py-3 text-xs hidden sm:table-cell">
                        {isSub
                          ? <span className="bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide">Sub</span>
                          : <span className="bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide">Started</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {entry && entry.goals > 0
                          ? <span className="font-semibold text-eg-text">⚽{entry.goals > 1 ? ` ×${entry.goals}` : ""}</span>
                          : <span className="text-eg-subtle">—</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-eg-muted text-sm">No detailed match appearances recorded yet.</p>
      )}
    </main>
  );
}
