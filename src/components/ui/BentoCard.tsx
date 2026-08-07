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
        padding === "default" && "p-[18px] laptop:p-7",
        padding === "compact" && "p-4 laptop:p-6",
        padding === "none" && "p-0",
        span,
        className,
      )}
      {...props}
    >
      {(title || description || action || icon) && (
        <div
          className={cn(
            "relative z-10 flex flex-row items-start justify-between gap-3 laptop:gap-4",
            padding === "default" && "mb-3 laptop:mb-4",
            padding === "compact" && "mb-2.5 laptop:mb-3",
            padding === "none" && "mb-3 px-[18px] pt-[18px] laptop:mb-4 laptop:px-7 laptop:pt-7",
          )}
        >
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-row items-center gap-2.5 laptop:gap-3">
              {icon && (
                <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-[11px] laptop:size-10 laptop:rounded-[12px]", LIQUID_GLASS_ACTIVE)}>
                  {icon}
                </div>
              )}
              {title && <h3 className="text-[14px] font-bold tracking-[-0.01em] text-text-primary/90 laptop:text-[15px] laptop:font-medium">{title}</h3>}
            </div>
            {description && <p className="mt-1 text-[12px] font-medium leading-relaxed text-text-muted laptop:text-[13.5px]">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn("min-h-0 flex-1", padding === "none" && "px-[18px] pb-[18px] laptop:px-7 laptop:pb-7")}>{children}</div>
    </Card>
  );
}
