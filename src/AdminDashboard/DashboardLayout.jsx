/* Admin Dashboard: DashboardLayout */
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";

import ConfirmDialog from "../components/ui/ConfirmDialog";
import RouteFallback from "../components/ui/RouteFallback";
import Forbidden from "../components/layout/Forbidden";
import { useStaffAuth } from "@/context/auth/useAuthRealm";
import { useToast } from "../context/ToastContext";
import { useIdleTimeout } from "../hooks/useIdleTimeout";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { cn } from "../utils/cn";
import DashSidebar from "./components/DashSidebar";
import DashHeader from "./components/DashHeader";
import { DASHBOARD_NAV_GROUPS, DASHBOARD_NAV_ITEMS } from "./lib/constants";
import { HeaderSlotContext } from "./lib/headerSlot";

/* IDLE TIMEOUT */
const IDLE_TIMEOUT = 30 * 60 * 1000;

/* IDLE WARNING */
const IDLE_WARNING = 2 * 60 * 1000;

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useLocalStorage("belioras:dash:collapsed", false);
  const { pathname } = useLocation();

  const navigate = useNavigate();
  const { logout, access } = useStaffAuth();
  const { toast } = useToast();

  const segment = pathname.replace(/^\/dashboard\/?/, "").split("/")[0] || "overview";

  const title = DASHBOARD_NAV_ITEMS.find((item) => item.id === segment)?.label ?? "Dashboard";

  // "Catalogue / Products / New": where in the dashboard this is, from the
  // sidebar's own groups, plus the sub-page when there is one.
  const group = DASHBOARD_NAV_GROUPS.find((g) => g.items.some((item) => item.id === segment));
  const rest = pathname.replace(/^\/dashboard\/?/, "").split("/").slice(1);
  // What this person's role allows on this section: nothing, a look, or changes.
  // "none" shows a refusal inside the shell; "view" shows the page with a note,
  // no main action in the header, and every write refused by the service.
  const level = access(segment);
  const firstAllowed = DASHBOARD_NAV_ITEMS.find((item) => access(item.id) !== "none");

  const trail = [
    group?.label,
    ...(rest.length ? [{ label: title, to: `/dashboard/${segment}` }] : [title]),
    rest[0] === "new" ? "New" : rest.includes("edit") ? "Edit" : null,
  ].filter(Boolean);

  const onIdle = useCallback(async () => {
    await logout();
    navigate("/atelier", { replace: true });
    toast("Signed out after 30 minutes of inactivity.", "info");
  }, [logout, navigate, toast]);

  // Where a page's main action renders, in the header (DashHeaderActions).
  const [headerSlot, setHeaderSlot] = useState(null);

  // The window's scroll-to-top on navigation does not reach <main>.
  const mainRef = useRef(null);
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  const { warning, extend } = useIdleTimeout({
    timeout: IDLE_TIMEOUT,
    warnBefore: IDLE_WARNING,
    onIdle,
  });

  return (
    <div
      className={cn(
        "dash-root min-h-dvh bg-ivory-500 transition-[padding] duration-300",
        // Mirrors the sidebar's width. The preference is held here, once, and
        // handed to the sidebar: two separate reads of the stored value did not
        // update each other, so collapsing left the content where it was until
        // a reload.
        collapsed ? "lg:pl-[72px]" : "lg:pl-64",
      )}
    >
      <DashSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
      />

      {/*
        On a desktop the page scrolls inside <main>, not the window, so a list
        page can hold its toolbar still and scroll only its rows (DashTable
        `fill`). A phone keeps ordinary page scrolling.
      */}
      <div className="flex min-h-dvh flex-col lg:h-dvh">
        <DashHeader title={title} trail={trail} onMenuToggle={() => setSidebarOpen(true)} actionsRef={setHeaderSlot} />

        <main ref={mainRef} className="flex-1 px-5 py-8 sm:px-8 lg:min-h-0 lg:overflow-y-auto lg:px-10 lg:py-10">
          {level === "none" ? (
            <Forbidden
              standalone={false}
              title="Not part of your role"
              message="Your role does not include this section. Ask a Belioras administrator if you need it."
              actions={
                firstAllowed && (
                  <Link to={firstAllowed.id === "overview" ? "/dashboard" : `/dashboard/${firstAllowed.id}`} className="btn btn-primary btn-md">
                    Go to {firstAllowed.label}
                  </Link>
                )
              }
            />
          ) : (
            <>
              {level === "view" && (
                <p className="mb-6 flex items-center gap-2 border border-umber-100 bg-ivory-50 px-4 py-2.5 text-[12px] text-espresso-soft">
                  <Eye className="size-4 shrink-0 text-gold-700" aria-hidden="true" />
                  <span><strong className="font-semibold text-espresso">View only.</strong> Your role can look at {title} but not change it.</span>
                </p>
              )}
              <HeaderSlotContext.Provider value={level === "edit" ? headerSlot : null}>
                {/* The page inside the shell is a lazy chunk (see
                    DashboardPages.jsx). The boundary sits here rather than
                    around the whole route tree so the sidebar, header and title
                    above stay on screen while it loads — a spinner that blanks
                    the chrome turns a fast navigation into a full-page flash. */}
                <Suspense fallback={<RouteFallback />}>
                  <Outlet />
                </Suspense>
              </HeaderSlotContext.Provider>
            </>
          )}
        </main>
      </div>

      {/*
        Warned, not ambushed. Any real activity also cancels this — the dialog
        is for someone who has stepped away, not someone still typing. An
        in-progress product draft survives the sign-out regardless; that is
        what the draft dock is for.
      */}
      <ConfirmDialog
        open={warning}
        // Escape or the backdrop means someone is at the keyboard, so both
        // keep the session. Only the explicit button signs out.
        onClose={extend}
        onCancel={onIdle}
        onConfirm={extend}
        destructive={false}
        title="Still there?"
        description="For security, atelier sessions end after 30 minutes without activity. You will be signed out in about two minutes."
        confirmLabel="Keep working"
        cancelLabel="Sign out now"
      />
    </div>
  );
}
