import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
};

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative rounded-[32px] border border-white/60 bg-white/60 backdrop-blur-3xl",
        "shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)]",
        interactive &&
          "transition-all duration-[400ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:scale-[1.01] hover:bg-white/80 hover:shadow-[0_1px_2px_rgba(24,35,54,0.04),0_16px_40px_rgba(42,62,90,0.07)] cursor-pointer active:scale-[0.98]",
        className,
      )}
      {...props}
    />
  );
}
