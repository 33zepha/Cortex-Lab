import * as RadixPopover from "@radix-ui/react-popover";
import { cn } from "@/lib/cn";

export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverAnchor = RadixPopover.Anchor;

export function PopoverContent({ className, sideOffset = 8, ...props }: RadixPopover.PopoverContentProps) {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        sideOffset={sideOffset}
        className={cn(
          "z-overlay w-64 rounded-lg border border-border-strong bg-surface-2 p-1.5 shadow-lg",
          "animate-slide-up",
          className,
        )}
        {...props}
      />
    </RadixPopover.Portal>
  );
}
