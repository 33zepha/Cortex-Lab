import { useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ChevronLeft,
  FileText,
  FileEdit,
  FlaskConical,
  GitCompare,
  AlertTriangle,
  Copy,
  Download,
  XCircle,
} from "lucide-react";
import {
  Badge,
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
} from "@/components/ui";
import { findMission } from "@/fixtures/missions";
import { missionStatusConfig, formatDuration, formatClock } from "@/lib/status";
import { EvidenceDetail } from "@/screens/mission-detail/EvidenceDetail";
import { DiffView } from "@/screens/mission-detail/DiffView";

export function MissionDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mission = id ? findMission(id) : undefined;
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const activeTab = searchParams.get("tab") ?? "timeline";

  function setActiveTab(next: string) {
    const params = new URLSearchParams(searchParams);
    if (next === "timeline") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params, { replace: true });
  }

  if (!mission) {
    return (
      <ErrorState
        title="Mission introuvable"
        description="Cette mission n'existe pas ou a été supprimée."
        onRetry={() => navigate("/missions")}
      />
    );
  }

  const s = missionStatusConfig[mission.status];
  const selectedEvidence = mission.evidence.find((e) => e.id === selectedEvidenceId) ?? null;

  function findEvidenceForFile(path: string) {
    return mission!.evidence.find((e) => e.title === path)?.id ?? null;
  }

  return (
    <div>
      <Link
        to="/missions"
        className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary"
      >
        <ChevronLeft className="size-4" /> Missions
      </Link>

      {/* En-tête éditorial, compact */}
      <div className="mb-6 rounded-lg border border-border bg-surface-1 px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2">
              <Badge tone={s.tone} dot pulse={s.pulse}>
                {s.label}
              </Badge>
              <span className="font-mono text-label text-text-muted">{mission.model}</span>
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-text-primary">{mission.objective}</h1>
            {mission.constraints && (
              <p className="mt-1 text-body-text text-text-secondary">Contrainte : {mission.constraints}</p>
            )}
          </div>
          {(mission.status === "running" || mission.status === "needs_review") && (
            <Button variant="secondary" size="sm" className="w-full shrink-0 tablet:w-auto">
              <XCircle className="size-3.5" /> Annuler la mission
            </Button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-body-text text-text-secondary">
          <span>Étape : {mission.step}</span>
          <span>{formatDuration(mission.durationMs)}</span>
          <span>{mission.filesModified.length} fichier(s) modifié(s)</span>
          {mission.tests.total > 0 && (
            <span>
              {mission.tests.passed}/{mission.tests.total} tests
            </span>
          )}
        </div>

        {mission.status === "running" && (
          <div className="mt-3">
            <Progress value={mission.progress} />
          </div>
        )}

        {mission.decisionRequired && (
          <div className="mt-4 flex items-start gap-3 rounded-md border border-border border-l-[3px] border-l-warning bg-surface-2 px-4 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <div className="min-w-0 flex-1">
              <p className="text-body-text font-medium text-text-primary">Décision humaine requise</p>
              <p className="mt-0.5 text-body-text text-text-secondary">{mission.decisionPrompt}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="primary">Approuver</Button>
                <Button size="sm" variant="secondary">Rejeter</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Corps : contenu + inspection */}
      <div className="grid grid-cols-1 gap-6 laptop:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="laptop:hidden">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="files">Fichiers</TabsTrigger>
              <TabsTrigger value="tests">Tests</TabsTrigger>
              <TabsTrigger value="evidence">Preuves</TabsTrigger>
              <TabsTrigger value="patch">Patch</TabsTrigger>
              <TabsTrigger value="errors">Erreurs</TabsTrigger>
            </TabsList>

            <div className="mt-5">
              <TabsContent value="timeline">
                {mission.timeline.length === 0 ? (
                  <EmptyState icon={<FileText className="size-5" />} title="Aucun événement pour l'instant" compact />
                ) : (
                  <div>
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
                <div className="grid grid-cols-1 gap-6 tablet:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
                      Consultés ({mission.filesRead.length})
                    </h4>
                    {mission.filesRead.length === 0 ? (
                      <p className="text-sm text-text-muted">Aucun fichier consulté.</p>
                    ) : (
                      <ul className="space-y-1">
                        {mission.filesRead.map((f) => (
                          <li key={f} className="flex items-center gap-2 rounded-md px-2 py-1.5 font-mono text-sm text-text-secondary">
                            <FileText className="size-3.5 shrink-0 text-text-muted" />
                            <span className="truncate">{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
                      Modifiés ({mission.filesModified.length})
                    </h4>
                    {mission.filesModified.length === 0 ? (
                      <p className="text-sm text-text-muted">Aucun fichier modifié.</p>
                    ) : (
                      <ul className="space-y-1">
                        {mission.filesModified.map((f) => {
                          const evId = findEvidenceForFile(f);
                          return (
                            <li key={f}>
                              <button
                                type="button"
                                disabled={!evId}
                                onClick={() => evId && setSelectedEvidenceId(evId)}
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 font-mono text-sm text-text-secondary hover:bg-surface-2 hover:text-text-primary disabled:cursor-default disabled:hover:bg-transparent"
                              >
                                <FileEdit className="size-3.5 shrink-0 text-info" />
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
                  <div>
                    <div className="mb-4 flex items-center gap-4">
                      <Badge tone={mission.tests.status === "passing" ? "success" : "error"}>
                        {mission.tests.passed}/{mission.tests.total} passants
                      </Badge>
                      {mission.tests.failed > 0 && <Badge tone="error">{mission.tests.failed} en échec</Badge>}
                    </div>
                    {mission.evidence
                      .filter((e) => e.kind === "test")
                      .map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => setSelectedEvidenceId(e.id)}
                          className="mb-2 flex w-full items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-left font-mono text-sm text-text-secondary hover:border-border-strong"
                        >
                          <FlaskConical className="size-3.5 shrink-0 text-success" />
                          <span className="truncate">{e.title}</span>
                        </button>
                      ))}
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
                        className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-left hover:border-border-strong"
                      >
                        <span className="truncate font-mono text-sm text-text-secondary">{e.title}</span>
                        <Badge tone="neutral">{e.kind}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="patch">
                {mission.patch ? (
                  <div>
                    <div className="mb-3 flex justify-end gap-2">
                      <Button size="sm" variant="secondary">
                        <Copy className="size-3.5" /> Copier
                      </Button>
                      <Button size="sm" variant="secondary">
                        <Download className="size-3.5" /> Télécharger
                      </Button>
                    </div>
                    <DiffView content={mission.patch} />
                  </div>
                ) : (
                  <EmptyState
                    icon={<GitCompare className="size-5" />}
                    title="Aucun patch disponible"
                    description="La mission n'a pas encore produit de patch, ou aucune modification n'a été retenue."
                    compact
                  />
                )}
              </TabsContent>

              <TabsContent value="errors">
                {mission.error ? (
                  <ErrorState title="La mission a échoué" description={mission.error} compact />
                ) : mission.decisionRequired ? (
                  <div className="rounded-md border border-warning/30 bg-warning-muted p-4">
                    <p className="text-sm font-medium text-text-primary">Décision requise</p>
                    <p className="mt-1 text-sm text-text-secondary">{mission.decisionPrompt}</p>
                  </div>
                ) : (
                  <EmptyState
                    icon={<AlertTriangle className="size-5" />}
                    title="Rien à signaler"
                    description="Aucune erreur, aucune décision humaine en attente."
                    compact
                  />
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Panneau d'inspection — desktop */}
        <div className="hidden laptop:block">
          <div className="sticky top-6 h-[calc(100vh-6rem)] overflow-hidden rounded-lg border border-border">
            <InspectorPanel
              title={selectedEvidence ? "Preuve" : "Inspection"}
              onClose={selectedEvidence ? () => setSelectedEvidenceId(null) : undefined}
            >
              {selectedEvidence && <EvidenceDetail evidence={selectedEvidence} />}
            </InspectorPanel>
          </div>
        </div>
      </div>

      {/* Panneau d'inspection — mobile/tablet, en drawer bas */}
      <Drawer open={Boolean(selectedEvidence)} onOpenChange={(open) => !open && setSelectedEvidenceId(null)}>
        <DrawerContent side="bottom" title="Preuve" className="laptop:hidden">
          {selectedEvidence && <EvidenceDetail evidence={selectedEvidence} />}
        </DrawerContent>
      </Drawer>

      <p className="mt-6 text-xs text-text-muted">
        Créée à {formatClock(mission.createdAt)}
        {mission.closedAt ? ` · Clôturée à ${formatClock(mission.closedAt)}` : ""}
      </p>
    </div>
  );
}
