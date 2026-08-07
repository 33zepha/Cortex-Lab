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
      <RadixDialog.Overlay className="fixed inset-0 z-dialog bg-black/60 animate-fade-in" />
      <RadixDialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-dialog w-[calc(100%-2rem)] max-w-md max-h-[calc(100vh-4rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto",
          "rounded-[24px] border border-white/60 bg-white/95 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-3xl",
          "animate-dialog-in focus:outline-none",
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] px-6 py-5">
          <div>
            <RadixDialog.Title className="text-base font-semibold tracking-tight text-text-primary">{title}</RadixDialog.Title>
            {description && (
              <RadixDialog.Description className="mt-1 text-xs font-medium text-text-muted">
                {description}
              </RadixDialog.Description>
            )}
          </div>
          <RadixDialog.Close asChild>
            <IconButton aria-label="Fermer" size="sm">
              <X className="size-4" />
            </IconButton>
          </RadixDialog.Close>
        </div>
        <div className="px-5 py-4">{children}</div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
