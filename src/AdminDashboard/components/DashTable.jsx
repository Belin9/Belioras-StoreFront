/* Admin Dashboard: DashTable */
import { useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import EmptyState from "../../components/ui/EmptyState";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { cn } from "../../utils/cn";
import TableHead from "./table/TableHead";
import TableBody from "./table/TableBody";
import TablePagination from "./table/TablePagination";
import { PAGE_SIZES } from "../lib/tablePaging";

/**
 * A sortable, searchable, paged table.
 *
 * `tableId` names where its rows-per-page choice is remembered; a page that
 * puts the "Show" menu in its own toolbar passes `pageSize` and
 * `onPageSizeChange` (see usePageSize) instead. `fill` makes it
 * take the rest of the page on a desktop, so the page's own toolbar stays put
 * and only the rows scroll, under a header that stays in view. The page must
 * be a column with a height for that: see the Products page.
 */
export default function DashTable({
  columns,
  data,
  loading = false,
  globalFilter = "",
  enableSelection = false,
  onSelectionChange,
  onRowClick,
  empty,
  unit = "rows",
  tableId = "all",
  pageSize: controlledSize,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZES,
  fill = false,
  paginate = true,
  initialSorting = [],
  skeletonRows = 6,
}) {
  const [sorting, setSorting] = useState(initialSorting);
  const [rowSelection, setRowSelection] = useState({});
  // A page that shows its own "Show" menu passes the size in; otherwise the
  // table keeps it, with the menu beside its pagination.
  const [ownSize, setOwnSize] = useLocalStorage(`belioras:dash:pageSize:${tableId}`, 20);
  // A short preview (Overview's recent orders) shows every row and no pagination bar.
  const pageSize = !paginate ? Math.max(1, (data ?? []).length) : onPageSizeChange ? controlledSize : ownSize;
  // The page index belongs to one page size: a new size starts at page 1.
  const [paging, setPaging] = useState({ size: pageSize, index: 0 });
  const pageIndex = paging.size === pageSize ? paging.index : 0;
  const setPageIndex = (index) => setPaging({ size: pageSize, index });

  // TanStack Table has no compiler-safe API: useReactTable() returns functions
  // the React Compiler cannot memoise, so it skips this component. That is the
  // intended behaviour here, so the notice is silenced for this call alone.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data ?? [],
    columns,
    state: { sorting, globalFilter, rowSelection, pagination: { pageIndex, pageSize } },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(next.pageIndex);
    },
    onRowSelectionChange: (updater) => {

      const next = typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(next);
      onSelectionChange?.(Object.keys(next).filter((id) => next[id]));
    },
    enableRowSelection: enableSelection,
    getRowId: (row, index) => row.id ?? String(index),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: true,
  });

  const total = table.getFilteredRowModel().rows.length;

  if (!loading && total === 0 && empty) {
    return <EmptyState {...empty} />;
  }

  return (
    <div className={cn(fill && "lg:flex lg:min-h-0 lg:flex-1 lg:flex-col")}>
      <div className={cn("overflow-x-auto border border-umber-50 bg-ivory-50", fill && "lg:min-h-0 lg:flex-1 lg:overflow-y-auto")}>
        <table className="dash-cards w-full">
          <TableHead table={table} enableSelection={enableSelection} sticky={fill} />
          <TableBody
            table={table}
            columns={columns}
            loading={loading}
            skeletonRows={skeletonRows}
            enableSelection={enableSelection}
            onRowClick={onRowClick}
          />
        </table>
      </div>

      {paginate && (
        <TablePagination
          table={table}
          total={total}
          unit={unit}
          pageSizeOptions={onPageSizeChange ? null : pageSizeOptions}
          onPageSizeChange={setOwnSize}
        />
      )}
    </div>
  );
}
