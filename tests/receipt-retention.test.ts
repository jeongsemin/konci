import { test } from "node:test";
import assert from "node:assert/strict";
import { canReuseHash, isUnusedExpired, UNUSED_RECEIPT_DAYS } from "../src/lib/receipt-retention.ts";

const now = new Date("2026-11-30T00:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();

test("an unused receipt expires after the retention period", () => {
  assert.equal(UNUSED_RECEIPT_DAYS, 30);
  assert.equal(isUnusedExpired({ status: "approved", created_at: daysAgo(30), hasReview: false }, now), true);
  assert.equal(isUnusedExpired({ status: "auto_approved", created_at: daysAgo(31), hasReview: false }, now), true);
  assert.equal(isUnusedExpired({ status: "rejected", created_at: daysAgo(45), hasReview: false }, now), true);
  assert.equal(isUnusedExpired({ status: "approved", created_at: daysAgo(29), hasReview: false }, now), false);
});

test("a receipt behind a review is never expired", () => {
  assert.equal(isUnusedExpired({ status: "approved", created_at: daysAgo(400), hasReview: true }, now), false);
});

test("a receipt waiting for an administrator is never expired", () => {
  assert.equal(isUnusedExpired({ status: "pending", created_at: daysAgo(400), hasReview: false }, now), false);
});

test("an unreadable date is kept rather than deleted", () => {
  assert.equal(isUnusedExpired({ status: "approved", created_at: "not a date", hasReview: false }, now), false);
});

test("only the original member can upload a deleted receipt again", () => {
  assert.equal(canReuseHash("user-a", "user-a"), true);
  assert.equal(canReuseHash("user-a", "user-b"), false);
  assert.equal(canReuseHash(null, "user-a"), false); // the account was deleted: the photo stays blocked
});
