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
    navLabel: "Cortex",
    eyebrow: "THE OPERATING LAYER",
    title: "One objective. Every capability aligned.",
    description:
      "Cortex turns complex work into one directed, inspectable system — from intention to verified result.",
  },
  {
    key: "hermes",
    number: "02",
    navLabel: "Hermes",
    eyebrow: "THE CONTROL LAYER",
    title: "Hermes routes the right intelligence.",
    description:
      "One operating layer coordinates the runtimes your mission needs — Claude, Codex, DeepSeek, Gemini, Mistral and more.",
  },
  {
    key: "teams",
    number: "03",
    navLabel: "Teams",
    eyebrow: "THE WORKFORCE",
    title: "A brief becomes a team.",
    description:
      "A CLI command, API request or connected key becomes organized work: clear roles, dependencies and shared context.",
  },
  {
    key: "review",
    number: "04",
    navLabel: "Review",
    eyebrow: "THE QUALITY LOOP",
    title: "Every result is challenged before it ships.",
    description:
      "The work is produced, inspected, tested and revised against the objective, constraints and evidence.",
  },
  {
    key: "result",
    number: "05",
    navLabel: "Result",
    eyebrow: "THE HANDOFF",
    title: "You get the result — and the time back.",
    description:
      "Cortex returns the work, its evidence and the decisions that matter, so people can move forward with less coordination.",
  },
];

type ProviderMark = ComponentType<SVGProps<SVGSVGElement> & { title?: string }>;

