/* Admin Dashboard Page: Sizes - ModelsPanel */
import { useState } from "react";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";

import { useStaffAuth } from "@/context/auth/useAuthRealm";
import Modal from "@/components/common/Modal";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Field from "@/components/ui/Field";
import { useToast } from "@/context/ToastContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { createModel, deleteModel, getModels, modelUsage, updateModel } from "@/services/catalog/modelsApi";
import { uploadImage } from "@/AdminDashboard/lib/imageUpload";
import IconAction from "../../../components/IconAction";

const MEASURES = [
  ["heightCm", "Height"],
  ["bustCm", "Bust"],
  ["waistCm", "Waist"],
  ["hipCm", "Hip"],
];

/** Add or edit one model. Remount with a `key` per opening. */
function ModelDialog({ open, model, onClose, onSave }) {
  const [form, setForm] = useState({
    name: model?.name ?? "",
    photo: model?.photo ?? "",
    heightCm: model?.heightCm ?? "",
    bustCm: model?.bustCm ?? "",
    waistCm: model?.waistCm ?? "",
    hipCm: model?.hipCm ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickPhoto = async (file) => {
    if (!file?.type.startsWith("image/")) return setError("Choose a photo (JPG, PNG or WebP).");
    setError("");
    setUploading(true);
    try {
      const { url } = await uploadImage(file, { folder: "models" });
      setForm((f) => ({ ...f, photo: url }));
    } catch (err) {
      setError(err?.status ? err.message : "The photo could not be uploaded. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message ?? "Could not save that model.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={model ? `Edit ${model.name}` : "Add a model"} width="max-w-lg">
      <form onSubmit={submit} className="space-y-5">
        <div className="flex items-center gap-4">
          {form.photo ? (
            <img src={form.photo} alt="" className="size-20 shrink-0 rounded-full object-cover object-top" />
          ) : (
            <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-umber-50 text-espresso/40">
              <UserRound className="size-8" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <label className="btn btn-sm btn-secondary cursor-pointer">
              Upload a photo
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickPhoto(e.target.files?.[0])} />
            </label>
            <p className="text-[12px] text-espresso-soft">A head-and-shoulders photo, shown in a circle.</p>
          </div>
        </div>
        <Field label="Name" required helper="As shown on the product page, e.g. Amara.">
          <input value={form.name} onChange={set("name")} autoFocus />
        </Field>
        <div>
          <p className="input-label">Measurements (cm)</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {MEASURES.map(([k, label]) => (
              <Field key={k} label={label}>
                <input type="number" min="0" step="1" value={form[k]} onChange={set(k)} />
              </Field>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-espresso-soft">Inches are worked out for the product page.</p>
        </div>
        {error && <p role="alert" className="border-l-2 border-error py-1 pl-3 text-[13px] text-error">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-umber-50 pt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving} disabled={uploading}>{uploading ? "Uploading photo…" : model ? "Save" : "Add model"}</Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * The models in the photographs. Each product names the model wearing it and
 * her size; the product page shows her card and measurements from here.
 */
export default function ModelsPanel() {
  const { toast } = useToast();
  const { canEdit } = useStaffAuth();
  const editable = canEdit("sizes");
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision((n) => n + 1);
  const { data: models, loading } = useAsyncData(getModels, [revision]);
  const { data: usage } = useAsyncData(modelUsage, [revision]);
  const [editing, setEditing] = useState({ open: false, model: null, n: 0 });
  const [removing, setRemoving] = useState(null);

  const save = async (form) => {
    const saved = editing.model ? await updateModel(editing.model.id, form) : await createModel(form);
    setEditing((e) => ({ ...e, open: false }));
    refresh();
    toast(`${saved.name} saved.`, "success");
  };

  if (loading) return <p className="text-[13px] text-espresso-soft">Loading…</p>;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-xl text-[13px] leading-relaxed text-espresso-soft">
          The models who wear the pieces in the photos and clips. Choose one on a product, with the size she wears, and the
          product page shows her card and measurements in centimetres and inches.
        </p>
        {editable && (
          <Button icon={Plus} size="sm" className="h-10" onClick={() => setEditing((e) => ({ open: true, model: null, n: e.n + 1 }))}>
            Add a model
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(models ?? []).map((m) => (
          <article key={m.id} className="flex gap-4 border border-umber-50 bg-ivory-50 p-5">
            {m.photo ? (
              <img src={m.photo} alt="" className="size-16 shrink-0 rounded-full object-cover object-top" />
            ) : (
              <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-umber-50 text-espresso/40"><UserRound className="size-6" aria-hidden="true" /></span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-xl text-espresso">{m.name}</p>
                {editable && (
                  <div className="-mr-2 -mt-1 flex">
                    <IconAction label={`Edit ${m.name}`} icon={Pencil} onClick={() => setEditing((e) => ({ open: true, model: m, n: e.n + 1 }))} />
                    <IconAction label={`Remove ${m.name}`} icon={Trash2} destructive onClick={() => setRemoving(m)} />
                  </div>
                )}
              </div>
              <p className="mt-1 text-[12px] tabular-nums text-espresso-soft">
                {MEASURES.filter(([k]) => m[k]).map(([k, label]) => `${label} ${m[k]}`).join(" · ")} cm
              </p>
              <p className="mt-2 text-[12px] text-espresso-soft">{usage?.[m.id] ?? 0} {usage?.[m.id] === 1 ? "piece" : "pieces"}</p>
            </div>
          </article>
        ))}
      </div>

      <ModelDialog key={editing.n} open={editing.open} model={editing.model} onClose={() => setEditing((e) => ({ ...e, open: false }))} onSave={save} />
      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          const m = removing;
          setRemoving(null);
          try {
            await deleteModel(m.id);
            refresh();
            toast(`${m.name} removed.`, "success");
          } catch (err) {
            toast(err.message ?? "Could not remove that model.", "error");
          }
        }}
        title={`Remove ${removing?.name ?? "this model"}?`}
        description="A model still shown on a piece can't be removed until the piece has another."
        confirmLabel="Remove"
      />
    </section>
  );
}
