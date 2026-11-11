/* Dashboard Routes */
import { Navigate, Route } from "react-router-dom";

import RequireAuth from "../components/auth/RequireAuth";
import {
  DashboardLayout,
  DashOverview,
  DashProducts,
  DashInventory,
  DashCategories,
  DashSizes,
  DashMegaMenu,
  DashOrders,
  DashTransactions,
  DashCustomers,
  DashDiscounts,
  DashReviews,
  DashNewsletter,
  DashHome,
  DashTeam,
  DashShipping,
  DashSettings,
  DashReports,
  DashActivity,
} from "../AdminDashboard/DashboardPages";
import ProductForm from "../AdminDashboard/pages/3.products/product-form";

export default function dashboardRoutes() {
  return (
    <>
    {/* Guarded: RequireAuth — admin area was open before guard. */}
    <Route
      path="/dashboard"
      element={
        <RequireAuth adminOnly>
          <DashboardLayout />
        </RequireAuth>
      }
    >
      <Route index element={<DashOverview />} />
      <Route path="products" element={<DashProducts />} />
      {/* Product form: page, not modal. */}
      <Route path="products/new" element={<ProductForm />} />
      <Route path="products/:id/edit" element={<ProductForm />} />
      <Route path="inventory" element={<DashInventory />} />
      <Route path="categories" element={<DashCategories />} />
      <Route path="sizes" element={<DashSizes />} />
      {/* Nav tree: shopper grouping, distinct from categories. */}
      <Route path="mega-menu" element={<DashMegaMenu />} />
      <Route path="reviews" element={<DashReviews />} />
      <Route path="orders" element={<DashOrders />} />
      {/* Each section is gated by the signed-in role in DashboardLayout. */}
      <Route path="transactions" element={<DashTransactions />} />
      {/* Staff: Users page locks them out of served records. */}
      <Route path="customers" element={<DashCustomers />} />
      <Route path="reports" element={<DashReports />} />
      <Route path="discounts" element={<DashDiscounts />} />
      <Route path="newsletter" element={<DashNewsletter />} />
      <Route path="home" element={<DashHome />} />

      {/* Access mgmt: grant control beside delivery history, enables super-admin promote. */}
      <Route path="team" element={<DashTeam />} />
      <Route path="activity" element={<DashActivity />} />

      {/* Old combined page: bookmark lands useful, not 404. */}
      <Route path="users" element={<Navigate to="/dashboard/customers" replace />} />
      <Route path="shipping" element={<DashShipping />} />
      <Route path="settings" element={<DashSettings />} />
    </Route>

    {/* Main App Routes - With navbar/footer */}
    </>
  );
}
