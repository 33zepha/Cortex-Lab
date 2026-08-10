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
};

const stages: JourneyStage[] = [
  {
    key: "objective",
    number: "01",
    label: "Objective",
    title: "A human objective becomes a mission.",
    copy: "Intent, context and constraints converge into one state Cortex can keep intact through the entire run.",
  },
  {
    key: "routing",
    number: "02",
    label: "Routing",
    title: "The system decides how the mission should think.",
    copy: "Hermes weighs the work first, then composes the capabilities that fit it. Providers are an outcome of the decision, not the interface.",
  },
  {
    key: "execution",
    number: "03",
    label: "Execution",
    title: "One mission becomes coordinated parallel work.",
    copy: "Research, planning, building and review can diverge without losing the shared objective. Their work keeps moving while Cortex advances.",
  },
  {
    key: "verify",
    number: "04",
    label: "Verify",
    title: "The path only opens when the work holds up.",
    copy: "Inspection, testing, comparison and revision form a real gate in the journey. A mismatch loops back instead of being hidden in the handoff.",
  },
  {
    key: "return",
    number: "05",
    label: "Return",
    title: "Complex work returns as one verified result.",
    copy: "The branches collapse back into a calm handoff with evidence, important decisions and traceability still attached.",
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

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function stageFromProgress(progress: number) {
  return Math.min(stages.length - 1, Math.floor(clamp(progress) * stages.length));
}

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

function Chapter({ stage, index }: { stage: JourneyStage; index: number }) {
  return (
    <article className={`cortex-chapter cortex-chapter--${stage.key}`} data-chapter={index}>
      <div className="cortex-chapter__sticky">
        <div className="cortex-chapter__copy">
          <div className="cortex-chapter__meta">
            <span>{stage.number}</span>
            <span>{stage.label}</span>
          </div>
          <h2>{stage.title}</h2>
          <p>{stage.copy}</p>
          {stage.key === "objective" && (
            <div className="cortex-chapter__microline"><span>intent</span><span>context</span><span>constraints</span></div>
          )}
          {stage.key === "routing" && (
            <div className="cortex-chapter__microline"><span>reasoning</span><span>research</span><span>execution</span></div>
          )}
          {stage.key === "execution" && (
            <div className="cortex-chapter__microline"><span>distribute</span><span>work</span><span>recombine</span></div>
          )}
          {stage.key === "verify" && (
            <div className="cortex-chapter__microline"><span>inspect</span><span>test</span><span>revise</span></div>
          )}
          {stage.key === "return" && (
            <div className="cortex-chapter__microline"><span>work</span><span>evidence</span><span>decisions</span></div>
          )}
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

  const packetOneX = useTransform(scrollYProgress, [0.39, 0.54, 0.63], [2920, 3390, 3760]);
  const packetOneY = useTransform(scrollYProgress, [0.39, 0.49, 0.63], [430, 270, 420]);
  const packetTwoX = useTransform(scrollYProgress, [0.41, 0.56, 0.64], [2940, 3430, 3770]);
  const packetTwoY = useTransform(scrollYProgress, [0.41, 0.51, 0.64], [440, 650, 425]);
  const packetThreeX = useTransform(scrollYProgress, [0.43, 0.57, 0.65], [2960, 3500, 3785]);
  const packetThreeY = useTransform(scrollYProgress, [0.43, 0.52, 0.65], [430, 520, 420]);
  const packetsOpacity = useTransform(scrollYProgress, [0.37, 0.42, 0.64, 0.68], [0, 1, 1, 0]);

  useMotionValueEvent(scrollYProgress, "change", (rawProgress) => {
    const currentStage = stageFromProgress(rawProgress);
    setActiveStage((previous) => (previous === currentStage ? previous : currentStage));

    const effectiveProgress = prefersReducedMotion
      ? currentStage / Math.max(stages.length - 1, 1)
      : clamp((rawProgress - 0.012) / 0.976);

    pathProgress.set(effectiveProgress);

    const path = pathRef.current;
    if (!path) return;

    const length = path.getTotalLength();
    const pathLength = effectiveProgress * length;
    const point = path.getPointAtLength(pathLength);
    const before = path.getPointAtLength(Math.max(0, pathLength - 2));
    const after = path.getPointAtLength(Math.min(length, pathLength + 2));
    const tangentAngle = Math.atan2(after.y - before.y, after.x - before.x) * (180 / Math.PI);

    const scale = interpolateKeyframes(
      rawProgress,
      [0, 0.16, 0.31, 0.42, 0.56, 0.69, 0.84, 1],
      [1, 0.98, 0.91, 1.03, 1.08, 0.93, 0.98, 1.02],
    );
    const focusX = interpolateKeyframes(rawProgress, [0, 0.2, 0.4, 0.7, 1], [0.5, 0.48, 0.45, 0.48, 0.5]);
    const focusY = interpolateKeyframes(rawProgress, [0, 0.35, 0.58, 0.78, 1], [0.52, 0.5, 0.54, 0.52, 0.5]);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    missionX.set(point.x);
    missionY.set(point.y);
    shellRotate.set(clamp(tangentAngle / 90, -1, 1) * 5);
    cameraScale.set(scale);
    cameraX.set(viewportWidth * focusX - point.x * scale);
    cameraY.set(viewportHeight * focusY - point.y * scale);
    cameraRotate.set(
      prefersReducedMotion
        ? 0
        : interpolateKeyframes(rawProgress, [0, 0.24, 0.4, 0.58, 0.72, 0.9, 1], [0, -0.35, 0.2, -0.25, 0.35, 0, 0]),
    );

    const root = journeyRef.current;
    root?.style.setProperty("--journey-progress", rawProgress.toFixed(4));
    root?.style.setProperty("--chapter-progress", ((rawProgress * stages.length) % 1).toFixed(4));
  });

  useEffect(() => {
    const syncCamera = () => {
      const path = pathRef.current;
      if (!path) return;
      const progress = scrollYProgress.get();
      const effectiveProgress = prefersReducedMotion
        ? stageFromProgress(progress) / Math.max(stages.length - 1, 1)
        : clamp((progress - 0.012) / 0.976);
      const point = path.getPointAtLength(path.getTotalLength() * effectiveProgress);
      const scale = cameraScale.get();
      cameraX.set(window.innerWidth * 0.48 - point.x * scale);
      cameraY.set(window.innerHeight * 0.52 - point.y * scale);
    };

    syncCamera();
    window.addEventListener("resize", syncCamera);
    return () => window.removeEventListener("resize", syncCamera);
  }, [cameraScale, cameraX, cameraY, prefersReducedMotion, scrollYProgress]);

  return (
    <section
      ref={journeyRef}
      id="journey"
      className="cortex-journey"
      data-stage={activeStage}
      data-reduced-motion={prefersReducedMotion ? "true" : "false"}
      aria-label="How Cortex turns one objective into verified work"
    >
      <div className="cortex-journey__world" aria-hidden="true">
        <motion.div
          className="cortex-world"
          style={{ x: cameraX, y: cameraY, scale: cameraScale, rotate: cameraRotate }}
        >
          <svg className="cortex-world__svg" viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`} fill="none">
            <defs>
              <linearGradient id="cortex-path-gradient" x1="260" y1="430" x2="6040" y2="620" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4054E8" />
                <stop offset="0.48" stopColor="#7772F2" />
                <stop offset="1" stopColor="#A5AEFF" />
              </linearGradient>
              <linearGradient id="cortex-faint-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop stopColor="#586AF2" stopOpacity="0" />
                <stop offset="0.5" stopColor="#586AF2" stopOpacity="0.18" />
                <stop offset="1" stopColor="#8B7CF6" stopOpacity="0" />
              </linearGradient>
              <filter id="cortex-path-soft" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
            </defs>

            <path className="cortex-world__horizon" d="M0 600H6200" />
            <path className="cortex-world__contour cortex-world__contour--one" d="M80 945C720 760 1010 1000 1570 870S2620 710 3230 910 4280 980 4870 830 5670 710 6140 900" />
            <path className="cortex-world__contour cortex-world__contour--two" d="M150 210C780 385 1110 170 1650 300S2700 420 3270 250 4290 170 4890 330 5650 430 6110 250" />

            <g className="cortex-world__layer cortex-world__layer--objective">
              <path className="cortex-world__input" d="M430 245L625 420M635 175L668 420M920 255L705 430" />
              <circle cx="430" cy="245" r="5" />
              <circle cx="635" cy="175" r="5" />
              <circle cx="920" cy="255" r="5" />
            </g>

            <g className="cortex-world__layer cortex-world__layer--routing">
              <path className="cortex-world__branch" d="M1450 360C1600 215 1770 210 1950 250" />
              <path className="cortex-world__branch" d="M1510 380C1690 395 1810 435 1980 500" />
              <path className="cortex-world__branch" d="M1500 400C1650 580 1810 640 2010 665" />
              <path className="cortex-world__route-selected" d="M1510 380C1690 395 1810 435 1980 500" />
              <circle cx="1510" cy="380" r="14" />
            </g>

            <g className="cortex-world__layer cortex-world__layer--execution">
              <path className="cortex-world__work-lane" d="M2760 410C2950 250 3220 230 3500 270 3650 292 3730 340 3820 420" />
              <path className="cortex-world__work-lane" d="M2780 430C3010 430 3290 430 3820 420" />
              <path className="cortex-world__work-lane" d="M2780 452C2970 650 3240 735 3500 650 3660 600 3740 500 3820 420" />
              <path className="cortex-world__work-lane cortex-world__work-lane--ghost" d="M2860 360C3110 545 3460 535 3740 435" />
            </g>

            <g className="cortex-world__layer cortex-world__layer--verify">
              <path className="cortex-world__verify-ring" d="M4210 300C4410 155 4700 220 4785 435 4860 625 4740 840 4530 860 4310 880 4130 720 4250 520" />
              <path className="cortex-world__verify-gate" d="M4142 250V350M4170 252V348" />
              <circle cx="4380" cy="278" r="5" />
              <circle cx="4740" cy="430" r="5" />
              <circle cx="4610" cy="818" r="5" />
              <circle cx="4260" cy="650" r="5" />
            </g>

            <g className="cortex-world__layer cortex-world__layer--return">
              <path className="cortex-world__return-line" d="M5220 295C5390 420 5530 500 5680 560" />
              <path className="cortex-world__return-line" d="M5200 535C5410 530 5520 540 5680 560" />
              <path className="cortex-world__return-line" d="M5240 790C5410 675 5540 600 5680 560" />
              <circle cx="5220" cy="295" r="4" />
              <circle cx="5200" cy="535" r="4" />
              <circle cx="5240" cy="790" r="4" />
            </g>

            <path className="cortex-world__rail cortex-world__rail--glow" d={PATH_D} filter="url(#cortex-path-soft)" />
            <path className="cortex-world__rail" d={PATH_D} />
            <motion.path className="cortex-world__rail-progress" d={PATH_D} style={{ pathLength: pathProgress }} />
            <path ref={pathRef} className="cortex-world__measure" d={PATH_D} />
          </svg>

          <div className="cortex-world__overlay cortex-world__overlay--objective">
            <span className="cortex-world__kicker">MISSION INPUT</span>
            <div className="cortex-objective-signal"><span>intent</span><strong>launch Cortex</strong></div>
            <div className="cortex-objective-signal"><span>context</span><strong>AI operations</strong></div>
            <div className="cortex-objective-signal"><span>constraints</span><strong>time · budget · scope</strong></div>
            <div className="cortex-objective-lock"><i />objective locked</div>
          </div>

          <div className="cortex-world__overlay cortex-world__overlay--routing">
            <span className="cortex-world__kicker">ROUTE ANALYSIS</span>
            <div className="cortex-route-signals">
              <span><i style={{ "--signal": ".91" } as React.CSSProperties} />reasoning <b>.91</b></span>
              <span><i style={{ "--signal": ".73" } as React.CSSProperties} />research <b>.73</b></span>
              <span><i style={{ "--signal": ".48" } as React.CSSProperties} />execution <b>.48</b></span>
            </div>
            <div className="cortex-provider-row">
              {providers.map(({ name, signal, Mark }) => (
                <div className="cortex-provider" key={name}>
                  <Mark aria-hidden="true" />
                  <span><strong>{name}</strong><small>{signal}</small></span>
                </div>
              ))}
            </div>
          </div>

          <div className="cortex-world__overlay cortex-world__overlay--execution">
            <span className="cortex-world__kicker">SHARED MISSION STATE</span>
            <div className="cortex-work-state cortex-work-state--research"><span>research</span><strong>competitor landscape</strong><small>12 sources</small></div>
            <div className="cortex-work-state cortex-work-state--build"><span>build</span><strong>landing prototype</strong><small>3 files changed</small></div>
            <div className="cortex-work-state cortex-work-state--plan"><span>plan</span><strong>launch sequencing</strong><small>ready</small></div>
          </div>

          <div className="cortex-world__overlay cortex-world__overlay--verify">
            <span className="cortex-world__kicker">QUALITY GATE</span>
            <div className="cortex-verify-steps">
              <span>inspect</span><span>test</span><span>compare</span><span>revise</span>
            </div>
            <div className="cortex-verify-status"><i />constraint mismatch</div>
            <div className="cortex-verify-status cortex-verify-status--ok"><i />verified</div>
          </div>

          <div className="cortex-world__overlay cortex-world__overlay--return">
            <span className="cortex-world__kicker">VERIFIED HANDOFF</span>
            <div className="cortex-result">
              <div><span>RESULT</span><b>READY</b></div>
              <strong>Launch strategy</strong>
              <p>Work, evidence and decisions return together.</p>
              <ul><li>27 sources</li><li>14 decisions</li><li>trace available</li></ul>
            </div>
          </div>

          <motion.div className="cortex-packet cortex-packet--one" style={{ x: packetOneX, y: packetOneY, opacity: packetsOpacity }} />
          <motion.div className="cortex-packet cortex-packet--two" style={{ x: packetTwoX, y: packetTwoY, opacity: packetsOpacity }} />
          <motion.div className="cortex-packet cortex-packet--three" style={{ x: packetThreeX, y: packetThreeY, opacity: packetsOpacity }} />

          <motion.div className="cortex-mission" style={{ x: missionX, y: missionY }}>
            <motion.span className="cortex-mission__shell" style={{ rotate: shellRotate }} />
            <span className="cortex-mission__aura" />
            <CortexLogo aria-hidden="true" />
            <span className="cortex-mission__label">mission</span>
          </motion.div>
        </motion.div>
      </div>

      <div className="cortex-journey__ambient" aria-hidden="true"><span /><span /><span /></div>

      <div className="cortex-journey__chapters">
        {stages.map((stage, index) => <Chapter stage={stage} index={index} key={stage.key} />)}
      </div>

      <nav className="cortex-journey__progress" aria-label="Cortex journey progress">
        {stages.map((stage, index) => (
          <a key={stage.key} href={`#journey-${stage.key}`} className={index === activeStage ? "is-active" : index < activeStage ? "is-past" : ""} onClick={(event) => {
            event.preventDefault();
            const root = journeyRef.current;
            if (!root) return;
            const maxScroll = Math.max(root.offsetHeight - window.innerHeight, 1);
            window.scrollTo({
              top: root.offsetTop + maxScroll * ((index + 0.5) / stages.length),
              behavior: prefersReducedMotion ? "auto" : "smooth",
            });
          }}>
            <span>{stage.number}</span><i />
          </a>
        ))}
      </nav>

      <span className="cortex-journey__counter" aria-hidden="true">{stages[activeStage]?.number ?? "01"} / 05</span>
    </section>
  );
}
