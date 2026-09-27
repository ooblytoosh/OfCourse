// Validation rules shared by sign-up and profile editing.

export const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

export const PROFILE_LIMITS = { name: 80, major: 80, bio: 280 };

export function gradYearOptions(now = new Date()): number[] {
  const year = now.getFullYear();
  return Array.from({ length: 11 }, (_, i) => year - 4 + i);
}

export function normalizeUsername(value: string): string {
  return value.trim().replace(/^@/, "").toLowerCase();
}

// Sign-up option for "my university isn't listed": the account works, but it
// can't be university verified.
export const UNLISTED_UNIVERSITY = "other";

// "jane doe" → "Jane Doe", "mary-kate o'neil" → "Mary-Kate O'neil". Only first
// letters are changed, so names like "McDonald" keep their capitals.
export function capitalizeName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase());
}
