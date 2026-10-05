/* Admin Dashboard Page: Categories - ColoursPanel */
import { useState } from "react";
import { Palette, Plus } from "lucide-react";

import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import ColorDialog from "@/AdminDashboard/components/ColorDialog";
import DashListToolbar from "@/AdminDashboard/components/DashListToolbar";
import { usePageSize } from "@/AdminDashboard/lib/usePageSize";
import DashTable from "@/AdminDashboard/components/DashTable";
import { familyOptionsFrom } from "@/AdminDashboard/lib/catalogOptions";
import { colorUsage, createColor, deleteColor, getStaffColors, updateColor } from "@/services/catalog/colorsApi";
import { getTaxonomy } from "@/services/catalog/navigationApi";
import { buildColourColumns } from "./coloursColumns";

export default function ColoursPanel() {
  const { toast } = useToast();
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision((n) => n + 1);

  const { data: colors, loading } = useAsyncData(getStaffColors, [revision]);
  const { data: usage } = useAsyncData(colorUsage, [revision]);
  const { data: taxonomy } = useAsyncData(getTaxonomy, []);

  const families = familyOptionsFrom(taxonomy);
  const familyById = new Map(families.map((f) => [f.id, f]));

  const [dialog, setDialog] = useState({ open: false, initial: null, n: 0 });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = usePageSize("colours");

  const open = (initial) => setDialog((d) => ({ open: true, initial, n: d.n + 1 }));
  const close = () => setDialog((d) => ({ ...d, open: false }));

  const save = async (form) => {
    const editing = dialog.initial;
    const saved = editing ? await updateColor(editing.id, form) : await createColor(form);
    close();
    refresh();
    toast(
      editing ? `${saved.name} saved. Every product in this colour shows the change.` : `${saved.name} added.`,
      "success",
    );
  };

  const askDelete = (color) => {
    const count = usage?.[color.id] ?? 0;
    if (count > 0) {
      toast(
        `${color.name} is on ${count} ${count === 1 ? "product" : "products"}. Remove it from them before deleting.`,
        "error",
      );
      return;
    }
    setPendingDelete(color);
  };

  const confirmDelete = async () => {
    const color = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteColor(color.id);
      refresh();
      toast(`${color.name} deleted.`, "success");
    } catch (err) {
      toast(err.message ?? "Could not delete that colour.", "error");
    }
  };

  const columns = buildColourColumns({ familyById, usage, onEdit: open, onDelete: askDelete });

  return (
    <section className="space-y-4">
      <p className="max-w-xl text-[13px] leading-relaxed text-espresso-soft">
        The colours products come in. Shoppers see the name you give each one; the shop filter
        is the plain colour they filter by, so Ebony and Jet Black both appear under Black.
      </p>

      <DashListToolbar
        actions={
          <Button icon={Plus} size="sm" onClick={() => open(null)} className="h-10">
            <span className="hidden sm:inline">Add colour</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
        query={query}
        onQueryChange={setQuery}
        placeholder="Search colours"
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      <DashTable
        columns={columns}
        data={colors ?? []}
        loading={loading}
        globalFilter={query}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        initialSorting={[{ id: "name", desc: false }]}
        unit={(colors ?? []).length === 1 ? "colour" : "colours"}
        empty={{ icon: Palette, title: "No colours yet", description: "Add the first, such as Ebony." }}
      />

      <ColorDialog key={dialog.n} open={dialog.open} initial={dialog.initial} families={families} onClose={close} onSave={save} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete ${pendingDelete?.name ?? "colour"}?`}
        description="No product uses it, so nothing in the shop changes."
        confirmLabel="Delete colour"
      />
    </section>
  );
}
