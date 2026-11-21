/* Admin Dashboard: useAttentionCounts */
import { useEffect, useRef, useState } from "react";

import { useToast } from "@/context/ToastContext";
import { getAllReviews } from "@/services/catalog/reviewsApi";
import { getAllOrders } from "@/services/sales/ordersApi";
import { normalizeStatus } from "@/utils/orderStatus";

const EVERY = 60 * 1000;

/**
 * What is waiting on someone, for the sidebar badges and the tab title:
 * orders to ship and reviews to moderate. Checked every minute while the
 * dashboard is open (and when the tab comes back into view); a rise in
 * orders to ship brings a "new order" message. Only sections the role can
 * open are asked for.
 */
export function useAttentionCounts({ access }) {
  const { toast } = useToast();
  const [counts, setCounts] = useState({ orders: 0, reviews: 0 });
  const lastOrders = useRef(null);
  const seesOrders = access("orders") !== "none";
  const seesReviews = access("reviews") !== "none";

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const [orders, reviews] = await Promise.all([
        seesOrders ? getAllOrders().catch(() => null) : null,
        seesReviews ? getAllReviews().catch(() => null) : null,
      ]);
      if (!alive) return;
      setCounts((prev) => {
        const next = {
          orders: orders ? orders.filter((o) => normalizeStatus(o.status) === "to-ship").length : prev.orders,
          reviews: reviews ? reviews.filter((r) => r.status === "pending").length : prev.reviews,
        };
        if (orders && lastOrders.current !== null && next.orders > lastOrders.current) {
          const n = next.orders - lastOrders.current;
          toast(`${n === 1 ? "A new order is" : `${n} new orders are`} waiting to ship.`, "success");
        }
        if (orders) lastOrders.current = next.orders;
        return next;
      });
    };
    check();
    const timer = setInterval(check, EVERY);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [seesOrders, seesReviews, toast]);

  return counts;
}
