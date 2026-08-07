import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Terminal,
  Server,
  Sparkles,
  Search,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { ClaudeMark } from "@/components/brand/ClaudeMark";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import { useVps } from "@/lib/VpsContext";
import { useMissions } from "@/lib/useMissions";
import { useSystemHealth } from "@/lib/useSystemHealth";
import type { TimelineEventType } from "@/lib/types";

type RuntimeTab = "cortex" | "claude" | "custom";
type FilterType = "all" | "step" | "file_modified" | "test" | "plan" | "decision" | "error";

const EMPTY_HEALTH = {
  cortexServer: { status: "stopped" as const, uptimeSeconds: 0, memoryMb: 0 },
  claudeCode: { status: "unavailable" as const, lastCallAt: null, tokensUsedToday: 0 },
};

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${Math.max(0, Math.floor(seconds))} s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours} h ${minutes}` : `${hours} h`;
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return hours > 0 ? `${days} j ${hours} h` : `${days} j`;
}

function formatClockPrecise(ts: number): string {
  return new Date(ts).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Étiquettes monochromes neutres sans couleur
const CORTEX_BADGES: Record<
  TimelineEventType,
  { label: string; filterKey: FilterType }
> = {
  step: { label: "[step]", filterKey: "step" },
  file_modified: { label: "[diff]", filterKey: "file_modified" },
  file_read: { label: "[read]", filterKey: "file_modified" },
  test: { label: "[test]", filterKey: "test" },
  plan: { label: "[plan]", filterKey: "plan" },
  decision: { label: "[action]", filterKey: "decision" },
  closure: { label: "[close]", filterKey: "decision" },
  error: { label: "[err]", filterKey: "error" },
};

export function ConsoleScreen() {
  const navigate = useNavigate();
  const [activeRuntime, setActiveRuntime] = useState<RuntimeTab>("cortex");
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const { vps } = useVps();
  const { missions, refetch } = useMissions();
  const { health } = useSystemHealth();
  const activeMissions = missions ?? [];
  const liveHealth = health ?? EMPTY_HEALTH;

  // Événements Cortex
  const cortexEvents = useMemo(
    () =>
      activeMissions
        .flatMap((mission) =>
          mission.timeline.map((event) => ({
            ...event,
            missionId: mission.id,
            model: mission.model,
          })),
        )
        .sort((a, b) => b.ts - a.ts),
    [activeMissions],
  );

  // Événements Claude Code
  const claudeEvents = useMemo(
    () =>
      activeMissions
        .flatMap((mission) =>
          mission.timeline.map((event) => {
            let claudeTag = "[tool]";
            let filterKey: FilterType = "decision";

            if (event.type === "file_modified" || event.type === "file_read") {
              claudeTag = "[file_op]";
              filterKey = "file_modified";
            } else if (event.type === "test") {
              claudeTag = "[eval]";
              filterKey = "test";
            } else if (event.type === "plan" || event.type === "step") {
              claudeTag = "[prompt]";
              filterKey = event.type === "plan" ? "plan" : "step";
            } else if (event.type === "closure") {
              claudeTag = "[done]";
              filterKey = "decision";
            } else if (event.type === "error") {
              claudeTag = "[error]";
              filterKey = "error";
            }

            return {
              id: `claude-${event.id}`,
              ts: event.ts,
              missionId: mission.id,
              tag: claudeTag,
              filterKey,
              text: `${event.title}`,
            };
          }),
        )
        .sort((a, b) => b.ts - a.ts),
    [activeMissions],
  );

  // Filtrage Cortex
  const filteredCortexEvents = useMemo(() => {
    return cortexEvents.filter((ev) => {
      if (filter !== "all") {
        const badge = CORTEX_BADGES[ev.type];
        if (badge && badge.filterKey !== filter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return ev.title.toLowerCase().includes(q) || ev.type.toLowerCase().includes(q);
      }
      return true;
    });
  }, [cortexEvents, filter, searchQuery]);

  // Filtrage Claude
  const filteredClaudeEvents = useMemo(() => {
    return claudeEvents.filter((ev) => {
      if (filter !== "all" && ev.filterKey !== filter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return ev.text.toLowerCase().includes(q) || ev.tag.toLowerCase().includes(q);
      }
      return true;
    });
  }, [claudeEvents, filter, searchQuery]);

  const handleCopyLogs = () => {
    const lines =
      activeRuntime === "cortex"
        ? filteredCortexEvents.map(
            (e) => `[${formatClockPrecise(e.ts)}] [${e.type}] ${e.title}`,
          )
        : filteredClaudeEvents.map(
            (e) => `[${formatClockPrecise(e.ts)}] ${e.tag} ${e.text}`,
          );

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex h-[calc(100dvh-170px)] w-full flex-col space-y-3 pb-2 laptop:h-[calc(100vh-140px)] laptop:space-y-4 laptop:pb-0"
    >
      <PageHeader
        title="Console Runtime"
        icon={Terminal}
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-[6px] border border-white/60 bg-white/70 px-3 py-1.5 font-mono text-[11px] font-bold text-text-primary shadow-sm backdrop-blur-md transition-all duration-fast hover:bg-white"
          >
            <RefreshCw className="size-3" />
            <span>Actualiser</span>
          </button>
        }
      />

      {/* CONSOLE PLEIN FORMAT PARFAITEMENT ADAPTÉE À LA HAUTEUR */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-[18px] border border-white/70 bg-white/45 p-3 text-text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_8px_24px_-4px_rgba(0,0,0,0.04)] backdrop-blur-2xl laptop:rounded-[24px] laptop:p-5">
        {/* BARRE SUPÉRIEURE : SÉLECTEUR DE RUNTIME & TÉLÉMÉTRIE ÉPURÉE */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-black/[0.06] pb-2.5 laptop:gap-3 laptop:pb-3">
          <div className="flex items-center gap-1 rounded-md border border-white/60 bg-white/60 p-0.5 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
            <button
              type="button"
              onClick={() => setActiveRuntime("cortex")}
              className={cn(
                "flex items-center gap-2 rounded-[6px] px-3 py-1 font-mono text-[11px] font-bold transition-all duration-fast",
                activeRuntime === "cortex"
                  ? "border border-accent-indigo/60 bg-accent-indigo text-white shadow-sm"
                  : "border border-transparent text-text-secondary hover:bg-black/[0.04] hover:text-text-primary",
              )}
            >
              <Server className="size-3.5" strokeWidth={2.8} />
              <span>Cortex Core</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRuntime("claude")}
              className={cn(
                "flex items-center gap-2 rounded-[6px] px-3 py-1 font-mono text-[11px] font-bold transition-all duration-fast",
                activeRuntime === "claude"
                  ? "border border-[#D97757]/60 bg-[#D97757] text-white shadow-sm"
                  : "border border-transparent text-text-secondary hover:bg-black/[0.04] hover:text-text-primary",
              )}
            >
              <ClaudeMark title="Claude" className="size-3.5" />
              <span>Claude Code</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRuntime("custom")}
              className={cn(
                "flex items-center gap-1 rounded-[6px] px-2.5 py-1 font-mono text-[10.5px] font-bold transition-all duration-fast",
                activeRuntime === "custom"
                  ? "border border-black/10 bg-black/10 text-text-primary shadow-sm"
                  : "border border-transparent text-text-muted hover:bg-black/[0.04] hover:text-text-primary",
              )}
            >
              <Sparkles className="size-3" strokeWidth={2.5} />
              <span>+</span>
            </button>
          </div>

          {/* TÉLÉMÉTRIE D'ÉTAT SANS TEXTES INUTILES */}
          <div className="flex items-center gap-3 font-mono text-[11px] text-text-muted">
            {activeRuntime === "cortex" ? (
              <>
                <span>
                  {vps ? `VPS ${vps.ip} · ` : ""}Uptime: {formatUptime(liveHealth.cortexServer.uptimeSeconds)} · RAM: {liveHealth.cortexServer.memoryMb} Mo
                </span>
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
                  <span className="relative inline-flex size-2 rounded-full bg-success" />
                </span>
              </>
            ) : activeRuntime === "claude" ? (
              <>
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
                  <span className="relative inline-flex size-2 rounded-full bg-success" />
                </span>
              </>
            ) : (
              <span>Extension Runtime</span>
            )}
          </div>
        </div>

        {/* BARRE D'OUTILS & FILTRES DU FLUX */}
        <div className="my-2.5 flex flex-wrap items-center justify-between gap-2.5 font-mono text-[11px] laptop:my-3">
          {/* Onglets de filtrage rapide avec défilement horizontal fluide sur mobile */}
          <div className="flex w-full items-center gap-1 overflow-x-auto pb-1 no-scrollbar tablet:w-auto tablet:pb-0">
            {(
              [
                { id: "all", label: "Tous" },
                { id: "step", label: "[step]" },
                { id: "file_modified", label: "[diff]" },
                { id: "test", label: "[test]" },
                { id: "plan", label: "[plan]" },
                { id: "decision", label: "[action]" },
                { id: "error", label: "[err]" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  "shrink-0 rounded-[5px] px-2 py-0.5 transition-all duration-fast",
                  filter === item.id
                    ? "bg-black/[0.08] text-text-primary font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,1)]"
                    : "text-text-muted hover:bg-black/[0.03] hover:text-text-primary",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Recherche & Copie */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Filtrer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-6.5 w-36 rounded-[6px] border border-black/[0.08] bg-white/70 pl-7 pr-2 font-mono text-[10px] text-text-primary placeholder-text-muted transition-colors focus:border-accent-indigo focus:outline-none laptop:w-48"
              />
            </div>

            <button
              type="button"
              onClick={handleCopyLogs}
              className="flex h-6.5 items-center gap-1 rounded-[6px] border border-black/[0.08] bg-white/70 px-2 font-mono text-[10px] text-text-secondary transition-all duration-fast hover:border-black/20 hover:bg-white hover:text-text-primary"
            >
              {copied ? (
                <>
                  <Check className="size-2.5 text-success" />
                  <span className="text-success">Copié</span>
                </>
              ) : (
                <>
                  <Copy className="size-2.5" />
                  <span>Copier</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CORPS DU TERMINAL PARFAITEMENT DÉFILEMENT FLEX-1 */}
        <div className="flex-1 overflow-y-auto rounded-[14px] border border-black/[0.06] bg-black/[0.02] p-3.5 font-mono text-[11px] leading-relaxed backdrop-blur-md">
          {activeRuntime === "cortex" ? (
            filteredCortexEvents.length === 0 ? (
              <div className="py-20 text-center text-text-muted">
                [aucun_événement_enregistré]
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredCortexEvents.map((event) => {
                  const badge = CORTEX_BADGES[event.type] ?? {
                    label: `[${event.type}]`,
                  };

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => navigate(ROUTES.missionDetail(event.missionId))}
                      className="group grid w-full grid-cols-[auto_auto_1fr] items-baseline gap-2.5 rounded-md px-2 py-0.5 text-left transition-colors duration-fast hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-indigo"
                    >
                      <span className="shrink-0 tabular-nums text-text-muted group-hover:text-text-secondary">
                        {formatClockPrecise(event.ts)}
                      </span>

                      {/* Étiquette monochrome neutre sans couleur */}
                      <span className="shrink-0 font-bold text-text-secondary">
                        {badge.label}
                      </span>

                      <p className="truncate text-text-secondary group-hover:text-text-primary">
                        <span>{event.title}</span>
                      </p>
                    </button>
                  );
                })}
              </div>
            )
          ) : activeRuntime === "claude" ? (
            filteredClaudeEvents.length === 0 ? (
              <div className="py-20 text-center text-text-muted">
                [aucun_log_claude_disponible]
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredClaudeEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => navigate(ROUTES.missionDetail(event.missionId))}
                    className="group grid w-full grid-cols-[auto_auto_1fr] items-baseline gap-2.5 rounded-md px-2 py-0.5 text-left transition-colors duration-fast hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D97757]"
                  >
                    <span className="shrink-0 tabular-nums text-text-muted group-hover:text-text-secondary">
                      {formatClockPrecise(event.ts)}
                    </span>

                    {/* Étiquette monochrome neutre sans couleur */}
                    <span className="shrink-0 font-bold text-text-secondary">
                      {event.tag}
                    </span>

                    <p className="truncate text-text-secondary group-hover:text-text-primary">
                      <span>{event.text}</span>
                    </p>
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Sparkles className="size-7 text-text-muted" />
              <p className="mt-2 text-[12px] font-bold text-text-primary">Slot d'extension</p>
              <p className="mt-1 max-w-[380px] text-[11px] text-text-muted">
                Flux d'exécution branché directement via les webhooks du serveur.
              </p>
            </div>
          )}
        </div>

        {/* PIED DE CONSOLE DISCRET */}
        <div className="mt-2.5 flex items-center justify-between border-t border-black/[0.06] pt-2 font-mono text-[10px] text-text-muted">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3 text-success" />
            <span>Synchronisé SSE</span>
          </div>

          <span>
            {activeRuntime === "cortex"
              ? `${filteredCortexEvents.length} événements`
              : `${filteredClaudeEvents.length} logs`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
