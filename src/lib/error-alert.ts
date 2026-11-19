// Server error alerts by email (to ALERT_EMAIL_TO, through Resend). Called from src/instrumentation.ts.
// The same error (same route and message) is mailed at most once an hour, and at most 20 mails a day.
// The limit is kept in the server's memory: Vercel may run several copies of the server, each with its own
// count, so a burst can send a few more mails than that — never an unbounded stream.
// The mail has the route, the address without its query (search words stay out) and the error message;
// never cookies, headers or anything about the member.

export const ERROR_WINDOW_MS = 60 * 60 * 1000;
export const ERROR_DAILY_MAX = 20;

export type ErrorInfo = {
  message: string;
  digest?: string;
  method: string;
  path: string;
  routePath: string;
  routeType: string;
};

/** Reads what onRequestError gets into the few fields the mail uses. */
export function errorInfo(
  err: unknown,
  request: { path: string; method: string },
  context: { routePath: string; routeType: string },
): ErrorInfo {
  const message = err instanceof Error ? err.message : String(err);
  const digest = typeof err === "object" && err !== null && "digest" in err ? String((err as { digest: unknown }).digest) : undefined;
  return {
    message: message.replace(/\s+/g, " ").trim().slice(0, 300) || "(no message)",
    digest,
    method: request.method,
    path: request.path.split("?")[0].slice(0, 200),
    routePath: context.routePath,
    routeType: context.routeType,
  };
}

/** Same route, same kind of request, same message: the same error. */
export const errorKey = (e: ErrorInfo) => `${e.routeType} ${e.routePath} ${e.message.slice(0, 120)}`;

/** Decides which errors are mailed: once an hour per error, at most `dailyMax` a day. */
export class ErrorThrottle {
  private last = new Map<string, number>();
  private day = "";
  private sentToday = 0;

  private windowMs: number;
  private dailyMax: number;

  constructor(windowMs = ERROR_WINDOW_MS, dailyMax = ERROR_DAILY_MAX) {
    this.windowMs = windowMs;
    this.dailyMax = dailyMax;
  }

  allow(key: string, now = Date.now()): boolean {
    const today = new Date(now).toISOString().slice(0, 10);
    if (today !== this.day) {
      this.day = today;
      this.sentToday = 0;
    }
    if (this.sentToday >= this.dailyMax) return false;
    const before = this.last.get(key);
    if (before !== undefined && now - before < this.windowMs) return false;
    if (this.last.size > 500) this.last.clear();
    this.last.set(key, now);
    this.sentToday += 1;
    return true;
  }
}

const ROUTE_TYPE: Record<string, string> = { render: "페이지", route: "API", action: "서버 액션", proxy: "프록시" };

export function buildErrorMail(e: ErrorInfo, now = new Date()): { subject: string; text: string } {
  const when = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "medium" }).format(now);
  return {
    subject: `[KONCI] 서버 오류: ${e.routePath}`.slice(0, 150),
    text: [
      `사이트에서 오류가 발생했어요. (${when})`,
      "",
      `위치: ${e.routePath} (${ROUTE_TYPE[e.routeType] ?? e.routeType})`,
      `요청: ${e.method} ${e.path}`,
      `내용: ${e.message}`,
      ...(e.digest ? [`digest: ${e.digest}`] : []),
      "",
      "자세한 내용은 Vercel 프로젝트 > Logs에서 위 시각과 digest로 찾을 수 있어요.",
      `같은 오류는 한 시간에 한 번만 알려 드려요. 하루 최대 ${ERROR_DAILY_MAX}통입니다.`,
    ].join("\n"),
  };
}
