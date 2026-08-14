import { useRef, type ComponentType, type RefObject, type SVGProps } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ClaudeMark } from "@/components/brand/ClaudeMark";
import { CortexLogo } from "@/components/brand/CortexLogo";
import { DeepSeekMark, GeminiMark, MistralMark } from "@/components/brand/ProviderMarks";
import { OpenAiMark } from "@/components/brand/OpenAiMark";
import { LandingAtmosphere } from "./LandingAtmosphere";
import "./landing-sections.css";

type ProviderMark = ComponentType<SVGProps<SVGSVGElement> & { title?: string }>;
type ScrollOffset = NonNullable<NonNullable<Parameters<typeof useScroll>[0]>["offset"]>;

const providers: Array<{ name: string; Mark: ProviderMark }> = [
  { name: "Claude", Mark: ClaudeMark },
  { name: "Codex", Mark: OpenAiMark },
  { name: "DeepSeek", Mark: DeepSeekMark },
  { name: "Gemini", Mark: GeminiMark },
  { name: "Mistral", Mark: MistralMark },
];

const capabilities = [
  ["Orchestrate", "Turn one objective into coordinated intelligence."],
  ["Delegate", "Put the right capability on every part of the problem."],
  ["Verify", "Keep weak work from becoming finished work."],
  ["Control", "Keep consequential work legible to the human in charge."],
] as const;

function useSoftProgress(target: RefObject<HTMLElement | null>, offset: ScrollOffset) {
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset });

  return useSpring(scrollYProgress, {
    stiffness: reducedMotion ? 1000 : 92,
    damping: reducedMotion ? 1000 : 30,
    mass: reducedMotion ? 0.01 : 0.24,
    restDelta: 0.0005,
  });
}

function ProblemSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const y = useTransform(progress, [0.08, 0.48, 0.9], [54, 0, -32]);
  const opacity = useTransform(progress, [0.06, 0.24, 0.82, 0.95], [0, 1, 1, 0]);

  return (
    <section ref={ref} id="manifesto" className="landing-moment landing-problem">
      <motion.div className="landing-problem__copy" style={{ y, opacity }}>
        <h2>Intelligence is everywhere.<br /><em>Coordination is not.</em></h2>
        <p>
          More models did not remove the operational problem. They multiplied the number of tools,
          memories, standards and handoffs that have to stay aligned.
        </p>
      </motion.div>
    </section>
  );
}

function ControlSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const copyY = useTransform(progress, [0.08, 0.48, 0.88], [48, 0, -26]);
  const markScale = useTransform(progress, [0.08, 0.46, 0.86], [0.82, 1, 0.94]);
  const opacity = useTransform(progress, [0.06, 0.26, 0.82, 0.95], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="landing-moment landing-control" aria-labelledby="control-title">
      <motion.div className="landing-control__mark" style={{ scale: markScale, opacity }} aria-hidden="true">
        <CortexLogo />
      </motion.div>
      <motion.div className="landing-control__copy" style={{ y: copyY, opacity }}>
        <span>Cortex is the operating layer.</span>
        <h2 id="control-title">One place to direct the whole system.</h2>
        <p>Not another model. Not another chat. A layer for turning intelligence into controlled action.</p>
      </motion.div>
    </section>
  );
}

function CapabilitiesSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const y = useTransform(progress, [0.08, 0.46, 0.9], [42, 0, -22]);
  const opacity = useTransform(progress, [0.06, 0.24, 0.84, 0.96], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="landing-moment landing-capabilities" aria-labelledby="capabilities-title">
      <motion.div className="landing-capabilities__inner" style={{ y, opacity }}>
        <div className="landing-capabilities__intro">
          <span>What Cortex changes</span>
          <h2 id="capabilities-title">From scattered capability to controlled execution.</h2>
        </div>
        <div className="landing-capabilities__list">
          {capabilities.map(([verb, statement]) => (
            <article key={verb}>
              <h3>{verb}</h3>
              <p>{statement}</p>
            </article>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function ArchitectureSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const x = useTransform(progress, [0.08, 0.48, 0.9], [-36, 0, 24]);
  const railX = useTransform(progress, [0.08, 0.9], ["5vw", "-5vw"]);
  const opacity = useTransform(progress, [0.06, 0.25, 0.84, 0.96], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="landing-moment landing-architecture" aria-labelledby="architecture-title">
      <motion.div className="landing-architecture__copy" style={{ x, opacity }}>
        <span>Model-agnostic by design</span>
        <h2 id="architecture-title">The intelligence can change.<br />The operating logic stays.</h2>
      </motion.div>
      <motion.div className="landing-architecture__rail" style={{ x: railX, opacity }} aria-label="Supported model providers">
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
  const scale = useTransform(progress, [0.08, 0.48, 0.88], [0.95, 1, 1.02]);
  const opacity = useTransform(progress, [0.08, 0.28, 0.82, 0.95], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="landing-moment landing-statement" aria-labelledby="statement-title">
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
        <ProblemSection />
        <ControlSection />
        <CapabilitiesSection />
        <ArchitectureSection />
        <StatementSection />
      </div>
    </div>
  );
}
