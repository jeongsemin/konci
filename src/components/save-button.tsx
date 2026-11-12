import Link from "next/link";
import { Bookmark, BookmarkCheck } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { toggleSaved } from "@/app/[lang]/saved/actions";

const style =
  "flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-bold";

/**
 * Save / saved toggle for a clinic. Signed-out visitors get a link to sign in and come back.
 * `back` is the page to return to after the toggle (defaults to the clinic page).
 * `removeOnly` is a plain "Remove" button (the My page list) rather than a toggle.
 */
export function SaveButton({
  lang,
  hospitalId,
  saved,
  signedIn,
  labels,
  back,
  removeOnly = false,
}: {
  lang: Locale;
  hospitalId: string;
  saved: boolean;
  signedIn: boolean;
  labels: { save: string; saved: string };
  back?: string;
  removeOnly?: boolean;
}) {
  const here = back ?? `/${lang}/hospitals/${hospitalId}`;
  if (!signedIn) {
    return (
      <Link href={`/${lang}/login?next=${encodeURIComponent(here)}`} className={`${style} border-border bg-white text-brand hover:bg-brand-soft`}>
        <Bookmark className="size-4" aria-hidden />
        {labels.save}
      </Link>
    );
  }
  return (
    <form action={toggleSaved}>
      <input type="hidden" name="hospitalId" value={hospitalId} />
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="back" value={here} />
      <input type="hidden" name="intent" value={saved ? "remove" : "save"} />
      <button
        type="submit"
        aria-pressed={removeOnly ? undefined : saved}
        className={`${style} ${saved && !removeOnly ? "border-brand bg-brand-soft text-brand" : "border-border bg-white text-brand hover:bg-brand-soft"}`}
      >
        {removeOnly ? null : saved ? <BookmarkCheck className="size-4" aria-hidden /> : <Bookmark className="size-4" aria-hidden />}
        {removeOnly ? labels.saved : saved ? labels.saved : labels.save}
      </button>
    </form>
  );
}
