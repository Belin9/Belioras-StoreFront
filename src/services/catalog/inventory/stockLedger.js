/* Stock Ledger */

/**
 * Why stock changed, as the history shows it. The history itself is written
 * on the server, in the same step as every stock change.
 */
export const REASONS = {
  received: "Received",
  adjusted: "Adjusted",
  counted: "Stock count",
  damaged: "Damaged or lost",
  sold: "Shipped to a customer",
  returned: "Returned to stock",
};
