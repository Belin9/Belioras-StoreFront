/* Auth Component: RequireAuth */
import { Link, Navigate, useLocation } from "react-router-dom";

import { useCustomerAuth, useStaffAuth } from "@/context/auth/useAuthRealm";
import Forbidden from "../layout/Forbidden";

export default function RequireAuth({ children, adminOnly = false, capability = null }) {
  const customer = useCustomerAuth();
  const staff = useStaffAuth();

  // Which session guards a route is the route's own question: a dashboard path
  // is answered by the staff session, a storefront path by the shopper's. Both
  // hooks run because hooks must; the choice happens after.
  const guarded = adminOnly || capability;
  const { isAuthenticated, isAdmin, can, booting } = guarded ? staff : customer;

  const location = useLocation();

  // The staff session keeps nothing in storage and rebuilds itself from the
  // refresh cookie, so on a cold start there is one request in which "signed
  // out" and "not yet known" look identical. Redirecting during that window
  // would throw a signed-in admin out of /dashboard on every refresh, so render
  // nothing and wait for the answer. A blank frame beats a sign-in page.
  if (guarded && booting) return null;

  if (!isAuthenticated) {

    const door = guarded ? "/atelier" : "/login";
    return <Navigate to={door} state={{ from: location.pathname + location.search }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Forbidden />;
  }

  if (capability && !can(capability)) {
    // Nested inside the dashboard shell, so the sidebar is still there and the
    // useful offer is the work they can do — not a link to the shop.
    return (
      <Forbidden
        standalone={false}
        title="Above your permissions"
        message={
          // Admin-tier but short of this capability means staff; the wording
          // tells them who to ask rather than leaving them stuck.
          isAdmin
            ? "Your role does not include this section. Ask a Belioras administrator if you need access to it."
            : "Your account does not have access to this section."
        }
        actions={
          <>
            <Link to="/dashboard" className="btn btn-primary btn-md">
              Back to overview
            </Link>
            <Link to="/dashboard/orders" className="btn btn-secondary btn-md">
              Go to orders
            </Link>
          </>
        }
      />
    );
  }

  return children;
}
