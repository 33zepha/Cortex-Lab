import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
};

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative rounded-[24px] border border-white/90 bg-white/[0.72] backdrop-blur-[18px] backdrop-saturate-[1.15]",
        "shadow-[0_1px_2px_rgba(24,35,54,0.03),0_12px_35px_rgba(42,62,90,0.045)]",
        interactive &&
          "transition-all duration-[400ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:scale-[1.01] hover:bg-white/80 hover:shadow-[0_1px_2px_rgba(24,35,54,0.04),0_16px_40px_rgba(42,62,90,0.07)] cursor-pointer active:scale-[0.98]",
        className,
      )}
      {...props}
    />
  );
}
