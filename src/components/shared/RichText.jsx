/* Shared Component: RichText */
import { Fragment } from "react";

/**
 * Text staff write in Settings, shown with three simple rules and nothing
 * else: a blank line starts a new paragraph, a line starting with "- " is a
 * bullet, and **words** are bold. Built from React elements only, so nothing
 * typed can run as HTML. Email addresses become links.
 */
export default function RichText({ text, className }) {
  const blocks = String(text ?? "").replace(/\r\n/g, "\n").trim().split(/\n\s*\n/);
  if (!blocks[0]) return null;

  return (
    <div className={className}>
      {blocks.map((block, b) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const bullets = lines.filter((l) => l.startsWith("- "));
        const lead = lines.filter((l) => !l.startsWith("- "));
        return (
          <Fragment key={b}>
            {lead.length > 0 && (
              <p className="leading-relaxed [&:not(:first-child)]:mt-3">
                {lead.map((l, i) => (
                  <Fragment key={i}>
                    {i > 0 && <br />}
                    <Inline text={l} />
                  </Fragment>
                ))}
              </p>
            )}
            {bullets.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
                {bullets.map((l, i) => (
                  <li key={i}>
                    <Inline text={l.slice(2)} />
                  </li>
                ))}
              </ul>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

const EMAIL = /([^\s@]+@[^\s@]+\.[a-z]{2,})/gi;

/** **bold** and email links inside one line. */
function Inline({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-espresso">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return (
      <Fragment key={i}>
        {part.split(EMAIL).map((bit, j) =>
          j % 2 === 1 ? (
            <a key={j} href={`mailto:${bit.replace(/[.,;:]$/, "")}`} className="underline underline-offset-2 hover:text-gold-700">
              {bit}
            </a>
          ) : (
            bit
          ),
        )}
      </Fragment>
    );
  });
}
