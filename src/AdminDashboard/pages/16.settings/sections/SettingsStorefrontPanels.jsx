/* Admin Dashboard Page: Settings - SettingsStorefrontPanels */
import { Plus, Trash2 } from "lucide-react";

import Field from "../../../../components/ui/Field";
import Panel from "@/AdminDashboard/components/Panel";
import IconAction from "@/AdminDashboard/components/IconAction";
import Switch from "@/AdminDashboard/components/Switch";

/**
 * The messages that scroll across the top of every page. Each has its own
 * switch and optional dates, so a sale message can be written now and appear
 * only while it applies.
 */
export function AnnouncementsPanel({ register, watch, setValue, fields, append, remove }) {
  return (
    <Panel title="Announcement bar" hint="The messages that scroll across the top of every page. Switch one off to hide it, or give it dates.">
      <ul className="space-y-4">
        {fields.map((field, i) => {
          const active = watch(`announcements.${i}.active`);
          return (
            <li key={field.id} className="space-y-3 border border-umber-50 bg-white p-4">
              <div className="flex items-start gap-3">
                <Field label="Message" className="flex-1">
                  <input {...register(`announcements.${i}.text`)} placeholder="Free shipping in Germany" />
                </Field>
                <div className="flex items-center gap-1 pt-7">
                  <Switch
                    checked={Boolean(active)}
                    onChange={(on) => setValue(`announcements.${i}.active`, on, { shouldDirty: true })}
                    label={active ? "Hide this message" : "Show this message"}
                  />
                  <IconAction label="Remove this message" icon={Trash2} destructive onClick={() => remove(i)} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Links to">
                  <input {...register(`announcements.${i}.link`)} placeholder="/shop" />
                </Field>
                <Field label="Shows from" helper="Optional.">
                  <input type="date" {...register(`announcements.${i}.start`)} />
                </Field>
                <Field label="Until" helper="Optional.">
                  <input type="date" {...register(`announcements.${i}.end`)} />
                </Field>
              </div>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => append({ id: "", key: "", keyText: "", text: "", link: "", active: true, start: "", end: "" })}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-800 transition-colors hover:text-espresso"
      >
        <Plus className="size-3.5" aria-hidden="true" />
        Add a message
      </button>
    </Panel>
  );
}

export function CookiePanel({ register }) {
  return (
    <Panel title="Cookie notice" hint="Required under EU ePrivacy rules. The box grows as you write.">
      <Field label="Notice text">
        <textarea rows={4} {...register("cookieText")} className="min-h-32 resize-y [field-sizing:content]" />
      </Field>
    </Panel>
  );
}

export function TaxPanel({ register, errors }) {
  return (
    <Panel title="Tax" hint="The VAT rate included in every price, used at checkout and on invoices.">
      <div className="max-w-xs">
        <Field
          label="VAT rate (%)"
          helper="German standard rate is 19%. Prices are shown inclusive."
          error={errors.taxRate?.message}
        >
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            {...register("taxRate", {
              min: { value: 0, message: "Rate cannot be negative." },
              max: { value: 100, message: "Rate cannot exceed 100%." },
            })}
          />
        </Field>
      </div>
      <p className="text-[12px] leading-relaxed text-espresso-soft">
        One rate applies to every order for now. Once sales to other EU countries pass the EU-wide threshold, the
        One-Stop-Shop scheme generally means charging each customer&rsquo;s own country&rsquo;s rate — worth confirming with
        your accountant before you launch.
      </p>
    </Panel>
  );
}

export function InvoicePanel({ register }) {
  return (
    <Panel title="Invoices" hint="Every paid order gets a numbered invoice, which is also the customer's receipt. These details print on it.">
      {/* Its own field: German VAT law (§14 UStG) needs the owner's full name
          on invoices, while the seller name on product pages (Product safety)
          is the business name only. */}
      <Field
        label="Seller's legal name"
        helper="Printed on invoices and credit notes only, as the law requires, e.g. Belioras – Online Boutique (Belindah Ongessa). Left empty, invoices use the seller name from Product safety."
      >
        <input {...register("invoiceSellerName")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Number prefix" helper="BEL → BEL-2026-0001.">
          <input {...register("invoicePrefix")} />
        </Field>
        <Field label="VAT ID" helper="USt-IdNr., e.g. DE123456789.">
          <input {...register("invoiceVatId")} />
        </Field>
        <Field label="Tax number" helper="Steuernummer, if you have one.">
          <input {...register("invoiceTaxNumber")} />
        </Field>
      </div>
      <Field label="Note at the foot of the invoice">
        <textarea rows={2} {...register("invoiceNote")} className="resize-y" />
      </Field>
    </Panel>
  );
}
