import { useState } from "react";
import { useLocation, useMatch } from "react-router-dom";
import { ROUTES } from "@/lib/routes";

export type OrbitTransitionType = "vertical" | "horizontal";

/**
 * Dérive la section Orbit active (Overview / Missions / System, profondeur "détail mission")
 * à partir de la route, et calcule la direction/le type de transition en comparant à l'état précédent :
 * changement de section → glissement vertical, changement de profondeur (liste ↔ détail) → horizontal.
 */
export function useOrbitNavigation() {
  const location = useLocation();
  const missionMatch = useMatch("/missions/:id");
  const id = missionMatch?.params?.id;

  let currentIndex = 0;
  let depth = 0;

  if (location.pathname === ROUTES.system) {
    currentIndex = 2;
    depth = 0;
  } else if (id) {
    currentIndex = 1;
    depth = 1;
  } else if (location.pathname.startsWith(ROUTES.missions)) {
    currentIndex = 1;
    depth = 0;
  } else {
    currentIndex = 0;
    depth = 0;
  }

  const [prev, setPrev] = useState({
    index: currentIndex,
    depth,
    direction: 1,
    type: "vertical" as OrbitTransitionType,
  });

  let direction = prev.direction;
  let type = prev.type;

  if (prev.index !== currentIndex || prev.depth !== depth) {
    if (prev.index !== currentIndex) {
      type = "vertical";
      direction = currentIndex > prev.index ? 1 : -1;
    } else {
      type = "horizontal";
      direction = depth > prev.depth ? 1 : -1;
    }
    setPrev({ index: currentIndex, depth, direction, type });
  }

  return { id, currentIndex, direction, type };
}
