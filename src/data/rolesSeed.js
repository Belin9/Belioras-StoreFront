/**
 * Dashboard roles: a name and a level per section — "none", "view" or "edit".
 * Administrator is locked: it always has everything, so the shop can never be
 * left without someone able to manage it. The rest are starting points the
 * admin can edit, delete or add to under Team → Roles.
 */
const all = (level) => ({
  overview: "view", products: level, inventory: level, categories: level, sizes: level, "mega-menu": level,
  reviews: level, orders: level, transactions: "view", customers: "view", reports: "view", discounts: level,
  newsletter: level, home: level, team: level, activity: "view", shipping: level, settings: level,
});

export default {
  rev: 1,
  items: [
    { id: "super-admin", name: "Administrator", description: "Everything, including the team, roles, payments and settings.", locked: true, permissions: all("edit") },
    {
      id: "staff", name: "Staff", description: "Runs the shop day to day: catalogue, orders, content and marketing.",
      permissions: { overview: "view", products: "edit", inventory: "edit", categories: "edit", sizes: "edit", "mega-menu": "edit", reviews: "edit", orders: "edit", customers: "view", discounts: "edit", newsletter: "edit", home: "edit" },
    },
    {
      id: "finance", name: "Finance", description: "Money and reports, read-only: revenue, payments, VAT and exports.",
      permissions: { overview: "view", orders: "view", transactions: "view", customers: "view", reports: "view", discounts: "view" },
    },
    {
      id: "support", name: "Customer support", description: "Orders, customers and reviews — what shoppers write in about.",
      permissions: { overview: "view", products: "view", inventory: "view", orders: "edit", customers: "view", reviews: "edit" },
    },
    {
      id: "content", name: "Content editor", description: "Products, the menu, size guides and the newsletter. No orders or money.",
      permissions: { products: "edit", categories: "edit", sizes: "edit", "mega-menu": "edit", reviews: "edit", newsletter: "edit", home: "edit" },
    },
    {
      id: "developer", name: "Developer / IT", description: "Sign-ins, the activity log and store settings. No customer data, orders or money.",
      permissions: { activity: "view", settings: "view", shipping: "view" },
    },
  ],
};
