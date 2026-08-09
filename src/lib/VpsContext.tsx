import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { readWorkspaceSetup } from "@/lib/workspace";

export interface VpsData {
  ip: string;
  sshId: string;
  connectedAt: number;
}

interface VpsContextType {
  vps: VpsData | null;
  connectVps: (data: Omit<VpsData, "connectedAt">) => void;
  disconnectVps: () => void;
}

const VpsContext = createContext<VpsContextType | undefined>(undefined);
const LEGACY_VPS_STORAGE_KEY = "cortex.vps-connection";

export function VpsProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [vps, setVps] = useState<VpsData | null>(null);

  useEffect(() => {
    // Remove credentials written by pre-server-persistence builds. Never read them back.
    window.localStorage.removeItem(LEGACY_VPS_STORAGE_KEY);

    if (location.pathname === "/hero-lab" || location.pathname === "/login" || location.pathname === "/signup") {
      setVps(null);
      return;
    }

    let active = true;
    readWorkspaceSetup()
      .then((setup) => {
        if (!active || setup?.connection?.type !== "vps") return;
        setVps({
          ip: setup.connection.host,
          sshId: setup.connection.user,
          connectedAt: setup.savedAt,
        });
      })
      .catch(() => {
        // The auth gate owns the session state; an anonymous browser simply has no VPS context.
      });

    return () => {
      active = false;
    };
  }, [location.pathname]);

  const connectVps = (data: Omit<VpsData, "connectedAt">) => {
    setVps({ ...data, connectedAt: Date.now() });
  };

  const disconnectVps = () => {
    setVps(null);
  };

  return (
    <VpsContext.Provider value={{ vps, connectVps, disconnectVps }}>
      {children}
    </VpsContext.Provider>
  );
}

export function useVps() {
  const context = useContext(VpsContext);
  if (context === undefined) {
    throw new Error("useVps must be used within a VpsProvider");
  }
  return context;
}
