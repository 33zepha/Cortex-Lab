import { useRef, type RefObject } from "react";
import {
  motion,
  type MotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import heroPixelCloud1920 from "@/assets/cortex-hero-pixel-cloud-1920.webp";
import { CortexLogo } from "@/components/brand/CortexLogo";
import "./landing-sections.css";

type ScrollOffset = NonNullable<NonNullable<Parameters<typeof useScroll>[0]>["offset"]>;

function useSoftProgress(target: RefObject<HTMLElement | null>, offset: ScrollOffset) {
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset });
  const progress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 26,
    mass: 0.42,
  });

  return reducedMotion ? scrollYProgress : progress;
}

function PixelMaterial({
  className,
  alt = "",
}: {
  className: string;
  alt?: string;
}) {
  return (
    <div className={"cortex-material " + className} aria-hidden={alt ? undefined : true}>
      <img src={heroPixelCloud1920} alt={alt} draggable={false} />
    </div>
  );
}

function SceneIndex({ children }: { children: string }) {
  return <span className="cortex-scene-index">{children}</span>;
}

function CortexThread({
  className = "",
  progress,
  travel = false,
}: {
  className?: string;
  progress: MotionValue<number>;
  travel?: boolean;
}) {
  const restingX = useTransform(progress, [0, 0.5, 1], ["-4%", "0%", "6%"]);
  const restingY = useTransform(progress, [0, 0.5, 1], [18, 0, -16]);
  const restingScale = useTransform(progress, [0, 0.5, 1], [0.9, 1.04, 0.96]);
  const travelingX = useTransform(progress, [0, 0.24, 0.5, 0.76, 1], ["-18%", "12%", "-4%", "18%", "-8%"]);
  const travelingY = useTransform(progress, [0, 0.24, 0.5, 0.76, 1], [42, -24, 34, -10, 24]);
  const travelingScale = useTransform(progress, [0, 0.24, 0.5, 0.76, 1], [0.84, 1.02, 0.9, 1.06, 0.88]);
  const x = travel ? travelingX : restingX;
  const y = travel ? travelingY : restingY;
  const scale = travel ? travelingScale : restingScale;
  const opacity = useTransform(progress, [0.04, 0.22, 0.82, 0.98], [0, 0.92, 0.92, 0.12]);

  return (
    <motion.div
      className={"cortex-thread " + className}
      style={{ opacity, x, y, scale }}
      aria-hidden="true"
    >
      <span className="cortex-thread__pixel cortex-thread__pixel--a" />
      <span className="cortex-thread__pixel cortex-thread__pixel--b" />
      <span className="cortex-thread__pixel cortex-thread__pixel--c" />
      <span className="cortex-thread__pixel cortex-thread__pixel--d" />
      <span className="cortex-thread__pixel cortex-thread__pixel--e" />
    </motion.div>
  );
}

function CoordinationScene() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const copyY = useTransform(progress, [0.06, 0.5, 0.94], [28, 0, -18]);
  const copyOpacity = useTransform(progress, [0.04, 0.2, 0.82, 0.98], [0, 1, 1, 0.42]);
  const materialOpacity = useTransform(progress, [0.04, 0.32, 0.76, 0.98], [0.08, 0.42, 0.25, 0.02]);
  const materialX = useTransform(progress, [0, 1], ["-5%", "5%"]);
  const materialScale = useTransform(progress, [0, 0.5, 1], [1.04, 1, 1.08]);

  return (
    <section ref={ref} id="manifesto" className="cortex-scene cortex-coordination" aria-labelledby="coordination-title">
      <motion.div
        className="cortex-coordination__material"
        style={{ opacity: materialOpacity, x: materialX, scale: materialScale }}
      >
        <PixelMaterial className="cortex-material--cloud" />
      </motion.div>

      <CortexThread className="cortex-thread--coordination" progress={progress} />

      <motion.div className="cortex-coordination__copy" style={{ opacity: copyOpacity, y: copyY }}>
        <SceneIndex>01 / Coordination</SceneIndex>
        <h2 id="coordination-title">
          Intelligence is everywhere.
          <br />
          <em>Coordination is not.</em>
        </h2>
        <p>
          Cortex gives every capability the same direction, the same context, and a
          clear return path.
        </p>
      </motion.div>

      <motion.p
        className="cortex-coordination__note"
        style={{ opacity: useTransform(progress, [0.08, 0.3, 0.8, 0.96], [0, 1, 1, 0.35]) }}
      >
        The missing layer is direction.
      </motion.p>
    </section>
  );
}

