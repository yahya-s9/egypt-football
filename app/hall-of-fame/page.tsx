import type { Metadata } from "next";
import Link from "next/link";
import { getPlayers, toSlug } from "@/lib/data";
import type { Player } from "@/lib/types";

export const metadata: Metadata = { title: "Hall of Fame" };
export const revalidate = 3600;

// Deterministic tilt: varies per card but is always the same
function tiltDeg(index: number): number {
  return (((index * 41 + 13) % 9) - 4) * 0.55;
}

function StickerCard({ player, index }: { player: Player; index: number }) {
  const nameParts   = player.name.split(" ");
  const lastName    = nameParts.slice(1).join(" ") || nameParts[0];
  const firstName   = nameParts.length > 1 ? nameParts[0] : "";
  const initials    = nameParts.map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const isLegend    = player.caps >= 150;
  const isIcon      = player.caps >= 100 && !isLegend;
  const tilt        = tiltDeg(index);

  const frameCls = isLegend
    ? "bg-gradient-to-br from-amber-100 via-amber-50 to-white shadow-[0_6px_28px_rgba(0,0,0,0.28),0_0_0_1.5px_rgba(200,168,75,0.7)]"
    : isIcon
    ? "bg-white shadow-[0_4px_20px_rgba(0,0,0,0.2),0_0_0_1px_rgba(200,200,200,0.6)]"
    : "bg-white shadow-[0_4px_16px_rgba(0,0,0,0.18)]";

  return (
    <Link
      href={`/players/${toSlug(player.name)}`}
      className="sticker block"
      style={{ "--sticker-rotate": `${tilt}deg` } as React.CSSProperties}
    >
      {/* Outer frame — the white sticker border */}
      <div className={`relative rounded-[3px] p-[7px] ${frameCls}`}>
        {isLegend && <div className="sticker-foil rounded-[3px]" />}

        {/* Card body */}
        <div className="rounded-[2px] overflow-hidden w-[148px]">

          {/* ── Country header ─────────────────────── */}
          <div className="bg-eg-red px-2.5 py-1.5 flex items-center justify-between gap-1">
            <span className="text-white font-black text-[11px] tracking-[0.18em] uppercase leading-none">
              Egypt
            </span>
            <span className="text-base leading-none">🇪🇬</span>
          </div>

          {/* ── Photo area ──────────────────────────── */}
          <div
            className="relative overflow-hidden"
            style={{
              height: 168,
              background: "linear-gradient(160deg, #8B0018 0%, #4a0010 45%, #0d0005 100%)",
            }}
          >
            {player.photoUrl ? (
              <img
                src={player.photoUrl}
                alt={player.name}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="w-full h-full flex items-end justify-center pb-3">
                {/* Silhouette-style initials */}
                <span
                  className="font-black text-white/10 leading-none select-none"
                  style={{ fontSize: 88 }}
                >
                  {initials}
                </span>
              </div>
            )}

            {/* Bottom gradient fade into footer */}
            <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/90 to-transparent" />

            {/* Sticker number */}
            <div className="absolute top-2 right-2 text-white/30 font-bold leading-none"
              style={{ fontSize: 9 }}>
              {String(index + 1).padStart(2, "0")}
            </div>

            {/* Badge */}
            {isLegend && (
              <div className="absolute top-2 left-2 bg-eg-gold text-black font-black leading-none px-1.5 py-0.5 rounded-[2px] tracking-widest uppercase"
                style={{ fontSize: 8 }}>
                ★ Legend
              </div>
            )}
            {isIcon && (
              <div className="absolute top-2 left-2 bg-gray-200 text-gray-700 font-black leading-none px-1.5 py-0.5 rounded-[2px] tracking-widest uppercase"
                style={{ fontSize: 8 }}>
                Icon
              </div>
            )}
          </div>

          {/* ── Name footer ─────────────────────────── */}
          <div className="bg-black px-2.5 pt-2 pb-2.5">
            {firstName && (
              <div className="text-eg-red font-bold leading-none tracking-[0.2em] uppercase mb-0.5"
                style={{ fontSize: 9 }}>
                {firstName}
              </div>
            )}
            <div
              className="text-white font-black uppercase leading-tight tracking-wide truncate"
              style={{ fontSize: 15 }}
            >
              {lastName}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-eg-gold font-semibold leading-none"
                style={{ fontSize: 10 }}>
                {player.caps} caps
              </span>
              {player.clubs[0] && (
                <span className="text-gray-500 leading-none truncate max-w-[72px] text-right"
                  style={{ fontSize: 9 }}>
                  {player.clubs[player.clubs.length - 1]?.clubName}
                </span>
              )}
            </div>
          </div>

        </div>
      </div>
    </Link>
  );
}

