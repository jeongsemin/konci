"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Maximize2, X } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { fillBookingDate } from "@/lib/booking-date";
import type { BookingPhrase } from "@/lib/booking-guide";

export type PhraseLabels = { showLarge: string; close: string; copy: string; copied: string; date: string; time: string };

const button =
  "flex min-h-10 shrink-0 items-center gap-1.5 rounded-sm border border-border bg-white px-3 text-xs font-bold text-brand hover:bg-brand-soft";

/** Copies text, and says so for a moment. */
function useCopy() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard blocked (insecure page or permission): the text is still on screen to select by hand.
    }
  };
  return { copied, copy };
}

/** One Korean phrase: copy it into a message, or show it full screen to the clinic staff. */
export function PhraseCard({ phrase, lang, labels }: { phrase: BookingPhrase; lang: Locale; labels: PhraseLabels }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const { copied, copy } = useCopy();
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  // The date phrase shows the visitor's own date and time once both are picked.
  const shown = (phrase.dateMeaning && fillBookingDate(phrase, date, time, lang)) || phrase;

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const opener = openerRef.current;
    const focusables = () => [...(dialog?.querySelectorAll<HTMLElement>("button") ?? [])];
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "Tab") return;
      // Keep the keyboard inside the full-screen view.
      const list = focusables();
      if (list.length === 0) return;
      const i = list.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? list.length - 1 : i - 1) : i === list.length - 1 ? 0 : i + 1;
      e.preventDefault();
      list[next].focus();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, [open]);

  const copyButton = (
    <button type="button" onClick={() => copy(shown.ko)} className={button} aria-live="polite">
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? labels.copied : labels.copy}
    </button>
  );

  return (
    <li className="space-y-2 rounded-md border border-border bg-card p-5">
      <p lang="ko" className="text-xl font-bold leading-snug md:text-2xl">
        {shown.ko}
      </p>
      <p lang="ko-Latn" className="text-sm italic text-muted">
        {shown.romanized}
      </p>
      <p className="text-sm">{shown.meaning}</p>

      {phrase.dateMeaning && (
        <div className="flex flex-wrap gap-3 pt-1">
          <label className="flex items-center gap-2 text-xs font-bold text-muted">
            {labels.date}
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-h-10 rounded-sm border border-border bg-white px-2 text-sm font-normal text-foreground" />
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-muted">
            {labels.time}
            <input type="time" step={1800} value={time} onChange={(e) => setTime(e.target.value)} className="min-h-10 rounded-sm border border-border bg-white px-2 text-sm font-normal text-foreground" />
          </label>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {copyButton}
        <button ref={openerRef} type="button" onClick={() => setOpen(true)} className={button}>
          <Maximize2 className="size-4" aria-hidden />
          {labels.showLarge}
        </button>
      </div>

      {open && (
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={shown.meaning} className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex justify-end gap-2 p-4">
            {copyButton}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex min-h-10 items-center gap-2 rounded-sm border border-border px-4 text-sm font-bold hover:bg-surface"
            >
              <X className="size-5" aria-hidden />
              {labels.close}
            </button>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-auto px-6 pb-16 text-center">
            <p lang="ko" className="max-w-4xl break-keep text-4xl font-bold leading-snug md:text-6xl">
              {shown.ko}
            </p>
            <p className="max-w-2xl text-base text-muted">{shown.meaning}</p>
          </div>
        </div>
      )}
    </li>
  );
}
