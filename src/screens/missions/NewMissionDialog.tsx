import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, Gauge, Plus, ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui";
import { apiPost } from "@/lib/api";
import { ROUTES } from "@/lib/routes";
import type { Mission } from "@/lib/types";

const textareaClasses =
  "w-full resize-none rounded-[16px] border border-white/70 bg-white/58 px-4 py-3 text-[16px] font-semibold leading-relaxed text-text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,1)] placeholder:font-medium placeholder:text-text-muted/55 " +
  "transition-[border-color,background-color,box-shadow] duration-200 hover:bg-white/68 " +
  "focus-visible:outline-none focus-visible:border-text-primary/18 focus-visible:bg-white/78 focus-visible:ring-2 focus-visible:ring-text-primary/[0.06] " +
  "disabled:pointer-events-none disabled:opacity-45 laptop:rounded-[14px] laptop:text-sm";

const selectClasses =
  "min-h-12 w-full appearance-none rounded-[14px] border border-white/70 bg-white/58 px-3.5 py-2.5 text-[16px] font-bold tracking-[-0.01em] text-text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,1)] " +
  "transition-[border-color,background-color] duration-200 hover:bg-white/70 focus-visible:outline-none focus-visible:border-text-primary/18 focus-visible:bg-white/78 focus-visible:ring-2 focus-visible:ring-text-primary/[0.06] " +
  "disabled:pointer-events-none disabled:opacity-45 laptop:min-h-0 laptop:text-sm";

const MODEL_OPTIONS = [
  { value: "gpt-5.6", label: "GPT-5.6 · Standard" },
  { value: "gpt-5.6-sol", label: "GPT-5.6 Sol · Rapide" },
  { value: "gpt-5.6-terra", label: "GPT-5.6 Terra · Architecture" },
  { value: "gpt-5.6-luna", label: "GPT-5.6 Luna · Léger" },
  { value: "gpt-5.5", label: "GPT-5.5 · Pro" },
  { value: "gpt-4o", label: "GPT-4o · Omni" },
  { value: "gpt-4o-mini", label: "GPT-4o mini · Rapide" },
  { value: "o3-mini", label: "o3-mini · Raisonnement" },
  { value: "o1", label: "o1 · Raisonnement élevé" },
  { value: "claude-code", label: "Claude Code · VPS" },
  { value: "custom", label: "Modèle personnalisé…" },
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
  const [selectedModel, setSelectedModel] = useState("gpt-5.6");
  const [customModel, setCustomModel] = useState("");
  const [effort, setEffort] = useState("high");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = objective.trim().length >= 10 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const finalModel = selectedModel === "custom" ? customModel.trim() || "gpt-5.6" : selectedModel;

    try {
      const mission = await apiPost<Mission>("/api/missions", {
        objective: objective.trim(),
        constraints: constraints.trim() || undefined,
        model: finalModel,
        effort,
      });
      setOpen(false);
      setObjective("");
      setConstraints("");
      onCreated();
      navigate(ROUTES.missionDetail(mission.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
          className="group flex h-11 items-center justify-center gap-2 rounded-[14px] border border-white/72 bg-white/58 px-3 text-text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_6px_20px_-13px_rgba(0,0,0,0.32)] backdrop-blur-2xl transition-[background-color,box-shadow,opacity] duration-200 hover:bg-white/80 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_9px_24px_-14px_rgba(0,0,0,0.34)] active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/15 laptop:h-10 laptop:px-3.5"
        >
          <Plus className="size-[21px]" strokeWidth={3.4} aria-hidden />
          <span className="hidden text-[12px] font-bold tracking-[-0.01em] tablet:inline">Nouvelle mission</span>
        </button>
      </DialogTrigger>

      <DialogContent
        title="Nouvelle mission"
        description="Décrivez le résultat attendu. Cortex organise ensuite l'exécution."
        className="tablet:max-w-[560px]"
      >
        <div className="space-y-5">
          <section>
            <div className="mb-2 flex items-end justify-between gap-3">
              <label htmlFor="mission-objective" className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-primary">
                Objectif
              </label>
              <span className="text-[10px] font-semibold text-text-muted">10 caractères minimum</span>
            </div>
            <textarea
              id="mission-objective"
              className={textareaClasses}
              rows={5}
              autoFocus
              placeholder="Ex : Auditer l'application Cortex, corriger les régressions mobiles et fournir les preuves de validation."
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              disabled={submitting}
            />
          </section>

          <section className="rounded-[18px] border border-white/62 bg-white/30 p-3.5 backdrop-blur-xl laptop:p-4">
            <div className="mb-3 flex items-center gap-2">
              <SlidersHorizontal className="size-[17px] text-text-primary" strokeWidth={2.8} />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-primary">Exécution</h3>
            </div>

            <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2">
              <label className="min-w-0">
                <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold text-text-muted">
                  <Cpu className="size-3.5" strokeWidth={2.8} /> Moteur
                </span>
                <select className={selectClasses} value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)} disabled={submitting}>
                  {MODEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="min-w-0">
                <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold text-text-muted">
                  <Gauge className="size-3.5" strokeWidth={2.8} /> Effort
                </span>
                <select className={selectClasses} value={effort} onChange={(event) => setEffort(event.target.value)} disabled={submitting}>
                  {EFFORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

            {selectedModel === "custom" && (
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[10px] font-bold text-text-muted">Identifiant du modèle</span>
                <input
                  type="text"
                  className="min-h-12 w-full rounded-[14px] border border-white/70 bg-white/58 px-3.5 text-[16px] font-semibold text-text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,1)] placeholder:text-text-muted/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/[0.06] laptop:min-h-0 laptop:text-sm"
                  placeholder="Ex : gpt-5.6-turbo"
                  value={customModel}
                  onChange={(event) => setCustomModel(event.target.value)}
                  disabled={submitting}
                />
              </label>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-end justify-between gap-3">
              <label htmlFor="mission-constraints" className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-primary">
                Contraintes
              </label>
              <span className="text-[10px] font-semibold text-text-muted">Optionnel</span>
            </div>
            <textarea
              id="mission-constraints"
              className={textareaClasses}
              rows={3}
              placeholder="Ex : ne pas modifier le backend, préserver le design desktop, tests obligatoires."
              value={constraints}
              onChange={(event) => setConstraints(event.target.value)}
              disabled={submitting}
            />
          </section>

          {error && (
            <div className="rounded-[14px] border border-error/20 bg-error-muted/45 px-3.5 py-3 text-[12px] font-semibold text-error">
              {error}
            </div>
          )}

          {submitting && (
            <div className="rounded-[14px] border border-white/60 bg-white/35 px-3.5 py-3 text-[11px] font-semibold leading-relaxed text-text-muted">
              Cortex planifie la mission avec {selectedModel} · effort {effort}, puis lance l'exécution sur le VPS.
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-[auto_1fr] gap-2.5 border-t border-black/[0.05] pt-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={submitting}
            className="min-h-12 rounded-[14px] px-4 text-[12px] font-bold text-text-muted transition-colors hover:bg-black/[0.035] hover:text-text-primary disabled:opacity-45"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="group flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-text-primary px-4 text-[12px] font-bold text-white shadow-[0_10px_26px_-14px_rgba(0,0,0,0.6)] transition-[opacity,box-shadow] hover:shadow-[0_12px_30px_-14px_rgba(0,0,0,0.7)] active:opacity-80 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {submitting ? "Lancement…" : "Lancer la mission"}
            {!submitting && <ArrowUpRight className="size-4" strokeWidth={3} />}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
