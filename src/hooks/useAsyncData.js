/* Async Data Hook */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

/**
 * Reads a service, with caching, cancellation and error handling.
 *
 * ## Why this exists as a bridge
 *
 * Before the backend integration, 112 call sites read data through this hook,
 * which ran the service in a `useEffect` and wrote the result into `useState`.
 * That version had no cancellation, no deduplication, and no guard against
 * out-of-order responses, so the slower of two overlapping requests would win
 * and overwrite newer data with older data. It also could not express
 * "refetching" as distinct from "loading", so every refresh blanked the screen
 * it was meant to update.
 *
 * All of that is now React Query's job, which handles it properly. Rather than
 * touch 112 call sites at once, this hook keeps its exact signature and return
 * shape and delegates underneath. Call sites convert to `useQuery` naturally as
 * each namespace goes live; this is the runway, not the destination.
 *
 * ## The cache key
 *
 * The key is the service's *source text* plus the caller's dependencies:
 *
 *     [fn.toString(), ...deps]
 *
 * The obvious alternative — keying on the function reference — is wrong here.
 * 17 of the 112 call sites pass an inline arrow (`() => getOrders(user?.id)`),
 * which is a brand new function on every render. Keying on identity would give
 * those sites a new key on every render and an endless refetch loop.
 *
 * Source text is stable for the lifetime of a page (the same expression compiles
 * to the same string each time) and distinct between call sites, so it gives
 * every read its own identity. It is not stable across deploys, which only
 * means a cold cache after a release — nothing is persisted, so nothing to
 * invalidate. Two call sites that ask for genuinely the same thing with the same
 * dependencies now share one request, which is the point of a cache.
 *
 * `deps` remains the invalidation mechanism the dashboard already uses: bumping
 * a `revision` after a write changes the key, which is a new query, which
 * fetches. Those 28 call sites need no change.
 */
export function useAsyncData(fn, deps = [], options = {}) {
  const fnRef = useRef(fn);

  /* Side Effect */
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const query = useQuery({
    queryKey: [fn.toString(), ...deps],
    queryFn: () => fnRef.current(),

    /**
     * Without this, bumping `revision` would blank the list it is refreshing:
     * a new key is a new query, and a new query starts empty. Keeping the
     * previous value on screen while the next one loads is the behaviour the
     * old `useState` version had for free.
     */
    placeholderData: keepPreviousData,
    ...options,
  });

  return {
    /**
     * `null`, not `undefined`. Call sites were written against a hook that
     * started empty, and a fair number of them do `data ?? []` — which quietly
     * stops working the day `data` becomes `undefined`.
     */
    data: query.data ?? null,
    /** First load only. A background refetch no longer re-triggers a skeleton. */
    loading: query.isPending,
    /** New: true while a refresh is in flight over data that is already shown. */
    refetching: query.isFetching && !query.isPending,
    error: query.error ?? null,
    refresh: query.refetch,
  };
}
