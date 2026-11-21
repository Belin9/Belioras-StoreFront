/* Admin Dashboard Page: Products - ProductFormDetails */
import Field from "@/components/ui/Field";
import FormSection from "./ProductFormSection";

/** The bullet points shown under Details on the product page. */
export default function ProductFormDetails({ register }) {
  return (
    <FormSection title="Details" hint="Shown under Details on the product page, one point per line.">
      <Field label="Details" helper="e.g. Concealed back zip · Fully lined · 13×4 lace frontal">
        <textarea rows={4} className="h-auto min-h-28 resize-y" {...register("details")} />
      </Field>
    </FormSection>
  );
}
