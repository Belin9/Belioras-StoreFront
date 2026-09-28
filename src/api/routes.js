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
  },
};

/**
 * Resolves an auth leaf to its boundary path, e.g.
 * `authPath(routes.auth.login, "staff")` -> `admin/auth/login`.
 */
export function authPath(name, realm) {
  const boundary = BOUNDARY[realm] ?? BOUNDARY.customer;
  return `${boundary}/${name}`;
}
