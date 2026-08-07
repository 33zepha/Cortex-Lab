import { useMemo, useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import { Inbox, Search, X } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { SearchInput, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { emptyMissions } from "@/fixtures/missions";
import { MissionKanbanCard } from "./missions/MissionKanbanCard";
import { NewMissionDialog } from "./missions/NewMissionDialog";
import { EASE_SPRING_ARRAY } from "@/lib/animations";
import { useMissions } from "@/lib/useMissions";
import { cn } from "@/lib/cn";
import { LIQUID_GLASS_ACTIVE, LIQUID_GLASS_HOVER, TRANSITION_SPRING } from "@/lib/ui-classes";
import type { Mission, MissionStatus } from "@/lib/types";

const KANBAN_COLUMNS: { id: MissionStatus; title: string; color: string }[] = [
  { id: "running", title: "En cours", color: "text-info" },
  { id: "needs_review", title: "Action requise", color: "text-warning" },
  { id: "completed", title: "Complétées", color: "text-success" },
  { id: "failed", title: "Échouées", color: "text-error" },
  { id: "cancelled", title: "Annulées", color: "text-text-muted" },
];

type MobileFilter = "all" | MissionStatus;

const MOBILE_FILTERS: { id: MobileFilter; title: string }[] = [
  { id: "all", title: "Toutes" },
  { id: "running", title: "En cours" },
  { id: "needs_review", title: "Revue" },
  { id: "completed", title: "Finies" },
  { id: "failed", title: "Échecs" },
  { id: "cancelled", title: "Annulées" },
];

export function MissionsScreen() {
  const [searchParams] = useSearchParams();
  const demoState = searchParams.get("state");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileFilter, setMobileFilter] = useState<MobileFilter>("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      el.classList.add("is-scrolling");
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => el.classList.remove("is-scrolling"), 600);
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

  const { missions, loading, error, refetch } = useMissions();
  const source = demoState === "empty" ? emptyMissions : (missions ?? []);

  const filtered = useMemo(
    () =>
      source.filter((m) => {
        const q = query.toLowerCase().trim();
        if (!q) return true;
        return (
          (m.title && m.title.toLowerCase().includes(q)) ||
          m.objective.toLowerCase().includes(q) ||
          m.model.toLowerCase().includes(q)
        );
      }),
    [source, query],
  );

  const missionsByStatus = useMemo(() => {
    const grouped: Record<MissionStatus, Mission[]> = {
      running: [],
      needs_review: [],
      completed: [],
      failed: [],
      cancelled: [],
    };
    filtered.forEach((m) => {
      if (grouped[m.status]) grouped[m.status].push(m);
    });
    return grouped;
  }, [filtered]);

  const mobileMissions = useMemo(
    () => (mobileFilter === "all" ? filtered : missionsByStatus[mobileFilter]),
    [filtered, mobileFilter, missionsByStatus],
  );

  if (demoState === "loading" || (loading && demoState !== "empty")) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_SPRING_ARRAY }} className="flex h-full flex-col">
        <PageHeader title="Missions" icon={RocketLaunchIcon} />
        <div className="space-y-2.5 laptop:hidden">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[96px] w-full rounded-[20px]" />)}
        </div>
        <div className="hidden flex-1 gap-6 overflow-hidden laptop:flex">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex h-full w-[320px] shrink-0 flex-col gap-4">
              <Skeleton className="h-6 w-32 rounded-md" />
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-[120px] w-full rounded-2xl" />)}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (error && demoState !== "empty") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_SPRING_ARRAY }}>
        <PageHeader title="Missions" icon={RocketLaunchIcon} />
        <ErrorState title="Impossible de joindre l'API Cortex" description={error} onRetry={() => window.location.reload()} />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_SPRING_ARRAY }} className="flex h-full flex-col">
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
                setSearchOpen((v) => !v);
              }}
              className={cn(
                "flex size-11 items-center justify-center rounded-[14px] border border-white/70 bg-white/55 text-text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_5px_18px_-10px_rgba(0,0,0,0.3)] backdrop-blur-2xl transition-[transform,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:bg-white/78 active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/20 laptop:size-10",
                searchOpen && "bg-white/88 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_7px_22px_-12px_rgba(0,0,0,0.34)]",
              )}
            >
              {searchOpen ? <X className="size-[20px]" strokeWidth={3.1} /> : <Search className="size-[21px]" strokeWidth={3.25} />}
            </button>
            <NewMissionDialog onCreated={refetch} />
          </div>
        }
      />

      <AnimatePresence initial={false}>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <SearchInput
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery("")}
              placeholder="Rechercher dans les missions…"
              className="mb-3 w-full rounded-[14px] border border-white/70 bg-white/54 shadow-[0_5px_18px_-11px_rgba(0,0,0,0.2)] backdrop-blur-2xl laptop:mb-5 laptop:max-w-md"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 ? (
        <div className="mt-1 overflow-hidden rounded-[24px] border border-white/60 bg-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-3xl tablet:mt-4 tablet:rounded-[32px]">
          <EmptyState
            icon={<Inbox className="size-6" />}
            title={source.length === 0 ? "Aucune mission" : "Aucun résultat"}
            description={source.length === 0 ? "Hermes n'a encore lancé aucune mission. Elles apparaîtront ici dès leur création." : "Aucune mission ne correspond à cette recherche."}
          />
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col laptop:hidden">
            <div className="scrollbar-none mb-3 flex shrink-0 gap-1.5 overflow-x-auto pb-1">
              {MOBILE_FILTERS.map((filter) => {
                const count = filter.id === "all" ? filtered.length : missionsByStatus[filter.id].length;
                const active = mobileFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setMobileFilter(filter.id)}
                    className={cn(
                      "flex min-h-10 shrink-0 items-center gap-2 rounded-[12px] border border-white/55 bg-white/18 px-3 text-[11px] font-bold tracking-[-0.01em] text-text-secondary",
                      TRANSITION_SPRING,
                      LIQUID_GLASS_HOVER,
                      "active:scale-[0.96]",
                      active && LIQUID_GLASS_ACTIVE,
                      active && "text-text-primary",
                    )}
                  >
                    <span>{filter.title}</span>
                    <span className="text-[10px] font-bold tabular-nums text-text-muted">{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-2.5 pb-2">
              {mobileMissions.map((mission) => <MissionKanbanCard key={mission.id} mission={mission} />)}
            </div>
          </div>

          <div ref={scrollRef} className="hidden flex-1 gap-6 overflow-x-auto pb-6 kanban-scrollbar laptop:flex">
            {KANBAN_COLUMNS.map((col) => (
              <div key={col.id} className="flex h-full w-[320px] shrink-0 flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-secondary">
                    <span className={`size-1.5 rounded-full bg-current ${col.color} shadow-[0_0_8px_currentColor]`} />
                    {col.title}
                  </h2>
                  <span className="rounded-[8px] border border-white/60 bg-white/50 px-2 py-0.5 text-[11px] font-bold text-text-primary shadow-sm">{missionsByStatus[col.id].length}</span>
                </div>
                <div className="scrollbar-none flex flex-col gap-3 overflow-y-auto pb-4">
                  {missionsByStatus[col.id].map((mission) => <MissionKanbanCard key={mission.id} mission={mission} />)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
