/* Page: Product */
import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { useAsyncData } from "../../hooks/useAsyncData";
import { usePreloadImages } from "../../hooks/usePreloadImages";
import { getProduct, getProductsByCollection } from "../../services/catalog/productsApi";
import { getCategories } from "../../services/catalog/categoriesApi";
import Seo from "../../components/seo/Seo";
import { SITE_URL } from "../../seo/head";
import { productSeo, titleCase } from "../../seo/seo";
import { colorFromParam, imagesForColor, videoForColor } from "../../utils/productColors";
import { rememberViewed } from "../../utils/recentlyViewed";
import RecentlyViewed from "../../components/storefront/RecentlyViewed";

import ProductPageGallery from "./sections/ProductPageGallery";
import ProductPageHeader from "./sections/ProductPageHeader";
import ProductPageSummary from "./sections/ProductPageSummary";
import ProductPageReviews from "./sections/ProductPageReviews";
import ProductPageRelated from "./sections/ProductPageRelated";
import { ProductPageLoading, ProductPageNotFound } from "./sections/ProductPageStates";
import ProductBuyPanel from "./sections/productBuyPanel/ProductBuyPanel";

const RELATED_COUNT = 4;

export default function ProductPage() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const { data: product, loading, error } = useAsyncData(() => getProduct(slug), [slug]);

  const { data: related } = useAsyncData(
    () =>
      product?.collectionId ? getProductsByCollection(product.collectionId) : Promise.resolve([]),
    [product?.collectionId],
  );

  const { data: categories } = useAsyncData(getCategories, []);

  /* Side Effect */
  useEffect(() => {
    if (product?.id) rememberViewed(product.id);
  }, [product?.id]);

  usePreloadImages(
    Object.values(product?.colorImages ?? {})
      .map((photos) => photos[0])
      .filter(Boolean),
  );

  if (loading) return <ProductPageLoading />;
  if (error || !product) return <ProductPageNotFound />;

  const categoryName = categories?.find((c) => c.id === product.collectionId)?.name;
  const seo = productSeo(SITE_URL, product, {
    // Every colour's photos: search shows whichever suits the query.
    images: [...(product.images ?? []), ...Object.values(product.colorImages ?? {}).flat()],
    available: product.stock ?? 0,
    category: product.collectionId
      ? { label: categoryName ?? titleCase(product.collectionId), url: `/${product.collectionId}` }
      : null,
    rating: product.rating,
    reviewCount: product.reviewCount,
  });

  const suggestions = (related ?? []).filter((p) => p.id !== product.id).slice(0, RELATED_COUNT);

  // The chosen colour is URL state, not component state: the gallery and the
  // buy panel both follow it, a colourway can be linked to, and replace keeps
  // swatch clicks out of the back button's history.
  const color = colorFromParam(product, params.get("color"));
  const images = imagesForColor(product, color);
  const selectColor = (next) =>
    setParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev);
        // The piece's own colour keeps the plain product link; another colour is named in it.
        if (next === product.colors?.[0]) nextParams.delete("color");
        else nextParams.set("color", next);
        return nextParams;
      },
      { replace: true },
    );

  return (
    <div
      className="mx-auto max-w-7xl px-6 pb-24"
      // Offsets by the header's measured height rather than a guessed value,
      // with a fallback for the first paint before the observer reports.
      style={{ paddingTop: "calc(var(--header-height, 138px) + 2rem)" }}
    >
      <Seo {...seo} />
      <ProductPageHeader product={product} />

      <div className="grid gap-12 lg:grid-cols-2">
      {/* Gallery thumbnail strip keyed by colour */}
        <ProductPageGallery
          key={`${product.id}:${color}`}
          images={images}
          video={videoForColor(product, color)}
          name={color ? `${product.name} in ${color}` : product.name}
        />

        <div>
          <ProductPageSummary product={product} />
      {/* Buy panel keyed by product id */}
          <ProductBuyPanel
            key={product.id}
            product={product}
            color={color}
            onColorChange={selectColor}
            images={images}
          />
        </div>
      </div>

      <ProductPageReviews product={product} />

      <ProductPageRelated products={suggestions} />

      <RecentlyViewed exclude={product.id} className="mt-24" />
    </div>
  );
}
