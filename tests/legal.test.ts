import { test } from "node:test";
import assert from "node:assert/strict";
import { locales } from "../src/i18n/config.ts";
import { getLegalDoc, type LegalKind } from "../src/lib/legal/index.ts";
import { CONTACT_TOKEN } from "../src/lib/legal/types.ts";

const kinds: LegalKind[] = ["terms", "privacy"];

test("every language has the same sections and list lengths", () => {
  for (const kind of kinds) {
    const ref = getLegalDoc(kind, "ko", "a@b.c");
    for (const l of locales) {
      const doc = getLegalDoc(kind, l, "a@b.c");
      assert.equal(doc.sections.length, ref.sections.length, `${kind}/${l} section count`);
      doc.sections.forEach((s, i) => {
        assert.equal(s.items?.length ?? 0, ref.sections[i].items?.length ?? 0, `${kind}/${l} items of section ${i + 1}`);
        assert.equal(s.paragraphs?.length ?? 0, ref.sections[i].paragraphs?.length ?? 0, `${kind}/${l} paragraphs of section ${i + 1}`);
      });
    }
  }
});

test("the contact address is filled in and no token is left", () => {
  for (const kind of kinds) {
    for (const l of locales) {
      const text = JSON.stringify(getLegalDoc(kind, l, "help@example.org"));
      assert.ok(text.includes("help@example.org"), `${kind}/${l} shows the contact`);
      assert.ok(!text.includes(CONTACT_TOKEN), `${kind}/${l} has no leftover token`);
    }
  }
});

test("headings and text are never empty", () => {
  for (const kind of kinds) {
    for (const l of locales) {
      const doc = getLegalDoc(kind, l);
      assert.ok(doc.title && doc.intro);
      for (const s of doc.sections) assert.ok(s.heading.trim() && ((s.paragraphs?.length ?? 0) + (s.items?.length ?? 0)) > 0);
    }
  }
});
