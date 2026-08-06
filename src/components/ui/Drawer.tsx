import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";

export const Drawer = RadixDialog.Root;
export const DrawerTrigger = RadixDialog.Trigger;

export type DrawerSide = "right" | "bottom";

const sideClasses: Record<DrawerSide, string> = {
  right: "right-0 top-0 h-full w-full max-w-sm animate-drawer-in border-l",
  bottom: "bottom-0 left-0 w-full max-h-[85vh] animate-sheet-in border-t rounded-t-xl",
};

export function DrawerContent({
  className,
  side = "right",
  title,
  children,
  ...props
}: RadixDialog.DialogContentProps & { side?: DrawerSide; title: string }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-dialog bg-black/60 animate-fade-in" />
      <RadixDialog.Content
        className={cn(
          "fixed z-dialog flex flex-col border-border-strong bg-surface-1 shadow-lg",
          sideClasses[side],
          className,
        )}
        {...props}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-4">
          <RadixDialog.Title className="text-md font-semibold text-text-primary">{title}</RadixDialog.Title>
          <RadixDialog.Close asChild>
            <IconButton aria-label="Fermer" size="sm">
              <X className="size-4" />
            </IconButton>
          </RadixDialog.Close>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4">{children}</div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
