/* Admin Dashboard Page: Products - ProductFormCategory */
import { useState } from "react";
import { ChevronLeft, Plus } from "lucide-react";

import ChoiceChips from "@/AdminDashboard/components/ChoiceChips";
import CategoryDialog from "@/AdminDashboard/components/CategoryDialog";
import { createCategory } from "@/services/catalog/categoriesApi";
import { cn } from "@/utils/cn";
import FormSection from "./ProductFormSection";
import { subcategoryTag } from "./productFormPayload";

/**
 * Picking a category and what it's filed under is one flow, not two cards on
 * opposite ends of the form: the selected row expands in place to show its
 * own Subcategories, and the types under each are what the product is tagged
 * with.
 */
export default function ProductFormCategory({ categories, value, tags, onChange, onTagsChange, onCreated }) {
  const [dialog, setDialog] = useState({ open: false, n: 0 });
  const [activeSub, setActiveSub] = useState(null);
  const close = () => setDialog((d) => ({ ...d, open: false }));
  const chosen = categories.find((c) => c.id === value);

  const create = async (form) => {
    const category = await createCategory(form);
    close();
    onCreated(category);
  };

  const toggleTag = (token) =>
    onTagsChange((prev) => (prev.includes(token) ? prev.filter((t) => t !== token) : [...prev, token]));

  const activeSubcategory = chosen?.subcategories?.find((s) => s.id === activeSub) ?? null;

  return (
    <FormSection title="Category">
      <div role="radiogroup" aria-label="Category" className="divide-y divide-umber-50 border border-umber-50 bg-white">
        {categories.map((c) => {
          const on = c.id === value;
          return (
            <div key={c.id}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange(c)}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between gap-3 px-3.5 text-left text-[14px] transition-colors",
                  on ? "bg-espresso text-ivory-50" : "text-espresso hover:bg-brown-50/50",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span aria-hidden="true" className={cn("size-2.5 rounded-full border", on ? "border-gold-400 bg-gold-400" : "border-umber-100")} />
                  {c.name}
                </span>
              </button>

              {/* Picking a Subcategory narrows to just that one — the rest
                  of the row's groups step aside rather than staying visible
                  alongside its types, so only what's needed shows. */}
              {on && c.subcategories?.length > 0 && (
                <div className="border-t border-umber-50 bg-ivory-50 p-3.5">
                  {activeSubcategory ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => setActiveSub(null)}
                        className="mb-2.5 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-gold-700 transition-colors hover:text-espresso"
                      >
                        <ChevronLeft className="size-3.5" aria-hidden="true" />
                        {activeSubcategory.name}
                      </button>
                      {activeSubcategory.types.length > 0 ? (
                        <ChoiceChips
                          options={activeSubcategory.types.map((t) => ({ id: subcategoryTag(activeSubcategory.id, t.id), label: t.name }))}
                          selected={tags}
                          onToggle={toggleTag}
                        />
                      ) : (
                        <p className="text-[13px] text-espresso-soft">No types under {activeSubcategory.name} yet.</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {c.subcategories.map((sub) => {
                        const count = tags.filter((t) => t.startsWith(`subcat:${sub.id}:`)).length;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setActiveSub(sub.id)}
                            className="inline-flex min-h-9 items-center gap-1.5 border border-umber-100 bg-white px-3 text-[12px] text-espresso-soft transition-colors hover:border-gold-700/50 hover:text-espresso"
                          >
                            {sub.name}
                            {count > 0 && <span className="text-[11px] tabular-nums text-gold-700">{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {on && !c.subcategories?.length && (
                <p className="border-t border-umber-50 bg-ivory-50 p-3.5 text-[13px] text-espresso-soft">
                  {c.name} has no subcategories yet. Add them in Categories &amp; Colours to file pieces under types.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setDialog((d) => ({ open: true, n: d.n + 1 }))}
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-gold-700 transition-colors hover:text-espresso"
      >
        <Plus className="size-3.5" aria-hidden="true" />
        New category
      </button>

      {/* Quick-created here, so sizing stays out of it: that belongs on the
          category itself, in Categories & Colours, not a detour while adding
          one piece. */}
      <CategoryDialog key={dialog.n} open={dialog.open} sizesEditable={false} onClose={close} onSave={create} />
    </FormSection>
  );
}
