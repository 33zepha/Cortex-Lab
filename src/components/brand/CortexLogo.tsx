import type { ImgHTMLAttributes } from "react";
import cortexMark from "@/assets/cortex-hero-mark.png";

type CortexLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src">;

/** The approved Cortex symbol, kept as one source of truth for the landing. */
export function CortexLogo({ alt = "", ...props }: CortexLogoProps) {
  return <img src={cortexMark} alt={alt} draggable={false} {...props} />;
}
