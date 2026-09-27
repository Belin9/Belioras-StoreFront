/* Query Client */
import { QueryClient } from "@tanstack/react-query";

/**
 * The application's cache and retry policy.
 *
 * This was installed for the backend integration and is finally wired up. It
 * replaces the hand-rolled fetching that `useAsyncData` used to do with
 * `useState` + `useEffect`, which could not cancel, deduplicate, or tell a stale
 * response from a fresh one.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        /**
         * How long a result counts as fresh. While this is longer than zero,
         * remounting a component inside the window reuses the cached value
         * instead of refetching — which is what stops a page that reads six
         * services from firing six requests every time the visitor navigates
         * back to it.
         *
         * A write still refetches immediately, because bumping a `revision`
         * dependency changes the query key, and a changed key is a new query
         * with nothing cached.
         */
        staleTime: 30_000,

        /**
         * Only a request that never reached the server, or that the server
         * failed to handle, is worth sending again. A 400/401/403/404/409 is
         * the same answer every time, and retrying those wastes a round trip and
         * delays the error the page needs to show. A `status` of 0 is the
         * transport's network/timeout error, which is often transient.
         */
        retry: (failureCount, error) => {
          const status = error?.status ?? 0;
          const transient = status === 0 || status >= 500;
          return transient && failureCount < 1;
        },

        /**
         * TEMPORARY — flip both of these on when the mock store is gone.
         *
         * Most services still read `contentStore`, a localStorage-backed
         * in-memory object. Nothing can change it from another tab or another
         * device, so refetching on focus and reconnect is pure overhead — and
         * with `mockApi`'s 250ms delay across 112 call sites, it is overhead the
         * visitor would actually feel. These defaults become correct the moment
         * a service is a real request, so they are marked here rather than left
         * to be rediscovered.
         */
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  });
}

/** The single client the app runs on. */
export const queryClient = createQueryClient();
