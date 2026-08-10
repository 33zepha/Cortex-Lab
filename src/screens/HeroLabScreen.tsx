import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CortexMark } from "@/components/brand/CortexMark";
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
      <div className="signal-field__legend" aria-hidden="true">
        <span>LIVE SYSTEM</span>
        <span>01 / 04</span>
      </div>

      <svg className="signal-field__art" viewBox="0 0 820 720" aria-hidden="true">
        <defs>
          <radialGradient id="field-core" cx="50%" cy="50%" r="54%">
            <stop offset="0" stopColor="#a9ffd0" stopOpacity="0.8" />
            <stop offset="0.26" stopColor="#38d88e" stopOpacity="0.34" />
            <stop offset="1" stopColor="#0c3b2c" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="field-line" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#b9ffda" stopOpacity="0.08" />
            <stop offset="0.52" stopColor="#70f5b0" stopOpacity="0.95" />
            <stop offset="1" stopColor="#0b8060" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="field-structure" x1="0" x2="1">
            <stop offset="0" stopColor="#d5f3dc" stopOpacity="0.15" />
            <stop offset="0.5" stopColor="#79efad" stopOpacity="0.9" />
            <stop offset="1" stopColor="#d5f3dc" stopOpacity="0.12" />
          </linearGradient>
          <pattern id="field-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="#a9ffd0" strokeOpacity="0.12" strokeWidth="0.7" />
            <circle cx="1.5" cy="1.5" r="0.9" fill="#baffd6" fillOpacity="0.22" />
          </pattern>
          <filter id="field-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="field-grain" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="2" seed="14" />
            <feColorMatrix values="0 0 0 0 0.62  0 0 0 0 0.92  0 0 0 0 0.75  0 0 0 0.16 0" />
          </filter>
        </defs>

        <ellipse className="signal-field__halo" cx="470" cy="348" rx="315" ry="282" fill="url(#field-core)" />
        <rect className="signal-field__grid" x="72" y="54" width="680" height="606" fill="url(#field-grid)" />

        <g className="signal-field__rings" fill="none">
          <ellipse cx="442" cy="356" rx="268" ry="148" transform="rotate(-22 442 356)" />
          <ellipse cx="442" cy="356" rx="268" ry="148" transform="rotate(22 442 356)" />
          <ellipse cx="442" cy="356" rx="224" ry="108" transform="rotate(-58 442 356)" />
          <ellipse cx="442" cy="356" rx="344" ry="205" transform="rotate(70 442 356)" />
        </g>

        <g className="signal-field__architecture" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M98 523L236 146L443 86L675 184L735 570L516 656L98 523Z" />
          <path d="M236 146L516 656" />
          <path d="M443 86L443 614" />
          <path d="M675 184L236 566" />
          <path d="M98 523L675 184" />
          <path d="M166 484L284 202L443 155L622 226L675 506L515 593L166 484Z" />
        </g>

        <g className="signal-field__beams" filter="url(#field-glow)" fill="none" stroke="url(#field-line)" strokeLinecap="round">
          <path d="M36 468C163 468 208 374 303 374C397 374 420 488 537 488C645 488 671 396 804 396" />
          <path d="M128 204C234 204 274 281 367 281C452 281 500 184 608 184C694 184 728 236 799 236" />
          <path d="M190 636C258 585 309 566 382 566C483 566 511 625 612 625C687 625 726 570 775 570" />
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
          <circle r="62" />
          <circle r="44" />
          <path d="M-22 -3V-20C-22-25-17-29-12-26L10-13" />
          <path d="M-17 22L1 33C4 35 8 35 11 33L28 23V7" />
          <path d="M3-12C-5-12-10-3-10 7C-10 16-5 21 3 21C11 21 16 16 16 7C16-3 11-12 3-12Z" />
        </g>

        <rect className="signal-field__noise" x="0" y="0" width="820" height="720" filter="url(#field-grain)" />
      </svg>

      <div className="signal-field__callout signal-field__callout--one" aria-hidden="true">
        <span>01 / OBJECTIVE</span>
        <strong>One direction</strong>
      </div>
      <div className="signal-field__callout signal-field__callout--two" aria-hidden="true">
        <span>04 / PROOF</span>
        <strong>Nothing disappears</strong>
      </div>
      <div className="signal-field__mark" aria-hidden="true">
        <CortexMark />
        <span>CORTEX</span>
      </div>
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
  onReset,
}: {
  email: string;
  emailRef: React.RefObject<HTMLInputElement>;
  status: WaitlistStatus;
  error: string;
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}) {
  if (status === "success") {
    return (
      <div className="access-form access-form--success" role="status" aria-live="polite">
        <CortexMark aria-hidden="true" />
        <div>
          <strong>Access request received.</strong>
          <span>We will be in touch when the next wave opens.</span>
        </div>
        <button type="button" onClick={onReset}>Again</button>
      </div>
    );
  }

  return (
    <form id="access" className="access-form" noValidate onSubmit={onSubmit}>
      <label className="sr-only" htmlFor="landing-request-email">Work email</label>
      <input
        ref={emailRef}
        id="landing-request-email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="work email"
        value={email}
        aria-invalid={status === "invalid"}
        aria-describedby={status === "invalid" || status === "error" ? "landing-request-error" : undefined}
        required
        onInvalid={() => onEmailChange(email)}
        onChange={(event) => onEmailChange(event.target.value)}
      />
      <button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Sending…" : "Request access"}
        <span aria-hidden="true">↗</span>
      </button>
      <p id="landing-request-error" role={status === "invalid" || status === "error" ? "alert" : undefined}>
        {status === "invalid"
          ? "Enter a valid work email."
          : status === "error"
            ? error
            : "Private access opens in small waves."}
      </p>
    </form>
  );
}

