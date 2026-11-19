import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  QUEUES,
  alertConfigured,
  buildDecisionMail,
  buildQueueAlert,
  memberMailConfigured,
  recipients,
  shouldAlert,
  type QueueKind,
} from "../src/lib/receipt-alert.ts";

describe("receipt alert", () => {
  it("is on only when both the key and the address are set", () => {
    assert.equal(alertConfigured({}), false);
    assert.equal(alertConfigured({ RESEND_API_KEY: "k" }), false);
    assert.equal(alertConfigured({ RESEND_API_KEY: " ", ALERT_EMAIL_TO: "a@x.kr" }), false);
    assert.equal(alertConfigured({ RESEND_API_KEY: "k", ALERT_EMAIL_TO: "a@x.kr" }), true);
  });

  it("mails only for the first item of a kind waiting within the hour (the new one is counted)", () => {
    assert.equal(shouldAlert(0), true);
    assert.equal(shouldAlert(1), true);
    assert.equal(shouldAlert(2), false);
    assert.equal(shouldAlert(5), false);
  });

  it("reads several addresses separated by commas", () => {
    assert.deepEqual(recipients(" a@x.kr, b@x.kr ,,"), ["a@x.kr", "b@x.kr"]);
    assert.deepEqual(recipients(undefined), []);
  });

  it("names the clinic, the queue size and the admin page, in Korea time", () => {
    const mail = buildQueueAlert({
      kind: "receipt",
      details: [["병원", "데이뷰의원\r\nBcc: x@y.z"]],
      pending: 3,
      siteUrl: "https://konci.kr/",
      now: new Date("2026-11-17T01:00:00Z"),
    });
    assert.equal(mail.subject, "[KONCI] 확인할 영수증 3건");
    assert.match(mail.text, /병원: 데이뷰의원 Bcc: x@y\.z\n/);
    assert.match(mail.text, /확인 대기: 3건/);
    assert.match(mail.text, /https:\/\/konci\.kr\/ko\/admin\n/);
    assert.match(mail.text, /오전 10:00/);
    assert.match(mail.text, /1~2일/);
  });

  it("has a subject, details and the right admin page for each kind", () => {
    const at = (kind: QueueKind, details: [string, string][]) => buildQueueAlert({ kind, details, pending: 2, siteUrl: "https://konci.kr" });
    const edit = at("edit", [["병원", "데이뷰의원"], ["항목", "전화번호"]]);
    assert.equal(edit.subject, "[KONCI] 확인할 수정 요청 2건");
    assert.match(edit.text, /항목: 전화번호/);
    assert.match(edit.text, /konci\.kr\/ko\/admin\/edits\n/);
    assert.match(at("report", [["사유", "광고·홍보"]]).text, /konci\.kr\/ko\/admin\/reports\n/);
    assert.match(at("manager", [["병원", "데이뷰의원"]]).subject, /병원 관리자 신청 2건/);
    assert.match(at("feedback", [["분류", "오류"]]).text, /konci\.kr\/ko\/feedback\n/);
    assert.doesNotMatch(edit.text, /1~2일/);
  });

  it("knows the table and waiting status of every queue", () => {
    assert.deepEqual(
      Object.entries(QUEUES).map(([k, q]) => [k, q.table, q.status]),
      [
        ["receipt", "receipts", "pending"],
        ["edit", "hospital_edit_requests", "open"],
        ["report", "review_reports", "open"],
        ["manager", "hospital_managers", "pending"],
        ["feedback", "feedback_posts", "open"],
      ],
    );
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
