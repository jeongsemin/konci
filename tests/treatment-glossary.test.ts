import { test } from "node:test";
import assert from "node:assert/strict";
import { locales } from "../src/i18n/config.ts";
import { consultationPhrase, getTreatment, GLOSSARY_UPDATED, TREATMENTS, treatmentByKo } from "../src/lib/treatment-glossary.ts";
import { treatmentSpec } from "../src/lib/search-params.ts";

test("slugs are unique, URL-safe and findable", () => {
  const slugs = TREATMENTS.map((t) => t.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const t of TREATMENTS) {
    assert.match(t.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.equal(getTreatment(t.slug), t);
    assert.equal(treatmentByKo(t.ko), t);
  }
  assert.equal(getTreatment("nope"), undefined);
});

test("every language has every text, with the same number of questions", () => {
  for (const t of TREATMENTS) {
    for (const l of locales) {
      const x = t.text[l];
      assert.ok(x.name.trim() && x.summary.trim() && x.about.trim() && x.after.trim(), `${t.slug}/${l}`);
      assert.equal(x.ask.length, t.text.en.ask.length, `${t.slug}/${l} questions`);
      for (const q of x.ask) assert.ok(q.trim(), `${t.slug}/${l} question`);
    }
  }
});

test("Korean names are Korean, readings are Latin, keywords are lower case and include the Korean name", () => {
  const hangul = /[가-힣]/;
  for (const t of TREATMENTS) {
    assert.ok(hangul.test(t.ko), t.slug);
    assert.ok(!hangul.test(t.romanized), t.slug);
    for (const k of t.keywords) assert.equal(k, k.toLowerCase(), `${t.slug}: ${k}`);
    assert.ok(t.keywords.some((k) => t.ko.includes(k) || k.includes(t.ko.split(/[ ·]/)[0])), `${t.slug} keywords name it in Korean`);
  }
});

test("texts make no promises and name no prices", () => {
  const banned = /guarantee|best|safest|painless|permanent|보장|최고|무통|영구|保証|最高|保证|最好|₩|\d+\s*(원|won|万|萬)/i;
  for (const t of TREATMENTS) {
    for (const l of locales) {
      const text = JSON.stringify(t.text[l]);
      assert.ok(!banned.test(text), `${t.slug}/${l}: ${text.match(banned)?.[0]}`);
    }
  }
});

test("the search filter looks for a glossary treatment in every language", () => {
  const spec = treatmentSpec("리쥬란");
  assert.ok(spec);
  assert.ok(spec.keywords.includes("rejuran") && spec.keywords.includes("リジュラン") && spec.keywords.includes("丽珠兰"));
  // The home-page chips keep their own keywords.
  assert.ok(treatmentSpec("레이저 토닝")?.keywords.includes("laser"));
});

test("the consultation phrase names the treatment", () => {
  const t = getTreatment("botox")!;
  assert.deepEqual(consultationPhrase(t), { ko: "보톡스 상담을 받고 싶어요.", romanized: "botokseu sangdameul batgo sipeoyo." });
});

test("the last-checked date is a real date", () => {
  assert.match(GLOSSARY_UPDATED, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(!Number.isNaN(new Date(GLOSSARY_UPDATED).getTime()));
});
