import { Fragment } from "react";

/** Help lines named in the booking texts. The longest form comes first so "+82-2-1330" is not split. */
const HELP_LINES: Record<string, string> = {
  "+82-2-1330": "tel:+8221330",
  "1577-7129": "tel:15777129",
  "1330": "tel:1330",
};
const PATTERN = /(\+82-2-1330|1577-7129|1330)/;

/** Text with the help-line numbers turned into tap-to-call links. */
export function PhoneText({ text }: { text: string }) {
  return (
    <>
      {text.split(PATTERN).map((part, i) =>
        HELP_LINES[part] ? (
          <a key={i} href={HELP_LINES[part]} className="whitespace-nowrap font-bold text-brand hover:underline">
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
