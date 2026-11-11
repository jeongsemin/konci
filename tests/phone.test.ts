import { test } from "node:test";
import assert from "node:assert/strict";
import { phoneLinks } from "../src/lib/phone.ts";

test("area and mobile numbers get a +82 form and link", () => {
  assert.deepEqual(phoneLinks("064-747-2559"), { display: "064-747-2559", international: "+82-64-747-2559", href: "tel:+82647472559" });
  assert.deepEqual(phoneLinks("02-1234-5678"), { display: "02-1234-5678", international: "+82-2-1234-5678", href: "tel:+82212345678" });
  assert.equal(phoneLinks("010-1234-5678").href, "tel:+821012345678");
  assert.equal(phoneLinks("070-4321-1234").international, "+82-70-4321-1234");
});

test("numbers without hyphens still work", () => {
  const p = phoneLinks("0212345678");
  assert.equal(p.international, "+82-212345678");
  assert.equal(p.href, "tel:+82212345678");
});

test("numbers already in +82 form are kept consistent", () => {
  assert.equal(phoneLinks("+82-2-1234-5678").href, "tel:+82212345678");
  assert.equal(phoneLinks("+82 10 1234 5678").href, "tel:+821012345678");
});

test("nationwide numbers stay domestic", () => {
  assert.deepEqual(phoneLinks("1588-1234"), { display: "1588-1234", international: null, href: "tel:15881234" });
  assert.equal(phoneLinks("1577-7129").international, null);
});

test("odd values never produce a +82 link", () => {
  assert.equal(phoneLinks("123").international, null);
  assert.equal(phoneLinks("  ").href, "tel:");
});
