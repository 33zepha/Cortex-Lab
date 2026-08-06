import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={[
        "sticky top-0 z-sticky -mx-4 -mt-6 mb-6 flex items-start justify-between gap-4",
        "border-b border-border bg-surface-1/90 px-4 py-4 backdrop-blur-sm",
        "tablet:-mx-6 tablet:px-6 laptop:-mx-8 laptop:px-8",
      ].join(" ")}
    >
      <div>
        <h1 className="text-page-title text-text-primary">{title}</h1>
        {description && <p className="mt-1 text-body-text text-text-secondary">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
