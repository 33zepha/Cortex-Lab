import type { MissionStatus } from "@/lib/types";

export type Tone = "neutral" | "indigo" | "success" | "warning" | "error";

export const missionStatusConfig: Record<
  MissionStatus,
  { label: string; tone: Tone; pulse?: boolean }
> = {
  running: { label: "En cours", tone: "indigo", pulse: true },
  needs_review: { label: "À valider", tone: "warning", pulse: true },
  completed: { label: "Terminée", tone: "success" },
  failed: { label: "Échouée", tone: "error" },
  cancelled: { label: "Annulée", tone: "neutral" },
};

export const toneClasses: Record<Tone, { bg: string; text: string; dot: string }> = {
  neutral: { bg: "bg-surface-3", text: "text-text-secondary", dot: "bg-text-muted" },
  indigo: { bg: "bg-accent-indigo-muted", text: "text-accent-indigo", dot: "bg-accent-indigo" },
  success: { bg: "bg-success-muted", text: "text-success", dot: "bg-success" },
  warning: { bg: "bg-warning-muted", text: "text-warning", dot: "bg-warning" },
  error: { bg: "bg-error-muted", text: "text-error", dot: "bg-error" },
};

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

export function formatRelativeTime(ts: number, now: number): string {
  const diffMs = now - ts;
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
