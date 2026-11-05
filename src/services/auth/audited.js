import { ApiError } from "@/api/mock";
import { accessFor } from "../../utils/roles";
import { SECTIONS } from "../../utils/permissions";
import { currentActor } from "./activityApi";

/**
 * Wraps a dashboard write. Before it runs, the signed-in person must have
 * "edit" on its section — a quick answer in the screen; the server makes the
 * same check, from the same roles, and is the one that counts. `section` may
 * be a function of the arguments.
 *
 * The change itself is recorded by the server in its audit log, which is what
 * the Activity page shows, so nothing is logged here. `describe` is kept so
 * each call site still says, in one line, what the write is.
 */
export function audited(section, describe, fn) {
  return (...args) => {
    const where = typeof section === "function" ? section(...args) : section;
    const actor = currentActor();
    if (!actor || accessFor(actor.role, where) !== "edit") {
      const label = SECTIONS.find((s) => s.id === where)?.label ?? where;
      return Promise.reject(new ApiError(`Your role can view ${label} but not change it. Ask an administrator for edit access.`, 403));
    }
    return fn(...args);
  };
}
