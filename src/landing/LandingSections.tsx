import { useRef, type ComponentType, type RefObject, type SVGProps } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ClaudeMark } from "@/components/brand/ClaudeMark";
import { CortexLogo } from "@/components/brand/CortexLogo";
import { DeepSeekMark, GeminiMark, MistralMark } from "@/components/brand/ProviderMarks";
import { OpenAiMark } from "@/components/brand/OpenAiMark";
import "./landing-sections.css";

type ProviderMark = ComponentType<SVGProps<SVGSVGElement> & { title?: string }>;

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
    note: "Review, evidence and revision are part of the system.",
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

function useSoftProgress(target: RefObject<HTMLElement | null>, offset: [string, string]) {
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset });
  return useSpring(scrollYProgress, {
    stiffness: reducedMotion ? 1000 : 92,
    damping: reducedMotion ? 1000 : 30,
    mass: reducedMotion ? 0.01 : 0.24,
    restDelta: 0.0005,
  });
}

function ManifestoSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const lineOneY = useTransform(progress, [0.08, 0.42, 0.82], [48, 0, -36]);
  const lineTwoY = useTransform(progress, [0.16, 0.48, 0.86], [58, 0, -28]);
  const lineOneOpacity = useTransform(progress, [0.05, 0.24, 0.78, 0.94], [0, 1, 1, 0]);
  const lineTwoOpacity = useTransform(progress, [0.12, 0.31, 0.8, 0.96], [0, 1, 1, 0]);
  const accentWidth = useTransform(progress, [0.2, 0.56], ["0%", "100%"]);
  const asideOpacity = useTransform(progress, [0.36, 0.58], [0, 1]);

  return (
    <section ref={ref} id="manifesto" className="landing-manifesto">
      <div className="landing-manifesto__sticky">
        <div className="landing-manifesto__kicker">The problem is not intelligence.</div>
        <div className="landing-manifesto__statement" aria-label="Intelligence is everywhere. Coordination is not.">
          <motion.span style={{ y: lineOneY, opacity: lineOneOpacity }}>Intelligence is everywhere.</motion.span>
          <motion.span className="landing-manifesto__accent" style={{ y: lineTwoY, opacity: lineTwoOpacity }}>
            Coordination is not.
            <motion.i style={{ width: accentWidth }} />
          </motion.span>
        </div>
        <motion.p className="landing-manifesto__aside" style={{ opacity: asideOpacity }}>
          More models did not remove the operational problem. They multiplied it.
        </motion.p>
      </div>
    </section>
  );
}

function FragmentationSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const density = useTransform(progress, [0.12, 0.48, 0.84], [0.35, 1, 0.48]);
  const fieldScale = useTransform(progress, [0.08, 0.52, 0.9], [0.94, 1, 1.04]);
  const fieldY = useTransform(progress, [0, 1], [48, -44]);
  const headingOpacity = useTransform(progress, [0.06, 0.24, 0.74, 0.92], [0, 1, 1, 0]);
  const fragmentsOpacity = useTransform(progress, [0.16, 0.35, 0.74, 0.94], [0, 1, 1, 0]);

  const fragmentStyles: Array<{ className: string; text: string }> = [
    { className: "fragment--brief", text: "brief" },
    { className: "fragment--memory", text: "memory" },
    { className: "fragment--agent", text: "agent" },
    { className: "fragment--tool", text: "tool" },
    { className: "fragment--review", text: "review" },
    { className: "fragment--source", text: "source" },
    { className: "fragment--context", text: "context" },
    { className: "fragment--handoff", text: "handoff" },
  ];

  return (
    <section ref={ref} className="landing-fragmentation" aria-labelledby="fragmentation-title">
      <motion.div className="landing-fragmentation__field" style={{ scale: fieldScale, y: fieldY, opacity: density }} aria-hidden="true">
        <i className="landing-pixel-cloud landing-pixel-cloud--a" />
        <i className="landing-pixel-cloud landing-pixel-cloud--b" />
        <i className="landing-pixel-cloud landing-pixel-cloud--c" />
        {fragmentStyles.map((fragment) => (
          <motion.span key={fragment.text} className={`landing-fragment ${fragment.className}`} style={{ opacity: fragmentsOpacity }}>
            {fragment.text}
          </motion.span>
        ))}
        <div className="landing-fragmentation__providers">
          {providers.map(({ name, Mark }) => (
            <span key={name} title={name}><Mark aria-hidden="true" /></span>
          ))}
        </div>
      </motion.div>

      <motion.div className="landing-fragmentation__copy" style={{ opacity: headingOpacity }}>
        <p>Without an operating layer</p>
        <h2 id="fragmentation-title">Capability becomes fragmentation.</h2>
        <span>Different models. Different tools. Different memory. Different standards of completion.</span>
      </motion.div>
    </section>
  );
}

function ControlSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const markScale = useTransform(progress, [0.08, 0.42, 0.82], [0.82, 1, 0.92]);
  const markOpacity = useTransform(progress, [0.04, 0.27, 0.82, 0.96], [0, 1, 1, 0]);
  const copyY = useTransform(progress, [0.1, 0.46, 0.84], [40, 0, -22]);
  const copyOpacity = useTransform(progress, [0.1, 0.3, 0.8, 0.95], [0, 1, 1, 0]);
  const fieldScale = useTransform(progress, [0.12, 0.68], [0.82, 1]);

  return (
    <section ref={ref} className="landing-control" aria-labelledby="control-title">
      <div className="landing-control__sticky">
        <motion.div className="landing-control__field" style={{ scale: fieldScale }} aria-hidden="true">
          <span /><span /><span /><span />
        </motion.div>
        <motion.div className="landing-control__mark" style={{ scale: markScale, opacity: markOpacity }} aria-hidden="true">
          <CortexLogo />
        </motion.div>
        <motion.div className="landing-control__copy" style={{ y: copyY, opacity: copyOpacity }}>
          <p>Cortex is the operating layer.</p>
          <h2 id="control-title">One place to direct the whole system.</h2>
          <span>Not another model. Not another chat. A layer for turning intelligence into controlled action.</span>
        </motion.div>
      </div>
    </section>
  );
}

function CapabilityRow({ item, progress, index }: { item: Capability; progress: MotionValue<number>; index: number }) {
  const start = 0.06 + index * 0.18;
  const end = Math.min(start + 0.28, 0.96);
  const opacity = useTransform(progress, [start, start + 0.08, end], [0.2, 1, 1]);
  const x = useTransform(progress, [start, start + 0.14], [index % 2 === 0 ? -24 : 24, 0]);
  const lineScale = useTransform(progress, [start, start + 0.18], [0.15, 1]);

  return (
    <motion.article className="landing-capability" style={{ opacity, x }}>
      <div className="landing-capability__meta"><span>{item.index}</span><i /></div>
      <div className="landing-capability__main">
        <h3>{item.verb}</h3>
        <p>{item.statement}</p>
      </div>
      <p className="landing-capability__note">{item.note}</p>
      <motion.i className="landing-capability__line" style={{ scaleX: lineScale }} />
    </motion.article>
  );
}

function CapabilitiesSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end end"]);

  return (
    <section ref={ref} className="landing-capabilities" aria-labelledby="capabilities-title">
      <header className="landing-capabilities__intro">
        <p>What Cortex changes</p>
        <h2 id="capabilities-title">Less orchestration overhead.<br />More consequential work finished well.</h2>
      </header>
      <div className="landing-capabilities__list">
        {capabilities.map((item, index) => (
          <CapabilityRow key={item.index} item={item} progress={progress} index={index} />
        ))}
      </div>
    </section>
  );
}

function ArchitectureSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const contentOpacity = useTransform(progress, [0.08, 0.28, 0.78, 0.96], [0, 1, 1, 0]);
  const logosY = useTransform(progress, [0.14, 0.52], [20, 0]);
  const curtainScale = useTransform(progress, [0.08, 0.6], [0.45, 1]);

  return (
    <section ref={ref} className="landing-architecture" aria-labelledby="architecture-title">
      <motion.div className="landing-architecture__curtain" style={{ scaleX: curtainScale }} aria-hidden="true" />
      <motion.div className="landing-architecture__content" style={{ opacity: contentOpacity }}>
        <div className="landing-architecture__copy">
          <p>Model-agnostic by design</p>
          <h2 id="architecture-title">The intelligence can change.<br />The operating logic stays.</h2>
          <span>Cortex treats models as capabilities inside a larger system—not as the system itself.</span>
        </div>
        <motion.div className="landing-architecture__providers" style={{ y: logosY }}>
          {providers.map(({ name, Mark }) => (
            <div key={name}>
              <Mark aria-hidden="true" />
              <span>{name}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

function StatementSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const opacity = useTransform(progress, [0.08, 0.3, 0.78, 0.94], [0, 1, 1, 0]);
  const y = useTransform(progress, [0.08, 0.42, 0.82], [38, 0, -28]);
  const pixelsOpacity = useTransform(progress, [0.08, 0.45, 0.9], [0, 0.8, 0]);

  return (
    <section ref={ref} className="landing-statement" aria-labelledby="statement-title">
      <motion.div className="landing-statement__pixels" style={{ opacity: pixelsOpacity }} aria-hidden="true" />
      <motion.div className="landing-statement__copy" style={{ opacity, y }}>
        <p>Coordination is the advantage.</p>
        <h2 id="statement-title">More intelligence.<br />Less chaos.</h2>
      </motion.div>
    </section>
  );
}

export function LandingSections() {
  return (
    <div className="landing-sections">
      <ManifestoSection />
      <FragmentationSection />
      <ControlSection />
      <CapabilitiesSection />
      <ArchitectureSection />
      <StatementSection />
    </div>
  );
}
