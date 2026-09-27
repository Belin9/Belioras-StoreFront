/* Application Providers */
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { ContentProvider } from "@/context/ContentContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import CustomerAuthProvider from "@/context/CustomerAuthProvider";
import StaffAuthProvider from "@/context/StaffAuthProvider";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ProductDraftProvider } from "@/context/ProductDraftContext";
import { ToastProvider } from "@/context/ToastContext";
import ToastViewport from "@/components/ui/ToastViewport";
import { createQueryClient } from "@/utils/queryClient";

/** The cache inspector, loaded only while developing. */
function QueryDevtools() {
  // Imported lazily so the panel and its React Query internals are not part of
  // a production bundle at all.
  const [Devtools, setDevtools] = useState(null);

  /* Side Effect */
  useEffect(() => {
    import("@tanstack/react-query-devtools")
      .then((mod) => setDevtools(() => mod.ReactQueryDevtools))
      .catch(() => {
        /* Dev-only tooling; a missing panel is not worth reporting. */
      });
  }, []);

  if (!Devtools) return null;
  return <Devtools initialIsOpen={false} position="bottom-right" />;
}

// These sit above BrowserRouter on purpose, so navigating away cannot unmount
// an in-progress product draft.
export default function AppProviders({ children }) {
  // Built once per mount rather than at module scope, so the cache does not
  // outlive a remount in tests or a future server render.
  const [client] = useState(createQueryClient);

  return (
    <QueryClientProvider client={client}>
      {import.meta.env.DEV && <QueryDevtools />}
      <ContentProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <CustomerAuthProvider>
              <StaffAuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <ProductDraftProvider>
                    <ToastProvider>
                      {children}
                      {/* The render half of the toast system. Without it the
                          provider held state and ran timers while nothing was
                          drawn, so every toast() call was a silent no-op. Uses
                          no router hooks, so it is safe out here. */}
                      <ToastViewport />
                    </ToastProvider>
                  </ProductDraftProvider>
                </WishlistProvider>
              </CartProvider>
              </StaffAuthProvider>
            </CustomerAuthProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </ContentProvider>
    </QueryClientProvider>
  );
}
