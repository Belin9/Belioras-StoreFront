/* Admin Dashboard Page: Products - ProductFormLabels */
import Toggle from "@/AdminDashboard/components/Toggle";
import FormSection from "./ProductFormSection";

const LABELS = [
  { field: "isNew", label: "New arrival", description: "Carries the New badge and appears in New Arrivals: on the home page and in the menu." },
  { field: "featured", label: "Featured", description: "Appears under Featured in the New Arrivals menu and in the Featured Collection." },
  { field: "bestseller", label: "Best seller", description: "Appears under Best Sellers in the menu, and tops up the home page rail while sales are few." },
  { field: "limited", label: "Limited release", description: "Made in small numbers. Appears under Limited Releases in the New Arrivals menu." },
  { field: "isPreOrder", label: "Pre-order", description: "Made or restocked after purchase. The product page shows the Pre-Order Policy (Settings › Product page)." },
];

export default function ProductFormLabels({ values, setValue }) {
  return (
    <FormSection title="Labels">
      {LABELS.map((l, i) => (
        <div key={l.field} className="space-y-4">
          {i > 0 && <div className="border-t border-umber-50" />}
          <Toggle
            checked={Boolean(values[l.field])}
            onChange={(on) => setValue(l.field, on, { shouldDirty: true })}
            label={l.label}
            description={l.description}
          />
        </div>
      ))}
    </FormSection>
  );
}
