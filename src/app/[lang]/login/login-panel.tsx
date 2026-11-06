"use client";

import { useState, type ReactNode } from "react";
import { EmailForm } from "./email-form";
import { GoogleButton } from "./google-button";

type Props = {
  lang: string;
  next: string;
  /** The sentence beside the checkbox, with its links, rendered on the server. */
  agree: ReactNode;
  hint: string;
  googleLabel: string;
  orLabel: string;
  emailText: Parameters<typeof EmailForm>[0]["text"];
};

/**
 * The sign-in buttons stay disabled until the visitor confirms they are 14 or older and accept the terms.
 * It is a self-declaration, so it can't prove an age, but it makes the statement in the terms a real step.
 */
export function LoginPanel({ lang, next, agree, hint, googleLabel, orLabel, emailText }: Props) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="space-y-6">
      <label className="flex cursor-pointer items-start gap-3 rounded-sm bg-surface p-4">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-brand"
        />
        <span className="text-xs leading-relaxed">{agree}</span>
      </label>
      {!agreed && <p className="-mt-3 text-xs text-muted">{hint}</p>}

      <GoogleButton lang={lang} next={next} label={googleLabel} disabled={!agreed} />
      <p className="flex items-center gap-3 text-xs text-muted before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
        {orLabel}
      </p>
      <EmailForm lang={lang} next={next} text={emailText} disabled={!agreed} />
    </div>
  );
}
