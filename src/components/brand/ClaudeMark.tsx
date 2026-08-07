import type { SVGProps } from "react";

type ClaudeMarkProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

/** Monochrome Claude (Anthropic) sunburst mark. Inherits its color from currentColor. */
export function ClaudeMark({ title, ...props }: ClaudeMarkProps) {
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...props}
    >
      {petals.map((deg) => (
        <path key={deg} d="M50 6 Q56 6 56 14 L52.5 44 Q50 50 47.5 44 L44 14 Q44 6 50 6 Z" transform={`rotate(${deg} 50 50)`} />
      ))}
    </svg>
  );
}
