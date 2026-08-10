import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentType,
  type FormEvent,
  type RefObject,
  type SVGProps,
} from "react";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { ClaudeMark } from "@/components/brand/ClaudeMark";
import { CortexLogo } from "@/components/brand/CortexLogo";
import { DeepSeekMark, GeminiMark, MistralMark } from "@/components/brand/ProviderMarks";
import { OpenAiMark } from "@/components/brand/OpenAiMark";
import "./HeroLabScreen.css";

type WaitlistStatus = "idle" | "invalid" | "loading" | "success" | "error";

type JourneyStage = {
  key: string;
  number: string;
  navLabel: string;
  eyebrow: string;
  title: string;
  description: string;
};

const journeyStages: JourneyStage[] = [
  {
    key: "cortex",
    number: "01",
    navLabel: "Objective",
    eyebrow: "OBJECTIVE LOCKED",
    title: "One objective enters the system.",
    description:
      "Intent, context and constraints become one visible mission state. Everything that follows stays attached to that same objective.",
  },
  {
    key: "hermes",
    number: "02",
    navLabel: "Route",
    eyebrow: "INTELLIGENCE ROUTING",
    title: "Hermes composes the right path.",
    description:
      "The operating layer chooses and coordinates the runtimes that fit the mission, without turning provider orchestration into user work.",
  },
  {
    key: "teams",
    number: "03",
    navLabel: "Team",
    eyebrow: "WORK DISTRIBUTION",
    title: "The mission becomes coordinated work.",
    description:
      "Planner, researcher, builder and reviewer receive the context they need while dependencies and mission state stay explicit.",
  },
  {
    key: "review",
    number: "04",
    navLabel: "Verify",
    eyebrow: "QUALITY GATE",
    title: "The system challenges its own work.",
    description:
      "Outputs loop through inspection, testing, comparison and revision until evidence and constraints agree with the original objective.",
  },
  {
    key: "result",
    number: "05",
    navLabel: "Return",
    eyebrow: "VERIFIED HANDOFF",
    title: "One verified result comes back out.",
    description:
      "The work returns with evidence and important decisions intact: a finished handoff instead of another coordination problem.",
  },
];

type ProviderMark = ComponentType<SVGProps<SVGSVGElement> & { title?: string }>;

const providers: Array<{
  name: string;
  descriptor: string;
  Mark: ProviderMark;
}> = [
  { name: "Claude", descriptor: "reason", Mark: ClaudeMark },
  { name: "Codex", descriptor: "build", Mark: OpenAiMark },
  { name: "DeepSeek", descriptor: "runtime", Mark: DeepSeekMark },
  { name: "Gemini", descriptor: "context", Mark: GeminiMark },
  { name: "Mistral", descriptor: "runtime", Mark: MistralMark },
];

const circuitStops = [
  { number: "01", label: "objective", x: 150, y: 380 },
  { number: "02", label: "route", x: 370, y: 258 },
  { number: "03", label: "team", x: 600, y: 380 },
  { number: "04", label: "verify", x: 830, y: 502 },
  { number: "05", label: "return", x: 1050, y: 380 },
] as const;

const circuitSegments = [
  [[150, 380], [230, 380], [290, 258], [370, 258]],
  [[370, 258], [450, 258], [520, 380], [600, 380]],
  [[600, 380], [680, 380], [750, 502], [830, 502]],
  [[830, 502], [910, 502], [970, 380], [1050, 380]],
] as const;

