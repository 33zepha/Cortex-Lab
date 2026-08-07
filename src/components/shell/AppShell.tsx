import { useEffect, useState, useRef } from "react";
import { Outlet, useLocation, useMatch } from "react-router-dom";
import { Nexus } from "./Nexus";
import { Orbit } from "./Orbit";
import { motion, AnimatePresence } from "framer-motion";
import { MobileNav } from "./MobileNav";
import { CommandPalette } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";

export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [wingOpen, setWingOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const missionMatch = useMatch("/missions/:id");

  const hasWingContent =
    location.pathname === ROUTES.home ||
    location.pathname.startsWith(ROUTES.missions) ||
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
    <div className="relative isolate flex h-[100dvh] min-h-0 w-screen overflow-hidden bg-slate-50">
      {/* Fond neutre, plat */}
      <div className="app-ambient-bg absolute inset-0 z-0" />

      <div className="relative z-10 flex h-full min-h-0 w-full items-stretch p-0 laptop:items-center laptop:p-6">
        <div className="fixed left-4 top-1/2 z-sticky hidden -translate-y-1/2 laptop:block">
          <motion.div
            ref={containerRef}
            layout
            className="relative flex items-start"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          >
            <div className="relative z-20 rounded-[24px] border border-white/60 bg-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.08)] backdrop-blur-3xl">
              <Nexus
                onOpenPalette={() => setPaletteOpen(true)}
                wingOpen={wingOpen}
                setWingOpen={setWingOpen}
              />
            </div>

            <AnimatePresence>
              {showWing && (
                <motion.div
                  initial={{ opacity: 0, width: 0, x: -40, marginLeft: 0 }}
                  animate={{ opacity: 1, width: 160, x: 0, marginLeft: 12 }}
                  exit={{ opacity: 0, width: 0, x: -40, marginLeft: 0 }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  className="relative z-10 overflow-hidden rounded-[24px] border border-white/60 bg-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.08)] backdrop-blur-3xl"
                >
                  <Orbit isOpen={true} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div
          className={cn(
            "flex h-full min-h-0 w-full items-stretch justify-center transition-all duration-[500ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] laptop:items-center",
            "laptop:pl-[96px]",
          )}
        >
          <motion.main
            layout="position"
            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
            className={cn(
              "relative flex h-full min-h-0 w-full max-w-[1400px] flex-col overflow-hidden will-change-transform",
              "rounded-none border-0 bg-transparent shadow-none",
              "laptop:h-fit laptop:max-h-[calc(100vh-48px)] laptop:rounded-[32px] laptop:border laptop:border-white/40 laptop:bg-white/20 laptop:shadow-[0_8px_32px_rgba(0,0,0,0.04)] laptop:backdrop-blur-2xl",
            )}
          >
            <div className="mobile-content-scroll w-full flex-1 overscroll-contain overflow-y-auto px-4 pt-[calc(14px+env(safe-area-inset-top))] pb-[calc(92px+env(safe-area-inset-bottom))] mobile:px-5 laptop:p-10 laptop:scrollbar-thin">
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
