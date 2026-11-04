"use server";

import { revalidatePath } from "next/cache";
import { hasLocale } from "@/i18n/config";
import { DAILY_LIMIT, isSameValue, parseEditInput } from "@/lib/edit-request";
import { createClient } from "@/lib/supabase/server";

export type EditState = {
  ok?: true;
  error?: "invalid" | "same" | "duplicate" | "suspended" | "limit" | "notLoggedIn" | "generic";
} | null;

export async function submitEditRequest(_prev: EditState, form: FormData): Promise<EditState> {
  const input = parseEditInput((key) => {
    const v = form.get(key);
    return typeof v === "string" ? v : null;
  });
  if (!input) return { error: "invalid" };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "notLoggedIn" };
  const me = auth.user.id;

  // RLS enforces suspension too; checking first lets us tell the member why.
  const { data: suspension } = await supabase.from("suspensions").select("user_id").eq("user_id", me).maybeSingle();
  if (suspension) return { error: "suspended" };

  const { data: hospital } = await supabase.from("hospitals").select("phone, homepage, name_en").eq("id", input.hospitalId).maybeSingle();
  if (!hospital) return { error: "invalid" };
  if (input.field !== "other" && input.value && isSameValue(input.field, input.value, hospital[input.field])) return { error: "same" };

  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await supabase
    .from("hospital_edit_requests")
    .select("id", { count: "exact", head: true })
    .eq("requester_id", me)
    .gte("created_at", since);
  if ((count ?? 0) >= DAILY_LIMIT) return { error: "limit" };

  const { error } = await supabase
    .from("hospital_edit_requests")
    .insert({ hospital_id: input.hospitalId, requester_id: me, field: input.field, value: input.value, note: input.note });
  if (error) return { error: error.code === "23505" ? "duplicate" : "generic" };

  const lang = String(form.get("lang") ?? "");
  if (hasLocale(lang)) revalidatePath(`/${lang}/hospitals/${input.hospitalId}/edit`);
  return { ok: true };
}
