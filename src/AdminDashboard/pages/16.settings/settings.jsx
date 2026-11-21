/* Admin Dashboard Page: Settings - settings */
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { useToast } from "../../../context/ToastContext";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { getSettings, updateSettings } from "../../../services/content/settingsApi";
import SaveBar from "@/AdminDashboard/components/SaveBar";
import ContactPanel from "./sections/SettingsContactPanel";
import { AnnouncementsPanel, CookiePanel, InvoicePanel, TaxPanel } from "./sections/SettingsStorefrontPanels";
import { GpsrPanel, SocialPanel } from "./sections/SettingsCompliancePanels";
import { toFormValues, toSettingsPayload } from "./sections/settingsForm";

/** The page's sections, in the order they appear and in the list beside them. */
const SECTIONS = [
  { id: "store", label: "Store" },
  { id: "checkout", label: "Checkout & tax" },
  { id: "compliance", label: "Compliance" },
  { id: "social", label: "Social" },
];

export default function DashSettings() {
  const { toast } = useToast();
  const { data: settings, loading } = useAsyncData(getSettings, []);

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

  if (loading) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <div className="skeleton h-40 w-full" />
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
      <nav aria-label="Settings sections" className="mb-6 flex gap-4 overflow-x-auto lg:sticky lg:top-0 lg:mb-0 lg:block lg:space-y-1 lg:self-start">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="block whitespace-nowrap border-b-2 border-transparent py-2 text-[12px] uppercase tracking-[0.14em] text-espresso-soft transition-colors hover:text-espresso lg:border-b-0 lg:border-l-2 lg:pl-4 lg:hover:border-gold-500"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <div className="max-w-3xl space-y-10 pb-10">
        <section id="store" aria-label="Store" className="scroll-mt-4 space-y-5">
          <ContactPanel register={register} setValue={setValue} watch={watch} errors={errors} />
          <AnnouncementsPanel register={register} watch={watch} setValue={setValue} fields={fields} append={append} remove={remove} />
          <CookiePanel register={register} />
        </section>
        <section id="checkout" aria-label="Checkout and tax" className="scroll-mt-4 space-y-5">
          <TaxPanel register={register} errors={errors} />
          <InvoicePanel register={register} />
        </section>
        <section id="compliance" aria-label="Compliance" className="scroll-mt-4 space-y-5">
          <GpsrPanel register={register} errors={errors} />
        </section>
        <section id="social" aria-label="Social" className="scroll-mt-4 space-y-5">
          <SocialPanel register={register} />
        </section>
      </div>

      <SaveBar dirty={isDirty} saving={isSubmitting} onDiscard={() => reset()} message="You have unsaved changes." className="lg:col-span-2" />
    </form>
  );
}
