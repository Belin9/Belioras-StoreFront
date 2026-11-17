/* Admin Dashboard Page: Settings - SettingsContactPanel */
import Field from "../../../../components/ui/Field";
import PhoneField from "../../../../components/ui/PhoneField";
import Panel from "@/AdminDashboard/components/Panel";
import AddressFields from "./SettingsAddressFields";

export default function ContactPanel({ register, setValue, watch, errors }) {
  return (
    <Panel
      title="Contact"
      hint="Belioras operates two mailboxes. These are used across the legal pages, the client-care pages and the contact form, so changing one here changes it everywhere."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="General enquiries"
          required
          error={errors.contactGeneral?.message}
          helper="Press, privacy and GDPR requests, GPSR compliance, legal."
        >
          <input
            type="email"
            {...register("contactGeneral", { required: "A general address is required." })}
          />
        </Field>

        <Field
          label="Client care"
          required
          error={errors.contactSupport?.message}
          helper="Orders, tracking, returns, shipping and sizing."
        >
          <input
            type="email"
            {...register("contactSupport", { required: "A support address is required." })}
          />
        </Field>

        <PhoneField register={register} setValue={setValue} watch={watch} name="contactPhone" label="Telephone" />

        {/* Opens the storefront's "Talk to a person" button; hidden while empty. */}
        <PhoneField register={register} setValue={setValue} watch={watch} name="contactWhatsapp" label="WhatsApp number" />

        <Field label="Opening hours">
          <input {...register("contactHours")} />
        </Field>
      </div>

      <div>
        <p className="input-label">Boutique address</p>
        <AddressFields register={register} prefix="boutique" />
      </div>
    </Panel>
  );
}
