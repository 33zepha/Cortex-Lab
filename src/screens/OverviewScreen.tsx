import { motion } from "framer-motion";
import { Squares2X2Icon } from "@heroicons/react/24/solid";
import { PageHeader } from "@/components/shell/PageHeader";
import { useMissions } from "@/lib/useMissions";
import { useSystemHealth } from "@/lib/useSystemHealth";
import { KpiRow } from "@/screens/overview/KpiRow";
import { MiniKanban } from "@/screens/overview/MiniKanban";
import { TokenUsageCard } from "@/components/TokenUsage";

export function OverviewScreen() {
  const { missions, error: missionsError, refetch } = useMissions();
  const { error: healthError } = useSystemHealth();
  const activeMissions = missions ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="w-full space-y-7 laptop:space-y-9"
    >
      <PageHeader title="Overview" icon={Squares2X2Icon} />

      {(healthError || missionsError) && (
        <div className="rounded-[18px] border border-error/30 bg-error/[0.06] p-4">
          <p className="text-[12px] font-bold text-error">Connexion API dégradée</p>
          <p className="mt-1 text-[11px] font-medium leading-relaxed text-text-secondary">
            {healthError || missionsError}
          </p>
        </div>
      )}

      {/* RANGÉE DE KPI BENTO */}
      <KpiRow missions={activeMissions} />

      {/* MODULE SOBRE DE CONSOMMATION DES TOKENS (STYLE LINEAR, RAIL 2PX & TYPOGRAPHIE FINE) */}
      <TokenUsageCard />

      {/* RANGÉE INFÉRIEURE : COCKPIT MISSIONS PLEINE LARGEUR (12 COLS) */}
      <div className="w-full">
        <MiniKanban missions={activeMissions} onCreated={refetch} />
      </div>
    </motion.div>
  );
}
