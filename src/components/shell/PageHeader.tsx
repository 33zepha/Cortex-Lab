import type { ComponentType, ReactNode } from "react";
import { CortexMark } from "@/components/brand/CortexMark";

export function PageHeader({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <header className="relative mt-0">
      <div className="mb-2.5 flex items-center gap-2 text-text-muted" aria-hidden>
        <CortexMark className="h-[13px] w-[10px] shrink-0" />
        <span className="text-[8px] font-[680] uppercase tracking-[0.17em]">Cortex</span>
        <span className="text-[9px] font-mono font-medium text-text-muted/55">/</span>
        <span className="text-[8px] font-[620] uppercase tracking-[0.13em] text-text-secondary">{title}</span>
        {Icon && (
          <>
            <span className="h-3 w-px bg-black/[0.08]" />
            <Icon className="size-[11px] opacity-45" />
          </>
        )}
      </div>

      <div className="flex items-start justify-between gap-4 laptop:flex-wrap laptop:gap-x-6 laptop:gap-y-3">
        <div className="min-w-0">
          <h1 className="truncate text-[30px] font-[680] leading-none tracking-[-0.047em] text-text-primary laptop:text-[35px]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-[11.5px] font-medium leading-[1.45] text-text-secondary laptop:text-[12px]">
              {description}
            </p>
          )}
        </div>
        {action && <div className="relative z-10 shrink-0 pt-0.5">{action}</div>}
      </div>
    </header>
  );
}
