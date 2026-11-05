/* Team Roles */
import { http } from "@/api/client";
import { resourcePath } from "@/api/routes";
import { setState } from "../store/contentStore";
import { audited } from "./audited";

/**
 * Team → Roles, on the server. A role's permissions are what the server
 * checks on every request, so editing one here changes what its holders can
 * do everywhere — not only which buttons they see.
 *
 * The rules are the server's: the Administrator role is locked, nobody edits
 * the role they hold, and nobody grants a level they do not hold. The list is
 * mirrored into the local `roles` domain, which draws every staff member's
 * dashboard synchronously (`utils/roles.js`).
 */

const path = (leaf = "roles") => resourcePath(leaf, "staff");
const opts = { realm: "staff" };

function mirror(items) {
  setState("roles", (state) => ({ ...state, items }));
  return items;
}

/** Every role, with how many staff hold it. Mirrored for the dashboard's own access checks. */
export async function getRoles() {
  return mirror(await http.get(path(), opts));
}

const refreshAfter = async (result) => {
  await getRoles().catch(() => null);
  return result;
};

function body({ name, description, permissions } = {}) {
  return { name: String(name ?? "").trim(), description: String(description ?? "").trim(), permissions: permissions ?? {} };
}

const createRole$raw = (input) => http.post(path(), body(input), opts).then(refreshAfter);
const updateRole$raw = (id, input) => http.patch(path(`roles/${encodeURIComponent(id)}`), body(input), opts).then(refreshAfter);
const deleteRole$raw = (id) => http.del(path(`roles/${encodeURIComponent(id)}`), opts).then(refreshAfter);

/* Recorded in the staff activity log. */
export const createRole = audited("team", (_, r) => `Created role ${r.name}`, createRole$raw);
export const updateRole = audited("team", (_, r) => `Updated role ${r.name}`, updateRole$raw);
export const deleteRole = audited("team", (_, r) => `Deleted role ${r.name}`, deleteRole$raw);
