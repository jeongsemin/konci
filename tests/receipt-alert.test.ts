import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { alertConfigured, buildDecisionMail, buildReceiptAlert, memberMailConfigured, recipients, shouldAlert } from "../src/lib/receipt-alert.ts";

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

  it("mails members only once a sender on a verified domain is set", () => {
    assert.equal(memberMailConfigured({ RESEND_API_KEY: "k", ALERT_EMAIL_TO: "a@x.kr" }), false);
    assert.equal(memberMailConfigured({ RESEND_API_KEY: "k", ALERT_EMAIL_FROM: "KONCI <a@konci.kr>" }), true);
    assert.equal(memberMailConfigured({ ALERT_EMAIL_FROM: "KONCI <a@konci.kr>" }), false);
  });

  it("tells the member about an approval in all four languages, linking to the review form", () => {
    const mail = buildDecisionMail({
      decision: "approved",
      hospitalId: "h1",
      hospitalName: "데이뷰의원",
      hospitalNameEn: "Dayview Clinic",
      siteUrl: "https://konci.kr/",
    });
    assert.match(mail.subject, /approved/);
    assert.match(mail.text, /Dayview Clinic was approved/);
    assert.match(mail.text, /데이뷰의원 영수증이 승인/);
    assert.match(mail.text, /承認されました/);
    assert.match(mail.text, /已通过审核/);
    assert.match(mail.text, /https:\/\/konci\.kr\/hospitals\/h1\/review/);
  });

  it("gives the reason for a rejection and points to My page", () => {
    const mail = buildDecisionMail({
      decision: "rejected",
      hospitalId: "h1",
      hospitalName: "데이뷰의원",
      reason: "날짜가\n안 보여요",
      siteUrl: "https://konci.kr",
    });
    assert.match(mail.text, /Your receipt for 데이뷰의원 could not be approved/);
    assert.match(mail.text, /사유: 날짜가 안 보여요/);
    assert.match(mail.text, /https:\/\/konci\.kr\/my$/m);
    assert.doesNotMatch(buildDecisionMail({ decision: "rejected", hospitalId: "h", hospitalName: "a", siteUrl: "x" }).text, /Reason|사유/);
  });
});
