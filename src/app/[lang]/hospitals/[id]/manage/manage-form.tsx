"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { CONTACT_MAX, POSITION_MAX } from "@/lib/manager-input";

type Text = {
  position: string;
  positionHelp: string;
  contact: string;
  contactHelp: string;
  proof: string;
  proofHelp: string;
  submit: string;
  submitting: string;
  done: string;
  errors: Record<"invalid" | "badFile" | "notLoggedIn" | "suspended" | "already" | "full" | "limit" | "generic", string>;
};

export function ManageForm({ hospitalId, text }: { hospitalId: string; text: Text }) {
  const router = useRouter();
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<keyof Text["errors"] | null>(null);

  // A plain fetch, not <form action>: the form must keep what was typed after an error, and the
  // upload is too large for a server action.
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (!file.current?.files?.[0]) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/manager-applications", { method: "POST", body: data });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error in text.errors ? json.error : "generic");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("generic");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p role="status" className="rounded-md bg-brand-soft p-5 text-sm font-bold text-brand">
        {text.done}
      </p>
    );
  }

  const input = "min-h-[52px] w-full rounded-sm border border-border bg-white p-3.5 text-sm outline-none focus:border-focus";
  return (
    <form onSubmit={submit} className="space-y-5 rounded-md border border-border bg-card p-5 md:p-6">
      <input type="hidden" name="hospitalId" value={hospitalId} />

      <label className="block space-y-2">
        <span className="text-[13px] font-bold">{text.position} *</span>
        <input name="position" required maxLength={POSITION_MAX} className={input} />
        <span className="block text-xs text-muted">{text.positionHelp}</span>
      </label>

      <label className="block space-y-2">
        <span className="text-[13px] font-bold">{text.contact} *</span>
        <input name="contact" required maxLength={CONTACT_MAX} className={input} />
        <span className="block text-xs text-muted">{text.contactHelp}</span>
      </label>

      <label className="block space-y-2">
        <span className="text-[13px] font-bold">{text.proof} *</span>
        <input
          ref={file}
          name="file"
          type="file"
          required
          accept="image/jpeg,image/png,application/pdf"
          className="block w-full rounded-sm border border-border bg-white p-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:text-[13px] file:font-bold file:text-brand"
        />
        <span className="block text-xs text-muted">{text.proofHelp}</span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={busy} className="min-h-12 rounded-sm bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-strong disabled:opacity-60">
          {busy ? text.submitting : text.submit}
        </button>
        {error && (
          <p role="alert" className="text-xs text-error">
            {text.errors[error]}
          </p>
        )}
      </div>
    </form>
  );
}