function OperatingWord({
  label,
  index,
  progress,
}: {
  label: string;
  index: number;
  progress: MotionValue<number>;
}) {
  const start = 0.08 + index * 0.31;
  const end = start + 0.14;
  const fade = 0.025;
  const range = [start - fade, start, end, end + fade];
  const opacity = useTransform(progress, range, [0, 0.94, 0.94, 0]);
  const y = useTransform(progress, range, [16, 0, 0, -16]);

  return (
    <motion.span className="cortex-operating__word" style={{ opacity, y }}>
      {label}
    </motion.span>
  );
}

function OperatingScene() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const markOpacity = useTransform(progress, [0.05, 0.23, 0.78, 0.95], [0, 1, 1, 0.3]);
  const markY = useTransform(progress, [0.05, 0.5, 0.95], [20, 0, -12]);
  const copyOpacity = useTransform(progress, [0.08, 0.25, 0.78, 0.96], [0, 1, 1, 0.25]);
  const copyY = useTransform(progress, [0.08, 0.5, 0.94], [24, 0, -14]);

  return (
    <section ref={ref} className="cortex-scene cortex-operating" aria-labelledby="operating-title">
      <motion.div className="cortex-operating__copy" style={{ opacity: copyOpacity, y: copyY }}>
        <SceneIndex>02 / Operating logic</SceneIndex>
        <h2 id="operating-title">
          One place to direct
          <br />
          <em>the whole system.</em>
        </h2>
        <p>
          The intelligence can change. The operating logic stays legible, so the
          person responsible never loses the thread.
        </p>
      </motion.div>

      <CortexThread className="cortex-thread--operating" progress={progress} />

      <motion.div className="cortex-operating__mark" style={{ opacity: markOpacity, y: markY }}>
        <CortexLogo />
      </motion.div>

      <div className="cortex-operating__words" aria-label="Context, judgment, action">
        <OperatingWord label="Context" index={0} progress={progress} />
        <OperatingWord label="Judgment" index={1} progress={progress} />
        <OperatingWord label="Action" index={2} progress={progress} />
      </div>

      <motion.p
        className="cortex-operating__note"
        style={{ opacity: useTransform(progress, [0.12, 0.32, 0.78, 0.94], [0, 1, 1, 0.3]) }}
      >
        One objective. One operating logic.
      </motion.p>
    </section>
  );
}

const sequenceSteps = [
  {
    index: "01",
    label: "Objective",
    title: "Choose the outcome.",
    copy: "A clear objective gives every action something to answer to.",
  },
  {
    index: "02",
    label: "Structure",
    title: "Give it a route.",
    copy: "Cortex turns intent into a sequence the system can carry.",
  },
  {
    index: "03",
    label: "Execution",
    title: "Let capability move.",
    copy: "The right model or tool enters only when the work calls for it.",
  },
  {
    index: "04",
    label: "Proof",
    title: "Return with a reason.",
    copy: "The result comes back with the evidence needed to trust it.",
  },
] as const;

