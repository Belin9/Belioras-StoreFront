/* Admin Dashboard Page: Sizes - SizesPanel */
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import DetailValueDialog from "@/AdminDashboard/components/DetailValueDialog";
import IconAction from "@/AdminDashboard/components/IconAction";
import ViewToggle from "@/AdminDashboard/components/ViewToggle";
import { useListView } from "@/AdminDashboard/lib/useListView";
import { getTaxonomy } from "@/services/catalog/navigationApi";
import { createSize, deleteSize, renameSize, sizeUsage } from "@/services/catalog/sizesApi";

/**
 * The size list a category offers from and a product picks within — XS, EU
 * 38, One Size. The measurement tables that explain what each one means are
 * on the Guides tab.
 */
export default function SizesPanel() {
  const { toast } = useToast();
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision((n) => n + 1);

  const { data: taxonomy, loading } = useAsyncData(getTaxonomy, [revision]);
  const { data: usage } = useAsyncData(sizeUsage, [revision]);
  const rows = taxonomy?.size?.values ?? [];

  const [dialog, setDialog] = useState({ open: false, initial: null, n: 0 });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [view, setView] = useListView("sizes");

  const openDialog = (initial) => setDialog((d) => ({ open: true, initial, n: d.n + 1 }));
  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  const save = async (name) => {
    const saved = dialog.initial ? await renameSize(dialog.initial.id, name) : await createSize(name);
    closeDialog();
    refresh();
    toast(`${saved.name} ${dialog.initial ? "saved" : "added"}.`, "success");
  };

  const askDelete = (value) => {
    const cats = usage?.categories?.[value.id] ?? 0;
    const prods = usage?.products?.[value.id] ?? 0;
    if (cats || prods) {
      const parts = [cats && `${cats} ${cats === 1 ? "category" : "categories"}`, prods && `${prods} ${prods === 1 ? "product" : "products"}`].filter(Boolean);
      toast(`${value.name} is offered by ${parts.join(" and ")}. Remove it from them first.`, "error");
      return;
    }
    setPendingDelete(value);
  };

  const confirmDelete = async () => {
    const value = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteSize(value.id);
      refresh();
      toast(`${value.name} deleted.`, "success");
    } catch (err) {
      toast(err.message ?? "Could not delete that.", "error");
    }
  };

  if (loading) return <p className="text-[13px] text-espresso-soft">Loading…</p>;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-xl text-[13px] leading-relaxed text-espresso-soft">
          What a category offers under &ldquo;Sizes offered&rdquo;, and a product picks within. Renaming
          keeps every category and product that uses it; a size still offered can&rsquo;t be deleted.
        </p>
        <div className="flex items-center gap-2">
          <ViewToggle value={view} onChange={setView} />
          <Button icon={Plus} size="sm" onClick={() => openDialog(null)} className="h-10">
            Add size
          </Button>
        </div>
      </div>

      {view === "cards" && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((value) => {
            const prods = usage?.products?.[value.id] ?? 0;
            const cats = usage?.categories?.[value.id] ?? 0;
            return (
              <li key={value.id} className="flex flex-col border border-umber-50 bg-ivory-50">
                <div className="flex items-center gap-3 p-4">
                  <span className="flex h-12 min-w-12 items-center justify-center bg-gold-500/10 px-2 font-display text-lg text-espresso">
                    {value.name}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] text-espresso">Size {value.name}</p>
                    <p className="text-[11px] tabular-nums text-espresso-soft">
                      {prods ? `${prods} ${prods === 1 ? "product" : "products"}` : "Not used yet"} · {cats} {cats === 1 ? "category" : "categories"}
                    </p>
                  </div>
                </div>
                <div className="mt-auto flex justify-end border-t border-umber-50 px-2 py-1">
                  <IconAction label={`Rename ${value.name}`} icon={Pencil} onClick={() => openDialog(value)} />
                  <IconAction label={`Delete ${value.name}`} icon={Trash2} destructive onClick={() => askDelete(value)} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {view === "list" && (
      <ul className="divide-y divide-umber-50 border border-umber-50 bg-ivory-50">
        {rows.map((value) => (
          <li key={value.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="min-w-0 truncate text-[13px] text-espresso">{value.name}</span>
            <span className="ml-auto shrink-0 text-[11px] tabular-nums text-espresso-soft">
              {usage?.categories?.[value.id] ?? 0} categories · {usage?.products?.[value.id] ?? 0} products
            </span>
            <div className="flex shrink-0 items-center">
              <IconAction label={`Rename ${value.name}`} icon={Pencil} onClick={() => openDialog(value)} />
              <IconAction label={`Delete ${value.name}`} icon={Trash2} destructive onClick={() => askDelete(value)} />
            </div>
          </li>
        ))}
      </ul>
      )}

      <DetailValueDialog key={dialog.n} open={dialog.open} dimensionLabel="size" initial={dialog.initial} onClose={closeDialog} onSave={save} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete ${pendingDelete?.name ?? "this size"}?`}
        description="No category offers it and no product uses it, so nothing in the shop changes."
        confirmLabel="Delete"
      />
    </section>
  );
}
