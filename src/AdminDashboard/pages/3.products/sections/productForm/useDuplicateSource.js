import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAsyncData } from "@/hooks/useAsyncData";
import { getProduct } from "@/services/catalog/productsApi";
import { detailTags, offeredSizes, toFormModel, toFormValues } from "./productFormPayload";

/**
 * "Duplicate" on the products list opens a new piece pre-filled from another:
 * the same photos, colours, sizes and details, named "… (copy)", as a draft,
 * with no SKU and no stock (a copy has none on the shelf yet). The address
 * state is cleared once it is applied, so a reload keeps the draft instead
 * of copying again.
 */
export function useDuplicateSource({ isEdit, reset, setPhotos, setVideos, setColorIds, setStock, setSizes, setTags }) {
  const location = useLocation();
  const navigate = useNavigate();
  const sourceId = !isEdit ? location.state?.duplicateOf : null;
  const { data: source } = useAsyncData(() => (sourceId ? getProduct(sourceId, { includeDrafts: true }) : Promise.resolve(null)), [sourceId]);

  /* Side Effect */
  useEffect(() => {
    if (!source) return;
    reset({ ...toFormValues(source), name: `${source.name} (copy)`, sku: "", status: "draft", lowStockThreshold: source.lowStockThreshold ?? "" });
    const model = toFormModel(source);
    setPhotos(model.photos);
    setVideos(model.videos);
    setColorIds(model.colorIds);
    setStock(Object.fromEntries(Object.entries(model.stock).map(([c, sizes]) => [c, Object.fromEntries(Object.keys(sizes).map((s) => [s, 0]))])));
    setSizes(offeredSizes(source.sizes));
    setTags(detailTags(source.tags));
    navigate(location.pathname, { replace: true, state: null });
    // Runs once per source; the setters and navigate are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);
}
