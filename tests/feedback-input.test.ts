import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFeedbackInput, parseReplyInput, TITLE_MAX, BODY_MAX, REPLY_MAX } from "../src/lib/feedback-input.ts";

const form = (o: Record<string, string>) => (k: string) => o[k] ?? null;
const ID = "123e4567-e89b-12d3-a456-426614174000";

test("a complete post is accepted and tidied", () => {
  const r = parseFeedbackInput(form({ category: "bug", title: "  Map   is slow ", body: "Line 1  \r\n\r\n\r\n\r\nLine 2 " }));
  assert.deepEqual(r, { category: "bug", title: "Map is slow", body: "Line 1\n\nLine 2" });
});

test("a post needs a known category, a title and a body", () => {
  assert.equal(parseFeedbackInput(form({ category: "nope", title: "a", body: "b" })), null);
  assert.equal(parseFeedbackInput(form({ category: "idea", title: "  ", body: "b" })), null);
  assert.equal(parseFeedbackInput(form({ category: "idea", title: "a", body: " \n " })), null);
  assert.equal(parseFeedbackInput(form({ title: "a", body: "b" })), null);
});

test("limits count characters, not UTF-16 units, and nothing is cut silently", () => {
  assert.ok(parseFeedbackInput(form({ category: "idea", title: "😀".repeat(TITLE_MAX), body: "한".repeat(BODY_MAX) })));
  assert.equal(parseFeedbackInput(form({ category: "idea", title: "a".repeat(TITLE_MAX + 1), body: "b" })), null);
  assert.equal(parseFeedbackInput(form({ category: "idea", title: "a", body: "b".repeat(BODY_MAX + 1) })), null);
});

test("an administrator's reply needs a real post id and status; an empty reply clears it", () => {
  assert.deepEqual(parseReplyInput(form({ postId: ID, status: "done", reply: " Fixed. " })), { postId: ID, status: "done", reply: "Fixed." });
  assert.deepEqual(parseReplyInput(form({ postId: ID, status: "reviewing", reply: "" })), { postId: ID, status: "reviewing", reply: null });
  assert.equal(parseReplyInput(form({ postId: "x", status: "done" })), null);
  assert.equal(parseReplyInput(form({ postId: ID, status: "weird" })), null);
  assert.equal(parseReplyInput(form({ postId: ID, status: "done", reply: "a".repeat(REPLY_MAX + 1) })), null);
});
