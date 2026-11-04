import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_PENDING_PER_USER, PROOF_MIME, hasRoomForManager, isAcceptableProofSize, parseManagerInput, sniffProof } from "@/lib/manager-input";

const DAILY_LIMIT = 3;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "notLoggedIn" }, { status: 401 });
  const me = auth.user.id;

  const form = await request.formData();
  const input = parseManagerInput((key) => {
    const v = form.get(key);
    return typeof v === "string" ? v : null;
  });
  if (!input) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File) || !isAcceptableProofSize(file.size)) return NextResponse.json({ error: "badFile" }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const format = sniffProof(bytes); // trust the bytes, not the client-supplied type
  if (!format) return NextResponse.json({ error: "badFile" }, { status: 400 });

  const admin = createAdminClient();
  const { data: suspension } = await admin.from("suspensions").select("user_id").eq("user_id", me).maybeSingle();
  if (suspension) return NextResponse.json({ error: "suspended" }, { status: 403 });

  const { data: hospital } = await admin.from("hospitals").select("id").eq("id", input.hospitalId).maybeSingle();
  if (!hospital) return NextResponse.json({ error: "invalid" }, { status: 400 });

  // One waiting or approved application per member and hospital (the database enforces it too).
  const { data: live } = await admin
    .from("hospital_managers")
    .select("id")
    .eq("hospital_id", input.hospitalId)
    .eq("user_id", me)
    .in("status", ["pending", "active"])
    .maybeSingle();
  if (live) return NextResponse.json({ error: "already" }, { status: 409 });

  const { count: managers } = await admin
    .from("hospital_managers")
    .select("id", { count: "exact", head: true })
    .eq("hospital_id", input.hospitalId)
    .eq("status", "active");
  if (!hasRoomForManager(managers ?? 0)) return NextResponse.json({ error: "full" }, { status: 409 });

  const since = new Date(Date.now() - 86_400_000).toISOString();
  const [{ count: today }, { count: waiting }] = await Promise.all([
    admin.from("hospital_managers").select("id", { count: "exact", head: true }).eq("user_id", me).gte("created_at", since),
    admin.from("hospital_managers").select("id", { count: "exact", head: true }).eq("user_id", me).eq("status", "pending"),
  ]);
  if ((today ?? 0) >= DAILY_LIMIT || (waiting ?? 0) >= MAX_PENDING_PER_USER) return NextResponse.json({ error: "limit" }, { status: 429 });

  const proofPath = `${me}/${crypto.randomUUID()}.${format}`;
  const { error: uploadError } = await admin.storage.from("manager-proofs").upload(proofPath, bytes, { contentType: PROOF_MIME[format] });
  if (uploadError) return NextResponse.json({ error: "generic" }, { status: 500 });

  // Inserted as the member, so the row-level security checks apply (own row, pending, not suspended).
  const { error } = await supabase
    .from("hospital_managers")
    .insert({ hospital_id: input.hospitalId, user_id: me, position: input.position, contact: input.contact, proof_path: proofPath });
  if (error) {
    await admin.storage.from("manager-proofs").remove([proofPath]);
    return NextResponse.json({ error: error.code === "23505" ? "already" : "generic" }, { status: error.code === "23505" ? 409 : 500 });
  }

  return NextResponse.json({ ok: true });
}
