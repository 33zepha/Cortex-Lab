import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type DataRowProps = HTMLAttributes<HTMLDivElement> & {
  leading?: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  meta?: ReactNode[];
  trailing?: ReactNode;
  interactive?: boolean;
};

export function DataRow({
  className,
  leading,
  primary,
  secondary,
  meta,
  trailing,
  interactive = true,
  ...props
}: DataRowProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-[12px] border-b border-black/[0.04] px-4 py-3.5 last:border-b-0",
        "transition-all duration-[400ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        interactive && "hover:bg-white/40 hover:backdrop-blur-md hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_12px_rgba(0,0,0,0.02)] hover:translate-x-1 cursor-pointer",
        className,
      )}
      {...props}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-normal text-text-primary">{primary}</p>
        {secondary && <p className="mt-0.5 truncate text-xs text-text-muted">{secondary}</p>}
      </div>
      {meta && meta.length > 0 && (
        <div className="hidden shrink-0 items-center gap-6 text-sm text-text-secondary laptop:flex">
          {meta.map((m, i) => (
            <div key={i} className="w-20 text-right">
              {m}
            </div>
          ))}
        </div>
      )}
      {trailing && (
        <div className="shrink-0 opacity-0 transition-opacity duration-fast group-hover:opacity-100">
          {trailing}
        </div>
      )}
    </div>
  );
}
