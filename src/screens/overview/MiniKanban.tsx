import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Play,
  Sparkles,
  Cpu,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, Progress } from "@/components/ui";
import { NewMissionDialog } from "@/screens/missions/NewMissionDialog";
import { ROUTES } from "@/lib/routes";
import { formatDuration, formatRelativeTime } from "@/lib/status";
import { getMissionDisplay } from "@/lib/mission-naming";
import { cn } from "@/lib/cn";
import { LIQUID_GLASS_HOVER, TRANSITION_SPRING } from "@/lib/ui-classes";
import type { Mission, MissionStatus } from "@/lib/types";

const now = Date.now();

const STATUS_ICONS: Record<
  MissionStatus,
  {
    icon: typeof CheckCircle2;
    iconClass: string;
    bgClass: string;
    label: string;
  }
> = {
  running: {
    icon: Play,
    iconClass: "text-accent-indigo",
    bgClass: "bg-accent-indigo/15 border-accent-indigo/35 text-accent-indigo",
    label: "En cours",
  },
  needs_review: {
    icon: AlertCircle,
    iconClass: "text-warning",
    bgClass: "bg-warning/15 border-warning/40 text-warning",
    label: "Action requise",
  },
  completed: {
    icon: CheckCircle2,
    iconClass: "text-success",
    bgClass: "bg-success/15 border-success/35 text-success",
    label: "Complétée",
  },
  failed: {
    icon: XCircle,
    iconClass: "text-error",
    bgClass: "bg-error/15 border-error/35 text-error",
    label: "Échouée",
  },
  cancelled: {
    icon: XCircle,
    iconClass: "text-text-muted",
    bgClass: "bg-surface-3 border-border text-text-muted",
    label: "Annulée",
  },
};

