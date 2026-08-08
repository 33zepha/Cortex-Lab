import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import { Inbox, Search, X } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { OperatorMissionRow } from "@/components/operator/OperatorMissionRow";
import { EmptyState, ErrorState, SearchInput, Skeleton } from "@/components/ui";
import { NewMissionDialog } from "@/screens/missions/NewMissionDialog";
import {
  getOperationalMission,
  isMissionActive,
  missionRequiresAttention,
} from "@/lib/operator-contract";
import { useMissions } from "@/lib/useMissions";
import { cn } from "@/lib/cn";
import type { Mission } from "@/lib/types";

type MissionViewFilter = "all" | "attention" | "active" | "closed";

const FILTERS: { id: MissionViewFilter; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "attention", label: "À traiter" },
  { id: "active", label: "Actives" },
  { id: "closed", label: "Clôturées" },
];

function parseFilter(value: string | null): MissionViewFilter {
  if (value === "needs_review" || value === "attention") return "attention";
  if (value === "active") return "active";
  if (value === "completed" || value === "failed" || value === "closed") return "closed";
  return "all";
}

function sortByLastActivity(missions: Mission[]): Mission[] {
  return [...missions].sort((a, b) => {
    const aTime = getOperationalMission(a).lastEvent?.ts ?? a.createdAt;
    const bTime = getOperationalMission(b).lastEvent?.ts ?? b.createdAt;
    return bTime - aTime;
  });
}

export function MissionsScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const filter = parseFilter(searchParams.get("filter"));
  const { missions, loading, error, refetch } = useMissions();
  const source = missions ?? [];

  const matching = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return source.filter((mission) => {
      const view = getOperationalMission(mission);
      const matchesQuery = !normalizedQuery || [
        mission.title,
        mission.objective,
        mission.constraints,
        view.agentName,
        view.runtimeName,
        view.modelName,
      ].some((value) => value?.toLowerCase().includes(normalizedQuery));

      if (!matchesQuery) return false;
      if (filter === "attention") return missionRequiresAttention(mission);
      if (filter === "active") return isMissionActive(mission) && !missionRequiresAttention(mission);
      if (filter === "closed") return !isMissionActive(mission);
      return true;
    });
  }, [filter, query, source]);

  const groups = useMemo(() => {
    if (filter !== "all") return [{ id: filter, label: FILTERS.find((item) => item.id === filter)?.label ?? "", missions: sortByLastActivity(matching) }];
    return [
      { id: "attention", label: "À traiter", missions: sortByLastActivity(matching.filter(missionRequiresAttention)) },
      { id: "active", label: "Actives", missions: sortByLastActivity(matching.filter((mission) => isMissionActive(mission) && !missionRequiresAttention(mission))) },
      { id: "closed", label: "Clôturées", missions: sortByLastActivity(matching.filter((mission) => !isMissionActive(mission) && !missionRequiresAttention(mission))) },
    ].filter((group) => group.missions.length > 0);
  }, [filter, matching]);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHeader title="Missions" icon={RocketLaunchIcon} />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-[92px] w-full rounded-[14px]" />
          ))}
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHeader title="Missions" icon={RocketLaunchIcon} />
        <ErrorState title="Impossible de joindre l'API Cortex" description={error} onRetry={() => void refetch()} />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className="w-full">
      <PageHeader
        title="Missions"
        icon={RocketLaunchIcon}
        action={
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label={searchOpen ? "Fermer la recherche" : "Rechercher une mission"}
              aria-pressed={searchOpen}
              onClick={() => {
                if (searchOpen && query) setQuery("");
                setSearchOpen((open) => !open);
              }}
              className={cn(
                "flex size-11 items-center justify-center rounded-[13px] border border-black/[0.07] bg-[#f7f6f1]/78 text-text-primary transition-colors hover:bg-[#fbfaf6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/12 laptop:size-10",
                searchOpen && "bg-[#fbfaf6]",
              )}
            >
              {searchOpen
                ? <X className="size-[19px]" strokeWidth={2.9} aria-hidden />
                : <Search className="size-[20px]" strokeWidth={3} aria-hidden />}
            </button>
            <NewMissionDialog onCreated={refetch} />
          </div>
        }
      />

      {searchOpen && (
        <SearchInput
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery("")}
          placeholder="Mission, agent, runtime ou modèle…"
          className="mb-4 w-full rounded-[13px] border border-black/[0.07] bg-[#f7f6f1]/78 laptop:max-w-lg"
        />
      )}

      <div className="scrollbar-none mb-6 flex gap-1 overflow-x-auto border-b border-black/[0.06]">
        {FILTERS.map((item) => {
          const active = filter === item.id;
          const count = item.id === "all"
            ? source.length
            : item.id === "attention"
              ? source.filter(missionRequiresAttention).length
              : item.id === "active"
                ? source.filter((mission) => isMissionActive(mission) && !missionRequiresAttention(mission)).length
                : source.filter((mission) => !isMissionActive(mission)).length;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSearchParams((current) => {
                  const next = new URLSearchParams(current);
                  if (item.id === "all") next.delete("filter");
                  else next.set("filter", item.id);
                  return next;
                }, { replace: true });
              }}
              className={cn(
                "relative flex min-h-11 shrink-0 items-center gap-2 px-3 text-[11px] font-bold text-text-muted transition-colors hover:text-text-primary",
                active && "text-text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-[2px] after:bg-text-primary",
              )}
            >
              <span>{item.label}</span>
              <span className="font-mono text-[9.5px] tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>

      {matching.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-6" />}
          title={source.length === 0 ? "Aucune mission" : "Aucun résultat"}
          description={source.length === 0
            ? "Créez un premier objectif. Son run apparaîtra ici dès la planification."
            : "Aucune mission ne correspond à cette vue."}
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.id} aria-labelledby={`mission-group-${group.id}`}>
              <div className="mb-2 flex items-center justify-between gap-4">
                <h2 id={`mission-group-${group.id}`} className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-secondary">
                  {group.label}
                </h2>
                <span className="font-mono text-[10px] font-semibold text-text-muted">{group.missions.length}</span>
              </div>
              <div className="divide-y divide-black/[0.055] border-y border-black/[0.065]">
                {group.missions.map((mission) => (
                  <OperatorMissionRow key={mission.id} mission={mission} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </motion.div>
  );
}
