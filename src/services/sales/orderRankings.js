import { http } from "@/api/client";
import { resourcePath, routes } from "@/api/routes";

/**
 * Units sold per product, most first, from the server — which counts every
 * order and leaves out cancelled and refunded ones. Public: product ids and
 * counts only, never orders. Empty on failure: a rail with no ranking falls
 * back to the pieces flagged "bestseller".
 */
export function getBestSellerProductIds({ limit = 12, sinceDays = null } = {}) {
  return http
    .get(resourcePath(routes.orders.bestSellers, "customer"), {
      realm: "customer",
      params: { limit, ...(sinceDays ? { sinceDays } : {}) },
    })
    .catch(() => []);
}
