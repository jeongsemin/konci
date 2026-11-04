"use server";

import { revalidatePath } from "next/cache";
import { hasLocale } from "@/i18n/config";
import { DAILY_LIMIT, MANAGER_DAILY_LIMIT, fieldsFor, isSameValue, parseEditInput } from "@/lib/edit-request";
import { createClient } from "@/lib/supabase/server";

export type EditState = {
  ok?: true;
  error?: "invalid" | "same" | "duplicate" | "suspended" | "limit" | "notLoggedIn" | "generic";
} | null;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function submitEditRequest(_prev: EditState, form: FormData): Promise<EditState> {
  const get = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" ? v : null;
  };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "notLoggedIn" };
  const me = auth.user.id;

  // The hospital's own manager may ask for more. A member sees only their own rows (RLS), and the
  // database decides again on insert, so a forged field can't get through either way.
  const hospitalId = (get("hospitalId") ?? "").trim();
  const { data: manager } = UUID.test(hospitalId)
    ? await supabase.from("hospital_managers").select("id").eq("hospital_id", hospitalId).eq("user_id", me).eq("status", "active").maybeSingle()
    : { data: null };
  const isManager = Boolean(manager);

  const input = parseEditInput(get, fieldsFor(isManager));
  if (!input) return { error: "invalid" };

  // RLS enforces suspension too; checking first lets us tell the member why.
  const { data: suspension } = await supabase.from("suspensions").select("user_id").eq("user_id", me).maybeSingle();
  if (suspension) return { error: "suspended" };

  const { data: hospital } = await supabase
    .from("hospitals")
    .select("phone, homepage, name_en, name_ja, name_zh, hours_note, closed_reason")
    .eq("id", input.hospitalId)
    .maybeSingle();
  if (!hospital) return { error: "invalid" };
  // For a closure report the "value" is why the hospital is closed now (null while it is open).
  const current = { ...hospital, closure: hospital.closed_reason };
  if (input.field !== "other" && input.value && isSameValue(input.field, input.value, current[input.field])) return { error: "same" };

  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await supabase
    .from("hospital_edit_requests")
    .select("id", { count: "exact", head: true })
    .eq("requester_id", me)
    .gte("created_at", since);
  if ((count ?? 0) >= (isManager ? MANAGER_DAILY_LIMIT : DAILY_LIMIT)) return { error: "limit" };

  const { error } = await supabase
    .from("hospital_edit_requests")
    .insert({ hospital_id: input.hospitalId, requester_id: me, field: input.field, value: input.value, note: input.note });
  if (error) return { error: error.code === "23505" ? "duplicate" : "generic" };

  const lang = String(form.get("lang") ?? "");
  if (hasLocale(lang)) revalidatePath(`/${lang}/hospitals/${input.hospitalId}/edit`);
  return { ok: true };
}
