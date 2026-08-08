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
  { to: ROUTES.home, label: "Accueil", icon: Squares2X2Icon, end: true },
  { to: ROUTES.missions, label: "Missions", icon: RocketLaunchIcon, end: false },
  { to: ROUTES.console, label: "Console", icon: CommandLineIcon, end: false },
  { to: ROUTES.system, label: "System", icon: ServerStackIcon, end: false },
];

export function Nexus({
  onOpenPalette,
  wingOpen,
  setWingOpen,
}: {
  onOpenPalette: () => void;
  wingOpen: boolean;
  setWingOpen: (open: boolean) => void;
}) {
  const location = useLocation();
  const baseButtonClasses = cn(
    "cortex-nav-button relative flex size-12 items-center justify-center rounded-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101411]",
    TRANSITION_SPRING,
    "hover:scale-[1.025] active:scale-[0.95] active:duration-150 active:ease-out",
  );

  return (
    <aside className="flex shrink-0 flex-col items-center gap-2 p-2.5">
      <nav className="flex flex-col items-center gap-2">
        {navItems.map(({ to, label, icon: Icon, end }) => {
          const isActive = end ? location.pathname === to : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={label}
              className="relative flex items-center justify-center focus-visible:outline-none"
              onClick={(e) => {
                if (isActive) {
                  e.preventDefault();
                  setWingOpen(!wingOpen);
                } else {
                  setWingOpen(true);
                }
              }}
            >
              {() => (
                <>
                  {isActive && (
                    <span
                      aria-hidden
                      className="cortex-nav-indicator absolute -left-2.5 top-1/2 size-[4px] -translate-y-1/2 rounded-full animate-in fade-in zoom-in duration-300"
                    />
                  )}
                  <div className={baseButtonClasses} data-active={isActive ? "true" : "false"}>
                    <Icon className="size-[22px]" aria-hidden />
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="cortex-nav-divider my-0.5 h-px w-8 rounded-full" />

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Rechercher"
          className={baseButtonClasses}
          data-active="false"
        >
          <Search strokeWidth={2.6} className="size-[21px]" aria-hidden />
        </button>
        <NavLink
          to={ROUTES.profile}
          aria-label="Profil"
          className="relative flex items-center justify-center focus-visible:outline-none"
        >
          {({ isActive }) => (
            <div className={baseButtonClasses} data-active={isActive ? "true" : "false"}>
              <UserIcon className="size-[22px]" aria-hidden />
            </div>
          )}
        </NavLink>
      </div>
    </aside>
  );
}
