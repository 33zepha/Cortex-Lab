import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { Link } from "react-router-dom";
import { CortexMark } from "@/components/brand/CortexMark";
import "./HeroLabScreen.css";

type WaitlistStatus = "idle" | "invalid" | "loading" | "success" | "error";

function OperatingDiagram() {
  return (
    <figure className="landing-diagram" data-reveal aria-labelledby="diagram-title">
      <div className="landing-diagram__topline">
        <span id="diagram-title">One business objective</span>
        <span>One accountable result</span>
      </div>

      <div className="landing-diagram__canvas">
        <svg className="landing-diagram__flow" viewBox="0 0 640 480" role="img" aria-label="An objective moves through Cortex and returns as a reviewable result">
          <path className="landing-diagram__path landing-diagram__path--input" d="M28 102C150 102 155 238 302 238" />
          <path className="landing-diagram__path landing-diagram__path--context" d="M28 238C145 238 182 238 302 238" />
          <path className="landing-diagram__path landing-diagram__path--judgement" d="M28 374C150 374 155 238 302 238" />
          <path className="landing-diagram__path landing-diagram__path--work" d="M302 238C440 238 442 112 612 112" />
          <path className="landing-diagram__path landing-diagram__path--proof" d="M302 238C440 238 442 364 612 364" />
          <circle className="landing-diagram__node landing-diagram__node--input" cx="28" cy="102" r="4" />
          <circle className="landing-diagram__node landing-diagram__node--context" cx="28" cy="238" r="4" />
          <circle className="landing-diagram__node landing-diagram__node--judgement" cx="28" cy="374" r="4" />
          <circle className="landing-diagram__node landing-diagram__node--core" cx="302" cy="238" r="8" />
          <circle className="landing-diagram__node landing-diagram__node--work" cx="612" cy="112" r="4" />
          <circle className="landing-diagram__node landing-diagram__node--proof" cx="612" cy="364" r="4" />
        </svg>

        <div className="landing-diagram__label landing-diagram__label--input">
          <span>01 / Objective</span>
          <strong>Launch the next offer.</strong>
        </div>
        <div className="landing-diagram__label landing-diagram__label--context">
          <span>02 / Context</span>
          <strong>Keep the constraints in view.</strong>
        </div>
        <div className="landing-diagram__label landing-diagram__label--judgement">
          <span>03 / Judgment</span>
          <strong>Leave the decision with people.</strong>
        </div>

        <div className="landing-diagram__core" aria-hidden="true">
          <CortexMark />
          <span>Cortex</span>
        </div>

        <div className="landing-diagram__label landing-diagram__label--work">
          <span>04 / Work</span>
          <strong>Right capability, right moment.</strong>
        </div>
        <div className="landing-diagram__label landing-diagram__label--proof">
          <span>05 / Proof</span>
          <strong>A result your team can review.</strong>
        </div>
      </div>

      <figcaption>Many moving parts. One place to keep the outcome in view.</figcaption>
    </figure>
  );
}

function RequestForm({
  email,
  emailRef,
  status,
  error,
  onEmailChange,
  onSubmit,
  onClose,
  onReset,
}: {
  email: string;
  emailRef: RefObject<HTMLInputElement>;
  status: WaitlistStatus;
  error: string;
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onReset: () => void;
}) {
  if (status === "success") {
    return (
      <div className="landing-request__success" role="status" aria-live="polite">
        <CortexMark aria-hidden="true" />
        <div>
          <strong>Request received.</strong>
          <p>We’ll be in touch when there is a useful conversation to have.</p>
        </div>
        <button type="button" onClick={onReset}>Send another</button>
      </div>
    );
  }

  return (
    <form className="landing-request__form" noValidate onSubmit={onSubmit}>
      <label htmlFor="landing-request-email">Where should we send the walkthrough?</label>
      <div className="landing-request__row">
        <input
          ref={emailRef}
          id="landing-request-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          aria-invalid={status === "invalid"}
          aria-describedby={status === "invalid" || status === "error" ? "landing-request-error" : undefined}
          required
          onInvalid={() => onEmailChange(email)}
          onChange={(event) => onEmailChange(event.target.value)}
        />
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Sending…" : "Send request ↗"}
        </button>
      </div>
      <div className="landing-request__meta">
        <p id="landing-request-error" role={status === "invalid" || status === "error" ? "alert" : undefined}>
          {status === "invalid" ? "Enter a valid work email." : status === "error" ? error : "No pitch deck. We start with one real workflow."}
        </p>
        <button type="button" onClick={onClose}>Close</button>
      </div>
    </form>
  );
}

