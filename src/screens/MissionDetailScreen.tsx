import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  ChevronLeft,
  CircleStop,
  Clock3,
  Copy,
  Cpu,
  Download,
  FileEdit,
  FileText,
  Files,
  FlaskConical,
  GitCompare,
  LoaderCircle,
  MessageSquareText,
  Play,
  Route,
  Server,
  ShieldAlert,
  X,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  EmptyState,
  ErrorState,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { MissionControlBar } from "@/components/operator/MissionControlBar";
import { useMission } from "@/lib/useMissions";
import { apiPost } from "@/lib/api";
import { ROUTES } from "@/lib/routes";
import { formatClock, formatDuration } from "@/lib/status";
import { getOperationalMission } from "@/lib/operator-contract";
import { EvidenceDetail } from "@/screens/mission-detail/EvidenceDetail";
import { DiffView } from "@/screens/mission-detail/DiffView";
import { cn } from "@/lib/cn";
import type {
  Mission,
  OperatorRunStatus,
  OperatorStage,
  TimelineEventType,
} from "@/lib/types";

const statusClasses: Record<OperatorRunStatus, string> = {
  queued: "text-text-muted",
  planning: "text-text-secondary",
  running: "text-text-primary",
  waiting_for_human: "text-warning",
  paused: "text-text-secondary",
  cancelling: "text-text-muted",
  cancelled: "text-text-muted",
  failed: "text-error",
  succeeded: "text-success",
};

const eventMeta: Record<TimelineEventType, { label: string; icon: LucideIcon; className: string }> = {
  plan: { label: "Plan", icon: Route, className: "text-text-secondary" },
  step: { label: "Étape", icon: Play, className: "text-text-primary" },
  file_read: { label: "Lecture", icon: FileText, className: "text-text-muted" },
  file_modified: { label: "Modification", icon: FileEdit, className: "text-text-primary" },
  test: { label: "Test", icon: FlaskConical, className: "text-success" },
  decision: { label: "Décision", icon: AlertTriangle, className: "text-warning" },
  closure: { label: "Clôture", icon: CheckCircle2, className: "text-success" },
  error: { label: "Erreur", icon: ShieldAlert, className: "text-error" },
};

function SectionHeading({
  eyebrow,
  title,
  detail,
}: {
  eyebrow?: string;
  title: string;
  detail?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">{eyebrow}</p>}
        <h2 className={cn("text-[15px] font-bold tracking-[-0.022em] text-text-primary", eyebrow && "mt-1")}>{title}</h2>
      </div>
      {detail && <span className="font-mono text-[9.5px] font-semibold text-text-muted">{detail}</span>}
    </div>
  );
}

function RunFact({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="min-w-0 py-3">
      <div className="flex items-center gap-1.5 text-text-muted">
        <Icon className="size-3.5" strokeWidth={2.8} aria-hidden />
        <span className="text-[8.5px] font-bold uppercase tracking-[0.11em]">{label}</span>
      </div>
      <p className="mt-1.5 truncate text-[12px] font-bold text-text-primary">{value}</p>
      {detail && <p className="mt-0.5 truncate font-mono text-[9px] font-semibold text-text-muted">{detail}</p>}
    </div>
  );
}

function StageIcon({ stage }: { stage: OperatorStage }) {
  if (stage.status === "completed") return <Check className="size-4 text-success" strokeWidth={3} aria-hidden />;
  if (stage.status === "failed") return <X className="size-4 text-error" strokeWidth={3} aria-hidden />;
  if (stage.status === "running") return <LoaderCircle className="size-4 animate-pulse text-text-primary" strokeWidth={2.8} aria-hidden />;
  if (stage.status === "skipped") return <CircleStop className="size-4 text-text-muted" strokeWidth={2.6} aria-hidden />;
  return <Clock3 className="size-4 text-text-muted/55" strokeWidth={2.5} aria-hidden />;
}

