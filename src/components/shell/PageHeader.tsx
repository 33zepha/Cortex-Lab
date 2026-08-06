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
    <div className="relative mb-8 mt-2">
      <div className="flex items-center justify-between">
        <div className="relative">
          {/* Watermark icon — z-0, derrière le titre */}
          {Icon && (
            <div className="pointer-events-none absolute inset-0 z-0 flex items-center select-none" aria-hidden>
              <Icon className="size-16 -rotate-6 opacity-[0.05]" />
            </div>
          )}
          <h1 className="relative z-10 text-xl font-semibold tracking-tight text-text-primary">{title}</h1>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {description && <p className="text-body-text text-text-secondary mt-1.5">{description}</p>}
    </div>
  );
}
