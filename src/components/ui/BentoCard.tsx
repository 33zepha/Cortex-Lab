import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";
import { LIQUID_GLASS_ACTIVE } from "@/lib/ui-classes";

export type BentoCardProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  span?: string; // tailwind col-span utility passed by caller's grid
  padding?: "default" | "compact" | "none";
};

export function BentoCard({
  className,
  title,
  icon,
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
      {(title || description || action || icon) && (
        <div className={cn(
          "flex flex-row items-start justify-between gap-4 relative z-10",
          padding === "default" && "mb-4",
          padding === "compact" && "mb-3",
          padding === "none" && "px-7 pt-7 mb-4"
        )}>
          <div className="flex flex-col min-w-0">
            <div className="flex flex-row items-center gap-3">
              {icon && (
                <div className={cn("flex shrink-0 items-center justify-center size-10 rounded-[12px]", LIQUID_GLASS_ACTIVE)}>
                  {icon}
                </div>
              )}
              {title && (
                <h3 className="text-[15px] font-medium text-text-primary/90">
                  {title}
                </h3>
              )}
            </div>
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
