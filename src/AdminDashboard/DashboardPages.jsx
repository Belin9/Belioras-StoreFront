/* Dashboard Pages */

import { lazy } from "react";

/**
 * The shell stays eager; the pages inside it do not.
 *
 * `<Routes>` has to know the whole route table up front — it inspects its
 * children for `<Route>` elements and matches against them — so the table itself
 * cannot be lazily loaded. What *can* be lazy is the element each route renders,
 * which is where the actual page code lives.
 *
 * That is the split made here: `DashboardLayout` and the chrome it draws are
 * imported normally, so a signed-in admin sees the sidebar and header
 * immediately, while each page is a chunk fetched on navigation. A shopper, who
 * never opens the dashboard at all, now downloads none of it — these pages were
 * the bulk of the application.
 *
 * The chrome below stays eager on purpose. It is small, it is needed by every
 * dashboard page, and loading it lazily would mean a second round trip for
 * something the user looks at on arrival.
 */

export { default as DashboardLayout } from "./DashboardLayout";

// Pages, in sidebar order
export const DashOverview = lazy(() => import("./pages/1.overview/overview"));
export const DashProducts = lazy(() => import("./pages/3.products/products"));
export const DashInventory = lazy(() => import("./pages/4.inventory/inventory"));
export const DashCategories = lazy(() => import("./pages/5.categories/categories"));
export const DashSizes = lazy(() => import("./pages/6.sizes/sizes"));
export const DashMegaMenu = lazy(() => import("./pages/7.mega-menu/mega-menu"));
export const DashOrders = lazy(() => import("./pages/8.orders/orders"));
export const DashTransactions = lazy(() => import("./pages/9.transactions/transactions"));
export const DashDiscounts = lazy(() => import("./pages/10.discounts/discounts"));
export const DashCustomers = lazy(() => import("./pages/11.customers/customers"));
export const DashReviews = lazy(() => import("./pages/12.reviews/reviews"));
export const DashNewsletter = lazy(() => import("./pages/14.newsletter/newsletter"));
export const DashTeam = lazy(() => import("./pages/15.team/team"));
export const DashShipping = lazy(() => import("./pages/17.shipping/shipping"));
export const DashSettings = lazy(() => import("./pages/16.settings/settings"));
export const DashReports = lazy(() => import("./pages/2.reports/reports"));
export const DashActivity = lazy(() => import("./pages/18.activity/activity"));

// Chrome shared by every dashboard page
export { default as DashSidebar } from "./components/DashSidebar";
export { default as DashHeader } from "./components/DashHeader";
export { default as DashTable } from "./components/DashTable";
export { default as SalesChart } from "./components/SalesChart";
export { default as StatCard } from "./components/StatCard";
