import { FlaskConical, RotateCcw, X } from "lucide-react";
import {
  isOperatorSimulatorEnabled,
  leaveOperatorSimulator,
  resetOperatorSimulator,
} from "@/lib/operator-simulator";

export function OperatorModeBar() {
  if (!isOperatorSimulatorEnabled()) return null;

  return (
    <aside
      aria-label="Mode de données"
      className="operator-mode-bar fixed left-1/2 top-[max(8px,env(safe-area-inset-top))] z-panel flex -translate-x-1/2 items-center gap-2 rounded-[12px] border border-white/[0.08] bg-[#121613]/95 px-2 py-1.5 text-[#efeee9] shadow-[0_14px_34px_-22px_rgba(0,0,0,0.9)] backdrop-blur-xl"
    >
      <FlaskConical className="size-3.5 shrink-0 text-[#d8c59a]" strokeWidth={2.8} aria-hidden />
      <span className="whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.12em]">
        Scénario opérateur
      </span>
      <span className="hidden h-3 w-px bg-white/10 mobile:block" aria-hidden />
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
