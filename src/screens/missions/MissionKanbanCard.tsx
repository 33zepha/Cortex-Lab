import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, AlertCircle, XCircle, Loader2 } from "lucide-react";
import type { Mission } from "@/lib/types";
import { formatDuration } from "@/lib/status";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/cn";
import { TRANSITION_SPRING, LIQUID_GLASS_HOVER } from "@/lib/ui-classes";

interface MissionKanbanCardProps {
  mission: Mission;
}

export function MissionKanbanCard({ mission }: MissionKanbanCardProps) {
  const navigate = useNavigate();

  // Définition des couleurs/styles selon le statut
  const styles = {
    running: {
      border: "border-info/30",
      glow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]",
      icon: <Loader2 className="size-4 animate-spin text-info" />,
      bg: "bg-info/5",
    },
    needs_review: {
      border: "border-warning/40",
      glow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]",
      icon: <AlertCircle className="size-4 text-warning" />,
      bg: "bg-warning/5",
    },
    completed: {
      border: "border-success/30",
      glow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]",
      icon: <CheckCircle2 className="size-4 text-success" />,
      bg: "bg-success/5",
    },
    failed: {
      border: "border-error/30",
      glow: "hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]",
      icon: <XCircle className="size-4 text-error" />,
      bg: "bg-error/5",
    },
    cancelled: {
      border: "border-text-muted/30",
      glow: "hover:shadow-[0_0_20px_rgba(156,163,175,0.2)]",
      icon: <XCircle className="size-4 text-text-muted" />,
      bg: "bg-text-muted/5",
    },
  }[mission.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(ROUTES.missionDetail(mission.id))}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-3 rounded-[24px] border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo",
        "bg-white/40 backdrop-blur-3xl shadow-[inset_0_1px_4px_rgba(255,255,255,0.5),0_8px_24px_rgba(0,0,0,0.04)]",
        TRANSITION_SPRING,
        LIQUID_GLASS_HOVER,
        styles.border,
        styles.glow
      )}
    >
      {/* Halo de fond subtil */}
      <div className={cn("absolute inset-0 rounded-[24px] opacity-0 transition-opacity duration-300 group-hover:opacity-100", styles.bg)} />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-sm font-medium text-text-primary leading-snug">
          {mission.objective}
        </h3>
        <div className="shrink-0 mt-0.5">{styles.icon}</div>
      </div>

      <div className="relative z-10 mt-auto flex items-center justify-between text-xs text-text-secondary">
        <div className="flex items-center gap-1.5">
          <span className="font-mono rounded-md bg-white/10 px-1.5 py-0.5 border border-white/10">
            {mission.model}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <Clock className="size-3" />
          <span className="font-mono">{formatDuration(mission.durationMs)}</span>
        </div>
      </div>

      {/* Barre de progression si running */}
      {mission.status === "running" && (
        <div className="relative z-10 mt-1 h-1 w-full overflow-hidden rounded-full bg-black/20">
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
