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
import { Journey } from "@/journey/Journey";
import "./HeroLabScreen.css";

type WaitlistStatus = "idle" | "invalid" | "loading" | "success" | "error";

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

export function HeroLabScreen() {
  const entryRef = useRef<HTMLElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [entryProgress, setEntryProgress] = useState(0);
  const [requestStatus, setRequestStatus] = useState<WaitlistStatus>("idle");
  const [requestError, setRequestError] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const entry = entryRef.current?.getBoundingClientRect();
      if (!entry) return;
      const distance = Math.max(entry.height - window.innerHeight, 1);
      setEntryProgress(clamp(-entry.top / distance));
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
  }, []);

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

  return (
    <main className="inside" aria-labelledby="inside-title">
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

      <Journey />

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
