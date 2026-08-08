import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Bot,
  ChevronDown,
  Cpu,
  Gauge,
  Plus,
  Server,
  SlidersHorizontal,
} from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui";
import { apiPost } from "@/lib/api";
import { ROUTES } from "@/lib/routes";
import type { Mission } from "@/lib/types";
import { cn } from "@/lib/cn";

const textareaClasses =
  "w-full resize-none rounded-[15px] border border-black/[0.075] bg-[#f7f6f1]/82 px-4 py-3 text-[16px] font-semibold leading-relaxed text-text-primary placeholder:font-medium placeholder:text-text-muted/55 " +
  "transition-[border-color,background-color,box-shadow] duration-200 hover:bg-[#faf9f5] focus-visible:outline-none focus-visible:border-text-primary/16 focus-visible:bg-[#fbfaf6] focus-visible:ring-2 focus-visible:ring-text-primary/[0.06] disabled:opacity-45";

const selectClasses =
  "min-h-12 w-full appearance-none rounded-[13px] border border-black/[0.075] bg-[#f7f6f1]/82 px-3.5 py-2.5 text-[16px] font-bold tracking-[-0.01em] text-text-primary " +
  "transition-[border-color,background-color] duration-200 hover:bg-[#faf9f5] focus-visible:outline-none focus-visible:border-text-primary/16 focus-visible:ring-2 focus-visible:ring-text-primary/[0.06] disabled:opacity-45 laptop:text-[12px]";

const AGENT_OPTIONS = [
  { value: "antigravity", label: "Antigravity · Engineering" },
  { value: "claude", label: "Claude · Recherche et raisonnement" },
  { value: "codex", label: "Codex · Implémentation" },
  { value: "kimi", label: "Kimi · Contexte et exploration" },
];

const RUNTIME_OPTIONS = [
  { value: "auto", label: "Routage automatique" },
  { value: "cortex-vps", label: "Cortex VPS · eu-west" },
  { value: "local-worker", label: "Worker local · Tailscale" },
];

const MODEL_OPTIONS = [
  { value: "gpt-5.6", label: "GPT-5.6 · Planification" },
  { value: "gpt-5.6-sol", label: "GPT-5.6 Sol · Rapide" },
  { value: "gpt-5.6-terra", label: "GPT-5.6 Terra · Architecture" },
  { value: "gpt-5.6-luna", label: "GPT-5.6 Luna · Léger" },
  { value: "gpt-5.5", label: "GPT-5.5 · Pro" },
  { value: "claude-code", label: "Claude Code · Direct" },
];

const EFFORT_OPTIONS = [
  { value: "high", label: "Élevé · approfondi" },
  { value: "medium", label: "Moyen · équilibré" },
  { value: "low", label: "Faible · direct" },
];

