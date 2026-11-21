/* Admin Dashboard Page: Products - ProductFormModel */
import { Link } from "react-router-dom";

import { sizeLabel } from "@/utils/sizeLabel";
import FormSection from "./ProductFormSection";

/**
 * Optional: the model wearing this piece in its photos and clips, and the
 * size she wears. With one chosen, the product page shows her card and
 * measurements; left as "Not shown", it shows neither. Choosing a model fills
 * "Size she wears" with her usual size when it is empty and the piece offers it.
 */
export default function ProductFormModel({ register, setValue, getValues, models = [], sizes, taxonomy }) {
  const prefillSize = (e) => {
    const usual = models.find((m) => m.id === e.target.value)?.size;
    if (!usual || !setValue || getValues?.("modelSize")) return;
    if (sizes.length && !sizes.includes(usual)) return;
    setValue("modelSize", usual, { shouldDirty: true });
  };

  return (
    <FormSection title="Fit model" hint="Who wears this piece in its photos. Leave as Not shown and the product page shows no model.">
      <div>
        <p className="mb-3 text-[12px] text-espresso-soft">
          Shows her card and measurements on the product page, and &ldquo;Amara is 175 cm tall and wears size S&rdquo; under the sizes.
          Models are managed under Sizes &amp; Guides → Models.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col">
            <span className="input-label">Model</span>
            <select className="input" {...register("modelId", { onChange: prefillSize })}>
              <option value="">Not shown</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.heightCm ? ` · ${m.heightCm} cm` : ""}
                  {m.size ? ` · ${sizeLabel(taxonomy, m.size)}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="input-label">Size she wears</span>
            <select className="input" {...register("modelSize")}>
              <option value="">Choose a size</option>
              {(sizes.length ? sizes : ["one-size"]).map((s) => (
                <option key={s} value={s}>{s === "one-size" ? "One size" : sizeLabel(taxonomy, s)}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {models.length === 0 && (
        <p className="text-[12px] text-espresso-soft">
          No models yet. <Link to="/dashboard/sizes" className="text-gold-800 underline underline-offset-4">Add one under Sizes &amp; Guides → Models</Link>.
        </p>
      )}
    </FormSection>
  );
}
