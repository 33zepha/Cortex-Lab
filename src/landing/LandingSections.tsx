import { useRef, type ComponentType, type RefObject, type SVGProps } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { CortexLogo } from "@/components/brand/CortexLogo";
import "./landing-sections.css";

const capabilityMoments = [
  {
    verb: "Orchestrate",
    statement: "One objective becomes coordinated intelligence.",
    className: "is-orchestrate",
  },
  {
    verb: "Delegate",
    statement: "The right capability moves to the right problem.",
    className: "is-delegate",
  },
  {
    verb: "Verify",
    statement: "Weak work is sent back before it becomes finished work.",
    className: "is-verify",
  },
  {
    verb: "Control",
    statement: "The human stays in command.",
    className: "is-control",
  },
] as const;

function useSoftProgress(target: RefObject<HTMLElement | null>, offset: ScrollOffset) {
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset });

  return useSpring(scrollYProgress, {
    stiffness: reducedMotion ? 1000 : 88,
    damping: reducedMotion ? 1000 : 30,
    mass: reducedMotion ? 0.01 : 0.28,
    restDelta: 0.0005,
  });
}

function ProblemSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const y = useTransform(progress, [0.08, 0.46, 0.9], [64, 0, -38]);
  const opacity = useTransform(progress, [0.05, 0.23, 0.82, 0.96], [0, 1, 1, 0]);
  const matterX = useTransform(progress, [0.06, 0.82], ["7vw", "-8vw"]);
  const matterScale = useTransform(progress, [0.08, 0.52, 0.9], [1.14, 0.94, 0.78]);

  return (
    <section ref={ref} id="manifesto" className="cortex-moment cortex-problem">
      <motion.div
        className="cortex-matter cortex-matter--problem"
        style={{ x: matterX, scale: matterScale, opacity }}
        aria-hidden="true"
      />
      <motion.div className="cortex-problem__copy" style={{ y, opacity }}>
        <span className="cortex-kicker">The coordination problem</span>
        <h2>Intelligence is everywhere.<br /><em>Coordination is not.</em></h2>
        <p>
          More models did not remove the operational problem. They multiplied the tools, memories,
          standards and handoffs that have to stay aligned.
        </p>
      </motion.div>
    </section>
  );
}

function ControlSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const y = useTransform(progress, [0.08, 0.46, 0.9], [58, 0, -28]);
  const markY = useTransform(progress, [0.08, 0.46, 0.9], [44, -10, -56]);
  const markScale = useTransform(progress, [0.08, 0.5, 0.9], [0.82, 1, 0.9]);
  const opacity = useTransform(progress, [0.05, 0.24, 0.84, 0.96], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="cortex-moment cortex-control" aria-labelledby="control-title">
      <div className="cortex-control__atmosphere" aria-hidden="true" />
      <motion.div className="cortex-control__mark" style={{ y: markY, scale: markScale, opacity }} aria-hidden="true">
        <CortexLogo />
      </motion.div>
      <motion.div className="cortex-control__copy" style={{ y, opacity }}>
        <span className="cortex-kicker">Cortex is the operating layer</span>
        <h2 id="control-title">One place to direct the whole system.</h2>
        <p>Not another model. Not another chat. A layer for turning intelligence into controlled action.</p>
      </motion.div>
    </section>
  );
}

function ArchitectureSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const copyY = useTransform(progress, [0.08, 0.44, 0.9], [48, 0, -32]);
  const systemScale = useTransform(progress, [0.08, 0.5, 0.9], [1.08, 1, 0.92]);
  const systemRotate = useTransform(progress, [0.08, 0.9], [-1.8, 1.2]);
  const opacity = useTransform(progress, [0.05, 0.23, 0.84, 0.96], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="cortex-moment cortex-architecture" aria-labelledby="architecture-title">
      <motion.div className="cortex-architecture__copy" style={{ y: copyY, opacity }}>
        <span className="cortex-kicker">Model-agnostic by design</span>
        <h2 id="architecture-title">The intelligence can change.<br /><em>The operating logic stays.</em></h2>
      </motion.div>

      <motion.div
        className="cortex-architecture__system"
        style={{ scale: systemScale, rotate: systemRotate, opacity }}
        aria-label="Supported model providers"
      >
        <div className="cortex-architecture__halo" aria-hidden="true" />
        <div className="cortex-architecture__core" aria-hidden="true"><CortexLogo /></div>
        <div className="cortex-architecture__providers" aria-label="Model providers">
          <span>Claude</span>
          <span>Codex</span>
          <span>DeepSeek</span>
          <span>Gemini</span>
          <span>Mistral</span>
        </div>
      </motion.div>
  );
}

function MissionSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start start", "end end"]);
  const introOpacity = useTransform(progress, [0, 0.12, 0.27, 0.42], [0, 1, 1, 0.28]);
  const missionScale = useTransform(progress, [0.12, 0.48, 0.86], [0.94, 1, 0.96]);
  const missionY = useTransform(progress, [0.12, 0.48, 0.86], [38, 0, -26]);
  const objectiveOpacity = useTransform(progress, [0.12, 0.22, 0.3], [0, 1, 0.2]);
  const structureOpacity = useTransform(progress, [0.25, 0.36, 0.45], [0, 1, 0.2]);
  const executionOpacity = useTransform(progress, [0.4, 0.52, 0.62], [0, 1, 0.2]);
  const verificationOpacity = useTransform(progress, [0.56, 0.68, 0.78], [0, 1, 0.2]);
  const handoffOpacity = useTransform(progress, [0.72, 0.84, 0.96], [0, 1, 1]);
  const resultOpacity = useTransform(progress, [0.76, 0.9], [0, 1]);

  return (
    <section ref={ref} className="cortex-mission" id="proof" aria-labelledby="mission-title">
      <div className="cortex-mission__sticky">
        <div className="cortex-mission__mist" aria-hidden="true" />
        <motion.div className="cortex-mission__intro" style={{ opacity: introOpacity }}>
          <span className="cortex-kicker">A mission in motion</span>
          <h2 id="mission-title">See the system <em>at work.</em></h2>
          <p>One objective moving through planning, action, evidence and handoff.</p>
        </motion.div>

        <motion.div className="cortex-mission__objective" style={{ scale: missionScale, y: missionY, opacity: objectiveOpacity }}>
          <span className="cortex-mission__objective-label">Current objective</span>
          <h3>Launch Cortex publicly</h3>
          <p>One objective · fixed scope</p>
          <div className="cortex-mission__matter" aria-hidden="true" />
        </motion.div>

        <div className="cortex-mission__sequence" aria-label="Mission sequence">
          <motion.span style={{ opacity: objectiveOpacity }}>Objective</motion.span>
          <motion.span style={{ opacity: structureOpacity }}>Structure</motion.span>
          <motion.span style={{ opacity: executionOpacity }}>Execution</motion.span>
          <motion.span style={{ opacity: verificationOpacity }}>Verification</motion.span>
          <motion.span style={{ opacity: handoffOpacity }}>Handoff</motion.span>
        </div>

        <motion.div className="cortex-mission__result" style={{ opacity: resultOpacity }}>
          Proof attached. Human review ready.
        </motion.div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  return (
    <section className="cortex-capabilities" aria-labelledby="capabilities-title">
      <div className="cortex-capabilities__intro">
        <span className="cortex-kicker">What Cortex changes</span>
        <h2 id="capabilities-title">From scattered capability to <em>controlled execution.</em></h2>
      </div>

      <div className="cortex-capabilities__moments">
        {capabilityMoments.map((moment) => (
          <motion.article
            key={moment.verb}
            className={`cortex-capability ${moment.className}`}
            initial={{ opacity: 0, y: 54 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.32, once: false }}
            transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="cortex-capability__matter" aria-hidden="true" />
            <h3>{moment.verb}</h3>
            <p>{moment.statement}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function StatementSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const scale = useTransform(progress, [0.08, 0.5, 0.9], [0.96, 1, 1.025]);
  const opacity = useTransform(progress, [0.08, 0.28, 0.82, 0.95], [0, 1, 1, 0]);
  const matterScale = useTransform(progress, [0.08, 0.55, 0.9], [0.76, 1, 1.1]);

  return (
    <section ref={ref} className="cortex-moment cortex-statement" aria-labelledby="statement-title">
      <motion.div className="cortex-matter cortex-matter--statement" style={{ scale: matterScale, opacity }} aria-hidden="true" />
      <motion.div className="cortex-statement__copy" style={{ scale, opacity }}>
        <span className="cortex-kicker">Coordination is the advantage</span>
        <h2 id="statement-title">More intelligence.<br /><em>Less chaos.</em></h2>
      </motion.div>
    </section>
  );
}

export function LandingSections() {
  return (
    <div className="cortex-landing">
      <ProblemSection />
      <ControlSection />
      <ArchitectureSection />
      <MissionSection />
      <CapabilitiesSection />
      <StatementSection />
    </div>
  );
}
