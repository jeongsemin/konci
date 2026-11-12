"use client";

import { useId, useSyncExternalStore } from "react";
import { ChevronDown } from "lucide-react";

const KEY = "konci:search-filters-open";
const WIDE = "(min-width: 1024px)";
const CHANGED = "konci:filters-toggled";

// Screen width, read from the browser (false while rendering on the server).
const subscribeWide = (onChange: () => void) => {
  const media = window.matchMedia(WIDE);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};
const isWide = () => window.matchMedia(WIDE).matches;

// The visitor's own choice for this browsing session: "1", "0", or null for none yet.
// Kept in memory too, so the button still works where storage is blocked (private mode).
let memory: string | null = null;
const subscribeChoice = (onChange: () => void) => {
  window.addEventListener(CHANGED, onChange);
  return () => window.removeEventListener(CHANGED, onChange);
};
const readChoice = (): string | null => {
  try {
    return sessionStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
};

/**
 * The search filters, folded away or shown. Until the visitor chooses, they are folded on phones
 * (so the results come first) and shown on wide screens, by CSS alone so nothing jumps on load.
 * The choice is kept for the browsing session, since applying a filter loads a new page.
 */
export function FilterPanel({
  title,
  count,
  labels,
  children,
}: {
  title: string;
  /** How many filters are applied, shown next to the title. */
  count: number;
  labels: { show: string; hide: string };
  children: React.ReactNode;
}) {
  const id = useId();
  const wide = useSyncExternalStore(subscribeWide, isWide, () => false);
  const saved = useSyncExternalStore(subscribeChoice, readChoice, () => null);
  const choice = saved === "1" ? true : saved === "0" ? false : null;
  const open = choice ?? wide;

  const toggle = () => {
    memory = open ? "0" : "1";
    try {
      sessionStorage.setItem(KEY, memory);
    } catch {
      // Not stored across pages; the in-memory value still applies here.
    }
    window.dispatchEvent(new Event(CHANGED));
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={id}
        className="flex min-h-10 w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-lg font-bold">
          {title}
          {count > 0 && <span className="text-brand"> · {count}</span>}
        </span>
        <span className="flex items-center gap-1 text-xs font-bold text-brand">
          {open ? labels.hide : labels.show}
          <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </span>
      </button>
      <div id={id} className={`space-y-6 ${choice === null ? "hidden lg:block" : open ? "block" : "hidden"}`}>
        {children}
      </div>
    </div>
  );
}
