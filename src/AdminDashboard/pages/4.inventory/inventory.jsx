/* Admin Dashboard Page: Inventory - inventory */
import { useCallback, useMemo, useState } from "react";
import { Boxes } from "lucide-react";

import { useStaffAuth } from "@/context/auth/useAuthRealm";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getStaffCategories } from "@/services/catalog/categoriesApi";
import { getInventory, getLowStockThreshold } from "@/services/catalog/inventory/inventoryApi";
import { getTaxonomy } from "@/services/catalog/navigationApi";
import DashTable from "../../components/DashTable";
import { downloadCsv, toCsv } from "../../lib/csv";
import { usePageSize } from "../../lib/usePageSize";
import InventoryAdjustDialog from "./sections/InventoryAdjustDialog";
import InventoryHistoryDialog from "./sections/InventoryHistoryDialog";
import InventoryReceiveDialog from "./sections/InventoryReceiveDialog";
import InventorySummary from "./sections/InventorySummary";
import InventoryThreshold from "./sections/InventoryThreshold";
import { csvColumns, inventorySummary } from "./sections/inventoryRows";
import { buildInventoryColumns } from "./sections/inventoryTable/inventoryTableColumns";
import InventoryToolbar from "./sections/inventoryTable/InventoryToolbar";
import { useInventoryList } from "./sections/useInventoryList";

/**
 * Stock, one row per piece in each colour and size: what is on the shelf,
 * what open orders hold, and what is left to sell. Products is for what a
 * piece is; this is for how many there are.
 */
export default function DashInventory() {
  const { user } = useStaffAuth();
  const { format } = useCurrency();
  const { locale } = useLanguage();
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((n) => n + 1), []);

  const { data: rows, loading } = useAsyncData(getInventory, [revision]);
  const { data: threshold } = useAsyncData(getLowStockThreshold, [revision]);
  const { data: categories } = useAsyncData(getStaffCategories, []);
  const { data: taxonomy } = useAsyncData(getTaxonomy, []);
  const [pageSize, setPageSize] = usePageSize("inventory");
  const [adjusting, setAdjusting] = useState(null);
  const [history, setHistory] = useState(null);
  const [selected, setSelected] = useState([]);
  const [receiving, setReceiving] = useState(false);
  // Remounts the table after a bulk receive, so its row selection clears too.
  const [tableKey, setTableKey] = useState(0);

  const all = useMemo(() => rows ?? [], [rows]);
  const list = useInventoryList(all, { categories, taxonomy });
  const summary = useMemo(() => inventorySummary(all), [all]);
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }), [locale]);
  const columns = useMemo(
    () => buildInventoryColumns({ taxonomy, onAdjust: setAdjusting, onHistory: setHistory, by: user?.name, onSaved: refresh }),
    [taxonomy, user?.name, refresh],
  );

  const clearSelection = () => {
    setSelected([]);
    setTableKey((k) => k + 1);
  };

  return (
    <div className="space-y-5 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      <div className="shrink-0 space-y-2">
        <InventorySummary summary={summary} format={format} loading={loading} />
        {threshold != null && <InventoryThreshold key={threshold} value={threshold} onSaved={refresh} />}
      </div>

      <InventoryToolbar
        list={list}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        selected={selected.length}
        onReceive={() => setReceiving(true)}
        onClearSelection={clearSelection}
        onExport={() => downloadCsv(toCsv(csvColumns(taxonomy), list.visible), "belioras-inventory.csv")}
      />

      <DashTable
        key={tableKey}
        columns={columns}
        data={list.visible}
        loading={loading}
        globalFilter={list.query}
        initialSorting={[{ id: "available", desc: false }]}
        enableSelection
        onSelectionChange={setSelected}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        fill
        unit={list.visible.length === 1 ? "variant" : "variants"}
        empty={{
          icon: Boxes,
          title: list.filtering ? "Nothing matches" : "No stock recorded yet",
          description: list.filtering ? "Try a different search, or clear the filters." : "Pieces appear here once they are added under Products.",
        }}
      />

      <InventoryAdjustDialog
        key={`adjust-${adjusting?.id ?? "closed"}`}
        row={adjusting}
        taxonomy={taxonomy}
        by={user?.name}
        onClose={() => setAdjusting(null)}
        onSaved={() => {
          setAdjusting(null);
          refresh();
        }}
      />
      <InventoryHistoryDialog key={`history-${history?.id ?? "closed"}`} row={history} taxonomy={taxonomy} dateFmt={dateFmt} onClose={() => setHistory(null)} />
      <InventoryReceiveDialog
        key={receiving ? "open" : "closed"}
        open={receiving}
        ids={selected}
        by={user?.name}
        onClose={() => setReceiving(false)}
        onSaved={() => {
          setReceiving(false);
          clearSelection();
          refresh();
        }}
      />
    </div>
  );
}