const providers: Array<{
  name: string;
  descriptor: string;
  Mark: ProviderMark;
}> = [
  { name: "Claude", descriptor: "Anthropic", Mark: ClaudeMark },
  { name: "Codex", descriptor: "OpenAI", Mark: OpenAiMark },
  { name: "DeepSeek", descriptor: "model runtime", Mark: DeepSeekMark },
  { name: "Gemini", descriptor: "Google", Mark: GeminiMark },
  { name: "Mistral", descriptor: "Mistral AI", Mark: MistralMark },
];

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
            <stop stopColor="#9df0bd" stopOpacity="0" />
            <stop offset="0.18" stopColor="#9df0bd" stopOpacity="0.46" />
            <stop offset="0.5" stopColor="#e1f8e5" stopOpacity="0.9" />
            <stop offset="0.82" stopColor="#9df0bd" stopOpacity="0.46" />
            <stop offset="1" stopColor="#9df0bd" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="inside-core-wash">
            <stop stopColor="#b8f3c9" stopOpacity="0.2" />
            <stop offset="1" stopColor="#2ca36e" stopOpacity="0" />
          </radialGradient>
          <pattern id="inside-dots" width="9" height="9" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="#b9eac8" fillOpacity="0.2" />
          </pattern>
          <filter id="inside-soft">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>

        <path className="inside-scene__contour inside-scene__contour--outer" d="M136 600C188 220 376 70 600 70s412 150 464 530" />
        <path className="inside-scene__contour inside-scene__contour--inner" d="M230 600C275 310 425 176 600 176s325 134 370 424" />
        <path className="inside-scene__spine" d="M600 100V660" />
        <path className="inside-scene__path inside-scene__path--primary" d="M118 380C272 380 332 258 470 258S532 380 600 380s130-122 270-122 198 122 212 122" />
        <path className="inside-scene__path inside-scene__path--return" d="M118 380C272 380 332 502 470 502S532 380 600 380s130 122 270 122 198-122 212-122" />
        <path className="inside-scene__floor" d="M80 620H1120" />

        <g className="inside-scene__layer inside-scene__layer--cortex">
          <circle className="inside-scene__wash" cx="600" cy="380" r="188" fill="url(#inside-core-wash)" filter="url(#inside-soft)" />
          <path className="inside-scene__objective-line" d="M150 380H506" />
          <circle className="inside-scene__objective" cx="600" cy="380" r="16" />
          <circle className="inside-scene__objective-ring" cx="600" cy="380" r="58" />
        </g>

        <g className="inside-scene__layer inside-scene__layer--hermes">
          <circle className="inside-scene__provider-orbit" cx="600" cy="380" r="172" />
          <circle className="inside-scene__provider-orbit inside-scene__provider-orbit--outer" cx="600" cy="380" r="226" />
          <path className="inside-scene__provider-axis" d="M600 154V208M600 552V606" />
        </g>

        <g className="inside-scene__layer inside-scene__layer--teams">
          <path className="inside-scene__team-link" d="M600 380L320 224M600 380L880 224M600 380L320 536M600 380L880 536" />
          <path className="inside-scene__team-link inside-scene__team-link--input" d="M126 380H260" />
          <circle className="inside-scene__team-node" cx="320" cy="224" r="8" />
          <circle className="inside-scene__team-node" cx="880" cy="224" r="8" />
          <circle className="inside-scene__team-node" cx="320" cy="536" r="8" />
          <circle className="inside-scene__team-node" cx="880" cy="536" r="8" />
        </g>

        <g className="inside-scene__layer inside-scene__layer--review">
          <path className="inside-scene__review-loop" d="M600 176C796 176 900 260 900 380s-104 204-300 204-300-84-300-204 104-204 300-204Z" />
          <path className="inside-scene__review-gate" d="M600 202V254M600 506V558" />
          <circle className="inside-scene__review-node" cx="600" cy="176" r="7" />
          <circle className="inside-scene__review-node" cx="900" cy="380" r="7" />
          <circle className="inside-scene__review-node" cx="600" cy="584" r="7" />
          <circle className="inside-scene__review-node" cx="300" cy="380" r="7" />
        </g>

        <g className="inside-scene__layer inside-scene__layer--result">
          <rect className="inside-scene__output-frame" x="388" y="244" width="424" height="272" rx="4" />
          <path className="inside-scene__output-line" d="M432 316H768M432 356H678M432 396H724M432 454H588" />
          <path className="inside-scene__output-check" d="M714 452L733 471L768 430" />
        </g>

        <rect className="inside-scene__halftone" x="0" y="0" width="1200" height="760" fill="url(#inside-dots)" />
      </svg>

      <div className="inside-scene__center">
        <CortexLogo />
        <span>{stage.key === "hermes" ? "HERMES" : "CORTEX"}</span>
      </div>

      <div className="inside-scene__stage-overlay inside-scene__stage-overlay--hermes">
        <span className="inside-provider-ring__eyebrow">RUNTIME ECOSYSTEM</span>
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
        <span className="inside-provider-ring__note">Connect the runtimes your mission needs.</span>
      </div>

      <div className="inside-scene__stage-overlay inside-scene__stage-overlay--teams">
        <div className="inside-team-map__input">
          <span>MISSION INPUT</span>
          <strong>CLI&nbsp; / &nbsp;API&nbsp; / &nbsp;KEY</strong>
        </div>
        <div className="inside-team-map__node inside-team-map__node--planner"><strong>Planner</strong><small>route</small></div>
        <div className="inside-team-map__node inside-team-map__node--researcher"><strong>Researcher</strong><small>context</small></div>
        <div className="inside-team-map__node inside-team-map__node--builder"><strong>Builder</strong><small>produce</small></div>
        <div className="inside-team-map__node inside-team-map__node--reviewer"><strong>Reviewer</strong><small>challenge</small></div>
        <span className="inside-team-map__mission">one directed mission</span>
      </div>

      <div className="inside-scene__stage-overlay inside-scene__stage-overlay--review">
        <div className="inside-review-loop__step inside-review-loop__step--produce"><strong>01</strong><span>produce</span></div>
        <div className="inside-review-loop__step inside-review-loop__step--inspect"><strong>02</strong><span>inspect</span></div>
        <div className="inside-review-loop__step inside-review-loop__step--test"><strong>03</strong><span>test</span></div>
        <div className="inside-review-loop__step inside-review-loop__step--revise"><strong>04</strong><span>revise</span></div>
        <span className="inside-review-loop__gate-label">quality gate</span>
      </div>

      <div className="inside-scene__stage-overlay inside-scene__stage-overlay--result">
        <div className="inside-result-surface">
          <div className="inside-result-surface__topline"><span>VERIFIED OUTPUT</span><span>READY</span></div>
          <strong>Result returned</strong>
          <p>Work · evidence · decisions</p>
          <div className="inside-result-surface__signals">
            <span>time recovered</span>
            <span>coordination reduced</span>
            <span>cost avoided</span>
          </div>
        </div>
      </div>
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
          <ArchitectureScene activeStage={activeStage} sceneRef={sceneRef} />

          <div className="inside-checkpoint" key={stage.key} role="region" aria-live="polite" aria-label={`${stage.number} ${stage.navLabel}`}>
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
