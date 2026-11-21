/* Admin Dashboard Page: Products - productsTableColumns */
import { Copy, Eye, Package, Pencil, Trash2 } from "lucide-react";

import StatusChip from "../../../../../components/ui/StatusChip";
import { cn } from "../../../../../utils/cn";
import { STOCK_LEVELS } from "../../../../../utils/stockLevel";
import IconAction from "../../../../components/IconAction";

const LEVEL_TONE = { in: "", low: "font-medium text-warning", out: "font-medium text-error" };

/** "BEL-BF01 · 3 colours · 5 sizes" — what the admin needs to tell pieces apart, not the address. */
function variantSummary(product) {
  const colours = product.colors?.length ?? 0;
  const sizes = (product.sizes ?? []).filter((s) => s && s !== "one-size" && s !== "default").length;
  return [
    product.sku,
    colours ? `${colours} ${colours === 1 ? "colour" : "colours"}` : null,
    sizes ? `${sizes} ${sizes === 1 ? "size" : "sizes"}` : "One size",
  ].filter(Boolean).join(" · ");
}

export function buildProductColumns({ format, onView, onEdit, onDuplicate, onDelete, showStatus = true }) {
  const columns = [
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.images?.[0] ? (
            <img
              src={row.original.images[0]}
              alt=""
              loading="lazy"
              className="size-10 shrink-0 border border-umber-50 object-cover"
            />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center border border-umber-50 text-espresso/30">
              <Package className="size-4" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-espresso">{row.original.name}</p>
            <p className="truncate text-[11px] text-espresso-soft">{variantSummary(row.original)}</p>
          </div>
        </div>
      ),
    },
    { accessorKey: "category", header: "Category" },
    {
      accessorKey: "price",
      header: "Price",
      meta: { align: "right" },
      cell: ({ getValue }) => <span className="tabular-nums">{format(getValue())}</span>,
    },
    {
      accessorKey: "stock",
      header: "Stock",
      meta: { align: "right" },
      // Coloured by the same low-stock rule Inventory and the filters use.
      cell: ({ row, getValue }) => (
        <span className="inline-flex items-center justify-end gap-2">
          {row.original.level === "low" && (
            <span className="bg-gold-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-gold-800">Low stock</span>
          )}
          <span className={cn("tabular-nums", LEVEL_TONE[row.original.level])} title={STOCK_LEVELS[row.original.level]?.label}>
            {getValue()}
          </span>
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => <StatusChip status={getValue()} kind="product" />,
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      meta: { align: "right" },
      cell: ({ row }) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <IconAction label={`View ${row.original.name}`} icon={Eye} onClick={() => onView(row.original)} />
          <IconAction label={`Edit ${row.original.name}`} icon={Pencil} onClick={() => onEdit(row.original)} />
          {onDuplicate && <IconAction label={`Duplicate ${row.original.name}`} icon={Copy} onClick={() => onDuplicate(row.original)} />}
          <IconAction
            label={`Delete ${row.original.name}`}
            icon={Trash2}
            destructive
            onClick={() => onDelete(row.original)}
          />
        </div>
      ),
    },
  ];
  // While every piece is live the column says nothing; it returns with the first draft or sell-out.
  return showStatus ? columns : columns.filter((c) => c.accessorKey !== "status");
}
