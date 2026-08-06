import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { IconRail } from "./IconRail";
import { Sidecar } from "./Sidecar";
import { MobileNav } from "./MobileNav";
import { CommandPalette } from "@/components/ui";

export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);

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
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <IconRail onOpenPalette={() => setPaletteOpen(true)} />
      <Sidecar />
      <main className="flex-1 overflow-y-auto scrollbar-thin pb-16 laptop:pb-0">
        <div className="mx-auto max-w-[1600px] px-4 py-6 tablet:px-6 laptop:px-8">
          <Outlet />
        </div>
      </main>
      <MobileNav onOpenPalette={() => setPaletteOpen(true)} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
