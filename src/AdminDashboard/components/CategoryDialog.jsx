/* Admin Dashboard: CategoryDialog */
import { useState } from "react";

import Modal from "@/components/common/Modal";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { useToast } from "@/context/ToastContext";
import CategorySubcategoriesField from "./CategorySubcategoriesField";
import CategoryTypesField from "./CategoryTypesField";
import ChoiceChips from "./ChoiceChips";

/**
 * Adds or edits one category: its name, the sizes it offers, its own
 * product-taggable types, and its Subcategories. Remount with a changing
 * `key` per open.
 *
 * `sizesEditable` is false for the quick "+ New category" shortcut inside Add
 * Product: deciding what a whole category's size range is belongs to
 * Categories & Colours, not a detour while adding one piece. The new category
 * opens there with no sizes yet ("one size" until set), same as if it had been
 * created from Categories & Colours and left unconfigured.
 */
export default function CategoryDialog({
  open,
  initial = null,
  sizeOptions = [],
  sizesEditable = true,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    sizes: initial?.sizes ?? [],
    types: initial?.types ?? [],
    subcategories: initial?.subcategories ?? [],
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const toggle = (key) => (id) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(id) ? f[key].filter((v) => v !== id) : [...f[key], id],
    }));

  const submit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    setError("");
    try {
      // Sizes keep the taxonomy's order whatever order they were ticked in.
      const sizes = sizeOptions.map((s) => s.id).filter((id) => form.sizes.includes(id));
      await onSave({ ...form, sizes });
    } catch (err) {
      const message = err.message ?? "Could not save that category.";
      setError(message);
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? `Edit ${initial.name}` : "New category"} width="max-w-lg">
      <form onSubmit={submit} className="space-y-6">
        <Field label="Name" required helper="What a piece is, such as Dresses, Hair or Shoes.">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Shoes"
          />
        </Field>

        {sizesEditable ? (
          <ChoiceChips
            label="Sizes offered"
            hint="Leave all unticked for one-size pieces, such as bags or wigs."
            options={sizeOptions.map((s) => ({ id: s.id, label: s.name }))}
            selected={form.sizes}
            onToggle={toggle("sizes")}
          />
        ) : (
          <p className="input-helper">
            Sizes, one size by default: set them afterwards in Categories &amp; Colours.
          </p>
        )}

        {/* Always shown, Subcategories or not: this is the field the product
            form's Type picker reads, so hiding it left existing types
            uneditable while products still carried them. */}
        <CategoryTypesField types={form.types} onChange={(types) => setForm((f) => ({ ...f, types }))} />

        <CategorySubcategoriesField
          subcategories={form.subcategories}
          onChange={(subcategories) => setForm((f) => ({ ...f, subcategories }))}
        />

        {error && (
          <p role="alert" className="border-l-2 border-error py-1 pl-3 text-[13px] text-error">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-umber-50 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} className="bg-espresso text-ivory-50 hover:bg-espresso-600">
            {initial ? "Save category" : "Add category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
