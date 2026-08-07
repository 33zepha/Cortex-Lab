import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({
  className,
  title,
  description,
  children,
  ...props
}: RadixDialog.DialogContentProps & { title: string; description?: string }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-dialog bg-black/45 animate-fade-in" />
      <RadixDialog.Content
        className={cn(
          "fixed inset-0 z-dialog flex h-full w-full flex-col overflow-hidden bg-background focus:outline-none",
          "tablet:left-1/2 tablet:top-1/2 tablet:inset-auto tablet:h-auto tablet:w-[calc(100%-2rem)] tablet:max-w-md tablet:max-h-[calc(100vh-4rem)] tablet:-translate-x-1/2 tablet:-translate-y-1/2 tablet:overflow-y-auto",
          "tablet:rounded-[24px] tablet:border tablet:border-white/60 tablet:bg-white/95 tablet:shadow-[0_20px_50px_rgba(0,0,0,0.15)] tablet:backdrop-blur-3xl tablet:animate-dialog-in",
          className,
        )}
        {...props}
      >
        <div
          className="flex shrink-0 items-start justify-between gap-4 border-b border-black/[0.06] tablet:px-6 tablet:py-5"
          style={{
            paddingTop: "max(18px, env(safe-area-inset-top))",
            paddingLeft: "var(--mobile-gutter)",
            paddingRight: "var(--mobile-gutter)",
            paddingBottom: "16px",
          }}
        >
          <div className="min-w-0">
            <RadixDialog.Title className="text-[20px] font-bold tracking-[-0.03em] text-text-primary tablet:text-base tablet:font-semibold tablet:tracking-tight">{title}</RadixDialog.Title>
            {description && (
              <RadixDialog.Description className="mt-1.5 max-w-sm text-[12px] font-medium leading-relaxed text-text-muted tablet:mt-1 tablet:text-xs">
                {description}
              </RadixDialog.Description>
            )}
          </div>
          <RadixDialog.Close asChild>
            <IconButton aria-label="Fermer" size="sm" className="shrink-0">
              <X className="size-4" />
            </IconButton>
          </RadixDialog.Close>
        </div>
        <div
          className="min-h-0 flex-1 overscroll-contain overflow-y-auto tablet:px-5 tablet:py-4"
          style={{
            paddingLeft: "var(--mobile-gutter)",
            paddingRight: "var(--mobile-gutter)",
            paddingTop: "16px",
            paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
          }}
        >
          {children}
        </div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
