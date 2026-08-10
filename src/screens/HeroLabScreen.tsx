import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type RefObject,
} from "react";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { CortexLogo } from "@/components/brand/CortexLogo";
import "./HeroLabScreen.css";

type WaitlistStatus = "idle" | "invalid" | "loading" | "success" | "error";

type JourneyStage = {
  key: string;
  number: string;
  title: string;
  statement: string;
  description: string;
};

const journeyStages: JourneyStage[] = [
  {
    key: "direction",
    number: "01",
    title: "Direction",
    statement: "Give the system a direction.",
    description:
      "A business objective enters Cortex with its priorities, constraints and definition of done.",
  },
  {
    key: "architecture",
    number: "02",
    title: "Architecture",
    statement: "The right structure takes shape.",
    description:
      "Cortex breaks the mission into accountable work and establishes the dependencies between every capability.",
  },
  {
    key: "orchestration",
    number: "03",
    title: "Orchestration",
    statement: "Every capability moves as one.",
    description:
      "People, software and AI receive the context they need while the whole mission stays aligned.",
  },
  {
    key: "control",
    number: "04",
    title: "Control",
    statement: "Control stays where it matters.",
    description:
      "Sensitive decisions pause at a clear human checkpoint. You see what changed, why it changed and what happens next.",
  },
  {
    key: "proof",
    number: "05",
    title: "Proof",
    statement: "A result you can inspect.",
    description:
      "The work converges into one outcome, complete with its history, decisions and evidence.",
  },
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

function ArchitectureScene({ activeStage }: { activeStage: number }) {
  return (
    <div className={`inside-scene inside-scene--${activeStage}`} aria-hidden="true">
      <svg className="inside-scene__svg" viewBox="0 0 1200 760" fill="none">
        <defs>
          <linearGradient id="inside-path" x1="120" y1="380" x2="1080" y2="380" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9df0bd" stopOpacity="0" />
            <stop offset="0.2" stopColor="#9df0bd" stopOpacity="0.62" />
            <stop offset="0.5" stopColor="#d9f8df" />
            <stop offset="0.8" stopColor="#9df0bd" stopOpacity="0.62" />
            <stop offset="1" stopColor="#9df0bd" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="inside-core">
            <stop stopColor="#b8f3c9" stopOpacity="0.22" />
            <stop offset="1" stopColor="#2ca36e" stopOpacity="0" />
          </radialGradient>
          <pattern id="inside-dots" width="9" height="9" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="#b9eac8" fillOpacity="0.22" />
          </pattern>
          <filter id="inside-soft">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>

        <path className="inside-scene__contour inside-scene__contour--outer" d="M126 562C202 190 388 84 600 84s398 106 474 478" />
        <path className="inside-scene__contour inside-scene__contour--inner" d="M220 568C278 276 426 178 600 178s322 98 380 390" />
        <path className="inside-scene__floor" d="M88 584H1112" />

        <g className="inside-layer inside-layer--direction">
          <circle className="inside-scene__wash" cx="600" cy="382" r="184" fill="url(#inside-core)" filter="url(#inside-soft)" />
          <path className="inside-scene__objective-line" d="M160 382H512" />
          <circle className="inside-scene__objective" cx="600" cy="382" r="17" />
          <circle className="inside-scene__objective-ring" cx="600" cy="382" r="52" />
        </g>

        <g className="inside-layer inside-layer--architecture">
          <path className="inside-scene__structure" d="M600 382L364 220L240 382L364 544L600 382Z" />
          <path className="inside-scene__structure" d="M600 382L836 220L960 382L836 544L600 382Z" />
          <path className="inside-scene__structure inside-scene__structure--solid" d="M364 220L600 138L836 220M364 544L600 626L836 544" />
          <path className="inside-scene__structure" d="M364 220L364 544M836 220V544" />
        </g>

        <g className="inside-layer inside-layer--orchestration">
          <path className="inside-scene__route inside-scene__route--one" d="M150 264C336 264 388 382 600 382S864 264 1050 264" />
          <path className="inside-scene__route inside-scene__route--two" d="M150 382H1050" />
          <path className="inside-scene__route inside-scene__route--three" d="M150 500C336 500 388 382 600 382S864 500 1050 500" />
          <g className="inside-scene__moving-dots">
            <circle cx="150" cy="264" r="4" />
            <circle cx="150" cy="382" r="4" />
            <circle cx="150" cy="500" r="4" />
          </g>
        </g>

        <g className="inside-layer inside-layer--control">
          <path className="inside-scene__threshold" d="M600 142V622" />
          <rect className="inside-scene__gate" x="552" y="334" width="96" height="96" rx="48" />
          <path className="inside-scene__gate-mark" d="M578 382L594 398L624 366" />
          <path className="inside-scene__control-path" d="M168 382H530M670 382H1032" />
        </g>

        <g className="inside-layer inside-layer--proof">
          <path className="inside-scene__proof-path" d="M146 212C350 212 394 382 600 382C806 382 850 212 1054 212" />
          <path className="inside-scene__proof-path" d="M146 552C350 552 394 382 600 382C806 382 850 552 1054 552" />
          <path className="inside-scene__proof-path inside-scene__proof-path--center" d="M146 382H1054" />
          <circle className="inside-scene__proof-ring" cx="600" cy="382" r="116" />
          <circle className="inside-scene__proof-ring inside-scene__proof-ring--inner" cx="600" cy="382" r="76" />
        </g>

        <rect className="inside-scene__halftone" x="0" y="0" width="1200" height="760" fill="url(#inside-dots)" />
      </svg>
      <div className="inside-scene__mark">
        <CortexLogo />
      </div>
    </div>
  );
}

export function HeroLabScreen() {
  const entryRef = useRef<HTMLElement>(null);
  const journeyRef = useRef<HTMLElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [entryProgress, setEntryProgress] = useState(0);
  const [journeyProgress, setJourneyProgress] = useState(0);
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

      if (entry && !prefersReducedMotion) {
        const distance = Math.max(entry.height - viewportHeight, 1);
        setEntryProgress(clamp(-entry.top / distance));
      }

      if (journey) {
        const distance = Math.max(journey.height - viewportHeight, 1);
        const progress = clamp(-journey.top / distance);
        setJourneyProgress(progress);
        setActiveStage(Math.min(journeyStages.length - 1, Math.floor(progress * journeyStages.length)));
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

  const entryStyle = { "--entry-progress": entryProgress } as CSSProperties;
  const journeyStyle = { "--journey-progress": journeyProgress } as CSSProperties;
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

      <section id="journey" ref={journeyRef} className="inside-journey" style={journeyStyle}>
        <div className="inside-journey__sticky">
          <ArchitectureScene activeStage={activeStage} />

          <div className="inside-checkpoint" key={stage.key} aria-live="polite">
            <div className="inside-checkpoint__meta">
              <span>{stage.number}</span>
              <span>{stage.title}</span>
            </div>
            <h2>{stage.statement}</h2>
            <p>{stage.description}</p>
          </div>

          <ol className="inside-progress" aria-label="Cortex architecture journey">
            {journeyStages.map((item, index) => (
              <li key={item.key} className={index === activeStage ? "is-active" : index < activeStage ? "is-past" : ""}>
                <span className="sr-only">{item.title}</span>
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
