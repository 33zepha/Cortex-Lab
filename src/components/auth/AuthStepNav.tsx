import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckIcon } from "@heroicons/react/24/solid";
import { LiquidButton, LiquidSurface } from "@/components/ui/LiquidSurface";
import { SPRING_BOUNCY } from "@/lib/animations";
import { cn } from "@/lib/cn";

type StepId = "account" | "workspace" | "runtime";

const ITEMS: Array<{ id: StepId; label: string }> = [
  { id: "account", label: "Account" },
  { id: "workspace", label: "Workspace" },
  { id: "runtime", label: "Connect" },
];

export function AuthStepNav({
  step,
  furthestStep,
  onSelect,
}: {
  step: StepId;
  furthestStep: number;
  onSelect: (step: StepId) => void;
}) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const currentIndex = ITEMS.findIndex((item) => item.id === step);
  const transition = reduceMotion ? { duration: 0 } : SPRING_BOUNCY;

  return (
    <div className="auth-step-nav">
      <AnimatePresence initial={false} mode="popLayout">
        {!open ? (
          <LiquidButton
            key="trigger"
            layoutId="auth-step-nav-surface"
            variant="wing"
            className="auth-step-trigger"
            type="button"
            transition={transition}
            onClick={() => setOpen(true)}
            aria-label={`Onboarding step ${currentIndex + 1} of ${ITEMS.length}: ${ITEMS[currentIndex]?.label}`}
          >
            <span>{ITEMS[currentIndex]?.label}</span>
            <span className="auth-step-trigger__count">0{currentIndex + 1}/0{ITEMS.length}</span>
          </LiquidButton>
        ) : (
          <LiquidSurface
            key="menu"
            layoutId="auth-step-nav-surface"
            variant="popover"
            className="auth-step-menu"
            transition={transition}
          >
            <div className="auth-step-menu__rail">
              {ITEMS.map((item, index) => {
                const enabled = index <= furthestStep;
                const active = item.id === step;
                const complete = index < currentIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!enabled}
                    className={cn("auth-step-menu__item", active && "is-active")}
                    onClick={() => {
                      onSelect(item.id);
                      setOpen(false);
                    }}
                  >
                    <span className="auth-step-menu__index">{complete ? <CheckIcon aria-hidden /> : `0${index + 1}`}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </LiquidSurface>
        )}
      </AnimatePresence>
    </div>
  );
}
