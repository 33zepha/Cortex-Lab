import type { ReactNode } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import {
  Sparkles,
  AlertCircle,
  ListTree,
  FileText,
  FlaskConical,
  GitCompare,
  AlertTriangle,
  Server,
  Cpu,
  ScrollText,
  HardDrive,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatMissionTitle } from "@/lib/mission-naming";
import { allMissions, missionActive, findMission } from "@/fixtures/missions";
import type { MissionFilter } from "@/lib/types";
import { ROUTES } from "@/lib/routes";

/**
 * Panneau contextuel accolé à IconRail. Son contenu dépend de la route active —
 * navigation secondaire propre à chaque page, jamais un aperçu de données dupliqué.
 * Conçu comme un conteneur générique : le cas /missions/:id montre déjà qu'une page
 * peut y afficher un contenu plus riche (ici, les sections de la mission) sans that
 * IconRail ou les autres pages n'aient à changer.
 */
export function Sidecar() {
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();

  if (id) return <MissionDetailSidecar id={id} />;
  if (location.pathname === ROUTES.home) return <OverviewSidecar />;
  if (location.pathname.startsWith("/missions")) return <MissionsSidecar />;
  if (location.pathname === "/system") return <SystemSidecar />;
  return null;
}

function SidecarShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="hidden laptop:flex laptop:w-56 shrink-0 flex-col border-r border-border bg-surface-1">
      <div className="flex h-14 shrink-0 items-center px-4">
        <h2 className="text-sm font-semibold tracking-tight text-text-primary">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4">{children}</div>
    </aside>
  );
}

function SidecarLink({
  to,
  active,
  icon,
  children,
}: {
  to: string;
  active: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium",
        "transition-colors duration-fast ease-standard",
        active
          ? "bg-accent-indigo-muted text-accent-indigo"
          : "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{children}</span>
    </Link>
  );
}

function OverviewSidecar() {
  const needsReview = allMissions.filter((m) => m.decisionRequired);

  return (
    <SidecarShell title="Overview">
      <div className="space-y-0.5">
        <SidecarLink to={`/missions/${missionActive.id}`} active={false} icon={<Sparkles className="size-4" />}>
          Mission active
        </SidecarLink>
        {needsReview.length > 0 && (
          <SidecarLink to="/missions?filter=needs_review" active={false} icon={<AlertCircle className="size-4" />}>
            Décisions requises ({needsReview.length})
          </SidecarLink>
        )}
      </div>
      {needsReview.length === 0 && (
        <p className="px-2.5 pt-2 text-xs text-text-muted">Rien d'autre à signaler pour l'instant.</p>
      )}
    </SidecarShell>
  );
}

const missionFilters: { value: MissionFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "needs_review", label: "Needs review" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

function MissionsSidecar() {
  const [searchParams] = useSearchParams();
  const active = (searchParams.get("filter") as MissionFilter | null) ?? "all";

  return (
    <SidecarShell title="Missions">
      <div className="space-y-0.5">
        {missionFilters.map((f) => (
          <SidecarLink
            key={f.value}
            to={`/missions?filter=${f.value}`}
            active={active === f.value}
            icon={<span className={cn("size-1.5 rounded-full", active === f.value ? "bg-accent-indigo" : "bg-text-muted")} />}
          >
            {f.label}
          </SidecarLink>
        ))}
      </div>
    </SidecarShell>
  );
}

const missionTabs = [
  { value: "timeline", label: "Timeline", icon: <ListTree className="size-4" /> },
  { value: "files", label: "Fichiers", icon: <FileText className="size-4" /> },
  { value: "tests", label: "Tests", icon: <FlaskConical className="size-4" /> },
  { value: "evidence", label: "Preuves", icon: <GitCompare className="size-4" /> },
  { value: "patch", label: "Patch", icon: <GitCompare className="size-4" /> },
  { value: "errors", label: "Erreurs", icon: <AlertTriangle className="size-4" /> },
];

function MissionDetailSidecar({ id }: { id: string }) {
  const [searchParams] = useSearchParams();
  const mission = findMission(id);
  const activeTab = searchParams.get("tab") ?? "timeline";

  return (
    <SidecarShell title={mission ? formatMissionTitle(mission.objective, { preset: "sidecar" }) : "Mission"}>
      <div className="space-y-0.5">
        {missionTabs.map((t) => (
          <SidecarLink key={t.value} to={`/missions/${id}?tab=${t.value}`} active={activeTab === t.value} icon={t.icon}>
            {t.label}
          </SidecarLink>
        ))}
      </div>
    </SidecarShell>
  );
}

const systemSections = [
  { id: "cortex-server", label: "Cortex server", icon: <Server className="size-4" /> },
  { id: "claude-code", label: "Claude Code", icon: <Cpu className="size-4" /> },
  { id: "ledger", label: "Ledger", icon: <ScrollText className="size-4" /> },
  { id: "storage", label: "Stockage", icon: <HardDrive className="size-4" /> },
  { id: "sse", label: "SSE", icon: <Radio className="size-4" /> },
  { id: "errors", label: "Erreurs récentes", icon: <AlertTriangle className="size-4" /> },
];

function SystemSidecar() {
  return (
    <SidecarShell title="System">
      <div className="space-y-0.5">
        {systemSections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-text-secondary",
              "transition-colors duration-fast ease-standard hover:bg-surface-2 hover:text-text-primary",
            )}
          >
            <span className="shrink-0">{s.icon}</span>
            <span className="truncate">{s.label}</span>
          </a>
        ))}
      </div>
    </SidecarShell>
  );
}
