import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSaveInput } from "../src/lib/saved-input.ts";

const ID = "3202ac9d-d718-430d-ab91-5d9f320aa327";
const form = (v: Record<string, string>) => ({ get: (k: string) => v[k] ?? null });

test("reads a save and a remove", () => {
  assert.deepEqual(parseSaveInput(form({ hospitalId: ID, lang: "ja", intent: "save" })), {
    hospitalId: ID,
    lang: "ja",
    save: true,
    back: `/ja/hospitals/${ID}`,
  });
  assert.equal(parseSaveInput(form({ hospitalId: ID, lang: "en", intent: "remove", back: "/en/my#saved" }))?.back, "/en/my#saved");
  assert.equal(parseSaveInput(form({ hospitalId: ID, lang: "en", intent: "remove" }))?.save, false);
});

test("never returns to another site or another language's page", () => {
  for (const back of ["https://evil.example/", "//evil.example/x", "/ko/my", "javascript:alert(1)"]) {
    assert.equal(parseSaveInput(form({ hospitalId: ID, lang: "en", intent: "save", back }))?.back, `/en/hospitals/${ID}`, back);
  }
});

test("rejects anything else", () => {
  assert.equal(parseSaveInput(form({ hospitalId: "x", lang: "en", intent: "save" })), null);
  assert.equal(parseSaveInput(form({ hospitalId: ID, lang: "fr", intent: "save" })), null);
  assert.equal(parseSaveInput(form({ hospitalId: ID, lang: "en", intent: "delete-all" })), null);
  assert.equal(parseSaveInput(form({})), null);
});
