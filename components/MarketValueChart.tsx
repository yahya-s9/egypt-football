"use client";

import { useState } from "react";
import type { MarketValueEntry } from "@/lib/transfermarkt";
import { formatValue } from "@/lib/transfermarkt";

export default function MarketValueChart({
  history,
  currentValue,
}: {
  history: MarketValueEntry[];
  currentValue: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (history.length < 2) return null;

  // ── SVG dimensions ──────────────────────────────────────────────────────
  const VW = 600, VH = 180;
  const PAD = { top: 24, right: 16, bottom: 32, left: 56 };
  const W = VW - PAD.left - PAD.right;
  const H = VH - PAD.top  - PAD.bottom;

  const dates  = history.map(d => new Date(d.date).getTime());
  const values = history.map(d => d.marketValue);
  const minT = dates[0], maxT = dates[dates.length - 1];
  const maxV = Math.max(...values);

  const x = (t: number) => PAD.left + ((t - minT) / (maxT - minT)) * W;
  const y = (v: number) => PAD.top  + H - (v / maxV) * H;

  const pts = history.map((d, i) => ({
    x: x(dates[i]),
    y: y(d.marketValue),
    ...d,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${(PAD.top + H).toFixed(1)} L${pts[0].x.toFixed(1)},${(PAD.top + H).toFixed(1)} Z`;

  const peakIdx = values.indexOf(maxV);

  // ── Y-axis labels ────────────────────────────────────────────────────────
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(frac => ({
    v: maxV * frac,
    y: y(maxV * frac),
  }));

  // ── X-axis year labels (at most 6) ───────────────────────────────────────
  const years = Array.from(new Set(history.map(d => d.date.slice(0, 4)))).sort();
  const step  = Math.max(1, Math.ceil(years.length / 6));
  const xLabels = years.filter((_, i) => i % step === 0 || i === years.length - 1);

  const hoveredPt = hovered !== null ? pts[hovered] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full h-auto"
        style={{ overflow: "visible" }}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="mv-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#D4002A" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#D4002A" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map(({ y: ty }, i) => (
          <line key={i} x1={PAD.left} x2={PAD.left + W} y1={ty} y2={ty}
            stroke="#d8cfc2" strokeWidth="0.5" strokeDasharray={i === 0 ? "0" : "3,3"} />
        ))}

        {/* Y-axis labels */}
        {yTicks.slice(1).map(({ v, y: ty }) => (
          <text key={v} x={PAD.left - 6} y={ty + 4} textAnchor="end"
            fontSize={9} fill="#9ca3af">{formatValue(v)}</text>
        ))}

        {/* X-axis labels */}
        {xLabels.map(yr => {
          const t = new Date(`${yr}-01-01`).getTime();
          if (t < minT || t > maxT) return null;
          return (
            <text key={yr} x={x(t)} y={VH - 6} textAnchor="middle"
              fontSize={9} fill="#9ca3af">{yr}</text>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#mv-fill)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#D4002A" strokeWidth="2" strokeLinejoin="round" />

        {/* Peak annotation */}
        {peakIdx > 0 && (
          <>
            <line x1={pts[peakIdx].x} x2={pts[peakIdx].x}
              y1={PAD.top} y2={pts[peakIdx].y - 6}
              stroke="#C8A84B" strokeWidth="1" strokeDasharray="3,2" />
            <text x={pts[peakIdx].x} y={PAD.top - 4}
              textAnchor="middle" fontSize={9} fill="#C8A84B" fontWeight="bold">
              Peak {formatValue(maxV)}
            </text>
          </>
        )}

        {/* Data point dots — all subtle, hovered one bigger */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y}
            r={hovered === i ? 5 : 2.5}
            fill={hovered === i ? "#D4002A" : "#fff"}
            stroke="#D4002A"
            strokeWidth="1.5"
            style={{ cursor: "pointer", transition: "r 0.1s" }}
            onMouseEnter={() => setHovered(i)}
          />
        ))}

        {/* Hover tooltip */}
        {hoveredPt && (
          <g>
            {/* Vertical rule */}
            <line x1={hoveredPt.x} x2={hoveredPt.x}
              y1={PAD.top} y2={PAD.top + H}
              stroke="#D4002A" strokeWidth="0.8" strokeDasharray="3,2" />
            {/* Tooltip box */}
            {(() => {
              const tipW = 110, tipH = 42;
              const tipX = hoveredPt.x + 8 + tipW > VW ? hoveredPt.x - tipW - 8 : hoveredPt.x + 8;
              const tipY = Math.max(PAD.top, hoveredPt.y - tipH / 2);
              return (
                <g>
                  <rect x={tipX} y={tipY} width={tipW} height={tipH}
                    rx="4" fill="#111827" fillOpacity="0.9" />
                  <text x={tipX + 8} y={tipY + 14} fontSize={10} fill="#f5e27d" fontWeight="bold">
                    {formatValue(hoveredPt.marketValue)}
                  </text>
                  <text x={tipX + 8} y={tipY + 27} fontSize={9} fill="#9ca3af">
                    {hoveredPt.date.slice(0, 7)} · {hoveredPt.clubName}
                  </text>
                  <text x={tipX + 8} y={tipY + 38} fontSize={8} fill="#6b7280">
                    Age {hoveredPt.age}
                  </text>
                </g>
              );
            })()}
          </g>
        )}
      </svg>

      {/* Current value badge */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-eg-muted">Source: Transfermarkt</span>
        <span className="text-xs font-bold text-eg-text">
          Current: <span className="text-eg-red">{formatValue(currentValue)}</span>
        </span>
      </div>
    </div>
  );
}
