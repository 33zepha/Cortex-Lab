import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export const Dropdown = RadixDropdown.Root;
export const DropdownTrigger = RadixDropdown.Trigger;

export function DropdownContent({ className, sideOffset = 6, ...props }: RadixDropdown.DropdownMenuContentProps) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        sideOffset={sideOffset}
        className={cn(
          "z-overlay min-w-[10rem] rounded-lg border border-border-strong bg-surface-2 p-1.5 shadow-lg",
          "animate-slide-up",
          className,
        )}
        {...props}
      />
    </RadixDropdown.Portal>
  );
}

export function DropdownItem({
  className,
  checked,
  children,
  ...props
}: RadixDropdown.DropdownMenuItemProps & { checked?: boolean }) {
  return (
    <RadixDropdown.Item
      className={cn(
        "flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm text-text-secondary outline-none",
        "transition-colors duration-fast ease-standard",
        "data-[highlighted]:bg-surface-3 data-[highlighted]:text-text-primary",
        className,
      )}
      {...props}
    >
      {children}
      {checked && <Check className="size-3.5 text-accent-indigo" aria-hidden />}
    </RadixDropdown.Item>
  );
}

export const DropdownSeparator = () => <RadixDropdown.Separator className="my-1.5 h-px bg-border" />;