const CIRCUIT_STYLES = `
.inside-scene .inside-scene__contour,
.inside-scene .inside-scene__spine,
.inside-scene .inside-scene__floor { opacity: .52; }

.inside-scene__circuit-rail,
.inside-scene__circuit-progress,
.inside-scene__circuit-echo {
  fill: none;
  vector-effect: non-scaling-stroke;
}

.inside-scene__circuit-rail {
  stroke: rgba(76, 91, 160, .17);
  stroke-width: 1.25;
  stroke-dasharray: 2 9;
}

.inside-scene__circuit-progress {
  stroke: url(#inside-circuit-gradient);
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  filter: drop-shadow(0 4px 8px rgba(88, 106, 242, .2));
}

.inside-scene__circuit-echo {
  stroke: rgba(139, 124, 246, .13);
  stroke-width: 1;
  stroke-dasharray: 1 14;
  opacity: .65;
}

.inside-scene__stop circle:first-child {
  fill: rgba(255, 255, 255, .88);
  stroke: rgba(76, 91, 160, .18);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.inside-scene__stop circle:last-child {
  fill: rgba(76, 91, 160, .26);
}

.inside-scene__stop.is-past circle:first-child,
.inside-scene__stop.is-active circle:first-child {
  stroke: rgba(88, 106, 242, .56);
}

.inside-scene__stop.is-past circle:last-child,
.inside-scene__stop.is-active circle:last-child {
  fill: #586af2;
}

.inside-scene__stop.is-active circle:first-child {
  fill: rgba(245, 246, 255, .98);
  filter: drop-shadow(0 8px 16px rgba(88, 106, 242, .18));
}

.inside-scene .inside-scene__layer {
  opacity: 0;
  transform: scale(.97);
  transition: opacity 620ms ease, transform 820ms cubic-bezier(.22,1,.36,1);
}

.inside-scene .inside-scene__layer.is-past {
  opacity: .14;
  transform: scale(1);
}

.inside-scene .inside-scene__layer.is-active {
  opacity: 1;
  transform: scale(1);
}

.inside-circuit-stops {
  position: absolute;
  z-index: 4;
  inset: 0;
  pointer-events: none;
}

.inside-circuit-stop {
  position: absolute;
  display: grid;
  min-width: 72px;
  gap: 3px;
  color: rgba(21, 26, 43, .32);
  transform: translate(-50%, 24px);
  transition: color 420ms ease, opacity 420ms ease, transform 520ms cubic-bezier(.22,1,.36,1);
}

.inside-circuit-stop span {
  font-size: 8px;
  font-variant-numeric: tabular-nums;
  letter-spacing: .12em;
}

.inside-circuit-stop strong {
  font-size: 9px;
  font-weight: 720;
  letter-spacing: .1em;
  text-transform: uppercase;
}

.inside-circuit-stop.is-past { color: rgba(88, 106, 242, .48); }
.inside-circuit-stop.is-active {
  color: rgba(21, 26, 43, .8);
  transform: translate(-50%, 20px);
}

.inside-scene__traveler {
  position: absolute;
  z-index: 9;
  left: calc(var(--traveler-x, 12.5) * 1%);
  top: calc(var(--traveler-y, 50) * 1%);
  display: grid;
  width: clamp(42px, 4vw, 58px);
  aspect-ratio: 1;
  place-items: center;
  transform: translate(-50%, -50%);
  pointer-events: none;
  will-change: left, top;
}

.inside-scene__traveler .cortex-logo {
  position: relative;
  z-index: 2;
  width: 72%;
  height: 72%;
  filter: drop-shadow(0 8px 14px rgba(88, 106, 242, .2));
}

.inside-scene__traveler-halo {
  position: absolute;
  inset: -18%;
  border: 1px solid rgba(88, 106, 242, .22);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,.92) 0 32%, rgba(88,106,242,.08) 52%, transparent 72%);
  box-shadow: 0 10px 30px rgba(88, 106, 242, .12);
}

.inside-scene__traveler-halo::after {
  position: absolute;
  inset: -12%;
  border: 1px dashed rgba(88, 106, 242, .18);
  border-radius: 50%;
  content: "";
  animation: inside-ring 18s linear infinite;
}

.inside-scene__traveler-label {
  position: absolute;
  top: calc(100% + 15px);
  left: 50%;
  color: rgba(21, 26, 43, .45);
  font-size: 7px;
  font-weight: 760;
  letter-spacing: .16em;
  text-transform: uppercase;
  transform: translateX(-50%);
  white-space: nowrap;
}

.inside-circuit-detail {
  position: absolute;
  z-index: 7;
  color: rgba(21,26,43,.8);
  pointer-events: none;
  animation: inside-stage-in 580ms cubic-bezier(.22,1,.36,1) both;
}

.inside-circuit-detail__eyebrow {
  color: rgba(21,26,43,.4);
  font-size: 8px;
  font-weight: 760;
  letter-spacing: .16em;
  text-transform: uppercase;
}

.inside-circuit-detail--objective {
  top: 57%;
  left: 5%;
  display: grid;
  width: 205px;
  gap: 10px;
}

.inside-objective-flow {
  display: grid;
  grid-template-columns: repeat(3, auto);
  align-items: center;
  gap: 6px;
}

.inside-objective-flow span {
  padding: 7px 8px;
  border: 1px solid rgba(76,91,160,.13);
  background: rgba(255,255,255,.72);
  font-size: 8px;
  letter-spacing: .06em;
}

.inside-objective-state {
  display: flex;
  align-items: center;
  gap: 7px;
  color: rgba(21,26,43,.5);
  font-size: 9px;
}

.inside-objective-state::before {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #586af2;
  content: "";
}

.inside-circuit-detail--route {
  top: 6%;
  left: 19%;
  width: min(560px, 58%);
}

.inside-runtime-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0,1fr));
  gap: 6px;
  margin-top: 9px;
}

.inside-runtime-chip {
  display: grid;
  grid-template-columns: 18px minmax(0,1fr);
  align-items: center;
  gap: 7px;
  min-width: 0;
  padding: 8px 9px;
  border: 1px solid rgba(76,91,160,.14);
  background: rgba(255,255,255,.82);
  box-shadow: 0 8px 24px rgba(76,91,160,.06);
}

.inside-runtime-chip svg { width: 15px; height: 15px; color: #586af2; }
.inside-runtime-chip strong,
.inside-runtime-chip small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.inside-runtime-chip strong { display:block; font-size: 9px; }
.inside-runtime-chip small { display:block; margin-top:2px; color:rgba(21,26,43,.38); font-size:7px; }

.inside-route-note {
  display: block;
  margin-top: 8px;
  color: rgba(21,26,43,.42);
  font-size: 9px;
}

.inside-circuit-detail--team {
  top: 20%;
  left: 50%;
  width: 330px;
  transform: translateX(-50%);
}

.inside-team-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 7px;
  margin-top: 10px;
}

.inside-team-role {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 10px;
  border-left: 1px solid rgba(88,106,242,.58);
  background: rgba(255,255,255,.78);
  box-shadow: 0 7px 20px rgba(76,91,160,.05);
  font-size: 9px;
}

.inside-team-role small { color: rgba(21,26,43,.4); font-size:7px; text-transform:uppercase; letter-spacing:.08em; }

.inside-team-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 9px;
  color: rgba(21,26,43,.42);
  font-size: 8px;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.inside-team-state::before,
.inside-team-state::after { width:28px; height:1px; background:rgba(88,106,242,.18); content:""; }

.inside-circuit-detail--verify {
  top: 51%;
  left: 72%;
  width: 220px;
}

.inside-verify-loop {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 6px;
  margin-top: 9px;
}

.inside-verify-step {
  padding: 8px 9px;
  border: 1px solid rgba(76,91,160,.12);
  background: rgba(255,255,255,.8);
  font-size: 8px;
}

.inside-verify-step span { margin-right:6px; color:#586af2; font-variant-numeric:tabular-nums; }
.inside-verify-gate { display:block; margin-top:8px; color:rgba(21,26,43,.42); font-size:8px; }

.inside-circuit-detail--result {
  top: 29%;
  right: 1.5%;
  width: 215px;
}

.inside-output-card {
  padding: 13px 14px;
  border: 1px solid rgba(88,106,242,.25);
  background: rgba(255,255,255,.9);
  box-shadow: 0 18px 48px rgba(76,91,160,.1);
}

.inside-output-card__top {
  display:flex;
  justify-content:space-between;
  gap:12px;
  padding-bottom:9px;
  border-bottom:1px solid rgba(76,91,160,.11);
  color:rgba(21,26,43,.42);
  font-size:7px;
  font-weight:760;
  letter-spacing:.12em;
}
.inside-output-card__top span:last-child { color:#586af2; }
.inside-output-card strong { display:block; margin-top:13px; font-size:15px; letter-spacing:-.035em; }
.inside-output-card p { margin-top:4px; color:rgba(21,26,43,.48); font-size:8px; }
.inside-output-card__proof { display:grid; gap:5px; margin-top:12px; padding-top:9px; border-top:1px solid rgba(76,91,160,.11); color:rgba(21,26,43,.5); font-size:8px; }
.inside-output-card__proof span::before { display:inline-block; width:4px; height:4px; margin-right:6px; border-radius:50%; background:#586af2; content:""; vertical-align:1px; }

@media (max-width: 720px) {
  .inside-circuit-stop { min-width: 56px; transform: translate(-50%, 18px); }
  .inside-circuit-stop strong { font-size: 7px; }
  .inside-circuit-stop span { font-size: 7px; }
  .inside-scene__traveler { width: 40px; }
  .inside-scene__traveler-label { display:none; }
  .inside-circuit-detail--objective { top: 58%; left: 2%; width: 170px; transform: scale(.82); transform-origin:left top; }
  .inside-circuit-detail--route { top: 1%; left: 8%; width: 84%; transform: scale(.82); transform-origin:left top; }
  .inside-runtime-chip { grid-template-columns: 1fr; justify-items:center; padding:6px 3px; text-align:center; }
  .inside-runtime-chip small { display:none; }
  .inside-circuit-detail--team { top: 13%; width: 280px; transform: translateX(-50%) scale(.82); transform-origin:center top; }
  .inside-circuit-detail--verify { top: 54%; left: 58%; width: 190px; transform: scale(.8); transform-origin:left top; }
  .inside-circuit-detail--result { top: 24%; right: 0; width: 180px; transform: scale(.82); transform-origin:right top; }
}

@media (prefers-reduced-motion: reduce) {
  .inside-scene__traveler-halo::after { animation: none; }
  .inside-scene .inside-scene__layer,
  .inside-circuit-stop,
  .inside-circuit-detail { transition:none; animation:none; }
}
`;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function cubicPoint(segment: (typeof circuitSegments)[number], t: number) {
  const [p0, p1, p2, p3] = segment;
  const u = 1 - t;
  const x = u ** 3 * p0[0] + 3 * u ** 2 * t * p1[0] + 3 * u * t ** 2 * p2[0] + t ** 3 * p3[0];
  const y = u ** 3 * p0[1] + 3 * u ** 2 * t * p1[1] + 3 * u * t ** 2 * p2[1] + t ** 3 * p3[1];
  return { x, y };
}

