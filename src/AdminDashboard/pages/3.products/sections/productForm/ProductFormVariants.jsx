/* Admin Dashboard Page: Products - ProductFormVariants */
import { useState } from "react";
import { Plus, X } from "lucide-react";

import ColorDialog from "@/AdminDashboard/components/ColorDialog";
import { familyOptionsFrom } from "@/AdminDashboard/lib/catalogOptions";
import { createColor } from "@/services/catalog/colorsApi";
import { AS_SHOWN_ID } from "@/utils/productColors";
import FormSection from "./ProductFormSection";
import ProductFormSizes from "./ProductFormSizes";
import ProductFormStock from "./ProductFormStock";

const CHIP = "inline-flex min-h-10 items-center gap-2 border px-3 text-[12px] transition-colors";

/** Colours, sizes and stock together: the three decide what a shopper can buy. */
export default function ProductFormVariants({
  colors, colorIds, onColorIdsChange, photos, onPhotosChange, stock, onStockChange,
  sizes, onSizesChange, category, taxonomy, spread, onColorCreated, register, reserved,
}) {
  // A colour made here is usable at once, before the list refetches.
  const [created, setCreated] = useState([]);
  const [dialog, setDialog] = useState({ open: false, n: 0 });
  const [picking, setPicking] = useState(false);

  const byId = new Map([...colors, ...created].map((c) => [c.id, c]));
  const all = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  // Colour is optional. A piece saved without one carries the hidden
  // "As shown" colour, which is never offered or shown as a chip here.
  const realIds = colorIds.filter((id) => id !== AS_SHOWN_ID);
  const chosen = realIds.map((id) => byId.get(id) ?? { id, name: id, hex: "#ccc" });
  const available = all.filter((c) => !colorIds.includes(c.id) && c.id !== AS_SHOWN_ID);
  // The whole palette only until something is chosen; after that it stays
  // folded behind "Add colour", so a long colour list never crowds the form.
  const showPalette = realIds.length === 0 || picking;
  const photoCount = (id) => photos.filter((p) => p.colorId === id).length;

  const add = (id) => {
    if (!realIds.length) {
      // The first real colour takes over everything entered without one:
      // untagged or "As shown" photos, and the stock typed in the no-colour row.
      onColorIdsChange([id]);
      onPhotosChange(photos.map((p) => (!p.colorId || p.colorId === AS_SHOWN_ID ? { ...p, colorId: id } : p)));
      if (stock[AS_SHOWN_ID]) {
        const { [AS_SHOWN_ID]: moved, ...rest } = stock;
        onStockChange({ ...rest, [id]: moved });
      }
    } else {
      onColorIdsChange([...colorIds, id]);
    }
    setPicking(false);
  };

  const remove = (id) => {
    onColorIdsChange(colorIds.filter((c) => c !== id));
    // Its photos stay, untagged, rather than vanishing with the colour.
    onPhotosChange(photos.map((p) => (p.colorId === id ? { ...p, colorId: null } : p)));
  };

  const createAndAdd = async (form) => {
    const color = await createColor(form);
    setCreated((list) => [...list, color]);
    setDialog((d) => ({ ...d, open: false }));
    onColorCreated?.();
    add(color.id);
  };

  return (
    <FormSection title="Colours, sizes & stock">
      <div>
        <p className="input-label">Colours <span className="normal-case tracking-normal text-espresso-soft">(optional)</span></p>
        {realIds.length === 0 && (
          <p className="mb-3 text-[12px] text-espresso-soft">
            Only needed when the piece comes in more than one colour. Leave empty and shoppers simply see the photos.
          </p>
        )}

        {chosen.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chosen.map((c) => {
              const count = photoCount(c.id);
              return (
                <button key={c.id} type="button" onClick={() => remove(c.id)} aria-label={`Remove ${c.name}`} className={`${CHIP} border-espresso bg-espresso text-ivory-50 hover:bg-espresso-600`}>
                  <span aria-hidden="true" className="size-3 border border-ivory-50/40" style={{ backgroundColor: c.hex }} />
                  {c.name}
                  <span className="tabular-nums text-ivory-50/60">
                    {count} {count === 1 ? "photo" : "photos"}
                  </span>
                  <X className="size-3.5 text-ivory-50/60" aria-hidden="true" />
                </button>
              );
            })}
            <button type="button" onClick={() => setPicking((v) => !v)} aria-expanded={picking} className={`${CHIP} border-dashed border-umber-100 text-[11px] uppercase tracking-[0.14em] text-espresso-soft hover:border-espresso hover:text-espresso`}>
              <Plus className="size-3.5" aria-hidden="true" />
              Add colour
            </button>
          </div>
        )}

        {showPalette && (
          <div className={chosen.length ? "mt-3 border-t border-umber-50 pt-3" : undefined}>
            <div className="flex flex-wrap gap-1.5">
              {available.map((c) => (
                <button key={c.id} type="button" onClick={() => add(c.id)} className={`${CHIP} border-umber-100 bg-ivory-50 text-espresso-soft hover:border-espresso/50 hover:text-espresso`}>
                  <span aria-hidden="true" className="size-3 border border-umber-100" style={{ backgroundColor: c.hex }} />
                  {c.name}
                </button>
              ))}
              <button type="button" onClick={() => setDialog((d) => ({ open: true, n: d.n + 1 }))} className={`${CHIP} border-dashed border-umber-100 text-[11px] uppercase tracking-[0.14em] text-espresso-soft hover:border-espresso hover:text-espresso`}>
                <Plus className="size-3.5" aria-hidden="true" />
                New colour
              </button>
            </div>
          </div>
        )}
      </div>

      <ProductFormSizes category={category} taxonomy={taxonomy} sizes={sizes} onChange={onSizesChange} />

      <ProductFormStock colors={all} colorIds={colorIds} stock={stock} onChange={onStockChange} sizes={sizes} taxonomy={taxonomy} spread={spread} reserved={reserved} register={register} />

      <ColorDialog key={dialog.n} open={dialog.open} families={familyOptionsFrom(taxonomy)} onClose={() => setDialog((d) => ({ ...d, open: false }))} onSave={createAndAdd} />
    </FormSection>
  );
}
