import type { Instrumentation } from "next";

// Server errors are mailed to the administrators (see src/lib/error-alert.ts).
// Loaded lazily and only on the Node.js runtime, so nothing here runs on the edge or slows startup.
let throttle: import("./lib/error-alert").ErrorThrottle | undefined;

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.RESEND_API_KEY?.trim() || !process.env.ALERT_EMAIL_TO?.trim()) return;
  try {
    const { ErrorThrottle, buildErrorMail, errorInfo, errorKey } = await import("./lib/error-alert");
    const { sendAdminMail } = await import("./lib/receipt-alert");
    const info = errorInfo(err, request, context);
    throttle ??= new ErrorThrottle();
    if (!throttle.allow(errorKey(info))) return;
    const { subject, text } = buildErrorMail(info);
    await sendAdminMail(subject, text, "error alert");
  } catch (e) {
    console.error("error alert failed:", e);
  }
};
