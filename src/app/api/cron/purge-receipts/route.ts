import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { purgeExpiredReceipts } from "@/lib/receipt-purge";
import { createAdminClient } from "@/lib/supabase/admin";

// Run daily by Vercel Cron (vercel.json): deletes receipt photos that never led to a review once they are
// 30 days old, as the privacy policy promises. Vercel sends "Authorization: Bearer <CRON_SECRET>";
// without CRON_SECRET set the route refuses every call, so it can't be triggered by anyone else.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(header: string | null): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || !header) return false;
  const given = Buffer.from(header);
  const wanted = Buffer.from(`Bearer ${secret}`);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

export async function GET(request: NextRequest) {
  if (!authorized(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const { deleted } = await purgeExpiredReceipts(createAdminClient());
    return NextResponse.json({ deleted });
  } catch (e) {
    console.error("receipt purge failed:", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
