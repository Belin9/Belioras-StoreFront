/* Admin Dashboard Page: Products - ProductFormModel */
import { useState } from "react";
import { Link } from "react-router-dom";
import { UserRound } from "lucide-react";

import { sizeLabel } from "@/utils/sizeLabel";
import ModelPickerDialog, { ModelFace } from "./ModelPickerDialog";
import FormSection from "./ProductFormSection";

/**
 * Optional: the model wearing this piece in its photos and clips, and the
 * size she wears. Picked by face from a dialog. With one chosen, the product
 * page shows her card and measurements; with none, it shows neither. Choosing
 * a model fills "Size she wears" with her usual size when it is empty and the
 * piece offers it.
 */
export default function ProductFormModel({ register, setValue, getValues, modelId, models = [], sizes, taxonomy }) {
  const [picking, setPicking] = useState(false);
  const chosen = models.find((m) => m.id === modelId) ?? null;

  const pick = (id) => {
    setValue("modelId", id, { shouldDirty: true });
    setPicking(false);
    const usual = models.find((m) => m.id === id)?.size;
    if (!usual || getValues("modelSize")) return;
    if (sizes.length && !sizes.includes(usual)) return;
    setValue("modelSize", usual, { shouldDirty: true });
  };

  return (
    <FormSection
      title="Fit model"
      hint={<>Who wears this piece in its photos. The product page shows her card and &ldquo;Amara is 175 cm tall and wears size S&rdquo; under the sizes.</>}
    >
      <div className="flex flex-wrap items-center gap-4">
        <span className="size-16 shrink-0 overflow-hidden rounded-full border border-umber-50">
          {chosen ? (
            <ModelFace model={chosen} />
          ) : (
            <span className="flex size-full items-center justify-center bg-umber-50 text-espresso/40">
              <UserRound className="size-7" aria-hidden="true" />
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] text-espresso">{chosen ? chosen.name : modelId ? "A model no longer listed" : "No model shown"}</p>
          {chosen && (
            <p className="text-[12px] text-espresso-soft">
              {[chosen.heightCm && `${chosen.heightCm} cm`, chosen.size && `Usually size ${sizeLabel(taxonomy, chosen.size)}`].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPicking(true)} disabled={!models.length} className="btn btn-sm btn-secondary">
            {modelId ? "Change" : "Choose model"}
          </button>
          {modelId && (
            <button type="button" onClick={() => pick("")} className="btn btn-sm btn-ghost">
              Remove
            </button>
          )}
        </div>
      </div>

      {modelId && (
        <label className="flex max-w-xs flex-col">
          <span className="input-label">Size she wears</span>
          <select className="input" {...register("modelSize")}>
            <option value="">Choose a size</option>
            {(sizes.length ? sizes : ["one-size"]).map((s) => (
              <option key={s} value={s}>{s === "one-size" ? "One size" : sizeLabel(taxonomy, s)}</option>
            ))}
          </select>
        </label>
      )}

      {models.length === 0 && (
        <p className="text-[12px] text-espresso-soft">
          No models yet. <Link to="/dashboard/sizes?tab=models" className="text-gold-800 underline underline-offset-4">Add one under Sizes &amp; Guides → Models</Link>.
        </p>
      )}

      <ModelPickerDialog open={picking} onClose={() => setPicking(false)} models={models} value={modelId} onPick={pick} taxonomy={taxonomy} />
    </FormSection>
  );
}
