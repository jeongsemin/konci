/**
 * A search result list is made of tiers laid end to end (exact name matches, then names that
 * start with the search, and so on). Given the size of each tier, this says which rows of
 * which tier make up one page, so only those rows are fetched.
 * `from` and `to` are 0-based and inclusive, ready for a `range()` call.
 */
export type Slice = { tier: number; from: number; to: number };

export function planSlices(counts: number[], from: number, size: number): Slice[] {
  const end = from + size;
  const slices: Slice[] = [];
  let start = 0;
  counts.forEach((count, tier) => {
    const lo = Math.max(from, start);
    const hi = Math.min(end, start + count);
    if (lo < hi) slices.push({ tier, from: lo - start, to: hi - start - 1 });
    start += count;
  });
  return slices;
}