function StageList({ stages, currentStageId }: { stages: OperatorStage[]; currentStageId: string | null }) {
  return (
    <ol className="divide-y divide-black/[0.05] border-y border-black/[0.065]">
      {stages.map((stage, index) => (
        <li key={stage.id} className="grid min-h-[58px] grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 py-2.5">
          <span className="flex size-8 items-center justify-center">
            <StageIcon stage={stage} />
          </span>
          <span className="min-w-0">
            <span className={cn(
              "block text-[11.5px] font-bold text-text-primary",
              stage.status === "pending" && "text-text-muted",
            )}>
              {stage.label}
            </span>
            {stage.detail && <span className="mt-0.5 block line-clamp-1 text-[9.5px] font-medium text-text-muted">{stage.detail}</span>}
          </span>
          <span className={cn(
            "font-mono text-[8.5px] font-bold uppercase tracking-[0.08em] text-text-muted",
            stage.id === currentStageId && "text-text-primary",
          )}>
            {stage.status === "completed"
              ? "Fait"
              : stage.status === "running"
                ? "En cours"
                : stage.status === "failed"
                  ? "Échec"
                  : stage.status === "skipped"
                    ? "Ignoré"
                    : `${index + 1}`}
          </span>
        </li>
      ))}
    </ol>
  );
}

