import { type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import { TRANSITION_SPRING } from "@/lib/ui-classes";
import { FADE_UP_VARIANTS, ORBIT_CONTAINER_VARIANTS } from "@/lib/animations";
import { useMissions } from "@/lib/useMissions";
import { isMissionActive, missionRequiresAttention } from "@/lib/operator-contract";
import { useOrbitNavigation, type OrbitTransitionType } from "./useOrbitNavigation";

export function Orbit({ isOpen }: { isOpen: boolean }) {
  const { id, currentIndex, direction, type } = useOrbitNavigation();

  let content = null;
  if (isOpen) {
    if (id) content = <MissionDetailOrbit key={`mission-${id}`} id={id} direction={direction} type={type} />;
    else if (currentIndex === 0) content = <OverviewOrbit key="overview" direction={direction} type={type} />;
    else if (currentIndex === 1) content = <MissionsOrbit key="missions" direction={direction} type={type} />;
    else if (currentIndex === 2) content = <ActivityOrbit key="activity" direction={direction} type={type} />;
    else if (currentIndex === 3) content = <SystemOrbit key="system" direction={direction} type={type} />;
  }

  return (
    <div className="grid h-full w-[160px] items-start overflow-hidden">
      <AnimatePresence custom={{ direction, type }}>{content}</AnimatePresence>
    </div>
  );
}

function OrbitShell({
  title,
  children,
  hideTitle,
  direction,
  type,
}: {
  title: string;
  children: ReactNode;
  hideTitle?: boolean;
  direction: number;
  type: OrbitTransitionType;
}) {
  return (
    <motion.aside
      custom={{ direction, type }}
      variants={ORBIT_CONTAINER_VARIANTS}
      initial="enter"
      animate="center"
      exit="exit"
      className="col-start-1 row-start-1 flex h-fit max-h-[calc(100vh-4rem)] w-[160px] shrink-0 origin-center flex-col"
    >
      <div className="scrollbar-none flex-1 space-y-3 overflow-y-auto p-3">
        {!hideTitle && (
          <motion.div variants={FADE_UP_VARIANTS} className="px-2">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">{title}</h2>
          </motion.div>
        )}
        <div className="space-y-0.5">{children}</div>
      </div>
    </motion.aside>
  );
}

const MotionLink = motion(Link);

function OrbitLink({
  to,
  active,
  badge,
  children,
}: {
  to: string;
  active: boolean;
  badge?: number | string;
  children: ReactNode;
}) {
  return (
    <MotionLink
      variants={FADE_UP_VARIANTS}
      to={to}
      data-active={active ? "true" : "false"}
      className={cn(
        "cortex-orbit-link flex items-center justify-between rounded-[8px] px-2 py-1.5 text-[12px] tracking-tight",
        TRANSITION_SPRING,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101411]",
        "active:scale-[0.98] active:duration-150 active:ease-out",
        active && "font-medium",
      )}
    >
      <span className="truncate">{children}</span>
      {badge !== undefined && badge !== 0 && (
        <span className="ml-2 shrink-0 rounded-full px-1.5 text-[10px] font-medium tabular-nums text-text-muted">
          {badge}
        </span>
      )}
    </MotionLink>
  );
}

function OverviewOrbit({ direction, type }: { direction: number; type: OrbitTransitionType }) {
  const { missions } = useMissions();
  const source = missions ?? [];
  const active = source.find((mission) => isMissionActive(mission) && !missionRequiresAttention(mission));
  const attention = source.filter(missionRequiresAttention);

  return (
    <OrbitShell title="Maintenant" direction={direction} type={type}>
      {attention.length > 0 && (
        <OrbitLink to={`${ROUTES.missions}?filter=attention`} active={false} badge={attention.length}>
          À traiter
        </OrbitLink>
      )}
      {active ? (
        <OrbitLink to={ROUTES.missionDetail(active.id)} active={false}>Mission active</OrbitLink>
      ) : (
        <OrbitLink to={ROUTES.missions} active={false}>Toutes les missions</OrbitLink>
      )}
      <OrbitLink to={ROUTES.console} active={false}>Activité récente</OrbitLink>
    </OrbitShell>
  );
}

