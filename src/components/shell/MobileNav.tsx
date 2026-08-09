import { NavLink, useLocation } from "react-router-dom";
import {
  Squares2X2Icon,
  RocketLaunchIcon,
  CommandLineIcon,
  ServerStackIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import { TRANSITION_SPRING, LIQUID_GLASS_HOVER, LIQUID_GLASS_ACTIVE } from "@/lib/ui-classes";

const navItems = [
  { to: ROUTES.home, label: "Overview", icon: Squares2X2Icon, end: true },
  { to: ROUTES.missions, label: "Missions", icon: RocketLaunchIcon, end: false },
  { to: ROUTES.console, label: "Console", icon: CommandLineIcon, end: false },
  { to: ROUTES.system, label: "System", icon: ServerStackIcon, end: false },
];

export function MobileNav({ onOpenPalette }: { onOpenPalette: () => void }) {
  const location = useLocation();

  const baseButtonClasses = cn(
    "relative flex size-10 mobile:size-11 items-center justify-center rounded-[13px] text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo focus-visible:ring-offset-2",
    TRANSITION_SPRING,
    "hover:scale-[1.03] hover:text-text-primary",
    LIQUID_GLASS_HOVER,
    "active:scale-[0.93] active:duration-150 active:ease-out",
  );

  return (
    <nav
      aria-label="Navigation mobile"
      className="mobile-nav-dock fixed left-1/2 z-sticky -translate-x-1/2 transition-opacity duration-150 laptop:hidden"
      style={{ bottom: "calc(10px + env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-1.5 rounded-[22px] border border-white/65 bg-white/68 p-1.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] backdrop-blur-3xl">
        <div className="flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => {
            const isActive = end ? location.pathname === to : location.pathname.startsWith(to);

            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                aria-label={label}
                className="relative flex items-center justify-center focus-visible:outline-none"
              >
                <div
                  className={cn(
                    baseButtonClasses,
                    isActive && LIQUID_GLASS_ACTIVE,
                    isActive && "text-text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_5px_14px_-8px_rgba(0,0,0,0.3)]",
                  )}
                >
                  <Icon className="size-[22px] mobile:size-[23px]" aria-hidden />
                </div>
              </NavLink>
            );
          })}
        </div>

        <div className="mx-0.5 h-7 w-px rounded-full bg-black/[0.08]" />

        <div className="flex items-center gap-1">
          <button type="button" onClick={onOpenPalette} aria-label="Rechercher" className={baseButtonClasses}>
            <Search strokeWidth={3.2} className="size-[22px]" aria-hidden />
          </button>
          <NavLink
            to={ROUTES.profile}
            aria-label="Profil"
            className={({ isActive }) => cn(baseButtonClasses, isActive && LIQUID_GLASS_ACTIVE, isActive && "text-text-primary")}
          >
            <UserIcon className="size-[22px] mobile:size-[23px]" aria-hidden />
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
