/* Admin Dashboard Page: Products - ProductFormCare */
import { useState } from "react";
import { Plus, X } from "lucide-react";

import CareIcon from "@/components/storefront/CareIcon";
import Modal from "@/components/common/Modal";
import Field from "@/components/ui/Field";
import { cn } from "@/utils/cn";
import { CARE_GROUPS, CARE_SYMBOLS } from "@/utils/careSymbols";
import FormSection from "./ProductFormSection";

/**
 * Care Instructions on the product page. Optional and used on few pieces, so
 * it stays one line: the chosen symbols as chips, and "Add care instructions"
 * opening the full list.
 */
export default function ProductFormCare({ register, values, setValue }) {
  const chosen = values.careSymbols ?? [];
  const [picking, setPicking] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const showNote = noteOpen || String(values.careNotes ?? "").trim();

  const toggle = (id) =>
    setValue("careSymbols", chosen.includes(id) ? chosen.filter((c) => c !== id) : [...chosen, id], { shouldDirty: true });
  const byId = new Map(CARE_SYMBOLS.map((s) => [s.id, s]));

  return (
    <FormSection title="Care instructions" hint="Optional. Shown under Care Instructions on the product page, with the label symbols.">
      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          {chosen.map((id) => {
            const s = byId.get(id);
            if (!s) return null;
            return (
              <span key={id} className="inline-flex min-h-9 items-center gap-2 border border-espresso bg-espresso pl-3 pr-1 text-[12px] text-ivory-50">
                <CareIcon name={s.icon} className="size-4 shrink-0" />
                {s.label}
                <button type="button" onClick={() => toggle(id)} aria-label={`Remove ${s.label}`} className="flex size-7 items-center justify-center text-ivory-50/60 hover:text-ivory-50">
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="inline-flex min-h-9 items-center gap-2 border border-dashed border-umber-100 px-3 text-[11px] uppercase tracking-[0.14em] text-espresso-soft transition-colors hover:border-espresso hover:text-espresso"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {chosen.length ? "Edit care" : "Add care instructions"}
          </button>
          {!showNote && (
            <button type="button" onClick={() => setNoteOpen(true)} className="ml-1 text-[11px] uppercase tracking-[0.14em] text-gold-800 underline-offset-4 hover:underline">
              Add a note
            </button>
          )}
        </div>
      </div>

      {showNote && (
        <Field label="Care note" helper="Anything the symbols don't cover, e.g. Braid at night. One per line.">
          <textarea rows={2} className="h-auto min-h-20 resize-y" {...register("careNotes")} />
        </Field>
      )}

      <Modal open={picking} onClose={() => setPicking(false)} title="Care instructions" width="max-w-2xl">
        <p className="-mt-1 mb-4 text-[13px] text-espresso-soft">Pick what the label says. They show on the product page with their symbols, in the order picked.</p>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          {CARE_GROUPS.map((g) => (
            <div key={g.id}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-espresso-soft">{g.label}</p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {CARE_SYMBOLS.filter((s) => s.group === g.id).map((s) => {
                  const on = chosen.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(s.id)}
                      className={cn(
                        "flex min-h-10 items-center gap-2.5 border px-3 text-left text-[13px] transition-colors",
                        on ? "border-espresso bg-espresso text-ivory-50" : "border-umber-50 bg-white text-espresso-soft hover:border-espresso/50 hover:text-espresso",
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
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={() => setPicking(false)} className="h-10 bg-espresso px-6 text-[12px] font-medium uppercase tracking-[0.16em] text-ivory-50 hover:bg-espresso-600">
            Done{chosen.length ? ` · ${chosen.length} chosen` : ""}
          </button>
        </div>
      </Modal>
    </FormSection>
  );
}
