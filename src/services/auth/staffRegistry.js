/* Current Staff Account */

/**
 * Who is signed in at the atelier, for the modules that are not React.
 *
 * The activity log and the audited-write wrapper both need an actor, and both
 * are plain modules that cannot use a hook. They used to read
 * `localStorage["belioras:auth:staff"]` directly, which was only correct while
 * the staff session was a stored object. The access token now lives in memory
 * and the user is recovered from the server on boot, so there is nothing in
 * storage left to read — the session context publishes here instead.
 *
 * A module rather than a context because these callers are services, and a
 * service importing React state would invert the layering. It is written in
 * one place (the staff session) and read in several, and it holds no authority
 * over anything: it is a record of who is signed in, not a permission check.
 */

let current = null;

export function setCurrentStaff(user) {
  current = user ? { id: user.id, name: user.name ?? null, email: user.email, role: user.role ?? null } : null;
}

export function currentStaff() {
  return current;
}
