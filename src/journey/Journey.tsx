import {
  useEffect,
  useRef,
  type ComponentType,
  type CSSProperties,
  type SVGProps,
} from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
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
type StageKey = "objective" | "routing" | "execution" | "verify" | "return";

type JourneyStage = {
  key: StageKey;
  label: string;
  title: string;
  copy: string;
  start: number;
  end: number;
};

const stages: JourneyStage[] = [
  {
    key: "objective",
    label: "Objective",
    title: "Give Cortex the outcome, not the workflow.",
    copy: "Intent, context and constraints resolve into one living mission.",
    start: 0,
    end: 0.2,
  },
  {
    key: "routing",
    label: "Routing",
    title: "The mission finds the right intelligence.",
    copy: "Cortex weighs the work before it chooses the capabilities behind it.",
    start: 0.18,
    end: 0.4,
  },
  {
    key: "execution",
    label: "Execution",
    title: "Work fans out. Context stays whole.",
    copy: "Specialists move in parallel while the objective remains shared.",
    start: 0.37,
    end: 0.62,
  },
  {
    key: "verify",
    label: "Verification",
    title: "Nothing leaves unchecked.",
    copy: "A weak result loops back through evidence, revision and review.",
    start: 0.59,
    end: 0.82,
  },
  {
    key: "return",
    label: "Return",
    title: "Complexity collapses into a clear handoff.",
    copy: "The result arrives with the reasoning and evidence still attached.",
    start: 0.79,
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

const WORLD_WIDTH = 6200;
const WORLD_HEIGHT = 1200;
const PATH_D =
  "M220 620 C520 620 700 505 1020 515 C1260 522 1420 610 1670 565 C1880 528 2010 420 2240 410 C2500 398 2670 480 2880 575 C3110 680 3350 660 3540 555 C3740 445 3920 420 4100 495 C4270 565 4390 720 4320 835 C4250 950 4050 925 4020 790 C3980 620 4140 505 4340 520 C4610 540 4740 705 4970 690 C5180 676 5290 550 5480 530 C5670 510 5820 575 6030 620";

function interpolateKeyframes(progress: number, points: number[], values: number[]) {
  if (progress <= points[0]!) return values[0]!;
  if (progress >= points[points.length - 1]!) return values[values.length - 1]!;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index]!;
    const end = points[index + 1]!;
    if (progress >= start && progress <= end) {
      const local = (progress - start) / Math.max(end - start, 0.0001);
      return values[index]! + (values[index + 1]! - values[index]!) * local;
    }
  }

  return values[values.length - 1]!;
}

function viewportScale(width: number) {
  if (width <= 560) return 0.62;
  if (width <= 820) return 0.74;
  if (width <= 1180) return 0.88;
  return 1;
}

function pathProgressForScroll(progress: number) {
  return interpolateKeyframes(
    progress,
    [0, 0.16, 0.34, 0.54, 0.76, 1],
    [0.015, 0.18, 0.39, 0.61, 0.82, 0.995],
  );
}

function useScenePresence(progress: MotionValue<number>, start: number, end: number) {
  const fadeIn = Math.min(start + 0.055, end);
  const fadeOut = Math.max(end - 0.055, start);
  const opacity = useTransform(progress, [start, fadeIn, fadeOut, end], [0, 1, 1, 0]);
  const y = useTransform(progress, [start, fadeIn, fadeOut, end], [38, 0, 0, -26]);
  const scale = useTransform(progress, [start, fadeIn, fadeOut, end], [0.965, 1, 1, 0.985]);
  return { opacity, y, scale };
}

function Chapter({ stage, progress }: { stage: JourneyStage; progress: MotionValue<number> }) {
  const presence = useScenePresence(progress, stage.start, stage.end);
  const local = useTransform(progress, [stage.start, stage.end], [0, 1]);
  const lineScale = useTransform(local, [0.08, 0.5, 0.92], [0, 1, 1]);

  return (
    <article id={`journey-${stage.key}`} className={`cortex-chapter cortex-chapter--${stage.key}`}>
      <div className="cortex-chapter__sticky">
        <motion.div className="cortex-chapter__copy" style={presence}>
          <div className="cortex-chapter__eyebrow">
            <motion.i style={{ scaleX: lineScale }} />
            <span>{stage.label}</span>
          </div>
          <h2>{stage.title}</h2>
          <p>{stage.copy}</p>
        </motion.div>
      </div>
    </article>
  );
}

