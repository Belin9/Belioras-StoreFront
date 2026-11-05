/* Staff Activity */
import { http } from "@/api/client";
import { resourcePath } from "@/api/routes";
import { currentStaff } from "./staffRegistry";

/**
 * The Activity page and the Team roster's "Last signed in", read from the
 * server's audit log — the record every change on the server writes, with who
 * and when. Every member of staff sees the same history; it used to be a list
 * each browser kept for itself.
 */

/** Who is signed in to the dashboard right now (published by the staff session). */
export function currentActor() {
  return currentStaff();
}

/** Staff activity, newest first: sign-ins (and failed ones) and every change. */
export function getActivity() {
  return http.get(resourcePath("activity", "staff"), { realm: "staff" });
}

/** When each member of staff last signed in, keyed by user id. */
export function lastSignIns() {
  return http.get(resourcePath("activity/sign-ins", "staff"), { realm: "staff" });
}
