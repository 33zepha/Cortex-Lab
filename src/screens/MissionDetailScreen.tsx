import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  Clock3,
  Copy,
  Download,
  FileEdit,
  Files,
  FileText,
  FlaskConical,
  GitCompare,
  Route,
  X,
  XCircle,
} from "lucide-react";
import {
  Button,
  Drawer,
  DrawerContent,
  EmptyState,
  ErrorState,
  InspectorPanel,
  Progress,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TimelineItem,
} from "@/components/ui";
import { useMission } from "@/lib/useMissions";
import { apiPost } from "@/lib/api";
import { ROUTES } from "@/lib/routes";
import { getMissionDisplay } from "@/lib/mission-naming";
import { formatClock, formatDuration, missionStatusConfig } from "@/lib/status";
import { EvidenceDetail } from "@/screens/mission-detail/EvidenceDetail";
import { DiffView } from "@/screens/mission-detail/DiffView";
import { cn } from "@/lib/cn";
import type { Mission } from "@/lib/types";

const statusTextClass: Record<Mission["status"], string> = {
  running: "text-accent-indigo",
  needs_review: "text-warning",
  completed: "text-success",
  failed: "text-error",
  cancelled: "text-text-muted",
};

function SectionHeading({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="text-[13px] font-bold tracking-[-0.015em] text-text-primary laptop:text-[14px]">{title}</h2>
      {detail && <span className="text-[10px] font-semibold text-text-muted laptop:text-[11px]">{detail}</span>}
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-text-muted">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-[0.1em]">{label}</span>
      </div>
      <p className="mt-1 truncate text-[18px] font-bold leading-none tracking-[-0.035em] text-text-primary laptop:text-[20px]">{value}</p>
    </div>
  );
}

