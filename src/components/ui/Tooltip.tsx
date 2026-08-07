import * as RadixTooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/cn";

export const TooltipProvider = RadixTooltip.Provider;

export function Tooltip({
  content,
  children,
  side = "top",
}: {
  content: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <RadixTooltip.Root delayDuration={200}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={10}
          className={cn(
            "z-tooltip flex items-center justify-center rounded-full bg-white/70 backdrop-blur-2xl border border-white/60 px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-text-primary shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)]",
            "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in data-[state=delayed-open]:zoom-in-[0.97] data-[state=delayed-open]:slide-in-from-bottom-2",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-[0.97] data-[state=closed]:slide-out-to-bottom-1",
            "duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
          )}
        >
          {content}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
