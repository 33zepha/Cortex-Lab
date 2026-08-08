import * as RadixTabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

export const Tabs = RadixTabs.Root;

export function TabsList({ className, ...props }: RadixTabs.TabsListProps) {
  return (
    <RadixTabs.List
      className={cn(
        "flex items-center gap-0 overflow-x-auto scrollbar-none border-b border-border",
        "[mask-image:linear-gradient(to_right,black_94%,transparent_100%)] laptop:[mask-image:none]",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: RadixTabs.TabsTriggerProps) {
  return (
    <RadixTabs.Trigger
      className={cn(
        "relative min-h-10 shrink-0 px-3 py-2.5 text-[11px] font-[650] text-text-secondary",
        "transition-colors duration-fast ease-standard",
        "hover:text-text-primary",
        "data-[state=active]:text-text-primary",
        "after:absolute after:inset-x-3 after:-bottom-px after:h-[2px] after:bg-transparent",
        "data-[state=active]:after:bg-accent-indigo",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: RadixTabs.TabsContentProps) {
  return (
    <RadixTabs.Content
      className={cn("focus-visible:outline-none animate-fade-in", className)}
      {...props}
    />
  );
}
