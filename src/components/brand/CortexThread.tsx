import { motion } from "framer-motion";

export type CortexThreadState =
  | "intent"
  | "structure"
  | "execution"
  | "verification"
  | "result";

export function CortexThread({
  state = "intent",
}: {
  state?: CortexThreadState;
}) {
  const activeIndex = [
    "intent",
    "structure",
    "execution",
    "verification",
    "result",
  ].indexOf(state);

  return (
    <div
      className="cortex-thread"
      aria-hidden="true"
      data-state={state}
    >
      <span className="cortex-thread__line" />
      <motion.span
        className="cortex-thread__signal"
        animate={{ left: `${activeIndex * 25}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="cortex-thread__nodes">
        {[
          "intent",
          "structure",
          "execution",
          "verification",
          "result",
        ].map((item, index) => (
          <span
            key={item}
            className={index <= activeIndex ? "is-active" : ""}
          />
        ))}
      </div>
    </div>
  );
}
