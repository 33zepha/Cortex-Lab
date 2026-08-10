import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { ArrowDownRight, ArrowUpRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import cortexLogoSource from "@/assets/cortex-hero-mark.png";
import { CortexLogo } from "@/components/brand/CortexLogo";
import "./HeroLabScreen.css";

type WaitlistStatus = "idle" | "invalid" | "loading" | "success" | "error";

function SignalField() {
  return (
    <div
      className="signal-field"
      data-reveal
      role="img"
      aria-label="A living operational field where one business objective coordinates multiple capabilities"
    >
      <svg className="signal-field__art" viewBox="0 0 820 720" aria-hidden="true">
        <defs>
          <radialGradient id="field-core" cx="50%" cy="50%" r="54%">
            <stop offset="0" stopColor="#b6f6cb" stopOpacity="0.78" />
            <stop offset="0.28" stopColor="#2fca83" stopOpacity="0.26" />
            <stop offset="1" stopColor="#0b4b38" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="field-line" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#d9ffe4" stopOpacity="0.08" />
            <stop offset="0.5" stopColor="#7af4ad" stopOpacity="0.86" />
            <stop offset="1" stopColor="#1a9b6b" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="field-structure" x1="0" x2="1">
            <stop offset="0" stopColor="#d5f3dc" stopOpacity="0.12" />
            <stop offset="0.5" stopColor="#79efad" stopOpacity="0.76" />
            <stop offset="1" stopColor="#d5f3dc" stopOpacity="0.1" />
          </linearGradient>
          <pattern id="field-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="#a9ffd0" strokeOpacity="0.1" strokeWidth="0.7" />
            <circle cx="1.5" cy="1.5" r="0.8" fill="#baffd6" fillOpacity="0.18" />
          </pattern>
          <filter id="field-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse className="signal-field__halo" cx="470" cy="348" rx="315" ry="282" fill="url(#field-core)" />
        <rect className="signal-field__grid" x="72" y="54" width="680" height="606" fill="url(#field-grid)" />

        <g className="signal-field__orbit" fill="none">
          <ellipse cx="442" cy="356" rx="270" ry="148" transform="rotate(-22 442 356)" />
          <ellipse cx="442" cy="356" rx="270" ry="148" transform="rotate(22 442 356)" />
          <ellipse cx="442" cy="356" rx="226" ry="108" transform="rotate(-58 442 356)" />
        </g>

        <g className="signal-field__architecture" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M98 523L236 146L443 86L675 184L735 570L516 656L98 523Z" />
          <path d="M236 146L516 656" />
          <path d="M443 86L443 614" />
          <path d="M675 184L236 566" />
          <path d="M166 484L284 202L443 155L622 226L675 506L515 593L166 484Z" />
        </g>

        <g className="signal-field__routes" fill="none" stroke="url(#field-line)" strokeLinecap="round">
          <path d="M36 468C163 468 208 374 303 374C397 374 420 488 537 488C645 488 671 396 804 396" />
          <path d="M128 204C234 204 274 281 367 281C452 281 500 184 608 184C694 184 728 236 799 236" />
        </g>

        <g className="signal-field__nodes">
          <circle cx="236" cy="146" r="5" />
          <circle cx="443" cy="86" r="5" />
          <circle cx="675" cy="184" r="5" />
          <circle cx="735" cy="570" r="5" />
          <circle cx="516" cy="656" r="5" />
          <circle cx="98" cy="523" r="5" />
          <circle className="signal-field__node--core" cx="443" cy="356" r="8" />
        </g>

        <g className="signal-field__core" transform="translate(443 356)">
          <circle className="signal-field__core-shell" r="68" />
          <circle className="signal-field__core-ring" r="48" />
          <image
            className="signal-field__core-logo"
            href={cortexLogoSource}
            x="-50"
            y="-50"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
          />
        </g>
      </svg>
    </div>
  );
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
      <div className="access-form access-form--success" role="status" aria-live="polite">
        <Check aria-hidden="true" />
        <div>
          <strong>Request received.</strong>
          <span>We will be in touch when the next wave opens.</span>
        </div>
      </div>
    );
  }

  const hasMessage = status === "invalid" || status === "error";

  return (
    <form id="access" className="access-form" noValidate onSubmit={onSubmit}>
      <div className="access-form__field">
        <label className="sr-only" htmlFor="landing-request-email">Work email</label>
        <input
          ref={emailRef}
          id="landing-request-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Your work email"
          value={email}
          aria-invalid={status === "invalid"}
          aria-describedby={hasMessage ? "landing-request-message" : undefined}
          required
          onChange={(event) => onEmailChange(event.target.value)}
        />
      </div>
      <button type="submit" disabled={status === "loading"}>
        {status === "loading" ? (
          <>
            <span className="access-form__spinner" aria-hidden="true" />
            Sending
          </>
        ) : (
          <>
            Request access
            <ArrowUpRight aria-hidden="true" />
          </>
        )}
      </button>
      {hasMessage && (
        <p id="landing-request-message" role="alert">
          {status === "invalid" ? "Enter a valid work email." : error}
        </p>
      )}
    </form>
  );
}

