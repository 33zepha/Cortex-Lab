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
import { TRANSITION_SPRING } from "@/lib/ui-classes";

const navItems = [
  { to: ROUTES.home, label: "Overview", icon: Squares2X2Icon, end: true },
  { to: ROUTES.missions, label: "Missions", icon: RocketLaunchIcon, end: false },
  { to: ROUTES.console, label: "Console", icon: CommandLineIcon, end: false },
  { to: ROUTES.system, label: "System", icon: ServerStackIcon, end: false },
];

export function MobileNav({ onOpenPalette }: { onOpenPalette: () => void }) {
  const location = useLocation();

  const baseButtonClasses = cn(
    "cortex-nav-button relative flex size-10 mobile:size-11 items-center justify-center rounded-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101411]",
    TRANSITION_SPRING,
    "active:scale-[0.94] active:duration-150 active:ease-out",
  );

  return (
    <nav
      aria-label="Navigation mobile"
      className="mobile-nav-dock fixed left-1/2 z-sticky -translate-x-1/2 transition-opacity duration-150 laptop:hidden"
      style={{ bottom: "calc(10px + env(safe-area-inset-bottom))" }}
    >
      <div className="cortex-nav-surface flex items-center gap-1.5 rounded-[20px] p-1.5">
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
                <div className={baseButtonClasses} data-active={isActive ? "true" : "false"}>
                  <Icon className="size-[22px] mobile:size-[23px]" aria-hidden />
                </div>
              </NavLink>
            );
          })}
        </div>

        <div className="cortex-nav-divider mx-0.5 h-7 w-px rounded-full" />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenPalette}
            aria-label="Rechercher"
            className={baseButtonClasses}
            data-active="false"
          >
            <Search strokeWidth={2.7} className="size-[21px]" aria-hidden />
          </button>
          <NavLink
            to={ROUTES.profile}
            aria-label="Profil"
            className="relative flex items-center justify-center focus-visible:outline-none"
          >
            {({ isActive }) => (
              <div className={baseButtonClasses} data-active={isActive ? "true" : "false"}>
                <UserIcon className="size-[22px] mobile:size-[23px]" aria-hidden />
              </div>
            )}
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
