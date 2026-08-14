import { useRef, type ComponentType, type SVGProps } from "react";
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
import "./journey.css";

type ProviderMark = ComponentType<SVGProps<SVGSVGElement> & { title?: string }>;
type StageKey = "intent" | "structure" | "execution" | "verification" | "result";

type JourneyStage = {
  key: StageKey;
  label: string;
  title: string;
  copy: string;
  note: string;
  start: number;
  end: number;
};

const stages: JourneyStage[] = [
  {
    key: "intent",
    label: "Intent",
    title: "Start with the outcome.",
    copy: "Give Cortex the objective, the context and the constraints. The system keeps the mission singular before any work begins.",
    note: "One objective · one source of truth",
    start: 0,
    end: 0.2,
  },
  {
    key: "structure",
    label: "Structure",
    title: "Shape the right way through.",
    copy: "Cortex reads the work, chooses the capabilities it needs and turns a loose brief into a sequence that can be inspected.",
    note: "Capability is selected before execution",
    start: 0.17,
    end: 0.4,
  },
  {
    key: "execution",
    label: "Execution",
    title: "Parallel work. Shared context.",
    copy: "Specialists move at the same time while the objective, decisions and boundaries stay connected in one mission.",
    note: "The system fans out without fragmenting",
    start: 0.37,
    end: 0.63,
  },
  {
    key: "verification",
    label: "Verification",
    title: "Nothing leaves unchecked.",
    copy: "Evidence, scope and quality are checked together. When something misses, the work loops back with a reason—not a guess.",
    note: "Review is part of the work, not a final gesture",
    start: 0.6,
    end: 0.83,
  },
  {
    key: "result",
    label: "Result",
    title: "Complexity becomes a clear handoff.",
    copy: "The final output arrives with the decisions, sources and proof needed to act on it with confidence.",
    note: "A result you can direct, explain and reuse",
    start: 0.8,
    end: 1,
  },
];

const providers: Array<{ name: string; Mark: ProviderMark }> = [
  { name: "Claude", Mark: ClaudeMark },
  { name: "Codex", Mark: OpenAiMark },
  { name: "DeepSeek", Mark: DeepSeekMark },
  { name: "Gemini", Mark: GeminiMark },
  { name: "Mistral", Mark: MistralMark },
];

function useStagePresence(progress: MotionValue<number>, start: number, end: number) {
  const fadeIn = Math.min(start + 0.055, end);
  const fadeOut = Math.max(end - 0.055, start);

  return {
    opacity: useTransform(progress, [start, fadeIn, fadeOut, end], [0, 1, 1, 0]),
    y: useTransform(progress, [start, fadeIn, fadeOut, end], [24, 0, 0, -18]),
    scale: useTransform(progress, [start, fadeIn, fadeOut, end], [0.975, 1, 1, 0.99]),
  };
}

function PixelField({ className = "" }: { className?: string }) {
  return <span className={`cortex-pixel-field ${className}`} aria-hidden="true" />;
}

function IntentVisual({ local }: { local: MotionValue<number> }) {
  const fill = useTransform(local, [0.08, 0.56], [0, 1]);
  const promptY = useTransform(local, [0, 0.45], [10, 0]);

  return (
    <div className="cortex-frame cortex-frame--intent">
      <div className="cortex-frame__header">
        <span>Mission / new</span>
        <span className="cortex-frame__status">Draft</span>
      </div>
      <motion.div className="cortex-intent" style={{ y: promptY }}>
        <span className="cortex-intent__label">Objective</span>
        <strong>Launch Cortex publicly</strong>
        <div className="cortex-intent__tags">
          <span>AI operations</span>
          <span>small team</span>
          <span>fixed scope</span>
        </div>
      </motion.div>
      <div className="cortex-frame__footer">
        <span>Mission ready</span>
        <motion.i style={{ scaleX: fill }} />
        <span>01 / 05</span>
      </div>
    </div>
  );
}

function StructureVisual({ local }: { local: MotionValue<number> }) {
  const routeOpacity = useTransform(local, [0.3, 0.58], [0, 1]);

  return (
    <div className="cortex-frame cortex-frame--structure">
      <div className="cortex-frame__header">
        <span>Capability map</span>
        <span className="cortex-frame__status cortex-frame__status--blue">Scored</span>
      </div>
      <div className="cortex-structure__signals">
        {[
          ["reasoning", "0.91"],
          ["research", "0.73"],
          ["execution", "0.48"],
        ].map(([label, score], index) => (
          <div className="cortex-structure__signal" key={label}>
            <span>{label}</span>
            <i><b style={{ width: `${[91, 73, 48][index]}%` }} /></i>
            <em>{score}</em>
          </div>
        ))}
      </div>
      <motion.div className="cortex-structure__route" style={{ opacity: routeOpacity }}>
        <span>route</span>
        <strong>reason + research + build</strong>
      </motion.div>
      <div className="cortex-structure__providers">
        {providers.map(({ name, Mark }) => (
          <span key={name} title={name}><Mark aria-hidden="true" /></span>
        ))}
      </div>
    </div>
  );
}