export function NewMissionDialog({ onCreated }: { onCreated: () => void }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [objective, setObjective] = useState("");
  const [constraints, setConstraints] = useState("");
  const [agentId, setAgentId] = useState("antigravity");
  const [runtimeId, setRuntimeId] = useState("auto");
  const [selectedModel, setSelectedModel] = useState("gpt-5.6");
  const [effort, setEffort] = useState("high");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = objective.trim().length >= 10 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const mission = await apiPost<Mission>("/api/missions", {
        objective: objective.trim(),
        constraints: constraints.trim() || undefined,
        agentId,
        runtimeId,
        model: selectedModel,
        effort,
      });
      setOpen(false);
      setObjective("");
      setConstraints("");
      onCreated();
      navigate(ROUTES.missionDetail(mission.id));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : String(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && setOpen(next)}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Nouvelle mission"
          className="group flex h-11 items-center justify-center gap-2 rounded-[13px] border border-white/[0.08] bg-[#141815] px-3 text-[#efeee9] shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_10px_24px_-18px_rgba(0,0,0,0.78)] transition-[background-color,transform,opacity] duration-200 hover:bg-[#1b201c] active:scale-[0.97] active:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/15 laptop:h-10 laptop:px-3.5"
        >
          <Plus className="size-[20px]" strokeWidth={3} aria-hidden />
          <span className="hidden text-[11px] font-bold tracking-[-0.01em] tablet:inline">Nouvelle mission</span>
        </button>
      </DialogTrigger>

      <DialogContent
        title="Nouvelle mission"
        description="Décrivez le résultat. Cortex choisit ensuite le plan, l'agent et le runtime."
        className="tablet:max-w-[600px]"
      >
        <div className="space-y-5">
          <section>
            <div className="mb-2 flex items-end justify-between gap-3">
              <label htmlFor="mission-objective" className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-primary">
                Objectif
              </label>
              <span className="text-[9.5px] font-semibold text-text-muted">10 caractères minimum</span>
            </div>
            <textarea
              id="mission-objective"
              className={textareaClasses}
              rows={5}
              autoFocus
              placeholder="Ex : auditer le parcours mobile, corriger les régressions et fournir les preuves de validation."
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              disabled={submitting}
            />
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <Bot className="size-4 text-text-primary" strokeWidth={2.8} aria-hidden />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-primary">Responsabilité</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2">
              <label className="min-w-0">
                <span className="mb-1.5 flex items-center gap-1.5 text-[9.5px] font-bold text-text-muted">
                  <Bot className="size-3.5" strokeWidth={2.8} aria-hidden /> Agent
                </span>
                <select className={selectClasses} value={agentId} onChange={(event) => setAgentId(event.target.value)} disabled={submitting}>
                  {AGENT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>

              <label className="min-w-0">
                <span className="mb-1.5 flex items-center gap-1.5 text-[9.5px] font-bold text-text-muted">
                  <Server className="size-3.5" strokeWidth={2.8} aria-hidden /> Runtime
                </span>
                <select className={selectClasses} value={runtimeId} onChange={(event) => setRuntimeId(event.target.value)} disabled={submitting}>
                  {RUNTIME_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-end justify-between gap-3">
              <label htmlFor="mission-constraints" className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-primary">
                Contraintes
              </label>
              <span className="text-[9.5px] font-semibold text-text-muted">Optionnel</span>
            </div>
            <textarea
              id="mission-constraints"
              className={textareaClasses}
              rows={3}
              placeholder="Ex : préserver la direction artistique, ne pas modifier le backend, tests obligatoires."
              value={constraints}
              onChange={(event) => setConstraints(event.target.value)}
              disabled={submitting}
            />
          </section>

          <section className="border-y border-black/[0.06]">
            <button
              type="button"
              onClick={() => setAdvancedOpen((current) => !current)}
              aria-expanded={advancedOpen}
              className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-text-secondary" strokeWidth={2.8} aria-hidden />
                <span className="text-[10px] font-bold uppercase tracking-[0.11em] text-text-secondary">Configuration avancée</span>
              </span>
              <ChevronDown className={cn("size-4 text-text-muted transition-transform", advancedOpen && "rotate-180")} strokeWidth={2.8} aria-hidden />
            </button>

            {advancedOpen && (
              <div className="grid grid-cols-1 gap-3 border-t border-black/[0.05] py-4 tablet:grid-cols-2">
                <label className="min-w-0">
                  <span className="mb-1.5 flex items-center gap-1.5 text-[9.5px] font-bold text-text-muted">
                    <Cpu className="size-3.5" strokeWidth={2.8} aria-hidden /> Modèle de planification
                  </span>
                  <select className={selectClasses} value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)} disabled={submitting}>
                    {MODEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>

                <label className="min-w-0">
                  <span className="mb-1.5 flex items-center gap-1.5 text-[9.5px] font-bold text-text-muted">
                    <Gauge className="size-3.5" strokeWidth={2.8} aria-hidden /> Effort
                  </span>
                  <select className={selectClasses} value={effort} onChange={(event) => setEffort(event.target.value)} disabled={submitting}>
                    {EFFORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </div>
            )}
          </section>

          {error && (
            <div role="alert" className="border-y border-error/20 py-3 text-[11px] font-semibold text-error">
              {error}
            </div>
          )}

          <div className="sticky bottom-0 z-[1] -mx-[var(--mobile-gutter)] -mb-[calc(24px+env(safe-area-inset-bottom))] flex items-center justify-end gap-2 border-t border-black/[0.06] bg-[#efeee9]/96 px-[var(--mobile-gutter)] pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl tablet:-mx-5 tablet:-mb-4 tablet:px-5 tablet:pb-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="min-h-11 rounded-[11px] px-4 text-[11.5px] font-bold text-text-secondary transition-colors hover:bg-black/[0.035] hover:text-text-primary disabled:opacity-45"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[11px] bg-[#141815] px-4 text-[11.5px] font-bold text-[#efeee9] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-[background-color,opacity,transform] hover:bg-[#1b201c] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35"
            >
              <span>{submitting ? "Création du run…" : "Lancer la mission"}</span>
              <ArrowUpRight className="size-4" strokeWidth={2.8} aria-hidden />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
