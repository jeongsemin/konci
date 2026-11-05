"use server";

import { revalidatePath } from "next/cache";
import { hasLocale } from "@/i18n/config";
import { getProfile } from "@/lib/auth";
import { DAILY_POST_LIMIT, isUuid, parseFeedbackInput, parseReplyInput } from "@/lib/feedback-input";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type FeedbackState = { ok?: true; error?: "invalid" | "suspended" | "limit" | "notLoggedIn" | "generic" } | null;

const refresh = (form: FormData) => {
  const lang = String(form.get("lang") ?? "");
  revalidatePath(`/${hasLocale(lang) ? lang : "en"}/feedback`);
};

export async function submitFeedback(_prev: FeedbackState, form: FormData): Promise<FeedbackState> {
  const input = parseFeedbackInput((key) => {
    const v = form.get(key);
    return typeof v === "string" ? v : null;
  });
  if (!input) return { error: "invalid" };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "notLoggedIn" };
  const me = auth.user.id;

  // RLS enforces all of this too; checking first lets us tell the member why.
  const { data: suspension } = await supabase.from("suspensions").select("user_id").eq("user_id", me).maybeSingle();
  if (suspension) return { error: "suspended" };

  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await supabase
    .from("feedback_posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", me)
    .gte("created_at", since);
  if ((count ?? 0) >= DAILY_POST_LIMIT) return { error: "limit" };

  const { error } = await supabase.from("feedback_posts").insert({ user_id: me, ...input });
  if (error) return { error: "generic" };

  refresh(form);
  return { ok: true };
}

/** A member takes down their own post (RLS allows nothing else). */
export async function deleteFeedback(form: FormData) {
  const id = form.get("postId");
  if (!isUuid(id)) return;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase.from("feedback_posts").delete().eq("id", id).eq("user_id", auth.user.id);
  refresh(form);
}

/** An administrator sets the status and writes (or clears) the public answer. */
export async function replyFeedback(form: FormData) {
  // Server actions are public endpoints, so check the role here too.
  const profile = await getProfile();
  if (!profile?.is_admin) throw new Error("forbidden");

  const input = parseReplyInput((key) => {
    const v = form.get(key);
    return typeof v === "string" ? v : null;
  });
  if (!input) throw new Error("invalid reply");

  const { error } = await createAdminClient()
    .from("feedback_posts")
    .update({
      status: input.status,
      admin_reply: input.reply,
      replied_at: input.reply ? new Date().toISOString() : null,
    })
    .eq("id", input.postId);
  if (error) throw new Error("update failed");
  refresh(form);
}

/** An administrator removes any post (spam, personal information). */
export async function removeFeedback(form: FormData) {
  const profile = await getProfile();
  if (!profile?.is_admin) throw new Error("forbidden");
  const id = form.get("postId");
  if (!isUuid(id)) return;
  const { error } = await createAdminClient().from("feedback_posts").delete().eq("id", id);
  if (error) throw new Error("delete failed");
  refresh(form);
}
