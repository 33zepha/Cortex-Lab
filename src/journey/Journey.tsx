import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type SVGProps,
} from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ClaudeMark } from "@/components/brand/ClaudeMark";
import { CortexLogo } from "@/components/brand/CortexLogo";
import { DeepSeekMark, GeminiMark, MistralMark } from "@/components/brand/ProviderMarks";
import { OpenAiMark } from "@/components/brand/OpenAiMark";
import "./journey.css";

type ProviderMark = ComponentType<SVGProps<SVGSVGElement> & { title?: string }>;

type JourneyStage = {
  key: "objective" | "routing" | "execution" | "verify" | "return";
  number: string;
  label: string;
  title: string;
  copy: string;
  beats: string[];
};

const stages: JourneyStage[] = [
  {
    key: "objective",
    number: "01",
    label: "Objective",
    title: "An objective enters Cortex.",
    copy: "Intent, context and constraints are compressed into one mission state. That state becomes the reference for everything that follows.",
    beats: ["intent", "context", "constraints"],
  },
  {
    key: "routing",
    number: "02",
    label: "Routing",
    title: "Cortex chooses the path.",
    copy: "Hermes reads the shape of the work before choosing capabilities. Models appear only after the route has been decided.",
    beats: ["reason", "research", "execute"],
  },
  {
    key: "execution",
    number: "03",
    label: "Execution",
    title: "The work splits. The mission does not.",
    copy: "Research, planning and building move in parallel while sharing the same objective, constraints and mission state.",
    beats: ["distribute", "work", "recombine"],
  },
  {
    key: "verify",
    number: "04",
    label: "Verify",
    title: "Nothing leaves unchecked.",
    copy: "A mismatch cannot slip through the handoff. Cortex loops through inspection, testing and revision until the gate can open.",
    beats: ["inspect", "test", "revise"],
  },
  {
    key: "return",
    number: "05",
    label: "Return",
    title: "The complexity collapses back down.",
    copy: "Branches, evidence and decisions recombine into one calm result that remains traceable to the original objective.",
    beats: ["work", "evidence", "decisions"],
  },
];

const providers: Array<{ name: string; signal: string; Mark: ProviderMark }> = [
  { name: "Claude", signal: "reason", Mark: ClaudeMark },
  { name: "Codex", signal: "build", Mark: OpenAiMark },
  { name: "DeepSeek", signal: "runtime", Mark: DeepSeekMark },
  { name: "Gemini", signal: "context", Mark: GeminiMark },
  { name: "Mistral", signal: "runtime", Mark: MistralMark },
];

const WORLD_WIDTH = 6200;
const WORLD_HEIGHT = 1200;

const PATH_D =
  "M260 600 C430 600 500 430 670 430 C850 430 930 590 1120 590 C1290 590 1370 360 1550 360 C1730 360 1810 500 1980 500 C2170 500 2240 280 2430 280 C2600 280 2710 430 2920 430 C3110 430 3190 650 3390 650 C3560 650 3630 420 3820 420 C3980 420 4050 300 4210 300 C4380 300 4470 405 4540 500 C4600 580 4630 700 4540 770 C4430 855 4250 790 4250 635 C4250 505 4380 445 4510 485 C4680 535 4740 720 4880 750 C5050 785 5160 640 5240 540 C5370 380 5530 455 5680 560 C5810 650 5930 600 6040 600";

const STAGE_BOUNDS = [0, 0.19, 0.39, 0.61, 0.82, 1] as const;
const PATH_BOUNDS = [0.01, 0.18, 0.36, 0.61, 0.85, 0.995] as const;
const DESKTOP_FOCUS_X = [0.62, 0.38, 0.61, 0.39, 0.59, 0.52] as const;
const DESKTOP_FOCUS_Y = [0.49, 0.47, 0.5, 0.51, 0.49, 0.5] as const;
const CAMERA_SCALE = [1, 0.95, 1.05, 0.985, 1.015, 1] as const;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

function smoothstep(value: number) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

