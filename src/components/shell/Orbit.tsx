import { type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import { TRANSITION_SPRING } from "@/lib/ui-classes";
import { FADE_UP_VARIANTS, ORBIT_CONTAINER_VARIANTS } from "@/lib/animations";
import { useOrbitNavigation, type OrbitTransitionType } from "./useOrbitNavigation";
import { allMissions, missionActive } from "@/fixtures/missions";
import type { MissionFilter } from "@/lib/types";

export function Orbit({ isOpen }: { isOpen: boolean }) {
  const { id, currentIndex, direction, type } = useOrbitNavigation();

  let content = null;
  if (isOpen) {
    if (id) {
      content = <MissionDetailOrbit key={`mission-${id}`} id={id} direction={direction} type={type} />;
    } else if (currentIndex === 0) {
      content = <OverviewOrbit key="overview" direction={direction} type={type} />;
    } else if (currentIndex === 1) {
      content = <MissionsOrbit key="missions" direction={direction} type={type} />;
    } else if (currentIndex === 2) {
      content = <SystemOrbit key="system" direction={direction} type={type} />;
    }
  }

  return (
    <div className="grid w-[160px] h-full items-start overflow-hidden">
      <AnimatePresence custom={{ direction, type }}>
        {content}
      </AnimatePresence>
    </div>
  );
}

function OrbitShell({ title, children, hideTitle, direction, type }: { title: string; children: ReactNode; hideTitle?: boolean; direction: number; type: OrbitTransitionType }) {
  return (
    <motion.aside
      custom={{ direction, type }}
      variants={ORBIT_CONTAINER_VARIANTS}
      initial="enter"
      animate="center"
      exit="exit"
      className={cn(
        "col-start-1 row-start-1",
        "flex h-fit max-h-[calc(100vh-4rem)] w-[160px] flex-col shrink-0 origin-center",
      )}
    >
      <div className="flex-1 overflow-y-auto scrollbar-none p-3 space-y-3">
        {!hideTitle && (
          <motion.div variants={FADE_UP_VARIANTS} className="px-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">
              {title}
            </h2>
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
      className={cn(
        "flex items-center justify-between rounded-[8px] px-2 py-1 text-[13px] tracking-tight",
        TRANSITION_SPRING,
        "focus-visible:ring-2 focus-visible:ring-accent-indigo focus-visible:outline-none focus-visible:ring-offset-2",
        "active:scale-[0.98] active:duration-150 active:ease-out",
        active
          ? "bg-black/[0.04] text-text-primary font-medium"
          : "text-text-secondary hover:text-text-primary",
      )}
    >
      <span className="truncate">{children}</span>
      {badge !== undefined && badge !== 0 && (
        <span
          className={cn(
            "ml-2 shrink-0 rounded-full px-1.5 text-[10px] font-medium tabular-nums",
            active ? "text-text-primary" : "text-text-muted",
          )}
        >
          {badge}
        </span>
      )}
    </MotionLink>
  );
}

function OverviewOrbit({ direction, type }: { direction: number; type: OrbitTransitionType }) {
  const needsReview = allMissions.filter((m) => m.decisionRequired);

  return (
    <OrbitShell title="Général" direction={direction} type={type}>
      <OrbitLink to={ROUTES.missionDetail(missionActive.id)} active={false}>
        Mission active
      </OrbitLink>
      {needsReview.length > 0 && (
        <OrbitLink to={`${ROUTES.missions}?filter=needs_review`} active={false} badge={needsReview.length}>
          À réviser
        </OrbitLink>
      )}
    </OrbitShell>
  );
}

const missionFilters: { value: MissionFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "active", label: "Actives" },
  { value: "needs_review", label: "À réviser" },
  { value: "completed", label: "Terminées" },
  { value: "failed", label: "Échouées" },
];

function MissionsOrbit({ direction, type }: { direction: number; type: OrbitTransitionType }) {
  const [searchParams] = useSearchParams();
  const active = (searchParams.get("filter") as MissionFilter | null) ?? "all";

  const counts: Record<MissionFilter, number> = {
    all: allMissions.length,
    active: allMissions.filter((m) => m.status === "running").length,
    needs_review: allMissions.filter((m) => m.decisionRequired).length,
    completed: allMissions.filter((m) => m.status === "completed").length,
    failed: allMissions.filter((m) => m.status === "failed").length,
  };

  return (
    <OrbitShell title="Vues" direction={direction} type={type}>
      {missionFilters.map((f) => (
        <OrbitLink
          key={f.value}
          to={`${ROUTES.missions}?filter=${f.value}`}
          active={active === f.value}
          badge={counts[f.value]}
        >
          {f.label}
        </OrbitLink>
      ))}
    </OrbitShell>
  );
}

const missionTabs = [
  { value: "timeline", label: "Timeline" },
  { value: "files", label: "Fichiers" },
  { value: "tests", label: "Tests" },
  { value: "evidence", label: "Preuves" },
  { value: "patch", label: "Patch" },
  { value: "errors", label: "Erreurs" },
];

function MissionDetailOrbit({ id, direction, type }: { id: string; direction: number; type: OrbitTransitionType }) {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "timeline";

  return (
    <OrbitShell title="Détails" direction={direction} type={type}>
      {missionTabs.map((t) => (
        <OrbitLink key={t.value} to={`${ROUTES.missionDetail(id)}?tab=${t.value}`} active={activeTab === t.value}>
          {t.label}
        </OrbitLink>
      ))}
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
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <OrbitShell title="Système" direction={direction} type={type}>
      {systemSections.map((s) => (
        <MotionButton
          key={s.id}
          variants={FADE_UP_VARIANTS}
          type="button"
          onClick={() => handleAnchorClick(s.id)}
          className={cn(
            "group flex w-full items-center justify-between rounded-[8px] px-2 py-1 text-[13px] tracking-tight text-left",
            TRANSITION_SPRING,
            "focus-visible:ring-2 focus-visible:ring-accent-indigo focus-visible:outline-none focus-visible:ring-offset-2",
            "active:scale-[0.98] active:duration-150 active:ease-out",
            "text-text-secondary hover:text-text-primary hover:bg-black/[0.04]",
          )}
        >
          <span className="truncate">{s.label}</span>
        </MotionButton>
      ))}
    </OrbitShell>
  );
}