export default async function HallOfFamePage() {
  const players = await getPlayers();
  const sorted  = [...players].sort((a, b) => b.caps - a.caps);

  const legends = sorted.filter(p => p.caps >= 150);
  const icons   = sorted.filter(p => p.caps >= 100 && p.caps < 150);
  const stars   = sorted.filter(p => p.caps < 100);

  function Section({
    title, badge, players: list, startIndex,
  }: {
    title: string; badge: string; players: Player[]; startIndex: number;
  }) {
    if (list.length === 0) return null;
    return (
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">{badge}</span>
          <h2 className="section-heading text-lg">{title}</h2>
        </div>
        <div className="flex flex-wrap gap-8 justify-start">
          {list.map((player, i) => (
            <StickerCard key={player.id} player={player} index={startIndex + i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Sticker-book cover banner ───────────────────────────────── */}
      <div className="bg-eg-red relative overflow-hidden">
        {/* Diagonal stripe texture */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
          backgroundSize: "12px 12px",
        }} />
        <div className="relative max-w-7xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center gap-6">
          {/* Sticker-book "label" */}
          <div className="bg-white rounded-lg px-6 py-5 text-center shadow-lg shrink-0 w-32">
            <div className="text-eg-red font-black leading-none mb-1" style={{ fontSize: 32 }}>🇪🇬</div>
            <div className="text-eg-red font-black text-[10px] tracking-[0.2em] uppercase leading-tight">Official<br/>Collection</div>
          </div>
          <div>
            <p className="text-red-200 text-xs font-semibold tracking-[0.3em] uppercase mb-1">
              Panini-style · Egypt Football
            </p>
            <h1 className="text-white font-black text-4xl sm:text-6xl leading-none tracking-tight mb-2">
              Hall of Fame
            </h1>
            <p className="text-red-200 text-sm">
              {sorted.length} players · Collect them all
            </p>
          </div>
          {/* Decorative stacked sticker preview */}
          <div className="hidden lg:flex items-center ml-auto gap-2 opacity-60">
            {sorted.slice(0, 3).map((p, i) => (
              <div key={p.id}
                className="bg-white rounded-sm shadow-lg w-14 h-20 overflow-hidden border-4 border-white"
                style={{ transform: `rotate(${(i - 1) * 6}deg)`, marginLeft: i > 0 ? -28 : 0 }}>
                <div className="bg-eg-red h-3 w-full" />
                <div className="flex-1 bg-gradient-to-b from-red-900 to-black h-12 flex items-center justify-center">
                  <span className="text-white/20 font-black text-xl">
                    {p.name.split(" ").map(w => w[0]).join("").slice(0,2)}
                  </span>
                </div>
                <div className="bg-black h-5 px-1 flex items-center">
                  <span className="text-white font-black text-[7px] uppercase truncate">{p.name.split(" ").slice(1).join(" ") || p.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticker pages ──────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <Section title="Legends"   badge="🥇" players={legends} startIndex={0} />
        <Section title="Icons"     badge="⭐" players={icons}   startIndex={legends.length} />
        <Section title="All Stars" badge="🌟" players={stars}   startIndex={legends.length + icons.length} />
      </main>
    </div>
  );
}
