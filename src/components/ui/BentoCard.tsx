import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";

export type BentoCardProps = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title?: ReactNode;
  action?: ReactNode;
  span?: string; // tailwind col-span utility passed by caller's grid
  padding?: "default" | "compact";
};

export function BentoCard({
  className,
  eyebrow,
  title,
  action,
  span,
  padding = "default",
  children,
  ...props
}: BentoCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col",
        padding === "default" ? "px-4 py-5" : "px-4 py-4",
        span,
        className,
      )}
      {...props}
    >
      {(eyebrow || title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-label uppercase tracking-wide text-text-muted">{eyebrow}</p>
            )}
            {title && <h3 className="mt-1 text-md font-semibold text-text-primary truncate">{title}</h3>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="flex-1 min-h-0">{children}</div>
    </Card>
  );
}