export function MissionDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { mission, loading, error, refetch } = useMission(id);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "copied">("idle");
  const [downloading, setDownloading] = useState(false);
  const activeTab = searchParams.get("tab") ?? "timeline";

  const evidenceIdByFile = useMemo(
    () => new Map((mission?.evidence ?? []).map((evidence) => [evidence.title, evidence.id])),
    [mission],
  );

  function setActiveTab(next: string) {
    const params = new URLSearchParams(searchParams);
    if (next === "timeline") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params, { replace: true });
  }

  async function handleCancel() {
    if (!id) return;
    setCancelling(true);
    try {
      await apiPost(`/api/missions/${id}/cancel`, { reason: "Annulée depuis l'interface" });
      refetch();
    } finally {
      setCancelling(false);
    }
  }

  async function handleDecision(decision: "approve" | "reject") {
    if (!id) return;
    const setter = decision === "approve" ? setApproving : setRejecting;
    setter(true);
    try {
      await apiPost(`/api/missions/${id}/decision`, { decision });
      refetch();
    } finally {
      setter(false);
    }
  }

  async function handleCopy(patch: string) {
    setCopyStatus("copying");
    try {
      await navigator.clipboard.writeText(patch);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1500);
    } catch {
      setCopyStatus("idle");
    }
  }

  function handleDownload(patch: string, missionId: string) {
    setDownloading(true);
    const blob = new Blob([patch], { type: "text/x-diff" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${missionId}.patch`;
    anchor.click();
    URL.revokeObjectURL(url);
    window.setTimeout(() => setDownloading(false), 400);
  }

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}>
        <Skeleton className="mb-5 h-10 w-28 rounded-[12px]" />
        <Skeleton className="mb-8 h-52 w-full rounded-[18px]" />
        <Skeleton className="h-72 w-full rounded-[18px]" />
      </motion.div>
    );
  }

  if (error || !mission) {
    return (
      <ErrorState
        title={error ? "Impossible de joindre l'API Cortex" : "Mission introuvable"}
        description={error ?? "Cette mission n'existe pas ou a été supprimée."}
        onRetry={() => navigate(ROUTES.missions)}
      />
    );
  }

  const status = missionStatusConfig[mission.status];
  const selectedEvidence = mission.evidence.find((evidence) => evidence.id === selectedEvidenceId) ?? null;
  const testsValue = mission.tests.total > 0 ? `${mission.tests.passed}/${mission.tests.total}` : "—";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link to={ROUTES.missions} className="inline-flex min-h-11 items-center gap-1.5 text-[12px] font-bold text-text-muted hover:text-text-primary laptop:min-h-0 laptop:text-sm">
          <ChevronLeft className="size-[18px]" strokeWidth={3} /> Missions
        </Link>
        <span className="max-w-[45%] truncate font-mono text-[9px] font-semibold text-text-muted/65 laptop:text-[10px]">{mission.id}</span>
      </div>

      <header className="relative border-y border-black/[0.065] py-5 laptop:py-7">
        <Route className="pointer-events-none absolute -right-2 -top-6 size-[110px] -rotate-6 text-text-primary opacity-[0.025]" strokeWidth={2.7} aria-hidden />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className={cn("text-[10px] font-bold uppercase tracking-[0.11em]", statusTextClass[mission.status])}>{status.label}</span>
              <span className="font-mono text-[10px] font-semibold text-text-muted">{mission.model}</span>
            </div>
            <h1 className="mt-3 max-w-4xl text-[26px] font-bold leading-[1.06] tracking-[-0.045em] text-text-primary laptop:text-[32px]">
              {getMissionDisplay(mission, { preset: "hero" }).title}
            </h1>
            {getMissionDisplay(mission, { preset: "hero" }).isSummarized && (
              <div className="mt-3 max-w-3xl rounded-xl border border-border/80 bg-surface-1/70 p-3.5 shadow-sm">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">
                  Objectif complet
                </p>
                <p className="text-[12px] font-medium leading-relaxed text-text-primary">
                  {getMissionDisplay(mission, { preset: "hero" }).fullObjective}
                </p>
              </div>
            )}
            {mission.summary && mission.status === "completed" && (
              <p className="mt-4 max-w-3xl text-[12px] font-semibold leading-relaxed text-text-secondary laptop:text-[13px]">{mission.summary}</p>
            )}
            {mission.constraints && (
              <p className="mt-3 max-w-3xl text-[11px] font-medium leading-relaxed text-text-muted">
                <span className="font-bold text-text-secondary">Contrainte</span> · {mission.constraints}
              </p>
            )}
          </div>

          {(mission.status === "running" || mission.status === "needs_review") && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              aria-label="Annuler la mission"
              className="flex size-11 shrink-0 items-center justify-center rounded-[12px] border border-error/18 text-error hover:bg-error-muted/25 active:opacity-70 disabled:opacity-45 laptop:size-10"
            >
              <XCircle className="size-[19px]" strokeWidth={2.9} />
            </button>
          )}
        </div>

        <div className="relative z-10 mt-6 grid grid-cols-3 gap-5 border-t border-black/[0.055] pt-4 laptop:max-w-2xl laptop:gap-10 laptop:pt-5">
          <Metric label="Durée" value={formatDuration(mission.durationMs)} icon={<Clock3 className="size-3.5" strokeWidth={2.8} />} />
          <Metric label="Fichiers" value={mission.filesModified.length} icon={<Files className="size-3.5" strokeWidth={2.8} />} />
          <Metric label="Tests" value={testsValue} icon={<FlaskConical className="size-3.5" strokeWidth={2.8} />} />
        </div>

        <div className="relative z-10 mt-5 flex items-end justify-between gap-5">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted">Étape</p>
            <p className="mt-1 truncate text-[12px] font-bold text-text-primary">{mission.step}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted">Preuves</p>
            <p className="mt-1 text-[12px] font-bold text-text-primary">{mission.evidence.length}</p>
          </div>
        </div>

        {mission.status === "running" && (
          <div className="relative z-10 mt-4">
            <Progress value={mission.progress} />
            <div className="mt-1.5 flex justify-between text-[9px] font-semibold text-text-muted"><span>Exécution</span><span>{mission.progress}%</span></div>
          </div>
        )}
      </header>

      {mission.decisionRequired && (
        <section className="border-b border-warning/25 py-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-[18px] shrink-0 text-warning" strokeWidth={2.8} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-text-primary">Décision humaine requise</p>
              <p className="mt-1 text-[12px] font-medium leading-relaxed text-text-secondary">{mission.decisionPrompt}</p>
              <div className="mt-4 flex gap-2.5">
                <button type="button" disabled={approving} onClick={() => handleDecision("approve")} className="min-h-11 rounded-[11px] bg-text-primary px-4 text-[12px] font-bold text-white active:opacity-80 disabled:opacity-45">
                  <span className="inline-flex items-center gap-2"><Check className="size-4" strokeWidth={3} /> Approuver</span>
                </button>
                <button type="button" disabled={rejecting} onClick={() => handleDecision("reject")} className="min-h-11 rounded-[11px] border border-black/[0.08] px-4 text-[12px] font-bold text-text-primary active:opacity-70 disabled:opacity-45">
                  <span className="inline-flex items-center gap-2"><X className="size-4" strokeWidth={3} /> Rejeter</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 laptop:grid-cols-[minmax(0,1fr)_320px] laptop:gap-10">
        <div className="min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <SectionHeading title="Exécution" detail={`${mission.timeline.length} événements`} />
            <TabsList className="mb-5 border-b-black/[0.065]">
              <TabsTrigger className="px-2 text-[12px] font-bold data-[state=active]:after:bg-text-primary" value="timeline">Journal</TabsTrigger>
              <TabsTrigger className="px-2 text-[12px] font-bold data-[state=active]:after:bg-text-primary" value="files">Fichiers</TabsTrigger>
              <TabsTrigger className="px-2 text-[12px] font-bold data-[state=active]:after:bg-text-primary" value="tests">Tests</TabsTrigger>
              <TabsTrigger className="px-2 text-[12px] font-bold data-[state=active]:after:bg-text-primary" value="evidence">Preuves</TabsTrigger>
              <TabsTrigger className="px-2 text-[12px] font-bold data-[state=active]:after:bg-text-primary" value="patch">Patch</TabsTrigger>
              <TabsTrigger className="px-2 text-[12px] font-bold data-[state=active]:after:bg-text-primary" value="errors">Signal</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline">
              {mission.timeline.length === 0 ? (
                <EmptyState icon={<Route className="size-5" />} title="Aucun événement pour l'instant" compact />
              ) : (
                <div className="border-y border-black/[0.06] py-2">
                  {mission.timeline.map((event, index) => (
                    <TimelineItem
                      key={event.id}
                      type={event.type}
                      title={event.title}
                      detail={event.detail}
                      ts={event.ts}
                      children={event.children}
                      isLast={index === mission.timeline.length - 1}
                      hasEvidence={Boolean(event.evidenceId)}
                      onOpenEvidence={() => event.evidenceId && setSelectedEvidenceId(event.evidenceId)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="files">
              <div className="grid grid-cols-1 gap-6 tablet:grid-cols-2">
                <FileList title="Consultés" files={mission.filesRead} icon="read" />
                <div>
                  <div className="mb-2 flex items-baseline justify-between"><h3 className="text-[11px] font-bold text-text-primary">Modifiés</h3><span className="text-[10px] font-semibold text-text-muted">{mission.filesModified.length}</span></div>
                  <ul className="border-y border-black/[0.06] divide-y divide-black/[0.05]">
                    {mission.filesModified.length === 0 ? (
                      <li className="py-3 text-[11px] font-medium text-text-muted">Aucun fichier modifié.</li>
                    ) : mission.filesModified.map((file) => {
                      const evidenceId = evidenceIdByFile.get(file) ?? null;
                      return (
                        <li key={file}>
                          <button type="button" disabled={!evidenceId} onClick={() => evidenceId && setSelectedEvidenceId(evidenceId)} className="flex min-h-10 w-full items-center gap-2 py-2 text-left font-mono text-[11px] font-semibold text-text-secondary hover:text-text-primary disabled:cursor-default">
                            <FileEdit className="size-3.5 shrink-0" strokeWidth={2.7} /><span className="truncate">{file}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tests">
              {mission.tests.total === 0 ? (
                <EmptyState icon={<FlaskConical className="size-5" />} title="Aucun test exécuté" compact />
              ) : (
                <div>
                  <div className="grid grid-cols-3 gap-5 border-y border-black/[0.06] py-4">
                    <Metric label="Total" value={mission.tests.total} icon={<FlaskConical className="size-3.5" strokeWidth={2.8} />} />
                    <Metric label="Passés" value={mission.tests.passed} icon={<Check className="size-3.5" strokeWidth={3} />} />
                    <Metric label="Échecs" value={mission.tests.failed} icon={<X className="size-3.5" strokeWidth={3} />} />
                  </div>
                  <div className="mt-5 divide-y divide-black/[0.05] border-y border-black/[0.06]">
                    {mission.evidence.filter((evidence) => evidence.kind === "test").map((evidence) => (
                      <button key={evidence.id} type="button" onClick={() => setSelectedEvidenceId(evidence.id)} className="flex min-h-11 w-full items-center gap-3 py-2.5 text-left font-mono text-[11px] font-semibold text-text-secondary hover:text-text-primary">
                        <FlaskConical className="size-4 shrink-0" strokeWidth={2.8} /><span className="truncate">{evidence.title}</span>
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
                <div className="divide-y divide-black/[0.05] border-y border-black/[0.06]">
                  {mission.evidence.map((evidence) => (
                    <button key={evidence.id} type="button" onClick={() => setSelectedEvidenceId(evidence.id)} className="grid min-h-[52px] w-full grid-cols-[1fr_auto] items-center gap-4 py-2.5 text-left hover:text-text-primary">
                      <span className="min-w-0 truncate font-mono text-[11px] font-semibold text-text-primary">{evidence.title}</span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.09em] text-text-muted">{evidence.kind}</span>
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
                <EmptyState icon={<GitCompare className="size-5" />} title="Aucun patch disponible" compact />
              )}
            </TabsContent>

            <TabsContent value="errors">
              {mission.error ? (
                <ErrorState title="La mission a échoué" description={mission.error} compact />
              ) : mission.decisionRequired ? (
                <div className="border-y border-warning/25 py-4"><p className="text-[12px] font-bold text-text-primary">Décision requise</p><p className="mt-1 text-[12px] font-medium text-text-secondary">{mission.decisionPrompt}</p></div>
              ) : (
                <div className="border-y border-black/[0.06] py-4 text-[12px] font-semibold text-text-muted">Aucun signal à traiter.</div>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex flex-wrap gap-x-3 gap-y-1 border-t border-black/[0.05] pt-4 text-[10px] font-semibold text-text-muted">
            <span>Créée {formatClock(mission.createdAt)}</span>
            {mission.closedAt && <span>Clôturée {formatClock(mission.closedAt)}</span>}
          </div>
        </div>

        <aside className="hidden laptop:block">
          <div className="sticky top-6 h-[calc(100vh-6rem)] overflow-hidden border-l border-black/[0.065] pl-5">
            <InspectorPanel title={selectedEvidence ? "Preuve" : "Inspection"} onClose={selectedEvidence ? () => setSelectedEvidenceId(null) : undefined}>
              {selectedEvidence ? <EvidenceDetail evidence={selectedEvidence} /> : <div className="p-4 text-[12px] font-medium leading-relaxed text-text-muted">Sélectionnez une preuve, un test ou un fichier modifié.</div>}
            </InspectorPanel>
          </div>
        </aside>
      </div>

      <Drawer open={Boolean(selectedEvidence)} onOpenChange={(open) => !open && setSelectedEvidenceId(null)}>
        <DrawerContent side="bottom" title="Preuve" className="laptop:hidden">
          {selectedEvidence && <EvidenceDetail evidence={selectedEvidence} />}
        </DrawerContent>
      </Drawer>
    </motion.div>
  );
}

function FileList({ title, files, icon }: { title: string; files: string[]; icon: "read" }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between"><h3 className="text-[11px] font-bold text-text-primary">{title}</h3><span className="text-[10px] font-semibold text-text-muted">{files.length}</span></div>
      <ul className="divide-y divide-black/[0.05] border-y border-black/[0.06]">
        {files.length === 0 ? (
          <li className="py-3 text-[11px] font-medium text-text-muted">Aucun fichier consulté.</li>
        ) : files.map((file) => (
          <li key={file} className="flex min-h-10 items-center gap-2 py-2 font-mono text-[11px] font-medium text-text-secondary">
            {icon === "read" && <FileText className="size-3.5 shrink-0" strokeWidth={2.6} />}
            <span className="truncate">{file}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
