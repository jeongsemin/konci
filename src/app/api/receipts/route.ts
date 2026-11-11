import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readReceipt } from "@/lib/clova-ocr";
import { isAcceptableSize, sniffImage } from "@/lib/receipt-file";
import { canReuseHash } from "@/lib/receipt-retention";
import { decideReceipt, receiptContentKey } from "@/lib/receipt-verify";

const DAILY_LIMIT = 10;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "notLoggedIn" }, { status: 401 });

  const form = await request.formData();
  const hospitalId = String(form.get("hospitalId") ?? "");
  const file = form.get("file");
  if (!(file instanceof File) || !isAcceptableSize(file.size)) {
    return NextResponse.json({ error: "badFile" }, { status: 400 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const format = sniffImage(bytes); // trust the bytes, not the client-supplied type
  if (!format) return NextResponse.json({ error: "badFile" }, { status: 400 });

  const admin = createAdminClient();
  const { data: suspension } = await admin.from("suspensions").select("user_id").eq("user_id", auth.user.id).maybeSingle();
  if (suspension) return NextResponse.json({ error: "suspended" }, { status: 403 });

  const { data: hospital } = await admin
    .from("hospitals")
    .select("id, name, closed_at")
    .eq("id", hospitalId)
    .maybeSingle();
  if (!hospital) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (hospital.closed_at) return NextResponse.json({ error: "closed" }, { status: 409 });

  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await admin
    .from("receipts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= DAILY_LIMIT) return NextResponse.json({ error: "generic" }, { status: 429 });

  const fileHash = createHash("sha256").update(bytes).digest("hex");
  const { data: dup } = await admin.from("receipts").select("id").eq("file_hash", fileHash).maybeSingle();
  if (dup) return NextResponse.json({ error: "duplicate" }, { status: 409 });
  // A photo whose receipt was deleted (with its review or account) can only be used again by the same member.
  const { data: remembered } = await admin.from("used_receipt_hashes").select("user_id").eq("file_hash", fileHash).maybeSingle();
  if (remembered && !canReuseHash(remembered.user_id, auth.user.id)) return NextResponse.json({ error: "duplicate" }, { status: 409 });

  const storagePath = `${auth.user.id}/${crypto.randomUUID()}.${format}`;
  const { error: upErr } = await admin.storage
    .from("receipts")
    .upload(storagePath, bytes, { contentType: format === "jpg" ? "image/jpeg" : "image/png" });
  if (upErr) return NextResponse.json({ error: "generic" }, { status: 500 });

  // Automatic check. Anything that fails or can't be read goes to the manual queue.
  const ocr = await readReceipt(bytes, format);
  const { status, reasons, score } = decideReceipt(ocr?.parsed ?? null, hospital.name);

  // One paper receipt, one review: a new photo of a receipt already in use is refused, for any member.
  // Only checked when the OCR read the date, total and approval number (or time); otherwise the manual queue decides.
  const contentKey = (() => {
    const key = receiptContentKey(ocr?.parsed ?? null);
    return key ? createHash("sha256").update(key).digest("hex") : null;
  })();
  if (contentKey) {
    const [{ data: live }, { data: gone }] = await Promise.all([
      admin.from("receipts").select("id").eq("content_key", contentKey).neq("status", "rejected").limit(1).maybeSingle(),
      admin.from("used_receipt_hashes").select("user_id").eq("file_hash", `key:${contentKey}`).maybeSingle(),
    ]);
    if (live || (gone && !canReuseHash(gone.user_id, auth.user.id))) {
      await admin.storage.from("receipts").remove([storagePath]);
      return NextResponse.json({ error: "duplicate" }, { status: 409 });
    }
  }

  const { data: receipt, error } = await admin
    .from("receipts")
    .insert({
      user_id: auth.user.id,
      hospital_id: hospital.id,
      storage_path: storagePath,
      file_hash: fileHash,
      content_key: contentKey,
      status,
      ocr_store_name: ocr?.parsed.storeName ?? null,
      ocr_paid_on: ocr?.parsed.paidOn ?? null,
      ocr_total: ocr?.parsed.total ?? null,
      match_score: score,
      ocr_raw: { reasons, clova: ocr?.raw ?? null },
    })
    .select("id, status")
    .single();
  if (error || !receipt) {
    await admin.storage.from("receipts").remove([storagePath]);
    return NextResponse.json({ error: error?.code === "23505" ? "duplicate" : "generic" }, { status: 500 });
  }

  return NextResponse.json({ id: receipt.id, status: receipt.status, reasons });
}
