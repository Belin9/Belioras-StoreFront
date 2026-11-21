/* Admin Dashboard Page: Products - ProductFormMore */
import { useState } from "react";

import FormSection, { NestedSections } from "./ProductFormSection";

/**
 * The optional extras in one card, folded until asked for, so adding a simple
 * piece stays short. It opens by itself when the piece already has any of
 * them (an edit, or a restored draft); after a click it stays as chosen.
 */
export default function ProductFormMore({ values, children }) {
  const [choice, setChoice] = useState(null);
  const open = choice ?? hasExtras(values);

  return (
    <FormSection
      title="More about the piece"
      hint="Optional. The manufacturer and any safety warnings."
      action={
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setChoice(!open)}
          className="min-h-9 border border-umber-100 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso transition-colors hover:border-espresso"
        >
          {open ? "Hide" : "Add details"}
        </button>
      }
    >
      {open && <NestedSections>{children}</NestedSections>}
    </FormSection>
  );
}

function hasExtras(v) {
  const text = [v.manufacturerName, v.manufacturerAddress, v.manufacturerContact, v.safetyWarnings];
  return text.some((s) => String(s ?? "").trim());
}