function FileList({ title, files, modified = false }: { title: string; files: string[]; modified?: boolean }) {
  const Icon = modified ? FileEdit : FileText;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-secondary">{title}</h3>
        <span className="font-mono text-[9px] font-semibold text-text-muted">{files.length}</span>
      </div>
      <ul className="divide-y divide-black/[0.05] border-y border-black/[0.06]">
        {files.length === 0 ? (
          <li className="py-3 text-[10.5px] font-medium text-text-muted">Aucun fichier.</li>
        ) : files.map((file) => (
          <li key={file} className="flex min-h-10 items-center gap-2 py-2 font-mono text-[10px] font-semibold text-text-secondary">
            <Icon className="size-3.5 shrink-0" strokeWidth={2.7} aria-hidden />
            <span className="truncate">{file}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function parseTab(value: string | null): "summary" | "activity" | "details" {
  if (value === "timeline" || value === "activity") return "activity";
  if (["files", "tests", "evidence", "patch", "errors", "details"].includes(value ?? "")) return "details";
  return "summary";
}

export function MissionDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { mission, loading, error, refetch } = useMission(id);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [decisionBusy, setDecisionBusy] = useState<"approve" | "reject" | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const activeTab = parseTab(searchParams.get("tab"));

  const selectedEvidence = useMemo(
    () => mission?.evidence.find((evidence) => evidence.id === selectedEvidenceId) ?? null,
    [mission, selectedEvidenceId],
  );

  function setActiveTab(next: string) {
    const params = new URLSearchParams(searchParams);
    if (next === "summary") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params, { replace: true });
  }

  async function handleDecision(decision: "approve" | "reject") {
    if (!mission) return;
    setDecisionBusy(decision);
    setDecisionError(null);
    try {
      await apiPost<Mission>(`/api/missions/${mission.id}/decision`, { decision });
      await refetch();
    } catch (commandError) {
      setDecisionError(commandError instanceof Error ? commandError.message : String(commandError));
    } finally {
      setDecisionBusy(null);
    }
  }

  async function copyPatch(patch: string) {
    try {
      await navigator.clipboard.writeText(patch);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1_500);
    } catch {
      setCopyStatus("idle");
    }
  }

  function downloadPatch(patch: string, missionId: string) {
    const blob = new Blob([patch], { type: "text/x-diff" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${missionId}.patch`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Skeleton className="mb-5 h-10 w-28 rounded-[12px]" />
        <Skeleton className="mb-5 h-64 w-full rounded-[18px]" />
        <Skeleton className="h-72 w-full rounded-[18px]" />
      </motion.div>
    );
  }

  if (error || !mission) {
    return (
      <ErrorState
        title={error ? "Impossible de charger la mission" : "Mission introuvable"}
        description={error ?? "Cette mission n'existe pas ou n'est plus accessible."}
        onRetry={() => navigate(ROUTES.missions)}
      />
    );
  }

  const view = getOperationalMission(mission);
  const duration = ["queued", "planning", "running", "waiting_for_human", "paused", "cancelling"].includes(view.status)
    ? Date.now() - mission.createdAt
    : mission.durationMs;
  const failedStage = view.stages.find((stage) => stage.status === "failed") ?? null;
  const testsValue = mission.tests.total > 0 ? `${mission.tests.passed}/${mission.tests.total}` : "—";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className="w-full">
      <div className="mb-4 flex min-h-10 items-center justify-between gap-4">
        <Link
          to={ROUTES.missions}
          className="inline-flex min-h-10 items-center gap-1.5 text-[11px] font-bold text-text-muted transition-colors hover:text-text-primary"
        >
          <ChevronLeft className="size-[17px]" strokeWidth={3} aria-hidden />
          Missions
        </Link>
        <span className="max-w-[56%] truncate font-mono text-[8.5px] font-semibold text-text-muted">
          {view.runId} · tentative {view.attempt}
        </span>
      </div>

      <header data-status={view.status} className="cortex-mission-hero relative border-y border-black/[0.065] py-5 laptop:py-7">
        <Route className="pointer-events-none absolute -right-3 -top-7 size-[112px] -rotate-6 text-text-primary opacity-[0.022]" strokeWidth={2.7} aria-hidden />
        <div className="relative z-[1]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className={cn("text-[9.5px] font-bold uppercase tracking-[0.12em]", statusClasses[view.status])}>
              {view.statusLabel}
            </span>
            <span className="font-mono text-[9px] font-semibold text-text-muted">{view.stageLabel}</span>
          </div>

          <h1 className="mt-3 max-w-4xl text-[25px] font-extrabold leading-[1.05] tracking-[-0.045em] text-text-primary laptop:text-[34px]">
            {mission.title ?? mission.objective}
          </h1>
          {mission.title && mission.title !== mission.objective && (
            <p className="mt-3 max-w-3xl text-[12px] font-semibold leading-relaxed text-text-secondary">{mission.objective}</p>
          )}
          {mission.constraints && (
            <p className="mt-3 max-w-3xl text-[10.5px] font-medium leading-relaxed text-text-muted">
              <strong className="font-bold text-text-secondary">Contrainte</strong> · {mission.constraints}
            </p>
          )}

          {view.attention && (
            <div className={cn(
              "mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-3 border-l-2 py-1 pl-3",
              view.attention.kind === "failure" ? "border-error/65" : view.attention.kind === "decision" ? "border-warning/70" : "border-text-primary/28",
            )}>
              <AlertTriangle className={cn(
                "mt-0.5 size-4",
                view.attention.kind === "failure" ? "text-error" : view.attention.kind === "decision" ? "text-warning" : "text-text-secondary",
              )} strokeWidth={2.8} aria-hidden />
              <div>
                <p className="text-[11.5px] font-bold text-text-primary">{view.attention.title}</p>
                <p className="mt-0.5 text-[10.5px] font-medium leading-relaxed text-text-secondary">{view.attention.summary}</p>
              </div>
            </div>
          )}

          <div className="cortex-run-facts mt-6 grid grid-cols-2 divide-x divide-y divide-black/[0.055] border-y border-black/[0.055] tablet:grid-cols-4 tablet:divide-y-0">
            <div className="pr-3 tablet:pr-4">
              <RunFact icon={Bot} label="Agent" value={view.agentName} detail={view.agentRole} />
            </div>
            <div className="pl-3 tablet:px-4">
              <RunFact icon={Server} label="Runtime" value={view.runtimeName} detail={view.runtimeDetail} />
            </div>
            <div className="pr-3 tablet:px-4">
              <RunFact icon={Cpu} label="Modèle" value={view.modelName} detail={view.modelProvider} />
            </div>
            <div className="pl-3 tablet:pl-4">
              <RunFact icon={Clock3} label="Durée" value={formatDuration(duration)} detail={view.runtimeStatus} />
            </div>
          </div>

          <div className="cortex-progress-block mt-5">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[8.5px] font-bold uppercase tracking-[0.11em] text-text-muted">Étape courante</p>
                <p className="mt-1 truncate text-[12px] font-bold text-text-primary">{view.stageLabel}</p>
              </div>
              {view.progress !== null && (
                <span className="font-mono text-[10px] font-bold tabular-nums text-text-secondary">
                  {view.progress}% mesuré
                </span>
              )}
            </div>
            {view.progress !== null && (
              <div className="mt-2 h-[3px] overflow-hidden bg-black/[0.07]" aria-label={`Progression mesurée : ${view.progress}%`}>
                <div className="h-full bg-[#252b26]" style={{ width: `${view.progress}%` }} />
              </div>
            )}
          </div>
        </div>
      </header>

      <MissionControlBar mission={mission} onChanged={() => void refetch()} />

      {view.decision && view.status === "waiting_for_human" && (
        <section className="mt-6 border-y border-warning/25 py-5" aria-labelledby="decision-heading">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
            <AlertTriangle className="mt-0.5 size-[18px] text-warning" strokeWidth={2.9} aria-hidden />
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-warning">Décision humaine</p>
              <h2 id="decision-heading" className="mt-1 text-[16px] font-bold tracking-[-0.025em] text-text-primary">{view.decision.title}</h2>
              <p className="mt-2 text-[12px] font-semibold leading-relaxed text-text-primary">{view.decision.question}</p>

              <dl className="mt-4 grid grid-cols-1 gap-3 tablet:grid-cols-2">
                <div className="border-l border-black/[0.08] pl-3">
                  <dt className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-text-muted">Pourquoi</dt>
                  <dd className="mt-1 text-[10.5px] font-medium leading-relaxed text-text-secondary">{view.decision.rationale}</dd>
                </div>
                <div className="border-l border-black/[0.08] pl-3">
                  <dt className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-text-muted">Conséquence</dt>
                  <dd className="mt-1 text-[10.5px] font-medium leading-relaxed text-text-secondary">{view.decision.impact}</dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={decisionBusy !== null}
                  onClick={() => handleDecision("approve")}
                  className="inline-flex min-h-11 items-center gap-2 rounded-[11px] bg-[#141815] px-4 text-[11.5px] font-bold text-[#efeee9] active:opacity-80 disabled:opacity-40"
                >
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                  {decisionBusy === "approve" ? "Validation…" : "Approuver et continuer"}
                </button>
                <button
                  type="button"
                  disabled={decisionBusy !== null}
                  onClick={() => handleDecision("reject")}
                  className="inline-flex min-h-11 items-center gap-2 rounded-[11px] border border-black/[0.09] px-4 text-[11.5px] font-bold text-text-primary active:bg-black/[0.035] disabled:opacity-40"
                >
                  <X className="size-4" strokeWidth={3} aria-hidden />
                  {decisionBusy === "reject" ? "Refus…" : "Refuser"}
                </button>
              </div>
              {decisionError && <p role="alert" className="mt-3 text-[10.5px] font-bold text-error">{decisionError}</p>}
            </div>
          </div>
        </section>
      )}

      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="cortex-detail-tabs mb-6 border-b-black/[0.065]">
            <TabsTrigger className="px-2 text-[11px] font-bold data-[state=active]:after:bg-text-primary" value="summary">Résumé</TabsTrigger>
            <TabsTrigger className="px-2 text-[11px] font-bold data-[state=active]:after:bg-text-primary" value="activity">Activité</TabsTrigger>
            <TabsTrigger className="px-2 text-[11px] font-bold data-[state=active]:after:bg-text-primary" value="details">Détails</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="grid grid-cols-1 gap-8 laptop:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)] laptop:gap-10">
              <section>
                <SectionHeading eyebrow="Run" title="Progression par étapes" detail={`${view.stages.length} étapes`} />
                <StageList stages={view.stages} currentStageId={mission.operator?.run.currentStageId ?? null} />
              </section>

              <section>
                <SectionHeading eyebrow="État" title={view.status === "failed" ? "Diagnostic" : view.status === "succeeded" ? "Résultat" : "Situation actuelle"} />
                {view.status === "failed" ? (
                  <dl className="divide-y divide-black/[0.05] border-y border-black/[0.065]">
                    <div className="py-3">
                      <dt className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-text-muted">Cause</dt>
                      <dd className="mt-1 text-[10.5px] font-semibold leading-relaxed text-error">{mission.error ?? "Cause non exposée par le runtime."}</dd>
                    </div>
                    <div className="py-3">
                      <dt className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-text-muted">Où</dt>
                      <dd className="mt-1 text-[10.5px] font-semibold text-text-primary">{failedStage?.label ?? view.stageLabel}</dd>
                    </div>
                    <div className="py-3">
                      <dt className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-text-muted">Conséquence</dt>
                      <dd className="mt-1 text-[10.5px] font-medium leading-relaxed text-text-secondary">Le run est arrêté. Les événements et preuves déjà produits restent conservés.</dd>
                    </div>
                    <div className="py-3">
                      <dt className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-text-muted">Action recommandée</dt>
                      <dd className="mt-1 text-[10.5px] font-semibold leading-relaxed text-text-primary">
                        {view.capabilities.canRetry ? "Relancer depuis le dernier checkpoint durable." : "Inspecter le signal puis corriger le runtime concerné."}
                      </dd>
                    </div>
                  </dl>
                ) : view.status === "succeeded" ? (
                  <div className="border-y border-black/[0.065] py-4">
                    <p className="text-[12px] font-semibold leading-relaxed text-text-primary">
                      {mission.summary ?? "La mission s'est terminée sans erreur signalée."}
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-4 border-t border-black/[0.05] pt-3">
                      <RunFact icon={Files} label="Fichiers" value={String(mission.filesModified.length)} />
                      <RunFact icon={FlaskConical} label="Tests" value={testsValue} />
                      <RunFact icon={GitCompare} label="Preuves" value={String(mission.evidence.length)} />
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-black/[0.05] border-y border-black/[0.065]">
                    <div className="py-3">
                      <p className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-text-muted">Dernier événement</p>
                      <p className="mt-1 text-[11px] font-bold text-text-primary">{view.lastEvent?.title ?? "Aucun événement reçu"}</p>
                      {view.lastEvent?.detail && <p className="mt-1 text-[10px] font-medium leading-relaxed text-text-muted">{view.lastEvent.detail}</p>}
                    </div>
                    <div className="py-3">
                      <p className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-text-muted">Prochaine action</p>
                      <p className="mt-1 text-[10.5px] font-semibold leading-relaxed text-text-primary">
                        {view.attention?.summary ?? "Aucune intervention humaine requise pour l'instant."}
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <SectionHeading eyebrow="Chronologie" title="Trace d'exécution" detail={`${mission.timeline.length} événements`} />
            {mission.timeline.length === 0 ? (
              <EmptyState icon={<Route className="size-5" />} title="Aucun événement reçu" compact />
            ) : (
              <ol className="border-y border-black/[0.065]">
                {[...mission.timeline].sort((a, b) => b.ts - a.ts).map((event) => {
                  const meta = eventMeta[event.type];
                  const EventIcon = meta.icon;
                  return (
                    <li key={event.id} className="grid min-h-[68px] grid-cols-[54px_auto_minmax(0,1fr)] items-start gap-3 border-b border-black/[0.05] py-3.5 last:border-b-0">
                      <time className="pt-0.5 font-mono text-[9px] font-semibold text-text-muted">{formatClock(event.ts)}</time>
                      <span className={cn("flex size-7 items-center justify-center", meta.className)}>
                        <EventIcon className="size-3.5" strokeWidth={2.8} aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-[8.5px] font-bold uppercase tracking-[0.09em] text-text-muted">{meta.label}</span>
                          <p className="text-[11.5px] font-bold text-text-primary">{event.title}</p>
                        </div>
                        {event.detail && <p className="mt-1 text-[10px] font-medium leading-relaxed text-text-muted">{event.detail}</p>}
                        {event.evidenceId && (
                          <button
                            type="button"
                            onClick={() => setSelectedEvidenceId(event.evidenceId ?? null)}
                            className="mt-2 min-h-8 text-[9.5px] font-bold text-text-secondary underline decoration-black/20 underline-offset-4 hover:text-text-primary"
                          >
                            Ouvrir la preuve
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </TabsContent>

          <TabsContent value="details">
            <div className="space-y-8">
              <section>
                <SectionHeading eyebrow="Consommation" title="Usage du run" />
                <div className="grid grid-cols-2 divide-x divide-y divide-black/[0.055] border-y border-black/[0.065] tablet:grid-cols-4 tablet:divide-y-0">
                  <div className="pr-3 tablet:pr-4"><RunFact icon={MessageSquareText} label="Entrée" value={view.inputTokens.toLocaleString("fr-FR")} detail="tokens" /></div>
                  <div className="pl-3 tablet:px-4"><RunFact icon={MessageSquareText} label="Sortie" value={view.outputTokens.toLocaleString("fr-FR")} detail="tokens" /></div>
                  <div className="pr-3 tablet:px-4"><RunFact icon={Cpu} label="Cache" value={view.cachedTokens.toLocaleString("fr-FR")} detail="tokens" /></div>
                  <div className="pl-3 tablet:pl-4"><RunFact icon={Clock3} label="Durée" value={formatDuration(duration)} detail={view.estimatedCost === null ? "coût non exposé" : `${view.estimatedCost.toFixed(2)} €`} /></div>
                </div>
              </section>

              <section>
                <SectionHeading eyebrow="Sorties" title="Fichiers et validation" />
                <div className="grid grid-cols-1 gap-6 tablet:grid-cols-2">
                  <FileList title="Consultés" files={mission.filesRead} />
                  <FileList title="Modifiés" files={mission.filesModified} modified />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 border-y border-black/[0.065] py-4">
                  <RunFact icon={FlaskConical} label="Total" value={String(mission.tests.total)} />
                  <RunFact icon={Check} label="Passés" value={String(mission.tests.passed)} />
                  <RunFact icon={X} label="Échecs" value={String(mission.tests.failed)} />
                </div>
              </section>

              <section>
                <SectionHeading eyebrow="Preuves" title="Artifacts vérifiables" detail={String(mission.evidence.length)} />
                {mission.evidence.length === 0 ? (
                  <EmptyState icon={<GitCompare className="size-5" />} title="Aucune preuve enregistrée" compact />
                ) : (
                  <div className="divide-y divide-black/[0.05] border-y border-black/[0.065]">
                    {mission.evidence.map((evidence) => (
                      <button
                        key={evidence.id}
                        type="button"
                        onClick={() => setSelectedEvidenceId(evidence.id)}
                        className="grid min-h-[52px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-2.5 text-left transition-colors hover:bg-black/[0.018]"
                      >
                        <span className="truncate font-mono text-[10px] font-semibold text-text-primary">{evidence.title}</span>
                        <span className="text-[8.5px] font-bold uppercase tracking-[0.09em] text-text-muted">{evidence.kind}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <SectionHeading eyebrow="Patch" title="Modification produite" />
                {mission.patch ? (
                  <>
                    <div className="mb-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => copyPatch(mission.patch ?? "")}
                        className="inline-flex min-h-10 items-center gap-2 rounded-[10px] border border-black/[0.08] px-3 text-[10.5px] font-bold text-text-primary hover:bg-black/[0.025]"
                      >
                        {copyStatus === "copied" ? <Check className="size-3.5" strokeWidth={3} /> : <Copy className="size-3.5" strokeWidth={2.8} />}
                        {copyStatus === "copied" ? "Copié" : "Copier"}
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadPatch(mission.patch ?? "", mission.id)}
                        className="inline-flex min-h-10 items-center gap-2 rounded-[10px] border border-black/[0.08] px-3 text-[10.5px] font-bold text-text-primary hover:bg-black/[0.025]"
                      >
                        <Download className="size-3.5" strokeWidth={2.8} /> Télécharger
                      </button>
                    </div>
                    <DiffView content={mission.patch} />
                  </>
                ) : (
                  <EmptyState icon={<GitCompare className="size-5" />} title="Aucun patch disponible" compact />
                )}
              </section>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-8 flex flex-wrap gap-x-4 gap-y-1 border-t border-black/[0.05] pt-4 text-[9.5px] font-semibold text-text-muted">
        <span>Créée {formatClock(mission.createdAt)}</span>
        <span>Run {view.attempt}</span>
        {mission.closedAt && <span>Clôturée {formatClock(mission.closedAt)}</span>}
      </div>

      <Drawer open={Boolean(selectedEvidence)} onOpenChange={(open) => !open && setSelectedEvidenceId(null)}>
        <DrawerContent side="bottom" title="Preuve" className="laptop:max-w-[720px]">
          {selectedEvidence && <EvidenceDetail evidence={selectedEvidence} />}
        </DrawerContent>
      </Drawer>
    </motion.div>
  );
}
