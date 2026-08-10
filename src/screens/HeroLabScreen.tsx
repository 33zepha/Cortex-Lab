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
      "Cortex captures intent, context and constraints, then turns them into a visible mission that can move through the whole system.",
  },
  {
    key: "hermes",
    number: "02",
    navLabel: "Route",
    eyebrow: "INTELLIGENCE ROUTING",
    title: "Hermes chooses how the mission should think.",
    description:
      "The operating layer selects and coordinates the runtimes that fit the work — without exposing the user to provider-by-provider orchestration.",
  },
  {
    key: "teams",
    number: "03",
    navLabel: "Team",
    eyebrow: "WORK DISTRIBUTION",
    title: "The mission becomes coordinated work.",
    description:
      "Roles receive only the context they need, dependencies stay explicit and every contribution remains attached to the same objective.",
  },
  {
    key: "review",
    number: "04",
    navLabel: "Verify",
    eyebrow: "QUALITY GATE",
    title: "The system challenges its own work.",
    description:
      "Outputs loop through inspection, testing and revision until the evidence and constraints agree with the objective.",
  },
  {
    key: "result",
    number: "05",
    navLabel: "Return",
    eyebrow: "VERIFIED HANDOFF",
    title: "One verified result comes back out.",
    description:
      "The result returns with its evidence and important decisions intact — a finished handoff instead of another coordination problem.",
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

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
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
      <label className="sr-only" htmlFor="cortex-access-email">
        Work email
      </label>
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

  return (
    <div ref={sceneRef} className={`inside-scene inside-scene--${stage.key}`} aria-hidden="true">
      <svg className="inside-scene__svg" viewBox="0 0 1200 760" fill="none">
        <defs>
          <linearGradient id="inside-route-gradient" x1="120" y1="380" x2="1080" y2="380" gradientUnits="userSpaceOnUse">
            <stop stopColor="#586AF2" stopOpacity="0" />
            <stop offset="0.18" stopColor="#586AF2" stopOpacity="0.36" />
            <stop offset="0.5" stopColor="#D9DEFF" stopOpacity="0.95" />
            <stop offset="0.82" stopColor="#586AF2" stopOpacity="0.36" />
            <stop offset="1" stopColor="#586AF2" stopOpacity="0" />
          </linearGradient>
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
          <filter id="inside-soft">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>

        <path className="inside-scene__contour inside-scene__contour--outer" d="M136 600C188 220 376 70 600 70s412 150 464 530" />
        <path className="inside-scene__contour inside-scene__contour--inner" d="M230 600C275 310 425 176 600 176s325 134 370 424" />
        <path className="inside-scene__spine" d="M600 100V660" />
        <path className="inside-scene__floor" d="M80 620H1120" />

        <path className="inside-scene__circuit-rail" pathLength="1" d="M150 380C240 380 280 258 370 258S510 380 600 380 740 502 830 502s130-122 220-122" />
        <path className="inside-scene__circuit-progress" pathLength="1" d="M150 380C240 380 280 258 370 258S510 380 600 380 740 502 830 502s130-122 220-122" />
        <path className="inside-scene__circuit-echo" pathLength="1" d="M150 380C240 380 280 502 370 502S510 380 600 380 740 258 830 258s130 122 220 122" />

        {circuitStops.map((stop, index) => (
          <g key={stop.number} className={`inside-scene__stop inside-scene__stop--${index + 1}`}>
            <circle cx={stop.x} cy={stop.y} r="18" />
            <circle cx={stop.x} cy={stop.y} r="4" />
          </g>
        ))}

        <g className="inside-scene__layer inside-scene__layer--cortex">
          <circle className="inside-scene__wash" cx="150" cy="380" r="154" fill="url(#inside-core-wash)" filter="url(#inside-soft)" />
          <path className="inside-scene__objective-line" d="M78 380H150" />
          <path className="inside-scene__cortex-signal inside-scene__cortex-signal--top" d="M82 380C104 380 114 342 150 342" />
          <path className="inside-scene__cortex-signal inside-scene__cortex-signal--bottom" d="M82 380C104 380 114 418 150 418" />
          <circle className="inside-scene__cortex-signal-dot inside-scene__cortex-signal-dot--one" cx="82" cy="380" r="4" />
          <circle className="inside-scene__cortex-signal-dot inside-scene__cortex-signal-dot--two" cx="118" cy="342" r="3" />
          <circle className="inside-scene__cortex-signal-dot inside-scene__cortex-signal-dot--three" cx="118" cy="418" r="3" />
          <circle className="inside-scene__cortex-pulse" cx="150" cy="380" r="58" />
          <circle className="inside-scene__cortex-pulse inside-scene__cortex-pulse--outer" cx="150" cy="380" r="90" />
        </g>

        <g className="inside-scene__layer inside-scene__layer--hermes">
          <circle className="inside-scene__provider-orbit" cx="370" cy="258" r="98" />
          <circle className="inside-scene__provider-orbit inside-scene__provider-orbit--outer" cx="370" cy="258" r="134" />
          <path className="inside-scene__provider-axis" d="M370 102V144M370 372V414" />
        </g>

        <g className="inside-scene__layer inside-scene__layer--teams">
          <path className="inside-scene__team-link" d="M600 380L488 290M600 380L712 290M600 380L488 470M600 380L712 470" />
          <circle className="inside-scene__team-node" cx="488" cy="290" r="8" />
          <circle className="inside-scene__team-node" cx="712" cy="290" r="8" />
          <circle className="inside-scene__team-node" cx="488" cy="470" r="8" />
          <circle className="inside-scene__team-node" cx="712" cy="470" r="8" />
        </g>

        <g className="inside-scene__layer inside-scene__layer--review">
          <path className="inside-scene__review-loop" d="M830 394C918 394 970 438 970 502s-52 108-140 108-140-44-140-108 52-108 140-108Z" />
          <path className="inside-scene__review-gate" d="M830 410V438M830 566V594" />
          <circle className="inside-scene__review-node" cx="830" cy="394" r="7" />
          <circle className="inside-scene__review-node" cx="970" cy="502" r="7" />
          <circle className="inside-scene__review-node" cx="830" cy="610" r="7" />
          <circle className="inside-scene__review-node" cx="690" cy="502" r="7" />
        </g>

        <g className="inside-scene__layer inside-scene__layer--result">
          <rect className="inside-scene__output-frame" x="954" y="294" width="196" height="172" rx="4" />
          <path className="inside-scene__output-line" d="M982 338H1120M982 368H1086M982 398H1102" />
          <path className="inside-scene__output-check" d="M1076 430L1090 444L1118 414" />
        </g>

        <rect className="inside-scene__halftone" x="0" y="0" width="1200" height="760" fill="url(#inside-dots)" mask="url(#inside-pixel-mask)" />
      </svg>

      <div className="inside-circuit-stops">
        {circuitStops.map((stop, index) => (
          <div
            key={stop.number}
            className={`inside-circuit-stop inside-circuit-stop--${index + 1} ${index === activeStage ? "is-active" : index < activeStage ? "is-past" : ""}`}
          >
            <span>{stop.number}</span>
            <strong>{stop.label}</strong>
          </div>
        ))}
      </div>

      <div className="inside-scene__traveler">
        <span className="inside-scene__traveler-halo" />
        <CortexLogo />
        <span className="inside-scene__traveler-label">mission</span>
      </div>

      <div className="inside-scene__center-marker">
        <span>{stage.number}</span>
        <strong>{stage.navLabel}</strong>
      </div>

      {stage.key === "cortex" && (
        <div key="cortex" className="inside-scene__stage-overlay inside-scene__stage-overlay--cortex">
          <div className="inside-cortex-signal">
            <div className="inside-cortex-signal__route" aria-hidden="true">
              <span>intent</span>
              <i />
              <span>context</span>
              <i />
              <span>constraints</span>
            </div>
            <p><span>MISSION CREATED</span><small>one objective · one system</small></p>
          </div>
        </div>
      )}

      {stage.key === "hermes" && (
        <div key="hermes" className="inside-scene__stage-overlay inside-scene__stage-overlay--hermes">
          <span className="inside-provider-ring__eyebrow">AVAILABLE INTELLIGENCE</span>
          <div className="inside-provider-ring">
            {providers.map(({ name, descriptor, Mark }) => (
              <div className="inside-provider" key={name}>
                <span className="inside-provider__mark"><Mark /></span>
                <span className="inside-provider__copy">
                  <strong>{name}</strong>
                  <small>{descriptor}</small>
                </span>
              </div>
            ))}
          </div>
          <span className="inside-provider-ring__note">Hermes composes the runtime path for this mission.</span>
        </div>
      )}

      {stage.key === "teams" && (
        <div key="teams" className="inside-scene__stage-overlay inside-scene__stage-overlay--teams">
          <div className="inside-team-map__input">
            <span>SHARED OBJECTIVE</span>
            <strong>context stays attached</strong>
          </div>
          <div className="inside-team-map__node inside-team-map__node--planner"><strong>Planner</strong><small>route</small></div>
          <div className="inside-team-map__node inside-team-map__node--researcher"><strong>Researcher</strong><small>context</small></div>
          <div className="inside-team-map__node inside-team-map__node--builder"><strong>Builder</strong><small>produce</small></div>
          <div className="inside-team-map__node inside-team-map__node--reviewer"><strong>Reviewer</strong><small>challenge</small></div>
          <span className="inside-team-map__mission">distributed work · one mission state</span>
        </div>
      )}

      {stage.key === "review" && (
        <div key="review" className="inside-scene__stage-overlay inside-scene__stage-overlay--review">
          <div className="inside-review-loop__step inside-review-loop__step--produce"><strong>01</strong><span>inspect</span></div>
          <div className="inside-review-loop__step inside-review-loop__step--inspect"><strong>02</strong><span>test</span></div>
          <div className="inside-review-loop__step inside-review-loop__step--test"><strong>03</strong><span>compare</span></div>
          <div className="inside-review-loop__step inside-review-loop__step--revise"><strong>04</strong><span>revise</span></div>
          <span className="inside-review-loop__gate-label">objective held constant</span>
        </div>
      )}

      {stage.key === "result" && (
        <div key="result" className="inside-scene__stage-overlay inside-scene__stage-overlay--result">
          <div className="inside-result-surface">
            <div className="inside-result-surface__topline"><span>VERIFIED OUTPUT</span><span>READY</span></div>
            <strong>Result returned</strong>
            <p>work · evidence · decisions</p>
            <div className="inside-result-surface__signals">
              <span>traceable</span>
              <span>reviewed</span>
              <span>handoff ready</span>
            </div>
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
        sceneRef.current?.style.setProperty("--journey-progress", String(progress));
        sceneRef.current?.style.setProperty("--scene-progress", String(clamp(cursor - nextStage)));
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
    const targetProgress = index === journeyStages.length - 1 ? 0.985 : (index + 0.08) / journeyStages.length;
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
        <Link className="inside-nav__signin" to="/login">
          Sign in
        </Link>
      </header>

      <section ref={entryRef} className="inside-entry" style={entryStyle}>
        <div className="inside-entry__sticky">
          <div className="inside-frame" aria-hidden="true">
            <span className="inside-frame__corner inside-frame__corner--tl" />
            <span className="inside-frame__corner inside-frame__corner--tr" />
            <span className="inside-frame__corner inside-frame__corner--bl" />
            <span className="inside-frame__corner inside-frame__corner--br" />
          </div>

          <div className="inside-entry__contour" aria-hidden="true">
            <span />
            <span />
          </div>

          <div className="inside-entry__atmosphere" aria-hidden="true">
            <span className="inside-entry__atmosphere-beam" />
            <span className="inside-entry__atmosphere-grain" />
            <span className="inside-entry__atmosphere-orbit" />
          </div>

          <div className="inside-entry__content">
            <div className="inside-entry__mark">
              <CortexLogo />
            </div>
            <h1 id="inside-title">
              <span>One objective.</span>
              <span>Every capability aligned.</span>
            </h1>
            <p>Cortex turns complex work into one directed, inspectable system.</p>
          </div>

          <a className="inside-entry__cue" href="#journey">
            <span>Enter Cortex</span>
            <i aria-hidden="true" />
          </a>
        </div>
      </section>

      <section id="journey" ref={journeyRef} className="inside-journey">
        <div className="inside-journey__sticky">
          <div className="inside-journey__atmosphere" aria-hidden="true">
            <span />
            <span />
          </div>
          <ArchitectureScene activeStage={activeStage} sceneRef={sceneRef} />

          <div className={`inside-checkpoint inside-checkpoint--${stage.key}`} key={stage.key} role="region" aria-live="polite" aria-label={`${stage.number} ${stage.navLabel}`}>
            <div className="inside-checkpoint__meta">
              <span>{stage.number}</span>
              <span>{stage.eyebrow}</span>
            </div>
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
                  <span>{item.number}</span>
                  <span>{item.navLabel}</span>
                </button>
              </li>
            ))}
          </ol>

          <span className="inside-journey__counter" aria-hidden="true">
            {stage.number} / 05
          </span>
        </div>
      </section>

      <section className="inside-closing" id="access">
        <div className="inside-closing__architecture" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
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
