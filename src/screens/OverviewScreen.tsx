import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Squares2X2Icon } from "@heroicons/react/24/solid";
import {
  AlertTriangle,
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

  const attentionCount = attentionMissions.length + incidents.filter((incident) => incident.status !== "resolved").length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      className="w-full space-y-8 laptop:space-y-10"
    >
      <PageHeader
        title="Maintenant"
        icon={Squares2X2Icon}
        action={<NewMissionDialog onCreated={refetch} />}
      />

      {missionsError && (
        <div className="border-y border-error/25 py-3.5">
          <div className="flex items-start gap-3">
            <Radio className="mt-0.5 size-4 shrink-0 text-error" strokeWidth={2.8} aria-hidden />
            <div>
              <p className="text-[11px] font-bold text-error">Connexion au runtime dégradée</p>
              <p className="mt-1 text-[10.5px] font-medium leading-relaxed text-text-secondary">{missionsError}</p>
            </div>
          </div>
        </div>
      )}

      <section aria-labelledby="attention-heading">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-text-muted">Priorité opérateur</p>
            <h2 id="attention-heading" className="mt-1 text-[16px] font-bold tracking-[-0.025em] text-text-primary">
              À traiter
            </h2>
          </div>
          <span className="font-mono text-[11px] font-bold tabular-nums text-text-secondary">{attentionCount}</span>
        </div>

        {attentionCount === 0 ? (
          <div className="flex items-center gap-3 border-y border-black/[0.06] py-4">
            <div className="flex size-9 shrink-0 items-center justify-center text-success">
              <Radio className="size-[18px]" strokeWidth={2.8} aria-hidden />
            </div>
            <div>
              <p className="text-[12px] font-bold text-text-primary">Aucune intervention requise</p>
              <p className="mt-0.5 text-[10.5px] font-medium text-text-muted">Cortex peut poursuivre sans décision humaine.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.055] border-y border-black/[0.065]">
            {attentionMissions.map((mission) => (
              <OperatorMissionRow key={mission.id} mission={mission} compact />
            ))}
            {incidents.filter((incident) => incident.status !== "resolved").map((incident) => (
              <Link
                key={incident.id}
                to={ROUTES.system}
                className="grid min-h-[78px] grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 py-3 transition-colors hover:bg-black/[0.018] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/15"
              >
                <div className="flex size-9 items-center justify-center text-warning">
                  <ServerOff className="size-[18px]" strokeWidth={2.8} aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.11em] text-warning">Incident système</p>
                  <p className="mt-1 text-[13px] font-bold tracking-[-0.015em] text-text-primary">{incident.title}</p>
                  <p className="mt-1 line-clamp-2 text-[10.5px] font-medium leading-relaxed text-text-muted">{incident.detail}</p>
                </div>
                <ArrowUpRight className="mt-1 size-4 text-text-muted" strokeWidth={2.8} aria-hidden />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="active-heading">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-text-muted">Exécution</p>
            <h2 id="active-heading" className="mt-1 text-[16px] font-bold tracking-[-0.025em] text-text-primary">
              Missions actives
            </h2>
          </div>
          <Link
            to={ROUTES.missions}
            className="inline-flex min-h-10 items-center gap-1.5 text-[10.5px] font-bold text-text-secondary hover:text-text-primary"
          >
            Toutes <ArrowUpRight className="size-3.5" strokeWidth={2.8} aria-hidden />
          </Link>
        </div>

        {activeMissions.length === 0 ? (
          <div className="border-y border-black/[0.06] py-5 text-[11px] font-semibold text-text-muted">
            Aucune exécution active.
          </div>
        ) : (
          <div className="divide-y divide-black/[0.055] border-y border-black/[0.065]">
            {activeMissions.slice(0, 4).map((mission) => (
              <OperatorMissionRow key={mission.id} mission={mission} />
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-8 laptop:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] laptop:gap-10">
        <section aria-labelledby="activity-heading">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-text-muted">Ledger</p>
              <h2 id="activity-heading" className="mt-1 text-[16px] font-bold tracking-[-0.025em] text-text-primary">
                Activité récente
              </h2>
            </div>
            <Link
              to={ROUTES.console}
              className="inline-flex min-h-10 items-center gap-1.5 text-[10.5px] font-bold text-text-secondary hover:text-text-primary"
            >
              Ouvrir <ArrowUpRight className="size-3.5" strokeWidth={2.8} aria-hidden />
            </Link>
          </div>

          <div className="divide-y divide-black/[0.05] border-y border-black/[0.065]">
            {recentActivity.map(({ mission, event }) => (
              <Link
                key={`${mission.id}:${event.id}`}
                to={ROUTES.missionDetail(mission.id)}
                className="grid min-h-[58px] grid-cols-[64px_minmax(0,1fr)] items-start gap-3 py-3 transition-colors hover:bg-black/[0.018]"
              >
                <span className="font-mono text-[9.5px] font-semibold text-text-muted">
                  {new Date(event.ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11.5px] font-bold text-text-primary">{event.title}</span>
                  <span className="mt-0.5 block truncate text-[10px] font-medium text-text-muted">{mission.title ?? mission.objective}</span>
                </span>
              </Link>
            ))}
            {recentActivity.length === 0 && (
              <p className="py-5 text-[11px] font-semibold text-text-muted">Aucun événement enregistré.</p>
            )}
          </div>
        </section>

        <section aria-labelledby="recent-heading">
          <div className="mb-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-text-muted">Dernières sorties</p>
            <h2 id="recent-heading" className="mt-1 text-[16px] font-bold tracking-[-0.025em] text-text-primary">
              Missions clôturées
            </h2>
          </div>
          <div className="divide-y divide-black/[0.05] border-y border-black/[0.065]">
            {recentMissions.map((mission) => {
              const view = getOperationalMission(mission);
              return (
                <Link key={mission.id} to={ROUTES.missionDetail(mission.id)} className="block py-3.5 transition-colors hover:bg-black/[0.018]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-secondary">{view.statusLabel}</span>
                    <span className="font-mono text-[9px] font-semibold text-text-muted">
                      {formatRelativeTime(mission.closedAt ?? mission.createdAt, Date.now())}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[11.5px] font-bold leading-snug text-text-primary">{mission.title ?? mission.objective}</p>
                </Link>
              );
            })}
            {recentMissions.length === 0 && (
              <div className="flex items-center gap-2 py-5 text-[11px] font-semibold text-text-muted">
                <Clock3 className="size-4" strokeWidth={2.6} aria-hidden />
                Aucune mission clôturée.
              </div>
            )}
          </div>
        </section>
      </div>

      <section aria-labelledby="usage-heading">
        <div className="mb-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-text-muted">Ressources</p>
          <h2 id="usage-heading" className="mt-1 text-[16px] font-bold tracking-[-0.025em] text-text-primary">
            Consommation
          </h2>
        </div>
        <TokenUsageCard />
      </section>
    </motion.div>
  );
}
