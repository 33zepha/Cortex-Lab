import { NavLink } from "react-router-dom";
import { Squares2X2Icon, RocketLaunchIcon, ServerStackIcon, UserIcon } from "@heroicons/react/24/solid";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import { LIQUID_GLASS_HOVER, LIQUID_GLASS_ACTIVE } from "@/lib/ui-classes";

const navItems = [
  { to: ROUTES.home, label: "Overview", icon: Squares2X2Icon, end: true },
  { to: ROUTES.missions, label: "Missions", icon: RocketLaunchIcon, end: false },
  { to: ROUTES.system, label: "System", icon: ServerStackIcon, end: false },
];

const pillBaseClasses =
  "flex flex-col items-center justify-center rounded-full px-4 py-2 text-[11px] font-medium transition-all duration-[400ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]";
const pillInactiveClasses = cn(
  "text-text-secondary hover:text-text-primary hover:scale-[1.02] active:scale-[0.96]",
  LIQUID_GLASS_HOVER,
);

export function MobileNav({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-sticky flex items-center gap-1 rounded-full border border-border/80 bg-surface-1/90 backdrop-blur-xl px-3 py-2 shadow-lg shadow-black/10 laptop:hidden">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          aria-label={label}
          className={({ isActive }) =>
            cn(pillBaseClasses, isActive ? LIQUID_GLASS_ACTIVE : pillInactiveClasses)
          }
        >
          <Icon className="size-[18px]" aria-hidden />
          <span className="mt-0.5">{label}</span>
        </NavLink>
      ))}
      <button
        type="button"
        onClick={onOpenPalette}
        aria-label="Rechercher"
        className={cn(pillBaseClasses, pillInactiveClasses)}
      >
        <Search strokeWidth={3} className="size-[18px]" aria-hidden />
        <span className="mt-0.5">Recherche</span>
      </button>
      <button type="button" aria-label="Profil" className={cn(pillBaseClasses, pillInactiveClasses)}>
        <UserIcon className="size-[18px]" aria-hidden />
        <span className="mt-0.5">Profil</span>
      </button>
    </nav>
  );
}
