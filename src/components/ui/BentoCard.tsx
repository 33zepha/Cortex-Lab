import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";

export type BentoCardProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  span?: string; // tailwind col-span utility passed by caller's grid
  padding?: "default" | "compact" | "none";
};

export function BentoCard({
  className,
  title,
  description,
  action,
  span,
  padding = "default",
  children,
  ...props
}: BentoCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden",
        padding === "default" && "p-7",
        padding === "compact" && "p-6",
        padding === "none" && "p-0",
        span,
        className,
      )}
      {...props}
    >
      {(title || description || action) && (
        <div className={cn(
          "mb-6 flex flex-row items-center justify-between gap-4",
          padding === "none" && "px-7 pt-7 pb-0 mb-5"
        )}>
          <div className="flex flex-col min-w-0">
            {title && (
              <h3 className="text-[15px] font-medium text-text-primary/90">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-[13.5px] text-text-muted mt-1">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn("flex-1 min-h-0", padding === "none" && "px-7 pb-7")}>{children}</div>
    </Card>
  );
}
