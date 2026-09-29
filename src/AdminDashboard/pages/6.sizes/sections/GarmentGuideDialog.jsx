/* Admin Dashboard Page: Sizes - GarmentGuideDialog */
import { useState } from "react";

import Modal from "@/components/common/Modal";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { useToast } from "@/context/ToastContext";
import { saveSizeGuide } from "@/services/catalog/sizeChartApi";
import { GARMENT_COLUMNS, HOW_TO_COLUMNS, INTERNATIONAL_COLUMNS } from "./guideColumns";
import GuideRowsEditor from "./GuideRowsEditor";

/**
 * Dresses sizing: body measurements by size, their international
 * equivalents, and how to take the measurements — everything the "Dresses"
 * tab of the storefront size guide shows. Remount with a changing `key`.
 */
export default function GarmentGuideDialog({ open, charts, onClose, onSaved }) {
  const { toast } = useToast();
  // The garment guide is one document, so the international table and the
  // how-to steps read from inside it rather than from sibling keys the old
  // shared blob had.
  const guide = charts?.garment;
  const [note, setNote] = useState(guide?.note ?? "");
  const [rows, setRows] = useState(guide?.rows ?? []);
  const [intlRows, setIntlRows] = useState(guide?.international.rows ?? []);
  const [howTo, setHowTo] = useState(guide?.howTo ?? []);
  const [garmentImage, setGarmentImage] = useState(guide?.garmentImage ?? "");
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // One request for the whole guide. These were three calls against shared
      // keys, which could save new measurements and leave the old instructions
      // behind if the second call failed.
      await saveSizeGuide("garment", {
        note,
        rows,
        international: { columns: guide?.international.columns ?? [], rows: intlRows },
        howTo,
        garmentImage,
      });
      toast("Dresses sizing saved.", "success");
      onSaved();
    } catch (err) {
      toast(err.message ?? "Could not save that.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Dresses sizing" width="max-w-4xl">
      <form onSubmit={save} className="space-y-6">
        <Field label="Note" helper="Shown under the body-measurements table.">
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="h-auto min-h-16 resize-y" />
        </Field>

        <div>
          <p className="input-label">Body measurements</p>
          <GuideRowsEditor columns={GARMENT_COLUMNS} rows={rows} onChange={setRows} />
        </div>

        <div>
          <p className="input-label">International equivalents</p>
          <GuideRowsEditor columns={INTERNATIONAL_COLUMNS} rows={intlRows} onChange={setIntlRows} />
        </div>

        <div>
          <p className="input-label">How to measure</p>
          <GuideRowsEditor columns={HOW_TO_COLUMNS} rows={howTo} onChange={setHowTo} />
        </div>

        <Field label="Model photo URL" helper="Shown beside the How to measure steps. Leave blank to show nothing.">
          <input
            value={garmentImage}
            onChange={(e) => setGarmentImage(e.target.value)}
            placeholder="https://…"
          />
        </Field>

        <div className="flex justify-end gap-2 border-t border-umber-50 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} className="bg-espresso text-ivory-50 hover:bg-espresso-600">
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
