/* Admin Dashboard Page: Products - ProductsViewModal */
import { useState } from "react";
import { ArrowUpRight, Pencil } from "lucide-react";

import Modal from "@/components/common/Modal";
import Button from "@/components/ui/Button";
import StatusChip from "@/components/ui/StatusChip";
import { sizeLabel } from "@/AdminDashboard/lib/catalogOptions";
import { cn } from "@/utils/cn";
import { filedUnderNames } from "@/utils/productFiling";

const LABEL = "text-[10px] font-semibold uppercase tracking-[0.2em] text-espresso-soft";

/**
 * A piece as the shop has it: its photos per colour, price, stock per colour
 * and size, and its details. Read from the live catalogue row, so it is never
 * a stale copy. Remount per product with a `key`.
 */
export default function ViewProductModal({ product, onClose, onEdit, format, categories = [], taxonomy = {} }) {
  const [colorIndex, setColorIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);

  const ways = product?.colorways ?? [];
  const way = ways[colorIndex];
  const photos = way?.images?.length ? way.images : (product?.images ?? []);
  const category = categories.find((c) => c.id === product?.collectionId);
  // The Subcategory types it is tagged with, by name ("Clutch Bags, Evening Dresses").
  const filed = filedUnderNames(product ?? {}, categories).slice(1).join(", ");
  const sizes = (product?.sizes ?? []).filter((s) => s && s !== "one-size" && s !== "default");
  const columns = sizes.length ? sizes : ["one-size"];
  const tracked = ways.some((w) => w.stock && Object.keys(w.stock).length);
  const off = product?.originalPrice > product?.price ? Math.round((1 - product.price / product.originalPrice) * 100) : null;

  return (
    <Modal open={Boolean(product)} onClose={onClose} title={product?.name ?? "Product"} width="max-w-3xl">
      {product && (
        <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
          <div className="space-y-3">
            {photos[photoIndex] ? (
              <img src={photos[photoIndex]} alt={`${product.name}${way ? ` in ${way.name}` : ""}`} className="aspect-[3/4] w-full border border-umber-50 object-cover" />
            ) : (
              <div className="flex aspect-[3/4] w-full items-center justify-center border border-dashed border-umber-100 text-[12px] text-espresso-soft">No photos yet</div>
            )}
            {photos.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {photos.map((src, i) => (
                  <button key={src + i} type="button" onClick={() => setPhotoIndex(i)} aria-label={`Show photo ${i + 1}`} aria-pressed={i === photoIndex} className={cn("w-11 border", i === photoIndex ? "border-espresso" : "border-transparent opacity-60 hover:opacity-100")}>
                    <img src={src} alt="" className="aspect-[3/4] w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {ways.length > 0 && (
              <div role="radiogroup" aria-label="Colour" className="flex flex-wrap gap-1.5">
                {ways.map((w, i) => (
                  <button key={w.colorId} type="button" role="radio" aria-checked={i === colorIndex} onClick={() => { setColorIndex(i); setPhotoIndex(0); }} className={cn("inline-flex min-h-8 items-center gap-1.5 border px-2 text-[11px]", i === colorIndex ? "border-espresso text-espresso" : "border-umber-100 text-espresso-soft hover:text-espresso")}>
                    <span aria-hidden="true" className="size-2.5 border border-umber-100" style={{ backgroundColor: w.hex ?? "#ccc" }} />
                    {w.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status={product.status} kind="product" />
              {product.isNew && <span className="bg-gold-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-800">New arrival</span>}
              {product.featured && <span className="bg-brown-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brown-700">Featured</span>}
            </div>

            <div className="grid grid-cols-2 gap-4 border-y border-umber-50 py-4">
              <div>
                <p className={LABEL}>Price</p>
                <p className="mt-1 font-display text-2xl tabular-nums text-espresso">{format(product.price)}</p>
                {off !== null && <p className="text-[12px] text-espresso-soft"><span className="line-through">{format(product.originalPrice)}</span> · {off}% off</p>}
              </div>
              <div>
                <p className={LABEL}>Category</p>
                <p className="mt-1 text-[14px] text-espresso">{category?.name ?? product.collectionId ?? "—"}{filed && ` › ${filed}`}</p>
              </div>
            </div>

            <div>
              <p className={cn(LABEL, "mb-2")}>Stock · {product.stock} in total</p>
              {tracked ? (
                <div className="overflow-x-auto border border-umber-50">
                  <table className="w-full text-[12px] tabular-nums">
                    <thead>
                      <tr className="border-b border-umber-50 text-espresso-soft">
                        <th scope="col" className="px-3 py-2 text-left font-normal">Colour</th>
                        {columns.map((s) => <th key={s} scope="col" className="px-2 py-2 text-center font-normal">{sizes.length ? sizeLabel(taxonomy, s) : "Stock"}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {ways.map((w) => (
                        <tr key={w.colorId} className="border-b border-umber-50/70 last:border-b-0">
                          <th scope="row" className="whitespace-nowrap px-3 py-2 text-left font-normal text-espresso">{w.name}</th>
                          {columns.map((s) => {
                            const n = Number(w.stock?.[s]) || 0;
                            return <td key={s} className={cn("px-2 py-2 text-center", n === 0 ? "text-error" : "text-espresso")}>{n}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[13px] text-espresso-soft">Not yet set per colour and size. Edit the piece to set it.</p>
              )}
            </div>

            {product.description && (
              <div>
                <p className={cn(LABEL, "mb-1.5")}>Description</p>
                <p className="text-[14px] leading-relaxed text-espresso">{product.description}</p>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 border-t border-umber-50 pt-4">
              <Button variant="ghost" icon={ArrowUpRight} iconRight to={`/product/${product.slug}`} target="_blank" rel="noreferrer">View in shop</Button>
              <Button icon={Pencil} onClick={() => onEdit(product)} className="bg-espresso text-ivory-50 hover:bg-espresso-600">Edit piece</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
