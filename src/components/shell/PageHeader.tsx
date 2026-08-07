import type { ComponentType, ReactNode } from "react";

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
    <div className="relative mb-5 mt-0 laptop:mb-8 laptop:mt-2">
      <div className="flex items-center justify-between gap-3 laptop:flex-wrap laptop:gap-x-4 laptop:gap-y-3">
        <div className="relative min-w-0">
          {/* Le watermark appartient au langage desktop ; sur mobile il consomme de l'espace sans aider la lecture. */}
          {Icon && (
            <div className="pointer-events-none absolute inset-0 z-0 hidden items-center select-none laptop:flex" aria-hidden>
              <Icon className="size-16 -rotate-6 opacity-[0.05]" />
            </div>
          )}
          <h1 className="relative z-10 truncate text-[28px] font-bold leading-none tracking-[-0.045em] text-text-primary laptop:text-xl laptop:font-semibold laptop:leading-normal laptop:tracking-tight">
            {title}
          </h1>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {description && (
        <p className="mt-1.5 max-w-2xl text-[13px] font-medium leading-relaxed text-text-secondary laptop:text-body-text">
          {description}
        </p>
      )}
    </div>
  );
}
