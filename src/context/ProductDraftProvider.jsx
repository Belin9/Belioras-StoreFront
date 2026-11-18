/* Context Provider: ProductDraftProvider */
import { useCallback, useMemo } from "react";

import { useLocalStorage } from "../hooks/useLocalStorage";
import { ProductDraftContext } from "./ProductDraftContext";

/* STORAGE KEY */
const STORAGE_KEY = "belioras:draft:product";

function sameExceptTimestamp(a, b) {

  const strip = (draft) => {

    const rest = { ...draft };
    delete rest.updatedAt;
    return JSON.stringify(rest);
  };
  return strip(a) === strip(b);
}

export function ProductDraftProvider({ children }) {
  const [drafts, setDrafts] = useLocalStorage(STORAGE_KEY, {});

  const startDraft = useCallback(
    (key, data) => {
      setDrafts((prev) => {

        const existing = prev[key];
        // Replace rather than merge: a cleared field or a removed image has to
        // actually disappear from the draft, which a shallow merge would keep.
        const next = { ...data, key, updatedAt: Date.now() };

        // Bail out when nothing meaningful changed. This runs from an effect
        // watching the whole form, so writing an identical object would
        // re-render every consumer on each keystroke. updatedAt is excluded
        // from the comparison because it changes by definition.
        if (existing && sameExceptTimestamp(existing, next)) return prev;
        return { ...prev, [key]: next };
      });
    },
    [setDrafts],
  );

  const updateDraft = useCallback(
    (key, patch) => {
      setDrafts((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], ...patch } } : prev));
    },
    [setDrafts],
  );

  const clearDraft = useCallback(
    (key) => {
      setDrafts((prev) => {
        if (!prev[key]) return prev;

        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [setDrafts],
  );

  const draftFor = useCallback((key) => drafts[key] ?? null, [drafts]);

  const value = useMemo(
    () => ({
      drafts: Object.values(drafts),
      startDraft,
      updateDraft,
      clearDraft,
      draftFor,
    }),
    [drafts, startDraft, updateDraft, clearDraft, draftFor],
  );

  return <ProductDraftContext.Provider value={value}>{children}</ProductDraftContext.Provider>;
}