export function HeroLabScreen() {
  const emailRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
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
    if (window.location.hash === "#waitlist") setRequestOpen(true);
  }, []);

  useEffect(() => {
    if (requestOpen && requestStatus !== "success") {
      window.requestAnimationFrame(() => emailRef.current?.focus());
    }
  }, [requestOpen, requestStatus]);

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
      { threshold: 0.16, rootMargin: "0px 0px -8%" },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleRequestOpen = () => {
    setRequestStatus("idle");
    setRequestError("");
    setRequestOpen(true);
  };

  const handleRequestClose = () => {
    if (requestStatus === "loading") return;
    setRequestOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

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
      <div className="landing__texture" aria-hidden="true" />

      <section className="landing__hero">
        <div className="landing__wash" aria-hidden="true" />
        <header className="landing__nav">
          <Link className="landing__brand" to="/hero-lab" aria-label="Cortex home">
            <CortexMark aria-hidden="true" />
            <span>CORTEX</span>
          </Link>
          <button className="landing__nav-action" type="button" onClick={handleRequestOpen}>
            Request a private walkthrough <span aria-hidden="true">↗</span>
          </button>
        </header>

        <div className="landing__hero-grid">
          <div className="landing__copy" data-reveal>
            <p className="landing__eyebrow">For companies putting AI to work</p>
            <h1 id="landing-title">
              <span>AI is easy</span>
              <span>to buy.</span>
              <em>Hard to run.</em>
            </h1>
            <p className="landing__lead">
              Cortex turns a business objective into coordinated work. The brief stays visible, the right capabilities are called in, and every result comes back with a trail your team can review.
            </p>
            <div className="landing__actions">
              <button ref={triggerRef} className="landing__primary-action" type="button" onClick={handleRequestOpen}>
                See Cortex in context <span aria-hidden="true">↗</span>
              </button>
              <a className="landing__text-action" href="#why-cortex">
                Why it matters <span aria-hidden="true">↓</span>
              </a>
            </div>

            <div className="landing-request" data-open={requestOpen} data-status={requestStatus}>
              {requestOpen && (
                <RequestForm
                  email={email}
                  emailRef={emailRef}
                  status={requestStatus}
                  error={requestError}
                  onEmailChange={handleEmailChange}
                  onSubmit={handleSubmit}
                  onClose={handleRequestClose}
                  onReset={() => setRequestStatus("idle")}
                />
              )}
            </div>
          </div>

          <OperatingDiagram />
        </div>

        <div className="landing__hero-footer" data-reveal>
          <span>One brief</span>
          <span>Many capabilities</span>
          <span>Clear accountability</span>
        </div>
      </section>

      <section id="why-cortex" className="landing__section landing__section--paper" data-reveal>
        <div className="landing__section-number">01</div>
        <div className="landing__section-main">
          <h2>The goal is yours.<br /><em>The coordination is ours.</em></h2>
          <p className="landing__section-lead">
            You should not have to learn the machinery behind AI to get useful work out of it. Cortex keeps that complexity underneath a simple operating question: what needs to happen next?
          </p>

          <div className="landing__logic" data-reveal>
            <div className="landing__logic-item">
              <span>The brief</span>
              <strong>Start with the outcome, not a prompt.</strong>
            </div>
            <div className="landing__logic-item">
              <span>The work</span>
              <strong>Call in the right people, tools and models.</strong>
            </div>
            <div className="landing__logic-item">
              <span>The proof</span>
              <strong>Review what happened before you sign off.</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="landing__section landing__section--ink" data-reveal>
        <div className="landing__section-number">02</div>
        <div className="landing__section-main landing__section-main--wide">
          <h2>Less time managing the tools.<br /><em>More time deciding what matters.</em></h2>
          <div className="landing__questions" data-reveal>
            <div className="landing__question">
              <span>What is it doing?</span>
              <p>Every mission keeps its objective and current state in view.</p>
            </div>
            <div className="landing__question">
              <span>Why did it choose that?</span>
              <p>The path and the evidence stay attached to the result.</p>
            </div>
            <div className="landing__question">
              <span>Where do I decide?</span>
              <p>Human judgment remains a visible part of the work.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing__closing" data-reveal>
        <CortexMark className="landing__closing-mark" aria-hidden="true" />
        <div>
          <p className="landing__eyebrow">Bring one real workflow</p>
          <h2>We’ll show you<br /><em>the system behind it.</em></h2>
          <button className="landing__primary-action landing__primary-action--light" type="button" onClick={handleRequestOpen}>
            Request a private walkthrough <span aria-hidden="true">↗</span>
          </button>
        </div>
      </section>

      <footer className="landing__footer">
        <Link className="landing__brand" to="/hero-lab" aria-label="Cortex home">
          <CortexMark aria-hidden="true" />
          <span>CORTEX</span>
        </Link>
        <span>Operational intelligence for companies.</span>
      </footer>
    </main>
  );
}
