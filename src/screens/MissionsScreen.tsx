import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Inbox } from "lucide-react";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge, EmptyState, SearchInput, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import { allMissions, emptyMissions } from "@/fixtures/missions";
import type { Mission, MissionFilter } from "@/lib/types";
import { missionStatusConfig, formatDuration } from "@/lib/status";

const filters: { value: MissionFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "needs_review", label: "Needs review" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

function matchesFilter(m: Mission, filter: MissionFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "active":
      return m.status === "running";
    case "needs_review":
      return m.status === "needs_review";
    case "completed":
      return m.status === "completed";
    case "failed":
      return m.status === "failed";
  }
}

const columns = "tablet:grid-cols-[1fr_112px_96px_84px_84px]";

/**
 * ?state=empty|loading force un état de démo pour la capture visuelle.
 * Purement un outil de prototype — n'existera plus une fois l'API branchée.
 */
export function MissionsScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const demoState = searchParams.get("state");
  const filter = (searchParams.get("filter") as MissionFilter | null) ?? "all";
  const [query, setQuery] = useState("");

  function setFilter(next: MissionFilter) {
    const params = new URLSearchParams(searchParams);
    if (next === "all") params.delete("filter");
    else params.set("filter", next);
    setSearchParams(params, { replace: true });
  }

  const source = demoState === "empty" ? emptyMissions : allMissions;

  const filtered = useMemo(() => {
    return source
      .filter((m) => matchesFilter(m, filter))
      .filter((m) => m.objective.toLowerCase().includes(query.toLowerCase()));
  }, [source, filter, query]);

  if (demoState === "loading") {
    return (
      <div>
        <PageHeader title="Missions" icon={RocketLaunchIcon} />
        <Skeleton className="mb-4 h-9 w-80" />
        <div className="space-y-px overflow-hidden rounded-lg border border-border bg-surface-1 p-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3">
              <Skeleton className="h-6 w-24 shrink-0 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="hidden h-4 w-16 shrink-0 tablet:block" />
              <Skeleton className="hidden h-4 w-16 shrink-0 tablet:block" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Missions" icon={RocketLaunchIcon} />

      <div className="mb-4 flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "h-7 rounded-sm px-3 text-filter transition-colors duration-fast ease-standard",
                filter === f.value
                  ? "bg-accent-indigo-muted text-accent-indigo"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery("")}
          placeholder="Filtrer par objectif…"
          className="tablet:w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface-1">
          <EmptyState
            icon={<Inbox className="size-5" />}
            title={source.length === 0 ? "Aucune mission" : "Aucun résultat"}
            description={
              source.length === 0
                ? "Hermes n'a encore lancé aucune mission. Elles apparaîtront ici dès leur création."
                : "Aucune mission ne correspond à ce filtre ou cette recherche."
            }
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface-1">
          {/* En-tête de colonnes — tablet+ uniquement */}
          <div
            className={cn(
              "hidden items-center gap-3 border-b border-border px-4 py-2 text-xs font-medium text-text-muted tablet:grid",
              columns,
            )}
          >
            <span>Objectif</span>
            <span>Statut</span>
            <span className="text-right">Tests</span>
            <span className="text-right">Fichiers</span>
            <span className="text-right">Durée</span>
          </div>

          {filtered.map((m) => {
            const s = missionStatusConfig[m.status];
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => navigate(ROUTES.missionDetail(m.id))}
                className={cn(
                  "flex w-full flex-col gap-2 border-b border-border px-4 py-3 text-left last:border-b-0",
                  "transition-colors duration-fast ease-standard hover:bg-surface-2",
                  "tablet:grid tablet:h-[52px] tablet:items-center tablet:gap-3 tablet:py-0",
                  columns,
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-body-text font-medium text-text-primary">{m.objective}</p>
                  <p className="truncate text-label text-text-muted tablet:hidden">
                    {m.step} · <span className="font-mono">{m.model}</span>
                  </p>
                </div>
                <Badge tone={s.tone} dot pulse={s.pulse} className="w-fit tablet:w-[100px] tablet:justify-center">
                  {s.label}
                </Badge>
                <span className="text-body-text text-text-secondary tablet:text-right">
                  {m.tests.total > 0 ? `${m.tests.passed}/${m.tests.total}` : "—"}
                </span>
                <span className="text-body-text text-text-secondary tablet:text-right">{m.filesModified.length}</span>
                <span className="font-mono text-label text-text-secondary tablet:text-right">
                  {formatDuration(m.durationMs)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
