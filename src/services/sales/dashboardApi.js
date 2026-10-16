import { mockApi } from "@/api/mock";
import { getState } from "../store/contentStore";
import { normalizeStatus } from "../../utils/orderStatus";
import { getAllOrders } from "./ordersApi";
import { getAllProducts } from "../catalog/productsApi";
import { getAllReviews } from "../catalog/reviewsApi";
import { lowStockThreshold } from "../catalog/inventory/inventoryApi";
import { stockLevel, thresholdFor } from "../../utils/stockLevel";

/**
 * Dashboard aggregates.
 *
 * The overview previously displayed hardcoded figures — "$124,500" in a store
 * that trades in euros, and dates from 2024 — so it looked plausible while
 * telling Belioras nothing. Everything here is derived from the same order and
 * product data the storefront reads, which means the dashboard and the shop can
 * never disagree, and a test order placed on the site shows up here.
 *
 * Amounts are returned in the base currency; the view formats them through the
 * active currency, exactly as product prices are handled.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function getDashboardStats() {
  return mockApi(async () => {
    const [orders, products] = await Promise.all([getAllOrders(), getAllProducts()]);

    // A cancelled or refunded order brought in nothing.
    const live = orders.filter((o) => !["cancelled", "refunded"].includes(normalizeStatus(o.status)));

    const revenue = live.reduce((sum, o) => sum + (o.total ?? 0), 0);

    const customers = new Set(live.map(customerOf)).size;

    // Month-over-month, using the most recent month present in the data rather
    // than the calendar month — seed data is not necessarily current.
    const byMonth = groupByMonth(live);

    const months = [...byMonth.keys()].sort((a, b) => a - b);
    const currentKey = months.at(-1);
    const previousKey = months.at(-2);

    const current = byMonth.get(currentKey) ?? { revenue: 0, count: 0 };

    const previous = byMonth.get(previousKey) ?? { revenue: 0, count: 0 };

    // A customer is new in the month of their first order.
    const firstMonth = new Map();
    for (const order of live.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))) {
      const who = customerOf(order);
      if (!firstMonth.has(who)) firstMonth.set(who, monthKey(order.createdAt));
    }
    const newIn = (key) => [...firstMonth.values()].filter((k) => k === key).length;

    const average = (m) => (m.count ? m.revenue / m.count : 0);

    // The moderation queue, fresh; the last mirror if the server cannot be reached.
    const reviews = await getAllReviews().catch(() => getState("reviews")?.items ?? []);

    return {
      revenue,
      revenueChange: percentChange(previous.revenue, current.revenue),
      orderCount: live.length,
      orderChange: percentChange(previous.count, current.count),
      productCount: products.filter((p) => p.status === "active").length,
      // The same rule and threshold Inventory uses, on what is left to sell.
      lowStockCount: products.filter((p) => stockLevel(p.stock, thresholdFor(p, lowStockThreshold())) === "low").length,
      customerCount: customers,
      newCustomers: newIn(currentKey),
      averageOrder: live.length ? revenue / live.length : 0,
      averageOrderChange: percentChange(average(previous), average(current)),
      // What is waiting on someone: the counts the Needs attention list links to.
      attention: {
        toPay: orders.filter((o) => normalizeStatus(o.status) === "to-pay").length,
        toShip: orders.filter((o) => normalizeStatus(o.status) === "to-ship").length,
        pendingReviews: reviews.filter((r) => r.status === "pending").length,
      },
      topSellers: topSellers(live, products, currentKey),
      // Every month, oldest first; the chart picks the window it shows.
      series: months.map((key) => ({
        key,
        name: MONTHS[key % 12],
        label: `${MONTHS[key % 12]} ${Math.floor(key / 12)}`,
        sales: Math.round(byMonth.get(key).revenue),
        orders: byMonth.get(key).count,
      })),
    };
  }, 0);
}

function customerOf(order) {
  return order.userId ?? String(order.email ?? "").toLowerCase();
}

/** Months as one sortable number: year × 12 + month index. */
function monthKey(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.getFullYear() * 12 + date.getMonth();
}

/** Best sellers by units in the latest month; over all time when that month has none. */
function topSellers(orders, products, currentKey, limit = 5) {
  const tally = (list) => {
    const map = new Map();
    for (const order of list) {
      for (const line of order.items ?? []) {
        const entry = map.get(line.productId) ?? { units: 0, revenue: 0 };
        entry.units += line.quantity ?? 1;
        entry.revenue += (line.price ?? 0) * (line.quantity ?? 1);
        map.set(line.productId, entry);
      }
    }
    return map;
  };
  let scope = "this month";
  let map = tally(orders.filter((o) => monthKey(o.createdAt) === currentKey));
  if (!map.size) {
    scope = "all time";
    map = tally(orders);
  }
  const rows = [...map.entries()]
    .map(([id, t]) => ({ id, ...t, product: products.find((p) => p.id === id) }))
    .filter((r) => r.product)
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
    .slice(0, limit)
    .map((r) => ({ id: r.id, name: r.product.name, image: r.product.images?.[0], slug: r.product.slug, units: r.units, revenue: r.revenue }));
  return { scope, rows };
}

/** The five most recent orders, shaped for the overview table. */
export function getRecentOrders(limit = 5) {
  return mockApi(async () => {

    const orders = await getAllOrders();
    return orders
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit)
      .map((order) => ({
        id: order.id,
        customer: order.name ?? order.email ?? "Guest",
        total: order.total ?? 0,
        status: order.status,
        createdAt: order.createdAt,
      }));
  }, 0);
}

function groupByMonth(orders) {

  const map = new Map();
  for (const order of orders) {

    const key = monthKey(order.createdAt);
    if (key === null) continue;

    const entry = map.get(key) ?? { revenue: 0, count: 0 };
    entry.revenue += order.total ?? 0;
    entry.count += 1;
    map.set(key, entry);
  }
  return map;
}

/** Null rather than a fake 0% when there is no prior period to compare against. */
function percentChange(before, after) {
  if (!before) return null;
  return ((after - before) / before) * 100;
}
