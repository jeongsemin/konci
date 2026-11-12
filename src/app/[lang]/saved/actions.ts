"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseSaveInput } from "@/lib/saved-input";

/** Saves or removes a clinic in the member's list. Works without JavaScript (a plain form post). */
export async function toggleSaved(form: FormData) {
  const input = parseSaveInput(form);
  if (!input) return;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/${input.lang}/login?next=${encodeURIComponent(input.back)}`);

  if (input.save) {
    // Saving twice is harmless; the 200-clinic limit is enforced by the database.
    await supabase.from("saved_hospitals").upsert({ user_id: auth.user.id, hospital_id: input.hospitalId }, { ignoreDuplicates: true });
  } else {
    await supabase.from("saved_hospitals").delete().eq("user_id", auth.user.id).eq("hospital_id", input.hospitalId);
  }
  revalidatePath(`/${input.lang}/hospitals/${input.hospitalId}`);
  revalidatePath(`/${input.lang}/my`);
  // The page the button was on (a search, for instance), so it shows the new state.
  revalidatePath(new URL(input.back, "http://localhost").pathname);
}
