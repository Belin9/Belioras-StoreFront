
/* DASHBOARD NAV GROUPS */
export const DASHBOARD_NAV_GROUPS = [
  {
    id: "main",
    label: null,
    items: [{ id: "overview", label: "Overview", icon: "LayoutDashboard" }],
  },
  {
    id: "catalogue",
    label: "Catalogue",
    items: [
      { id: "products", label: "Products", icon: "Package" },
      // How many of each piece: on hand, held by open orders, and available.
      { id: "inventory", label: "Inventory", icon: "Warehouse" },
      { id: "categories", label: "Categories & Colours", icon: "Tags" },
      { id: "sizes", label: "Sizes & Guides", icon: "Ruler" },
      { id: "mega-menu", label: "Mega Menu", icon: "Menu" },
      { id: "reviews", label: "Reviews", icon: "Star" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    items: [
      { id: "orders", label: "Orders", icon: "ShoppingCart" },
      // The money behind orders: payments, refunds and failed attempts. A
      // separate page because one order can carry several of them.
      { id: "transactions", label: "Transactions", icon: "CreditCard" },
      // Customers and Team were one "Users" page listing shoppers and staff in
      // the same table, with a role dropdown on every row — the control that
      // grants administrator access sitting beside a customer's delivery
      // history. Different jobs, different audiences, different permissions.
      { id: "customers", label: "Customers", icon: "Users" },
      // Sales, VAT, stock and coupon figures for a period, each downloadable.
      { id: "reports", label: "Reports", icon: "FileBarChart" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    items: [
      { id: "discounts", label: "Discounts", icon: "Percent" },
      // Subscribers, campaigns and the welcome email for the Belioras Letter.
      { id: "newsletter", label: "Newsletter", icon: "Mail" },
      // The photo tiles under "Explore the Collection" on the home page.
      { id: "home", label: "Home page", icon: "House" },
    ],
  },
  {
    id: "store",
    label: "Store",
    items: [
      { id: "team", label: "Team & roles", icon: "ShieldCheck" },
      // Sign-ins and every change made in the dashboard, by whom and when.
      { id: "activity", label: "Activity log", icon: "History" },
      { id: "shipping", label: "Shipping", icon: "Truck" },
      { id: "settings", label: "Settings", icon: "Settings" },
    ],
  },
];

/* DASHBOARD NAV ITEMS */
export const DASHBOARD_NAV_ITEMS = DASHBOARD_NAV_GROUPS.flatMap((group) => group.items);

/* PRODUCT STATUS */
export const PRODUCT_STATUS = {
  active: { label: "Active", tone: "positive" },
  draft: { label: "Draft", tone: "neutral" },
  out_of_stock: { label: "Out of stock", tone: "negative" },
};

/* STATUS TONES */
export const STATUS_TONES = {
  positive: "bg-success/10 text-success",
  pending: "bg-gold-500/15 text-gold-800",
  progress: "bg-brown-50 text-brown-700",
  neutral: "bg-umber-50 text-espresso-soft",
  negative: "bg-error/10 text-error",
};
