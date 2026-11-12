// Input of the save / unsave form. Pure, so it can be unit tested.
import { hasLocale, type Locale } from "../i18n/config.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SaveInput = { hospitalId: string; lang: Locale; save: boolean; back: string };

/** The checked form values, or null when anything is off. `back` is the same-site page to return to. */
export function parseSaveInput(form: { get(name: string): unknown }): SaveInput | null {
  const hospitalId = String(form.get("hospitalId") ?? "");
  const lang = String(form.get("lang") ?? "");
  const intent = String(form.get("intent") ?? "");
  const back = String(form.get("back") ?? "");
  if (!UUID.test(hospitalId) || !hasLocale(lang) || (intent !== "save" && intent !== "remove")) return null;
  const safeBack = back.startsWith(`/${lang}/`) && !back.startsWith("//") ? back : `/${lang}/hospitals/${hospitalId}`;
  return { hospitalId, lang, save: intent === "save", back: safeBack };
}
