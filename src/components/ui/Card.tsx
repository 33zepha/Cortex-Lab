import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
};

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative rounded-[18px] border border-black/[0.055] bg-white/44 laptop:rounded-[24px] laptop:bg-white/48",
        "shadow-[0_1px_0_rgba(255,255,255,0.7),0_8px_30px_-26px_rgba(0,0,0,0.28)]",
        interactive &&
          "cursor-pointer transition-[background-color,border-color,box-shadow] duration-200 hover:border-black/[0.085] hover:bg-white/62 hover:shadow-[0_1px_0_rgba(255,255,255,0.8),0_10px_34px_-28px_rgba(0,0,0,0.32)] active:bg-white/70",
        className,
      )}
      {...props}
    />
  );
}
