import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckIcon } from "@heroicons/react/24/solid";
import { LiquidButton, LiquidSurface } from "@/components/ui/LiquidSurface";
import { cn } from "@/lib/cn";

type StepId = "account" | "workspace" | "runtime";

const ITEMS: Array<{ id: StepId; label: string }> = [
  { id: "account", label: "Account" },
  { id: "workspace", label: "Workspace" },
  { id: "runtime", label: "Connect" },
];
const NAV_SPRING = { type: "spring" as const, stiffness: 430, damping: 32, mass: .72 };

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
  const transition = reduceMotion ? { duration: 0 } : NAV_SPRING;

  return (
    <div className="auth-step-nav">
      <AnimatePresence initial={false} mode="popLayout">
        {!open ? (
          <LiquidButton
            key="trigger"
            layoutId="auth-step-nav-surface"
            variant="wing"
            sheen={false}
            className="auth-step-trigger"
            type="button"
            transition={transition}
            whileTap={reduceMotion ? undefined : { scale: .97 }}
            onClick={() => setOpen(true)}
            aria-label={`Onboarding step ${currentIndex + 1} of ${ITEMS.length}: ${ITEMS[currentIndex]?.label}`}
          >
            <span>{ITEMS[currentIndex]?.label}</span>
            <span className="auth-step-trigger__count" aria-hidden>
              <span className="auth-step-trigger__number-window">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={currentIndex}
                    className="auth-step-trigger__number"
                    initial={reduceMotion ? false : { y: 7, opacity: 0, filter: "blur(2px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={reduceMotion ? undefined : { y: -7, opacity: 0, filter: "blur(2px)" }}
                    transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34, mass: .6 }}
                  >
                    0{currentIndex + 1}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span>/0{ITEMS.length}</span>
            </span>
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
