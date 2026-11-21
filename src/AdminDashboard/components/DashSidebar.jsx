/* Admin Dashboard: DashSidebar */
import { ChevronLeft, X } from "lucide-react";

import BrandMark from "../../components/shared/BrandMark";
import { useStaffAuth } from "@/context/auth/useAuthRealm";
import { cn } from "../../utils/cn";
import { DASHBOARD_NAV_GROUPS } from "../lib/constants";
import SidebarNav from "./sidebar/SidebarNav";
import SidebarFooter from "./sidebar/SidebarFooter";

export default function DashSidebar({ badges = {}, isOpen, onClose, collapsed, onToggleCollapsed }) {
  const { user, can } = useStaffAuth();

  // A group whose every item is out of reach for this role disappears with it.
  const groups = DASHBOARD_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(item.id)),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-espresso/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-espresso text-ivory-50",
          "transition-[transform,width] duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          // The drawer keeps its full width on a phone whatever the desktop
          // preference is; only the lg width responds to it.
          collapsed ? "w-64 lg:w-[72px]" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center border-b border-ivory-50/10 py-3.5",
            collapsed ? "justify-between px-4 lg:justify-center lg:px-0" : "justify-between px-6",
          )}
        >
          <BrandMark
            label="Belioras — storefront"
            size={collapsed ? "sm" : "md"}
            className={collapsed ? "lg:h-8" : undefined}
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="liquid-hover rounded-full p-1 text-ivory-50/50 transition-colors hover:text-ivory-50 lg:hidden"
          >
            <X className="liquid-icon size-5" aria-hidden="true" />
          </button>
        </div>

        {/* On the edge, halfway down, so it is found where the sidebar ends
            rather than below the account block. Desktop only: the phone
            drawer closes with its X. */}
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "absolute right-0 top-1/2 z-10 hidden size-9 -translate-y-1/2 translate-x-1/2 items-center justify-center",
            // Gold rather than the sidebar's espresso, so the tab stands apart from it.
            "liquid-hover rounded-full bg-gold-400 text-espresso shadow-md transition-colors lg:flex",
            "hover:bg-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400",
            // A larger hit area than the tab itself.
            "after:absolute after:-inset-2 after:content-['']",
          )}
        >
          <ChevronLeft
            className={cn("size-5 transition-transform duration-300 motion-reduce:transition-none", collapsed && "rotate-180")}
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>

        <SidebarNav groups={groups} badges={badges} collapsed={collapsed} onNavigate={onClose} />

        <SidebarFooter user={user} collapsed={collapsed} />
      </aside>
    </>
  );
}
