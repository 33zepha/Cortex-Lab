import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Squares2X2Icon } from "@heroicons/react/24/solid";
import {
  ArrowUpRight,
  Clock3,
  Radio,
  ServerOff,
} from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { OperatorMissionRow } from "@/components/operator/OperatorMissionRow";
import { TokenUsageCard } from "@/components/TokenUsage";
import { NewMissionDialog } from "@/screens/missions/NewMissionDialog";
import { useMissions } from "@/lib/useMissions";
import {
  getOperationalMission,
  isMissionActive,
  missionRequiresAttention,
} from "@/lib/operator-contract";
import { formatRelativeTime } from "@/lib/status";
import { ROUTES } from "@/lib/routes";

function SectionHeader({
  id,
  eyebrow,
  title,
  count,
  action,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  count?: number;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex min-h-10 items-end justify-between gap-4">
      <div>
        <p className="text-[8.5px] font-[650] uppercase tracking-[0.14em] text-text-muted">{eyebrow}</p>
        <div className="mt-1 flex items-baseline gap-2.5">
          <h2 id={id} className="text-[16px] font-[670] tracking-[-0.026em] text-text-primary">{title}</h2>
          {count !== undefined ? (
            <span className="font-mono text-[9.5px] font-medium tabular-nums text-text-muted">{count}</span>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function OverviewScreen() {
  const {
    missions,
    incidents,
    error: missionsError,
    refetch,
  } = useMissions();
  const source = missions ?? [];

  const attentionMissions = useMemo(
    () => source.filter(missionRequiresAttention).sort((a, b) => {
      const aTime = getOperationalMission(a).lastEvent?.ts ?? a.createdAt;
      const bTime = getOperationalMission(b).lastEvent?.ts ?? b.createdAt;
      return bTime - aTime;
    }),
    [source],
  );

  const activeMissions = useMemo(
    () => source
      .filter((mission) => isMissionActive(mission) && !missionRequiresAttention(mission))
      .sort((a, b) => {
        const aTime = getOperationalMission(a).lastEvent?.ts ?? a.createdAt;
        const bTime = getOperationalMission(b).lastEvent?.ts ?? b.createdAt;
        return bTime - aTime;
      }),
    [source],
  );

  const recentMissions = useMemo(
    () => source
      .filter((mission) => !isMissionActive(mission) && !missionRequiresAttention(mission))
      .sort((a, b) => (b.closedAt ?? b.createdAt) - (a.closedAt ?? a.createdAt))
      .slice(0, 3),
    [source],
  );

  const recentActivity = useMemo(
    () => source
      .flatMap((mission) => mission.timeline.map((event) => ({ mission, event })))
      .sort((a, b) => b.event.ts - a.event.ts)
      .slice(0, 6),
    [source],
  );

  const unresolvedIncidents = incidents.filter((incident) => incident.status !== "resolved");
  const attentionCount = attentionMissions.length + unresolvedIncidents.length;
  const summary = attentionCount > 0
    ? `${attentionCount} intervention${attentionCount > 1 ? "s" : ""} · ${activeMissions.length} exécution${activeMissions.length > 1 ? "s" : ""} active${activeMissions.length > 1 ? "s" : ""}`
    : `${activeMissions.length} exécution${activeMissions.length > 1 ? "s" : ""} active${activeMissions.length > 1 ? "s" : ""} · aucune intervention requise`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      className="w-full"
    >
      <PageHeader
        title="Maintenant"
        description={summary}
        icon={Squares2X2Icon}
        action={<NewMissionDialog onCreated={refetch} />}
      />

      {missionsError ? (
        <div className="mt-6 border-y border-error/25 py-3.5">
          <div className="flex items-start gap-3">
            <Radio className="mt-0.5 size-4 shrink-0 text-error" strokeWidth={2.8} aria-hidden />
            <div>
              <p className="text-[11px] font-[650] text-error">Connexion au runtime dégradée</p>
              <p className="mt-1 text-[10.5px] font-medium leading-relaxed text-text-secondary">{missionsError}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-9 laptop:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.68fr)] laptop:gap-10">
        <div className="min-w-0 space-y-9">
          <section aria-labelledby="attention-heading">
            <SectionHeader id="attention-heading" eyebrow="Priorité opérateur" title="À traiter" count={attentionCount} />

            {attentionCount === 0 ? (
              <div className="flex items-center gap-3 border-y border-black/[0.07] py-4">
                <div className="flex size-8 shrink-0 items-center justify-center text-success">
                  <Radio className="size-[17px]" strokeWidth={2.8} aria-hidden />
                </div>
                <div>
                  <p className="text-[11.5px] font-[640] text-text-primary">Aucune intervention requise</p>
                  <p className="mt-0.5 text-[10px] font-medium text-text-muted">Cortex peut poursuivre sans décision humaine.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.06] border-y border-black/[0.075]">
                {attentionMissions.map((mission) => (
                  <OperatorMissionRow key={mission.id} mission={mission} compact />
                ))}
                {unresolvedIncidents.map((incident) => (
                  <Link
                    key={incident.id}
                    to={ROUTES.system}
                    className="group -mx-1.5 grid min-h-[76px] grid-cols-[30px_minmax(0,1fr)_18px] items-start gap-3 px-1.5 py-3 transition-colors hover:bg-black/[0.022] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/15 laptop:-mx-3 laptop:px-3"
                  >
                    <div className="flex size-[30px] items-center justify-center text-warning">
                      <ServerOff className="size-[17px]" strokeWidth={2.8} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-[680] uppercase tracking-[0.12em] text-warning">Incident système</p>
                      <p className="mt-1 text-[13px] font-[650] tracking-[-0.018em] text-text-primary">{incident.title}</p>
                      <p className="mt-1 line-clamp-2 text-[10.5px] font-medium leading-relaxed text-text-muted">{incident.detail}</p>
                    </div>
                    <ArrowUpRight className="mt-1 size-3.5 text-text-muted transition-colors group-hover:text-text-primary" strokeWidth={2.6} aria-hidden />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="active-heading">
            <SectionHeader
              eyebrow="Exécution"
              id="active-heading"
              title="Missions actives"
              count={activeMissions.length}
              action={(
                <Link
                  to={ROUTES.missions}
                  className="inline-flex min-h-10 items-center gap-1.5 text-[10px] font-[620] text-text-secondary hover:text-text-primary"
                >
                  Toutes <ArrowUpRight className="size-3.5" strokeWidth={2.7} aria-hidden />
                </Link>
              )}
            />

            {activeMissions.length === 0 ? (
              <div className="border-y border-black/[0.07] py-5 text-[10.5px] font-medium text-text-muted">
                Aucune exécution active.
              </div>
            ) : (
              <div className="divide-y divide-black/[0.06] border-y border-black/[0.075]">
                {activeMissions.slice(0, 4).map((mission) => (
                  <OperatorMissionRow key={mission.id} mission={mission} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-9 laptop:border-l laptop:border-black/[0.07] laptop:pl-8">
          <section aria-labelledby="activity-heading">
            <SectionHeader
              eyebrow="Ledger"
              id="activity-heading"
              title="Activité récente"
              count={recentActivity.length}
              action={(
                <Link
                  to={ROUTES.console}
                  className="inline-flex min-h-10 items-center gap-1.5 text-[10px] font-[620] text-text-secondary hover:text-text-primary"
                >
                  Ouvrir <ArrowUpRight className="size-3.5" strokeWidth={2.7} aria-hidden />
                </Link>
              )}
            />

            <div className="divide-y divide-black/[0.055] border-y border-black/[0.075]">
              {recentActivity.map(({ mission, event }) => (
                <Link
                  key={`${mission.id}:${event.id}`}
                  to={ROUTES.missionDetail(mission.id)}
                  className="group -mx-1.5 grid min-h-[56px] grid-cols-[48px_minmax(0,1fr)_14px] items-start gap-2.5 px-1.5 py-3 transition-colors hover:bg-black/[0.022]"
                >
                  <span className="pt-px font-mono text-[8.5px] font-medium text-text-muted">
                    {new Date(event.ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[10.5px] font-[630] text-text-primary">{event.title}</span>
                    <span className="mt-0.5 block truncate text-[9.5px] font-medium text-text-muted">{mission.title ?? mission.objective}</span>
                  </span>
                  <ArrowUpRight className="mt-0.5 size-3 text-text-muted/70 group-hover:text-text-primary" strokeWidth={2.5} aria-hidden />
                </Link>
              ))}
              {recentActivity.length === 0 ? (
                <p className="py-5 text-[10.5px] font-medium text-text-muted">Aucun événement enregistré.</p>
              ) : null}
            </div>
          </section>

          <section aria-labelledby="recent-heading">
            <SectionHeader id="recent-heading" eyebrow="Dernières sorties" title="Missions clôturées" count={recentMissions.length} />
            <div className="divide-y divide-black/[0.055] border-y border-black/[0.075]">
              {recentMissions.map((mission) => {
                const view = getOperationalMission(mission);
                return (
                  <Link key={mission.id} to={ROUTES.missionDetail(mission.id)} className="-mx-1.5 block px-1.5 py-3.5 transition-colors hover:bg-black/[0.022]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[8.5px] font-[650] uppercase tracking-[0.11em] text-text-secondary">{view.statusLabel}</span>
                      <span className="font-mono text-[8.5px] font-medium text-text-muted">
                        {formatRelativeTime(mission.closedAt ?? mission.createdAt, Date.now())}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[10.5px] font-[620] leading-snug text-text-primary">{mission.title ?? mission.objective}</p>
                  </Link>
                );
              })}
              {recentMissions.length === 0 ? (
                <div className="flex items-center gap-2 py-5 text-[10.5px] font-medium text-text-muted">
                  <Clock3 className="size-4" strokeWidth={2.6} aria-hidden />
                  Aucune mission clôturée.
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </div>

      <section aria-labelledby="usage-heading" className="mt-10 border-t border-black/[0.07] pt-8">
        <SectionHeader id="usage-heading" eyebrow="Ressources" title="Consommation" />
        <TokenUsageCard />
      </section>
    </motion.div>
  );
}
