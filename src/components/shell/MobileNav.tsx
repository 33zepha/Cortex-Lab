import { NavLink } from "react-router-dom";
import { LayoutGrid, ListChecks, Activity, Search } from "lucide-react";
import { cn } from "@/lib/cn";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/missions", label: "Missions", icon: ListChecks, end: false },
  { to: "/system", label: "System", icon: Activity, end: false },
];

export function MobileNav({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-sticky flex items-center justify-around border-t border-border bg-surface-1/95 backdrop-blur laptop:hidden">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex min-w-16 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
              isActive ? "text-accent-indigo" : "text-text-muted",
            )
          }
        >
          <Icon className="size-5" aria-hidden />
          {label}
        </NavLink>
      ))}
      <button
        type="button"
        onClick={onOpenPalette}
        className="flex min-w-16 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-text-muted"
      >
        <Search className="size-5" aria-hidden />
        Recherche
      </button>
    </nav>
  );
}
