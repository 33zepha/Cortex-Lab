import type { Variants } from "framer-motion";

/** Version tableau (Framer Motion) du même easing que EASE_SPRING dans ui-classes.ts. */
export const EASE_SPRING_ARRAY = [0.2, 0.8, 0.2, 1] as const;

export const SPRING_BOUNCY = { type: "spring", stiffness: 350, damping: 25, mass: 0.8 } as const;

/** Petit fade + décalage vertical — titres, liens et boutons Orbit (identiques). */
export const FADE_UP_VARIANTS: Variants = {
  enter: { opacity: 0, y: 5 },
  center: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

/** Conteneur Orbit : glisse horizontalement (changement de section) ou verticalement (changement de profondeur). */
export const ORBIT_CONTAINER_VARIANTS: Variants = {
  enter: (custom: { direction: number; type: "vertical" | "horizontal" }) => {
    const isH = custom.type === "horizontal";
    return {
      opacity: 0,
      x: isH ? (custom.direction > 0 ? 30 : -30) : 0,
      y: !isH ? (custom.direction > 0 ? 10 : -10) : 0,
      scale: 0.96,
    };
  },
  center: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: {
      y: { type: "spring", bounce: 0.2, duration: 0.6 },
      x: { type: "spring", bounce: 0.2, duration: 0.6 },
      opacity: { type: "tween", duration: 0.2 },
      scale: { type: "spring", bounce: 0.2, duration: 0.6 },
      staggerChildren: 0.04,
    },
  },
  exit: (custom: { direction: number; type: "vertical" | "horizontal" }) => {
    const isH = custom.type === "horizontal";
    return {
      opacity: 0,
      x: isH ? (custom.direction > 0 ? -30 : 30) : 0,
      y: !isH ? (custom.direction > 0 ? -10 : 10) : 0,
      scale: 0.96,
      transition: {
        y: { type: "spring", bounce: 0.2, duration: 0.6 },
        x: { type: "spring", bounce: 0.2, duration: 0.6 },
        opacity: { type: "tween", duration: 0.15 },
        scale: { type: "spring", bounce: 0.2, duration: 0.6 },
      },
    };
  },
};

/** Grille d'écran (Overview) : déclenche les enfants en cascade. */
export const STAGGER_CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

export const STAGGER_ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: SPRING_BOUNCY },
};

/**
 * Dérive lente et continue des halos de fond des bentos (Core, Claude Code, OpenAI) — deux
 * phases légèrement désynchronisées (A/B) pour que les deux halos d'une même carte ne bougent
 * jamais en miroir parfait. Amplitude assez large pour se voir malgré le flou 64px, cycle assez
 * court pour rester perceptible sans devenir agité.
 */
export const GLOW_DRIFT_A = {
  x: [0, 26, -16, 0],
  y: [0, -20, 14, 0],
  scale: [1, 1.12, 0.93, 1],
};
export const GLOW_DRIFT_A_TRANSITION = { duration: 11, repeat: Infinity, ease: "easeInOut" } as const;

export const GLOW_DRIFT_B = {
  x: [0, -22, 16, 0],
  y: [0, 16, -12, 0],
  scale: [1, 0.92, 1.1, 1],
};
export const GLOW_DRIFT_B_TRANSITION = { duration: 13.5, repeat: Infinity, ease: "easeInOut" } as const;
