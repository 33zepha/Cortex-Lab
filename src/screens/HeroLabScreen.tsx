import {
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import { ReactLenis } from "lenis/react";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import heroPixelCloud1920 from "@/assets/cortex-hero-pixel-cloud-1920.webp";
import heroPixelCloud2560 from "@/assets/cortex-hero-pixel-cloud-2560.webp";
import heroPixelCloud3840 from "@/assets/cortex-hero-pixel-cloud-3840.webp";
import { CortexLogo } from "@/components/brand/CortexLogo";
import { LandingSections } from "@/landing/LandingSections";
import "lenis/dist/lenis.css";
import "./HeroLabScreen.css";

type WaitlistStatus = "idle" | "invalid" | "loading" | "success" | "error";

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
  const emailRef = useRef<HTMLInputElement>(null);
  const [requestStatus, setRequestStatus] = useState<WaitlistStatus>("idle");
  const [requestError, setRequestError] = useState("");
  const [email, setEmail] = useState("");

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

  return (
    <main className="inside" aria-labelledby="inside-title">
      <ReactLenis root options={{ lerp: 0.08, smoothWheel: true, syncTouch: false }} />

      <header className="inside-nav">
        <nav className="inside-nav__shell" aria-label="Primary navigation">
          <Link className="inside-nav__brand" to="/" aria-label="Cortex home">
            <CortexLogo aria-hidden="true" />
            <span>CORTEX</span>
          </Link>
          <div className="inside-nav__links">
            <Link to="/project">The system</Link>
            <a href="#access">Access</a>
          </div>
          <Link className="inside-nav__signin" to="/login">Sign in</Link>
        </nav>
      </header>

      <section className="inside-entry">
        <div className="inside-entry__sticky">
          <picture className="inside-entry__art" aria-hidden="true">
            <source
              type="image/webp"
              srcSet={`${heroPixelCloud1920} 1920w, ${heroPixelCloud2560} 2560w, ${heroPixelCloud3840} 3840w`}
              sizes="100vw"
            />
            <img
              src={heroPixelCloud1920}
              alt=""
              draggable={false}
              fetchPriority="high"
            />
          </picture>
          <div className="inside-entry__wash" aria-hidden="true" />
          <div className="inside-entry__content">
            <h1 id="inside-title"><span>One objective.</span><span>Every action aligned.</span></h1>
            <p>Cortex turns one objective into coordinated work—with the evidence to stand behind it.</p>
            <a className="inside-entry__cta" href="#access">Request access</a>
          </div>
          <a className="inside-entry__scroll" href="#manifesto" aria-label="Scroll to discover Cortex" />
        </div>
      </section>

      <LandingSections />

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
