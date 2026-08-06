import type { SVGProps } from "react";

type CortexMarkProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

/** Monochrome Cortex brand mark. Inherits its color from currentColor. */
export function CortexMark({ title, ...props }: CortexMarkProps) {
  return (
    <svg
      viewBox="0 0 394 505"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...props}
    >
      <g
        stroke="currentColor"
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 243V147Q20 129 36 119L186 29Q205 18 224 29L345 97" />
        <path d="M49 399L173 474Q189 484 205 474L357 383Q374 373 374 353V263" />
        <path d="M198 135C143 135 105 194 105 265C105 333 140 361 197 361C253 361 291 329 291 265C291 195 254 135 198 135Z" />
      </g>
    </svg>
  );
}
