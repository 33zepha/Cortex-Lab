import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui";
import { AppShell } from "@/components/shell/AppShell";
import { OverviewScreen } from "@/screens/OverviewScreen";
import { MissionsScreen } from "@/screens/MissionsScreen";
import { MissionDetailScreen } from "@/screens/MissionDetailScreen";
import { SystemScreen } from "@/screens/SystemScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import "@/styles/global.css";

import { VpsProvider } from "@/lib/VpsContext";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <VpsProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<OverviewScreen />} />
              <Route path="/missions" element={<MissionsScreen />} />
              <Route path="/missions/:id" element={<MissionDetailScreen />} />
              <Route path="/system" element={<SystemScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </VpsProvider>
  </StrictMode>,
);
