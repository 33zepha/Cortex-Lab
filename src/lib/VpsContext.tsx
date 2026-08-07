import React, { createContext, useContext, useState, ReactNode } from "react";

export interface VpsData {
  ip: string;
  sshId: string;
  sshKey: string;
  connectedAt: number;
}

interface VpsContextType {
  vps: VpsData | null;
  connectVps: (data: Omit<VpsData, "connectedAt">) => void;
  disconnectVps: () => void;
}

const VpsContext = createContext<VpsContextType | undefined>(undefined);

export function VpsProvider({ children }: { children: ReactNode }) {
  const [vps, setVps] = useState<VpsData | null>(null);

  const connectVps = (data: Omit<VpsData, "connectedAt">) => {
    setVps({
      ...data,
      connectedAt: Date.now(),
    });
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
