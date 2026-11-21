/* Admin Dashboard Page: Products - ProductFormDetailsCare */
import CareIcon from "@/components/storefront/CareIcon";
import Field from "@/components/ui/Field";
import { cn } from "@/utils/cn";
import { CARE_GROUPS, CARE_SYMBOLS } from "@/utils/careSymbols";
import FormSection from "./ProductFormSection";

/**
 * What the product page lists under Details & composition and Care
 * instructions. Care is picked from the label symbols, so the shop shows the
 * icon a shopper knows; anything the symbols don't cover goes in a note.
 */
export default function ProductFormDetailsCare({ register, values, setValue }) {
  const chosen = values.careSymbols ?? [];
  const toggle = (id) =>
    setValue("careSymbols", chosen.includes(id) ? chosen.filter((c) => c !== id) : [...chosen, id], { shouldDirty: true });

  return (
    <FormSection title="Details & care" hint="Shown under Details & Composition and Care Instructions on the product page. One item per line.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Details" helper="e.g. Concealed back zip · Fully lined · Made in Portugal">
          <textarea rows={4} className="h-auto min-h-28 resize-y" {...register("details")} />
        </Field>
        <Field label="Composition" helper="e.g. 95% viscose satin · Lining: 100% viscose">
          <textarea rows={4} className="h-auto min-h-28 resize-y" {...register("materials")} />
        </Field>
      </div>

      <div>
        <p className="input-label">Care instructions</p>
        <p className="mb-3 text-[12px] text-espresso-soft">Pick what the label says. They show with their symbols, in this order.</p>
        <div className="space-y-3">
          {CARE_GROUPS.map((g) => (
            <div key={g.id}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-espresso-soft">{g.label}</p>
              <div className="flex flex-wrap gap-2">
                {CARE_SYMBOLS.filter((s) => s.group === g.id).map((s) => {
                  const on = chosen.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(s.id)}
                      className={cn(
                        "inline-flex min-h-9 items-center gap-2 border px-3 text-[12px] transition-colors",
                        on ? "border-espresso bg-espresso text-ivory-50" : "border-umber-100 bg-white text-espresso-soft hover:border-espresso/50 hover:text-espresso",
                      )}
                    >
                      <CareIcon name={s.icon} className="size-4 shrink-0" />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Field label="Care notes (optional)" helper="Anything the symbols don't cover, e.g. Braid at night. One per line.">
        <textarea rows={2} className="h-auto min-h-20 resize-y" {...register("careNotes")} />
      </Field>
    </FormSection>
  );
}
