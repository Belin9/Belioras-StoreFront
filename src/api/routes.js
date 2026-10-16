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

  /**
   * The three size guides.
   *
   * `guide` carries a `:type`, and each type is its own document on the server
   * rather than a section of one blob — so a save is one request that either
   * lands whole or does not land at all.
   */
  sizeGuides: {
    list: "size-guides",
    guide: "size-guides/:type",
    reset: "size-guides/reset",
  },

  /**
   * The size list — "M", "EU 38 · UK 3 · US 5", "One Size".
   *
   * Split from `sizeGuides` on purpose. A guide is the measurement table that
   * explains what a size means; this is the list of sizes that exist. They are
   * separate resources that are allowed to disagree, and one request to a
   * combined endpoint would mean saving a size's name rewrote a guide.
   *
   * The ids in here are a public contract, not internal keys: they are keys in
   * a product's stock object and they are what a bookmarked `?size=eu38,m`
   * resolves against. So a rename is `PATCH` by id, and no leaf offers a way to
   * write one.
   */
  taxonomy: {
    sizes: "taxonomy/sizes",
    size: "taxonomy/sizes/:id",
    sizesReset: "taxonomy/sizes/reset",
    // Categories: same contract. A category id is every product's
    // `collectionId` and the `/dresses` URL, so it is only ever in the path.
    // Order is a property of the whole list and has its own edge.
    categories: "taxonomy/categories",
    category: "taxonomy/categories/:id",
    categoriesOrder: "taxonomy/categories/order",
    categoriesReset: "taxonomy/categories/reset",
    // Colours: products store colourways by colour id, so the same contract.
    colors: "taxonomy/colors",
    color: "taxonomy/colors/:id",
    colorsReset: "taxonomy/colors/reset",
  },

  /**
   * The mega menu, one tree saved whole. A save carries the version it was
   * edited from, so two editors cannot silently overwrite each other.
   */
  navigation: {
    tree: "navigation",
    reset: "navigation/reset",
  },

  /**
   * The catalogue. A product id is what order lines and the stock history point
   * at, so delete is soft and `restore` is the dashboard's Undo.
   */
  products: {
    list: "products",
    one: "products/:id",
    restore: "products/:id/restore",
  },

  /** Stock changes, history and the low-stock line. Order-driven moves have their own edge. */
  inventory: {
    adjust: "inventory/adjust",
    receive: "inventory/receive",
    orderMovements: "inventory/order-movements",
    movements: "inventory/movements",
    settings: "inventory/settings",
  },
};

/**
 * Resolves a leaf to its boundary path, e.g.
 * `authPath(routes.auth.login, "staff")` -> `admin/auth/login`.
 *
 * A leaf may carry `:name` placeholders, which are filled from `params`. They
 * are filled here rather than by the caller because an id that has not been
 * encoded is a request for a different resource — a slash in an id would
 * otherwise send the call to a route that does not exist, or worse, to one that
 * does. A placeholder with no matching param is left in place, so a missing id
 * fails visibly at the server instead of quietly hitting a sibling route.
 */
export function resourcePath(leaf, realm, params = {}) {
  const boundary = BOUNDARY[realm] ?? BOUNDARY.customer;
  return `${boundary}/${leaf}`.replace(/:(\w+)/g, (match, key) =>
    key in params ? encodeURIComponent(params[key]) : match,
  );
}

export function authPath(name, realm, id) {
  return resourcePath(name, realm, { id });
}