function stageFromProgress(progress: number) {
  const clamped = clamp(progress);
  for (let index = 0; index < stages.length; index += 1) {
    if (clamped < STAGE_BOUNDS[index + 1]!) return index;
  }
  return stages.length - 1;
}

function stageLocalProgress(progress: number, index: number) {
  const start = STAGE_BOUNDS[index]!;
  const end = STAGE_BOUNDS[index + 1]!;
  return clamp((progress - start) / Math.max(end - start, 0.0001));
}

function semanticPathProgress(progress: number) {
  const stage = stageFromProgress(progress);
  const local = smoothstep(stageLocalProgress(progress, stage));
  return lerp(PATH_BOUNDS[stage]!, PATH_BOUNDS[stage + 1]!, local);
}

function viewportScale(width: number) {
  if (width <= 560) return 0.68;
  if (width <= 900) return 0.82;
  if (width <= 1180) return 0.92;
  return 1;
}

function Chapter({ stage, index }: { stage: JourneyStage; index: number }) {
  return (
    <article id={`journey-${stage.key}`} className={`cortex-chapter cortex-chapter--${stage.key}`} data-chapter={index}>
      <div className="cortex-chapter__sticky">
        <div className="cortex-chapter__copy">
          <div className="cortex-chapter__meta">
            <span>{stage.number}</span>
            <i aria-hidden="true" />
            <span>{stage.label}</span>
          </div>
          <h2>{stage.title}</h2>
          <p>{stage.copy}</p>
          <div className="cortex-chapter__beats" aria-hidden="true">
            {stage.beats.map((beat, beatIndex) => (
              <span key={beat}>
                {beatIndex > 0 && <i />}
                {beat}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export function Journey() {
  const journeyRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [activeStage, setActiveStage] = useState(0);

  const cameraX = useMotionValue(0);
  const cameraY = useMotionValue(0);
  const cameraScale = useMotionValue(1);
  const cameraRotate = useMotionValue(0);
  const missionX = useMotionValue(260);
  const missionY = useMotionValue(600);
  const shellRotate = useMotionValue(0);
  const pathProgress = useMotionValue(0);

  const { scrollYProgress } = useScroll({
    target: journeyRef,
    offset: ["start start", "end end"],
  });

  const objectiveLocal = useTransform(scrollYProgress, [STAGE_BOUNDS[0], STAGE_BOUNDS[1]], [0, 1]);
  const routingLocal = useTransform(scrollYProgress, [STAGE_BOUNDS[1], STAGE_BOUNDS[2]], [0, 1]);
  const executionLocal = useTransform(scrollYProgress, [STAGE_BOUNDS[2], STAGE_BOUNDS[3]], [0, 1]);
  const verifyLocal = useTransform(scrollYProgress, [STAGE_BOUNDS[3], STAGE_BOUNDS[4]], [0, 1]);
  const returnLocal = useTransform(scrollYProgress, [STAGE_BOUNDS[4], STAGE_BOUNDS[5]], [0, 1]);

  const objectiveLines = useTransform(objectiveLocal, [0.04, 0.58], [0, 1]);
  const objectiveOpacity = useTransform(objectiveLocal, [0, 0.08, 0.78, 0.98], [0, 1, 1, 0.08]);
  const objectiveOverlayY = useTransform(objectiveLocal, [0.08, 0.48, 0.9], [32, 0, -14]);

  const routingBranches = useTransform(routingLocal, [0.04, 0.42], [0, 1]);
  const selectedRoute = useTransform(routingLocal, [0.3, 0.72], [0, 1]);
  const routingOverlayOpacity = useTransform(routingLocal, [0.08, 0.2, 0.86, 0.98], [0, 1, 1, 0]);
  const routingOverlayY = useTransform(routingLocal, [0.08, 0.42, 0.9], [28, 0, -12]);
  const providersOpacity = useTransform(routingLocal, [0.52, 0.7], [0, 1]);
  const providersY = useTransform(routingLocal, [0.52, 0.72], [12, 0]);

  const executionLanes = useTransform(executionLocal, [0.05, 0.38], [0, 1]);
  const executionOverlayOpacity = useTransform(executionLocal, [0.1, 0.22, 0.84, 0.98], [0, 1, 1, 0]);
  const executionOverlayY = useTransform(executionLocal, [0.1, 0.44, 0.9], [24, 0, -14]);
  const packetsOpacity = useTransform(executionLocal, [0.16, 0.25, 0.82, 0.94], [0, 1, 1, 0]);
  const packetOneX = useTransform(executionLocal, [0.18, 0.54, 0.88], [2920, 3420, 3820]);
  const packetOneY = useTransform(executionLocal, [0.18, 0.52, 0.88], [430, 255, 420]);
  const packetTwoX = useTransform(executionLocal, [0.2, 0.58, 0.9], [2940, 3460, 3820]);
  const packetTwoY = useTransform(executionLocal, [0.2, 0.56, 0.9], [442, 660, 420]);
  const packetThreeX = useTransform(executionLocal, [0.22, 0.6, 0.91], [2960, 3500, 3820]);
  const packetThreeY = useTransform(executionLocal, [0.22, 0.57, 0.91], [432, 505, 420]);

  const verifyRing = useTransform(verifyLocal, [0.03, 0.54], [0, 1]);
  const verifyOverlayOpacity = useTransform(verifyLocal, [0.08, 0.2, 0.86, 0.98], [0, 1, 1, 0]);
  const verifyOverlayY = useTransform(verifyLocal, [0.08, 0.46, 0.9], [24, 0, -10]);
  const mismatchOpacity = useTransform(verifyLocal, [0.24, 0.38, 0.63, 0.72], [0, 1, 1, 0]);
  const verifiedOpacity = useTransform(verifyLocal, [0.66, 0.82], [0, 1]);

  const returnLines = useTransform(returnLocal, [0.04, 0.5], [0, 1]);
  const returnOverlayOpacity = useTransform(returnLocal, [0.18, 0.42, 0.92], [0, 1, 1]);
  const returnOverlayY = useTransform(returnLocal, [0.18, 0.5, 0.92], [28, 0, -8]);
  const returnOverlayScale = useTransform(returnLocal, [0.2, 0.62], [0.97, 1]);

  const missionShellScale = useTransform(scrollYProgress, [0, 0.19, 0.39, 0.61, 0.82, 1], [0.94, 1, 1.04, 1.08, 1.03, 0.92]);
  const missionAuraOpacity = useTransform(scrollYProgress, [0, 0.08, 0.7, 0.92, 1], [0.35, 0.9, 0.85, 0.55, 0.18]);

  const updateCamera = (rawProgress: number) => {
    const path = pathRef.current;
    if (!path) return;

    const currentStage = stageFromProgress(rawProgress);
    const currentLocal = stageLocalProgress(rawProgress, currentStage);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const pathPosition = prefersReducedMotion
      ? PATH_BOUNDS[currentStage]!
      : semanticPathProgress(rawProgress);

    const totalLength = path.getTotalLength();
    const pathLength = totalLength * pathPosition;
    const point = path.getPointAtLength(pathLength);
    const before = path.getPointAtLength(Math.max(0, pathLength - 3));
    const after = path.getPointAtLength(Math.min(totalLength, pathLength + 3));
    const tangentAngle = Math.atan2(after.y - before.y, after.x - before.x) * (180 / Math.PI);

    const localEase = smoothstep(currentLocal);
    const responsiveScale = viewportScale(viewportWidth);
    const nextStage = Math.min(stages.length, currentStage + 1);
    const scale = responsiveScale * lerp(CAMERA_SCALE[currentStage]!, CAMERA_SCALE[nextStage]!, localEase);

    const focusX = viewportWidth <= 720
      ? 0.5
      : lerp(DESKTOP_FOCUS_X[currentStage]!, DESKTOP_FOCUS_X[nextStage]!, localEase);
    const focusY = viewportWidth <= 720
      ? 0.31
      : lerp(DESKTOP_FOCUS_Y[currentStage]!, DESKTOP_FOCUS_Y[nextStage]!, localEase);

    missionX.set(point.x);
    missionY.set(point.y);
    shellRotate.set(clamp(tangentAngle / 90, -1, 1) * 4.5);
    pathProgress.set(pathPosition);
    cameraScale.set(scale);
    cameraX.set(viewportWidth * focusX - point.x * scale);
    cameraY.set(viewportHeight * focusY - point.y * scale);
    cameraRotate.set(
      prefersReducedMotion || viewportWidth <= 720
        ? 0
        : Math.sin(rawProgress * Math.PI * 5) * 0.18,
    );

    const root = journeyRef.current;
    root?.style.setProperty("--journey-progress", rawProgress.toFixed(4));
    root?.style.setProperty("--stage-local", currentLocal.toFixed(4));
  };

  useMotionValueEvent(scrollYProgress, "change", (rawProgress) => {
    const currentStage = stageFromProgress(rawProgress);
    setActiveStage((previous) => (previous === currentStage ? previous : currentStage));
    updateCamera(rawProgress);
  });

  useEffect(() => {
    const syncCamera = () => updateCamera(scrollYProgress.get());
    syncCamera();
    window.addEventListener("resize", syncCamera);
    return () => window.removeEventListener("resize", syncCamera);
  }, [prefersReducedMotion, scrollYProgress]);

  return (
    <section
      ref={journeyRef}
      id="journey"
      className="cortex-journey"
      data-stage={activeStage}
      data-reduced-motion={prefersReducedMotion ? "true" : "false"}
      aria-label="How Cortex turns one objective into verified work"
    >
      <div className="cortex-journey__handoff" aria-hidden="true"><i /><span /></div>

      <div className="cortex-journey__world" aria-hidden="true">
        <motion.div
          className="cortex-world"
          style={{ x: cameraX, y: cameraY, scale: cameraScale, rotate: cameraRotate }}
        >
          <svg className="cortex-world__svg" viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`} fill="none">
            <defs>
              <linearGradient id="cortex-path-gradient" x1="260" y1="430" x2="6040" y2="620" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4054E8" />
                <stop offset="0.5" stopColor="#7772F2" />
                <stop offset="1" stopColor="#A5AEFF" />
              </linearGradient>
              <radialGradient id="cortex-field-blue">
                <stop stopColor="#586AF2" stopOpacity="0.12" />
                <stop offset="1" stopColor="#586AF2" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="cortex-field-violet">
                <stop stopColor="#8B7CF6" stopOpacity="0.1" />
                <stop offset="1" stopColor="#8B7CF6" stopOpacity="0" />
              </radialGradient>
              <filter id="cortex-path-soft" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" />
              </filter>
            </defs>

            <ellipse className="cortex-world__field cortex-world__field--one" cx="1150" cy="430" rx="760" ry="500" fill="url(#cortex-field-blue)" />
            <ellipse className="cortex-world__field cortex-world__field--two" cx="3270" cy="520" rx="920" ry="520" fill="url(#cortex-field-violet)" />
            <ellipse className="cortex-world__field cortex-world__field--three" cx="4680" cy="540" rx="760" ry="560" fill="url(#cortex-field-blue)" />

            <path className="cortex-world__contour cortex-world__contour--one" d="M80 945C720 760 1010 1000 1570 870S2620 710 3230 910 4280 980 4870 830 5670 710 6140 900" />
            <path className="cortex-world__contour cortex-world__contour--two" d="M150 210C780 385 1110 170 1650 300S2700 420 3270 250 4290 170 4890 330 5650 430 6110 250" />
            <path className="cortex-world__contour cortex-world__contour--three" d="M50 575C720 470 1080 690 1710 575S2770 470 3340 595 4270 660 4880 540 5600 470 6170 590" />

            <g className="cortex-world__layer cortex-world__layer--objective">
              <motion.path className="cortex-world__input" style={{ pathLength: objectiveLines }} d="M430 245C505 310 565 370 625 420" />
              <motion.path className="cortex-world__input" style={{ pathLength: objectiveLines }} d="M635 175C650 265 662 340 668 420" />
              <motion.path className="cortex-world__input" style={{ pathLength: objectiveLines }} d="M920 255C830 320 760 380 705 430" />
              <motion.g style={{ opacity: objectiveOpacity }}>
                <circle cx="430" cy="245" r="5" />
                <circle cx="635" cy="175" r="5" />
                <circle cx="920" cy="255" r="5" />
              </motion.g>
            </g>

            <g className="cortex-world__layer cortex-world__layer--routing">
              <motion.path className="cortex-world__branch" style={{ pathLength: routingBranches }} d="M1450 360C1600 215 1770 210 1950 250" />
              <motion.path className="cortex-world__branch" style={{ pathLength: routingBranches }} d="M1510 380C1690 395 1810 435 1980 500" />
              <motion.path className="cortex-world__branch" style={{ pathLength: routingBranches }} d="M1500 400C1650 580 1810 640 2010 665" />
              <motion.path className="cortex-world__route-selected" style={{ pathLength: selectedRoute }} d="M1510 380C1690 395 1810 435 1980 500" />
              <circle cx="1510" cy="380" r="13" />
            </g>

            <g className="cortex-world__layer cortex-world__layer--execution">
              <motion.path className="cortex-world__work-lane" style={{ pathLength: executionLanes }} d="M2760 410C2950 250 3220 230 3500 270 3650 292 3730 340 3820 420" />
              <motion.path className="cortex-world__work-lane" style={{ pathLength: executionLanes }} d="M2780 430C3010 430 3290 430 3820 420" />
              <motion.path className="cortex-world__work-lane" style={{ pathLength: executionLanes }} d="M2780 452C2970 650 3240 735 3500 650 3660 600 3740 500 3820 420" />
              <motion.path className="cortex-world__work-lane cortex-world__work-lane--ghost" style={{ pathLength: executionLanes }} d="M2860 360C3110 545 3460 535 3740 435" />
            </g>

            <g className="cortex-world__layer cortex-world__layer--verify">
              <motion.path className="cortex-world__verify-ring" style={{ pathLength: verifyRing }} d="M4210 300C4410 155 4700 220 4785 435 4860 625 4740 840 4530 860 4310 880 4130 720 4250 520" />
              <path className="cortex-world__verify-gate" d="M4142 250V350M4170 252V348" />
              <circle cx="4380" cy="278" r="5" />
              <circle cx="4740" cy="430" r="5" />
              <circle cx="4610" cy="818" r="5" />
              <circle cx="4260" cy="650" r="5" />
            </g>

            <g className="cortex-world__layer cortex-world__layer--return">
              <motion.path className="cortex-world__return-line" style={{ pathLength: returnLines }} d="M5220 295C5390 420 5530 500 5680 560" />
              <motion.path className="cortex-world__return-line" style={{ pathLength: returnLines }} d="M5200 535C5410 530 5520 540 5680 560" />
              <motion.path className="cortex-world__return-line" style={{ pathLength: returnLines }} d="M5240 790C5410 675 5540 600 5680 560" />
              <circle cx="5220" cy="295" r="4" />
              <circle cx="5200" cy="535" r="4" />
              <circle cx="5240" cy="790" r="4" />
            </g>

            <path className="cortex-world__rail cortex-world__rail--glow" d={PATH_D} filter="url(#cortex-path-soft)" />
            <path className="cortex-world__rail" d={PATH_D} />
            <motion.path className="cortex-world__rail-progress" d={PATH_D} style={{ pathLength: pathProgress }} />
            <path ref={pathRef} className="cortex-world__measure" d={PATH_D} />
          </svg>

          <motion.div className="cortex-world__overlay cortex-world__overlay--objective" style={{ opacity: objectiveOpacity, y: objectiveOverlayY }}>
            <div className="cortex-objective-signal"><span>intent</span><strong>launch Cortex</strong></div>
            <div className="cortex-objective-signal"><span>context</span><strong>AI operations</strong></div>
            <div className="cortex-objective-signal"><span>constraints</span><strong>time · budget · scope</strong></div>
            <div className="cortex-objective-lock"><i />mission state created</div>
          </motion.div>

          <motion.div className="cortex-world__overlay cortex-world__overlay--routing" style={{ opacity: routingOverlayOpacity, y: routingOverlayY }}>
            <div className="cortex-route-signals">
              <span><b>reasoning</b><i><em style={{ width: "91%" }} /></i><small>.91</small></span>
              <span><b>research</b><i><em style={{ width: "73%" }} /></i><small>.73</small></span>
              <span><b>execution</b><i><em style={{ width: "48%" }} /></i><small>.48</small></span>
            </div>
            <motion.div className="cortex-provider-strip" style={{ opacity: providersOpacity, y: providersY }}>
              {providers.map(({ name, signal, Mark }) => (
                <span className="cortex-provider" key={name}>
                  <Mark aria-hidden="true" />
                  <b>{name}</b>
                  <small>{signal}</small>
                </span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div className="cortex-world__overlay cortex-world__overlay--execution" style={{ opacity: executionOverlayOpacity, y: executionOverlayY }}>
            <div className="cortex-work-state cortex-work-state--research"><span>research</span><strong>competitor landscape</strong><small>12 sources</small></div>
            <div className="cortex-work-state cortex-work-state--build"><span>build</span><strong>landing prototype</strong><small>3 files changed</small></div>
            <div className="cortex-work-state cortex-work-state--plan"><span>plan</span><strong>launch sequencing</strong><small>ready</small></div>
          </motion.div>

          <motion.div className="cortex-world__overlay cortex-world__overlay--verify" style={{ opacity: verifyOverlayOpacity, y: verifyOverlayY }}>
            <div className="cortex-verify-steps"><span>inspect</span><i /><span>test</span><i /><span>compare</span><i /><span>revise</span></div>
            <motion.div className="cortex-verify-status cortex-verify-status--mismatch" style={{ opacity: mismatchOpacity }}><i />constraint mismatch</motion.div>
            <motion.div className="cortex-verify-status cortex-verify-status--ok" style={{ opacity: verifiedOpacity }}><i />verified · gate open</motion.div>
          </motion.div>

          <motion.div className="cortex-world__overlay cortex-world__overlay--return" style={{ opacity: returnOverlayOpacity, y: returnOverlayY, scale: returnOverlayScale }}>
            <div className="cortex-result">
              <div className="cortex-result__head"><span>verified result</span><b>ready</b></div>
              <strong>Launch strategy</strong>
              <p>One result. The work behind it stays attached.</p>
              <div className="cortex-result__proof"><span>27 sources</span><span>14 decisions</span><span>trace available</span></div>
            </div>
          </motion.div>

          <motion.div className="cortex-packet cortex-packet--one" style={{ x: packetOneX, y: packetOneY, opacity: packetsOpacity }} />
          <motion.div className="cortex-packet cortex-packet--two" style={{ x: packetTwoX, y: packetTwoY, opacity: packetsOpacity }} />
          <motion.div className="cortex-packet cortex-packet--three" style={{ x: packetThreeX, y: packetThreeY, opacity: packetsOpacity }} />

          <motion.div className="cortex-mission" style={{ x: missionX, y: missionY }}>
            <motion.span className="cortex-mission__shell" style={{ rotate: shellRotate, scale: missionShellScale }} />
            <motion.span className="cortex-mission__aura" style={{ opacity: missionAuraOpacity }} />
            <CortexLogo aria-hidden="true" />
            <span className="cortex-mission__state" />
          </motion.div>
        </motion.div>
      </div>

      <div className="cortex-journey__ambient" aria-hidden="true"><span /><span /><span /></div>

      <div className="cortex-journey__chapters">
        {stages.map((stage, index) => <Chapter stage={stage} index={index} key={stage.key} />)}
      </div>
    </section>
  );
}
