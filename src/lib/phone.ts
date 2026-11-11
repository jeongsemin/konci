// Korean phone numbers for visitors: many call from a foreign SIM or from abroad, where only +82 numbers connect.

export type PhoneLinks = {
  /** The number as stored, for display. */
  display: string;
  /** The +82 form, or null when the number cannot be dialled from abroad. */
  international: string | null;
  /** tel: link; the +82 form when there is one, since it also works from Korean phones. */
  href: string;
};

/** Area and mobile numbers start with 0 and have 9–11 digits (02-123-4567, 064-747-2559, 010-1234-5678). */
const NATIONAL = /^0\d{8,10}$/;

export function phoneLinks(raw: string): PhoneLinks {
  const display = raw.trim();
  let digits = display.replace(/\D/g, "");
  // Already written as +82 or 82: bring it back to the national form first.
  if (display.startsWith("+82") || (digits.startsWith("82") && digits.length >= 10 && !digits.startsWith("820"))) {
    digits = `0${digits.slice(2)}`;
  }
  if (!NATIONAL.test(digits)) {
    // Nationwide numbers such as 1588-xxxx only work inside Korea.
    return { display, international: null, href: `tel:${digits}` };
  }
  const rest = digits.slice(1);
  const grouped = /^0\d/.test(display) && display.includes("-") ? display.slice(1) : rest;
  return { display, international: `+82-${grouped}`, href: `tel:+82${rest}` };
}
