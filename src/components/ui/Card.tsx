import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
};

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface-1 shadow-sm",
        interactive &&
          "transition-colors duration-fast ease-standard hover:border-border-strong hover:bg-surface-2 cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}
