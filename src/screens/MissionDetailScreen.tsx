import { useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  FileText,
  FileEdit,
  FlaskConical,
  GitCompare,
  AlertTriangle,
  Copy,
  Check,
  Download,
  XCircle,
  X,
  Clock3,
  Files,
  Route,
  TerminalSquare,
} from "lucide-react";
import {
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  EmptyState,
  ErrorState,
  InspectorPanel,
  TimelineItem,
  Button,
  Drawer,
  DrawerContent,
  Skeleton,
} from "@/components/ui";
import { useMission } from "@/lib/useMissions";
import { apiPost } from "@/lib/api";
import { ROUTES } from "@/lib/routes";
import { missionStatusConfig, formatDuration, formatClock } from "@/lib/status";
import { EvidenceDetail } from "@/screens/mission-detail/EvidenceDetail";
import { DiffView } from "@/screens/mission-detail/DiffView";
import { EASE_SPRING_ARRAY } from "@/lib/animations";
import { cn } from "@/lib/cn";
import type { Mission } from "@/lib/types";

const statusTextClass: Record<Mission["status"], string> = {
  running: "text-accent-indigo",
  needs_review: "text-warning",
  completed: "text-success",
  failed: "text-error",
  cancelled: "text-text-muted",
};

const statusEdgeClass: Record<Mission["status"], string> = {
  running: "before:bg-accent-indigo",
  needs_review: "before:bg-warning",
  completed: "before:bg-success",
  failed: "before:bg-error",
  cancelled: "before:bg-text-muted/50",
};

function SectionLabel({ children, detail }: { children: React.ReactNode; detail?: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-end justify-between gap-4">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.13em] text-text-primary">{children}</h2>
      {detail && <div className="text-[10px] font-semibold text-text-muted">{detail}</div>}
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="min-w-0 border-r border-black/[0.05] px-3 first:pl-0 last:border-r-0 last:pr-0 laptop:px-5">
      <div className="flex items-center gap-1.5 text-text-muted">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-[0.12em]">{label}</span>
      </div>
      <div className="mt-1.5 truncate text-[18px] font-bold leading-none tracking-[-0.035em] text-text-primary laptop:text-[20px]">
        {value}
      </div>
    </div>
  );
}

