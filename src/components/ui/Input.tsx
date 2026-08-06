import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-md border border-border bg-surface-2 px-3 text-sm text-text-primary placeholder:text-text-muted",
        "transition-colors duration-fast ease-standard",
        "hover:border-border-strong",
        "focus-visible:outline-none focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-accent-indigo-muted",
        "disabled:opacity-45 disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