export function MiniKanban({
  missions,
  onCreated,
}: {
  missions: Mission[];
  onCreated?: () => void;
}) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const activeMission = useMemo(
    () => missions.find((m) => m.status === "running") ?? null,
    [missions],
  );

  const decisionMissions = useMemo(
    () => missions.filter((m) => m.status === "needs_review" || m.decisionRequired),
    [missions],
  );

  const recentClosedMissions = useMemo(
    () =>
      missions
        .filter((m) => m.status !== "running" && m.status !== "needs_review" && !m.decisionRequired)
        .sort((a, b) => (b.closedAt ?? b.createdAt) - (a.closedAt ?? a.createdAt))
        .slice(0, 6),
    [missions],
  );

  const heroDecision = !activeMission && decisionMissions.length > 0 ? decisionMissions[0] : null;
  const activeDisplay = activeMission ? getMissionDisplay(activeMission, { preset: "hero" }) : null;
  const decisionDisplay = heroDecision ? getMissionDisplay(heroDecision, { preset: "card" }) : null;

  return (
    <section className="flex flex-col gap-4">
      {/* En-tête de section plein format */}
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[15px] font-bold tracking-[-0.015em] text-text-primary laptop:text-[16px]">
            Missions & Exécution
          </h2>
          <span className="inline-flex items-center justify-center rounded-full border border-black/[0.04] bg-surface-2/90 px-2.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-text-muted shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
            {missions.length}
          </span>
        </div>
        <NewMissionDialog onCreated={onCreated ?? (() => {})} />
      </div>

      {/* FRAME BENTO LIQUID GLASS PLEIN FORMAT (12 COLS) */}
      <div className="relative overflow-hidden rounded-[20px] border border-white/70 bg-white/45 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_8px_24px_-4px_rgba(0,0,0,0.04)] backdrop-blur-2xl transition-all duration-standard laptop:rounded-[24px] laptop:p-7">
        {/* 1. ÉTAT ACTIF (Mission en cours) */}
        {activeMission && activeDisplay ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Badge tone="indigo" dot pulse>
                  En cours
                </Badge>
                <span className="text-[12px] font-bold text-text-muted">
                  {activeMission.step ? `Étape : ${activeMission.step}` : "Exécution du plan"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 font-mono text-[12px] font-bold text-text-muted">
                  <Clock className="size-4 text-accent-indigo" strokeWidth={3} aria-hidden />
                  <span>{formatDuration(activeMission.durationMs)}</span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/60 bg-white/50 px-2.5 py-1 font-mono text-[11px] font-bold text-text-secondary shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                  <Cpu className="size-3.5 text-accent-indigo" strokeWidth={3} aria-hidden />
                  {activeMission.model}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-[18px] font-bold leading-snug tracking-[-0.025em] text-text-primary laptop:text-[20px]">
                {activeDisplay.title}
              </h3>
              {activeDisplay.subtitle && (
                <p className="mt-1.5 line-clamp-1 text-[13px] font-medium text-text-muted">
                  {activeDisplay.subtitle}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3.5 pt-1 tablet:flex-row tablet:items-center tablet:justify-between">
              <div className="flex flex-1 items-center gap-3.5">
                <Progress value={activeMission.progress} tone="indigo" className="h-2.5 flex-1" />
                <span className="shrink-0 font-mono text-[12px] font-bold tabular-nums text-accent-indigo">
                  {activeMission.progress}%
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate(ROUTES.missionDetail(activeMission.id))}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-[12px] bg-accent-indigo px-4 text-[12px] font-bold text-white shadow-sm transition-all duration-fast hover:brightness-110 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
              >
                <span>Ouvrir la mission</span>
                <ArrowRight className="size-4" strokeWidth={3} aria-hidden />
              </button>
            </div>
          </div>
        ) : heroDecision && decisionDisplay ? (
          // 2. ÉTAT DÉCISION REQUISE EN PRIORITÉ
          <div className="rounded-[18px] border border-warning/40 bg-warning/[0.06] p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <Badge tone="warning" dot pulse>
                Décision requise
              </Badge>
              <span className="text-[11px] font-bold text-text-muted">
                {formatRelativeTime(heroDecision.createdAt, now)}
              </span>
            </div>

            <h3 className="mb-2 text-[16px] font-bold leading-snug tracking-[-0.02em] text-text-primary laptop:text-[17px]">
              {decisionDisplay.title}
            </h3>

            <p className="mb-4 text-[13px] font-medium leading-relaxed text-text-secondary">
              {heroDecision.decisionPrompt ?? "Une intervention humaine est nécessaire pour valider la suite de l'exécution."}
            </p>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate(ROUTES.missionDetail(heroDecision.id))}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-[12px] border border-warning/40 bg-warning/20 px-4 text-[12px] font-bold text-warning transition-colors duration-fast hover:bg-warning/30 active:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning"
              >
                <AlertCircle className="size-4" strokeWidth={3} aria-hidden />
                <span>Examiner la décision</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-5 text-center laptop:py-7">
            {/* Grand badge bold en relief avec halo subtil */}
            <div className="relative mb-3.5 flex items-center justify-center">
              <div className="absolute size-16 rounded-full bg-accent-indigo/10 blur-lg" />
              <div className="relative flex size-13 items-center justify-center rounded-[16px] border border-white/80 bg-white/70 text-accent-indigo shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_6px_20px_rgba(0,119,230,0.12)] laptop:size-14">
                <Sparkles className="size-6" strokeWidth={3.2} aria-hidden />
              </div>
            </div>

            <div className="mb-2">
              <Badge tone="success" dot pulse className="px-2.5 py-0.5 text-[10.5px]">
                Prêt
              </Badge>
            </div>

            <p className="text-[16px] font-bold tracking-[-0.02em] text-text-primary laptop:text-[17px]">
              Système en veille
            </p>

            <p className="mx-auto mt-1 max-w-[360px] text-[12px] font-medium text-text-muted">
              L'orchestrateur est prêt pour de nouveaux objectifs.
            </p>
          </div>
        )}

        {/* LIGNE DE SÉPARATION ET DÉCLENCHEUR DU MENU DÉROULANT LIQUID GLASS */}
        <div className="mt-5 border-t border-black/[0.05] pt-3.5">
          <div className="flex items-center justify-between gap-3">
            {/* Déclencheur Liquid Glass interactif */}
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-expanded={dropdownOpen}
              className={cn(
                "group flex items-center gap-2.5 rounded-[12px] border border-white/80 bg-white/50 px-4 py-2 text-[12px] font-bold text-text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_6px_rgba(0,0,0,0.03)] backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
                TRANSITION_SPRING,
                LIQUID_GLASS_HOVER,
                dropdownOpen && "bg-white/80 border-accent-indigo/35 text-accent-indigo shadow-sm",
              )}
            >
              <span>Dernières missions ({recentClosedMissions.length + decisionMissions.length})</span>
              <motion.div
                animate={{ rotate: dropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                className="shrink-0"
              >
                <ChevronDown className="size-4 text-text-muted group-hover:text-text-primary" strokeWidth={3} aria-hidden />
              </motion.div>
            </button>

            <Link
              to={ROUTES.missions}
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-text-muted transition-colors duration-fast hover:text-text-primary"
            >
              <span>Toutes les missions</span>
              <ArrowUpRight className="size-4" strokeWidth={3} />
            </Link>
          </div>

          {/* CONTENU DU MENU DÉROULANT LIQUID GLASS — GRILLE 2 COLONNES SUR DESKTOP */}
          <AnimatePresence initial={false}>
            {dropdownOpen && (
              <motion.div
                key="missions-dropdown"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 gap-3 pt-1 laptop:grid-cols-2">
                  {recentClosedMissions.length === 0 && decisionMissions.length === 0 ? (
                    <div className="col-span-full rounded-[16px] border border-dashed border-border p-5 text-center text-[12px] font-medium text-text-muted">
                      Aucune mission archivée dans le journal pour l'instant.
                    </div>
                  ) : (
                    <>
                      {/* Mini-tuiles pour les décisions en attente */}
                      {decisionMissions
                        .filter((m) => m.id !== heroDecision?.id)
                        .map((m) => {
                          const mDisplay = getMissionDisplay(m, { preset: "card" });
                          const conf = STATUS_ICONS[m.status];
                          const StatusIcon = conf.icon;

                          return (
                            <motion.button
                              key={m.id}
                              type="button"
                              onClick={() => navigate(ROUTES.missionDetail(m.id))}
                              whileHover={{ scale: 1.015 }}
                              whileTap={{ scale: 0.985 }}
                              className={cn(
                                "group flex flex-col justify-between gap-3 rounded-[18px] border border-warning/35 bg-warning/[0.05] p-4 text-left shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_12px_rgba(0,0,0,0.02)] backdrop-blur-xl transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning",
                                LIQUID_GLASS_HOVER,
                              )}
                            >
                              <div className="flex items-start gap-3.5">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px] border border-warning/40 bg-warning/15 text-warning shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                                  <StatusIcon className="size-5" strokeWidth={3.2} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-1 text-[13px] font-bold leading-snug tracking-[-0.015em] text-text-primary group-hover:text-warning">
                                    {mDisplay.title}
                                  </p>
                                  <p className="mt-0.5 line-clamp-1 text-[11px] font-bold text-warning">
                                    Action requise
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[11px] font-bold text-text-muted">
                                <span className="font-mono text-[10px] text-text-secondary">{m.model}</span>
                                <span>{formatRelativeTime(m.createdAt, now)}</span>
                              </div>
                            </motion.button>
                          );
                        })}

                      {/* Mini-tuiles pour les missions clôturées */}
                      {recentClosedMissions.map((mission) => {
                        const mDisplay = getMissionDisplay(mission, { preset: "card" });
                        const conf = STATUS_ICONS[mission.status];
                        const StatusIcon = conf.icon;

                        return (
                          <motion.button
                            key={mission.id}
                            type="button"
                            onClick={() => navigate(ROUTES.missionDetail(mission.id))}
                            whileHover={{ scale: 1.015 }}
                            whileTap={{ scale: 0.985 }}
                            className={cn(
                              "group flex flex-col justify-between gap-3 rounded-[18px] border border-white/80 bg-white/50 p-4 text-left shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_4px_12px_rgba(0,0,0,0.02)] backdrop-blur-xl transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
                              LIQUID_GLASS_HOVER,
                            )}
                          >
                            <div className="flex items-start gap-3.5">
                              <div
                                className={cn(
                                  "flex size-9 shrink-0 items-center justify-center rounded-[12px] border shadow-[inset_0_1px_1px_rgba(255,255,255,1)]",
                                  conf.bgClass,
                                )}
                              >
                                <StatusIcon className={cn("size-5", conf.iconClass)} strokeWidth={3.2} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-1 text-[13px] font-bold leading-snug tracking-[-0.015em] text-text-primary group-hover:text-accent-indigo">
                                  {mDisplay.title}
                                </p>
                                {mDisplay.subtitle && (
                                  <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-text-muted">
                                    {mDisplay.subtitle}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-bold text-text-muted">
                              <span className="font-mono text-[10px] text-text-secondary">{mission.model}</span>
                              <div className="flex items-center gap-2">
                                <span>{formatRelativeTime(mission.closedAt ?? mission.createdAt, now)}</span>
                                {mission.durationMs > 0 && (
                                  <>
                                    <span>·</span>
                                    <span className="font-mono">{formatDuration(mission.durationMs)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
