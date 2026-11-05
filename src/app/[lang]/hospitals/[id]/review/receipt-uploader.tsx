"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Camera } from "lucide-react";

type Text = {
  receiptLabel: string;
  receiptHelp: string;
  receiptPrivacy: string;
  upload: string;
  uploading: string;
  status: Record<string, string>;
  errors: Record<string, string>;
  reasons: Record<string, string>;
  /** Consent sentence split around the privacy-policy link: [before, after]. */
  consent: string[];
  consentRequired: string;
  /** Link label of the privacy policy. */
  privacy: string;
};

type Outcome = { kind: "ok" | "wait" | "error"; message: string; reasons?: string[] };

export function ReceiptUploader({ hospitalId, lang, text }: { hospitalId: string; lang: string; text: Text }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    const file = input.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setOutcome(null);
    try {
      const body = new FormData();
      body.set("hospitalId", hospitalId);
      body.set("file", file);
      const res = await fetch("/api/receipts", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setOutcome({ kind: "error", message: text.errors[json.error] ?? text.errors.generic });
      } else {
        setOutcome({
          kind: json.status === "pending" ? "wait" : "ok",
          message: text.status[json.status],
          reasons: json.status === "pending" ? json.reasons : undefined,
        });
        setPreview(null);
        if (input.current) input.current.value = "";
        router.refresh();
      }
    } catch {
      setOutcome({ kind: "error", message: text.errors.generic });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={upload} className="space-y-3">
      <label className="block text-[13px] font-bold" htmlFor="receipt-file">
        {text.receiptLabel} *
      </label>
      <input
        id="receipt-file"
        ref={input}
        type="file"
        accept="image/jpeg,image/png"
        required
        onChange={(e) => {
          const f = e.target.files?.[0];
          setPreview(f ? URL.createObjectURL(f) : null);
        }}
        className="block w-full rounded-sm border border-border bg-white p-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:text-[13px] file:font-bold file:text-brand"
      />
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="h-[120px] rounded-md border border-border object-cover" />
      )}
      <p className="text-[11px] text-muted">{text.receiptHelp}</p>
      <p className="text-[11px] text-muted">{text.receiptPrivacy}</p>
      <label className="flex items-start gap-2 text-[12px] leading-relaxed">
        <input
          type="checkbox"
          required
          onInvalid={(e) => e.currentTarget.setCustomValidity(text.consentRequired)}
          onChange={(e) => e.currentTarget.setCustomValidity("")}
          className="mt-0.5 size-4 shrink-0 accent-brand"
        />
        <span>
          {text.consent[0]}
          <a href={`/${lang}/privacy`} target="_blank" rel="noreferrer" className="font-bold underline">
            {text.privacy}
          </a>
          {text.consent[1]}
        </span>
      </label>
      <button
        disabled={busy}
        className="inline-flex min-h-12 items-center gap-2 rounded-sm border border-border bg-white px-5 py-3 text-sm font-bold text-brand hover:bg-brand-soft disabled:opacity-60"
      >
        <Camera className="size-5" aria-hidden />
        {busy ? text.uploading : text.upload}
      </button>

      <div aria-live="polite">
        {outcome && (
          <div
            className={`rounded-sm p-3.5 text-xs ${
              outcome.kind === "ok"
                ? "bg-brand-soft text-brand"
                : outcome.kind === "wait"
                  ? "bg-star-soft text-star"
                  : "bg-error-soft text-error"
            }`}
          >
            <p>{outcome.message}</p>
            {outcome.reasons && outcome.reasons.length > 0 && (
              <ul className="mt-1 list-disc pl-5">
                {outcome.reasons.map((r) => (
                  <li key={r}>{text.reasons[r] ?? r}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
