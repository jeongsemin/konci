"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Text = {
  label: string;
  placeholder: string;
  button: string;
  sending: string;
  sent: string;
  invalid: string;
  tooMany: string;
  failed: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailForm({ lang, next, text }: { lang: string; next: string; text: Text }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "invalid" | "tooMany" | "failed">("idle");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const address = email.trim();
    if (!EMAIL.test(address) || address.length > 254) return setState("invalid");
    setState("sending");
    const emailRedirectTo = `${window.location.origin}/auth/callback?lang=${lang}&next=${encodeURIComponent(next)}`;
    const { error } = await createClient().auth.signInWithOtp({ email: address, options: { emailRedirectTo } });
    if (!error) return setState("sent");
    setState(error.status === 429 || /rate limit|too many/i.test(error.message) ? "tooMany" : "failed");
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <label className="block space-y-2">
        <span className="text-[13px] font-bold">{text.label}</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={text.placeholder}
          maxLength={254}
          className="min-h-[52px] w-full rounded-sm border border-border bg-white p-3.5 text-sm outline-none focus:border-focus"
        />
      </label>
      <button
        disabled={state === "sending"}
        className="min-h-12 w-full rounded-sm bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-strong disabled:opacity-60"
      >
        {state === "sending" ? text.sending : text.button}
      </button>
      {state === "sent" && (
        <p role="status" className="rounded-sm bg-brand-soft p-3.5 text-xs leading-relaxed text-brand">
          {text.sent.replace("{email}", email.trim())}
        </p>
      )}
      {(state === "invalid" || state === "tooMany" || state === "failed") && (
        <p role="alert" className="text-xs text-error">
          {text[state]}
        </p>
      )}
    </form>
  );
}
