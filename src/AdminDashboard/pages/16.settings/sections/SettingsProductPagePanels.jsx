/* Admin Dashboard Page: Settings - SettingsProductPagePanels */
import Field from "../../../../components/ui/Field";
import Panel from "@/AdminDashboard/components/Panel";
import { TRUST_ICON_LABELS } from "@/utils/trustIcons";

const FORMAT_HINT =
  "A blank line starts a new paragraph, a line starting with “- ” is a bullet point, and **words** between double stars are bold. Email addresses become links. Leave empty to hide the row.";

const POLICIES = [
  { name: "productShipping", label: "Shipping Policy", helper: "Shown under the live shipping rates, with a link to the full shipping page." },
  { name: "productPreOrder", label: "Pre-Order Policy", helper: "Shown only on pieces switched to Pre-order in the product form." },
  { name: "productReturns", label: "Return & Refund Policy", helper: "Shown under the piece's own returns line, with a link to the full policy." },
  { name: "productResponsible", label: "Responsible Production", helper: "How Belioras sources and makes its pieces." },
];

/** The short lines under Add to bag on every product page. */
export function TrustRowPanel({ register }) {
  return (
    <Panel title="Trust row" hint="Up to four short lines under Add to bag on every product page. Leave a line empty to hide it.">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <label className="flex flex-col">
            <span className="input-label">Icon</span>
            <select className="input" {...register(`productTrust.${i}.icon`)}>
              {Object.entries(TRUST_ICON_LABELS).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </label>
          <Field label={`Line ${i + 1}`}>
            <input {...register(`productTrust.${i}.text`)} maxLength={60} placeholder="e.g. Free shipping within Germany" />
          </Field>
        </div>
      ))}
    </Panel>
  );
}

/** The policy rows in the product page's accordion. */
export function PolicyRowsPanel({ register }) {
  return (
    <Panel title="Policy rows" hint={FORMAT_HINT}>
      {POLICIES.map((p) => (
        <Field key={p.name} label={p.label} helper={p.helper}>
          <textarea rows={8} className="h-auto min-h-40 resize-y" {...register(p.name)} />
        </Field>
      ))}
    </Panel>
  );
}