function ExecutionVisual({ local }: { local: MotionValue<number> }) {
  const reveal = useTransform(local, [0.08, 0.34], [0, 1]);
  const streamOneX = useTransform(local, [0.04, 0.38], [-18, 0]);
  const streamTwoX = useTransform(local, [0.08, 0.46], [18, 0]);
  const streamThreeX = useTransform(local, [0.12, 0.54], [-12, 0]);
  const rows = [
    ["research", "Competitive landscape", "12 sources", "live"],
    ["build", "Landing implementation", "3 files", "live"],
    ["planning", "Launch sequence", "ready", "queued"],
  ];
  const streamX = [streamOneX, streamTwoX, streamThreeX];

  return (
    <div className="cortex-frame cortex-frame--execution">
      <div className="cortex-frame__header">
        <span>Live work</span>
        <motion.span className="cortex-frame__status cortex-frame__status--blue" style={{ opacity: reveal }}>3 streams</motion.span>
      </div>
      <div className="cortex-execution__streams">
        {rows.map(([kind, title, meta, status], index) => (
          <motion.div className="cortex-execution__stream" key={kind} style={{ x: streamX[index], opacity: reveal }}>
            <i className={`cortex-execution__dot cortex-execution__dot--${status}`} />
            <span><small>{kind}</small><strong>{title}</strong></span>
            <em>{meta}</em>
          </motion.div>
        ))}
      </div>
      <div className="cortex-frame__footer">
        <span>Context held across every stream</span>
        <PixelField />
      </div>
    </div>
  );
}

function VerificationVisual({ local }: { local: MotionValue<number> }) {
  const mismatch = useTransform(local, [0.12, 0.3, 0.58, 0.72], [0, 1, 1, 0]);
  const verified = useTransform(local, [0.58, 0.82], [0, 1]);

  return (
    <div className="cortex-frame cortex-frame--verification">
      <div className="cortex-frame__header">
        <span>Mission review</span>
        <span className="cortex-frame__status">3 checks</span>
      </div>
      <div className="cortex-verification__rows">
        <div><i className="is-ok" /><span>Evidence attached</span><b>Pass</b></div>
        <div><i className="is-ok" /><span>Scope respected</span><b>Pass</b></div>
        <motion.div style={{ opacity: mismatch }}><i /><span>Constraint alignment</span><b className="is-revise">Revise</b></motion.div>
      </div>
      <motion.div className="cortex-verification__verified" style={{ opacity: verified }}>
        <i /> Verified after revision
      </motion.div>
      <div className="cortex-frame__footer">
        <span>Evidence is attached to the outcome</span>
        <PixelField />
      </div>
    </div>
  );
}

function ResultVisual({ local }: { local: MotionValue<number> }) {
  const reveal = useTransform(local, [0.12, 0.44], [0, 1]);
  const resultY = useTransform(local, [0, 0.5], [16, 0]);

  return (
    <div className="cortex-frame cortex-frame--result">
      <div className="cortex-frame__header">
        <span>Handoff / complete</span>
        <span className="cortex-frame__status cortex-frame__status--blue">Verified</span>
      </div>
      <motion.div className="cortex-result" style={{ opacity: reveal, y: resultY }}>
        <div className="cortex-result__mark"><CortexLogo aria-hidden="true" /></div>
        <div>
          <span className="cortex-result__label">Delivered outcome</span>
          <strong>Launch strategy</strong>
        </div>
      </motion.div>
      <div className="cortex-result__stats">
        <span><b>27</b> sources</span>
        <span><b>14</b> decisions</span>
        <span><b>1</b> trace</span>
      </div>
      <div className="cortex-frame__footer">
        <span>Ready for a human decision</span>
        <PixelField />
      </div>
    </div>
  );
}

function StageVisual({ stage, local }: { stage: StageKey; local: MotionValue<number> }) {
  switch (stage) {
    case "intent":
      return <IntentVisual local={local} />;
    case "structure":
      return <StructureVisual local={local} />;
    case "execution":
      return <ExecutionVisual local={local} />;
    case "verification":
      return <VerificationVisual local={local} />;
    case "result":
      return <ResultVisual local={local} />;
  }
}

function JourneyStagePanel({ stage, index, progress }: { stage: JourneyStage; index: number; progress: MotionValue<number> }) {
  const presence = useStagePresence(progress, stage.start, stage.end);
  const local = useTransform(progress, [stage.start, stage.end], [0, 1]);

  return (
    <article id={`journey-${stage.key}`} className={`cortex-journey__panel cortex-journey__panel--${stage.key}`} aria-labelledby={`journey-${stage.key}-title`}>
      <motion.div className="cortex-journey__panel-inner" style={presence}>
        <div className="cortex-journey__panel-meta">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span>{stage.label}</span>
          <span>Operational sequence</span>
        </div>
        <div className="cortex-journey__panel-grid">
          <div className="cortex-journey__copy">
            <div className="cortex-journey__eyebrow"><i /> {stage.label}</div>
            <h3 id={`journey-${stage.key}-title`}>{stage.title}</h3>
            <p>{stage.copy}</p>
            <div className="cortex-journey__note"><span /> {stage.note}</div>
          </div>
          <StageVisual stage={stage.key} local={local} />
        </div>
      </motion.div>
    </article>
  );
}

