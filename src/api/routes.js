/* Api Route Map */

/**
 * Where each backend module mounts, agreed before the module exists so a
 * service is written against the same path the API will serve.
 *
 * The API splits by boundary: `/storefront` for customers, `/admin` for staff.
 * `routes.auth` holds the leaf names; build a full path per realm with
 * `authPath(name, realm)`. Everything absent from here is still a mock.
 */

/** The wire prefix each realm's namespace lives under. */
export const BOUNDARY = {
  customer: "storefront",
  staff: "admin",
};

export const API_NAMESPACES = {
  catalog: "catalog",
  content: "content",
  inventory: "inventory",
  pricing: "pricing",
  cart: "cart",
  checkout: "checkout",
  orders: "orders",
  payments: "payments",
  customers: "customers",
  behavior: "behavior",
  reviews: "reviews",
  media: "media",
  notifications: "notifications",
  search: "search",
  analytics: "analytics",
};

/** Live endpoints. Everything absent from here is still a mock. */
export const routes = {
  health: "health",

  auth: {
    register: "auth/register",
    login: "auth/login",
    refresh: "auth/refresh",
    logout: "auth/logout",
    logoutAll: "auth/logout-all",
    me: "auth/me",
    preferences: "auth/me/preferences",
    sessions: "auth/sessions",
    changePassword: "auth/change-password",
    staff: "auth/staff",
    // The two edits to an existing member. They are separate leaves rather than
    // one `staff/:id` with a body that may or may not carry a change, because a
    // request that arrives with nothing to do is a bug that should be visible
    // and not a silent success.
    staffRole: "auth/staff/:id/role",
    staffStatus: "auth/staff/:id/status",
  },
};

/**
 * Resolves an auth leaf to its boundary path, e.g.
 * `authPath(routes.auth.login, "staff")` -> `admin/auth/login`.
 *
 * A leaf may carry a `:id` placeholder; `authPath` fills it. It is filled here
 * rather than by the caller because an id that has not been encoded is a
 * request for a different resource — a slash in an id would otherwise send the
 * call to a route that does not exist, or worse, to one that does.
 */
export function authPath(name, realm, id) {
  const boundary = BOUNDARY[realm] ?? BOUNDARY.customer;
  return `${boundary}/${name}`.replace(":id", encodeURIComponent(id ?? ""));
}
