import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CircleStop,
  MessageSquarePlus,
  Pause,
  Play,
  RefreshCw,
  Send,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui";
import { apiPost } from "@/lib/api";
import { getOperationalMission } from "@/lib/operator-contract";
import { ROUTES } from "@/lib/routes";
import type { Mission } from "@/lib/types";
import { cn } from "@/lib/cn";

type ControlCommand = "pause" | "resume" | "retry" | "instruction";

export function MissionControlBar({
  mission,
  onChanged,
}: {
  mission: Mission;
  onChanged: () => void;
}) {
  const navigate = useNavigate();
  const view = getOperationalMission(mission);
  const [busy, setBusy] = useState<ControlCommand | "cancel" | null>(null);
  const [instructionOpen, setInstructionOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function runCommand(command: ControlCommand, extra: Record<string, unknown> = {}) {
    setBusy(command);
    setError(null);
    try {
      const nextMission = await apiPost<Mission>(`/api/missions/${mission.id}/commands`, {
        command,
        ...extra,
      });
      if (command === "retry" && nextMission.id !== mission.id) {
        navigate(ROUTES.missionDetail(nextMission.id));
      } else {
        onChanged();
      }
      if (command === "instruction") {
        setInstruction("");
        setInstructionOpen(false);
      }
    } catch (commandError) {
      setError(commandError instanceof Error ? commandError.message : String(commandError));
    } finally {
      setBusy(null);
    }
  }

  async function cancelMission() {
    setBusy("cancel");
    setError(null);
    try {
      await apiPost<Mission>(`/api/missions/${mission.id}/cancel`, {
        reason: "Arrêt demandé depuis Cortex",
      });
      onChanged();
    } catch (commandError) {
      setError(commandError instanceof Error ? commandError.message : String(commandError));
    } finally {
      setBusy(null);
    }
  }

  const controls = [
    view.capabilities.canPause && {
      id: "pause" as const,
      label: "Pause",
      icon: Pause,
      onClick: () => runCommand("pause"),
    },
    view.capabilities.canResume && {
      id: "resume" as const,
      label: "Reprendre",
      icon: Play,
      onClick: () => runCommand("resume"),
    },
    view.capabilities.canRetry && {
      id: "retry" as const,
      label: "Réessayer",
      icon: RefreshCw,
      onClick: () => runCommand("retry"),
    },
    view.capabilities.canAddInstruction && {
      id: "instruction" as const,
      label: "Instruction",
      icon: MessageSquarePlus,
      onClick: () => setInstructionOpen(true),
    },
  ].filter(Boolean) as {
    id: ControlCommand;
    label: string;
    icon: typeof Pause;
    onClick: () => void;
  }[];

  if (controls.length === 0 && !view.capabilities.canCancel) return null;

  return (
    <>
      <div className="relative mt-5">
        <div className="flex min-h-[58px] items-center gap-1.5 overflow-x-auto rounded-[17px] border border-white/[0.08] bg-[#131714]/95 p-1.5 text-[#efeee9] shadow-[0_20px_42px_-28px_rgba(0,0,0,0.95)] backdrop-blur-xl laptop:inline-flex laptop:min-h-0 laptop:rounded-[15px]">
          {controls.map(({ id, label, icon: Icon, onClick }) => (
            <button
              key={id}
              type="button"
              onClick={onClick}
              disabled={busy !== null}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[11px] px-3.5 text-[11px] font-bold text-[#efeee9]/78 transition-colors hover:bg-white/[0.065] hover:text-[#efeee9] active:bg-white/[0.09] disabled:opacity-40"
            >
              <Icon className={cn("size-4", busy === id && "animate-pulse")} strokeWidth={2.8} aria-hidden />
              <span>{busy === id ? "En cours…" : label}</span>
            </button>
          ))}

          {view.capabilities.canCancel && (
            <>
              <span className="mx-0.5 h-7 w-px shrink-0 bg-white/10" aria-hidden />
              <button
                type="button"
                onClick={cancelMission}
                disabled={busy !== null}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[11px] px-3.5 text-[11px] font-bold text-[#e8a29a] transition-colors hover:bg-[#7f2d26]/28 hover:text-[#ffd3cd] active:bg-[#7f2d26]/38 disabled:opacity-40"
              >
                <CircleStop className="size-4" strokeWidth={2.8} aria-hidden />
                <span>{busy === "cancel" ? "Arrêt…" : "Arrêter"}</span>
              </button>
            </>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-2 rounded-[10px] border border-error/20 bg-[#f7f6f1] px-3 py-2 text-[10.5px] font-bold text-error">
            {error}
          </p>
        )}
      </div>

      <Dialog open={instructionOpen} onOpenChange={(open) => !busy && setInstructionOpen(open)}>
        <DialogContent
          title="Ajouter une instruction"
          description="L'instruction est ajoutée au run courant et conservée dans sa chronologie."
          className="tablet:max-w-[520px]"
        >
          <label htmlFor="operator-instruction" className="text-[10px] font-bold uppercase tracking-[0.11em] text-text-primary">
            Instruction opérateur
          </label>
          <textarea
            id="operator-instruction"
            autoFocus
            rows={6}
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            placeholder="Ex : conserve la structure actuelle, vérifie d'abord le comportement à 375 px puis poursuis."
            className="mt-2 w-full resize-none rounded-[15px] border border-black/[0.08] bg-[#f7f6f1] px-4 py-3 text-[16px] font-semibold leading-relaxed text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/10"
          />
          <div className="mt-4 flex items-center justify-end gap-2 border-t border-black/[0.06] pt-4">
            <button
              type="button"
              onClick={() => setInstructionOpen(false)}
              className="min-h-11 rounded-[11px] px-4 text-[12px] font-bold text-text-secondary hover:bg-black/[0.035]"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={instruction.trim().length < 4 || busy !== null}
              onClick={() => runCommand("instruction", { instruction: instruction.trim() })}
              className="inline-flex min-h-11 items-center gap-2 rounded-[11px] bg-[#141815] px-4 text-[12px] font-bold text-[#efeee9] disabled:opacity-35"
            >
              <Send className="size-4" strokeWidth={2.8} aria-hidden />
              Envoyer au run
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
