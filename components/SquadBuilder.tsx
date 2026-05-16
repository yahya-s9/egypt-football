"use client";

import { useState, useEffect, useRef } from "react";
import type { Player } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────────────────

type AssignedPlayer = {
  id: string;
  name: string;
  photoUrl: string;
  caps: number;
  clubSummary: string;
  isCustom: boolean;
};

type Squad = Record<string, AssignedPlayer | null>;

// ── 4-3-3 formation ────────────────────────────────────────────────────────
// x/y as % of pitch container. Attack at top, GK at bottom.

const POSITIONS = [
  { id: "LW",  label: "LW",  x: 14, y: 10 },
  { id: "ST",  label: "ST",  x: 50, y: 8  },
  { id: "RW",  label: "RW",  x: 86, y: 10 },
  { id: "LCM", label: "LCM", x: 18, y: 36 },
  { id: "CM",  label: "CM",  x: 50, y: 34 },
  { id: "RCM", label: "RCM", x: 82, y: 36 },
  { id: "LB",  label: "LB",  x: 11, y: 61 },
  { id: "LCB", label: "LCB", x: 31, y: 64 },
  { id: "RCB", label: "RCB", x: 69, y: 64 },
  { id: "RB",  label: "RB",  x: 89, y: 61 },
  { id: "GK",  label: "GK",  x: 50, y: 85 },
];

const EMPTY_SQUAD: Squad = Object.fromEntries(POSITIONS.map(p => [p.id, null]));

function fromPlayer(p: Player): AssignedPlayer {
  return {
    id: p.id,
    name: p.name,
    photoUrl: p.photoUrl,
    caps: p.caps,
    clubSummary: p.clubs.map(c => c.clubName).join(", "),
    isCustom: false,
  };
}

// ── Mini FIFA card ─────────────────────────────────────────────────────────

function MiniCard({
  player, posLabel, isDragging, isDropTarget,
  onRemove, onDragStart, onDragEnd, onDragOver, onDrop,
}: {
  player: AssignedPlayer;
  posLabel: string;
  isDragging: boolean;
  isDropTarget: boolean;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const lastName = player.name.split(" ").slice(1).join(" ") || player.name;
  const firstName = player.name.split(" ")[0];
  const initials = player.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      className="relative group select-none"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        opacity: isDragging ? 0.4 : 1,
        filter: isDropTarget ? "brightness(1.2)" : "none",
        cursor: "grab",
        transition: "opacity 0.15s, filter 0.15s",
      }}
    >
      {/* White sticker frame */}
      <div
        className="rounded-sm shadow-xl"
        style={{
          background: isDropTarget ? "#fffbe6" : "#fff",
          padding: 4,
          outline: isDropTarget ? "2px solid #C8A84B" : "none",
        }}
      >
        <div className="overflow-hidden rounded-[2px]" style={{ width: 94 }}>
          {/* Red header */}
          <div className="bg-eg-red flex items-center justify-between px-2 py-1">
            <span className="text-white font-black tracking-widest uppercase" style={{ fontSize: 9 }}>{posLabel}</span>
            <span style={{ fontSize: 12 }}>🇪🇬</span>
          </div>
          {/* Photo */}
          <div
            className="relative overflow-hidden flex items-center justify-center"
            style={{ height: 88, background: "linear-gradient(160deg,#8B0018 0%,#3a000a 60%,#000 100%)" }}
          >
            {player.photoUrl ? (
              <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover object-top" />
            ) : (
              <span className="font-black text-white/10 leading-none" style={{ fontSize: 58 }}>{initials}</span>
            )}
            <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/80 to-transparent" />
          </div>
          {/* Footer */}
          <div className="bg-black px-2 pt-1.5 pb-2">
            <div className="text-eg-red leading-none tracking-widest uppercase" style={{ fontSize: 8 }}>{firstName}</div>
            <div className="text-white font-black uppercase leading-tight truncate" style={{ fontSize: 13 }}>{lastName}</div>
            <div className="text-eg-gold leading-none mt-0.5" style={{ fontSize: 8 }}>
              {player.isCustom ? "—" : `${player.caps} caps`}
            </div>
          </div>
        </div>
      </div>

      {/* Remove ✕ */}
      <button
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-eg-red text-white font-black flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20"
        style={{ fontSize: 11 }}
        onClick={e => { e.stopPropagation(); onRemove(); }}
      >
        ×
      </button>
    </div>
  );
}

