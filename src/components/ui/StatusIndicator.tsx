import { cn } from "@/lib/cn";
import { toneClasses, type Tone } from "@/lib/status";

export type StatusIndicatorProps = {
  tone: Tone;
  label: string;
  pulse?: boolean;
  className?: string;
};

export function StatusIndicator({ tone, label, pulse, className }: StatusIndicatorProps) {
  const t = toneClasses[tone];
  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <span className="relative flex size-2">
        {pulse && <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", t.dot)} />}
        <span className={cn("relative inline-flex size-2 rounded-full", t.dot)} />
      </span>
      <span className="text-text-secondary">{label}</span>
    </div>
  );
}
