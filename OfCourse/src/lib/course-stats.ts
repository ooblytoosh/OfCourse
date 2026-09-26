// How the course stats are colored. Heavier workload and higher difficulty
// read as warnings; a high "would take again" reads as good.
export type Tone = "good" | "warn" | "bad";

export type StatReading = { tone: Tone; label: string; percent: number };

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function workloadReading(hoursPerWeek: number): StatReading {
  const percent = clamp((hoursPerWeek / 20) * 100);
  if (hoursPerWeek <= 8) return { tone: "good", label: "Light", percent };
  if (hoursPerWeek <= 14) return { tone: "warn", label: "Moderate", percent };
  return { tone: "bad", label: "Heavy", percent };
}

export function difficultyReading(outOfTen: number): StatReading {
  const percent = clamp(outOfTen * 10);
  if (outOfTen <= 4) return { tone: "good", label: "Manageable", percent };
  if (outOfTen <= 7) return { tone: "warn", label: "Challenging", percent };
  return { tone: "bad", label: "Hard", percent };
}

export function wouldTakeAgainReading(pct: number): StatReading {
  const percent = clamp(pct);
  if (pct >= 70) return { tone: "good", label: "Most would", percent };
  if (pct >= 45) return { tone: "warn", label: "Mixed", percent };
  return { tone: "bad", label: "Few would", percent };
}

// Tailwind classes per tone (text color, bar color).
export const TONE_CLASSES: Record<Tone, { text: string; bar: string }> = {
  good: { text: "text-good", bar: "bg-good" },
  warn: { text: "text-warn", bar: "bg-warn" },
  bad: { text: "text-bad", bar: "bg-bad" },
};
