/* Storefront Component: RecentlyViewed */
import { useLanguage } from "../../context/LanguageContext";
import { useAsyncData } from "../../hooks/useAsyncData";
import { getProducts } from "../../services/catalog/productsApi";
import { readRecentlyViewed } from "../../utils/recentlyViewed";
import ProductCarousel from "./ProductCarousel";

/**
 * "Recently viewed": the pieces this shopper opened, newest first, as the same
 * carousel the home page uses. Pieces no longer in the shop drop out; the
 * current product is left out with `exclude`. Shows nothing until there are
 * at least two to show.
 */
export default function RecentlyViewed({ exclude, min = 2, className }) {
  const { t } = useLanguage();
  const { data } = useAsyncData(async () => {
    const ids = readRecentlyViewed().filter((id) => id !== exclude);
    if (!ids.length) return [];
    const live = new Map((await getProducts()).map((p) => [p.id, p]));
    return ids.map((id) => live.get(id)).filter(Boolean);
  }, [exclude]);

  if (!data || data.length < min) return null;
  return (
    <div className={className}>
      <ProductCarousel title={t("common.recentlyViewed", "Recently viewed")} products={data} />
    </div>
  );
}
