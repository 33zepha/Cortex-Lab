import { useEffect, useState, type MouseEvent } from "react";
import { ArrowUp, Mic, Paperclip, Plus } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CortexLogo } from "@/components/brand/CortexLogo";
import "./CortexHero.css";

const DEMO_PROMPTS = [
  "Compare the options and recommend the move with evidence.",
  "Research the market, then brief me before morning.",
  "Turn this objective into coordinated work.",
] as const;

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

function preventDemoAction(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

export function CortexHero() {
  const prefersReducedMotion = useReducedMotion() === true;
  const [promptIndex, setPromptIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setPromptIndex(0);
      setTypedText(DEMO_PROMPTS[0]);
      setIsDeleting(false);
      return;
    }

    const target = DEMO_PROMPTS[promptIndex] ?? DEMO_PROMPTS[0];
    const isComplete = typedText === target;
    const isEmpty = typedText.length === 0;
    const delay = isComplete
      ? 1500
      : isEmpty && isDeleting
        ? 280
        : isDeleting
          ? 36
          : 58;

    const timer = window.setTimeout(() => {
      if (!isDeleting) {
        const nextText = target.slice(0, typedText.length + 1);
        setTypedText(nextText);
        if (nextText === target) setIsDeleting(true);
        return;
      }

      const nextText = target.slice(0, Math.max(typedText.length - 1, 0));
      setTypedText(nextText);
      if (nextText.length === 0) {
        setIsDeleting(false);
        setPromptIndex((current) => (current + 1) % DEMO_PROMPTS.length);
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [isDeleting, prefersReducedMotion, promptIndex, typedText]);

  const hasMessage = typedText.length > 0;

  return (
    <section className="cortex-hero" aria-labelledby="cortex-hero-title">
      <motion.div
        className="cortex-hero__mark"
        initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.08, ease: EASE_OUT }}
      >
        <CortexLogo alt="Cortex" />
      </motion.div>

      <motion.section
        className="cortex-hero__content"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.9, delay: 0.18, ease: EASE_OUT }}
      >
        <h1 id="cortex-hero-title">
          <span className="cortex-hero__accent">Cortex</span> turns scattered intelligence into coordinated action.
        </h1>
        <p>
          Give one clear objective. Cortex coordinates the models, agents, and decisions that move it forward.
        </p>
        <a className="cortex-hero__cta" href="#access">
          Request private access
        </a>
      </motion.section>

      <motion.div
        className="cortex-hero__composer"
        role="group"
        aria-label="Cortex AI composer demonstration"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 150 }}
        animate={{ opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 1.35, delay: 0.26, ease: EASE_OUT }}
      >
        <div className="cortex-hero__composer-workspace">
          <p className="cortex-hero__composer-text" aria-label={typedText || "Cortex composer"}>
            <span aria-hidden="true">
              {typedText}
              <span className="cortex-hero__caret" aria-hidden="true" />
            </span>
          </p>
        </div>

        <div className="cortex-hero__composer-toolbar">
          <div className="cortex-hero__composer-tools">
            <button className="cortex-hero__tool" type="button" aria-label="Add a tool" onClick={preventDemoAction}>
              <Plus aria-hidden="true" size={19} strokeWidth={1.7} />
            </button>
            <button className="cortex-hero__tool" type="button" aria-label="Attach a file" onClick={preventDemoAction}>
              <Paperclip aria-hidden="true" size={18} strokeWidth={1.7} />
            </button>
          </div>

          <div className="cortex-hero__composer-actions">
            <button className="cortex-hero__tool" type="button" aria-label="Use microphone" onClick={preventDemoAction}>
              <Mic aria-hidden="true" size={18} strokeWidth={1.7} />
            </button>
            <AnimatePresence initial={false} mode="popLayout">
              {hasMessage ? (
                <motion.button
                  className="cortex-hero__send"
                  type="button"
                  aria-label="Send message"
                  onClick={preventDemoAction}
                  initial={{ opacity: 0, scale: 0.72, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.72, y: 4 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT }}
                >
                  <ArrowUp aria-hidden="true" size={17} strokeWidth={2.2} />
                </motion.button>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
