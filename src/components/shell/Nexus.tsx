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
  { to: ROUTES.home, label: "Accueil", icon: Squares2X2Icon, end: true },
  { to: ROUTES.missions, label: "Missions", icon: RocketLaunchIcon, end: false },
  { to: ROUTES.console, label: "Console", icon: CommandLineIcon, end: false },
  { to: ROUTES.system, label: "System", icon: ServerStackIcon, end: false },
];

export function Nexus({ 
  onOpenPalette,
  wingOpen,
  setWingOpen
}: { 
  onOpenPalette: () => void;
  wingOpen: boolean;
  setWingOpen: (open: boolean) => void;
}) {
  const location = useLocation();
  // Scale up slightly on hover, scale down firmly on click — feel serein, minimaliste, "Apple-like".
  const baseButtonClasses = cn(
    "relative flex size-12 items-center justify-center rounded-[14px] text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo focus-visible:ring-offset-2",
    TRANSITION_SPRING,
    "hover:scale-[1.04] hover:text-text-primary",
    LIQUID_GLASS_HOVER,
    "active:scale-[0.94] active:duration-150 active:ease-out"
  );

  const dockContainerClasses = cn(
    "p-2.5 gap-2"
  );

  return (
    <aside
      className={cn(
        "flex flex-col items-center shrink-0",
        dockContainerClasses
      )}
    >
        {/* Navigation principale */}
        <nav className="flex flex-col items-center gap-2">
          {navItems.map(({ to, label, icon: Icon, end }) => {
            const isActive = end 
              ? location.pathname === to 
              : location.pathname.startsWith(to);

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
                    {/* Pastille macOS minimaliste */}
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute -left-2.5 top-1/2 -translate-y-1/2 size-[5px] rounded-full bg-text-primary/80 animate-in fade-in zoom-in duration-[400ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                      />
                    )}
                    <div
                      className={cn(baseButtonClasses, isActive && LIQUID_GLASS_ACTIVE)}
                    >
                      <Icon className="size-[22px]" />
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="h-[1px] w-8 bg-black/[0.08] my-0.5 rounded-full" />

        {/* Actions additionnelles */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onOpenPalette}
            aria-label="Rechercher"
            className={baseButtonClasses}
          >
            <Search strokeWidth={3} className="size-[22px]" />
          </button>
          <NavLink
            to={ROUTES.profile}
            aria-label="Profil"
            className={({ isActive }) => cn("relative flex items-center justify-center focus-visible:outline-none", isActive && "text-text-primary")}
          >
            {({ isActive }) => (
              <div className={cn(baseButtonClasses, isActive && LIQUID_GLASS_ACTIVE)}>
                <UserIcon className="size-[22px]" />
              </div>
            )}
          </NavLink>
        </div>
      </aside>
  );
}
