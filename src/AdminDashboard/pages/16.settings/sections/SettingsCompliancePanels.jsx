/* Admin Dashboard Page: Settings - SettingsCompliancePanels */
import Field from "../../../../components/ui/Field";
import Panel from "@/AdminDashboard/components/Panel";
import AddressFields from "./SettingsAddressFields";

export function GpsrPanel({ register, errors }) {
  return (
    <Panel
      title="Product safety (GPSR)"
      hint="EU General Product Safety Regulation requires a reachable responsible person."
    >
      <Field label="Manufacturer">
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
