"use server";

import { revalidatePath } from "next/cache";
import { hasLocale } from "@/i18n/config";
import { checkRoleChange, parseEmail, type RoleError } from "@/lib/admin-roles";
import { getProfile } from "@/lib/auth";
import { hasRoomForManager } from "@/lib/manager-input";
import { pickSuspendTargets } from "@/lib/member-filters";
import { removeStored } from "@/lib/receipt-purge";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function decideReceipt(form: FormData) {
  // Re-check authorization here: server actions are public endpoints.
  const profile = await getProfile();
  if (!profile?.is_admin) throw new Error("forbidden");

  const receiptId = String(form.get("receiptId") ?? "");
  const decision = form.get("decision");
  if (!UUID.test(receiptId)) throw new Error("invalid receipt");
  if (decision !== "approved" && decision !== "rejected") throw new Error("invalid decision");
  const reason = String(form.get("reason") ?? "").replace(/\s+/g, " ").trim().slice(0, 200);

  // Only a still-pending receipt can be decided, so two admins can't overwrite each other.
  const { error } = await createAdminClient()
    .from("receipts")
    .update({
      status: decision,
      reject_reason: decision === "rejected" ? reason || null : null,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", receiptId)
    .eq("status", "pending");
  if (error) throw new Error("update failed");

  const lang = String(form.get("lang") ?? "");
  revalidatePath(`/${hasLocale(lang) ? lang : "en"}/admin`);
}

/** Suspends or restores the checked members. Administrators and the acting admin are never suspended. */
export async function setSuspension(form: FormData) {
  const profile = await getProfile();
  if (!profile?.is_admin) throw new Error("forbidden");

  const decision = form.get("decision");
  if (decision !== "suspend" && decision !== "restore") throw new Error("invalid decision");
  const ids = [...new Set(form.getAll("ids").map(String).filter((id) => UUID.test(id)))].slice(0, 100);
  if (ids.length === 0) return;
  const reason = String(form.get("reason") ?? "").replace(/\s+/g, " ").trim().slice(0, 200);

  const admin = createAdminClient();
  if (decision === "suspend") {
    const { data: admins } = await admin.from("profiles").select("id").in("id", ids).eq("is_admin", true);
    const targets = pickSuspendTargets(ids, profile.id, new Set((admins ?? []).map((a) => a.id)));
    if (targets.length > 0) {
      const { error } = await admin
        .from("suspensions")
        .upsert(targets.map((id) => ({ user_id: id, reason: reason || null, suspended_by: profile.id })), { onConflict: "user_id" });
      if (error) throw new Error("suspend failed");
    }
  } else {
    const { error } = await admin.from("suspensions").delete().in("user_id", ids);
    if (error) throw new Error("restore failed");
  }

  const lang = String(form.get("lang") ?? "");
  revalidatePath(`/${hasLocale(lang) ? lang : "en"}/admin/members`);
}

/**
 * Decides every open report on one review: dismiss them, hide the review, or hide it and also suspend
 * its author (never an administrator, never the person acting).
 */
export async function resolveReports(form: FormData) {
  const profile = await getProfile();
  if (!profile?.is_admin) throw new Error("forbidden");

  const reviewId = String(form.get("reviewId") ?? "");
  const decision = form.get("decision");
  if (!UUID.test(reviewId)) throw new Error("invalid review");
  if (decision !== "dismiss" && decision !== "hide" && decision !== "hide_suspend") throw new Error("invalid decision");
  const reason = String(form.get("reason") ?? "").replace(/\s+/g, " ").trim().slice(0, 200);

  const admin = createAdminClient();
  const { data: review } = await admin.from("reviews").select("id, user_id").eq("id", reviewId).maybeSingle();
  if (!review) return;

  if (decision !== "dismiss") {
    const { error } = await admin.from("reviews").update({ hidden_at: new Date().toISOString() }).eq("id", reviewId);
    if (error) throw new Error("hide failed");
  }

  if (decision === "hide_suspend") {
    const { data: author } = await admin.from("profiles").select("id, is_admin").eq("id", review.user_id).maybeSingle();
    if (author && pickSuspendTargets([author.id], profile.id, new Set(author.is_admin ? [author.id] : [])).length > 0) {
      const { error } = await admin
        .from("suspensions")
        .upsert({ user_id: author.id, reason: reason || null, suspended_by: profile.id }, { onConflict: "user_id" });
      if (error) throw new Error("suspend failed");
    }
  }

  // Only still-open reports are closed, so two administrators can't overwrite each other.
  const { error } = await admin
    .from("review_reports")
    .update({
      status: decision === "dismiss" ? "dismissed" : "actioned",
      resolved_by: profile.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("review_id", reviewId)
    .eq("status", "open");
  if (error) throw new Error("update failed");

  const lang = String(form.get("lang") ?? "");
  revalidatePath(`/${hasLocale(lang) ? lang : "en"}/admin/reports`);
}

/** Shows a hidden review again. It doesn't reopen the reports or lift a suspension. */
export async function restoreReview(form: FormData) {
  const profile = await getProfile();
  if (!profile?.is_admin) throw new Error("forbidden");

  const reviewId = String(form.get("reviewId") ?? "");
  if (!UUID.test(reviewId)) throw new Error("invalid review");

  const { error } = await createAdminClient().from("reviews").update({ hidden_at: null }).eq("id", reviewId);
  if (error) throw new Error("restore failed");

  const lang = String(form.get("lang") ?? "");
  revalidatePath(`/${hasLocale(lang) ? lang : "en"}/admin/reports`);
}

/**
 * Decides one edit request. Approving applies the change to the hospital, locks that field against the
 * next HIRA import and writes the history, all in one database transaction (apply_edit_request).
 */
export async function decideEdit(form: FormData) {
  const profile = await getProfile();
  if (!profile?.is_admin) throw new Error("forbidden");

  const requestId = String(form.get("requestId") ?? "");
  const decision = form.get("decision");
  if (!UUID.test(requestId)) throw new Error("invalid request");
  if (decision !== "approve" && decision !== "reject") throw new Error("invalid decision");
  const reason = String(form.get("reason") ?? "").replace(/\s+/g, " ").trim().slice(0, 200);

  const admin = createAdminClient();
  const { data: request } = await admin.from("hospital_edit_requests").select("hospital_id").eq("id", requestId).maybeSingle();
  if (!request) return;

  if (decision === "approve") {
    // 'not_open' means another administrator decided first: nothing to do.
    const { error } = await admin.rpc("apply_edit_request", { p_request: requestId, p_admin: profile.id });
    if (error) throw new Error("apply failed");
  } else {
    // Only a still-open request can be rejected, so two administrators can't overwrite each other.
    const { error } = await admin
      .from("hospital_edit_requests")
      .update({ status: "rejected", reject_reason: reason || null, resolved_by: profile.id, resolved_at: new Date().toISOString() })
      .eq("id", requestId)
      .eq("status", "open");
    if (error) throw new Error("reject failed");
  }

  const lang = hasLocale(String(form.get("lang") ?? "")) ? String(form.get("lang")) : "en";
  revalidatePath(`/${lang}/admin/edits`);
  revalidatePath(`/${lang}/hospitals/${request.hospital_id}`);
}

/** Shows a hospital as open again after a closure or move was approved by mistake (or reversed). */
export async function reopenHospital(form: FormData) {
  const profile = await getProfile();
  if (!profile?.is_admin) throw new Error("forbidden");

  const hospitalId = String(form.get("hospitalId") ?? "");
  if (!UUID.test(hospitalId)) throw new Error("invalid hospital");

  // 'not_closed' means someone else already did it: nothing to do.
  const { error } = await createAdminClient().rpc("reopen_hospital", { p_hospital: hospitalId, p_admin: profile.id });
  if (error) throw new Error("reopen failed");

  const lang = hasLocale(String(form.get("lang") ?? "")) ? String(form.get("lang")) : "en";
  revalidatePath(`/${lang}/admin/edits`);
  revalidatePath(`/${lang}/hospitals/${hospitalId}`);
}

/**
 * Decides a hospital-manager application after looking at the proof. A hospital has at most
 * MAX_MANAGERS active managers; approving past that does nothing (the page disables the button).
 */
export async function decideManager(form: FormData) {
  const profile = await getProfile();
  if (!profile?.is_admin) throw new Error("forbidden");

  const managerId = String(form.get("managerId") ?? "");
  const decision = form.get("decision");
  if (!UUID.test(managerId)) throw new Error("invalid application");
  if (decision !== "approve" && decision !== "reject") throw new Error("invalid decision");
  const reason = String(form.get("reason") ?? "").replace(/\s+/g, " ").trim().slice(0, 200);

  const admin = createAdminClient();
  const { data: application } = await admin.from("hospital_managers").select("id, hospital_id, status, proof_path").eq("id", managerId).maybeSingle();
  if (!application || application.status !== "pending") return;

  if (decision === "approve") {
    const { count } = await admin
      .from("hospital_managers")
      .select("id", { count: "exact", head: true })
      .eq("hospital_id", application.hospital_id)
      .eq("status", "active");
    if (!hasRoomForManager(count ?? 0)) return;
  }

  // Only a still-pending application is decided, so two administrators can't overwrite each other.
  const { error } = await admin
    .from("hospital_managers")
    .update({
      status: decision === "approve" ? "active" : "rejected",
      reject_reason: decision === "reject" ? reason || null : null,
      decided_by: profile.id,
      decided_at: new Date().toISOString(),
    })
    .eq("id", managerId)
    .eq("status", "pending");
  if (error) throw new Error("update failed");
  // A rejected application's proof is no longer needed: delete it (an approved one is kept while the role lasts).
  if (decision === "reject") await removeStored(admin, "manager-proofs", [application.proof_path]);

  const lang = hasLocale(String(form.get("lang") ?? "")) ? String(form.get("lang")) : "en";
  revalidatePath(`/${lang}/admin/managers`);
  revalidatePath(`/${lang}/hospitals/${application.hospital_id}/manage`);
  revalidatePath(`/${lang}/hospitals/${application.hospital_id}/edit`);
}

/** Ends a manager's assignment. Edit requests they already sent stay in the queue. */
export async function revokeManager(form: FormData) {
  const profile = await getProfile();
  if (!profile?.is_admin) throw new Error("forbidden");

  const managerId = String(form.get("managerId") ?? "");
  if (!UUID.test(managerId)) throw new Error("invalid manager");
  const reason = String(form.get("reason") ?? "").replace(/\s+/g, " ").trim().slice(0, 200);

  const admin = createAdminClient();
  const { data: application } = await admin.from("hospital_managers").select("hospital_id, proof_path").eq("id", managerId).maybeSingle();
  const { error } = await admin
    .from("hospital_managers")
    .update({ status: "revoked", reject_reason: reason || null, decided_by: profile.id, decided_at: new Date().toISOString() })
    .eq("id", managerId)
    .eq("status", "active");
  if (error) throw new Error("revoke failed");
  // The role has ended, so the proof document is deleted too.
  if (application) await removeStored(admin, "manager-proofs", [application.proof_path]);

  const lang = hasLocale(String(form.get("lang") ?? "")) ? String(form.get("lang")) : "en";
  revalidatePath(`/${lang}/admin/managers`);
  if (application) {
    revalidatePath(`/${lang}/hospitals/${application.hospital_id}/manage`);
    revalidatePath(`/${lang}/hospitals/${application.hospital_id}/edit`);
  }
}

export type GrantState = { ok?: true; error?: RoleError | "invalidEmail" | "notFound" | "forbidden" | "generic" } | null;

async function adminCount(admin: ReturnType<typeof createAdminClient>) {
  const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("is_admin", true);
  return count ?? 0;
}

/** Looks a user up by email. Only people who have signed in once have an account to promote. */
async function findUserIdByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return undefined;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email);
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

export async function grantAdmin(_prev: GrantState, form: FormData): Promise<GrantState> {
  const profile = await getProfile();
  if (!profile?.is_admin) return { error: "forbidden" };

  const email = parseEmail(form.get("email"));
  if (!email) return { error: "invalidEmail" };

  const admin = createAdminClient();
  const userId = await findUserIdByEmail(admin, email);
  if (userId === undefined) return { error: "generic" };
  if (userId === null) return { error: "notFound" };

  const { data: target } = await admin.from("profiles").select("id, is_admin").eq("id", userId).maybeSingle();
  if (!target) return { error: "notFound" };
  const refused = checkRoleChange("grant", { isAdmin: target.is_admin }, await adminCount(admin));
  if (refused) return { error: refused };

  const { error } = await admin.from("profiles").update({ is_admin: true }).eq("id", userId);
  if (error) return { error: "generic" };

  const lang = String(form.get("lang") ?? "");
  revalidatePath(`/${hasLocale(lang) ? lang : "en"}/admin`);
  return { ok: true };
}

export async function revokeAdmin(form: FormData) {
  const profile = await getProfile();
  if (!profile?.is_admin) throw new Error("forbidden");

  const targetId = String(form.get("userId") ?? "");
  if (!UUID.test(targetId)) throw new Error("invalid user");

  const admin = createAdminClient();
  const { data: target } = await admin.from("profiles").select("id, is_admin").eq("id", targetId).maybeSingle();
  if (!target) return;
  if (checkRoleChange("revoke", { isAdmin: target.is_admin }, await adminCount(admin))) return;

  const { error } = await admin.from("profiles").update({ is_admin: false }).eq("id", targetId).eq("is_admin", true);
  if (error) throw new Error("update failed");

  // Two admins demoting each other at the same moment could both pass the check above.
  if ((await adminCount(admin)) === 0) await admin.from("profiles").update({ is_admin: true }).eq("id", targetId);

  const lang = String(form.get("lang") ?? "");
  revalidatePath(`/${hasLocale(lang) ? lang : "en"}/admin`);
}
