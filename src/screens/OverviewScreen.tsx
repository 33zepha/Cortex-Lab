import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Inbox, Sparkles, Server, Cpu, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Squares2X2Icon } from "@heroicons/react/24/solid";
import { PageHeader } from "@/components/shell/PageHeader";
import { BentoCard, Badge, Progress, StatusIndicator, EmptyState, DataRow } from "@/components/ui";
import { ROUTES } from "@/lib/routes";
import { EASE_SPRING_ARRAY, STAGGER_CONTAINER_VARIANTS, STAGGER_ITEM_VARIANTS } from "@/lib/animations";
import { allMissions, missionActive } from "@/fixtures/missions";
import { systemHealthy, weeklyTokenUsage } from "@/fixtures/system";
import { missionStatusConfig, formatDuration, formatRelativeTime } from "@/lib/status";
import { KpiRow } from "@/screens/overview/KpiRow";

const now = Date.parse("2026-08-06T14:30:00Z");

export function OverviewScreen() {
  const navigate = useNavigate();

  const needsReview = useMemo(() => allMissions.filter((m) => m.decisionRequired), []);

  const completed = useMemo(
    () =>
      allMissions
        .filter((m) => m.status === "completed")
        .sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0))
        .slice(0, 3),
    [],
  );

  const recentActivity = useMemo(
    () =>
      allMissions
        .flatMap((m) => m.timeline.map((t) => ({ ...t, missionId: m.id, objective: m.objective })))
        .sort((a, b) => b.ts - a.ts)
        .slice(0, 5),
    [],
  );

  const activeStatus = missionStatusConfig[missionActive.status];
  const totalTokens = weeklyTokenUsage.reduce((sum, d) => sum + d.tokens, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_SPRING_ARRAY }}
    >
      <PageHeader title="Overview" icon={Squares2X2Icon} />

      <div className="mb-10">
        <KpiRow missions={allMissions} />
      </div>

      <motion.div
        variants={STAGGER_CONTAINER_VARIANTS}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-5 tablet:grid-cols-4 laptop:grid-cols-12 auto-rows-min"
      >
        {/* ROW 1: Mission active & Activité */}
        <motion.div variants={STAGGER_ITEM_VARIANTS} className="tablet:col-span-4 laptop:col-span-8">
          <BentoCard
            title="Mission active"
            className="h-full"
            action={<Badge tone={activeStatus.tone} dot pulse={activeStatus.pulse}>{activeStatus.label}</Badge>}
          >
            <Link to={ROUTES.missionDetail(missionActive.id)} className="group block">
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
        </motion.div>

        <motion.div variants={STAGGER_ITEM_VARIANTS} className="tablet:col-span-4 laptop:col-span-4">
          <BentoCard title="Activité récente" className="h-full">
            <ul className="space-y-4">
              {recentActivity.map((ev) => (
                <li key={ev.id} className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-text-muted" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-text-primary">{ev.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">{formatRelativeTime(ev.ts, now)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </BentoCard>
        </motion.div>

        {/* ROW 2: Décisions & Terminées */}
        <motion.div variants={STAGGER_ITEM_VARIANTS} className="tablet:col-span-4 laptop:col-span-7">
          <BentoCard
            title="Décisions requises"
            action={needsReview.length > 0 ? <Badge tone="warning">{needsReview.length}</Badge> : null}
            className="h-full"
            padding="none"
          >
            {needsReview.length === 0 ? (
              <EmptyState icon={<Inbox className="size-5" />} title="Rien en attente" description="Aucune mission n'a besoin de décision." compact />
            ) : (
              <div className="flex flex-col">
                {needsReview.map((m) => (
                  <DataRow
                    key={m.id}
                    primary={m.objective}
                    secondary={m.decisionPrompt}
                    onClick={() => navigate(ROUTES.missionDetail(m.id))}
                    trailing={
                      <span className="flex items-center gap-1 text-xs font-medium text-accent-indigo">
                        Examiner <ArrowRight className="size-3.5" />
                      </span>
                    }
                  />
                ))}
              </div>
            )}
          </BentoCard>
        </motion.div>

        <motion.div variants={STAGGER_ITEM_VARIANTS} className="tablet:col-span-4 laptop:col-span-5">
          <BentoCard title="Récemment terminées" className="h-full" padding="none">
            {completed.length === 0 ? (
              <EmptyState icon={<Inbox className="size-5" />} title="Aucune mission terminée" compact />
            ) : (
              <div className="flex flex-col justify-center h-full">
                {completed.map((m) => (
                  <DataRow
                    key={m.id}
                    primary={m.objective}
                    secondary={`${m.tests.passed}/${m.tests.total} tests passants`}
                    meta={[formatDuration(m.durationMs)]}
                    onClick={() => navigate(ROUTES.missionDetail(m.id))}
                  />
                ))}
              </div>
            )}
          </BentoCard>
        </motion.div>

        {/* ROW 3: System & Tokens */}
        <motion.div variants={STAGGER_ITEM_VARIANTS} className="tablet:col-span-2 laptop:col-span-4">
          <BentoCard
            title="Tokens (7 jours)"
            className="h-full flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-semibold tracking-tight text-text-primary">{totalTokens.toLocaleString("fr-FR")}</span>
                <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
                  <TrendingUp className="size-3" strokeWidth={3} /> +12%
                </span>
              </div>
            </div>
            
            <Link to="#" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent-indigo hover:text-accent-indigo/80 transition-colors">
              Détails conso <ArrowRight className="size-3.5" />
            </Link>
          </BentoCard>
        </motion.div>

        <motion.div variants={STAGGER_ITEM_VARIANTS} className="tablet:col-span-2 laptop:col-span-4">
          <BentoCard title="Cortex Server" className="h-full">
            <StatusIndicator tone="success" label="Opérationnel" />
            <dl className="mt-5 space-y-3 text-[13px]">
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
        </motion.div>

        <motion.div variants={STAGGER_ITEM_VARIANTS} className="tablet:col-span-2 laptop:col-span-4">
          <BentoCard title="Claude Code" className="h-full">
            <StatusIndicator tone="success" label="Disponible" />
            <dl className="mt-5 space-y-3 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-text-muted"><Cpu className="size-3.5" /> Appel</dt>
                <dd className="text-text-secondary">
                  {systemHealthy.claudeCode.lastCallAt ? formatRelativeTime(systemHealthy.claudeCode.lastCallAt, now) : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Aujourd'hui</dt>
                <dd className="font-mono text-text-secondary">
                  {systemHealthy.claudeCode.tokensUsedToday.toLocaleString("fr-FR")} tk
                </dd>
              </div>
            </dl>
          </BentoCard>
        </motion.div>

      </motion.div>
    </motion.div>
  );
}