function ObjectiveScene({ progress }: { progress: MotionValue<number> }) {
  const presence = useScenePresence(progress, 0, 0.22);
  const local = useTransform(progress, [0, 0.2], [0, 1]);
  const metadataOpacity = useTransform(local, [0.22, 0.48], [0, 1]);
  const lockOpacity = useTransform(local, [0.6, 0.83], [0, 1]);
  const promptY = useTransform(local, [0, 0.7], [18, 0]);

  return (
    <motion.div className="cortex-scene cortex-scene--objective" style={presence}>
      <span className="cortex-scene__caption">MISSION</span>
      <motion.div className="cortex-objective" style={{ y: promptY }}>
        <span className="cortex-objective__prompt">Launch Cortex publicly</span>
        <motion.div className="cortex-objective__context" style={{ opacity: metadataOpacity }}>
          <span>AI operations</span>
          <span>small team</span>
          <span>fixed scope</span>
        </motion.div>
        <motion.div className="cortex-objective__locked" style={{ opacity: lockOpacity }}>
          <i /> mission ready
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function RoutingScene({ progress }: { progress: MotionValue<number> }) {
  const presence = useScenePresence(progress, 0.17, 0.43);
  const local = useTransform(progress, [0.18, 0.4], [0, 1]);
  const providerOpacity = useTransform(local, [0.48, 0.7], [0, 1]);
  const selectedOpacity = useTransform(local, [0.35, 0.58], [0, 1]);

  const scores = [
    { name: "reasoning", score: ".91", width: ".91" },
    { name: "research", score: ".73", width: ".73" },
    { name: "execution", score: ".48", width: ".48" },
  ];

  return (
    <motion.div className="cortex-scene cortex-scene--routing" style={presence}>
      <span className="cortex-scene__caption">ROUTE ANALYSIS</span>
      <div className="cortex-routing">
        <div className="cortex-routing__signals">
          {scores.map((item) => (
            <div className="cortex-routing__signal" key={item.name}>
              <span>{item.name}</span>
              <i><b style={{ "--score": item.width } as CSSProperties} /></i>
              <em>{item.score}</em>
            </div>
          ))}
        </div>
        <motion.div className="cortex-routing__selected" style={{ opacity: selectedOpacity }}>
          <span>route</span>
          <strong>reason + research + build</strong>
        </motion.div>
        <motion.div className="cortex-routing__providers" style={{ opacity: providerOpacity }}>
          {providers.map(({ name, Mark }) => (
            <span key={name} title={name}><Mark aria-hidden="true" /></span>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

function ExecutionScene({ progress }: { progress: MotionValue<number> }) {
  const presence = useScenePresence(progress, 0.36, 0.65);
  const local = useTransform(progress, [0.38, 0.62], [0, 1]);
  const streamOneX = useTransform(local, [0.05, 0.5], [-34, 0]);
  const streamTwoX = useTransform(local, [0.08, 0.54], [28, 0]);
  const streamThreeX = useTransform(local, [0.12, 0.58], [-18, 0]);
  const streamOpacity = useTransform(local, [0.08, 0.28], [0, 1]);

  return (
    <motion.div className="cortex-scene cortex-scene--execution" style={presence}>
      <span className="cortex-scene__caption">LIVE WORK</span>
      <div className="cortex-execution">
        <motion.div className="cortex-workstream" style={{ x: streamOneX, opacity: streamOpacity }}>
          <i className="is-live" />
          <span><small>research</small><strong>Competitive landscape</strong></span>
          <em>12 sources</em>
        </motion.div>
        <motion.div className="cortex-workstream" style={{ x: streamTwoX, opacity: streamOpacity }}>
          <i className="is-live" />
          <span><small>build</small><strong>Landing implementation</strong></span>
          <em>3 files</em>
        </motion.div>
        <motion.div className="cortex-workstream" style={{ x: streamThreeX, opacity: streamOpacity }}>
          <i />
          <span><small>planning</small><strong>Launch sequence</strong></span>
          <em>ready</em>
        </motion.div>
      </div>
    </motion.div>
  );
}

function VerifyScene({ progress }: { progress: MotionValue<number> }) {
  const presence = useScenePresence(progress, 0.58, 0.84);
  const local = useTransform(progress, [0.6, 0.82], [0, 1]);
  const mismatchOpacity = useTransform(local, [0.12, 0.28, 0.58, 0.72], [0, 1, 1, 0]);
  const verifiedOpacity = useTransform(local, [0.57, 0.78], [0, 1]);
  const verifiedY = useTransform(local, [0.57, 0.78], [12, 0]);

  return (
    <motion.div className="cortex-scene cortex-scene--verify" style={presence}>
      <span className="cortex-scene__caption">REVIEW</span>
      <div className="cortex-review">
        <div className="cortex-review__head">
          <span>Mission review</span>
          <em>3 checks</em>
        </div>
        <div className="cortex-review__row"><i className="is-ok" /><span>Evidence attached</span><b>pass</b></div>
        <div className="cortex-review__row"><i className="is-ok" /><span>Scope respected</span><b>pass</b></div>
        <motion.div className="cortex-review__row cortex-review__row--mismatch" style={{ opacity: mismatchOpacity }}>
          <i /><span>Constraint alignment</span><b>revise</b>
        </motion.div>
        <motion.div className="cortex-review__verified" style={{ opacity: verifiedOpacity, y: verifiedY }}>
          <i /> verified after revision
        </motion.div>
      </div>
    </motion.div>
  );
}

function ReturnScene({ progress }: { progress: MotionValue<number> }) {
  const presence = useScenePresence(progress, 0.78, 1);
  const local = useTransform(progress, [0.8, 1], [0, 1]);
  const contentOpacity = useTransform(local, [0.22, 0.5], [0, 1]);
  const resultY = useTransform(local, [0, 0.62], [26, 0]);

  return (
    <motion.div className="cortex-scene cortex-scene--return" style={presence}>
      <span className="cortex-scene__caption">HANDOFF</span>
      <motion.div className="cortex-result" style={{ y: resultY }}>
        <div className="cortex-result__status"><i /> VERIFIED</div>
        <strong>Launch strategy</strong>
        <motion.div className="cortex-result__meta" style={{ opacity: contentOpacity }}>
          <span><b>27</b> sources</span>
          <span><b>14</b> decisions</span>
          <span><b>1</b> trace</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function Journey() {
  const journeyRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const cameraX = useMotionValue(0);
  const cameraY = useMotionValue(0);
  const cameraScale = useMotionValue(1);
  const missionX = useMotionValue(220);
  const missionY = useMotionValue(620);
  const pathProgress = useMotionValue(0);

  const { scrollYProgress } = useScroll({
    target: journeyRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: prefersReducedMotion ? 1000 : 115,
    damping: prefersReducedMotion ? 1000 : 34,
    mass: prefersReducedMotion ? 0.01 : 0.22,
    restDelta: 0.0005,
  });

  const objectiveBranch = useTransform(smoothProgress, [0.015, 0.13], [0, 1]);
  const routingBranch = useTransform(smoothProgress, [0.2, 0.34], [0, 1]);
  const executionBranch = useTransform(smoothProgress, [0.39, 0.56], [0, 1]);
  const verifyBranch = useTransform(smoothProgress, [0.61, 0.76], [0, 1]);
  const returnBranch = useTransform(smoothProgress, [0.81, 0.94], [0, 1]);

  const packetOneX = useTransform(smoothProgress, [0.4, 0.51, 0.62], [2860, 3280, 3590]);
  const packetOneY = useTransform(smoothProgress, [0.4, 0.5, 0.62], [575, 390, 555]);
  const packetTwoX = useTransform(smoothProgress, [0.42, 0.53, 0.63], [2880, 3290, 3600]);
  const packetTwoY = useTransform(smoothProgress, [0.42, 0.53, 0.63], [575, 705, 555]);
  const packetOpacity = useTransform(smoothProgress, [0.39, 0.44, 0.6, 0.65], [0, 1, 1, 0]);

  useMotionValueEvent(smoothProgress, "change", (progress) => {
    const path = pathRef.current;
    if (!path) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const responsiveScale = viewportScale(width);
    const mappedProgress = prefersReducedMotion
      ? Math.round(progress * 4) / 4
      : pathProgressForScroll(progress);

    pathProgress.set(mappedProgress);

    const length = path.getTotalLength();
    const point = path.getPointAtLength(length * mappedProgress);

    const scale = responsiveScale * interpolateKeyframes(
      progress,
      [0, 0.18, 0.35, 0.5, 0.66, 0.82, 1],
      [1.01, 0.97, 1.02, 0.985, 1.015, 0.97, 1],
    );

    const focusX = width <= 720
      ? 0.5
      : interpolateKeyframes(
          progress,
          [0, 0.17, 0.31, 0.48, 0.64, 0.8, 1],
          [0.56, 0.46, 0.54, 0.44, 0.55, 0.47, 0.52],
        );

    const focusY = width <= 720
      ? 0.34
      : interpolateKeyframes(
          progress,
          [0, 0.2, 0.42, 0.62, 0.8, 1],
          [0.52, 0.48, 0.54, 0.5, 0.56, 0.52],
        );

    missionX.set(point.x);
    missionY.set(point.y);
    cameraScale.set(scale);
    cameraX.set(width * focusX - point.x * scale);
    cameraY.set(height * focusY - point.y * scale);
  });

  useEffect(() => {
    const sync = () => {
      const path = pathRef.current;
      if (!path) return;
      const progress = smoothProgress.get();
      const mappedProgress = pathProgressForScroll(progress);
      const point = path.getPointAtLength(path.getTotalLength() * mappedProgress);
      const width = window.innerWidth;
      const scale = viewportScale(width);
      cameraScale.set(scale);
      cameraX.set(width * (width <= 720 ? 0.5 : 0.52) - point.x * scale);
      cameraY.set(window.innerHeight * (width <= 720 ? 0.34 : 0.52) - point.y * scale);
    };

    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [cameraScale, cameraX, cameraY, smoothProgress]);

  return (
    <section
      ref={journeyRef}
      id="journey"
      className="cortex-journey"
      data-reduced-motion={prefersReducedMotion ? "true" : "false"}
      aria-label="How Cortex turns one objective into verified work"
    >
      <div className="cortex-journey__stage" aria-hidden="true">
        <motion.div className="cortex-world" style={{ x: cameraX, y: cameraY, scale: cameraScale }}>
          <svg className="cortex-world__svg" viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`} fill="none">
            <defs>
              <linearGradient id="cortex-thread-gradient" x1="220" y1="620" x2="6030" y2="620" gradientUnits="userSpaceOnUse">
                <stop stopColor="#5266F2" />
                <stop offset="0.52" stopColor="#776DF4" />
                <stop offset="1" stopColor="#A6AEFF" />
              </linearGradient>
            </defs>

            <path className="cortex-thread cortex-thread--ghost" d={PATH_D} />
            <motion.path className="cortex-thread cortex-thread--active" d={PATH_D} style={{ pathLength: pathProgress }} />
            <path ref={pathRef} className="cortex-thread__measure" d={PATH_D} />

            <g className="cortex-flow cortex-flow--objective">
              <motion.path d="M430 280C500 345 570 420 660 505" style={{ pathLength: objectiveBranch }} />
              <motion.path d="M660 210C665 330 665 420 665 505" style={{ pathLength: objectiveBranch }} />
              <motion.path d="M900 295C815 365 760 430 690 510" style={{ pathLength: objectiveBranch }} />
            </g>

            <g className="cortex-flow cortex-flow--routing">
              <motion.path d="M1670 565C1820 390 1970 330 2150 330" style={{ pathLength: routingBranch }} />
              <motion.path d="M1670 565C1860 545 2000 520 2240 410" style={{ pathLength: routingBranch }} />
              <motion.path d="M1670 565C1835 695 2020 730 2190 700" style={{ pathLength: routingBranch }} />
            </g>

            <g className="cortex-flow cortex-flow--execution">
              <motion.path d="M2860 575C3070 360 3340 345 3590 555" style={{ pathLength: executionBranch }} />
              <motion.path d="M2880 575C3130 575 3370 575 3590 555" style={{ pathLength: executionBranch }} />
              <motion.path d="M2860 575C3080 760 3360 770 3590 555" style={{ pathLength: executionBranch }} />
            </g>

            <g className="cortex-flow cortex-flow--verify">
              <motion.path d="M4100 495C4350 345 4650 440 4690 680C4720 850 4540 960 4300 900C4100 850 3980 715 4055 595" style={{ pathLength: verifyBranch }} />
            </g>

            <g className="cortex-flow cortex-flow--return">
              <motion.path d="M4970 690C5170 380 5380 390 5510 530" style={{ pathLength: returnBranch }} />
              <motion.path d="M4970 690C5190 690 5360 620 5510 530" style={{ pathLength: returnBranch }} />
              <motion.path d="M4970 690C5200 875 5410 765 5510 530" style={{ pathLength: returnBranch }} />
            </g>
          </svg>

          <ObjectiveScene progress={smoothProgress} />
          <RoutingScene progress={smoothProgress} />
          <ExecutionScene progress={smoothProgress} />
          <VerifyScene progress={smoothProgress} />
          <ReturnScene progress={smoothProgress} />

          <motion.span className="cortex-packet cortex-packet--one" style={{ x: packetOneX, y: packetOneY, opacity: packetOpacity }} />
          <motion.span className="cortex-packet cortex-packet--two" style={{ x: packetTwoX, y: packetTwoY, opacity: packetOpacity }} />

          <motion.div className="cortex-mission" style={{ x: missionX, y: missionY }}>
            <span className="cortex-mission__surface"><CortexLogo aria-hidden="true" /></span>
          </motion.div>
        </motion.div>
      </div>

      <div className="cortex-journey__atmosphere" aria-hidden="true"><i /><i /><i /></div>

      <div className="cortex-journey__chapters">
        {stages.map((stage) => <Chapter stage={stage} progress={smoothProgress} key={stage.key} />)}
      </div>
    </section>
  );
}
