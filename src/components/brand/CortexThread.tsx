import "./CortexThread.css";
import type { CSSProperties } from "react";

const THREAD_STAGES = [
  { key: "intent", label: "Intent" },
  { key: "structure", label: "Structure" },
  { key: "execution", label: "Execution" },
  { key: "verification", label: "Verification" },
  { key: "result", label: "Result" },
] as const;

export type CortexThreadState = (typeof THREAD_STAGES)[number]["key"];

export function CortexThread({
  state = "result",
  className,
}: {
  state?: CortexThreadState;
  className?: string;
}) {
  const activeIndex = THREAD_STAGES.findIndex((stage) => stage.key === state);
  const threadStyle = {
    "--thread-progress": activeIndex / (THREAD_STAGES.length - 1),
    "--thread-position": `${activeIndex * 25}%`,
  } as CSSProperties;

  return (
    <div
      className={className ? `cortex-thread-primitive ${className}` : "cortex-thread-primitive"}
      role="img"
      aria-label="Cortex Thread: intent, structure, execution, verification, result"
      data-state={state}
      style={threadStyle}
    >
      <div className="cortex-thread-primitive__rail" aria-hidden="true">
        <span className="cortex-thread-primitive__track" />
        <span className="cortex-thread-primitive__trace" />
        <span className="cortex-thread-primitive__signal" />
        <div className="cortex-thread-primitive__stages">
          {THREAD_STAGES.map((stage, index) => (
            <span
              className={index <= activeIndex ? "cortex-thread-primitive__stage is-active" : "cortex-thread-primitive__stage"}
              data-stage={stage.key}
              key={stage.key}
            >
              <span className="cortex-thread-primitive__node" />
              <span className="cortex-thread-primitive__label">{stage.label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
