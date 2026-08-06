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
        "group flex items-center gap-3 rounded-md border-b border-border px-3 py-3 last:border-b-0",
        "transition-colors duration-fast ease-standard",
        interactive && "hover:bg-surface-2 cursor-pointer",
        className,
      )}
      {...props}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{primary}</p>
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