// ── Empty slot ─────────────────────────────────────────────────────────────

function EmptySlot({
  posLabel, isDropTarget, onClick, onDragOver, onDrop,
}: {
  posLabel: string;
  isDropTarget: boolean;
  onClick: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <button
      className="flex flex-col items-center justify-center rounded-sm transition-all"
      style={{
        width: 94,
        height: 132,
        border: isDropTarget ? "2px solid #C8A84B" : "2px dashed rgba(255,255,255,0.35)",
        background: isDropTarget ? "rgba(200,168,75,0.15)" : "rgba(255,255,255,0.04)",
        color: isDropTarget ? "#C8A84B" : "rgba(255,255,255,0.5)",
      }}
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <span className="font-black mb-1" style={{ fontSize: 22 }}>+</span>
      <span className="font-bold tracking-widest uppercase" style={{ fontSize: 9 }}>{posLabel}</span>
    </button>
  );
}

// ── Pitch SVG markings ─────────────────────────────────────────────────────

function PitchMarkings() {
  const s = "rgba(255,255,255,0.22)";
  const sw = "0.8";
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 140" preserveAspectRatio="none">
      {/* Outer border */}
      <rect x="2" y="2" width="96" height="136" fill="none" stroke={s} strokeWidth={sw} />
      {/* Halfway line */}
      <line x1="2" y1="70" x2="98" y2="70" stroke={s} strokeWidth={sw} />
      {/* Centre circle */}
      <circle cx="50" cy="70" r="12" fill="none" stroke={s} strokeWidth={sw} />
      <circle cx="50" cy="70" r="0.8" fill={s} />
      {/* Top penalty area */}
      <rect x="24" y="2" width="52" height="22" fill="none" stroke={s} strokeWidth={sw} />
      {/* Top 6-yard box */}
      <rect x="37" y="2" width="26" height="7" fill="none" stroke={s} strokeWidth={sw} />
      {/* Bottom penalty area */}
      <rect x="24" y="116" width="52" height="22" fill="none" stroke={s} strokeWidth={sw} />
      {/* Bottom 6-yard box */}
      <rect x="37" y="131" width="26" height="7" fill="none" stroke={s} strokeWidth={sw} />
      {/* Penalty spots */}
      <circle cx="50" cy="18" r="0.7" fill={s} />
      <circle cx="50" cy="122" r="0.7" fill={s} />
    </svg>
  );
}

// ── Player selector modal ──────────────────────────────────────────────────

