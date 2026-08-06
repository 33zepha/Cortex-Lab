import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "ghost" | "subtle";
type Size = "sm" | "md";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  "aria-label": string;
};

const variantClasses: Record<Variant, string> = {
  ghost: "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
  subtle: "text-text-secondary bg-surface-2 hover:bg-surface-3 hover:text-text-primary",
};

const sizeClasses: Record<Size, string> = {
  sm: "size-7",
  md: "size-9",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md shrink-0",
          "transition-colors duration-fast ease-standard",
          "disabled:opacity-45 disabled:pointer-events-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";
