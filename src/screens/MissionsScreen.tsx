import { useMemo, useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import { Inbox } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { SearchInput, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { emptyMissions } from "@/fixtures/missions";
import { MissionKanbanCard } from "./missions/MissionKanbanCard";
import { NewMissionDialog } from "./missions/NewMissionDialog";
import { EASE_SPRING_ARRAY } from "@/lib/animations";
import { useMissions } from "@/lib/useMissions";
import type { Mission, MissionStatus } from "@/lib/types";

const KANBAN_COLUMNS: { id: MissionStatus; title: string; color: string }[] = [
  { id: "running", title: "En cours", color: "text-info" },
  { id: "needs_review", title: "Action requise", color: "text-warning" },
  { id: "completed", title: "Complétées", color: "text-success" },
  { id: "failed", title: "Échouées", color: "text-error" },
  { id: "cancelled", title: "Annulées", color: "text-text-muted" },
];

export function MissionsScreen() {
  const [searchParams] = useSearchParams();
  const demoState = searchParams.get("state");
  const [query, setQuery] = useState("");
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

  const { missions, loading, error, refetch } = useMissions();
  const source = demoState === "empty" ? emptyMissions : (missions ?? []);

  const filtered = useMemo(() => {
    return source.filter((m) => m.objective.toLowerCase().includes(query.toLowerCase()));
  }, [source, query]);

  const missionsByStatus = useMemo(() => {
    const grouped: Record<MissionStatus, Mission[]> = {
      running: [],
      needs_review: [],
      completed: [],
      failed: [],
      cancelled: [],
    };
    filtered.forEach(m => {
      if (grouped[m.status]) grouped[m.status].push(m);
    });
    return grouped;
  }, [filtered]);

  if (demoState === "loading" || (loading && demoState !== "empty")) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_SPRING_ARRAY }}
        className="flex h-full flex-col"
      >
        <PageHeader title="Missions" icon={RocketLaunchIcon} />
        <Skeleton className="mb-8 h-9 w-80" />
        <div className="flex flex-1 gap-6 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex h-full w-[320px] shrink-0 flex-col gap-4">
              <Skeleton className="h-6 w-32 rounded-md" />
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-[120px] w-full rounded-2xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (error && demoState !== "empty") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_SPRING_ARRAY }}
      >
        <PageHeader title="Missions" icon={RocketLaunchIcon} />
        <ErrorState
          title="Impossible de joindre l'API Cortex"
          description={error}
          onRetry={() => window.location.reload()}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_SPRING_ARRAY }}
      className="flex h-full flex-col"
    >
      <PageHeader
        title="Missions"
        icon={RocketLaunchIcon} 
        action={
          <div className="flex w-full flex-col gap-2 tablet:w-auto tablet:flex-row tablet:items-center tablet:gap-3">
            <SearchInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery("")}
              placeholder="Filtrer par objectif…"
              className="w-full tablet:w-64 rounded-[16px] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
            />
            <NewMissionDialog onCreated={refetch} />
          </div>
        }
      />

      {filtered.length === 0 ? (
        <div className="mt-4 overflow-hidden rounded-[32px] border border-white/60 bg-white/40 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
          <EmptyState
            icon={<Inbox className="size-6" />}
            title={source.length === 0 ? "Aucune mission" : "Aucun résultat"}
            description={
              source.length === 0
                ? "Hermes n'a encore lancé aucune mission. Elles apparaîtront ici dès leur création."
                : "Aucune mission ne correspond à cette recherche."
            }
          />
        </div>
      ) : (
        <div 
          ref={scrollRef}
          className="flex flex-1 gap-6 overflow-x-auto pb-6 kanban-scrollbar"
        >
          {KANBAN_COLUMNS.map((col) => (
            <div key={col.id} className="flex h-full w-[320px] shrink-0 flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-secondary">
                  <span className={`size-1.5 rounded-full bg-current ${col.color} shadow-[0_0_8px_currentColor]`} />
                  {col.title}
                </h2>
                <span className="rounded-[8px] bg-white/50 px-2 py-0.5 text-[11px] font-bold text-text-primary border border-white/60 shadow-sm">
                  {missionsByStatus[col.id].length}
                </span>
              </div>
              
              <div className="flex flex-col gap-3 overflow-y-auto scrollbar-none pb-4">
                {missionsByStatus[col.id].map((mission) => (
                  <MissionKanbanCard key={mission.id} mission={mission} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
