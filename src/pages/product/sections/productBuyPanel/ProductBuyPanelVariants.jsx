/* Colour And Size Pickers */
import { useLanguage } from "../../../../context/LanguageContext";
import { isAsShown } from "../../../../utils/productColors";
import { sizeChartLabelFor } from "../../../../components/storefront/sizeChart/sizeChartKind";
import { sizeLabel } from "../../../../utils/sizeLabel";
import ProductBuyPanelColors from "./ProductBuyPanelColors";
import ProductBuyPanelSizes from "./ProductBuyPanelSizes";
import { useUsualSize } from "./useUsualSize";
import { useAsyncData } from "../../../../hooks/useAsyncData";
import { getModels } from "../../../../services/catalog/modelsApi";

export default function ProductBuyPanelVariants({
  product,
  taxonomy,
  color,
  onColorChange,
  size,
  onSizeChange,
  sizeError,
  needsSize,
  unavailable,
  chartKind,
  onOpenChart,
}) {
  const { t } = useLanguage();
  const usualSize = useUsualSize(product);
  const { data: models } = useAsyncData(getModels, []);
  const model = (models ?? []).find((m) => m.id === product.modelFit?.modelId);

  return (
    <>
      {/* A piece saved without a colour ("As shown") has nothing to choose. */}
      {product.colors?.some((c) => !isAsShown(c)) && (
        <div className="mt-8">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-espresso">
            {t("pdp.selectColour", "Select colour")}
            {color && (
              <span className="ml-2 font-medium normal-case tracking-normal text-espresso">
                {color}
              </span>
            )}
          </p>
          <ProductBuyPanelColors
            options={product.colors}
            swatches={product.swatches}
            value={color}
            onChange={onColorChange}
          />
        </div>
      )}

      {needsSize && (
        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-espresso">
              {t("pdp.selectSize", "Select size")}
            </p>
            {chartKind && (
              <button
                type="button"
                onClick={onOpenChart}
                className="text-[11px] uppercase tracking-widest text-gold-600 underline underline-offset-4 transition-colors hover:text-gold-700"
              >
                {sizeChartLabelFor(chartKind)}
              </button>
            )}
          </div>
          <ProductBuyPanelSizes
            options={product.sizes}
            taxonomy={taxonomy}
            value={size}
            onChange={onSizeChange}
            unavailable={unavailable}
          />

          {model && product.modelFit?.size && (
            <p className="mt-3 text-[12px] text-espresso-soft">
              {model.name} is {model.heightCm} cm tall and wears size{" "}
              <strong className="font-medium text-espresso">{sizeLabel(taxonomy, product.modelFit.size)}</strong>.
            </p>
          )}

          {/* What they took last time, from their own orders. Only shown when
              this piece is actually offered in that size. */}
          {usualSize && !size && (
            <button
              type="button"
              onClick={() => onSizeChange(usualSize)}
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-[11px] text-espresso-soft transition-colors hover:text-espresso lg:min-h-0"
            >
              You usually take
              <span className="font-semibold uppercase text-espresso">
                {sizeLabel(taxonomy, usualSize)}
              </span>
              <span className="text-gold-700 underline underline-offset-4">select</span>
            </button>
          )}
          {sizeError && (
            <p className="mt-2 text-xs text-error" role="alert">
              {sizeError}
            </p>
          )}
        </div>
      )}

      {/* One-size pieces (hair) have no size block; their guide is the
          Length & Texture Guide row under Add to bag. */}
    </>
  );
}
