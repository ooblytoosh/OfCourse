// Lightbulb brightness, mirroring public.bulb_score / public.bulb_level in
// supabase/lightbulbs.sql (used for instant feedback when you vote).

export const BULB_LEVELS = ["Unlit", "Cracked", "Dim", "Glowing", "Bright", "Radiant"] as const;

// Wilson score lower bound (95%) of the share of ON votes.
export function bulbScore(lit: number, off: number): number {
  const n = lit + off;
  if (n === 0) return 0;
  const p = lit / n;
  const z = 1.96;
  return (p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / (1 + (z * z) / n);
}

// 0 unlit (too few votes), 1 cracked (clearly unhelpful), 2 dim ... 5 radiant.
export function bulbLevel(lit: number, off: number): number {
  if (off >= 5 && lit / (lit + off) < 0.35) return 1;
  if (lit + off < 3) return 0;
  const s = bulbScore(lit, off);
  return s >= 0.8 ? 5 : s >= 0.6 ? 4 : s >= 0.35 ? 3 : 2;
}

export function bulbSummary(lit: number, off: number, level = bulbLevel(lit, off)): string {
  const name = level === 0 ? "New" : BULB_LEVELS[level];
  return `${name} · ${lit} lit, ${off} off`;
}
