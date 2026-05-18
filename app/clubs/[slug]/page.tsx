import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlayersForClub, getAllClubSlugs, toSlug } from "@/lib/data";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllClubSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPlayersForClub(slug);
  if (!data) return { title: "Club Not Found" };
  return { title: `${data.clubName} — Egyptian Players` };
}

const POS_BADGE: Record<string, string> = {
  GK:  "bg-amber-100 text-amber-700",
  DEF: "bg-blue-100 text-blue-700",
  MF:  "bg-green-100 text-green-700",
  FW:  "bg-red-100 text-eg-red",
};

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPlayersForClub(slug);
  if (!data) notFound();

  const { clubName, players } = data;
  const initials = clubName.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase();

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/players" className="text-eg-muted text-xs hover:text-eg-red transition-colors mb-6 inline-block">
        ← Players
      </Link>

      {/* Club header */}
      <div className="bg-white rounded-xl border border-eg-border shadow-sm overflow-hidden mb-6">
        <div className="h-1 bg-eg-red" />
        <div className="px-6 sm:px-8 py-8 flex items-center gap-6">
          {/* Club badge placeholder */}
          <div className="w-16 h-16 rounded-xl bg-eg-bg border border-eg-border flex items-center justify-center shrink-0">
            <span className="font-black text-eg-muted text-sm">{initials}</span>
          </div>
          <div>
            <p className="text-eg-red text-xs font-bold tracking-widest uppercase mb-1">Club</p>
            <h1 className="text-3xl sm:text-4xl font-black text-eg-text leading-none">{clubName}</h1>
            <p className="text-eg-muted text-sm mt-2">
              {clubName === "Retired"
                ? `${players.length} Egyptian ${players.length === 1 ? "player has" : "players have"} retired`
                : `${players.length} Egyptian ${players.length === 1 ? "player" : "players"} represented this club`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Players table */}
      <div className="table-scroll rounded-xl border border-eg-border shadow-sm bg-white overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-eg-surface-2 border-b border-eg-border">
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase text-eg-muted w-8">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase text-eg-muted">Player</th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase text-eg-muted hidden sm:table-cell">Position</th>
              <th className="px-4 py-3 text-right text-xs font-semibold tracking-widest uppercase text-eg-muted">Caps</th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase text-eg-muted hidden md:table-cell">Years</th>
            </tr>
          </thead>
          <tbody>
            {players.map(({ player, yearsActive }, i) => (
              <tr key={player.id}
                className={`border-b border-eg-border last:border-0 hover:bg-eg-surface-2 transition-colors ${i % 2 === 1 ? "bg-eg-bg/40" : ""}`}>
                <td className="px-4 py-3 text-eg-subtle text-xs tabular-nums">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-eg-bg border border-eg-border shrink-0 flex items-center justify-center">
                      {player.photoUrl ? (
                        <img src={player.photoUrl} alt={player.name}
                          className="w-full h-full object-cover object-top" />
                      ) : (
                        <span className="text-[9px] font-black text-eg-muted">
                          {player.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <Link href={`/players/${toSlug(player.name)}`}
                      className="font-semibold text-eg-text hover:text-eg-red transition-colors">
                      {player.name}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  {player.position ? (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${POS_BADGE[player.position] ?? "bg-eg-bg text-eg-muted"}`}>
                      {player.position}
                    </span>
                  ) : <span className="text-eg-subtle">—</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="bg-eg-red text-white font-bold text-xs px-2.5 py-0.5 rounded-full tabular-nums">
                    {player.caps}
                  </span>
                </td>
                <td className="px-4 py-3 text-eg-muted text-xs hidden md:table-cell">
                  {yearsActive || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
