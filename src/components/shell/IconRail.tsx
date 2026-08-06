import { NavLink } from "react-router-dom";
import { LayoutGrid, ListChecks, Activity, Search } from "lucide-react";
import { CortexMark } from "@/components/brand/CortexMark";
import { cn } from "@/lib/cn";
import { Tooltip } from "@/components/ui";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/missions", label: "Missions", icon: ListChecks, end: false },
  { to: "/system", label: "System", icon: Activity, end: false },
];

export function IconRail({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <aside className="hidden laptop:flex laptop:w-16 shrink-0 flex-col items-center border-r border-border bg-surface-1 py-3">
      <NavLink
        to="/"
        aria-label="CortexLab — Overview"
        className="mb-3 flex size-10 items-center justify-center rounded-md text-text-primary transition-colors duration-fast ease-standard hover:bg-surface-2"
      >
        <CortexMark className="h-7 w-auto" />
      </NavLink>

      <Tooltip content="Rechercher (⌘K)" side="right">
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Rechercher"
          className={cn(
            "mb-3 flex size-10 items-center justify-center rounded-md text-text-muted",
            "transition-colors duration-fast ease-standard hover:bg-surface-2 hover:text-text-secondary",
          )}
        >
          <Search className="size-4" aria-hidden />
        </button>
      </Tooltip>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <Tooltip key={to} content={label} side="right">
            <NavLink
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) =>
                cn(
                  "flex size-10 items-center justify-center rounded-md",
                  "transition-colors duration-fast ease-standard",
                  isActive
                    ? "bg-accent-indigo-muted text-accent-indigo"
                    : "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
                )
              }
            >
              <Icon className="size-4.5" aria-hidden />
            </NavLink>
          </Tooltip>
        ))}
      </nav>

      <Tooltip content="Cortex opérationnel" side="right">
        <span className="flex size-10 items-center justify-center" aria-label="Cortex opérationnel">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
        </span>
      </Tooltip>
    </aside>
  );
}
