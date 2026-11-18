/* Context: ProductDraftContext
 *
 * The context object and its hook. The value comes from ProductDraftProvider
 * (ProductDraftProvider.jsx); they live apart so fast refresh can keep the
 * provider's state while either file is edited.
 */
import { createContext, useContext } from "react";

export const ProductDraftContext = createContext(null);

export function useProductDraft() {

  const ctx = useContext(ProductDraftContext);
  if (!ctx) throw new Error("useProductDraft must be used within ProductDraftProvider");
  return ctx;
}