export function MissionDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { mission, loading, error, refetch } = useMission(id);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const activeTab = searchParams.get("tab") ?? "timeline";

  const [cancelling, setCancelling] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "copied">("idle");
  const [downloading, setDownloading] = useState(false);

  async function handleCancel() {
    if (!id) return;
    setCancelling(true);
    try {
      await apiPost(`/api/missions/${id}/cancel`, { reason: "Annulée depuis l'interface" });
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(false);
    }
  }

  async function handleApprove() {
    if (!id) return;
    setApproving(true);
    try {
      await apiPost(`/api/missions/${id}/decision`, { decision: "approve" });
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!id) return;
    setRejecting(true);
    try {
      await apiPost(`/api/missions/${id}/decision`, { decision: "reject" });
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setRejecting(false);
    }
  }

  async function handleCopy(patch: string) {
    setCopyStatus("copying");
    try {
      await navigator.clipboard.writeText(patch);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("idle");
      return;
    }
    window.setTimeout(() => setCopyStatus("idle"), 1500);
  }

  function handleDownload(patch: string, missionId: string) {
    setDownloading(true);
    const blob = new Blob([patch], { type: "text/x-diff" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${missionId}.patch`;
    a.click();
    URL.revokeObjectURL(url);
    window.setTimeout(() => setDownloading(false), 400);
  }

  function setActiveTab(next: string) {
    const params = new URLSearchParams(searchParams);
    if (next === "timeline") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params, { replace: true });
  }

  const evidenceIdByFile = useMemo(
    () => new Map((mission?.evidence ?? []).map((e) => [e.title, e.id])),
    [mission],
  );

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
        <Skeleton className="mb-5 h-11 w-28 rounded-[14px]" />
        <Skeleton className="mb-5 h-[280px] w-full rounded-[24px]" />
        <Skeleton className="h-72 w-full rounded-[24px]" />
      </motion.div>
    );
  }

  if (error || !mission) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
        <ErrorState
          title={error ? "Impossible de joindre l'API Cortex" : "Mission introuvable"}
          description={error ?? "Cette mission n'existe pas ou a été supprimée."}
          onRetry={() => navigate(ROUTES.missions)}
        />
      </motion.div>
    );
  }

  const s = missionStatusConfig[mission.status];
  const selectedEvidence = mission.evidence.find((e) => e.id === selectedEvidenceId) ?? null;
  const testValue = mission.tests.total > 0 ? `${mission.tests.passed}/${mission.tests.total}` : "—";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28, ease: EASE_SPRING_ARRAY }}>
      <div className="mb-4 flex items-center justify-between gap-3 laptop:mb-5">
        <Link
          to={ROUTES.missions}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-[13px] px-1 text-[12px] font-bold text-text-muted transition-colors hover:text-text-primary active:opacity-70 laptop:min-h-0 laptop:text-sm"
        >
          <ChevronLeft className="size-[18px]" strokeWidth={3} />
          Missions
        </Link>
        <span className="max-w-[45%] truncate font-mono text-[9px] font-semibold text-text-muted/70 laptop:text-[10px]">
          {mission.id}
        </span>
      </div>

      <section
        className={cn(
          "relative mb-5 overflow-hidden rounded-[24px] border border-white/70 bg-white/54 shadow-[0_14px_44px_-30px_rgba(0,0,0,0.32)] backdrop-blur-2xl before:absolute before:inset-y-0 before:left-0 before:w-[3px] laptop:mb-7 laptop:rounded-[28px]",
          statusEdgeClass[mission.status],
        )}
      >
        <TerminalSquare
          className="pointer-events-none absolute -right-5 -top-7 size-[128px] -rotate-6 text-text-primary opacity-[0.025] laptop:size-[150px]"
          strokeWidth={2.7}
          aria-hidden
        />

        <div className="relative z-10 p-4 laptop:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={cn("text-[10px] font-bold uppercase tracking-[0.12em]", statusTextClass[mission.status])}>
                  {s.label}
                </span>
                <span className="font-mono text-[10px] font-semibold text-text-muted">{mission.model}</span>
              </div>
              <h1 className="mt-3 max-w-4xl text-[25px] font-bold leading-[1.08] tracking-[-0.045em] text-text-primary laptop:text-[30px]">
                {mission.objective}
              </h1>
              {mission.constraints && (
                <p className="mt-3 max-w-3xl text-[12px] font-medium leading-relaxed text-text-secondary laptop:text-[13px]">
                  <span className="font-bold text-text-primary">Contrainte</span> · {mission.constraints}
                </p>
              )}
            </div>

            {(mission.status === "running" || mission.status === "needs_review") && (
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancel}
                aria-label="Annuler la mission"
                className="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-error/15 bg-white/58 text-error shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_6px_18px_-12px_rgba(0,0,0,0.3)] transition-opacity hover:bg-error-muted/40 active:opacity-65 disabled:opacity-45 laptop:size-10"
              >
                <XCircle className="size-[20px]" strokeWidth={2.9} />
              </button>
            )}
          </div>

          {mission.summary && mission.status === "completed" && (
            <div className="mt-5 max-w-4xl border-l-2 border-text-primary/12 pl-3">
              <p className="text-[12px] font-semibold leading-relaxed text-text-secondary">{mission.summary}</p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-3 border-t border-black/[0.05] pt-4 laptop:mt-7 laptop:max-w-2xl laptop:pt-5">
            <Metric label="Durée" value={formatDuration(mission.durationMs)} icon={<Clock3 className="size-3.5" strokeWidth={2.8} />} />
            <Metric label="Fichiers" value={mission.filesModified.length} icon={<Files className="size-3.5" strokeWidth={2.8} />} />
            <Metric label="Tests" value={testValue} icon={<FlaskConical className="size-3.5" strokeWidth={2.8} />} />
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Étape actuelle</p>
              <p className="mt-1 truncate text-[13px] font-bold tracking-[-0.015em] text-text-primary">{mission.step}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Preuves</p>
              <p className="mt-1 text-[13px] font-bold text-text-primary">{mission.evidence.length}</p>
            </div>
          </div>

          {mission.status === "running" && (
            <div className="mt-4">
              <Progress value={mission.progress} />
              <div className="mt-1.5 flex justify-between text-[9px] font-bold text-text-muted">
                <span>Exécution</span>
                <span>{mission.progress}%</span>
              </div>
            </div>
          )}
        </div>

        {mission.decisionRequired && (
          <div className="relative z-10 border-t border-warning/20 bg-warning-muted/35 p-4 laptop:px-6 laptop:py-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-[19px] shrink-0 text-warning" strokeWidth={2.8} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold tracking-[-0.015em] text-text-primary">Décision humaine requise</p>
                <p className="mt-1 text-[12px] font-medium leading-relaxed text-text-secondary">{mission.decisionPrompt}</p>
                <div className="mt-4 grid grid-cols-2 gap-2.5 laptop:flex">
                  <button
                    type="button"
                    disabled={approving}
                    onClick={handleApprove}
                    className="min-h-11 rounded-[13px] border border-success/20 bg-white/65 px-4 text-[12px] font-bold text-success shadow-[inset_0_1px_1px_rgba(255,255,255,1)] transition-opacity hover:bg-success-muted/40 active:opacity-65 disabled:opacity-45"
                  >
                    <span className="inline-flex items-center gap-2"><Check className="size-4" strokeWidth={3} /> Approuver</span>
                  </button>
                  <button
                    type="button"
                    disabled={rejecting}
                    onClick={handleReject}
                    className="min-h-11 rounded-[13px] border border-error/18 bg-white/55 px-4 text-[12px] font-bold text-error shadow-[inset_0_1px_1px_rgba(255,255,255,1)] transition-opacity hover:bg-error-muted/35 active:opacity-65 disabled:opacity-45"
                  >
                    <span className="inline-flex items-center gap-2"><X className="size-4" strokeWidth={3} /> Rejeter</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 laptop:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <SectionLabel detail={`${mission.timeline.length} événements`}>Exécution</SectionLabel>
            <TabsList className="mb-4 border-b-black/[0.06] laptop:mb-5">
              <TabsTrigger className="px-2.5 text-[12px] font-bold data-[state=active]:after:bg-text-primary laptop:px-3 laptop:text-sm" value="timeline">Journal</TabsTrigger>
              <TabsTrigger className="px-2.5 text-[12px] font-bold data-[state=active]:after:bg-text-primary laptop:px-3 laptop:text-sm" value="files">Fichiers</TabsTrigger>
              <TabsTrigger className="px-2.5 text-[12px] font-bold data-[state=active]:after:bg-text-primary laptop:px-3 laptop:text-sm" value="tests">Tests</TabsTrigger>
              <TabsTrigger className="px-2.5 text-[12px] font-bold data-[state=active]:after:bg-text-primary laptop:px-3 laptop:text-sm" value="evidence">Preuves</TabsTrigger>
              <TabsTrigger className="px-2.5 text-[12px] font-bold data-[state=active]:after:bg-text-primary laptop:px-3 laptop:text-sm" value="patch">Patch</TabsTrigger>
              <TabsTrigger className="px-2.5 text-[12px] font-bold data-[state=active]:after:bg-text-primary laptop:px-3 laptop:text-sm" value="errors">Signal</TabsTrigger>
            </TabsList>

            <div className="min-h-[220px]">
              <TabsContent value="timeline">
                {mission.timeline.length === 0 ? (
                  <EmptyState icon={<Route className="size-5" />} title="Aucun événement pour l'instant" compact />
                ) : (
                  <div className="rounded-[20px] border border-white/60 bg-white/34 px-3 py-2 backdrop-blur-xl laptop:px-4 laptop:py-3">
                    {mission.timeline.map((ev, i) => (
                      <TimelineItem
                        key={ev.id}
                        type={ev.type}
                        title={ev.title}
                        detail={ev.detail}
                        ts={ev.ts}
                        children={ev.children}
                        isLast={i === mission.timeline.length - 1}
                        hasEvidence={Boolean(ev.evidenceId)}
                        onOpenEvidence={() => ev.evidenceId && setSelectedEvidenceId(ev.evidenceId)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="files">
                <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2">
                  <div className="rounded-[18px] border border-white/60 bg-white/34 p-4 backdrop-blur-xl">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.11em] text-text-primary">Consultés</h3>
                      <span className="text-[11px] font-bold tabular-nums text-text-muted">{mission.filesRead.length}</span>
                    </div>
                    {mission.filesRead.length === 0 ? (
                      <p className="text-[12px] font-medium text-text-muted">Aucun fichier consulté.</p>
                    ) : (
                      <ul className="space-y-1">
                        {mission.filesRead.map((f) => (
                          <li key={f} className="flex min-h-9 items-center gap-2 rounded-[10px] px-1 font-mono text-[11px] font-medium text-text-secondary">
                            <FileText className="size-3.5 shrink-0 text-text-muted" strokeWidth={2.6} />
                            <span className="truncate">{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="rounded-[18px] border border-white/60 bg-white/34 p-4 backdrop-blur-xl">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.11em] text-text-primary">Modifiés</h3>
                      <span className="text-[11px] font-bold tabular-nums text-text-muted">{mission.filesModified.length}</span>
                    </div>
                    {mission.filesModified.length === 0 ? (
                      <p className="text-[12px] font-medium text-text-muted">Aucun fichier modifié.</p>
                    ) : (
                      <ul className="space-y-1">
                        {mission.filesModified.map((f) => {
                          const evId = evidenceIdByFile.get(f) ?? null;
                          return (
                            <li key={f}>
                              <button
                                type="button"
                                disabled={!evId}
                                onClick={() => evId && setSelectedEvidenceId(evId)}
                                className="flex min-h-9 w-full items-center gap-2 rounded-[10px] px-1 text-left font-mono text-[11px] font-semibold text-text-secondary transition-colors hover:bg-white/55 hover:text-text-primary disabled:cursor-default disabled:hover:bg-transparent"
                              >
                                <FileEdit className="size-3.5 shrink-0 text-info" strokeWidth={2.7} />
                                <span className="truncate">{f}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tests">
                {mission.tests.total === 0 ? (
                  <EmptyState icon={<FlaskConical className="size-5" />} title="Aucun test exécuté" description="Cette mission n'a pas encore atteint l'étape de test." compact />
                ) : (
                  <div className="rounded-[20px] border border-white/60 bg-white/34 p-4 backdrop-blur-xl">
                    <div className="grid grid-cols-3 border-b border-black/[0.05] pb-4">
                      <Metric label="Total" value={mission.tests.total} icon={<FlaskConical className="size-3.5" strokeWidth={2.8} />} />
                      <Metric label="Passés" value={mission.tests.passed} icon={<Check className="size-3.5 text-success" strokeWidth={3} />} />
                      <Metric label="Échecs" value={mission.tests.failed} icon={<X className="size-3.5 text-error" strokeWidth={3} />} />
                    </div>
                    <div className="mt-4 space-y-2">
                      {mission.evidence.filter((e) => e.kind === "test").map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => setSelectedEvidenceId(e.id)}
                          className="flex min-h-11 w-full items-center gap-3 rounded-[13px] border border-white/60 bg-white/48 px-3 text-left font-mono text-[11px] font-semibold text-text-secondary transition-colors hover:bg-white/70"
                        >
                          <FlaskConical className="size-4 shrink-0 text-success" strokeWidth={2.8} />
                          <span className="truncate">{e.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="evidence">
                {mission.evidence.length === 0 ? (
                  <EmptyState icon={<GitCompare className="size-5" />} title="Aucune preuve enregistrée" compact />
                ) : (
                  <div className="space-y-2">
                    {mission.evidence.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSelectedEvidenceId(e.id)}
                        className="group flex min-h-[58px] w-full items-center gap-3 rounded-[16px] border border-white/60 bg-white/38 px-3 text-left backdrop-blur-xl transition-colors hover:bg-white/62"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-[11px] border border-white/70 bg-white/58 text-text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                          <GitCompare className="size-4" strokeWidth={2.8} />
                        </span>
                        <span className="min-w-0 flex-1 truncate font-mono text-[11px] font-semibold text-text-primary">{e.title}</span>
                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted">{e.kind}</span>
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="patch">
                {mission.patch ? (
                  <div>
                    <div className="mb-3 flex justify-end gap-2">
                      <Button size="sm" variant="secondary" loading={copyStatus === "copying"} onClick={() => handleCopy(mission.patch!)}>
                        {copyStatus === "copied" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                        {copyStatus === "copied" ? "Copié" : "Copier"}
                      </Button>
                      <Button size="sm" variant="secondary" loading={downloading} onClick={() => handleDownload(mission.patch!, mission.id)}>
                        <Download className="size-3.5" /> Télécharger
                      </Button>
                    </div>
                    <DiffView content={mission.patch} />
                  </div>
                ) : (
                  <EmptyState icon={<GitCompare className="size-5" />} title="Aucun patch disponible" description="La mission n'a pas encore produit de patch, ou aucune modification n'a été retenue." compact />
                )}
              </TabsContent>

              <TabsContent value="errors">
                {mission.error ? (
                  <ErrorState title="La mission a échoué" description={mission.error} compact />
                ) : mission.decisionRequired ? (
                  <div className="rounded-[18px] border border-warning/25 bg-warning-muted/40 p-4">
                    <p className="text-[13px] font-bold text-text-primary">Décision requise</p>
                    <p className="mt-1 text-[12px] font-medium leading-relaxed text-text-secondary">{mission.decisionPrompt}</p>
                  </div>
                ) : (
                  <EmptyState icon={<AlertTriangle className="size-5" />} title="Rien à signaler" description="Aucune erreur, aucune décision humaine en attente." compact />
                )}
              </TabsContent>
            </div>
          </Tabs>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-black/[0.05] pt-4 text-[10px] font-semibold text-text-muted">
            <span>Créée {formatClock(mission.createdAt)}</span>
            {mission.closedAt && <span>Clôturée {formatClock(mission.closedAt)}</span>}
          </div>
        </div>

        <div className="hidden laptop:block">
          <div className="sticky top-6 h-[calc(100vh-6rem)] overflow-hidden rounded-[22px] border border-white/65 bg-white/32 backdrop-blur-xl">
            <InspectorPanel
              title={selectedEvidence ? "Preuve" : "Inspection"}
              onClose={selectedEvidence ? () => setSelectedEvidenceId(null) : undefined}
            >
              {selectedEvidence ? (
                <EvidenceDetail evidence={selectedEvidence} />
              ) : (
                <div className="p-4 text-[12px] font-medium leading-relaxed text-text-muted">
                  Sélectionnez une preuve, un test ou un fichier modifié pour inspecter son contenu.
                </div>
              )}
            </InspectorPanel>
          </div>
        </div>
      </div>

      <Drawer open={Boolean(selectedEvidence)} onOpenChange={(open) => !open && setSelectedEvidenceId(null)}>
        <DrawerContent side="bottom" title="Preuve" className="laptop:hidden">
          {selectedEvidence && <EvidenceDetail evidence={selectedEvidence} />}
        </DrawerContent>
      </Drawer>
    </motion.div>
  );
}
