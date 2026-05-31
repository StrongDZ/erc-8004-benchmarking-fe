'use client';

import { useState } from 'react';
import { resolveIPFS } from '@/shared/api/client';

// Deterministic accent colors, matching the atoms.jsx palette
const ACCENTS = [
  '#a78bfa', // lavender
  '#6ee7b7', // mint
  '#7dd3fc', // sky
  '#fcd34d', // amber
  '#fda4af', // rose
  '#e4e4e7', // white
];

// Seeded LCG pseudo-random (same algorithm as atoms.jsx D.helpers.rng)
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0;
    return s / 0x100000000;
  };
}

function hashSeed(value: string): number {
  let h = 7;
  for (let i = 0; i < value.length; i++) h = (Math.imul(31, h) + value.charCodeAt(i)) >>> 0;
  return h;
}

function PixelAvatar({ seed, size }: { seed: string; size: number }) {
  const seedNum = hashSeed(seed);
  const rng = makeRng(seedNum);
  const accent = ACCENTS[Math.floor(rng() * ACCENTS.length)];

  const GRID = 7;
  const half = Math.ceil(GRID / 2);
  const cells: { x: number; y: number; on: boolean }[] = [];

  for (let y = 0; y < GRID; y++) {
    const t = y / (GRID - 1);
    const peak = 1 - Math.abs(t - 0.5) * 2;
    const density = 0.25 + peak * 0.45;
    for (let x = 0; x < half; x++) {
      const edge = x === 0 && (y === 0 || y === GRID - 1);
      const p = edge ? density * 0.5 : density;
      const on = rng() < p;
      cells.push({ x, y, on });
      const mx = GRID - 1 - x;
      if (mx !== x) cells.push({ x: mx, y, on });
    }
  }

  // guarantee at least one cell
  if (!cells.some((c) => c.on)) {
    const mid = cells.find((c) => c.x === Math.floor(GRID / 2) && c.y === Math.floor(GRID / 2));
    if (mid) mid.on = true;
  }

  const VB = 100;
  const pad = VB * 0.15;
  const inner = VB - pad * 2;
  const cell = inner / GRID;
  const gap = cell * 0.07;

  // Hex-encode color for inline style mixing
  const bg = `color-mix(in oklab, ${accent} 12%, #0a0a0d)`;
  const border = `color-mix(in oklab, ${accent} 18%, #1f1f24)`;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        border: `1px solid ${border}`,
        flexShrink: 0,
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${VB} ${VB}`}
        style={{ display: 'block' }}
        aria-hidden
      >
        {cells.map(
          (c, i) =>
            c.on && (
              <rect
                key={i}
                x={pad + c.x * cell + gap / 2}
                y={pad + c.y * cell + gap / 2}
                width={cell - gap}
                height={cell - gap}
                fill={accent}
              />
            ),
        )}
      </svg>
    </div>
  );
}

interface AgentAvatarProps {
  /** Raw image field from the API (may be ipfs://, https://, or empty). */
  image?: string | null;
  /** Seed for the pixel avatar — typically agentId or address. */
  seed: string;
  /** Pixel size (width = height). */
  size?: number;
  alt?: string;
  className?: string;
}

/**
 * Shows the agent's image when available; falls back to a deterministic
 * 7×7 pixel-creature avatar generated from `seed`.
 */
export function AgentAvatar({ image, seed, size = 36, alt = '', className }: AgentAvatarProps) {
  const [failed, setFailed] = useState(false);
  const src = image ? resolveIPFS(image) : null;

  if (!src || failed) {
    return (
      <span className={className} style={{ display: 'inline-flex', flexShrink: 0 }}>
        <PixelAvatar seed={seed} size={size} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ flexShrink: 0 }}
      onError={() => setFailed(true)}
    />
  );
}
