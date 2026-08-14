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
import "./journey-polish.css";

type ProviderMark = ComponentType<SVGProps<SVGSVGElement> & { title?: string }>;
type StageKey = "objective" | "routing" | "execution" | "verify" | "return";

type JourneyStage = {
  key: StageKey;
  label: string;
  title: string;
  copy: string;
  start: number;
  end: number;
  drift: number;
};

const stages: JourneyStage[] = [
  {
    key: "objective",
    label: "Objective",
    title: "Give Cortex the outcome, not the workflow.",
    copy: "Intent, context and constraints resolve into one living mission.",
    start: 0,
    end: 0.22,
    drift: 22,
  },
  {
    key: "routing",
    label: "Routing",
    title: "The mission finds the right intelligence.",
    copy: "Cortex weighs the work before it chooses the capabilities behind it.",
    start: 0.17,
    end: 0.43,
    drift: -24,
  },
  {
    key: "execution",
    label: "Execution",
    title: "Work fans out. Context stays whole.",
    copy: "Specialists move in parallel while the objective remains shared.",
    start: 0.36,
    end: 0.66,
    drift: 18,
  },
  {
    key: "verify",
    label: "Verification",
    title: "Nothing leaves unchecked.",
    copy: "A weak result loops back through evidence, revision and review.",
    start: 0.58,
    end: 0.85,
    drift: -20,
  },
  {
    key: "return",
    label: "Return",
    title: "Complexity collapses into a clear handoff.",
    copy: "The result arrives with the reasoning and evidence still attached.",
    start: 0.77,
    end: 1,
    drift: 16,
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

function useScenePresence(
  progress: MotionValue<number>,
  start: number,
  end: number,
  drift = 18,
) {
  const fadeIn = Math.min(start + 0.065, end);
  const fadeOut = Math.max(end - 0.07, start);
  const opacity = useTransform(progress, [start, fadeIn, fadeOut, end], [0, 1, 1, 0]);
  const y = useTransform(progress, [start, fadeIn, fadeOut, end], [28, 0, 0, -20]);
  const x = useTransform(progress, [start, fadeIn, fadeOut, end], [drift, 0, 0, drift * -0.55]);
  const scale = useTransform(progress, [start, fadeIn, fadeOut, end], [0.982, 1, 1, 0.992]);
  const filter = useTransform(
    progress,
    [start, fadeIn, fadeOut, end],
    ["blur(8px)", "blur(0px)", "blur(0px)", "blur(6px)"],
  );

  return { opacity, y, x, scale, filter };
}

function Chapter({ stage, progress }: { stage: JourneyStage; progress: MotionValue<number> }) {
  const presence = useScenePresence(progress, stage.start, stage.end, stage.drift);
  const local = useTransform(progress, [stage.start, stage.end], [0, 1]);
  const lineScale = useTransform(local, [0.06, 0.42, 0.9], [0, 1, 1]);

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
  const presence = useScenePresence(progress, 0, 0.235, 16);
  const local = useTransform(progress, [0, 0.21], [0, 1]);
  const metadataOpacity = useTransform(local, [0.2, 0.46], [0, 1]);
  const metadataY = useTransform(local, [0.2, 0.5], [10, 0]);
  const lockOpacity = useTransform(local, [0.56, 0.8], [0, 1]);
  const promptY = useTransform(local, [0, 0.62], [14, 0]);
  const promptScale = useTransform(local, [0, 0.7], [0.985, 1]);

  return (
    <motion.div className="cortex-scene cortex-scene--objective" style={presence}>
      <span className="cortex-scene__caption">MISSION</span>
      <motion.div className="cortex-objective" style={{ y: promptY, scale: promptScale }}>
        <span className="cortex-objective__prompt">Launch Cortex publicly</span>
        <motion.div
          className="cortex-objective__context"
          style={{ opacity: metadataOpacity, y: metadataY }}
        >
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
  const presence = useScenePresence(progress, 0.155, 0.455, -20);
  const local = useTransform(progress, [0.17, 0.43], [0, 1]);
  const providerOpacity = useTransform(local, [0.56, 0.76], [0, 1]);
  const providerY = useTransform(local, [0.56, 0.8], [8, 0]);
  const selectedOpacity = useTransform(local, [0.32, 0.54], [0, 1]);
  const selectedY = useTransform(local, [0.32, 0.58], [10, 0]);

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
          {scores.map((item, index) => (
            <div className="cortex-routing__signal" key={item.name} style={{ "--row": index } as CSSProperties}>
              <span>{item.name}</span>
              <i><b style={{ "--score": item.width } as CSSProperties} /></i>
              <em>{item.score}</em>
            </div>
          ))}
        </div>
        <motion.div
          className="cortex-routing__selected"
          style={{ opacity: selectedOpacity, y: selectedY }}
        >
          <span>route</span>
          <strong>reason + research + build</strong>
        </motion.div>
        <motion.div
          className="cortex-routing__providers"
          style={{ opacity: providerOpacity, y: providerY }}
        >
          {providers.map(({ name, Mark }) => (
            <span key={name} title={name}><Mark aria-hidden="true" /></span>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

function ExecutionScene({ progress }: { progress: MotionValue<number> }) {
  const presence = useScenePresence(progress, 0.34, 0.68, 18);
  const local = useTransform(progress, [0.36, 0.65], [0, 1]);
  const streamOneX = useTransform(local, [0.04, 0.42, 0.9], [-26, 0, 12]);
  const streamTwoX = useTransform(local, [0.08, 0.48, 0.92], [34, 0, -10]);
  const streamThreeX = useTransform(local, [0.12, 0.52, 0.94], [-18, 0, 8]);
  const streamOpacity = useTransform(local, [0.08, 0.25, 0.9, 1], [0, 1, 1, 0.68]);
  const streamSpread = useTransform(local, [0.12, 0.55, 0.9], [8, 18, 4]);

  return (
    <motion.div className="cortex-scene cortex-scene--execution" style={presence}>
      <span className="cortex-scene__caption">LIVE WORK</span>
      <motion.div className="cortex-execution" style={{ gap: streamSpread }}>
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
      </motion.div>
    </motion.div>
  );
}

function VerifyScene({ progress }: { progress: MotionValue<number> }) {
  const presence = useScenePresence(progress, 0.565, 0.865, -18);
  const local = useTransform(progress, [0.58, 0.84], [0, 1]);
  const mismatchOpacity = useTransform(local, [0.1, 0.26, 0.56, 0.7], [0, 1, 1, 0]);
  const mismatchX = useTransform(local, [0.1, 0.28, 0.68], [8, 0, -10]);
  const verifiedOpacity = useTransform(local, [0.56, 0.77], [0, 1]);
  const verifiedY = useTransform(local, [0.56, 0.77], [10, 0]);
  const surfaceScale = useTransform(local, [0.05, 0.48, 0.95], [0.99, 1, 0.995]);

  return (
    <motion.div className="cortex-scene cortex-scene--verify" style={presence}>
      <span className="cortex-scene__caption">REVIEW</span>
      <motion.div className="cortex-review" style={{ scale: surfaceScale }}>
        <div className="cortex-review__head">
          <span>Mission review</span>
          <em>3 checks</em>
        </div>
        <div className="cortex-review__row"><i className="is-ok" /><span>Evidence attached</span><b>pass</b></div>
        <div className="cortex-review__row"><i className="is-ok" /><span>Scope respected</span><b>pass</b></div>
        <motion.div
          className="cortex-review__row cortex-review__row--mismatch"
          style={{ opacity: mismatchOpacity, x: mismatchX }}
        >
          <i /><span>Constraint alignment</span><b>revise</b>
        </motion.div>
        <motion.div
          className="cortex-review__verified"
          style={{ opacity: verifiedOpacity, y: verifiedY }}
        >
          <i /> verified after revision
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function ReturnScene({ progress }: { progress: MotionValue<number> }) {
  const presence = useScenePresence(progress, 0.75, 1, 14);
  const local = useTransform(progress, [0.77, 1], [0, 1]);
  const contentOpacity = useTransform(local, [0.2, 0.48], [0, 1]);
  const resultY = useTransform(local, [0, 0.58], [22, 0]);
  const resultScale = useTransform(local, [0, 0.58], [0.985, 1]);

  return (
    <motion.div className="cortex-scene cortex-scene--return" style={presence}>
      <span className="cortex-scene__caption">HANDOFF</span>
      <motion.div className="cortex-result" style={{ y: resultY, scale: resultScale }}>
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

  const missionProgress = useSpring(scrollYProgress, {
    stiffness: prefersReducedMotion ? 1000 : 165,
    damping: prefersReducedMotion ? 1000 : 38,
    mass: prefersReducedMotion ? 0.01 : 0.2,
    restDelta: 0.0004,
  });

  const sceneProgress = useSpring(scrollYProgress, {
    stiffness: prefersReducedMotion ? 1000 : 105,
    damping: prefersReducedMotion ? 1000 : 31,
    mass: prefersReducedMotion ? 0.01 : 0.3,
    restDelta: 0.0005,
  });

  const cameraProgress = useSpring(scrollYProgress, {
    stiffness: prefersReducedMotion ? 1000 : 68,
    damping: prefersReducedMotion ? 1000 : 27,
    mass: prefersReducedMotion ? 0.01 : 0.48,
    restDelta: 0.0006,
  });

  const objectiveBranch = useTransform(sceneProgress, [0.01, 0.14], [0, 1]);
  const routingBranch = useTransform(sceneProgress, [0.19, 0.35], [0, 1]);
  const executionBranch = useTransform(sceneProgress, [0.38, 0.57], [0, 1]);
  const verifyBranch = useTransform(sceneProgress, [0.6, 0.78], [0, 1]);
  const returnBranch = useTransform(sceneProgress, [0.8, 0.95], [0, 1]);

  const packetOneX = useTransform(sceneProgress, [0.39, 0.51, 0.63], [2860, 3280, 3590]);
  const packetOneY = useTransform(sceneProgress, [0.39, 0.5, 0.63], [575, 390, 555]);
  const packetTwoX = useTransform(sceneProgress, [0.41, 0.53, 0.64], [2880, 3290, 3600]);
  const packetTwoY = useTransform(sceneProgress, [0.41, 0.53, 0.64], [575, 705, 555]);
  const packetOpacity = useTransform(sceneProgress, [0.38, 0.44, 0.6, 0.66], [0, 1, 1, 0]);

  const atmosphereOneX = useTransform(cameraProgress, [0, 0.45, 1], [0, 90, -20]);
  const atmosphereOneY = useTransform(cameraProgress, [0, 0.58, 1], [0, -45, 30]);
  const atmosphereTwoX = useTransform(cameraProgress, [0, 0.6, 1], [0, -120, 25]);
  const atmosphereTwoY = useTransform(cameraProgress, [0, 0.42, 1], [0, 55, -20]);
  const atmosphereThreeScale = useTransform(cameraProgress, [0, 0.5, 1], [0.92, 1.08, 0.96]);

  useMotionValueEvent(missionProgress, "change", (progress) => {
    const path = pathRef.current;
    if (!path) return;

    const mappedProgress = prefersReducedMotion
      ? Math.round(progress * 4) / 4
      : pathProgressForScroll(progress);

    pathProgress.set(mappedProgress);

    const length = path.getTotalLength();
    const point = path.getPointAtLength(length * mappedProgress);
    missionX.set(point.x);
    missionY.set(point.y);
  });

  useMotionValueEvent(cameraProgress, "change", (progress) => {
    const path = pathRef.current;
    if (!path) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const responsiveScale = viewportScale(width);
    const mappedProgress = prefersReducedMotion
      ? Math.round(progress * 4) / 4
      : pathProgressForScroll(progress);

    const point = path.getPointAtLength(path.getTotalLength() * mappedProgress);
    const scale = responsiveScale * interpolateKeyframes(
      progress,
      [0, 0.17, 0.34, 0.51, 0.67, 0.83, 1],
      [1, 0.982, 1.012, 0.992, 1.018, 0.986, 1],
    );

    const focusX = width <= 720
      ? 0.5
      : interpolateKeyframes(
          progress,
          [0, 0.16, 0.31, 0.47, 0.64, 0.8, 1],
          [0.57, 0.47, 0.54, 0.445, 0.555, 0.475, 0.52],
        );

    const focusY = width <= 720
      ? 0.34
      : interpolateKeyframes(
          progress,
          [0, 0.2, 0.41, 0.61, 0.8, 1],
          [0.52, 0.485, 0.545, 0.505, 0.555, 0.52],
        );

    cameraScale.set(scale);
    cameraX.set(width * focusX - point.x * scale);
    cameraY.set(height * focusY - point.y * scale);
  });

  useEffect(() => {
    const sync = () => {
      const path = pathRef.current;
      if (!path) return;
      const progress = cameraProgress.get();
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
  }, [cameraProgress, cameraScale, cameraX, cameraY]);

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

          <ObjectiveScene progress={sceneProgress} />
          <RoutingScene progress={sceneProgress} />
          <ExecutionScene progress={sceneProgress} />
          <VerifyScene progress={sceneProgress} />
          <ReturnScene progress={sceneProgress} />

          <motion.span className="cortex-packet cortex-packet--one" style={{ x: packetOneX, y: packetOneY, opacity: packetOpacity }} />
          <motion.span className="cortex-packet cortex-packet--two" style={{ x: packetTwoX, y: packetTwoY, opacity: packetOpacity }} />

          <motion.div className="cortex-mission" style={{ x: missionX, y: missionY }}>
            <span className="cortex-mission__surface"><CortexLogo aria-hidden="true" /></span>
          </motion.div>
        </motion.div>
      </div>

      <div className="cortex-journey__atmosphere" aria-hidden="true">
        <motion.i style={{ x: atmosphereOneX, y: atmosphereOneY }} />
        <motion.i style={{ x: atmosphereTwoX, y: atmosphereTwoY }} />
        <motion.i style={{ scale: atmosphereThreeScale }} />
      </div>

      <div className="cortex-journey__chapters">
        {stages.map((stage) => <Chapter stage={stage} progress={sceneProgress} key={stage.key} />)}
      </div>
    </section>
  );
}