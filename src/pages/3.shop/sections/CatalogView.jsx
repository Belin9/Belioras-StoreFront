/* Page: Shop - CatalogView */
import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import { useAsyncData } from "../../../hooks/useAsyncData";
import { useContentVersion } from "../../../context/ContentContext";
import { useFilterParams } from "../../../hooks/useFilterParams";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { getCategories } from "../../../services/catalog/categoriesApi";
import { getColors } from "../../../services/catalog/colorsApi";
import { getModels } from "../../../services/catalog/modelsApi";
import { getTaxonomy } from "../../../services/catalog/navigationApi";
import { applyFilters, computeFacets, priceBounds } from "../../../utils/faceting";
import { catalogueDimensions } from "../../../utils/typeFacet";
import { sortProducts } from "../../../utils/catalogSort";
import { isAsShown } from "../../../utils/productColors";
import { DEFAULT_COLUMNS, isValidColumns } from "../../../utils/gridColumns";
import GridViewSwitcher from "../../../components/storefront/GridViewSwitcher";

import ActiveFilters from "./ActiveFilters";
import FilterPanel from "./FilterPanel";
import ProductGrid from "./ProductGrid";
import ShopHeader from "./ShopHeader";
import CatalogSortControl from "./CatalogSortControl";

export default function CatalogView({ products, loading, error, header = {}, emptyState = null }) {

  const list = useMemo(() => products ?? [], [products]);

  const version = useContentVersion();
  const { data: taxonomy } = useAsyncData(getTaxonomy, [version]);
  const { data: categories } = useAsyncData(getCategories, [version]);
  const { data: models } = useAsyncData(getModels, [version]);
  const { data: colours } = useAsyncData(getColors, [version]);
  const { filters, activeCount, toggleValue, clearDimension, setPrice, setSale, setSort, setQuery, clearAll } =
    useFilterParams();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [storedCols, setCols] = useLocalStorage("belioras:gridColumns", DEFAULT_COLUMNS);

  const cols = isValidColumns(storedCols) ? storedCols : DEFAULT_COLUMNS;

  const bounds = useMemo(() => priceBounds(list), [list]);

  // Category, Subcategory and Type filters come from the categories the page's
  // products belong to; size from the shared taxonomy. Colour lists the colours
  // added in the dashboard, and computeFacets keeps only those on these pieces.
  const selectedCategories = filters.dimensions.category;
  const facets = useMemo(() => {
    if (!taxonomy || !categories) return {};
    const { dimensions, order } = catalogueDimensions(categories, list, selectedCategories);
    // "Worn by": the model in the photographs — where "Shop this edit" lands.
    const model = { label: "Worn by", values: (models ?? []).map((m) => ({ id: m.id, name: m.name })) };
    const shade = {
      label: "Colour",
      values: (colours ?? []).filter((c) => !isAsShown(c.id)).map((c) => ({ id: c.id, name: c.name, hex: c.hex })),
    };
    const merged = { ...dimensions, shade, size: taxonomy.size, model };
    return computeFacets(list, merged, filters, [...order, "shade", "size", "model"]);
  }, [list, taxonomy, categories, models, colours, filters, selectedCategories]);

  // Unticking a Category also drops the Subcategory choices made inside it,
  // which would otherwise linger in the address with nothing to show them.
  const toggle = (dimension, value) => {
    const leaving = dimension === "category" && (selectedCategories ?? []).includes(value);
    if (leaving) {
      for (const sub of categories?.find((c) => c.id === value)?.subcategories ?? []) clearDimension(`subcat:${sub.id}`);
    }
    toggleValue(dimension, value);
  };

  const searchActive = Boolean(filters.query);

  const filtered = useMemo(
    () => sortProducts(applyFilters(list, filters), filters.sort),
    [list, filters],
  );

  // A route with no stock at all is a different situation from filters that
  // exclude everything, and reads badly if both say the same thing.
  const routeIsEmpty = !loading && !error && list.length === 0;

  const panelProps = {
    facets,
    filters,
    priceBounds: bounds,
    activeCount,
    onToggle: toggle,
    onPriceChange: (value) => setPrice(value, bounds),
    onSaleChange: setSale,
    onClearAll: clearAll,
  };

  return (
    <div className="min-h-screen bg-ivory-50">
      <ShopHeader {...header} />

      <FilterPanel
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        resultCount={filtered.length}
        {...panelProps}
      />

      {routeIsEmpty && emptyState ? (
        emptyState
      ) : (
        <div className="mx-auto max-w-[87.5rem] px-6 pb-24 pt-8 md:px-10">
          <div className="min-w-0">
              {/* The inner group could not wrap, so at 390px it overflowed a
                  342px row and justify-end pushed the sort control off the
                  LEFT edge — invisible to a scrollWidth check, since negative
                  overflow does not grow the page. The select now flexes and
                  the density switcher is pushed right. */}
              <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
                <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-4">
                  <CatalogSortControl value={filters.sort} onChange={setSort} />

                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={drawerOpen}
                    className="relative inline-flex min-h-11 shrink-0 items-center gap-2 border border-espresso px-3 sm:px-4 lg:min-h-9 text-[11px] font-medium uppercase tracking-[0.18em] text-espresso transition-colors hover:bg-espresso hover:text-ivory-50"
                  >
                    <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                    Filter
                    {activeCount > 0 && (
                      <span className="flex size-4 items-center justify-center rounded-full bg-gold-500 text-[9px] font-bold leading-none text-espresso">
                        {activeCount}
                      </span>
                    )}
                  </button>

                  <div className="ml-auto flex shrink-0 items-center sm:ml-0">
                    <GridViewSwitcher columns={cols} setColumns={setCols} />
                  </div>
                </div>
              </div>

              {(activeCount > 0 || searchActive) && (
                <div className="mb-6">
                  <ActiveFilters
                    facets={facets}
                    filters={filters}
                    onToggle={toggle}
                    onClearPrice={() => setPrice(bounds, bounds)}
                    onSaleChange={setSale}
                    onClearQuery={() => setQuery("")}
                    onClearAll={clearAll}
                  />
                </div>
              )}

              <ProductGrid
                filtered={filtered}
                cols={cols}
                loading={loading}
                error={error}
                onClearFilters={clearAll}
                hasActiveFilters={activeCount > 0}
              />
          </div>
        </div>
      )}
    </div>
  );
}
