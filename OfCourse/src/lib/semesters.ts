// Academic terms a post can be tagged with: the current term plus the
// previous few years. Spring = Jan–Apr, Summer = May–Jul, Fall = Aug–Dec.
const TERMS = ["Spring", "Summer", "Fall"] as const;

function termIndex(month: number): number {
  if (month <= 3) return 0;
  if (month <= 6) return 1;
  return 2;
}

export function semesterOptions(now = new Date(), count = 12): string[] {
  let year = now.getFullYear();
  let term = termIndex(now.getMonth());
  const options: string[] = [];
  for (let i = 0; i < count; i++) {
    options.push(`${TERMS[term]} ${year}`);
    term -= 1;
    if (term < 0) {
      term = TERMS.length - 1;
      year -= 1;
    }
  }
  return options;
}

export function isValidSemester(value: string): boolean {
  return semesterOptions().includes(value);
}
