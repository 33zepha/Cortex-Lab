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
  "flex size-11 shrink-0 items-center justify-center rounded-full transition-all duration-[400ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]";
const pillInactiveClasses = cn(
  "text-text-secondary hover:text-text-primary active:scale-[0.92]",
  LIQUID_GLASS_HOVER,
);

/**
 * Icônes seules (pas de label permanent) — le rail desktop équivalent (IconRail) est déjà
 * icon-only ; 5 items avec labels texte dépassaient la largeur d'un iPhone standard (375-390px).
 * `aria-label` conserve l'accessibilité malgré l'absence de texte visible.
 */
export function MobileNav({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <nav
      className="fixed bottom-4 left-1/2 z-sticky flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/80 bg-surface-1/90 px-2 py-2 shadow-lg shadow-black/10 backdrop-blur-xl laptop:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
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
          <Icon className="size-[19px]" aria-hidden />
        </NavLink>
      ))}
      <button
        type="button"
        onClick={onOpenPalette}
        aria-label="Rechercher"
        className={cn(pillBaseClasses, pillInactiveClasses)}
      >
        <Search strokeWidth={2.5} className="size-[19px]" aria-hidden />
      </button>
      <NavLink
        to="/profile"
        aria-label="Profil"
        className={({ isActive }) => cn(pillBaseClasses, isActive ? LIQUID_GLASS_ACTIVE : pillInactiveClasses)}
      >
        <UserIcon className="size-[19px]" aria-hidden />
      </NavLink>
    </nav>
  );
}
