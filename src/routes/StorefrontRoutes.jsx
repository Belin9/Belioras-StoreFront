/* Storefront Routes */
import { Navigate, Route } from "react-router-dom";

import StorefrontLayout from "./StorefrontLayout";
import RequireAuth from "../components/auth/RequireAuth";
import SearchRedirect from "./SearchRedirect";

import HomePage from "../pages/1.home/home";
import ShopPage from "../pages/3.shop/shop";
import CatalogPage from "../pages/3.shop/CatalogPage";
import ProductPage from "../pages/product/product";
import CheckoutPage from "../pages/checkout/CheckoutPage";
import CheckoutConfirmation from "../pages/checkout/Confirmation";
import FAQPage from "../pages/FAQ/faq";
import AboutUsPage from "../pages/customer-support/about-us";
import ContactUsPage from "../pages/customer-support/contact-us";
import OrderTrackingPage from "../pages/customer-support/order-tracking";
import HairLengthGuidePage from "../pages/customer-support/hair-length-guide";
import ShoeSizeGuidePage from "../pages/customer-support/shoe-size-guide";
import PrivacyPolicyPage from "../pages/legal/privacy-policy";
import TermsOfServicePage from "../pages/legal/terms-of-service";
import CookiePolicyPage from "../pages/legal/cookie-policy";
import ImpressumPage from "../pages/legal/impressum";
import ShippingPolicyPage from "../pages/legal/shipping-policy";
import ReturnAndRefundPolicyPage from "../pages/legal/return-and-refund-policy";
import NewsletterConfirmPage from "../pages/newsletter/confirm";
import NewsletterUnsubscribePage from "../pages/newsletter/unsubscribe";
import {
  AccountLayout,
  AccountProfile,
  AccountOrders,
  AccountOrderDetail,
  AccountWishlist,
  AccountWardrobe,
  AccountAddresses,
  AccountSettings,
} from "../customerDashboard/AccountPages";

export default function storefrontRoutes() {
  return (
    <>
    <Route element={<StorefrontLayout />}>
      <Route index element={<HomePage />} />
      <Route path="/whats-new" element={<Navigate to="/new-arrivals" replace />} />
      <Route path="/shop" element={<ShopPage />} />

      <Route path="/product/:slug" element={<ProductPage />} />
      {/* One results surface — /shop already filters on ?q=; /search printed the term and no products, so redirecting keeps old links working. */}
      <Route path="/search" element={<SearchRedirect />} />
      {/* Guest checkout by design — demanding registration before a first purchase is a tried way to lose it. */}
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/checkout/confirmed/:id" element={<CheckoutConfirmation />} />

      <Route path="/faq" element={<FAQPage />} />
      <Route path="/about-us" element={<AboutUsPage />} />
      <Route path="/contact-us" element={<ContactUsPage />} />
      <Route path="/order-tracking" element={<OrderTrackingPage />} />
      <Route path="/hair-length-guide" element={<HairLengthGuidePage />} />
      <Route path="/shoe-size-guide" element={<ShoeSizeGuidePage />} />
      {/* The account tree — every page was written but none routed, so /account dumped a signed-in customer on a 404. */}
      <Route
        path="/account"
        element={
          <RequireAuth>
            <AccountLayout />
          </RequireAuth>
        }
      >
        <Route index element={<AccountProfile />} />
        <Route path="orders" element={<AccountOrders />} />
        <Route path="orders/:id" element={<AccountOrderDetail />} />
        <Route path="addresses" element={<AccountAddresses />} />
        <Route path="wishlist" element={<AccountWishlist />} />
        <Route path="wardrobe" element={<AccountWardrobe />} />
        <Route path="settings" element={<AccountSettings />} />
      </Route>

      {/* One canonical URL for saved pieces — header heart and existing bookmarks keep working. */}
      <Route path="/wishlist" element={<Navigate to="/account/wishlist" replace />} />

      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms-of-service" element={<TermsOfServicePage />} />
      <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
      <Route path="/return-and-refund-policy" element={<ReturnAndRefundPolicyPage />} />
      <Route path="/cookie-policy" element={<CookiePolicyPage />} />
      <Route path="/impressum" element={<ImpressumPage />} />

      {/* The two links newsletter emails carry. */}
      <Route path="/newsletter/confirm" element={<NewsletterConfirmPage />} />
      <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribePage />} />

      {/* Catch-all — menu pages are added in the dashboard, so their addresses
          can't be listed here; CatalogPage renders NotFound for unknown ones,
          and every specific route above still wins. */}
      <Route path="*" element={<CatalogPage />} />
    </Route>
    </>
  );
}
