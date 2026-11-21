/* Buy Panel */
import { useRef, useState } from "react";

import Modal from "../../../../components/common/Modal";
import SizeChart from "../../../../components/storefront/sizeChart/SizeChart";
import { sizeChartLabelFor } from "../../../../components/storefront/sizeChart/sizeChartKind";
import ProductBuyPanelVariants from "./ProductBuyPanelVariants";
import ProductBuyPanelActions from "./ProductBuyPanelActions";
import ProductPageAccordions from "../ProductPageAccordions";
import ProductModelCard from "../ProductModelCard";
import { useProductPurchase } from "./useProductPurchase";
import ProductMobileAddBar from "./ProductMobileAddBar";

export default function ProductBuyPanel({ product, color, onColorChange, images }) {
  const buy = useProductPurchase({ product, color, onColorChange, images });
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const sizesRef = useRef(null);
  const actionsRef = useRef(null);

  return (
    <>
      <div ref={sizesRef}>
      <ProductBuyPanelVariants
        product={product}
        taxonomy={buy.taxonomy}
        color={color}
        onColorChange={buy.changeColor}
        size={buy.size}
        onSizeChange={buy.chooseSize}
        sizeError={buy.sizeError}
        needsSize={buy.needsSize}
        unavailable={buy.unavailable}
        chartKind={buy.chartKind}
        onOpenChart={() => setSizeGuideOpen(true)}
      />
      </div>

      <div ref={actionsRef}>

      <ProductBuyPanelActions
        product={product}
        qty={buy.qty}
        onQtyChange={buy.setQty}
        maxQty={buy.available}
        onAdd={buy.handleAdd}
        added={buy.added}
        soldOut={buy.soldOut}
        saved={buy.saved}
        onToggleSaved={buy.toggleSaved}
      />
      </div>

      <ProductMobileAddBar
        product={product}
        size={buy.size}
        needsSize={buy.needsSize}
        soldOut={buy.soldOut}
        added={buy.added}
        onAdd={buy.handleAdd}
        watch={actionsRef}
        sizesRef={sizesRef}
      />

      <ProductPageAccordions product={product} />
      <ProductModelCard product={product} taxonomy={buy.taxonomy} />

      <Modal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        title={sizeChartLabelFor(buy.chartKind)}
        // max-w-lg cuts the international table off; this holds six columns
        // and the measuring figure without scrolling sideways.
        width="max-w-2xl"
      >
        <SizeChart kind={buy.chartKind ?? "garment"} />
      </Modal>
    </>
  );
}
