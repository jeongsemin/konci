import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ErrorThrottle, buildErrorMail, errorInfo, errorKey } from "../src/lib/error-alert.ts";

const ctx = { routePath: "/[lang]/search", routeType: "render" };

describe("error alert", () => {
  it("keeps the route and message but drops the query string", () => {
    const e = errorInfo(Object.assign(new Error("boom\n  at x"), { digest: "123" }), { path: "/ko/search?q=비밀검색어", method: "GET" }, ctx);
    assert.equal(e.path, "/ko/search");
    assert.equal(e.message, "boom at x");
    assert.equal(e.digest, "123");
    assert.equal(errorInfo("plain", { path: "/", method: "POST" }, ctx).message, "plain");
    const mail = buildErrorMail(e);
    assert.equal(mail.subject, "[KONCI] 서버 오류: /[lang]/search");
    assert.match(mail.text, /요청: GET \/ko\/search\n/);
    assert.match(mail.text, /\(페이지\)/);
    assert.doesNotMatch(mail.text, /비밀검색어/);
  });

  it("mails the same error once an hour and caps the day", () => {
    const t = new ErrorThrottle(60_000, 3);
    const now = Date.parse("2026-11-19T00:00:00Z");
    assert.equal(t.allow("a", now), true);
    assert.equal(t.allow("a", now + 1_000), false);
    assert.equal(t.allow("b", now + 1_000), true);
    assert.equal(t.allow("a", now + 61_000), true);
    assert.equal(t.allow("c", now + 62_000), false); // 3 a day
    assert.equal(t.allow("c", now + 86_400_000), true); // next day
  });

  it("tells errors apart by route type, route and message", () => {
    const a = errorInfo(new Error("x"), { path: "/a", method: "GET" }, ctx);
    const b = errorInfo(new Error("x"), { path: "/b", method: "GET" }, { ...ctx, routeType: "action" });
    assert.notEqual(errorKey(a), errorKey(b));
    assert.equal(errorKey(a), errorKey(errorInfo(new Error("x"), { path: "/ko/search?q=1", method: "GET" }, ctx)));
  });
});
