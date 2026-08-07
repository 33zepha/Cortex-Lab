import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, Button } from "@/components/ui";
import { apiPost } from "@/lib/api";
import { ROUTES } from "@/lib/routes";
import type { Mission } from "@/lib/types";

const textareaClasses =
  "w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted " +
  "transition-colors duration-fast ease-standard hover:border-border-strong " +
  "focus-visible:outline-none focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-accent-indigo-muted " +
  "disabled:opacity-45 disabled:pointer-events-none resize-none";

export function NewMissionDialog({ onCreated }: { onCreated: () => void }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [objective, setObjective] = useState("");
  const [constraints, setConstraints] = useState("");
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
        <Button variant="primary" size="sm">
          <Sparkles className="size-3.5" /> Nouvelle mission
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Nouvelle mission"
        description="Décris l'objectif — Claude Code planifie et exécute sur le VPS."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Objectif</label>
            <textarea
              className={textareaClasses}
              rows={3}
              placeholder="Ex : Ajouter la pagination cursor-based à GET /api/missions"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Contraintes (optionnel)</label>
            <textarea
              className={textareaClasses}
              rows={2}
              placeholder="Ex : Ne pas casser les clients existants"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              disabled={submitting}
            />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          {submitting && (
            <p className="text-xs text-text-muted">
              Planification (OpenAI) puis exécution (Claude Code sur le VPS) — jusqu'à une minute.
            </p>
          )}
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting} disabled={!canSubmit}>
            Lancer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
