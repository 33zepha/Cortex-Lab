import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FlaskConical, RotateCcw, X } from "lucide-react";
import {
  isOperatorSimulatorEnabled,
  leaveOperatorSimulator,
  resetOperatorSimulator,
} from "@/lib/operator-simulator";

export function OperatorModeBar() {
  const location = useLocation();
  const [enabled, setEnabled] = useState(() => isOperatorSimulatorEnabled());

  useEffect(() => {
    setEnabled(isOperatorSimulatorEnabled());
    const timer = window.setTimeout(() => setEnabled(isOperatorSimulatorEnabled()), 50);
    return () => window.clearTimeout(timer);
  }, [location.key, location.search]);

  if (!enabled) return null;

  return (
    <aside
      aria-label="Mode de données"
      className="relative z-panel flex min-h-10 w-full shrink-0 items-center justify-center gap-2 border-b border-white/[0.065] bg-[#121613] px-2 text-[#efeee9]"
    >
      <FlaskConical className="size-3.5 shrink-0 text-[#d8c59a]" strokeWidth={2.8} aria-hidden />
      <span className="whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.12em]">
        Scénario opérateur
      </span>
      <span className="h-3 w-px bg-white/10" aria-hidden />
      <button
        type="button"
        onClick={resetOperatorSimulator}
        className="flex size-8 items-center justify-center rounded-[8px] text-[#efeee9]/58 transition-colors hover:bg-white/[0.07] hover:text-[#efeee9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
        aria-label="Réinitialiser le scénario"
      >
        <RotateCcw className="size-3.5" strokeWidth={2.8} aria-hidden />
      </button>
      <button
        type="button"
        onClick={leaveOperatorSimulator}
        className="flex size-8 items-center justify-center rounded-[8px] text-[#efeee9]/58 transition-colors hover:bg-white/[0.07] hover:text-[#efeee9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
        aria-label="Quitter le scénario"
      >
        <X className="size-4" strokeWidth={2.8} aria-hidden />
      </button>
    </aside>
  );
}
