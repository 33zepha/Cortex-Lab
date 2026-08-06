import { FlaskConical, GitCompare, FileText, ScrollText } from "lucide-react";
import type { Evidence, EvidenceKind } from "@/lib/types";
import { Badge } from "@/components/ui";
import { formatClock } from "@/lib/status";
import { DiffView } from "./DiffView";

const kindMeta: Record<EvidenceKind, { label: string; icon: React.ReactNode }> = {
  test: { label: "Test", icon: <FlaskConical className="size-3.5" /> },
  diff: { label: "Diff", icon: <GitCompare className="size-3.5" /> },
  artifact: { label: "Artefact", icon: <FileText className="size-3.5" /> },
  log: { label: "Log", icon: <ScrollText className="size-3.5" /> },
};

export function EvidenceDetail({ evidence }: { evidence: Evidence }) {
  const meta = kindMeta[evidence.kind];
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Badge tone="neutral" className="gap-1.5">
          {meta.icon}
          {meta.label}
        </Badge>
        <span className="font-mono text-xs text-text-muted">{formatClock(evidence.timestamp)}</span>
      </div>
      <p className="mb-3 truncate font-mono text-sm text-text-primary">{evidence.title}</p>
      {evidence.kind === "diff" ? (
        <DiffView content={evidence.content} />
      ) : (
        <pre className="scrollbar-thin overflow-x-auto rounded-md border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed text-text-secondary whitespace-pre-wrap">
          {evidence.content}
        </pre>
      )}
    </div>
  );
}
