import { NavLink, useLocation } from "react-router-dom";
import { Squares2X2Icon, RocketLaunchIcon, ServerStackIcon, UserIcon } from "@heroicons/react/24/solid";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import { TRANSITION_SPRING, LIQUID_GLASS_HOVER, LIQUID_GLASS_ACTIVE } from "@/lib/ui-classes";

const navItems = [
  { to: ROUTES.home, label: "Overview", icon: Squares2X2Icon, end: true },
  { to: ROUTES.missions, label: "Missions", icon: RocketLaunchIcon, end: false },
  { to: ROUTES.system, label: "System", icon: ServerStackIcon, end: false },
];

export function MobileNav({ onOpenPalette }: { onOpenPalette: () => void }) {
  const location = useLocation();

  const baseButtonClasses = cn(
    "relative flex size-11 mobile:size-12 items-center justify-center rounded-[14px] text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo focus-visible:ring-offset-2",
    TRANSITION_SPRING,
    "hover:scale-[1.04] hover:text-text-primary",
    LIQUID_GLASS_HOVER,
    "active:scale-[0.94] active:duration-150 active:ease-out",
  );

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed left-1/2 z-sticky -translate-x-1/2 laptop:hidden"
      style={{ bottom: "calc(12px + env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-2 rounded-[24px] border border-white/60 bg-white/60 p-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.09)] backdrop-blur-3xl">
        <div className="flex items-center gap-2">
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
                <div className={cn(baseButtonClasses, isActive && LIQUID_GLASS_ACTIVE)}>
                  <Icon className="size-[22px]" aria-hidden />
                </div>
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute -bottom-1.5 left-1/2 size-[5px] -translate-x-1/2 rounded-full bg-text-primary/80"
                  />
                )}
              </NavLink>
            );
          })}
        </div>

        <div className="mx-0.5 h-8 w-px rounded-full bg-black/[0.08]" />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPalette}
            aria-label="Rechercher"
            className={baseButtonClasses}
          >
            <Search strokeWidth={3} className="size-[22px]" aria-hidden />
          </button>
          <button type="button" aria-label="Profil" className={baseButtonClasses}>
            <UserIcon className="size-[22px]" aria-hidden />
          </button>
        </div>
      </div>
    </nav>
  );
}