function RailStep({ stage, index, progress }: { stage: JourneyStage; index: number; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [stage.start, stage.end], [0.34, 1]);
  const scale = useTransform(progress, [stage.start, stage.start + 0.06], [0.82, 1]);

  return (
    <li>
      <motion.span className="cortex-journey__rail-node" style={{ opacity, scale }}>
        <span>{String(index + 1).padStart(2, "0")}</span>
      </motion.span>
      <span>{stage.label}</span>
    </li>
  );
}

function MissionProof() {
  return (
    <section className="cortex-proof" aria-labelledby="cortex-proof-title">
      <div className="cortex-proof__heading">
        <div className="cortex-journey__eyebrow"><i /> Product proof</div>
        <h2 id="cortex-proof-title">See the mission,<br /><em>not the magic.</em></h2>
        <p>A Cortex mission is inspectable from the first objective to the final handoff. Every action has a place, a reason and a trace.</p>
      </div>

      <div className="cortex-proof__surface">
        <div className="cortex-proof__sidebar">
          <div className="cortex-proof__surface-top"><span>Mission</span><span className="cortex-proof__live"><i /> Live</span></div>
          <strong>Launch Cortex publicly</strong>
          <p>One objective · fixed scope</p>
          <ol>
            <li className="is-active"><span>01</span> Objective <b>Done</b></li>
            <li className="is-active"><span>02</span> Plan <b>Done</b></li>
            <li className="is-active"><span>03</span> Work <b>Live</b></li>
            <li><span>04</span> Review <b>Next</b></li>
          </ol>
          <PixelField className="cortex-proof__pixels" />
        </div>

        <div className="cortex-proof__main">
          <div className="cortex-proof__main-top"><span>Current activity</span><span>3 agents · 12 sources</span></div>
          <div className="cortex-proof__activity">
            <div><i className="is-live" /><span><small>Research</small><strong>Competitive landscape</strong></span><b>12 sources</b></div>
            <div><i className="is-live" /><span><small>Build</small><strong>Landing implementation</strong></span><b>3 files</b></div>
            <div><i /><span><small>Planning</small><strong>Launch sequence</strong></span><b>Queued</b></div>
          </div>
          <div className="cortex-proof__evidence">
            <div className="cortex-proof__evidence-head"><span>Evidence trail</span><b>Updated just now</b></div>
            <div className="cortex-proof__evidence-row"><span>Decision</span><strong>Position Cortex as an operational system</strong><em>01</em></div>
            <div className="cortex-proof__evidence-row"><span>Source</span><strong>Market and product signals attached</strong><em>02</em></div>
            <div className="cortex-proof__evidence-row"><span>Check</span><strong>Scope and constraints respected</strong><em>03</em></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Journey() {
  const trackRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: prefersReducedMotion ? 1000 : 130,
    damping: prefersReducedMotion ? 1000 : 32,
    mass: prefersReducedMotion ? 0.01 : 0.2,
    restDelta: 0.0005,
  });
  const railScale = useTransform(progress, [0, 1], [0, 1]);

  return (
    <section className="cortex-journey" id="journey" aria-label="How Cortex turns one objective into verified work">
      <header className="cortex-journey__intro">
        <div className="cortex-journey__intro-mark"><CortexLogo aria-hidden="true" /><PixelField /></div>
        <div className="cortex-journey__intro-copy">
          <div className="cortex-journey__eyebrow"><i /> The operating sequence</div>
          <h2>From intent<br /><em>to proof.</em></h2>
          <p>Cortex turns an objective into a controlled sequence you can inspect, direct and trust.</p>
        </div>
        <div className="cortex-journey__intro-meta"><span>Five stages</span><span>One mission</span><span>Every decision attached</span></div>
      </header>

      <div className="cortex-journey__track" ref={trackRef}>
        <div className="cortex-journey__sticky">
          <div className="cortex-journey__rail" aria-hidden="true">
            <span className="cortex-journey__rail-line" />
            <motion.span className="cortex-journey__rail-progress" style={{ scaleY: railScale }} />
            <ol>
              {stages.map((stage, index) => <RailStep key={stage.key} stage={stage} index={index} progress={progress} />)}
            </ol>
          </div>
          <div className="cortex-journey__panels">
            {stages.map((stage, index) => <JourneyStagePanel key={stage.key} stage={stage} index={index} progress={progress} />)}
          </div>
          <div className="cortex-journey__pixel-corner" aria-hidden="true"><PixelField /></div>
        </div>
      </div>

      <MissionProof />
    </section>
  );
}
