
/* DASHBOARD NAV GROUPS */
export const DASHBOARD_NAV_GROUPS = [
  {
    id: "main",
    label: null,
    items: [{ id: "overview", label: "Overview", icon: "LayoutDashboard", description: "Today's sales, what needs attention, and the latest orders." }],
  },
  {
    id: "catalogue",
    label: "Catalogue",
    items: [
      { id: "products", label: "Products", icon: "Package", description: "Every piece in the shop: add, edit, publish and hide them." },
      // How many of each piece: on hand, held by open orders, and available.
      { id: "inventory", label: "Inventory", icon: "Warehouse", description: "How many of each piece are on hand, held by open orders, and free to sell." },
      { id: "categories", label: "Categories & Colours", icon: "Tags", description: "The categories pieces are filed under, and the colours they come in." },
      { id: "sizes", label: "Sizes & Guides", icon: "Ruler", description: "The sizes pieces come in, the size guides shoppers see, and your fit models." },
      { id: "mega-menu", label: "Mega Menu", icon: "Menu", description: "The shop's top menu. Every link is chosen from your categories, so it always leads to real pieces." },
      { id: "reviews", label: "Reviews", icon: "Star", description: "Every review arrives pending. Nothing shows on a product page until you publish it." },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    items: [
      { id: "orders", label: "Orders", icon: "ShoppingCart", description: "Orders to confirm, pack and ship, and their payments and refunds." },
      // The money behind orders: payments, refunds and failed attempts. A
      // separate page because one order can carry several of them.
      { id: "transactions", label: "Transactions", icon: "CreditCard", description: "Payments, refunds and failed attempts, each tied to its order." },
      // Customers and Team were one "Users" page listing shoppers and staff in
      // the same table, with a role dropdown on every row — the control that
      // grants administrator access sitting beside a customer's delivery
      // history. Different jobs, different audiences, different permissions.
      { id: "customers", label: "Customers", icon: "Users", description: "Shoppers with an account, their orders and what they have spent." },
      // Sales, VAT, stock and coupon figures for a period, each downloadable.
      { id: "reports", label: "Reports", icon: "FileBarChart", description: "Sales, VAT, stock and coupon figures for a period, each downloadable." },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    items: [
      { id: "discounts", label: "Discounts", icon: "Percent", description: "Codes shoppers redeem at checkout: percent off, a fixed amount, or free shipping." },
      // Subscribers, campaigns and the welcome email for the Belioras Letter.
      { id: "newsletter", label: "Newsletter", icon: "Mail", description: "Subscribers to the Belioras Letter, your campaigns and the welcome email." },
      // The photo tiles under "Explore the Collection" on the home page.
      { id: "home", label: "Home page", icon: "House", description: "The photo tiles under “Explore the Collection” on the home page." },
    ],
  },
  {
    id: "store",
    label: "Store",
    items: [
      { id: "team", label: "Team & roles", icon: "ShieldCheck", description: "Who can sign in to the dashboard, and what each role can see and change." },
      // Sign-ins and every change made in the dashboard, by whom and when.
      { id: "activity", label: "Activity log", icon: "History", description: "Sign-ins and every change made in the dashboard, by whom and when." },
      { id: "shipping", label: "Shipping", icon: "Truck", description: "Where you ship, what it costs, and when it is free." },
      { id: "settings", label: "Settings", icon: "Settings", description: "Contact details, storefront notices, tax, invoices and product safety." },
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