function SystemMap() {
  return (
    <div className="system-map" data-reveal>
      <svg className="system-map__svg" viewBox="0 0 1000 430" aria-hidden="true">
        <defs>
          <linearGradient id="map-line" x1="0" x2="1">
            <stop offset="0" stopColor="#123c31" stopOpacity="0.08" />
            <stop offset="0.5" stopColor="#116d50" stopOpacity="0.85" />
            <stop offset="1" stopColor="#123c31" stopOpacity="0.08" />
          </linearGradient>
          <filter id="map-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path className="system-map__path" d="M62 100C231 100 258 215 420 215C581 215 641 92 936 92" />
        <path className="system-map__path system-map__path--second" d="M64 330C235 330 275 215 420 215C600 215 673 338 936 338" />
        <path className="system-map__path system-map__path--center" d="M420 30V400" />
        <circle className="system-map__node" cx="62" cy="100" r="5" />
        <circle className="system-map__node" cx="64" cy="330" r="5" />
        <circle className="system-map__node" cx="936" cy="92" r="5" />
        <circle className="system-map__node" cx="936" cy="338" r="5" />
        <circle className="system-map__node system-map__node--core" cx="420" cy="215" r="9" filter="url(#map-glow)" />
      </svg>
      <div className="system-map__core">
        <CortexMark aria-hidden="true" />
        <span>Coordination</span>
      </div>
      <div className="system-map__stage system-map__stage--input">
        <span>01 / INPUT</span>
        <strong>Business objective</strong>
      </div>
      <div className="system-map__stage system-map__stage--context">
        <span>02 / CONTEXT</span>
        <strong>People, tools, constraints</strong>
      </div>
      <div className="system-map__stage system-map__stage--work">
        <span>03 / WORK</span>
        <strong>Capabilities in motion</strong>
      </div>
      <div className="system-map__stage system-map__stage--proof">
        <span>04 / PROOF</span>
        <strong>Outcome your team can review</strong>
      </div>
    </div>
  );
}

