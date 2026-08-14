import {
  useRef,
  useState,
  type ComponentType,
  type RefObject,
  type SVGProps,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ClaudeMark } from "@/components/brand/ClaudeMark";
import { CortexLogo } from "@/components/brand/CortexLogo";
import { DeepSeekMark, GeminiMark, MistralMark } from "@/components/brand/ProviderMarks";
import { OpenAiMark } from "@/components/brand/OpenAiMark";
import { LandingAtmosphere } from "./LandingAtmosphere";
import "./landing-sections.css";

type ProviderMark = ComponentType<SVGProps<SVGSVGElement> & { title?: string }>;
type ScrollOffset = NonNullable<NonNullable<Parameters<typeof useScroll>[0]>["offset"]>;

type Capability = {
  index: string;
  verb: string;
  statement: string;
  note: string;
};

const capabilities: Capability[] = [
  {
    index: "01",
    verb: "Orchestrate",
    statement: "Turn one objective into coordinated intelligence.",
    note: "Structure the work before the work begins.",
  },
  {
    index: "02",
    verb: "Delegate",
    statement: "Put the right capability on every part of the problem.",
    note: "Models, agents and tools stay replaceable.",
  },
  {
    index: "03",
    verb: "Verify",
    statement: "Keep weak work from becoming finished work.",
    note: "Review, evidence and revision stay inside the system.",
  },
  {
    index: "04",
    verb: "Control",
    statement: "See what happened, why it happened, and what changed.",
    note: "Consequential work remains legible to the human in charge.",
  },
];

const providers: Array<{ name: string; Mark: ProviderMark }> = [
  { name: "Claude", Mark: ClaudeMark },
  { name: "Codex", Mark: OpenAiMark },
  { name: "DeepSeek", Mark: DeepSeekMark },
  { name: "Gemini", Mark: GeminiMark },
  { name: "Mistral", Mark: MistralMark },
];

const fragments = ["brief", "memory", "agent", "tool", "review", "source", "context", "handoff"];

function useSoftProgress(target: RefObject<HTMLElement | null>, offset: ScrollOffset) {
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset });

  return useSpring(scrollYProgress, {
    stiffness: reducedMotion ? 1000 : 88,
    damping: reducedMotion ? 1000 : 28,
    mass: reducedMotion ? 0.01 : 0.28,
    restDelta: 0.0005,
  });
}

function ManifestoSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const ghostX = useTransform(progress, [0, 1], ["10vw", "-18vw"]);
  const ghostOpacity = useTransform(progress, [0.05, 0.28, 0.78, 0.96], [0, 0.18, 0.18, 0]);
  const copyY = useTransform(progress, [0.08, 0.46, 0.86], [72, 0, -58]);
  const copyOpacity = useTransform(progress, [0.06, 0.24, 0.78, 0.95], [0, 1, 1, 0]);
  const asideX = useTransform(progress, [0.2, 0.56], [48, 0]);

  return (
    <section ref={ref} id="manifesto" className="landing-manifesto">
      <div className="landing-manifesto__sticky">
        <motion.div className="landing-manifesto__ghost" style={{ x: ghostX, opacity: ghostOpacity }} aria-hidden="true">
          COORDINATION
        </motion.div>

        <motion.div className="landing-manifesto__copy" style={{ y: copyY, opacity: copyOpacity }}>
          <span>The problem is not intelligence.</span>
          <h2>Intelligence is everywhere.<br /><em>Coordination is not.</em></h2>
        </motion.div>

        <motion.p className="landing-manifesto__aside" style={{ x: asideX, opacity: copyOpacity }}>
          More models did not remove the operational problem. They multiplied it.
        </motion.p>
      </div>
    </section>
  );
}

function FragmentationSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const debrisScale = useTransform(progress, [0.08, 0.5, 0.9], [0.88, 1.08, 0.94]);
  const debrisRotate = useTransform(progress, [0.08, 0.5, 0.92], [-3, 0, 2]);
  const debrisOpacity = useTransform(progress, [0.08, 0.24, 0.78, 0.94], [0, 1, 1, 0]);
  const copyY = useTransform(progress, [0.08, 0.46, 0.86], [60, 0, -40]);
  const copyOpacity = useTransform(progress, [0.08, 0.28, 0.76, 0.94], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="landing-fragmentation" aria-labelledby="fragmentation-title">
      <motion.div
        className="landing-fragmentation__debris"
        style={{ scale: debrisScale, rotate: debrisRotate, opacity: debrisOpacity }}
        aria-hidden="true"
      >
        {fragments.map((fragment, index) => (
          <span key={fragment} className={`landing-debris landing-debris--${index + 1}`}>
            {fragment}
          </span>
        ))}

        {providers.map(({ name, Mark }, index) => (
          <span key={name} className={`landing-provider-shard landing-provider-shard--${index + 1}`}>
            <Mark aria-hidden="true" />
          </span>
        ))}
      </motion.div>

      <motion.div className="landing-fragmentation__copy" style={{ y: copyY, opacity: copyOpacity }}>
        <span>Without an operating layer</span>
        <h2 id="fragmentation-title">Capability becomes fragmentation.</h2>
        <p>Different models. Different tools. Different memory. Different standards of completion.</p>
      </motion.div>
    </section>
  );
}

function ControlSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const wordScale = useTransform(progress, [0.08, 0.46, 0.84], [0.9, 1, 1.05]);
  const wordOpacity = useTransform(progress, [0.04, 0.3, 0.82, 0.96], [0, 0.11, 0.11, 0]);
  const markScale = useTransform(progress, [0.08, 0.44, 0.84], [0.7, 1, 0.9]);
  const copyY = useTransform(progress, [0.1, 0.48, 0.86], [52, 0, -32]);
  const copyOpacity = useTransform(progress, [0.08, 0.3, 0.8, 0.95], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="landing-control" aria-labelledby="control-title">
      <div className="landing-control__sticky">
        <motion.div className="landing-control__ghost" style={{ scale: wordScale, opacity: wordOpacity }} aria-hidden="true">
          CORTEX
        </motion.div>

        <motion.div className="landing-control__mark" style={{ scale: markScale, opacity: copyOpacity }} aria-hidden="true">
          <CortexLogo />
        </motion.div>

        <motion.div className="landing-control__copy" style={{ y: copyY, opacity: copyOpacity }}>
          <span>Cortex is the operating layer.</span>
          <h2 id="control-title">One place to direct the whole system.</h2>
          <p>Not another model. Not another chat. A layer for turning intelligence into controlled action.</p>
        </motion.div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, {
    stiffness: reducedMotion ? 1000 : 96,
    damping: reducedMotion ? 1000 : 30,
    mass: reducedMotion ? 0.01 : 0.22,
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const stageY = useTransform(progress, [0, 1], ["5vh", "-5vh"]);
  const ghostX = useTransform(progress, [0, 1], ["4vw", "-6vw"]);

  useMotionValueEvent(progress, "change", (latest) => {
    const next = Math.min(capabilities.length - 1, Math.max(0, Math.floor(latest * capabilities.length)));
    setActiveIndex((current) => (current === next ? current : next));
  });

  const active = capabilities[activeIndex] ?? capabilities[0]!;

  return (
    <section ref={ref} className="landing-capabilities" aria-labelledby="capabilities-title">
      <div className="landing-capabilities__sticky">
        <div className="landing-capabilities__eyebrow">What Cortex changes</div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active.verb}
            className="landing-capability-scene"
            initial={{ opacity: 0, y: 34, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -28, filter: "blur(8px)" }}
            transition={{ duration: reducedMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
            style={{ y: stageY }}
          >
            <motion.div className="landing-capability-scene__ghost" style={{ x: ghostX }} aria-hidden="true">
              {active.verb.toUpperCase()}
            </motion.div>

            <div className="landing-capability-scene__copy">
              <span>{active.index}</span>
              <h2 id={activeIndex === 0 ? "capabilities-title" : undefined}>{active.verb}</h2>
              <p>{active.statement}</p>
              <small>{active.note}</small>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="landing-capabilities__progress" aria-hidden="true">
          {capabilities.map((item, index) => (
            <span key={item.index} className={index === activeIndex ? "is-active" : ""} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ArchitectureSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const copyX = useTransform(progress, [0.08, 0.46, 0.86], [-42, 0, 28]);
  const copyOpacity = useTransform(progress, [0.06, 0.28, 0.8, 0.95], [0, 1, 1, 0]);
  const railX = useTransform(progress, [0.08, 0.88], ["7vw", "-8vw"]);
  const railOpacity = useTransform(progress, [0.14, 0.32, 0.82, 0.94], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="landing-architecture" aria-labelledby="architecture-title">
      <motion.div className="landing-architecture__copy" style={{ x: copyX, opacity: copyOpacity }}>
        <span>Model-agnostic by design</span>
        <h2 id="architecture-title">The intelligence can change.<br />The operating logic stays.</h2>
        <p>Cortex treats models as capabilities inside a larger system—not as the system itself.</p>
      </motion.div>

      <motion.div className="landing-architecture__rail" style={{ x: railX, opacity: railOpacity }} aria-label="Supported model providers">
        {providers.map(({ name, Mark }) => (
          <div key={name}>
            <Mark aria-hidden="true" />
            <span>{name}</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

function StatementSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const scale = useTransform(progress, [0.08, 0.48, 0.86], [0.92, 1, 1.04]);
  const opacity = useTransform(progress, [0.08, 0.3, 0.78, 0.94], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="landing-statement" aria-labelledby="statement-title">
      <motion.div className="landing-statement__copy" style={{ scale, opacity }}>
        <span>Coordination is the advantage.</span>
        <h2 id="statement-title">More intelligence.<br />Less chaos.</h2>
      </motion.div>
    </section>
  );
}

export function LandingSections() {
  return (
    <div className="landing-sections">
      <LandingAtmosphere />
      <div className="landing-sections__content">
        <ManifestoSection />
        <FragmentationSection />
        <ControlSection />
        <CapabilitiesSection />
        <ArchitectureSection />
        <StatementSection />
      </div>
    </div>
  );
}