function PlayerSelector({
  players, usedIds, onSelect, onCustom, onClose,
}: {
  players: Player[];
  usedIds: Set<string>;
  onSelect: (p: Player) => void;
  onCustom: (name: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = players
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.clubs.some(c => c.clubName.toLowerCase().includes(search.toLowerCase())))
    .slice(0, 7);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-1 bg-eg-red" />
        <div className="flex items-center justify-between px-4 py-3 border-b border-eg-border">
          <span className="font-black text-sm uppercase tracking-wider text-eg-text">Select Player</span>
          <button onClick={onClose} className="text-eg-muted hover:text-eg-text text-lg leading-none">×</button>
        </div>

        {!customMode ? (
          <>
            {/* Search */}
            <div className="px-4 pt-3 pb-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search players…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full border border-eg-border rounded-lg px-3 py-2 text-sm outline-none focus:border-eg-red/50 focus:ring-2 focus:ring-eg-red/10 bg-eg-surface-2"
              />
            </div>

            {/* Player list */}
            <div className="max-h-64 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="px-4 py-4 text-eg-muted text-sm text-center">No players found</p>
              )}
              {filtered.map(p => {
                const inSquad = usedIds.has(p.id);
                return (
                <button
                  key={p.id}
                  disabled={inSquad}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${inSquad ? "opacity-35 cursor-not-allowed" : "hover:bg-eg-surface-2"}`}
                  onClick={() => !inSquad && onSelect(p)}
                >
                  {/* Mini avatar */}
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-eg-bg border border-eg-border shrink-0 flex items-center justify-center">
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover object-top" />
                    ) : (
                      <span className="text-xs font-black text-eg-muted">
                        {p.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-eg-text truncate">{p.name}</div>
                    <div className="text-xs text-eg-muted truncate">
                      {p.caps} caps · {p.clubs.map(c => c.clubName).join(", ")}
                    </div>
                  </div>
                  <span className={`font-bold text-xs px-2 py-0.5 rounded-full shrink-0 ${inSquad ? "bg-eg-border text-eg-muted" : "bg-eg-red text-white"}`}>
                    {inSquad ? "✓" : p.caps}
                  </span>
                </button>
                );
              })}
            </div>

            {/* Custom name option */}
            <div className="border-t border-eg-border px-4 py-3">
              <button
                className="w-full text-xs text-eg-muted hover:text-eg-red transition-colors font-semibold tracking-wide uppercase"
                onClick={() => setCustomMode(true)}
              >
                + Add custom player name
              </button>
            </div>
          </>
        ) : (
          /* Custom name input */
          <div className="px-4 py-4">
            <p className="text-xs text-eg-muted font-semibold tracking-widest uppercase mb-3">Custom Player</p>
            <input
              autoFocus
              type="text"
              placeholder="Enter player name…"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && customName.trim()) onCustom(customName); }}
              className="w-full border border-eg-border rounded-lg px-3 py-2 text-sm outline-none focus:border-eg-red/50 focus:ring-2 focus:ring-eg-red/10 bg-eg-surface-2 mb-3"
            />
            <div className="flex gap-2">
              <button
                className="flex-1 text-xs font-bold py-2 rounded-lg border border-eg-border text-eg-muted hover:text-eg-text transition-colors"
                onClick={() => setCustomMode(false)}
              >
                Back
              </button>
              <button
                className="flex-1 text-xs font-bold py-2 rounded-lg bg-eg-red text-white hover:bg-eg-red-hover transition-colors disabled:opacity-40"
                disabled={!customName.trim()}
                onClick={() => onCustom(customName)}
              >
                Add Player
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function SquadBuilder({ players }: { players: Player[] }) {
  const [squad, setSquad] = useState<Squad>(EMPTY_SQUAD);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load squad from URL on first render
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("s");
    if (!s) return;
    try { setSquad({ ...EMPTY_SQUAD, ...JSON.parse(atob(s)) }); } catch {}
  }, []);

  // ── Assign / remove ──────────────────────────────────────────────────────

  function assignPlayer(p: Player) {
    if (!activeSlot) return;
    setSquad(prev => ({ ...prev, [activeSlot]: fromPlayer(p) }));
    setActiveSlot(null);
  }

  function assignCustom(name: string) {
    if (!activeSlot) return;
    setSquad(prev => ({
      ...prev,
      [activeSlot]: { id: `custom-${Date.now()}`, name: name.trim(), photoUrl: "", caps: 0, clubSummary: "", isCustom: true },
    }));
    setActiveSlot(null);
  }

  function removePlayer(posId: string) {
    setSquad(prev => ({ ...prev, [posId]: null }));
  }

  // ── Drag & drop ──────────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, posId: string) {
    setDragSource(posId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, posId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(posId);
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (dragSource && dragSource !== targetId) {
      setSquad(prev => {
        const next = { ...prev };
        [next[targetId], next[dragSource]] = [next[dragSource], next[targetId]];
        return next;
      });
    }
    setDragSource(null);
    setDragOver(null);
  }

  function handleDragEnd() {
    setDragSource(null);
    setDragOver(null);
  }

  // ── Share ────────────────────────────────────────────────────────────────

  function handleShare() {
    const encoded = btoa(JSON.stringify(squad));
    const url = `${window.location.origin}/squad-builder?s=${encoded}`;
    window.history.replaceState(null, "", `/squad-builder?s=${encoded}`);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleClear() {
    setSquad(EMPTY_SQUAD);
    window.history.replaceState(null, "", "/squad-builder");
  }

  const filledCount = Object.values(squad).filter(Boolean).length;

  return (
    <div>
      {/* Page header */}
      <div className="bg-eg-red">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-between">
          <div>
            <p className="text-red-200 text-xs font-semibold tracking-[0.3em] uppercase mb-1">Egypt Football</p>
            <h1 className="text-white font-black text-3xl sm:text-4xl leading-none tracking-tight">Squad Builder</h1>
            <p className="text-red-200 text-sm mt-1">4-3-3 Formation</p>
          </div>
          <div className="text-right">
            <div className="text-white font-black text-4xl">{filledCount}<span className="text-red-300 text-xl">/11</span></div>
            <div className="text-red-200 text-xs uppercase tracking-widest">Players</div>
          </div>
        </div>
      </div>

      <main className="px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center">

          {/* ── Football pitch ──────────────────────────────────────────── */}
          <div className="w-full flex flex-col items-center">
            <div
              className="relative rounded-xl overflow-hidden shadow-2xl w-full"
              style={{
                maxWidth: 700,
                aspectRatio: "3 / 4.2",
                background: "repeating-linear-gradient(180deg, #2d6a1a 0px, #2d6a1a 48px, #338020 48px, #338020 96px)",
              }}
            >
              <PitchMarkings />

              {/* Position slots */}
              {POSITIONS.map(pos => {
                const player = squad[pos.id];
                const isDragging = dragSource === pos.id;
                const isDropTarget = dragOver === pos.id && dragSource !== pos.id;

                return (
                  <div
                    key={pos.id}
                    className="absolute"
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    {player ? (
                      <MiniCard
                        player={player}
                        posLabel={pos.label}
                        isDragging={isDragging}
                        isDropTarget={isDropTarget}
                        onRemove={() => removePlayer(pos.id)}
                        onDragStart={e => handleDragStart(e, pos.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={e => handleDragOver(e, pos.id)}
                        onDrop={e => handleDrop(e, pos.id)}
                      />
                    ) : (
                      <EmptySlot
                        posLabel={pos.label}
                        isDropTarget={isDropTarget}
                        onClick={() => setActiveSlot(pos.id)}
                        onDragOver={e => handleDragOver(e, pos.id)}
                        onDrop={e => handleDrop(e, pos.id)}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 mt-5 w-full" style={{ maxWidth: 700 }}>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 bg-eg-red hover:bg-eg-red-hover text-white font-bold text-xs py-3 rounded-xl transition-colors tracking-wider uppercase shadow-sm"
              >
                {copied ? "✓ Link Copied!" : "🔗 Share Squad"}
              </button>
              <button
                onClick={handleClear}
                className="flex-1 flex items-center justify-center gap-2 bg-white border border-eg-border hover:border-eg-border-2 text-eg-muted hover:text-eg-text font-bold text-xs py-3 rounded-xl transition-colors tracking-wider uppercase shadow-sm"
              >
                ✕ Clear All
              </button>
            </div>

            <p className="text-eg-muted text-xs mt-3 text-center">
              Click a slot to add a player · Drag cards to swap positions
            </p>

            {/* ── Squad list (below pitch) ──────────────────────────────── */}
            <div className="w-full mt-6 bg-white rounded-xl border border-eg-border shadow-sm overflow-hidden" style={{ maxWidth: 700 }}>
              <div className="h-1 bg-eg-red" />
              <div className="px-5 py-3 border-b border-eg-border flex items-center justify-between">
                <h2 className="section-heading">Your Squad</h2>
                <span className="text-xs text-eg-muted">{filledCount} / 11 players</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {POSITIONS.map((pos, i) => {
                  const player = squad[pos.id];
                  return (
                    <div
                      key={pos.id}
                      className={`flex items-center gap-2.5 px-4 py-2.5 border-b border-eg-border hover:bg-eg-surface-2 transition-colors cursor-pointer ${i % 2 === 0 ? "" : "border-l border-eg-border"}`}
                      onClick={() => setActiveSlot(pos.id)}
                    >
                      <span className="text-eg-red font-black text-xs w-8 shrink-0">{pos.label}</span>
                      {player ? (
                        <>
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-eg-bg border border-eg-border shrink-0 flex items-center justify-center">
                            {player.photoUrl ? (
                              <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover object-top" />
                            ) : (
                              <span className="text-[8px] font-black text-eg-muted">
                                {player.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-xs text-eg-text flex-1 truncate">{player.name}</span>
                          <button
                            className="text-eg-subtle hover:text-eg-red transition-colors text-sm shrink-0 ml-1"
                            onClick={e => { e.stopPropagation(); removePlayer(pos.id); }}
                          >×</button>
                        </>
                      ) : (
                        <span className="text-eg-subtle text-xs italic">Empty</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ── Player selector modal ─────────────────────────────────────────── */}
      {activeSlot && (
        <PlayerSelector
          players={players}
          usedIds={new Set(
            Object.entries(squad)
              .filter(([posId, p]) => p && posId !== activeSlot && !p.isCustom)
              .map(([, p]) => p!.id)
          )}
          onSelect={assignPlayer}
          onCustom={assignCustom}
          onClose={() => setActiveSlot(null)}
        />
      )}
    </div>
  );
}
