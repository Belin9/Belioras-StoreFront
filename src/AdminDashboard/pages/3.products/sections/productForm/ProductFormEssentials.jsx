/* Admin Dashboard Page: Products - ProductFormEssentials */
import Field from "@/components/ui/Field";
import FormSection from "./ProductFormSection";

export default function ProductFormEssentials({ register, errors }) {
  return (
    <FormSection title="Basics">
      <Field label="Name" required error={errors.name?.message}>
        <input {...register("name", { required: "Give the piece a name." })} placeholder="Aurora Satin Midi Dress" />
      </Field>
      <Field label="SKU" helper="Your own reference for this piece. Leave blank if you don't use one.">
        <input {...register("sku")} placeholder="e.g. BEL-P1" />
      </Field>
      <Field label="Description" helper="The story of the piece, shown under Description on the product page.">
        <textarea {...register("description")} rows={4} className="h-auto min-h-28 resize-y" />
      </Field>
    </FormSection>
  );
}