function AccessForm({
  email,
  emailRef,
  status,
  error,
  onEmailChange,
  onSubmit,
}: {
  email: string;
  emailRef: RefObject<HTMLInputElement>;
  status: WaitlistStatus;
  error: string;
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (status === "success") {
    return (
      <div className="inside-access inside-access--success" role="status" aria-live="polite">
        <Check aria-hidden="true" />
        <div>
          <strong>Request received</strong>
          <span>We will be in touch when the next wave opens.</span>
        </div>
      </div>
    );
  }

  const hasMessage = status === "invalid" || status === "error";

  return (
    <form className="inside-access" noValidate onSubmit={onSubmit}>
      <label className="sr-only" htmlFor="cortex-access-email">Work email</label>
      <input
        ref={emailRef}
        id="cortex-access-email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="Work email"
        value={email}
        aria-invalid={status === "invalid"}
        aria-describedby={hasMessage ? "cortex-access-message" : undefined}
        required
        onChange={(event) => onEmailChange(event.target.value)}
      />
      <button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Sending" : "Request access"}
      </button>
      {hasMessage && (
        <p id="cortex-access-message" role="alert">
          {status === "invalid" ? "Enter a valid work email." : error}
        </p>
      )}
    </form>
  );
}

function ArchitectureScene({
  activeStage,
  sceneRef,
}: {
  activeStage: number;
  sceneRef: RefObject<HTMLDivElement>;
}) {
  const stage = journeyStages[activeStage] ?? journeyStages[0]!;
  const layerClass = (index: number, name: string) =>
    `inside-scene__layer inside-scene__layer--${name} ${index === activeStage ? "is-active" : index < activeStage ? "is-past" : ""}`;

  return (
    <div ref={sceneRef} className={`inside-scene inside-scene--${stage.key}`} aria-hidden="true">
      <style>{CIRCUIT_STYLES}</style>
      <svg className="inside-scene__svg" viewBox="0 0 1200 760" fill="none">
        <defs>
          <linearGradient id="inside-circuit-gradient" x1="150" y1="258" x2="1050" y2="502" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4054E8" />
            <stop offset="0.5" stopColor="#7A75F4" />
            <stop offset="1" stopColor="#AEB7FF" />
          </linearGradient>
          <radialGradient id="inside-core-wash">
            <stop stopColor="#AAB4FF" stopOpacity="0.22" />
            <stop offset="1" stopColor="#586AF2" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="inside-pixel-mask-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="white" stopOpacity="0" />
            <stop offset="0.24" stopColor="white" stopOpacity="0.08" />
            <stop offset="0.52" stopColor="white" stopOpacity="0.92" />
            <stop offset="0.76" stopColor="white" stopOpacity="0.22" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="inside-pixel-mask">
            <rect x="0" y="0" width="1200" height="760" fill="url(#inside-pixel-mask-gradient)" />
          </mask>
          <pattern id="inside-dots" width="9" height="9" patternUnits="userSpaceOnUse">
            <rect x="0.8" y="0.8" width="2" height="2" rx="0.5" fill="#586AF2" fillOpacity="0.66" />
          </pattern>
          <filter id="inside-soft"><feGaussianBlur stdDeviation="18" /></filter>
        </defs>

        <path className="inside-scene__contour inside-scene__contour--outer" d="M136 600C188 220 376 70 600 70s412 150 464 530" />
        <path className="inside-scene__contour inside-scene__contour--inner" d="M230 600C275 310 425 176 600 176s325 134 370 424" />
        <path className="inside-scene__spine" d="M600 100V660" />
        <path className="inside-scene__floor" d="M80 620H1120" />

        <path className="inside-scene__circuit-rail" pathLength="1" d="M150 380C230 380 290 258 370 258S520 380 600 380 750 502 830 502s140-122 220-122" />
        <path className="inside-scene__circuit-progress" pathLength="1" d="M150 380C230 380 290 258 370 258S520 380 600 380 750 502 830 502s140-122 220-122" />
        <path className="inside-scene__circuit-echo" d="M150 380C250 380 285 502 380 502S520 380 600 380 735 258 830 258s125 122 220 122" />

        {circuitStops.map((stop, index) => (
          <g key={stop.number} className={`inside-scene__stop ${index === activeStage ? "is-active" : index < activeStage ? "is-past" : ""}`}>
            <circle cx={stop.x} cy={stop.y} r="18" />
            <circle cx={stop.x} cy={stop.y} r="4" />
          </g>
        ))}

        <g className={layerClass(0, "cortex")}>
          <circle className="inside-scene__wash" cx="150" cy="380" r="116" fill="url(#inside-core-wash)" filter="url(#inside-soft)" />
          <path className="inside-scene__cortex-signal" d="M78 380C104 380 114 344 150 344" />
          <path className="inside-scene__cortex-signal inside-scene__cortex-signal--bottom" d="M78 380C104 380 114 416 150 416" />
          <circle className="inside-scene__cortex-pulse" cx="150" cy="380" r="56" />
          <circle className="inside-scene__cortex-pulse inside-scene__cortex-pulse--outer" cx="150" cy="380" r="84" />
        </g>

        <g className={layerClass(1, "hermes")}>
          <circle className="inside-scene__provider-orbit" cx="370" cy="258" r="88" />
          <circle className="inside-scene__provider-orbit inside-scene__provider-orbit--outer" cx="370" cy="258" r="122" />
          <path className="inside-scene__provider-axis" d="M370 112V150M370 366V404" />
        </g>

        <g className={layerClass(2, "teams")}>
          <path className="inside-scene__team-link" d="M600 380L500 300M600 380L700 300M600 380L500 460M600 380L700 460" />
          <circle className="inside-scene__team-node" cx="500" cy="300" r="7" />
          <circle className="inside-scene__team-node" cx="700" cy="300" r="7" />
          <circle className="inside-scene__team-node" cx="500" cy="460" r="7" />
          <circle className="inside-scene__team-node" cx="700" cy="460" r="7" />
        </g>

        <g className={layerClass(3, "review")}>
          <path className="inside-scene__review-loop" d="M830 398C910 398 958 440 958 502s-48 104-128 104-128-42-128-104 48-104 128-104Z" />
          <path className="inside-scene__review-gate" d="M830 414V442M830 562V590" />
          <circle className="inside-scene__review-node" cx="830" cy="398" r="6" />
          <circle className="inside-scene__review-node" cx="958" cy="502" r="6" />
          <circle className="inside-scene__review-node" cx="830" cy="606" r="6" />
          <circle className="inside-scene__review-node" cx="702" cy="502" r="6" />
        </g>

        <g className={layerClass(4, "result")}>
          <rect className="inside-scene__output-frame" x="968" y="304" width="176" height="152" rx="4" />
          <path className="inside-scene__output-line" d="M994 342H1118M994 370H1084M994 398H1102" />
          <path className="inside-scene__output-check" d="M1074 424L1088 438L1114 410" />
        </g>

        <rect className="inside-scene__halftone" x="0" y="0" width="1200" height="760" fill="url(#inside-dots)" mask="url(#inside-pixel-mask)" />
      </svg>

      <div className="inside-circuit-stops">
        {circuitStops.map((stop, index) => (
          <div
            key={stop.number}
            className={`inside-circuit-stop ${index === activeStage ? "is-active" : index < activeStage ? "is-past" : ""}`}
            style={{ left: `${(stop.x / 1200) * 100}%`, top: `${(stop.y / 760) * 100}%` }}
          >
            <span>{stop.number}</span>
            <strong>{stop.label}</strong>
          </div>
        ))}
      </div>

      <div className="inside-scene__traveler">
        <span className="inside-scene__traveler-halo" />
        <CortexLogo />
        <span className="inside-scene__traveler-label">{stage.navLabel}</span>
      </div>

      {stage.key === "cortex" && (
        <div className="inside-circuit-detail inside-circuit-detail--objective">
          <span className="inside-circuit-detail__eyebrow">mission input</span>
          <div className="inside-objective-flow"><span>intent</span><span>context</span><span>constraints</span></div>
          <span className="inside-objective-state">mission state created</span>
        </div>
      )}

      {stage.key === "hermes" && (
        <div className="inside-circuit-detail inside-circuit-detail--route">
          <span className="inside-circuit-detail__eyebrow">available intelligence</span>
          <div className="inside-runtime-row">
            {providers.map(({ name, descriptor, Mark }) => (
              <div className="inside-runtime-chip" key={name}>
                <Mark />
                <span><strong>{name}</strong><small>{descriptor}</small></span>
              </div>
            ))}
          </div>
          <span className="inside-route-note">Hermes composes the runtime path for this mission.</span>
        </div>
      )}

      {stage.key === "teams" && (
        <div className="inside-circuit-detail inside-circuit-detail--team">
          <span className="inside-circuit-detail__eyebrow">one shared objective</span>
          <div className="inside-team-grid">
            <div className="inside-team-role"><strong>Planner</strong><small>route</small></div>
            <div className="inside-team-role"><strong>Researcher</strong><small>context</small></div>
            <div className="inside-team-role"><strong>Builder</strong><small>produce</small></div>
            <div className="inside-team-role"><strong>Reviewer</strong><small>challenge</small></div>
          </div>
          <span className="inside-team-state">distributed work · one mission state</span>
        </div>
      )}

      {stage.key === "review" && (
        <div className="inside-circuit-detail inside-circuit-detail--verify">
          <span className="inside-circuit-detail__eyebrow">quality loop</span>
          <div className="inside-verify-loop">
            <div className="inside-verify-step"><span>01</span>inspect</div>
            <div className="inside-verify-step"><span>02</span>test</div>
            <div className="inside-verify-step"><span>03</span>compare</div>
            <div className="inside-verify-step"><span>04</span>revise</div>
          </div>
          <span className="inside-verify-gate">gate: objective held constant</span>
        </div>
      )}

      {stage.key === "result" && (
        <div className="inside-circuit-detail inside-circuit-detail--result">
          <div className="inside-output-card">
            <div className="inside-output-card__top"><span>VERIFIED OUTPUT</span><span>READY</span></div>
            <strong>Result returned</strong>
            <p>work · evidence · decisions</p>
            <div className="inside-output-card__proof"><span>traceable</span><span>reviewed</span><span>handoff ready</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

export function HeroLabScreen() {
  const entryRef = useRef<HTMLElement>(null);
  const journeyRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [entryProgress, setEntryProgress] = useState(0);
  const [activeStage, setActiveStage] = useState(0);
  const [requestStatus, setRequestStatus] = useState<WaitlistStatus>("idle");
  const [requestError, setRequestError] = useState("");
  const [email, setEmail] = useState("");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setPrefersReducedMotion(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const viewportHeight = window.innerHeight;
      const entry = entryRef.current?.getBoundingClientRect();
      const journey = journeyRef.current?.getBoundingClientRect();

      if (entry) {
        const distance = Math.max(entry.height - viewportHeight, 1);
        setEntryProgress(prefersReducedMotion ? 0 : clamp(-entry.top / distance));
      }

      if (journey) {
        const distance = Math.max(journey.height - viewportHeight, 1);
        const progress = clamp(-journey.top / distance);
        const cursor = Math.min(journeyStages.length - 0.0001, progress * journeyStages.length);
        const nextStage = Math.min(journeyStages.length - 1, Math.floor(cursor));
        const rawCircuitProgress = clamp((progress - 0.1) / 0.8);
        const circuitProgress = prefersReducedMotion ? nextStage / (journeyStages.length - 1) : rawCircuitProgress;
        const circuitCursor = Math.min(circuitSegments.length - 0.0001, circuitProgress * circuitSegments.length);
        const circuitSegment = Math.min(circuitSegments.length - 1, Math.floor(circuitCursor));
        const point = cubicPoint(circuitSegments[circuitSegment]!, clamp(circuitCursor - circuitSegment));
        const scene = sceneRef.current;

        scene?.style.setProperty("--journey-progress", String(progress));
        scene?.style.setProperty("--scene-progress", String(clamp(cursor - nextStage)));
        scene?.style.setProperty("--traveler-x", String((point.x / 1200) * 100));
        scene?.style.setProperty("--traveler-y", String((point.y / 760) * 100));
        const circuitPath = scene?.querySelector<SVGPathElement>(".inside-scene__circuit-progress");
        if (circuitPath) circuitPath.style.strokeDashoffset = String(1 - circuitProgress);

        setActiveStage((currentStage) => currentStage === nextStage ? currentStage : nextStage);
      }
    };

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [prefersReducedMotion]);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (requestStatus === "invalid" || requestStatus === "error") {
      setRequestStatus("idle");
      setRequestError("");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      setRequestStatus("invalid");
      emailRef.current?.focus();
      return;
    }

    setRequestStatus("loading");
    setRequestError("");

    try {
      const endpoint = import.meta.env.VITE_WAITLIST_ENDPOINT?.trim();
      if (!endpoint) throw new Error("Waitlist endpoint is not configured");

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok) throw new Error(`Waitlist request failed with ${response.status}`);
      setRequestStatus("success");
    } catch {
      setRequestStatus("error");
      setRequestError(
        import.meta.env.VITE_WAITLIST_ENDPOINT?.trim()
          ? "The request could not be recorded. Try again."
          : "Access requests are not connected yet.",
      );
    }
  };

  const handleStageSelect = (index: number) => {
    const journey = journeyRef.current;
    if (!journey) return;

    const distance = Math.max(journey.offsetHeight - window.innerHeight, 1);
    const targetProgress = (index + 0.5) / journeyStages.length;
    const top = journey.offsetTop + distance * targetProgress;
    window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  const entryStyle = { "--entry-progress": entryProgress } as CSSProperties;
  const stage = journeyStages[activeStage] ?? journeyStages[0]!;

  return (
    <main className="inside" data-reduced-motion={prefersReducedMotion} aria-labelledby="inside-title">
      <header className="inside-nav">
        <Link className="inside-nav__brand" to="/" aria-label="Cortex home">
          <CortexLogo aria-hidden="true" />
          <span>CORTEX</span>
        </Link>
        <Link className="inside-nav__signin" to="/login">Sign in</Link>
      </header>

      <section ref={entryRef} className="inside-entry" style={entryStyle}>
        <div className="inside-entry__sticky">
          <div className="inside-frame" aria-hidden="true">
            <span className="inside-frame__corner inside-frame__corner--tl" />
            <span className="inside-frame__corner inside-frame__corner--tr" />
            <span className="inside-frame__corner inside-frame__corner--bl" />
            <span className="inside-frame__corner inside-frame__corner--br" />
          </div>

          <div className="inside-entry__contour" aria-hidden="true"><span /><span /></div>

          <div className="inside-entry__atmosphere" aria-hidden="true">
            <span className="inside-entry__atmosphere-beam" />
            <span className="inside-entry__atmosphere-grain" />
            <span className="inside-entry__atmosphere-orbit" />
          </div>

          <div className="inside-entry__content">
            <div className="inside-entry__mark"><CortexLogo /></div>
            <h1 id="inside-title"><span>One objective.</span><span>Every capability aligned.</span></h1>
            <p>Cortex turns complex work into one directed, inspectable system.</p>
          </div>

          <a className="inside-entry__cue" href="#journey"><span>Enter Cortex</span><i aria-hidden="true" /></a>
        </div>
      </section>

      <section id="journey" ref={journeyRef} className="inside-journey">
        <div className="inside-journey__sticky">
          <div className="inside-journey__atmosphere" aria-hidden="true"><span /><span /></div>
          <ArchitectureScene activeStage={activeStage} sceneRef={sceneRef} />

          <div className={`inside-checkpoint inside-checkpoint--${stage.key}`} key={stage.key} role="region" aria-live="polite" aria-label={`${stage.number} ${stage.navLabel}`}>
            <div className="inside-checkpoint__meta"><span>{stage.number}</span><span>{stage.eyebrow}</span></div>
            <h2>{stage.title}</h2>
            <p>{stage.description}</p>
          </div>

          <ol className="inside-progress" aria-label="Cortex architecture journey">
            {journeyStages.map((item, index) => (
              <li key={item.key} className={index === activeStage ? "is-active" : index < activeStage ? "is-past" : ""}>
                <button
                  type="button"
                  aria-current={index === activeStage ? "step" : undefined}
                  aria-label={`Go to ${item.navLabel}`}
                  onClick={() => handleStageSelect(index)}
                >
                  <span>{item.number}</span><span>{item.navLabel}</span>
                </button>
              </li>
            ))}
          </ol>

          <span className="inside-journey__counter" aria-hidden="true">{stage.number} / 05</span>
        </div>
      </section>

      <section className="inside-closing" id="access">
        <div className="inside-closing__architecture" aria-hidden="true"><span /><span /><span /></div>
        <div className="inside-closing__content">
          <CortexLogo className="inside-closing__mark" />
          <p className="inside-closing__eyebrow">Private access</p>
          <h2>Build with intelligence<br />you can direct.</h2>
          <p className="inside-closing__copy">Bring one difficult workflow. We will show you the system behind it.</p>
          <AccessForm
            email={email}
            emailRef={emailRef}
            status={requestStatus}
            error={requestError}
            onEmailChange={handleEmailChange}
            onSubmit={handleSubmit}
          />
        </div>
      </section>

      <footer className="inside-footer">
        <span>© {new Date().getFullYear()} Cortex</span>
        <span>Operational intelligence for consequential work.</span>
      </footer>
    </main>
  );
}
