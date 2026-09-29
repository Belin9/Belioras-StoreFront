/* Admin Dashboard Page: Sizes - HairGuideDialog */
import { useState } from "react";

import Modal from "@/components/common/Modal";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { useToast } from "@/context/ToastContext";
import { saveSizeGuide } from "@/services/catalog/sizeChartApi";
import { HAIR_LENGTH_COLUMNS, HAIR_TEXTURE_COLUMNS, HOW_TO_COLUMNS } from "./guideColumns";
import GuideRowsEditor from "./GuideRowsEditor";

/** Hair sizing: lengths and where they fall, how each texture wears, and how to measure. Remount with a changing `key`. */
export default function HairGuideDialog({ open, charts, onClose, onSaved }) {
  const { toast } = useToast();
  // The hair guide is one document, so its how-to steps read from inside it
  // rather than from the sibling key the old shared blob had.
  const guide = charts?.hair;
  const [note, setNote] = useState(guide?.note ?? "");
  const [lengths, setLengths] = useState(guide?.lengths ?? []);
  const [textures, setTextures] = useState(guide?.textures ?? []);
  const [howTo, setHowTo] = useState(guide?.howTo ?? []);
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // One request for the whole guide. These were two calls against a shared
      // key, which could save new lengths and leave the old instructions behind
      // if the second call failed.
      await saveSizeGuide("hair", { note, lengths, textures, howTo });
      toast("Hair sizing saved.", "success");
      onSaved();
    } catch (err) {
      toast(err.message ?? "Could not save that.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Hair sizing" width="max-w-3xl">
      <form onSubmit={save} className="space-y-6">
        <Field label="Note" helper="Shown under the lengths table.">
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="h-auto min-h-16 resize-y" />
        </Field>

        <div>
          <p className="input-label">Lengths</p>
          <GuideRowsEditor columns={HAIR_LENGTH_COLUMNS} rows={lengths} onChange={setLengths} />
        </div>

        <div>
          <p className="input-label">Textures</p>
          <GuideRowsEditor columns={HAIR_TEXTURE_COLUMNS} rows={textures} onChange={setTextures} />
        </div>

        <div>
          <p className="input-label">How it&rsquo;s measured</p>
          <GuideRowsEditor columns={HOW_TO_COLUMNS} rows={howTo} onChange={setHowTo} />
        </div>

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
