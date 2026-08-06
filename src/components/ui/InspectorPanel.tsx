import type { ReactNode } from "react";
import { PanelRightClose } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";
import { EmptyState } from "./EmptyState";

export type InspectorPanelProps = {
  title?: string;
  onClose?: () => void;
  children?: ReactNode;
  className?: string;
};

export function InspectorPanel({ title, onClose, children, className }: InspectorPanelProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col border-l border-border bg-surface-1",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">{title ?? "Inspection"}</h3>
        {onClose && (
          <IconButton aria-label="Fermer le panneau" size="sm" onClick={onClose}>
            <PanelRightClose className="size-4" />
          </IconButton>
        )}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {children ?? (
          <EmptyState
            icon={<PanelRightClose className="size-5" />}
            title="Rien à inspecter"
            description="Sélectionnez un événement, un fichier ou une preuve pour voir son détail ici."
            compact
          />
        )}
      </div>
    </div>
  );
}
