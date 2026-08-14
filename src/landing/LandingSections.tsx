import { useRef, type RefObject } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import heroPixelCloud1920 from "@/assets/cortex-hero-pixel-cloud-1920.webp";
import { CortexLogo } from "@/components/brand/CortexLogo";
import "./landing-sections.css";

type ScrollOffset = NonNullable<NonNullable<Parameters<typeof useScroll>[0]>["offset"]>;

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
    stiffness: reducedMotion ? 1000 : 94,
    damping: reducedMotion ? 1000 : 32,
    mass: reducedMotion ? 0.01 : 0.24,
    restDelta: 0.0005,
  });
}

function PixelPlane({ className }: { className: string }) {
  return (
    <div className={`cortex-pixel-plane ${className}`} aria-hidden="true">
      <img src={heroPixelCloud1920} alt="" draggable={false} />
    </div>
  );
}

function ProblemSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const y = useTransform(progress, [0.08, 0.46, 0.9], [56, 0, -30]);
  const opacity = useTransform(progress, [0.05, 0.2, 0.86, 0.96], [0.35, 1, 1, 0.72]);
  const imageX = useTransform(progress, [0.06, 0.82], ["10vw", "-6vw"]);
  const imageScale = useTransform(progress, [0.08, 0.52, 0.9], [1.1, 0.98, 0.9]);

  return (
    <section ref={ref} id="manifesto" className="cortex-moment cortex-problem">
      <motion.div className="cortex-problem__visual" style={{ x: imageX, scale: imageScale, opacity }}>
        <PixelPlane className="cortex-pixel-plane--problem" />
      </motion.div>
      <motion.div className="cortex-problem__copy" style={{ y, opacity }}>
        <span className="cortex-kicker">The coordination problem</span>
        <h2>Intelligence is everywhere.<br /><em>Coordination is not.</em></h2>
        <p>
          More models did not remove the operational problem. They multiplied the tools, memories,
          standards and handoffs that have to stay aligned.
        </p>
      </motion.div>
      <motion.p className="cortex-problem__aside" style={{ opacity }}>
        The missing layer is not another model.<br />It is the thread between them.
      </motion.p>
    </section>
  );
}

function ControlSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const y = useTransform(progress, [0.08, 0.46, 0.9], [54, 0, -26]);
  const markY = useTransform(progress, [0.08, 0.46, 0.9], [48, -6, -52]);
  const markScale = useTransform(progress, [0.08, 0.5, 0.9], [0.78, 1, 0.9]);
  const opacity = useTransform(progress, [0.05, 0.2, 0.86, 0.96], [0.42, 1, 1, 0.72]);
  const imageOpacity = useTransform(progress, [0.05, 0.28, 0.84, 0.96], [0, 0.74, 0.5, 0]);

  return (
    <section ref={ref} className="cortex-moment cortex-control" aria-labelledby="control-title">
      <motion.div className="cortex-control__visual" style={{ opacity: imageOpacity }}>
        <PixelPlane className="cortex-pixel-plane--control" />
      </motion.div>
      <motion.div className="cortex-control__mark" style={{ y: markY, scale: markScale, opacity }} aria-hidden="true">
        <CortexLogo />
      </motion.div>
      <motion.div className="cortex-control__copy" style={{ y, opacity }}>
        <span className="cortex-kicker">Cortex is the operating layer</span>
        <h2 id="control-title">One place to direct the whole system.</h2>
        <p>Not another model. Not another chat. A layer for turning intelligence into controlled action.</p>
      </motion.div>
      <p className="cortex-control__aside">Direction, context, review.<br />One continuous thread.</p>
    </section>
  );
}

function ArchitectureSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start end", "end start"]);
  const copyY = useTransform(progress, [0.08, 0.44, 0.9], [46, 0, -28]);
  const systemScale = useTransform(progress, [0.08, 0.5, 0.9], [1.08, 1, 0.92]);
  const systemRotate = useTransform(progress, [0.08, 0.9], [-1.4, 1]);
  const opacity = useTransform(progress, [0.05, 0.2, 0.84, 0.96], [0.45, 1, 1, 0.72]);
  const imageOpacity = useTransform(progress, [0.05, 0.24, 0.82, 0.96], [0, 0.62, 0.42, 0]);

  return (
    <section ref={ref} className="cortex-moment cortex-architecture" aria-labelledby="architecture-title">
      <motion.div className="cortex-architecture__visual" style={{ opacity: imageOpacity }}>
        <PixelPlane className="cortex-pixel-plane--architecture" />
      </motion.div>
      <motion.div className="cortex-architecture__copy" style={{ y: copyY, opacity }}>
        <span className="cortex-kicker">Model-agnostic by design</span>
        <h2 id="architecture-title">The intelligence can change.<br /><em>The operating logic stays.</em></h2>
      </motion.div>

      <motion.div
        className="cortex-architecture__system"
        style={{ scale: systemScale, rotate: systemRotate, opacity }}
        aria-label="Supported model providers"
      >
        <div className="cortex-architecture__core" aria-hidden="true"><CortexLogo /></div>
        <div className="cortex-architecture__providers" aria-label="Model providers">
          <span>Claude</span>
          <span>Codex</span>
          <span>DeepSeek</span>
          <span>Gemini</span>
          <span>Mistral</span>
        </div>
        <p className="cortex-architecture__caption">Many models. One operating logic.</p>
      </motion.div>
    </section>
  );
}

function MissionSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useSoftProgress(ref, ["start start", "end end"]);
  const introOpacity = useTransform(progress, [0, 0.12, 0.34, 0.88], [1, 1, 0.62, 0.78]);
  const imageOpacity = useTransform(progress, [0, 0.18, 0.66, 1], [0.08, 0.26, 0.18, 0.04]);
  const objectiveOpacity = useTransform(progress, [0, 0.08, 0.16, 0.22], [0, 1, 1, 0]);
  const objectiveY = useTransform(progress, [0, 0.08, 0.18, 0.24], [28, 0, -12, -24]);
  const structureOpacity = useTransform(progress, [0.2, 0.28, 0.36, 0.42], [0, 1, 1, 0]);
  const structureY = useTransform(progress, [0.2, 0.28, 0.38, 0.44], [28, 0, -12, -24]);
  const executionOpacity = useTransform(progress, [0.4, 0.48, 0.56, 0.62], [0, 1, 1, 0]);
  const executionY = useTransform(progress, [0.4, 0.48, 0.58, 0.64], [28, 0, -12, -24]);
  const proofOpacity = useTransform(progress, [0.6, 0.68, 0.86, 1], [0, 1, 1, 1]);
  const proofY = useTransform(progress, [0.6, 0.68, 0.88, 1], [28, 0, -8, -8]);
  const stageOpacity = useTransform(progress, [0.1, 0.28, 0.52, 0.76, 0.94], [0.5, 1, 1, 1, 1]);

  return (
    <section ref={ref} className="cortex-mission" id="proof" aria-labelledby="mission-title">
      <div className="cortex-mission__sticky">
        <motion.div className="cortex-mission__visual" style={{ opacity: imageOpacity }}>
          <PixelPlane className="cortex-pixel-plane--mission" />
        </motion.div>
        <motion.div className="cortex-mission__intro" style={{ opacity: introOpacity }}>
          <span className="cortex-kicker">A mission in motion</span>
          <h2 id="mission-title">See the system <em>at work.</em></h2>
          <p>One objective moving through planning, action, evidence and handoff.</p>
        </motion.div>

        <div className="cortex-mission__story" aria-live="polite">
          <motion.div className="cortex-mission__step" style={{ opacity: objectiveOpacity, y: objectiveY }}>
            <span>Objective</span>
            <h3>Define the outcome.</h3>
            <p>One clear objective gives every capability a direction.</p>
          </motion.div>
          <motion.div className="cortex-mission__step" style={{ opacity: structureOpacity, y: structureY }}>
            <span>Structure</span>
            <h3>Route the work.</h3>
            <p>Cortex assigns the right intelligence to the right problem.</p>
          </motion.div>
          <motion.div className="cortex-mission__step" style={{ opacity: executionOpacity, y: executionY }}>
            <span>Execution</span>
            <h3>Move the system.</h3>
            <p>Agents act inside one controlled operating context.</p>
          </motion.div>
          <motion.div className="cortex-mission__step" style={{ opacity: proofOpacity, y: proofY }}>
            <span>Proof</span>
            <h3>Hand back the evidence.</h3>
            <p>The human receives work that can be reviewed, trusted and used.</p>
          </motion.div>
        </div>

        <motion.div className="cortex-mission__stages" style={{ opacity: stageOpacity }} aria-hidden="true">
          <span>Objective</span>
          <span>Structure</span>
          <span>Execution</span>
          <span>Proof</span>
        </motion.div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  return (
    <section className="cortex-capabilities" aria-labelledby="capabilities-title">
      <PixelPlane className="cortex-pixel-plane--capabilities" />
      <div className="cortex-capabilities__intro">
        <span className="cortex-kicker">What Cortex changes</span>
        <h2 id="capabilities-title">From scattered capability to <em>controlled execution.</em></h2>
      </div>

      <div className="cortex-capabilities__moments">
        {capabilityMoments.map((moment) => (
          <motion.article
            key={moment.verb}
            className={`cortex-capability ${moment.className}`}
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.32, once: false }}
            transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          >
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
  const opacity = useTransform(progress, [0.08, 0.28, 0.82, 0.95], [0.42, 1, 1, 0.72]);
  const imageOpacity = useTransform(progress, [0.08, 0.28, 0.82, 0.95], [0, 0.42, 0.3, 0]);

  return (
    <section ref={ref} className="cortex-moment cortex-statement" aria-labelledby="statement-title">
      <motion.div className="cortex-statement__visual" style={{ opacity: imageOpacity }}>
        <PixelPlane className="cortex-pixel-plane--statement" />
      </motion.div>
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
