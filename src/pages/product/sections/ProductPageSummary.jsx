/* Title And Price (the description is an accordion under Add to bag) */
import { Share2 } from "lucide-react";

import { useCurrency } from "../../../context/CurrencyContext";
import { useLanguage } from "../../../context/LanguageContext";
import { cn } from "../../../utils/cn";
import { useProductShare } from "./useProductShare";

const LOW_STOCK = 5;

export default function ProductPageSummary({ product }) {
  const { format } = useCurrency();
  const { t } = useLanguage();
  const share = useProductShare(product);

  const onSale = product.originalPrice && product.originalPrice > product.price;
  const lowStock = product.stock > 0 && product.stock <= LOW_STOCK;

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-display text-3xl leading-tight text-espresso md:text-4xl">
          {product.name}
        </h1>

        <button
          type="button"
          onClick={share}
          aria-label={t("pdp.share", "Share this piece")}
          title={t("pdp.share", "Share this piece")}
          className="-mr-2.5 mt-1 flex size-11 shrink-0 items-center justify-center text-espresso-soft transition-colors hover:text-espresso"
        >
          <Share2 className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <span className={cn("text-xl tabular-nums", onSale ? "text-error" : "text-espresso")}>
          {format(product.price)}
        </span>
        {onSale && (
          <span className="text-sm tabular-nums text-espresso/35 line-through">
            {format(product.originalPrice)}
          </span>
        )}
        {lowStock && (
          <span className="ml-auto text-[10px] uppercase tracking-widest text-warning">
            Only {product.stock} left
          </span>
        )}
      </div>

      {product.sku && (
        <p className="mt-2 text-xs text-espresso-soft/70">SKU: {product.sku}</p>
      )}
    </>
  );
}