function SequenceStep({
  step,
  index,
  progress,
}: {
  step: (typeof sequenceSteps)[number];
  index: number;
  progress: MotionValue<number>;
}) {
  const segment = 1 / sequenceSteps.length;
  const start = index * segment + segment * 0.19;
  const end = (index + 1) * segment - segment * 0.19;
  const fade = segment * 0.08;
  const range = [Math.max(0, start - fade), start, end, Math.min(1, end + fade)];
  const opacity = useTransform(progress, range, [0, 1, 1, 0]);
  const y = useTransform(progress, range, [20, 0, 0, -20]);

  return (
    <motion.div className="cortex-sequence__step" style={{ opacity, y }}>
      <span className="cortex-sequence__step-index">{step.index} / {step.label}</span>
      <h3>{step.title}</h3>
      <p>{step.copy}</p>
    </motion.div>
  );
}

function SequenceScene() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const markOpacity = useTransform(progress, [0.06, 0.18, 0.84, 0.96], [0, 0.7, 0.7, 0]);
  const markRotate = useTransform(progress, [0, 1], [-5, 5]);

  return (
    <section ref={ref} className="cortex-sequence" aria-labelledby="sequence-title">
      <div className="cortex-sequence__sticky">
        <CortexThread className="cortex-thread--sequence" progress={progress} travel />

        <div className="cortex-sequence__intro">
          <SceneIndex>03 / The sequence</SceneIndex>
          <h2 id="sequence-title">
            A directed workflow
            <br />
            <em>leaves a trace.</em>
          </h2>
        </div>

        <motion.div className="cortex-sequence__artifact" style={{ opacity: markOpacity, rotate: markRotate }}>
          <CortexLogo />
          <span>CORTEX / OPERATING RECORD</span>
        </motion.div>

        <div className="cortex-sequence__story">
          {sequenceSteps.map((step, index) => (
            <SequenceStep key={step.index} step={step} index={index} progress={progress} />
          ))}
        </div>

        <p className="cortex-sequence__nudge">Scroll through the record</p>
      </div>
    </section>
  );
}

function ProofScene() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const copyOpacity = useTransform(progress, [0.06, 0.22, 0.8, 0.96], [0, 1, 1, 0.28]);
  const copyY = useTransform(progress, [0.06, 0.5, 0.94], [28, 0, -16]);
  const fragmentScale = useTransform(progress, [0.08, 0.45, 0.92], [0.94, 1, 1.02]);
  const fragmentOpacity = useTransform(progress, [0.1, 0.28, 0.8, 0.95], [0.2, 1, 1, 0.3]);

  return (
    <section ref={ref} className="cortex-scene cortex-proof" aria-labelledby="proof-title">
      <CortexThread className="cortex-thread--proof" progress={progress} />

      <motion.div className="cortex-proof__copy" style={{ opacity: copyOpacity, y: copyY }}>
        <SceneIndex>04 / Proof</SceneIndex>
        <h2 id="proof-title">
          The work should
          <br />
          <em>come back with a reason.</em>
        </h2>
        <p>
          Evidence is part of the action, not a report assembled after the fact.
        </p>
      </motion.div>

      <motion.div className="cortex-proof__fragment" style={{ opacity: fragmentOpacity, scale: fragmentScale }}>
        <span className="cortex-proof__record">CORTEX / RECORD 001</span>
        <p>Objective → coordinated action → proof.</p>
        <span className="cortex-proof__stamp">RETURN WITH THE REASON</span>
      </motion.div>
    </section>
  );
}

function QuietClosingScene() {
  return (
    <section className="cortex-scene cortex-quiet" aria-labelledby="quiet-title">
      <div className="cortex-quiet__copy">
        <SceneIndex>05 / The advantage</SceneIndex>
        <h2 id="quiet-title">
          More intelligence.
          <br />
          <em>Less chaos.</em>
        </h2>
        <p>Coordination is the advantage that compounds.</p>
      </div>
    </section>
  );
}

export function LandingSections() {
  return (
    <div className="cortex-landing">
      <CoordinationScene />
      <OperatingScene />
      <SequenceScene />
      <ProofScene />
      <QuietClosingScene />
    </div>
  );
}
