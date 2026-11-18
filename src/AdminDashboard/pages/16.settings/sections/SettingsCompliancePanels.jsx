/* Admin Dashboard Page: Settings - SettingsCompliancePanels */
import Field from "../../../../components/ui/Field";
import Panel from "@/AdminDashboard/components/Panel";
import AddressFields from "./SettingsAddressFields";

export function GpsrPanel({ register, errors }) {
  return (
    <Panel
      title="Product safety (GPSR)"
      hint="The shop's details as seller and EU contact, shown on every product page. Each piece's own manufacturer is set on the product."
    >
      {/* Stored as gpsr.manufacturer for the server's sake; it is the seller's name. */}
      <Field label="Seller name" helper="Business name only, e.g. Belioras – Online Boutique.">
        <input {...register("gpsrManufacturer")} />
      </Field>
      <div>
        <p className="input-label">Registered address</p>
        <AddressFields register={register} prefix="gpsr" />
      </div>
      <Field label="Compliance email" error={errors.gpsrEmail?.message}>
        <input type="email" {...register("gpsrEmail")} />
      </Field>
    </Panel>
  );
}

export function SocialPanel({ register }) {
  return (
    <Panel title="Social">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Instagram">
          <input {...register("instagram")} />
        </Field>
        <Field label="Facebook">
          <input {...register("facebook")} />
        </Field>
        <Field label="Pinterest">
          <input {...register("pinterest")} />
        </Field>
        <Field label="TikTok">
          <input {...register("tiktok")} />
        </Field>
      </div>
    </Panel>
  );
}
