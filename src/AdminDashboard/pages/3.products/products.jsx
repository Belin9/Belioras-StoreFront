/* Admin Dashboard Page: Products - products */
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";

import { useCurrency } from "../../../context/CurrencyContext";
import { useToast } from "../../../context/ToastContext";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { getStaffCategories } from "../../../services/catalog/categoriesApi";
import { getStaffColors } from "../../../services/catalog/colorsApi";
import { usePageSize } from "../../lib/usePageSize";
import { useProductsList } from "./sections/productsTable/useProductsList";
import { getTaxonomy } from "../../../services/catalog/navigationApi";
import {
  deleteProduct,
  getAllProducts,
  restoreProduct,
  updateProduct,
} from "../../../services/catalog/productsApi";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import DashTable from "../../components/DashTable";
import ProductsToolbar from "./sections/productsTable/ProductsTableToolbar";
import ViewProductModal from "./sections/productsTable/ProductsViewModal";
import { buildProductColumns } from "./sections/productsTable/productsTableColumns";
import { emptyState, toRows } from "./sections/productsTable/productsTableRows";
import BulkActionsBar from "./sections/productsTable/ProductsTableBulkActions";
import DeleteProductDialog from "./sections/productsTable/ProductsDeleteDialog";

export default function DashProducts() {

  const navigate = useNavigate();
  const { toast } = useToast();
  const { format } = useCurrency();

  // Bumped after every write so useAsyncData re-runs against the store.
  const [revision, setRevision] = useState(0);

  const refresh = useCallback(() => setRevision((n) => n + 1), []);

  const { data: products, loading } = useAsyncData(getAllProducts, [revision]);
  const { data: categories } = useAsyncData(getStaffCategories, []);
  const { data: taxonomy } = useAsyncData(getTaxonomy, []);
  const [viewing, setViewing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: colors } = useAsyncData(getStaffColors, []);

  const rows = useMemo(() => toRows(products, categories), [products, categories]);
  const list = useProductsList(rows, { categories, colors, format });
  const [pageSize, setPageSize] = usePageSize("products");

  const confirmDelete = async () => {

    const product = pendingDelete;
    setPendingDelete(null);
    try {

      const removed = await deleteProduct(product.id);
      refresh();
      // Undo rather than a second confirmation: the dialog already asked, and
      // an admin who deletes the wrong row wants it back, not a lecture.
      toast(`${removed.name} deleted.`, {
        type: "success",
        action: {
          label: "Undo",
          onClick: async () => {
            await restoreProduct(removed);
            refresh();
            toast(`${removed.name} restored.`, "success");
          },
        },
      });
    } catch (err) {
      toast(err.message ?? "Could not delete that product.", "error");
    }
  };

  const bulkSetStatus = async (status) => {

    const ids = [...selectedIds];
    setSelectedIds([]);
    try {
      await Promise.all(ids.map((id) => updateProduct(id, { status })));
      refresh();
      toast(`${ids.length} ${ids.length === 1 ? "piece" : "pieces"} set to ${status}.`, "success");
    } catch (err) {
      toast(err.message ?? "Could not update those products.", "error");
    }
  };

  const showStatus = rows.some((p) => p.status !== "active");

  const [askBulkDelete, setAskBulkDelete] = useState(false);
  const bulkDelete = async () => {
    setAskBulkDelete(false);
    const ids = [...selectedIds];
    setSelectedIds([]);
    try {
      const removed = await Promise.all(ids.map((id) => deleteProduct(id)));
      refresh();
      toast(`${removed.length} ${removed.length === 1 ? "piece" : "pieces"} deleted.`, {
        type: "success",
        action: {
          label: "Undo",
          onClick: async () => {
            await Promise.all(removed.map((r) => restoreProduct(r)));
            refresh();
            toast(`${removed.length} restored.`, "success");
          },
        },
      });
    } catch (err) {
      toast(err.message ?? "Could not delete those products.", "error");
    }
  };

  const columns = useMemo(
    () =>
      buildProductColumns({
        format,
        onView: setViewing,
        onEdit: (p) => navigate(`/dashboard/products/${p.id}/edit`),
        onDelete: setPendingDelete,
        showStatus,
      }),
    [format, navigate, showStatus],
  );

  return (
    // A column the height of the page on a desktop: the toolbar stays, the rows scroll.
    <div className="space-y-5 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      <ProductsToolbar
        query={list.query}
        onQueryChange={list.setQuery}
        tabs={list.tabs}
        status={list.status}
        onStatusChange={list.setStatus}
        groups={list.groups}
        filters={list.filters}
        onFiltersChange={list.setFilters}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      <BulkActionsBar
        count={selectedIds.length}
        onSetStatus={bulkSetStatus}
        onDelete={() => setAskBulkDelete(true)}
        onClear={() => setSelectedIds([])}
      />

      <DashTable
        columns={columns}
        data={list.visible}
        loading={loading}
        globalFilter={list.query}
        initialSorting={[{ id: "name", desc: false }]}
        enableSelection
        onSelectionChange={setSelectedIds}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        fill
        unit={list.visible.length === 1 ? "piece" : "pieces"}
        empty={{ icon: Package, ...emptyState(list.filtering) }}
      />

      <ConfirmDialog
        open={askBulkDelete}
        onClose={() => setAskBulkDelete(false)}
        onConfirm={bulkDelete}
        title={`Delete ${selectedIds.length} ${selectedIds.length === 1 ? "piece" : "pieces"}?`}
        description="They are removed from the storefront immediately. You can undo this from the message that follows."
        confirmLabel="Delete"
      />

      {/* Looked up in the live rows by id, so it shows the piece as it is now. */}
      <ViewProductModal key={viewing?.id ?? "none"} product={rows.find((p) => p.id === viewing?.id) ?? null}
        onClose={() => setViewing(null)} onEdit={(p) => navigate(`/dashboard/products/${p.id}/edit`)}
        format={format} categories={categories ?? []} taxonomy={taxonomy ?? {}} />

      <DeleteProductDialog product={pendingDelete} format={format} onClose={() => setPendingDelete(null)} onConfirm={confirmDelete} />
    </div>
  );
}
