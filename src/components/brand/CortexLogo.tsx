import type { CSSProperties, HTMLAttributes } from "react";
import cortexMark from "@/assets/cortex-mark.svg";

type CortexLogoProps = Omit<HTMLAttributes<HTMLSpanElement>, "color"> & {
  alt?: string;
};

/**
 * The approved Cortex symbol, kept as one vector source while allowing each
 * surface to use the same mark in a controlled color treatment.
 */
export function CortexLogo({ alt = "", className, style, ...props }: CortexLogoProps) {
  const logoStyle = {
    "--cortex-logo-image": `url(${cortexMark})`,
    ...style,
  } as CSSProperties;

  return (
    <span
      className={className ? `cortex-logo ${className}` : "cortex-logo"}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      style={logoStyle}
      {...props}
    />
  );
}
