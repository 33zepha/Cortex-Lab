import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, AlertCircle, XCircle, Loader2 } from "lucide-react";
import type { Mission } from "@/lib/types";
import { formatDuration } from "@/lib/status";
import { getMissionDisplay } from "@/lib/mission-naming";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/cn";
import { TRANSITION_SPRING, LIQUID_GLASS_HOVER } from "@/lib/ui-classes";

interface MissionKanbanCardProps {
  mission: Mission;
}

const STATUS_LABELS: Record<Mission["status"], string> = {
  running: "En cours",
  needs_review: "Revue requise",
  completed: "Terminée",
  failed: "Échec",
  cancelled: "Annulée",
};

export function MissionKanbanCard({ mission }: MissionKanbanCardProps) {
  const navigate = useNavigate();
  const display = getMissionDisplay(mission, { preset: "card" });

  const styles = {
    running: {
      border: "border-info/30",
      accent: "border-l-info/75",
      glow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]",
      icon: <Loader2 className="size-[18px] animate-spin text-info" strokeWidth={2.8} />,
      bg: "bg-info/5",
      status: "text-info",
    },
    needs_review: {
      border: "border-warning/40",
      accent: "border-l-warning/80",
      glow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]",
      icon: <AlertCircle className="size-[18px] text-warning" strokeWidth={2.8} />,
      bg: "bg-warning/5",
      status: "text-warning",
    },
    completed: {
      border: "border-success/30",
      accent: "border-l-success/75",
      glow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]",
      icon: <CheckCircle2 className="size-[18px] text-success" strokeWidth={2.8} />,
      bg: "bg-success/5",
      status: "text-success",
    },
    failed: {
      border: "border-error/30",
      accent: "border-l-error/75",
      glow: "hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]",
      icon: <XCircle className="size-[18px] text-error" strokeWidth={2.8} />,
      bg: "bg-error/5",
      status: "text-error",
    },
    cancelled: {
      border: "border-text-muted/30",
      accent: "border-l-text-muted/60",
      glow: "hover:shadow-[0_0_20px_rgba(156,163,175,0.2)]",
      icon: <XCircle className="size-[18px] text-text-muted" strokeWidth={2.8} />,
      bg: "bg-text-muted/5",
      status: "text-text-muted",
    },
  }[mission.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => navigate(ROUTES.missionDetail(mission.id))}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-2.5 rounded-[20px] border border-l-[3px] p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo laptop:gap-3 laptop:rounded-[24px]",
        "bg-white/40 backdrop-blur-3xl shadow-[inset_0_1px_4px_rgba(255,255,255,0.5),0_8px_24px_rgba(0,0,0,0.04)]",
        TRANSITION_SPRING,
        LIQUID_GLASS_HOVER,
        styles.border,
        styles.accent,
        styles.glow,
      )}
    >
      <div className={cn("absolute inset-0 rounded-[20px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 laptop:rounded-[24px]", styles.bg)} />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.02em] text-text-primary laptop:text-sm laptop:font-medium laptop:tracking-normal">
            {display.title}
          </h3>
          {display.subtitle && (
            <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-text-muted">
              {display.subtitle}
            </p>
          )}
          <p className={cn("mt-1 text-[10px] font-bold uppercase tracking-[0.09em] laptop:hidden", styles.status)}>
            {STATUS_LABELS[mission.status]}
          </p>
        </div>
        <div className="mt-0.5 shrink-0">{styles.icon}</div>
      </div>

      <div className="relative z-10 mt-auto flex items-center justify-between gap-3 text-xs text-text-secondary">
        <span className="min-w-0 truncate font-mono text-[11px] text-text-muted">{mission.model}</span>
        <div className="flex shrink-0 items-center gap-1.5 font-semibold text-text-secondary">
          <Clock className="size-3.5" strokeWidth={2.6} />
          <span className="font-mono text-[11px]">{formatDuration(mission.durationMs)}</span>
        </div>
      </div>

      {mission.status === "running" && (
        <div className="relative z-10 mt-0.5 h-1 w-full overflow-hidden rounded-full bg-black/[0.09]">
          <motion.div
            className="h-full bg-info"
            initial={{ width: 0 }}
            animate={{ width: `${mission.progress}%` }}
            transition={{ ease: "linear", duration: 0.5 }}
          />
        </div>
      )}
    </motion.div>
  );
}
