import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";

export type BentoCardProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  span?: string;
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
        padding === "default" && "p-4 laptop:p-6",
        padding === "compact" && "p-3.5 laptop:p-5",
        padding === "none" && "p-0",
        span,
        className,
      )}
      {...props}
    >
      {(title || description || action || icon) && (
        <div
          className={cn(
            "relative z-10 flex items-start justify-between gap-3",
            padding === "default" && "mb-3",
            padding === "compact" && "mb-2.5",
            padding === "none" && "mb-3 px-4 pt-4 laptop:px-6 laptop:pt-6",
          )}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              {icon && <div className="shrink-0 text-text-primary [&_svg]:stroke-[2.8]">{icon}</div>}
              {title && (
                <h3 className="text-[13px] font-bold tracking-[-0.015em] text-text-primary laptop:text-[14px]">
                  {title}
                </h3>
              )}
            </div>
            {description && (
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-text-muted laptop:text-[12px]">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn("min-h-0 flex-1", padding === "none" && "px-4 pb-4 laptop:px-6 laptop:pb-6")}>{children}</div>
    </Card>
  );
}
