/* Ui Component: ErrorBoundary */
import { Component } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useLocation } from "react-router-dom";

import { cn } from "../../utils/cn";

import Button from "./Button";

/**
 * Contains a render-phase throw so one broken page cannot take the application
 * down with it.
 *
 * Before this existed, any error thrown while rendering a page propagated to the
 * root and unmounted everything — the visitor got a blank screen and the staff
 * got a white dashboard, with no way back except a reload. That matters more as
 * the app starts depending on a network, because a render throw is now a normal
 * consequence of a bad response rather than a sign of a typo.
 *
 * Scope: this catches errors thrown during render, in lifecycle methods, and in
 * the constructors of the tree below it. It deliberately does *not* catch async
 * rejections — a failed fetch is data, not a crash, and belongs in the query's
 * own `error` state where a page can render a retry next to the content it
 * already has.
 */
class ErrorBoundaryBase extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetCount: 0 };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Real errors deserve real logs. In development the message is also shown on
    // screen, so a failing boundary is diagnosable without opening the console.
    console.error("Unhandled render error", { error, componentStack: info?.componentStack });
  }

  componentDidUpdate(prevProps) {
    // Navigating away from a broken page should clear the failure, or the visitor
    // is trapped on the error screen until they know to reload. Comparing by
    // value keeps this stable for arrays like [pathname].
    const before = prevProps.resetKeys;
    const now = this.props.resetKeys;
    const changed =
      Array.isArray(before) && Array.isArray(now)
        ? before.length !== now.length || before.some((key, i) => !Object.is(key, now[i]))
        : !Object.is(before, now);

    if (changed && this.state.error) this.handleReset();
  }

  handleReset() {
    // Bumping the key remounts the subtree. Clearing `error` alone re-renders
    // the same instances, which would simply throw again if the fault is in a
    // component's own state.
    this.setState((prev) => ({ error: null, resetCount: prev.resetCount + 1 }));
  }

  render() {
    const { error, resetCount } = this.state;
    const { children, fallback, className, title, description } = this.props;

    if (!error) return <div key={resetCount}>{children}</div>;
    if (fallback) return typeof fallback === "function" ? fallback(error, this.handleReset) : fallback;

    const isDev = import.meta.env.DEV;

    return (
      <div className={cn("flex min-h-[60vh] items-center justify-center px-6 py-16", className)}>
        <div className="w-full max-w-lg border border-umber-50 px-6 py-10 text-center">
          <span className="mb-5 flex size-12 items-center justify-center border border-umber-50 text-error">
            <AlertTriangle className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </span>

          <h2 className="font-display text-xl tracking-wide text-espresso">
            {title ?? "This page hit a problem."}
          </h2>

          <p className="mt-2 text-[14px] leading-relaxed text-espresso-soft">
            {description ??
              "The rest of the site still works. You can try this page again, or head back to safety."}
          </p>

          {isDev && (
            <pre className="mt-5 max-h-48 overflow-auto border border-umber-50 bg-espresso/[0.03] p-3 text-left text-[11px] leading-relaxed text-espresso-soft">
              {String(error?.stack ?? error)}
            </pre>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button size="md" variant="primary" icon={RotateCcw} onClick={this.handleReset}>
              Try again
            </Button>
            <Button size="md" variant="ghost" to="/">
              Back to home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Default export wires the boundary to the router so it clears on navigation.
 * A class cannot read router context, hence the thin function wrapper — and it
 * must sit *inside* BrowserRouter for that context to exist.
 */
export default function ErrorBoundary({ children, ...rest }) {
  const { pathname } = useLocation();
  return (
    <ErrorBoundaryBase resetKeys={[pathname]} {...rest}>
      {children}
    </ErrorBoundaryBase>
  );
}
