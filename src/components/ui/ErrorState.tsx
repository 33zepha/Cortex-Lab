import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export type ErrorStateProps = {
  title: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
};

export function ErrorState({ title, description, onRetry, className, compact }: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center text-center",
        compact ? "py-6" : "py-12",
        className,
      )}
    >
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-error-muted text-error">
        <AlertTriangle className="size-5" aria-hidden />
      </div>
      <p className="text-sm font-medium text-text-primary">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-text-muted">{description}</p>}
      {onRetry && (
        <Button size="sm" variant="secondary" className="mt-4" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}
