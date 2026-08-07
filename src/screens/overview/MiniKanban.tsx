import { useMemo, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { BentoCard } from "@/components/ui";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/cn";
import { TRANSITION_SPRING, LIQUID_GLASS_HOVER } from "@/lib/ui-classes";
import type { Mission, MissionStatus } from "@/lib/types";

const KANBAN_COLUMNS: { id: MissionStatus; title: string; color: string }[] = [
  { id: "running", title: "En cours", color: "text-info" },
  { id: "needs_review", title: "Action", color: "text-warning" },
  { id: "completed", title: "Terminées", color: "text-success" },
  { id: "failed", title: "Échecs", color: "text-error" },
];

const MOBILE_PRIORITY: MissionStatus[] = ["needs_review", "running", "failed", "completed", "cancelled"];

const STATUS_LABELS: Record<MissionStatus, string> = {
  running: "En cours",
  needs_review: "Action",
  completed: "Terminée",
  failed: "Échec",
  cancelled: "Annulée",
};

export function MiniKanban({ missions }: { missions: Mission[] }) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      el.classList.add("is-scrolling");
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        el.classList.remove("is-scrolling");
      }, 600);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0 && e.deltaX === 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
        handleScroll();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const grouped = useMemo(() => {
    const g: Record<MissionStatus, Mission[]> = {
      running: [],
      needs_review: [],
      completed: [],
      failed: [],
      cancelled: [],
    };
    missions.forEach((m) => {
      if (g[m.status]) g[m.status].push(m);
    });
    g.completed = g.completed.sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0));
    g.failed = g.failed.sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0));
    return g;
  }, [missions]);

  const mobileMissions = useMemo(
    () =>
      [...missions]
        .sort((a, b) => MOBILE_PRIORITY.indexOf(a.status) - MOBILE_PRIORITY.indexOf(b.status))
        .slice(0, 4),
    [missions],
  );

  return (
    <BentoCard className="relative flex h-full flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 z-0 hidden laptop:block"
        style={{
          backgroundImage: "radial-gradient(circle at center, rgba(0, 0, 0, 0.1) 1.5px, transparent 1.5px)",
          backgroundSize: "20px 20px",
          maskImage: "linear-gradient(to bottom, transparent 0%, transparent 60px, black 120px)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, transparent 60px, black 120px)",
        }}
      />

      <div className="relative z-10 laptop:hidden">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-[0.11em] text-text-primary">Missions</span>
          <span className="text-[13px] font-bold tracking-tight text-text-primary/75">{missions.length}</span>
        </div>

        <div className="flex flex-col gap-2">
          {mobileMissions.length > 0 ? (
            mobileMissions.map((mission) => (
              <MiniKanbanCard key={mission.id} mission={mission} mobile onClick={() => navigate(ROUTES.missionDetail(mission.id))} />
            ))
          ) : (
            <div className="rounded-[16px] border border-dashed border-black/[0.08] px-4 py-5 text-center text-xs font-semibold text-text-muted">
              Aucune mission
            </div>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="relative z-10 hidden flex-1 gap-4 overflow-x-auto pb-3 kanban-scrollbar laptop:flex">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col.id} className="flex min-w-[180px] flex-1 flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <span className={`size-1.5 rounded-full bg-current ${col.color} shadow-[0_0_8px_currentColor]`} />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{col.title}</h3>
              <span className="ml-auto rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-text-muted">{grouped[col.id].length}</span>
            </div>

            <div className="flex flex-col gap-2">
              {grouped[col.id].slice(0, 4).map((m) => (
                <MiniKanbanCard key={m.id} mission={m} onClick={() => navigate(ROUTES.missionDetail(m.id))} />
              ))}
              {grouped[col.id].length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 p-3 text-center text-xs text-text-muted">Vide</div>
              )}
              {grouped[col.id].length > 4 && <div className="pt-1 text-center text-[10px] text-text-muted">+ {grouped[col.id].length - 4} autres</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 mt-3 flex w-full justify-end pr-0.5 laptop:mt-3 laptop:pr-1">
        <Link
          to={ROUTES.missions}
          className="group inline-flex min-h-10 items-center gap-1.5 text-[12px] font-bold tracking-[-0.01em] text-text-primary/75 transition-colors hover:text-text-primary laptop:min-h-0 laptop:text-[11px] laptop:font-medium laptop:text-text-muted/50"
        >
          Toutes les missions <ArrowRight className="size-3.5 stroke-[2.8] transition-transform duration-300 group-hover:translate-x-0.5 laptop:size-3" />
        </Link>
      </div>
    </BentoCard>
  );
}

function MiniKanbanCard({ mission, onClick, mobile = false }: { mission: Mission; onClick: () => void; mobile?: boolean }) {
  const styles = {
    running: {
      border: "border-info/20",
      accent: "border-l-info/70",
      glow: "hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]",
      bg: "bg-info/5",
      status: "text-info",
    },
    needs_review: {
      border: "border-warning/30",
      accent: "border-l-warning/75",
      glow: "hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]",
      bg: "bg-warning/5",
      status: "text-warning",
    },
    completed: {
      border: "border-success/20",
      accent: "border-l-success/70",
      glow: "hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]",
      bg: "bg-success/5",
      status: "text-success",
    },
    failed: {
      border: "border-error/20",
      accent: "border-l-error/70",
      glow: "hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]",
      bg: "bg-error/5",
      status: "text-error",
    },
    cancelled: {
      border: "border-text-muted/20",
      accent: "border-l-text-muted/55",
      glow: "hover:shadow-[0_0_15px_rgba(156,163,175,0.1)]",
      bg: "bg-text-muted/5",
      status: "text-text-muted",
    },
  }[mission.status];

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={cn(
        "group relative flex cursor-pointer items-start gap-2 rounded-[18px] border p-3 text-left laptop:rounded-[20px]",
        "bg-white/40 backdrop-blur-2xl shadow-[inset_0_1px_4px_rgba(255,255,255,0.5),0_4px_16px_rgba(0,0,0,0.04)]",
        TRANSITION_SPRING,
        LIQUID_GLASS_HOVER,
        styles.border,
        styles.glow,
        mobile && cn("border-l-[3px] px-3.5 py-3", styles.accent),
      )}
    >
      <div className={cn("absolute inset-0 rounded-[18px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 laptop:rounded-[20px]", styles.bg)} />

      <div className="relative z-10 flex w-full flex-col gap-2">
        <p className={cn("line-clamp-2 text-[13px] font-medium leading-tight text-text-primary", mobile && "text-[14px] font-bold leading-snug tracking-[-0.015em]")}>{mission.objective}</p>
        <div className="flex min-w-0 items-center justify-between gap-3 text-[10px] text-text-muted">
          <span className="truncate font-mono text-[10px]">{mission.model}</span>
          {mission.status === "running" ? (
            <span className={cn("shrink-0 font-bold", styles.status)}>{mission.progress}%</span>
          ) : (
            <span className={cn("shrink-0 text-[10px] font-bold uppercase tracking-[0.08em]", styles.status)}>{STATUS_LABELS[mission.status]}</span>
          )}
        </div>
        {mobile && mission.status === "running" && (
          <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-black/[0.08]">
            <div className="h-full rounded-full bg-info" style={{ width: `${mission.progress}%` }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
