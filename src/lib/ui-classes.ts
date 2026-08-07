/** Easing partagé pour l'ensemble des micro-interactions "liquid glass" (dock, liens Orbit). */
export const EASE_SPRING = "cubic-bezier(0.2,0.8,0.2,1)";

/** Transition standard utilisée par les boutons du dock et les liens Orbit. */
export const TRANSITION_SPRING = `transition-all duration-[400ms] ease-[${EASE_SPRING}]`;

/** Effet "verre liquide" au survol — dock (Nexus, MobileNav) + équivalent tactile discret. */
export const LIQUID_GLASS_HOVER =
  "hover:bg-white/40 hover:backdrop-blur-md hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_12px_rgba(0,0,0,0.06)] active:bg-white/50 active:backdrop-blur-md active:shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_8px_rgba(0,0,0,0.05)]";

/** État actif — dock (Nexus, MobileNav). */
export const LIQUID_GLASS_ACTIVE =
  "bg-white/50 text-text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_8px_rgba(0,0,0,0.05)]";
