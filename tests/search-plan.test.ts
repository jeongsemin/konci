import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planSlices } from "../src/lib/search-plan.ts";

describe("planSlices", () => {
  it("takes the first page from the first tiers, in order", () => {
    assert.deepEqual(planSlices([1, 5, 20, 100], 0, 10), [
      { tier: 0, from: 0, to: 0 },
      { tier: 1, from: 0, to: 4 },
      { tier: 2, from: 0, to: 3 },
    ]);
  });
  it("continues inside a tier on the next page", () => {
    assert.deepEqual(planSlices([1, 5, 20, 100], 10, 10), [{ tier: 2, from: 4, to: 13 }]);
  });
  it("spans a tier boundary in the middle of a page", () => {
    assert.deepEqual(planSlices([3, 0, 4, 50], 5, 10), [
      { tier: 2, from: 2, to: 3 },
      { tier: 3, from: 0, to: 7 },
    ]);
  });
  it("skips empty tiers and returns nothing past the end", () => {
    assert.deepEqual(planSlices([0, 0, 0, 7], 0, 10), [{ tier: 3, from: 0, to: 6 }]);
    assert.deepEqual(planSlices([2, 3], 5, 10), []);
    assert.deepEqual(planSlices([], 0, 10), []);
  });
  it("covers every row exactly once across all pages", () => {
    const counts = [1, 17, 0, 23, 6];
    const total = counts.reduce((a, b) => a + b, 0);
    const seen = new Set<string>();
    for (let page = 0; page * 10 < total; page++) {
      for (const s of planSlices(counts, page * 10, 10)) {
        for (let i = s.from; i <= s.to; i++) {
          const key = `${s.tier}:${i}`;
          assert.equal(seen.has(key), false, `${key} shown twice`);
          seen.add(key);
        }
      }
    }
    assert.equal(seen.size, total);
  });
});
