import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui";
import { AuthGate } from "@/components/auth/AuthGate";
import "@/styles/global.css";

import { VpsProvider } from "@/lib/VpsContext";

const AppShell = lazy(() => import("@/components/shell/AppShell").then(({ AppShell: component }) => ({ default: component })));
const AuthScreen = lazy(() => import("@/screens/AuthScreen").then(({ AuthScreen: component }) => ({ default: component })));
const OverviewScreen = lazy(() => import("@/screens/OverviewScreen").then(({ OverviewScreen: component }) => ({ default: component })));
const MissionsScreen = lazy(() => import("@/screens/MissionsScreen").then(({ MissionsScreen: component }) => ({ default: component })));
const MissionDetailScreen = lazy(() => import("@/screens/MissionDetailScreen").then(({ MissionDetailScreen: component }) => ({ default: component })));
const ConsoleScreen = lazy(() => import("@/screens/ConsoleScreen").then(({ ConsoleScreen: component }) => ({ default: component })));
const SystemScreen = lazy(() => import("@/screens/SystemScreen").then(({ SystemScreen: component }) => ({ default: component })));
const ProfileScreen = lazy(() => import("@/screens/ProfileScreen").then(({ ProfileScreen: component }) => ({ default: component })));

function LoadingScreen({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`flex min-h-[100dvh] items-center justify-center text-[10px] font-semibold uppercase tracking-[0.16em] ${dark ? "bg-[#121713] text-[#d9d1bd]/55" : "bg-slate-50 text-slate-500"}`}
      role="status"
      aria-live="polite"
    >
      Loading Cortex
    </div>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <TooltipProvider>
      <BrowserRouter>
        <VpsProvider>
          <Routes>
            <Route path="/login" element={<Suspense fallback={<LoadingScreen dark />}><AuthScreen initialMode="login" /></Suspense>} />
            <Route path="/signup" element={<Suspense fallback={<LoadingScreen dark />}><AuthScreen initialMode="signup" /></Suspense>} />
            <Route element={<AuthGate />}>
              <Route element={<Suspense fallback={<LoadingScreen />}><AppShell /></Suspense>}>
                <Route path="/" element={<Suspense fallback={<LoadingScreen />}><OverviewScreen /></Suspense>} />
                <Route path="/missions" element={<Suspense fallback={<LoadingScreen />}><MissionsScreen /></Suspense>} />
                <Route path="/missions/:id" element={<Suspense fallback={<LoadingScreen />}><MissionDetailScreen /></Suspense>} />
                <Route path="/console" element={<Suspense fallback={<LoadingScreen />}><ConsoleScreen /></Suspense>} />
                <Route path="/system" element={<Suspense fallback={<LoadingScreen />}><SystemScreen /></Suspense>} />
                <Route path="/profile" element={<Suspense fallback={<LoadingScreen />}><ProfileScreen /></Suspense>} />
              </Route>
            </Route>
          </Routes>
        </VpsProvider>
      </BrowserRouter>
    </TooltipProvider>
  </StrictMode>,
);
