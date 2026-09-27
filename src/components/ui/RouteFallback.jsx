/* Ui Component: RouteFallback */
import { Loader2 } from "lucide-react";

/**
 * Shown while a lazily-loaded route chunk is still downloading.
 *
 * Deliberately not a spinner over the existing page: there is no existing page
 * yet, so this is all the visitor has. It centres itself in the viewport rather
 * than sitting at the top of a blank document, and it never explains *why* it is
 * waiting — a route chunk is a few tens of kilobytes, and a message that says
 * "loading" for 200ms reads as a fault rather than as progress.
 */
export default function RouteFallback() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <Loader2 className="size-5 animate-spin text-gold-700" aria-hidden="true" />
    </div>
  );
}
