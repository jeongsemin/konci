"use client";

import { Analytics } from "@vercel/analytics/next";

/** Private areas are not counted at all. */
const PRIVATE = /^\/[a-z]{2}\/(admin|my|login)(\/|$)|^\/auth\//;

/**
 * Vercel Web Analytics: page views without cookies. Search words, filters and tokens in the
 * query string are dropped before anything is sent, and private pages are skipped.
 */
export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = new URL(event.url);
        if (PRIVATE.test(url.pathname)) return null;
        return { ...event, url: `${url.origin}${url.pathname}` };
      }}
    />
  );
}
