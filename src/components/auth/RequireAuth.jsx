/* Auth Component: RequireAuth */
import { Link, Navigate, useLocation } from "react-router-dom";

import { useCustomerAuth, useStaffAuth } from "@/context/auth/useAuthRealm";
import Forbidden from "../layout/Forbidden";

/** Where an account that still owes a password change is sent to clear it. */
const SET_PASSWORD = "/atelier/set-password";

/**
 * Shown when the session could not be established, as opposed to being absent.
 *
 * These are different problems and used to share one outcome. A refresh that
 * came back throttled, or a request that never reached the API, left the guard
 * with no user — and no user means "signed out", so a person with a perfectly
 * good cookie was sent to the sign-in page, where signing in was itself
 * throttled. Nothing they could do would have got them back.
 *
 * Here the work is one button. The cookie was never touched, so retrying is
 * genuinely all it takes.
 */
function BootProblem({ error, onRetry }) {
  const throttled = error?.status === 429;
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="font-display text-2xl tracking-wide text-espresso">
          {throttled ? "Too many attempts" : "Could not reach Belioras"}
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-espresso-soft">
          {throttled
            ? "Too many sign-in attempts came from this network in a short time, so the server asked us to wait. Your session was not ended — it only could not be read just now."
            : "We could not check your session just now. This is usually a brief network problem rather than anything to do with your account."}
        </p>
        <button type="button" onClick={onRetry} className="btn btn-primary btn-md mt-6">
          Try again
        </button>
      </div>
    </div>
  );
}

export default function RequireAuth({ children, adminOnly = false, capability = null }) {
  const customer = useCustomerAuth();
  const staff = useStaffAuth();

  // Which session guards a route is the route's own question: a dashboard path
  // is answered by the staff session, a storefront path by the shopper's. Both
  // hooks run because hooks must; the choice happens after.
  const guarded = adminOnly || capability;
  const { isAuthenticated, isAdmin, can, booting, mustChangePassword, bootError, retryBoot } = guarded
    ? staff
    : customer;

  const location = useLocation();

  // The staff session keeps nothing in storage and rebuilds itself from the
  // refresh cookie, so on a cold start there is one request in which "signed
  // out" and "not yet known" look identical. Redirecting during that window
  // would throw a signed-in admin out of /dashboard on every refresh, so render
  // nothing and wait for the answer. A blank frame beats a sign-in page.
  if (guarded && booting) return null;

  // Checked before `isAuthenticated`, because a failed start also leaves no
  // user — and this is precisely the case where that must not mean "sign in".
  if (guarded && bootError) return <BootProblem error={bootError} onRetry={retryBoot} />;

  if (!isAuthenticated) {
    const door = guarded ? "/atelier" : "/login";
    return <Navigate to={door} state={{ from: location.pathname + location.search }} replace />;
  }

  /**
   * A staff account created by an admin with a temporary password may sign in,
   * but the dashboard is not available to it until that password is replaced.
   *
   * This is a redirect rather than a `Forbidden` because the account is not
   * under-privileged — it has exactly the powers it will have in a moment. It
   * simply has not finished setting itself up, and the screen that lets it
   * finish is the useful thing to show.
   *
   * `replace` so the dashboard is not in the history to bounce back into, and
   * `state.from` so the person lands on the work they were trying to reach once
   * the rotation clears. The set-password screen reads the same `from` shape the
   * signed-out path already uses, which is why it can navigate back to a deep
   * link without inventing a second convention.
   */
  if (guarded && mustChangePassword) {
    return <Navigate to={SET_PASSWORD} state={{ from: location.pathname + location.search }} replace />;
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
