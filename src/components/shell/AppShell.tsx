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
    <div className="relative isolate flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Fond neutre, plat */}
      <div className="app-ambient-bg absolute inset-0 z-0" />

      <div className="relative z-10 flex h-full w-full items-center p-4 laptop:p-6">
        <div className="hidden laptop:block fixed left-4 top-1/2 -translate-y-1/2 z-sticky">
          <motion.div 
            ref={containerRef}
            layout
            className="relative flex items-start"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          >
            <div className="relative z-20 rounded-[24px] bg-white/60 backdrop-blur-3xl border border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.08)]">
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
                  animate={{ opacity: 1, width: 160, x: 0, marginLeft: 8 }}
                  exit={{ opacity: 0, width: 0, x: -40, marginLeft: 0 }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  className="relative z-10 overflow-hidden mt-3 rounded-[20px] bg-white/30 backdrop-blur-xl border border-white/40 shadow-[inset_0_1px_4px_rgba(255,255,255,0.4)]"
                >
                  <Orbit isOpen={true} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        
        <div 
          className={cn(
            "flex h-full w-full items-center justify-center transition-all duration-[500ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]",
            "laptop:pl-[96px]"
          )}
        >
          <main
            className={cn(
              "relative flex w-full max-w-[1400px] flex-col overflow-hidden",
              "rounded-[32px] border border-white/40 bg-white/20 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)]",
              "h-[calc(100vh-32px)] laptop:h-[calc(100vh-48px)]"
            )}
          >
            <div className="flex-1 overflow-y-auto scrollbar-thin p-6 laptop:p-10">
              <Outlet />
            </div>
          </main>
        </div>
        
        <MobileNav onOpenPalette={() => setPaletteOpen(true)} />
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
    </div>
  );
}
