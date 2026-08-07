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

const MOBILE_PRIORITY: MissionStatus[] = ["needs_review", "running", "failed", "completed"];

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
        .slice(0, 5),
    [missions],
  );

  return (
    <BentoCard className="relative flex h-full flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: "radial-gradient(circle at center, rgba(0, 0, 0, 0.1) 1.5px, transparent 1.5px)",
          backgroundSize: "20px 20px",
          maskImage: "linear-gradient(to bottom, transparent 0%, transparent 60px, black 120px)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, transparent 60px, black 120px)",
        }}
      />

      <div className="relative z-10 laptop:hidden">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-text-primary">Missions</span>
          <span className="rounded-[8px] border border-white/60 bg-white/50 px-2 py-0.5 text-[11px] font-bold text-text-primary shadow-sm">
            {missions.length}
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {mobileMissions.length > 0 ? (
            mobileMissions.map((mission) => (
              <MiniKanbanCard
                key={mission.id}
                mission={mission}
                mobile
                onClick={() => navigate(ROUTES.missionDetail(mission.id))}
              />
            ))
          ) : (
            <div className="rounded-[20px] border border-dashed border-white/40 p-4 text-center text-xs font-medium text-text-muted">
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
              <span className="ml-auto rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                {grouped[col.id].length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {grouped[col.id].slice(0, 4).map((m) => (
                <MiniKanbanCard key={m.id} mission={m} onClick={() => navigate(ROUTES.missionDetail(m.id))} />
              ))}
              {grouped[col.id].length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 p-3 text-center text-xs text-text-muted">
                  Vide
                </div>
              )}
              {grouped[col.id].length > 4 && (
                <div className="pt-1 text-center text-[10px] text-text-muted">
                  + {grouped[col.id].length - 4} autres
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 mt-4 flex w-full justify-end pr-1 laptop:mt-3">
        <Link
          to={ROUTES.missions}
          className="group inline-flex items-center gap-1 text-[11px] font-medium text-text-muted/50 transition-colors hover:text-text-primary"
        >
          Ouvrir les missions <ArrowRight className="size-3 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </BentoCard>
  );
}

function MiniKanbanCard({ mission, onClick, mobile = false }: { mission: Mission; onClick: () => void; mobile?: boolean }) {
  const styles = {
    running: {
      border: "border-info/20",
      glow: "hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]",
      bg: "bg-info/5",
      dot: "bg-info",
    },
    needs_review: {
      border: "border-warning/30",
      glow: "hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]",
      bg: "bg-warning/5",
      dot: "bg-warning",
    },
    completed: {
      border: "border-success/20",
      glow: "hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]",
      bg: "bg-success/5",
      dot: "bg-success",
    },
    failed: {
      border: "border-error/20",
      glow: "hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]",
      bg: "bg-error/5",
      dot: "bg-error",
    },
    cancelled: {
      border: "border-text-muted/20",
      glow: "hover:shadow-[0_0_15px_rgba(156,163,175,0.1)]",
      bg: "bg-text-muted/5",
      dot: "bg-text-muted",
    },
  }[mission.status];

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative flex cursor-pointer items-start gap-2 rounded-[20px] border p-3 text-left",
        "bg-white/40 backdrop-blur-2xl shadow-[inset_0_1px_4px_rgba(255,255,255,0.5),0_4px_16px_rgba(0,0,0,0.04)]",
        TRANSITION_SPRING,
        LIQUID_GLASS_HOVER,
        styles.border,
        styles.glow,
        mobile && "p-3.5",
      )}
    >
      <div className={cn("absolute inset-0 rounded-[20px] opacity-0 transition-opacity duration-300 group-hover:opacity-100", styles.bg)} />

      <div className="relative z-10 flex w-full flex-col gap-1.5">
        <div className="flex items-start gap-2.5">
          {mobile && <span className={cn("mt-1.5 size-2 shrink-0 rounded-full shadow-[0_0_8px_currentColor]", styles.dot)} />}
          <p className={cn("line-clamp-2 text-[13px] font-medium leading-tight text-text-primary", mobile && "text-sm font-semibold")}>
            {mission.objective}
          </p>
        </div>
        <div className={cn("flex items-center justify-between text-[10px] text-text-muted", mobile && "pl-4.5") }>
          <span className="rounded border border-white/5 bg-white/10 px-1 font-mono">{mission.model}</span>
          {mission.status === "running" ? (
            <span className="font-medium text-info">{mission.progress}%</span>
          ) : (
            <span className="font-bold uppercase tracking-wider">{mission.status.replace("_", " ")}</span>
          )}
        </div>
        {mobile && mission.status === "running" && (
          <div className="ml-4.5 mt-1 h-1 overflow-hidden rounded-full bg-black/10">
            <div className="h-full rounded-full bg-info" style={{ width: `${mission.progress}%` }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