export function HeroLabScreen() {
  const emailRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<number | null>(null);
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

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (requestStatus === "invalid" || requestStatus === "error") setRequestStatus("idle");
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
      if (endpoint) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        if (!response.ok) throw new Error(`Waitlist request failed with ${response.status}`);
      } else {
        await new Promise<void>((resolve) => {
          timeoutRef.current = window.setTimeout(resolve, 420);
        });
      }

      setRequestStatus("success");
    } catch {
      setRequestStatus("error");
      setRequestError("The request could not be recorded. Try again.");
    }
  };

  return (
    <main className="landing" data-reduced-motion={prefersReducedMotion} aria-labelledby="landing-title">
      <div className="landing__grain" aria-hidden="true" />

      <section className="landing__hero">
        <div className="landing__horizon" aria-hidden="true" />
        <header className="landing__nav">
          <Link className="landing__brand" to="/hero-lab" aria-label="Cortex home">
            <CortexMark aria-hidden="true" />
            <span>CORTEX</span>
          </Link>
          <div className="landing__nav-meta">
            <span>OPERATING LAYER / 01</span>
            <a href="#system">Explore the system <span aria-hidden="true">↘</span></a>
          </div>
        </header>

        <div className="landing__hero-grid">
          <div className="landing__copy" data-reveal>
            <p className="landing__eyebrow"><span aria-hidden="true" />For companies putting AI to work</p>
            <h1 id="landing-title">
              <span>Make</span>
              <span>intelligence</span>
              <span className="landing__title-accent">move.</span>
            </h1>
            <p className="landing__lead">
              Cortex coordinates people, software and AI around one business objective — so complex work moves with direction, context and proof.
            </p>
            <AccessForm
              email={email}
              emailRef={emailRef}
              status={requestStatus}
              error={requestError}
              onEmailChange={handleEmailChange}
              onSubmit={handleSubmit}
              onReset={() => setRequestStatus("idle")}
            />
          </div>

          <SignalField />
        </div>

        <div className="landing__hero-rail" data-reveal aria-label="Cortex operating model">
          <span>ONE OBJECTIVE</span>
          <span className="landing__hero-rail-dot" aria-hidden="true" />
          <span>MANY CAPABILITIES</span>
          <span className="landing__hero-rail-dot" aria-hidden="true" />
          <span>ONE ACCOUNTABLE RESULT</span>
        </div>
      </section>

      <section id="system" className="landing__system">
        <div className="landing__system-intro" data-reveal>
          <p className="landing__kicker">THE CORTEX MODEL / 02</p>
          <h2>Complex work.<br /><span>One direction.</span></h2>
          <p>
            You bring the objective. Cortex keeps the moving parts aligned — the brief, the context, the work and the evidence — without asking your team to understand the machinery underneath.
          </p>
        </div>
        <SystemMap />
      </section>

      <section className="landing__control">
        <div className="landing__control-index" data-reveal>03</div>
        <div className="landing__control-content">
          <div data-reveal>
            <p className="landing__kicker">CONTROL WITHOUT THE MACHINERY</p>
            <h2>See what is moving.<br /><span>Decide what matters.</span></h2>
            <p className="landing__control-lead">
              Every result arrives with its path attached. What happened, why it happened and where your judgment belongs stay visible from first brief to final sign-off.
            </p>
          </div>

          <div className="landing__sequence" data-reveal>
            <div>
              <span>01</span>
              <strong>Set the direction</strong>
              <p>Start with a business outcome, not a prompt.</p>
            </div>
            <div>
              <span>02</span>
              <strong>Let the system move</strong>
              <p>Capabilities are coordinated around the work.</p>
            </div>
            <div>
              <span>03</span>
              <strong>Keep the decision</strong>
              <p>People stay accountable for what matters.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing__closing" data-reveal>
        <CortexMark className="landing__closing-mark" aria-hidden="true" />
        <div>
          <p className="landing__kicker">PRIVATE ACCESS / CORTEX</p>
          <h2>Bring one difficult<br /><span>workflow.</span></h2>
          <p>We will show you the system behind it.</p>
          <a className="landing__closing-action" href="#access">Request early access <span aria-hidden="true">↗</span></a>
        </div>
      </section>

      <footer className="landing__footer">
        <Link className="landing__brand" to="/hero-lab" aria-label="Cortex home">
          <CortexMark aria-hidden="true" />
          <span>CORTEX</span>
        </Link>
        <span>Operational intelligence for the work that matters.</span>
      </footer>
    </main>
  );
}
