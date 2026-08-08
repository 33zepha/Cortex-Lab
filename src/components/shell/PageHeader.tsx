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
    <div className="relative mb-5 mt-0 laptop:mb-8 laptop:mt-0">
      <div className="mb-2.5 flex items-center gap-2 text-text-muted" aria-hidden>
        <CortexMark className="h-[14px] w-[11px] shrink-0" />
        <span className="text-[8.5px] font-bold uppercase tracking-[0.15em]">Cortex</span>
        {Icon && (
          <>
            <span className="h-3 w-px bg-black/[0.08]" />
            <Icon className="size-[11px] opacity-45" />
          </>
        )}
      </div>

      <div className="flex items-start justify-between gap-4 laptop:flex-wrap laptop:gap-x-5 laptop:gap-y-3">
        <div className="min-w-0">
          <h1 className="truncate text-[29px] font-extrabold leading-[0.98] tracking-[-0.052em] text-text-primary laptop:text-[31px] laptop:leading-[0.98]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-[12px] font-medium leading-relaxed text-text-secondary laptop:text-[13px]">
              {description}
            </p>
          )}
        </div>
        {action && <div className="relative z-10 shrink-0">{action}</div>}
      </div>
    </div>
  );
}
