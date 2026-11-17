import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { alertConfigured, buildReceiptAlert, recipients, shouldAlert } from "../src/lib/receipt-alert.ts";

describe("receipt alert", () => {
  it("is on only when both the key and the address are set", () => {
    assert.equal(alertConfigured({}), false);
    assert.equal(alertConfigured({ RESEND_API_KEY: "k" }), false);
    assert.equal(alertConfigured({ RESEND_API_KEY: " ", ALERT_EMAIL_TO: "a@x.kr" }), false);
    assert.equal(alertConfigured({ RESEND_API_KEY: "k", ALERT_EMAIL_TO: "a@x.kr" }), true);
  });

  it("mails only for the first receipt waiting within the hour", () => {
    assert.equal(shouldAlert(0), true);
    assert.equal(shouldAlert(1), false);
    assert.equal(shouldAlert(5), false);
  });

  it("reads several addresses separated by commas", () => {
    assert.deepEqual(recipients(" a@x.kr, b@x.kr ,,"), ["a@x.kr", "b@x.kr"]);
    assert.deepEqual(recipients(undefined), []);
  });

  it("names the clinic, the queue size and the admin page, in Korea time", () => {
    const mail = buildReceiptAlert({
      hospitalName: "데이뷰의원\r\nBcc: x@y.z",
      pending: 3,
      siteUrl: "https://konci.kr/",
      now: new Date("2026-11-17T01:00:00Z"),
    });
    assert.equal(mail.subject, "[KONCI] 확인할 영수증 3건");
    assert.match(mail.text, /병원: 데이뷰의원 Bcc: x@y\.z\n/);
    assert.match(mail.text, /확인 대기: 3건/);
    assert.match(mail.text, /https:\/\/konci\.kr\/ko\/admin\n/);
    assert.match(mail.text, /오전 10:00/);
  });
});
