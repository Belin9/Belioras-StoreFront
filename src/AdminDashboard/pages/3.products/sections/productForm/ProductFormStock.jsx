/* Admin Dashboard Page: Products - ProductFormStock */
import { sizeLabel } from "@/AdminDashboard/lib/catalogOptions";
import { cn } from "@/utils/cn";
import { AS_SHOWN_ID } from "@/utils/productColors";
import { stockColumns } from "./productFormPayload";

const HEAD = "py-2 text-[10px] font-normal uppercase tracking-[0.18em] text-espresso-soft";

export default function ProductFormStock({ colors, colorIds, stock, onChange, sizes, taxonomy, spread, reserved = {}, register }) {
  const columns = stockColumns(sizes);
  const colorById = new Map(colors.map((c) => [c.id, c]));
  const count = (value) => Math.max(0, Math.floor(Number(value) || 0));
  const rowTotal = (id) => columns.reduce((sum, size) => sum + count(stock[id]?.[size]), 0);
  // No colour chosen: one row, kept under the hidden "As shown" colour the
  // piece is saved with, so stock per size can still be set.
  const rows = colorIds.length ? colorIds : [AS_SHOWN_ID];
  const total = rows.reduce((sum, id) => sum + rowTotal(id), 0);
  const heading = (size) => (sizes.length ? sizeLabel(taxonomy, size) : "Stock");
  const setCell = (id, size, value) => onChange({ ...stock, [id]: { ...stock[id], [size]: value } });

  return (
    <div>
      <p className="input-label">Stock</p>
      {spread && (
        <p className="mb-3 border-l-2 border-gold-500 py-1 pl-3 text-[12px] leading-relaxed text-espresso-soft">
          This piece had one stock number for everything. It has been spread across its colours and sizes so the total
          is unchanged; check each figure, then save.
        </p>
      )}

      {(
        <div className="overflow-x-auto border border-umber-50 bg-white">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-umber-50">
                <th scope="col" className={cn(HEAD, "px-3 text-left")}>Colour</th>
                {columns.map((size) => (
                  <th key={size} scope="col" className={cn(HEAD, "whitespace-nowrap px-2 text-center")}>{heading(size)}</th>
                ))}
                <th scope="col" className={cn(HEAD, "px-3 text-right")}>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((id) => {
                const color = colorById.get(id);
                const name = id === AS_SHOWN_ID ? "No colour" : (color?.name ?? id);
                return (
                  <tr key={id} className="border-b border-umber-50/70 last:border-b-0">
                    <th scope="row" className="whitespace-nowrap px-3 py-1.5 text-left font-normal text-espresso">
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden="true" className="size-3 border border-umber-100" style={{ backgroundColor: color?.hex ?? "#ccc" }} />
                        {name}
                      </span>
                    </th>
                    {columns.map((size) => (
                      <td key={size} className="px-1 py-1.5 text-center">
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          aria-label={`${name}, ${sizes.length ? sizeLabel(taxonomy, size) : "one size"}`}
                          value={stock[id]?.[size] ?? ""}
                          placeholder="0"
                          onChange={(e) => setCell(id, size, e.target.value)}
                          className={cn(
                            "h-9 w-14 border border-umber-100 bg-ivory-50 text-center tabular-nums transition-colors focus:border-espresso focus:outline-none",
                            count(stock[id]?.[size]) === 0 ? "text-espresso-soft" : "text-espresso",
                          )}
                        />
                        {/* On hand includes pieces open orders hold until they ship. */}
                        {reserved[id]?.[size] > 0 && (
                          <span className="mt-0.5 block text-[10px] text-gold-700">{reserved[id][size]} held</span>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-1.5 text-right tabular-nums text-espresso">{rowTotal(id)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-umber-50">
                <td colSpan={columns.length + 1} className="px-3 py-2 text-right text-[11px] uppercase tracking-[0.16em] text-espresso-soft">
                  In stock overall
                </td>
                <td className="px-3 py-2 text-right font-medium tabular-nums text-espresso">{total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="mt-2 text-[11px] text-espresso-soft">
        Counts are what is on the shelf; &ldquo;held&rdquo; is how many of those open orders are waiting to ship.
      </p>

      {register && (
        <label className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-espresso">
          Low-stock alert at
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Shop default"
            {...register("lowStockThreshold")}
            className="h-10 w-32 border border-umber-100 bg-ivory-50 px-3 tabular-nums focus:border-espresso focus:outline-none"
          />
          <span className="text-[12px] text-espresso-soft">or fewer left. Leave blank to use the shop-wide number.</span>
        </label>
      )}
    </div>
  );
}
