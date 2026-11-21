/* Admin Dashboard: ViewToggle */
import { LayoutGrid, List } from "lucide-react";

import { cn } from "@/utils/cn";

const VIEWS = [
  { id: "cards", label: "Cards", icon: LayoutGrid },
  { id: "list", label: "List", icon: List },
];

export default function ViewToggle({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="View" className="inline-flex border border-umber-50 bg-ivory-50 p-0.5">
      {VIEWS.map((v) => {
        const on = value === v.id;
        return (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(v.id)}
            className={cn(
              "flex h-9 items-center gap-1.5 px-3 text-[11px] uppercase tracking-[0.14em] transition-colors",
              on ? "bg-espresso text-ivory-50" : "text-espresso-soft hover:text-espresso",
            )}
          >
            <v.icon className="size-3.5" aria-hidden="true" />
            {v.label}
          </button>
        );
      })}
    </div>
  );
}
