import { useMemo, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, LayoutGrid } from "lucide-react";
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
      // Convert vertical scroll to horizontal scroll
      if (e.deltaY !== 0 && e.deltaX === 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY; // Instant fluid scroll
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
    // For completed/failed, sort by latest
    g.completed = g.completed.sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0));
    g.failed = g.failed.sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0));
    return g;
  }, [missions]);

  return (
    <BentoCard 
      className="h-full flex flex-col relative overflow-hidden"
    >
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at center, rgba(0, 0, 0, 0.1) 1.5px, transparent 1.5px)",
          backgroundSize: "20px 20px",
          maskImage: "linear-gradient(to bottom, transparent 0%, transparent 60px, black 120px)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, transparent 60px, black 120px)"
        }}
      />
      <div 
        ref={scrollRef}
        className="relative z-10 flex flex-1 gap-4 overflow-x-auto pb-3 kanban-scrollbar"
      >
        {KANBAN_COLUMNS.map((col) => (
          <div key={col.id} className="flex min-w-[180px] flex-1 flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <span className={`size-1.5 rounded-full bg-current ${col.color} shadow-[0_0_8px_currentColor]`} />
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{col.title}</h3>
              <span className="ml-auto text-[10px] font-medium text-text-muted bg-white/5 px-1.5 py-0.5 rounded-md">
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
                <div className="text-center text-[10px] text-text-muted pt-1">
                  + {grouped[col.id].length - 4} autres
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="relative z-10 mt-3 flex justify-end w-full pr-1">
        <Link 
          to={ROUTES.missions} 
          className="group inline-flex items-center gap-1 text-[11px] font-medium text-text-muted/50 transition-colors hover:text-text-primary"
        >
          Ouvrir le Kanban <ArrowRight className="size-3 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </BentoCard>
  );
}

function MiniKanbanCard({ mission, onClick }: { mission: Mission; onClick: () => void }) {
  const styles = {
    running: {
      border: "border-info/20",
      glow: "hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]",
      bg: "bg-info/5",
    },
    needs_review: {
      border: "border-warning/30",
      glow: "hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]",
      bg: "bg-warning/5",
    },
    completed: {
      border: "border-success/20",
      glow: "hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]",
      bg: "bg-success/5",
    },
    failed: {
      border: "border-error/20",
      glow: "hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]",
      bg: "bg-error/5",
    },
    cancelled: {
      border: "border-text-muted/20",
      glow: "hover:shadow-[0_0_15px_rgba(156,163,175,0.1)]",
      bg: "bg-text-muted/5",
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
        styles.glow
      )}
    >
      <div className={cn("absolute inset-0 rounded-[20px] opacity-0 transition-opacity duration-300 group-hover:opacity-100", styles.bg)} />
      
      <div className="relative z-10 w-full flex flex-col gap-1.5">
        <p className="line-clamp-2 text-[13px] font-medium text-text-primary leading-tight">
          {mission.objective}
        </p>
        <div className="flex items-center justify-between text-[10px] text-text-muted">
          <span className="font-mono bg-white/10 px-1 rounded border border-white/5">{mission.model}</span>
          {mission.status === "running" && (
             <span className="text-info font-medium">{mission.progress}%</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
