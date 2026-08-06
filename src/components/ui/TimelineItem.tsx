import { useState, type ReactNode } from "react";
import { ChevronDown, FileEdit, FileText, FlaskConical, GitBranch, AlertCircle, CircleCheck, ListTree } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TimelineEventType } from "@/lib/types";
import { formatClock } from "@/lib/status";

const iconByType: Record<TimelineEventType, ReactNode> = {
  plan: <ListTree className="size-3.5" />,
  step: <GitBranch className="size-3.5" />,
  file_read: <FileText className="size-3.5" />,
  file_modified: <FileEdit className="size-3.5" />,
  test: <FlaskConical className="size-3.5" />,
  decision: <AlertCircle className="size-3.5" />,
  closure: <CircleCheck className="size-3.5" />,
  error: <AlertCircle className="size-3.5" />,
};

const toneByType: Record<TimelineEventType, string> = {
  plan: "bg-surface-3 text-text-secondary",
  step: "bg-accent-indigo-muted text-accent-indigo",
  file_read: "bg-surface-3 text-text-secondary",
  file_modified: "bg-info-muted text-info",
  test: "bg-success-muted text-success",
  decision: "bg-warning-muted text-warning",
  closure: "bg-success-muted text-success",
  error: "bg-error-muted text-error",
};

export type TimelineItemProps = {
  type: TimelineEventType;
  title: string;
  detail?: string;
  ts: number;
  children?: string[];
  isLast?: boolean;
  onOpenEvidence?: () => void;
  hasEvidence?: boolean;
};

export function TimelineItem({
  type,
  title,
  detail,
  ts,
  children,
  isLast,
  onOpenEvidence,
  hasEvidence,
}: TimelineItemProps) {
  const [open, setOpen] = useState(false);
  const expandable = hasEvidence || (children && children.length > 0);

  return (
    <div className="relative flex gap-3 pb-6 last:pb-0">
      {!isLast && <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" aria-hidden />}
      <div
        className={cn(
          "z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-border",
          toneByType[type],
        )}
      >
        {iconByType[type]}
      </div>
      <div className="min-w-0 flex-1 pt-1">
        <button
          type="button"
          onClick={() => {
            if (hasEvidence && onOpenEvidence) onOpenEvidence();
            else if (children?.length) setOpen((v) => !v);
          }}
          disabled={!expandable}
          className={cn(
            "flex w-full items-start justify-between gap-3 rounded-md -mx-2 px-2 py-1 text-left",
            "transition-colors duration-fast ease-standard",
            expandable && "hover:bg-surface-2 cursor-pointer",
            !expandable && "cursor-default",
          )}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary">{title}</p>
            {detail && <p className="mt-0.5 text-sm text-text-secondary">{detail}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-0.5">
            <span className="font-mono text-xs text-text-muted">{formatClock(ts)}</span>
            {expandable && (
              <ChevronDown
                className={cn("size-3.5 text-text-muted transition-transform duration-fast", open && "rotate-180")}
              />
            )}
          </div>
        </button>
        {open && children && children.length > 0 && (
          <ul className="mt-2 space-y-1 border-l border-border pl-3 animate-fade-in">
            {children.map((c) => (
              <li key={c} className="text-sm text-text-secondary">
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
