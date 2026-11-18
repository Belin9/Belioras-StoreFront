/* Admin Dashboard Page: Products - ProductFormSafety */
import Field from "@/components/ui/Field";
import FormSection from "./ProductFormSection";

/**
 * Who made the piece, for the EU product-safety (GPSR) panel on the product
 * page. Belioras sells; it does not manufacture, so this is the maker or brand
 * from the label or the supplier's paperwork. The shop's own seller details
 * come from Settings → Product safety and are shown beside these.
 */
export default function ProductFormSafety({ register }) {
  return (
    <FormSection
      title="Product safety"
      hint="The manufacturer or brand of this piece, as on its label or the supplier's documents. Shown in the product page's Product safety panel."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Manufacturer or brand">
          <input {...register("manufacturerName")} />
        </Field>
        <Field label="Contact (email or website)" helper="How the manufacturer can be reached.">
          <input {...register("manufacturerContact")} />
        </Field>
      </div>
      <Field label="Postal address" helper="The manufacturer's address, on one line.">
        <input {...register("manufacturerAddress")} />
      </Field>
      <Field label="Safety warnings (optional)" helper="e.g. Keep away from open flame. One per line.">
        <textarea rows={2} className="h-auto min-h-20 resize-y" {...register("safetyWarnings")} />
      </Field>
    </FormSection>
  );
}
