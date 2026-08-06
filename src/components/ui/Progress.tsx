import { cn } from "@/lib/cn";

export type ProgressProps = {
  value: number; // 0-100
  className?: string;
  tone?: "indigo" | "success" | "warning" | "error";
};

const toneBg: Record<NonNullable<ProgressProps["tone"]>, string> = {
  indigo: "bg-accent-indigo",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
};

export function Progress({ value, className, tone = "indigo" }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-standard ease-standard", toneBg[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
