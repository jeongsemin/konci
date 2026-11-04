import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_MANAGERS, hasRoomForManager, parseManagerInput, sniffProof } from "../src/lib/manager-input.ts";

const ID = "11111111-2222-4333-8444-555555555555";
const form = (o: Record<string, string>) => (k: string) => o[k] ?? null;

describe("sniffProof", () => {
  it("recognises JPEG, PNG and PDF by their first bytes", () => {
    assert.equal(sniffProof(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])), "jpg");
    assert.equal(sniffProof(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), "png");
    assert.equal(sniffProof(new TextEncoder().encode("%PDF-1.7\n")), "pdf");
  });
  it("rejects everything else, whatever the file is called", () => {
    assert.equal(sniffProof(new TextEncoder().encode("<html><script>alert(1)</script>")), null);
    assert.equal(sniffProof(new TextEncoder().encode("PK\u0003\u0004 zip")), null);
    assert.equal(sniffProof(new TextEncoder().encode("%PDF")), null);
    assert.equal(sniffProof(new Uint8Array()), null);
  });
});

describe("parseManagerInput", () => {
  it("reads the hospital, position and contact, tidying the spacing", () => {
    assert.deepEqual(parseManagerInput(form({ hospitalId: ID, position: "  Clinic   director ", contact: "02-3477-2020 / a@b.kr" })), {
      hospitalId: ID,
      position: "Clinic director",
      contact: "02-3477-2020 / a@b.kr",
    });
  });
  it("measures by code point, so Korean text counts per character", () => {
    assert.ok(parseManagerInput(form({ hospitalId: ID, position: "원장", contact: "02-3477-2020" })));
    assert.equal(parseManagerInput(form({ hospitalId: ID, position: "장", contact: "02-3477-2020" })), null);
    assert.ok(parseManagerInput(form({ hospitalId: ID, position: "가".repeat(60), contact: "02-3477-2020" })));
    assert.equal(parseManagerInput(form({ hospitalId: ID, position: "가".repeat(61), contact: "02-3477-2020" })), null);
    assert.ok(parseManagerInput(form({ hospitalId: ID, position: "원장", contact: "1".repeat(100) })));
    assert.equal(parseManagerInput(form({ hospitalId: ID, position: "원장", contact: "1".repeat(101) })), null);
    assert.equal(parseManagerInput(form({ hospitalId: ID, position: "원장", contact: "1234" })), null);
  });
  it("rejects a bad hospital id, missing fields and markup instead of cutting", () => {
    assert.equal(parseManagerInput(form({ hospitalId: "nope", position: "원장", contact: "02-3477-2020" })), null);
    assert.equal(parseManagerInput(form({ position: "원장", contact: "02-3477-2020" })), null);
    assert.equal(parseManagerInput(form({ hospitalId: ID, contact: "02-3477-2020" })), null);
    assert.equal(parseManagerInput(form({ hospitalId: ID, position: "<b>원장</b>", contact: "02-3477-2020" })), null);
    assert.equal(parseManagerInput(form({ hospitalId: ID, position: "원장", contact: "<script>alert(1)</script>" })), null);
  });
});

describe("hasRoomForManager", () => {
  it("allows up to the limit and no more", () => {
    assert.equal(MAX_MANAGERS, 3);
    assert.equal(hasRoomForManager(0), true);
    assert.equal(hasRoomForManager(2), true);
    assert.equal(hasRoomForManager(3), false);
    assert.equal(hasRoomForManager(4), false);
  });
});
