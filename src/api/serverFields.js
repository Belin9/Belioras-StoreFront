/**
 * Which fields the server has shown it knows, learnt from what it returns.
 *
 * The API validates strictly: a save carrying a key it does not know is
 * refused whole ("Unrecognized key: isPreOrder"), so one new field would
 * break every product or settings save until the server catches up. New
 * fields are therefore only sent once a response has carried them; until
 * then they are left out of the save and the screens say they are waiting
 * on a server update.
 */
const seen = new Map();

export function noteServerFields(scope, objects) {
  const keys = seen.get(scope) ?? new Set();
  for (const o of [].concat(objects ?? [])) {
    if (o && typeof o === "object") Object.keys(o).forEach((k) => keys.add(k));
  }
  seen.set(scope, keys);
}

export function serverKnows(scope, key) {
  return seen.get(scope)?.has(key) ?? false;
}
