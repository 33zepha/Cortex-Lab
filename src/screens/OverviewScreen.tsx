import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Inbox, Sparkles, Server, Cpu } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { BentoCard, Badge, Progress, StatusIndicator, EmptyState, DataRow } from "@/components/ui";
import { allMissions, missionActive } from "@/fixtures/missions";
import { systemHealthy, weeklyTokenUsage } from "@/fixtures/system";
import { missionStatusConfig, formatDuration, formatRelativeTime } from "@/lib/status";
import { TokenUsageChart } from "@/screens/overview/TokenUsageChart";
import { KpiRow } from "@/screens/overview/KpiRow";

const now = Date.parse("2026-08-06T14:30:00Z");

export function OverviewScreen() {
  const navigate = useNavigate();
  const needsReview = allMissions.filter((m) => m.decisionRequired);
  const completed = allMissions
    .filter((m) => m.status === "completed")
    .sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0))
    .slice(0, 3);

  const recentActivity = allMissions
    .flatMap((m) => m.timeline.map((t) => ({ ...t, missionId: m.id, objective: m.objective })))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 5);

  const activeStatus = missionStatusConfig[missionActive.status];
  const totalTokens = weeklyTokenUsage.reduce((sum, d) => sum + d.tokens, 0);

  return (
    <div>
      <PageHeader title="Overview" description="État réel de Cortex et de vos missions." />

      <KpiRow missions={allMissions} />

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-4 laptop:grid-cols-12">
        {/* Mission active — carte dominante */}
        <BentoCard
          eyebrow="Mission active"
          span="tablet:col-span-4 laptop:col-span-8"
          action={<Badge tone={activeStatus.tone} dot pulse={activeStatus.pulse}>{activeStatus.label}</Badge>}
        >
          <Link to={`/missions/${missionActive.id}`} className="group block">
            <h2 className="text-lg font-semibold text-text-primary group-hover:text-accent-indigo transition-colors">
              {missionActive.objective}
            </h2>
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs text-text-muted">
                <span>Étape : {missionActive.step}</span>
                <span>{missionActive.progress}%</span>
              </div>
              <Progress value={missionActive.progress} />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-secondary">
              <span className="font-mono text-xs">{missionActive.model}</span>
              <span>{formatDuration(missionActive.durationMs)}</span>
              <span>{missionActive.filesModified.length} fichier(s) modifié(s)</span>
            </div>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent-indigo">
              Voir le détail <ArrowRight className="size-3.5" />
            </span>
          </Link>
        </BentoCard>

        {/* Missions nécessitant une décision */}
        <BentoCard
          eyebrow="Décisions requises"
          title={needsReview.length > 0 ? `${needsReview.length} mission(s)` : undefined}
          span="tablet:col-span-4 laptop:col-span-4"
        >
          {needsReview.length === 0 ? (
            <EmptyState icon={<Inbox className="size-5" />} title="Rien en attente" description="Aucune mission n'a besoin de votre décision." compact />
          ) : (
            <div className="-mx-2">
              {needsReview.map((m) => (
                <DataRow
                  key={m.id}
                  primary={m.objective}
                  secondary={m.decisionPrompt}
                  onClick={() => navigate(`/missions/${m.id}`)}
                  trailing={
                    <span className="flex items-center gap-1 text-sm font-medium text-accent-indigo">
                      Examiner <ArrowRight className="size-3.5" />
                    </span>
                  }
                />
              ))}
            </div>
          )}
        </BentoCard>

        {/* Graphique d'activité — grande carte */}
        <BentoCard
          eyebrow="Claude Code — 7 derniers jours"
          title={`${totalTokens.toLocaleString("fr-FR")} tokens`}
          span="laptop:col-span-8"
        >
          <TokenUsageChart data={weeklyTokenUsage} />
        </BentoCard>

        {/* Activité récente */}
        <BentoCard eyebrow="Activité récente" span="laptop:col-span-4">
          <ul className="space-y-3">
            {recentActivity.map((ev) => (
              <li key={ev.id} className="flex items-start gap-2.5">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-text-muted" />
                <div className="min-w-0">
                  <p className="truncate text-body-text text-text-secondary">{ev.title}</p>
                  <p className="text-label text-text-muted">{formatRelativeTime(ev.ts, now)}</p>
                </div>
              </li>
            ))}
          </ul>
        </BentoCard>

        {/* Santé Cortex */}
        <BentoCard eyebrow="Cortex" span="laptop:col-span-3">
          <StatusIndicator tone="success" label="Opérationnel" />
          <dl className="mt-4 space-y-2 text-body-text">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-text-muted"><Server className="size-3.5" /> Uptime</dt>
              <dd className="font-mono text-text-secondary">
                {Math.floor(systemHealthy.cortexServer.uptimeSeconds / 3600)}h
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">Mémoire</dt>
              <dd className="font-mono text-text-secondary">{systemHealthy.cortexServer.memoryMb} Mo</dd>
            </div>
          </dl>
        </BentoCard>

        {/* Santé Claude Code */}
        <BentoCard eyebrow="Claude Code" span="laptop:col-span-3">
          <StatusIndicator tone="success" label="Disponible" />
          <dl className="mt-4 space-y-2 text-body-text">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-text-muted"><Cpu className="size-3.5" /> Dernier appel</dt>
              <dd className="text-text-secondary">
                {systemHealthy.claudeCode.lastCallAt ? formatRelativeTime(systemHealthy.claudeCode.lastCallAt, now) : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">Tokens (auj.)</dt>
              <dd className="font-mono text-text-secondary">
                {systemHealthy.claudeCode.tokensUsedToday.toLocaleString("fr-FR")}
              </dd>
            </div>
          </dl>
        </BentoCard>

        {/* Missions récemment terminées */}
        <BentoCard eyebrow="Récemment terminées" span="laptop:col-span-6">
          {completed.length === 0 ? (
            <EmptyState icon={<Inbox className="size-5" />} title="Aucune mission terminée" compact />
          ) : (
            <div className="-mx-2">
              {completed.map((m) => (
                <DataRow
                  key={m.id}
                  primary={m.objective}
                  secondary={`${m.tests.passed}/${m.tests.total} tests passants`}
                  meta={[formatDuration(m.durationMs)]}
                  onClick={() => navigate(`/missions/${m.id}`)}
                />
              ))}
            </div>
          )}
        </BentoCard>
      </div>
    </div>
  );
}
