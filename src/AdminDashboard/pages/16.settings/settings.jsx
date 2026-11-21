/* Admin Dashboard Page: Settings - settings */
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { useToast } from "../../../context/ToastContext";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { getSettings, updateSettings } from "../../../services/content/settingsApi";
import DashTabs from "@/AdminDashboard/components/DashTabs";
import SaveBar from "@/AdminDashboard/components/SaveBar";
import { useTabParam } from "@/AdminDashboard/lib/useTabParam";
import ContactPanel from "./sections/SettingsContactPanel";
import { AnnouncementsPanel, CookiePanel, InvoicePanel, TaxPanel } from "./sections/SettingsStorefrontPanels";
import { GpsrPanel, SocialPanel } from "./sections/SettingsCompliancePanels";
import { toFormValues, toSettingsPayload } from "./sections/settingsForm";

/**
 * One tab per job instead of one long scroll. It is still one form: changes
 * on several tabs wait in the save bar together and save together.
 */
const TABS = [
  { value: "store", label: "Store details" },
  { value: "storefront", label: "Storefront" },
  { value: "checkout", label: "Checkout & tax" },
  { value: "compliance", label: "Compliance" },
];

/** Which tab holds a field, so a save that fails opens the tab with the problem. */
function tabOf(field) {
  if (/^(gpsr)/.test(field)) return "compliance";
  if (/^(tax|invoice)/.test(field)) return "checkout";
  if (/^(announcements|cookie)/.test(field)) return "storefront";
  return "store";
}

export default function DashSettings() {
  const { toast } = useToast();
  const { data: settings, loading } = useAsyncData(getSettings, []);
  const [tab, setTab] = useTabParam(TABS.map((t) => t.value));

  const {
    register,
    setValue,
    watch,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ defaultValues: { announcements: [] } });
  const { fields, append, remove } = useFieldArray({ control, name: "announcements" });

  /* Side Effect */
  useEffect(() => {
    if (settings) reset(toFormValues(settings));
  }, [settings, reset]);

  const onSubmit = async (values) => {
    try {
      const saved = await updateSettings(toSettingsPayload(values));
      // What was just saved is the new starting point, so the bar goes away.
      reset(toFormValues(saved));
      toast("Settings saved.", "success");
    } catch (err) {
      toast(err.message ?? "Could not save those settings.", "error");
    }
  };

  const onInvalid = (errs) => {
    const first = Object.keys(errs)[0];
    if (first) setTab(tabOf(first));
    toast("A few fields need attention before saving.", "error");
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <div className="skeleton h-40 w-full" />
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
      <DashTabs options={TABS} value={tab} onChange={setTab} ariaLabel="Settings" />

      <div role="tabpanel" aria-label={TABS.find((t) => t.value === tab).label} className="max-w-3xl space-y-5 pb-10">
        {tab === "store" && (
          <>
            <ContactPanel register={register} setValue={setValue} watch={watch} errors={errors} />
            <SocialPanel register={register} />
          </>
        )}
        {tab === "storefront" && (
          <>
            <AnnouncementsPanel register={register} watch={watch} setValue={setValue} fields={fields} append={append} remove={remove} />
            <CookiePanel register={register} />
          </>
        )}
        {tab === "checkout" && (
          <>
            <TaxPanel register={register} errors={errors} />
            <InvoicePanel register={register} />
          </>
        )}
        {tab === "compliance" && <GpsrPanel register={register} errors={errors} />}
      </div>

      <SaveBar dirty={isDirty} saving={isSubmitting} onDiscard={() => reset()} message="You have unsaved changes." />
    </form>
  );
}
