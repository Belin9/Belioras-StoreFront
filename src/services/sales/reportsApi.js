/* Reports */
import { mockApi } from "@/api/mock";
import { getState } from "../store/contentStore";
import { normalizeStatus } from "../../utils/orderStatus";
import { catalogItems, normalize } from "../catalog/products/productStore";
import { refreshProducts } from "../catalog/products/productSync";
import { lowStockThreshold } from "../catalog/inventory/inventoryApi";

/**
 * The figures behind the Reports page, for one period. "Sales" counts orders
 * that were paid for and not refunded — an order still awaiting payment has
 * not been sold, and a refunded one was given back. VAT is included in the
 * prices, so it is the order's recorded tax.
 */
const PAID = new Set(["to-ship", "shipped", "to-review", "reviewed"]);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const r2 = (n) => Math.round(n * 100) / 100;

function inPeriod(iso, { from, to }) {
  const t = new Date(iso).getTime();
  return (!from || t >= new Date(from).getTime()) && (!to || t <= new Date(`${to.slice(0, 10)}T23:59:59Z`).getTime());
}

export function getReports(period) {
  return mockApi(async () => {
    // The stock and best-seller figures read the catalogue mirror; fetch it
    // fresh so a report never counts from a list the boot sync left public-only.
    await refreshProducts();
    const all = getState("orders").items;
    const orders = all.filter((o) => inPeriod(o.createdAt, period));
    const paid = orders.filter((o) => PAID.has(normalizeStatus(o.status)));
    const refunded = orders.filter((o) => normalizeStatus(o.status) === "refunded");

    // Sales & VAT, by month
    const months = new Map();
    for (const o of paid) {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const m = months.get(key) ?? { key, month: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, orders: 0, goods: 0, discount: 0, shipping: 0, gross: 0, vat: 0 };
      m.orders += 1;
      m.goods += o.subtotal ?? 0;
      m.discount += o.discount ?? 0;
      m.shipping += o.shipping ?? 0;
      m.gross += o.total ?? 0;
      m.vat += o.tax ?? 0;
      months.set(key, m);
    }
    const sales = [...months.values()].sort((a, b) => a.key.localeCompare(b.key)).map((m) => ({
      ...m, goods: r2(m.goods), discount: r2(m.discount), shipping: r2(m.shipping), gross: r2(m.gross), vat: r2(m.vat), net: r2(m.gross - m.vat),
    }));
    const sum = (key) => r2(sales.reduce((s, m) => s + m[key], 0));
    const salesTotals = { month: "Total", orders: paid.length, goods: sum("goods"), discount: sum("discount"), shipping: sum("shipping"), gross: sum("gross"), vat: sum("vat"), net: sum("net") };

    // Orders, one row each
    const orderRows = orders
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((o) => ({
        id: o.id, date: o.createdAt.slice(0, 10), invoice: o.invoiceNumber ?? "", customer: o.name ?? "Guest", email: o.email ?? "",
        status: normalizeStatus(o.status), subtotal: o.subtotal ?? 0, discount: o.discount ?? 0, shipping: o.shipping ?? 0, vat: o.tax ?? 0, total: o.total ?? 0, coupon: o.couponCode ?? "",
      }));

    // Products, by units sold
    const byProduct = new Map();
    for (const o of paid) {
      for (const line of o.items ?? []) {
        const p = byProduct.get(line.productId) ?? { id: line.productId, name: line.name, units: 0, revenue: 0 };
        p.units += line.quantity ?? 1;
        p.revenue += (line.price ?? 0) * (line.quantity ?? 1);
        byProduct.set(line.productId, p);
      }
    }
    const categories = getState("categories").items;
    const products = [...byProduct.values()]
      .map((p) => {
        const product = catalogItems().find((x) => x.id === p.id);
        return { ...p, revenue: r2(p.revenue), category: categories.find((c) => c.id === product?.collectionId)?.name ?? "—" };
      })
      .sort((a, b) => b.units - a.units || b.revenue - a.revenue);

    // Coupons
    const byCode = new Map();
    for (const o of paid.filter((x) => x.couponCode)) {
      const c = byCode.get(o.couponCode) ?? { code: o.couponCode, orders: 0, discount: 0, revenue: 0 };
      c.orders += 1;
      c.discount += o.discount ?? 0;
      c.revenue += o.total ?? 0;
      byCode.set(o.couponCode, c);
    }
    const coupons = [...byCode.values()].map((c) => ({ ...c, discount: r2(c.discount), revenue: r2(c.revenue) })).sort((a, b) => b.orders - a.orders);

    // Customers
    const firstOrder = new Map();
    for (const o of all.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))) {
      const who = o.userId ?? String(o.email ?? "").toLowerCase();
      if (!firstOrder.has(who)) firstOrder.set(who, o.createdAt);
    }
    const byCustomer = new Map();
    for (const o of paid) {
      const who = o.userId ?? String(o.email ?? "").toLowerCase();
      const c = byCustomer.get(who) ?? { customer: o.name ?? "Guest", email: o.email ?? "", orders: 0, spent: 0, firstOrder: firstOrder.get(who)?.slice(0, 10) ?? "" };
      c.orders += 1;
      c.spent += o.total ?? 0;
      byCustomer.set(who, c);
    }
    const customers = [...byCustomer.values()].map((c) => ({ ...c, spent: r2(c.spent), isNew: c.firstOrder && inPeriod(c.firstOrder, period) ? "Yes" : "No" })).sort((a, b) => b.spent - a.spent);

    // Stock, now (not for a period)
    const shopLow = lowStockThreshold();
    const stockByCat = new Map();
    for (const p of catalogItems().map(normalize)) {
      const cat = categories.find((c) => c.id === p.collectionId)?.name ?? "—";
      const s = stockByCat.get(cat) ?? { category: cat, pieces: 0, units: 0, retail: 0, cost: 0, low: 0 };
      s.pieces += 1;
      s.units += p.onHand ?? p.stock ?? 0;
      s.retail += (p.onHand ?? p.stock ?? 0) * (p.price ?? 0);
      s.cost += (p.onHand ?? p.stock ?? 0) * (p.costPrice ?? 0);
      if ((p.stock ?? 0) > 0 && (p.stock ?? 0) <= (p.lowStockThreshold ?? shopLow)) s.low += 1;
      stockByCat.set(cat, s);
    }
    const stock = [...stockByCat.values()].map((s) => ({ ...s, retail: r2(s.retail), cost: r2(s.cost) }));

    return {
      summary: {
        orders: paid.length,
        gross: salesTotals.gross,
        vat: salesTotals.vat,
        net: salesTotals.net,
        refunded: r2(refunded.reduce((s, o) => s + (o.total ?? 0), 0)),
        refundedCount: refunded.length,
        unpaid: orders.filter((o) => normalizeStatus(o.status) === "to-pay").length,
      },
      sales, salesTotals, orders: orderRows, products, coupons, customers, stock,
    };
  }, 0);
}
