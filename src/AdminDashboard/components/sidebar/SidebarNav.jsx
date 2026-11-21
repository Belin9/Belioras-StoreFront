/* Admin Dashboard: SidebarNav */
import { Link, useLocation } from "react-router-dom";
import {
  CreditCard, FileBarChart, History, House, LayoutDashboard, Mail, Menu, Package, Percent, Ruler, Settings, ShieldCheck, ShoppingCart, Star, Tags, Truck, Users, Warehouse,
} from "lucide-react";

import { cn } from "../../../utils/cn";

const iconMap = {
  FileBarChart, History, House, LayoutDashboard, Package, Warehouse, Tags, Ruler, Menu, Star, ShoppingCart, CreditCard, Users, Percent, Mail, ShieldCheck, Truck, Settings,
};

export default function SidebarNav({ groups, badges = {}, collapsed, onNavigate }) {
  const { pathname } = useLocation();

  return (
    <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-2" aria-label="Dashboard">
      {groups.map((group) => (
        <div key={group.id} className="mb-2.5 last:mb-0">
          {group.label && (
            <p
              className={cn(
                "mb-1 px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory-50/30",
                // Hidden rather than removed when collapsed: a screen reader
                // still benefits from the grouping.
                collapsed && "lg:sr-only",
              )}
            >
              {group.label}
            </p>
          )}

          <ul className="space-y-px">
            {group.items.map((item) => {

              const Icon = iconMap[item.icon];

              const to = item.id === "overview" ? "/dashboard" : `/dashboard/${item.id}`;

              const isActive =
                item.id === "overview" ? pathname === "/dashboard" : pathname.startsWith(to);

              return (
                <li key={item.id}>
                  <Link
                    to={to}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    // The label is the accessible name when it is visible;
                    // collapsed, the title carries it instead.
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "liquid-row relative flex items-center gap-3 py-[7px] text-[13px] tracking-[0.04em] transition-colors",
                      collapsed ? "px-4 lg:justify-center lg:px-0" : "px-4",
                      isActive
                        ? "text-gold-400"
                        : "text-ivory-50/55 hover:bg-ivory-50/5 hover:text-ivory-50",
                    )}
                  >
                    {isActive && (
                      <span aria-hidden="true" className="absolute inset-y-2 left-0 w-px bg-gold-500" />
                    )}
                    <Icon className="liquid-glyph size-[18px] shrink-0" strokeWidth={1.5} aria-hidden="true" />
                    <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                    {badges[item.id] > 0 && (
                      <span
                        aria-label={`${badges[item.id]} waiting`}
                        className={cn(
                          "ml-auto min-w-5 rounded-full bg-gold-500 px-1.5 text-center text-[10px] font-semibold leading-5 tabular-nums text-espresso",
                          // Collapsed to icons, the count becomes a dot on the icon.
                          collapsed && "lg:absolute lg:right-4 lg:top-1.5 lg:size-2 lg:min-w-0 lg:p-0 lg:text-[0px]",
                        )}
                      >
                        {badges[item.id]}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
