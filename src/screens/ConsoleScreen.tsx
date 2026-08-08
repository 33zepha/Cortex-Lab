import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  FileEdit,
  FileText,
  FlaskConical,
  GitBranch,
  ListRestart,
  ListTree,
  RefreshCw,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { useMissions } from "@/lib/useMissions";
import { getOperationalMission } from "@/lib/operator-contract";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/cn";
import type { TimelineEventType } from "@/lib/types";

type ActivityFilter = "all" | "decision" | "error" | "change" | "test";
type ActivityWindow = "30m" | "1h" | "all";

const FILTERS: { id: ActivityFilter; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "decision", label: "Décisions" },
  { id: "error", label: "Erreurs" },
  { id: "change", label: "Fichiers" },
  { id: "test", label: "Tests" },
];

const EVENT_META: Record<TimelineEventType, { label: string; icon: LucideIcon; className: string }> = {
  plan: { label: "Plan", icon: ListTree, className: "text-text-secondary" },
  step: { label: "Étape", icon: GitBranch, className: "text-text-primary" },
  file_read: { label: "Lecture", icon: FileText, className: "text-text-muted" },
  file_modified: { label: "Modification", icon: FileEdit, className: "text-text-primary" },
  test: { label: "Test", icon: FlaskConical, className: "text-success" },
  decision: { label: "Décision", icon: AlertTriangle, className: "text-warning" },
  closure: { label: "Clôture", icon: CheckCircle2, className: "text-success" },
  error: { label: "Erreur", icon: AlertTriangle, className: "text-error" },
};

function matchesType(type: TimelineEventType, filter: ActivityFilter): boolean {
  if (filter === "all") return true;
  if (filter === "change") return type === "file_modified" || type === "file_read";
  return type === filter;
}

export function ConsoleScreen() {
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [windowFilter, setWindowFilter] = useState<ActivityWindow>("30m");
  const [query, setQuery] = useState("");
  const { missions, loading, error, refetch } = useMissions();
  const source = missions ?? [];

  const activity = useMemo(() => {
    const now = Date.now();
    const cutoff = windowFilter === "30m"
      ? now - 30 * 60_000
      : windowFilter === "1h"
        ? now - 60 * 60_000
        : 0;
    const normalizedQuery = query.trim().toLowerCase();

    return source
      .flatMap((mission) => {
        const view = getOperationalMission(mission);
        return mission.timeline.map((event) => ({ mission, view, event }));
      })
      .filter(({ mission, view, event }) => {
        if (event.ts < cutoff || !matchesType(event.type, filter)) return false;
        if (!normalizedQuery) return true;
        return [
          event.title,
          event.detail,
          mission.title,
          mission.objective,
          view.agentName,
          view.runtimeName,
        ].some((value) => value?.toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => b.event.ts - a.event.ts);
  }, [filter, query, source, windowFilter]);

  const missionCount = new Set(activity.map(({ mission }) => mission.id)).size;
  const actionCount = activity.filter(({ event }) => event.type === "decision" || event.type === "error").length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className="w-full">
      <PageHeader
        title="Activité"
        icon={ListRestart}
        action={
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-[12px] border border-black/[0.07] bg-[#f7f6f1]/78 px-3 text-[11px] font-bold text-text-primary transition-colors hover:bg-[#fbfaf6] disabled:opacity-40 laptop:min-h-10"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} strokeWidth={2.8} aria-hidden />
            <span className="hidden mobile:inline">Actualiser</span>
          </button>
        }
      />

      {error && (
        <div className="mb-5 border-y border-error/25 py-3 text-[11px] font-semibold text-error">{error}</div>
      )}

      <div className="mb-5 border-y border-black/[0.065] py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-[10px] font-semibold text-text-muted">
            <span><strong className="font-mono text-text-primary">{activity.length}</strong> événements</span>
            <span><strong className="font-mono text-text-primary">{missionCount}</strong> missions</span>
            <span><strong className="font-mono text-text-primary">{actionCount}</strong> signaux</span>
          </div>
          <div className="flex items-center gap-1 border-l border-black/[0.06] pl-2">
            {([
              { id: "30m", label: "30 min" },
              { id: "1h", label: "1 h" },
              { id: "all", label: "Tout" },
            ] as const).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setWindowFilter(item.id)}
                className={cn(
                  "min-h-9 px-2.5 text-[9.5px] font-bold text-text-muted transition-colors hover:text-text-primary",
                  windowFilter === item.id && "text-text-primary underline decoration-2 underline-offset-4",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 tablet:grid-cols-[1fr_auto] tablet:items-center">
        <div className="scrollbar-none flex overflow-x-auto border-b border-black/[0.06]">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "relative min-h-11 shrink-0 px-3 text-[10.5px] font-bold text-text-muted transition-colors hover:text-text-primary",
                filter === item.id && "text-text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-[2px] after:bg-text-primary",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="relative block">
          <span className="sr-only">Filtrer l'activité</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" strokeWidth={2.8} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Mission, agent, événement…"
            className="min-h-11 w-full rounded-[12px] border border-black/[0.07] bg-[#f7f6f1]/74 pl-10 pr-3 text-[16px] font-semibold text-text-primary placeholder:text-text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/10 tablet:w-[280px] tablet:text-[12px]"
          />
        </label>
      </div>

      <div className="border-y border-black/[0.065]">
        {activity.map(({ mission, view, event }) => {
          const meta = EVENT_META[event.type];
          const EventIcon = meta.icon;
          return (
            <Link
              key={`${mission.id}:${event.id}`}
              to={ROUTES.missionDetail(mission.id)}
              className="group grid min-h-[72px] grid-cols-[52px_auto_minmax(0,1fr)] items-start gap-3 border-b border-black/[0.05] py-3.5 last:border-b-0 transition-colors hover:bg-black/[0.018] tablet:grid-cols-[64px_110px_minmax(0,1fr)_minmax(150px,0.34fr)]"
            >
              <span className="pt-0.5 font-mono text-[9.5px] font-semibold tabular-nums text-text-muted">
                {new Date(event.ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className={cn("flex items-center gap-2 pt-0.5", meta.className)}>
                <EventIcon className="size-3.5 shrink-0" strokeWidth={2.8} aria-hidden />
                <span className="hidden text-[9px] font-bold uppercase tracking-[0.09em] tablet:inline">{meta.label}</span>
              </span>
              <span className="min-w-0">
                <span className="block text-[11.5px] font-bold leading-snug text-text-primary">{event.title}</span>
                {event.detail && <span className="mt-1 block line-clamp-1 text-[10px] font-medium text-text-muted">{event.detail}</span>}
                <span className="mt-1 block truncate text-[9.5px] font-semibold text-text-secondary tablet:hidden">{mission.title ?? mission.objective}</span>
              </span>
              <span className="hidden min-w-0 tablet:block">
                <span className="block truncate text-[10px] font-bold text-text-primary">{mission.title ?? mission.objective}</span>
                <span className="mt-1 block truncate font-mono text-[9px] font-semibold text-text-muted">{view.agentName} · {view.runtimeName}</span>
              </span>
            </Link>
          );
        })}

        {!loading && activity.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[12px] font-bold text-text-primary">Aucun événement dans cette vue</p>
            <p className="mt-1 text-[10.5px] font-medium text-text-muted">Élargissez la période ou retirez un filtre.</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 text-[9.5px] font-semibold text-text-muted">
        <span>Source canonique · ledger Cortex</span>
        <span>Les logs bruts restent un niveau de diagnostic secondaire.</span>
      </div>
    </motion.div>
  );
}
