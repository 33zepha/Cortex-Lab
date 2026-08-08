import { useEffect, useState, useRef } from "react";
import { Outlet, useLocation, useMatch } from "react-router-dom";
import { Nexus } from "./Nexus";
import { Orbit } from "./Orbit";
import { motion, AnimatePresence } from "framer-motion";
import { MobileNav } from "./MobileNav";
import { CommandPalette } from "@/components/ui";
import { OperatorModeBar } from "@/components/operator/OperatorModeBar";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import "@/styles/app-continuity.css";

export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [wingOpen, setWingOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const missionMatch = useMatch("/missions/:id");

  const hasWingContent =
    location.pathname === ROUTES.home ||
    location.pathname.startsWith(ROUTES.missions) ||
    location.pathname === ROUTES.console ||
    location.pathname === ROUTES.system ||
    Boolean(missionMatch);

  const showWing = hasWingContent && wingOpen;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wingOpen &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setWingOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wingOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="cortex-app-shell relative isolate flex h-full min-h-0 w-screen overflow-hidden">
      <div className="relative z-10 flex h-full min-h-0 w-full items-stretch p-0 laptop:items-center laptop:p-6">
        <div className="fixed left-4 top-1/2 z-sticky hidden -translate-y-1/2 laptop:block">
          <motion.div
            ref={containerRef}
            layout
            className="relative flex items-start"
            transition={{ type: "spring", stiffness: 410, damping: 34, mass: 0.78 }}
          >
            <div className="cortex-nav-surface relative z-20 rounded-[22px]">
              <Nexus
                onOpenPalette={() => setPaletteOpen(true)}
                wingOpen={wingOpen}
                setWingOpen={setWingOpen}
              />
            </div>

            <AnimatePresence mode="popLayout">
              {showWing && (
                <motion.div
                  initial={{ opacity: 0, width: 0, x: -22, marginLeft: 0 }}
                  animate={{ opacity: 1, width: 160, x: 0, marginLeft: 10 }}
                  exit={{ opacity: 0, width: 0, x: -16, marginLeft: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 35, mass: 0.74 }}
                  className="cortex-wing-surface relative z-10 overflow-hidden rounded-[22px]"
                >
                  <Orbit isOpen={true} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div
          className={cn(
            "flex h-full min-h-0 w-full items-stretch justify-center transition-[padding] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] laptop:items-center",
            "laptop:pl-[96px]",
          )}
        >
          <motion.main
            layout="position"
            transition={{ type: "spring", stiffness: 430, damping: 38, mass: 0.72 }}
            className={cn(
              "cortex-app-main relative flex h-full min-h-0 w-full max-w-[1400px] flex-col overflow-hidden",
              "rounded-none border-0",
              "laptop:h-fit laptop:max-h-[calc(100vh-48px)] laptop:rounded-[28px] laptop:border",
            )}
          >
            <OperatorModeBar />
            <div className="mobile-content-scroll relative z-[1] w-full flex-1 overscroll-contain overflow-y-auto laptop:p-10 laptop:scrollbar-thin">
              <Outlet />
            </div>
          </motion.main>
        </div>

        <MobileNav onOpenPalette={() => setPaletteOpen(true)} />
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
    </div>
  );
}
