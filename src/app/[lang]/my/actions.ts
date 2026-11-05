"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { parseMemberDetails } from "@/lib/member-details";
import { parseNickname } from "@/lib/profile-input";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { forgetMember, purgeReceipts, removeStored } from "@/lib/receipt-purge";

export type NicknameState = { ok?: true; error?: "invalid" | "notLoggedIn" | "generic" } | null;

export async function updateNickname(_prev: NicknameState, form: FormData): Promise<NicknameState> {
  const nickname = parseNickname(String(form.get("nickname") ?? ""));
  if (!nickname) return { error: "invalid" };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "notLoggedIn" };

  // RLS limits this to the caller's own profile row.
  const { error } = await supabase.from("profiles").update({ display_name: nickname }).eq("id", auth.user.id);
  if (error) return { error: "generic" };

  const lang = String(form.get("lang") ?? "");
  if (hasLocale(lang)) revalidatePath(`/${lang}/my`);
  return { ok: true };
}

export type DetailsState = { ok?: true; error?: "invalid" | "notLoggedIn" | "generic" } | null;

export async function updateMemberDetails(_prev: DetailsState, form: FormData): Promise<DetailsState> {
  const details = parseMemberDetails((key) => {
    const v = form.get(key);
    return typeof v === "string" ? v : null;
  });
  if (!details) return { error: "invalid" };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "notLoggedIn" };

  // RLS limits this to the caller's own row; the row is private to them and the admins' member list.
  const { error } = await supabase
    .from("member_details")
    .upsert({ user_id: auth.user.id, ...details, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return { error: "generic" };

  const lang = String(form.get("lang") ?? "");
  if (hasLocale(lang)) revalidatePath(`/${lang}/my`);
  return { ok: true };
}

export async function deleteReview(form: FormData) {
  const id = String(form.get("reviewId") ?? "");
  const lang = String(form.get("lang") ?? "");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || !id) return;

  // The receipt behind the review is deleted with it (photo and OCR text; only a hash is kept so the same
  // photo can't back another review). Deleting the receipt row takes the review with it.
  const { data: review } = await supabase.from("reviews").select("receipt_id").eq("id", id).eq("user_id", auth.user.id).maybeSingle();
  if (!review) return;
  const admin = createAdminClient();
  const { data: receipt } = await admin.from("receipts").select("id, storage_path").eq("id", review.receipt_id).eq("user_id", auth.user.id).maybeSingle();
  if (receipt) await purgeReceipts(admin, [receipt]);
  // Filter by author as well as relying on RLS ("review delete own").
  await supabase.from("reviews").delete().eq("id", id).eq("user_id", auth.user.id);
  if (hasLocale(lang)) revalidatePath(`/${lang}/my`);
}

export type DeleteAccountState = { error?: "notLoggedIn" | "admin" | "notConfirmed" | "generic" } | null;

/**
 * Deletes the signed-in member's account: receipt photos and manager proofs first, then the user, which
 * cascades to the profile, details, reviews, receipts, reports, edit requests and manager applications.
 * Administrators step down first so the service is never left without one.
 */
export async function deleteAccount(_prev: DeleteAccountState, form: FormData): Promise<DeleteAccountState> {
  if (form.get("confirm") !== "yes") return { error: "notConfirmed" };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "notLoggedIn" };
  const userId = auth.user.id;

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", userId).maybeSingle();
  if (profile?.is_admin) return { error: "admin" };

  try {
    const [{ data: receipts }, { data: proofs }] = await Promise.all([
      admin.from("receipts").select("storage_path").eq("user_id", userId),
      admin.from("hospital_managers").select("proof_path").eq("user_id", userId),
    ]);
    // Files first: if this fails the account is untouched and the member can try again.
    await removeStored(admin, "receipts", (receipts ?? []).map((r) => r.storage_path));
    await removeStored(admin, "manager-proofs", (proofs ?? []).map((p) => p.proof_path));
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return { error: "generic" };
    await forgetMember(admin, userId);
  } catch {
    return { error: "generic" };
  }

  await supabase.auth.signOut().catch(() => {});
  const lang = String(form.get("lang") ?? "");
  redirect(`/${hasLocale(lang) ? lang : "en"}`);
}