function SystemMap() {
  return (
    <div
      className="system-map"
      data-reveal
      role="img"
      aria-label="A business objective enters Cortex, is coordinated, and returns as a reviewable result"
    >
      <svg className="system-map__svg" viewBox="0 0 1000 340" aria-hidden="true">
        <defs>
          <linearGradient id="map-line" x1="0" x2="1">
            <stop offset="0" stopColor="#8eeeb3" stopOpacity="0.05" />
            <stop offset="0.5" stopColor="#49d995" stopOpacity="0.86" />
            <stop offset="1" stopColor="#8eeeb3" stopOpacity="0.05" />
          </linearGradient>
          <filter id="map-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path className="system-map__path" d="M68 84C248 84 286 170 458 170C630 170 704 84 932 84" />
        <path className="system-map__path system-map__path--second" d="M68 256C248 256 286 170 458 170C630 170 704 256 932 256" />
        <path className="system-map__path system-map__path--center" d="M458 36V304" />
        <circle className="system-map__node" cx="68" cy="84" r="5" />
        <circle className="system-map__node" cx="68" cy="256" r="5" />
        <circle className="system-map__node" cx="932" cy="84" r="5" />
        <circle className="system-map__node" cx="932" cy="256" r="5" />
        <circle className="system-map__node system-map__node--core" cx="458" cy="170" r="9" filter="url(#map-glow)" />
      </svg>
      <div className="system-map__core">
        <CortexLogo aria-hidden="true" />
      </div>
    </div>
  );
}

const systemStages = [
  {
    title: "Objective",
    description: "Start with the result your business needs, not a prompt.",
  },
  {
    title: "Context",
    description: "Bring together the people, tools and constraints around it.",
  },
  {
    title: "Coordination",
    description: "Cortex directs the right capabilities through the work.",
  },
  {
    title: "Proof",
    description: "Review the path, the decisions and the result before sign-off.",
  },
] as const;

const controlStages = [
  {
    title: "Set the direction",
    description: "Your team defines what good looks like.",
  },
  {
    title: "Let the system move",
    description: "Cortex keeps the work aligned as it changes.",
  },
  {
    title: "Keep the decision",
    description: "People stay accountable for the outcome.",
  },
] as const;

export function HeroLabScreen() {
  const emailRef = useRef<HTMLInputElement>(null);
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
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8%" },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
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
      if (!endpoint) {
        throw new Error("Waitlist endpoint is not configured");
      }

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

  return (
    <main className="landing" data-reduced-motion={prefersReducedMotion} aria-labelledby="landing-title">
      <div className="landing__grain" aria-hidden="true" />

      <section className="landing__hero">
        <header className="landing__nav landing__container">
          <Link className="landing__brand" to="/" aria-label="Cortex home">
            <CortexLogo aria-hidden="true" />
            <span>CORTEX</span>
          </Link>
          <nav className="landing__nav-actions" aria-label="Landing navigation">
            <a href="#system" aria-label="How it works">
              <span>How it works</span>
              <ArrowDownRight aria-hidden="true" />
            </a>
            <Link to="/login">
              <span>Sign in</span>
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </nav>
        </header>

        <div className="landing__hero-grid landing__container">
          <div className="landing__copy" data-reveal>
            <p className="landing__eyebrow">AI, organized around your business</p>
            <h1 id="landing-title">
              <span>Make complex</span>
              <span className="landing__title-accent">work move.</span>
            </h1>
            <p className="landing__lead">
              Cortex coordinates the people, software and AI behind a business objective — so your team can see progress, make decisions and trust the result.
            </p>
            <AccessForm
              email={email}
              emailRef={emailRef}
              status={requestStatus}
              error={requestError}
              onEmailChange={handleEmailChange}
              onSubmit={handleSubmit}
            />
          </div>

          <SignalField />
        </div>

        <a className="landing__scroll-cue" href="#system" aria-label="See how Cortex works">
          <span>See the operating layer</span>
          <ArrowDownRight aria-hidden="true" />
        </a>
      </section>

      <section id="system" className="landing__system">
        <div className="landing__container">
          <div className="landing__system-intro" data-reveal>
            <div>
              <p className="landing__section-label">The operating layer</p>
              <h2>Complex work.<br /><span>One direction.</span></h2>
            </div>
            <p>
              You bring the objective. Cortex keeps the brief, the context, the work and the evidence aligned — without asking your team to understand the machinery underneath.
            </p>
          </div>

          <SystemMap />

          <ol className="system-stages" data-reveal>
            {systemStages.map((stage, index) => (
              <li key={stage.title}>
                <span className="system-stages__index">0{index + 1}</span>
                <div>
                  <strong>{stage.title}</strong>
                  <p>{stage.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="landing__control">
        <div className="landing__container landing__control-grid">
          <div className="landing__control-intro" data-reveal>
            <p className="landing__section-label">What changes for your team</p>
            <h2>You keep the<br /><span>decision.</span></h2>
            <p>
              The system handles coordination. Your people keep the judgment, the context and the accountability that make the work worth doing.
            </p>
          </div>

          <ol className="control-stages" data-reveal>
            {controlStages.map((stage, index) => (
              <li key={stage.title}>
                <span className="control-stages__index">0{index + 1}</span>
                <div>
                  <strong>{stage.title}</strong>
                  <p>{stage.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="landing__closing" data-reveal>
        <div className="landing__container landing__closing-grid">
          <CortexLogo className="landing__closing-mark" aria-hidden="true" />
          <div>
            <p className="landing__section-label">Private walkthrough</p>
            <h2>Bring one difficult<br /><span>workflow.</span></h2>
            <p>We will show you the system behind it.</p>
            <a className="landing__closing-action" href="#access">
              Request access
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <footer className="landing__footer landing__container">
        <Link className="landing__brand" to="/" aria-label="Cortex home">
          <CortexLogo aria-hidden="true" />
          <span>CORTEX</span>
        </Link>
        <span>Operational intelligence for the work that matters.</span>
        <Link className="landing__footer-link" to="/login">
          Sign in
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </footer>
    </main>
  );
}