type OrbitMissionFilter = "all" | "attention" | "active" | "closed";

const missionFilters: { value: OrbitMissionFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "attention", label: "À traiter" },
  { value: "active", label: "Actives" },
  { value: "closed", label: "Clôturées" },
];

function MissionsOrbit({ direction, type }: { direction: number; type: OrbitTransitionType }) {
  const [searchParams] = useSearchParams();
  const { missions } = useMissions();
  const source = missions ?? [];
  const requested = searchParams.get("filter");
  const active = missionFilters.some((filter) => filter.value === requested)
    ? requested as OrbitMissionFilter
    : "all";
  const counts: Record<OrbitMissionFilter, number> = {
    all: source.length,
    attention: source.filter(missionRequiresAttention).length,
    active: source.filter((mission) => isMissionActive(mission) && !missionRequiresAttention(mission)).length,
    closed: source.filter((mission) => !isMissionActive(mission)).length,
  };

  return (
    <OrbitShell title="Vues" direction={direction} type={type}>
      {missionFilters.map((filter) => (
        <OrbitLink
          key={filter.value}
          to={filter.value === "all" ? ROUTES.missions : `${ROUTES.missions}?filter=${filter.value}`}
          active={active === filter.value}
          badge={counts[filter.value]}
        >
          {filter.label}
        </OrbitLink>
      ))}
    </OrbitShell>
  );
}

const missionTabs = [
  { value: "summary", label: "Résumé" },
  { value: "activity", label: "Activité" },
  { value: "details", label: "Détails" },
] as const;

function MissionDetailOrbit({ id, direction, type }: { id: string; direction: number; type: OrbitTransitionType }) {
  const [searchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const activeTab = requested === "activity" || requested === "details" ? requested : "summary";

  return (
    <OrbitShell title="Mission" direction={direction} type={type}>
      {missionTabs.map((tab) => (
        <OrbitLink
          key={tab.value}
          to={tab.value === "summary" ? ROUTES.missionDetail(id) : `${ROUTES.missionDetail(id)}?tab=${tab.value}`}
          active={activeTab === tab.value}
        >
          {tab.label}
        </OrbitLink>
      ))}
    </OrbitShell>
  );
}

function ActivityOrbit({ direction, type }: { direction: number; type: OrbitTransitionType }) {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter") ?? "all";

  return (
    <OrbitShell title="Activité" direction={direction} type={type}>
      <OrbitLink to={ROUTES.console} active={filter === "all"}>30 dernières min</OrbitLink>
      <OrbitLink to={`${ROUTES.console}?filter=decision`} active={filter === "decision"}>Décisions</OrbitLink>
      <OrbitLink to={`${ROUTES.console}?filter=error`} active={filter === "error"}>Erreurs</OrbitLink>
      <OrbitLink to={`${ROUTES.console}?filter=change`} active={filter === "change"}>Fichiers</OrbitLink>
      <OrbitLink to={`${ROUTES.console}?filter=test`} active={filter === "test"}>Tests</OrbitLink>
    </OrbitShell>
  );
}

const systemSections = [
  { id: "cortex-server", label: "Cortex Server" },
  { id: "claude-code", label: "Claude Code" },
  { id: "ledger", label: "Ledger" },
  { id: "storage", label: "Stockage" },
  { id: "sse", label: "Flux SSE" },
  { id: "errors", label: "Erreurs" },
];

const MotionButton = motion.button;

function SystemOrbit({ direction, type }: { direction: number; type: OrbitTransitionType }) {
  const handleAnchorClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <OrbitShell title="Système" direction={direction} type={type}>
      {systemSections.map((section) => (
        <MotionButton
          key={section.id}
          variants={FADE_UP_VARIANTS}
          type="button"
          onClick={() => handleAnchorClick(section.id)}
          data-active="false"
          className={cn(
            "cortex-orbit-link group flex w-full items-center justify-between rounded-[8px] px-2 py-1.5 text-left text-[12px] tracking-tight",
            TRANSITION_SPRING,
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101411]",
            "active:scale-[0.98] active:duration-150 active:ease-out",
          )}
        >
          <span className="truncate">{section.label}</span>
        </MotionButton>
      ))}
    </OrbitShell>
  );
}
