/* Admin Dashboard Page: Shipping - shipping */
import { useState } from "react";

import SaveBar from "@/AdminDashboard/components/SaveBar";
import { useToast } from "../../../context/ToastContext";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { getSettings, updateSettings } from "../../../services/content/settingsApi";
import ShippingZonesPanel from "./sections/ShippingZonesPanel";

/**
 * Its own page rather than a panel inside Settings: shipping is where the
 * real operational complexity of running the shop lives — zones today,
 * carriers and methods to come. Room to grow that Settings' single flat
 * form never had.
 */
export default function DashShipping() {
  const { toast } = useToast();
  const { data: settings, loading } = useAsyncData(getSettings, []);

  const [zoneEdits, setZoneEdits] = useState(null);
  // What the server last held, so a save clears the bar without a refetch.
  const [saved, setSaved] = useState(null);
  const baseline = saved ?? settings?.shipping?.zones ?? [];
  const zones = zoneEdits ?? baseline;
  const dirty = zoneEdits !== null && JSON.stringify(zoneEdits) !== JSON.stringify(baseline);

  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // updateSettings merges section by section, so this never touches
      // contact, tax, compliance or anything else Settings owns.
      await updateSettings({ shipping: { zones } });
      setSaved(zones);
      setZoneEdits(null);
      toast("Shipping zones saved.", "success");
    } catch (err) {
      toast(err.message ?? "Could not save those zones.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <ShippingZonesPanel zones={zones} onChange={setZoneEdits} />
      <SaveBar dirty={dirty} saving={saving} onDiscard={() => setZoneEdits(null)} />
    </form>
  );
}
