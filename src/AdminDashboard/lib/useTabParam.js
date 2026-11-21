/* Admin Dashboard: useTabParam */
import { useSearchParams } from "react-router-dom";

/**
 * The open tab, kept in the address (`?tab=`), so a reload, the back button
 * or a shared link lands on the same tab. Unknown values fall back to the
 * first tab; the first tab leaves the address clean.
 */
export function useTabParam(ids, key = "tab") {
  const [params, setParams] = useSearchParams();
  const current = params.get(key);
  const tab = ids.includes(current) ? current : ids[0];

  const setTab = (next) =>
    setParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        if (next === ids[0]) out.delete(key);
        else out.set(key, next);
        return out;
      },
      { replace: true },
    );

  return [tab, setTab];
}
