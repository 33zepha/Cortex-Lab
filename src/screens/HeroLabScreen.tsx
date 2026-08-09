import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Dither from "@/components/hero/Dither";
import cortexHeroMark from "@/assets/cortex-hero-mark.png";
import "./HeroLabScreen.css";

const TYPEFACES = new Set(["syne", "unbounded", "newsreader"]);

type WaitlistStatus = "idle" | "invalid" | "loading" | "success" | "error";

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smootherstep(value: number) {
  const t = clamp01(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function phase(progress: number, start: number, end: number) {
  return smootherstep((progress - start) / (end - start));
}

function updateJourney(journey: HTMLElement, progress: number) {
  const surface = 1 - phase(progress, 0.2, 0.36);
  const threshold = phase(progress, 0.16, 0.38) * (1 - phase(progress, 0.62, 0.78));
  const access = phase(progress, 0.58, 0.84);
  const lensProgress = phase(progress, 0.14, 0.86);
  const mistArrives = phase(progress, 0.1, 0.4);
  const mistLeaves = 1 - phase(progress, 0.58, 0.88);
  const mist = clamp01(mistArrives * mistLeaves);
  const introExit = phase(progress, 0.28, 0.68);
  const intro = 1 - phase(progress, 0.44, 0.73);
  const drift = phase(progress, 0.06, 0.94);
  const stage = progress < 0.25 ? "surface" : progress < 0.72 ? "threshold" : "access";

  journey.style.setProperty("--journey-progress", progress.toFixed(4));
  journey.style.setProperty("--hero-surface-progress", surface.toFixed(4));
  journey.style.setProperty("--hero-threshold-progress", threshold.toFixed(4));
  journey.style.setProperty("--hero-access-progress", access.toFixed(4));
  journey.style.setProperty("--hero-lens-progress", lensProgress.toFixed(4));
  journey.style.setProperty("--hero-logo-scale", mix(1, 1.78, phase(progress, 0.14, 0.88)).toFixed(4));
  journey.style.setProperty("--hero-logo-opacity", mix(1, 0.94, access).toFixed(4));
  journey.style.setProperty("--hero-logo-glow", mix(0.5, 0.88, lensProgress).toFixed(4));

  journey.style.setProperty("--hero-field-scale", mix(1.004, 1.022, drift).toFixed(4));
  journey.style.setProperty("--hero-field-rotate", `${mix(-0.04, 0.04, drift).toFixed(3)}deg`);
  journey.style.setProperty("--hero-field-x", `${mix(0, -0.45, drift).toFixed(2)}%`);
  journey.style.setProperty("--hero-field-y", `${mix(0, -0.25, drift).toFixed(2)}%`);
  journey.style.setProperty("--hero-field-brightness", mix(1, 0.9, clamp01(mist * 0.38 + access * 0.08)).toFixed(3));
  journey.style.setProperty("--hero-field-saturate", mix(1, 0.92, clamp01(mist * 0.38 + access * 0.06)).toFixed(3));

  journey.style.setProperty("--hero-glow-opacity", mix(0.72, 0.38, clamp01(mist * 0.78 + access * 0.12)).toFixed(3));
  journey.style.setProperty("--hero-mist-opacity", (mist * 0.62 + access * 0.06).toFixed(4));
  journey.style.setProperty("--hero-mist-scale", mix(0.92, 1.06, mistArrives).toFixed(4));
  journey.style.setProperty("--hero-mist-x", `${mix(7, -5, phase(progress, 0.12, 0.84)).toFixed(2)}%`);
  journey.style.setProperty("--hero-mist-y", `${mix(4, -4, phase(progress, 0.16, 0.78)).toFixed(2)}%`);
  journey.style.setProperty("--hero-mist-rotate", `${mix(-2, 2, phase(progress, 0.14, 0.82)).toFixed(2)}deg`);
  journey.style.setProperty("--hero-lens-radius", `${mix(5.5, 24, lensProgress).toFixed(2)}%`);

  journey.style.setProperty("--hero-intro-opacity", intro.toFixed(4));
  journey.style.setProperty("--hero-intro-y", `${mix(0, -28, introExit).toFixed(1)}px`);
  journey.style.setProperty("--hero-intro-scale", mix(1, 0.94, introExit).toFixed(4));
  journey.style.setProperty("--hero-intro-rotate", `${mix(0, -0.7, introExit).toFixed(2)}deg`);
  journey.style.setProperty("--hero-intro-blur", `${mix(0, 3.2, introExit).toFixed(2)}px`);
  journey.style.setProperty("--hero-text-drift", `${mix(0, -3.5, threshold).toFixed(2)}px`);
  journey.style.setProperty("--hero-scroll-opacity", (1 - phase(progress, 0.04, 0.24)).toFixed(4));

  journey.style.setProperty("--hero-access-opacity", access.toFixed(4));
  journey.style.setProperty("--hero-access-y", `${mix(26, 0, access).toFixed(1)}px`);
  journey.style.setProperty("--hero-access-scale", mix(0.975, 1, access).toFixed(4));
  journey.style.setProperty("--hero-access-blur", `${mix(3.2, 0, access).toFixed(2)}px`);

  if (journey.dataset.journeyStage !== stage) {
    journey.dataset.journeyStage = stage;
    const accessLayer = journey.querySelector<HTMLElement>(".hero-lab__access");
    if (accessLayer) {
      const active = stage === "access";
      accessLayer.inert = !active;
      accessLayer.setAttribute("aria-hidden", String(!active));
    }
  }
}

export function HeroLabScreen() {
  const journeyRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistStatus, setWaitlistStatus] = useState<WaitlistStatus>("idle");
  const [waitlistError, setWaitlistError] = useState("");
  const [email, setEmail] = useState("");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const requestedTypeface = new URLSearchParams(window.location.search).get("type") ?? "unbounded";
  const typeface = TYPEFACES.has(requestedTypeface) ? requestedTypeface : "unbounded";

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setPrefersReducedMotion(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!waitlistOpen) return;
    window.requestAnimationFrame(() => emailRef.current?.focus());
  }, [waitlistOpen]);

  useEffect(() => {
    const journey = journeyRef.current;
    if (!journey) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let currentProgress = 0;
    let targetProgress = 0;
    let lastTime = performance.now();

    const readProgress = () => {
      const travel = Math.max(1, journey.offsetHeight - window.innerHeight);
      return clamp01(-journey.getBoundingClientRect().top / travel);
    };

    const render = (time: number) => {
      const delta = Math.min(0.04, Math.max(0.001, (time - lastTime) / 1000));
      lastTime = time;
      const distance = targetProgress - currentProgress;
      const follow = reducedMotion.matches ? 1 : 1 - Math.exp(-delta * 10.5);
      currentProgress += distance * follow;

      if (Math.abs(distance) < 0.00008) currentProgress = targetProgress;
      updateJourney(journey, currentProgress);

      if (currentProgress !== targetProgress) frame = window.requestAnimationFrame(render);
      else frame = 0;
    };

    const scheduleRender = () => {
      targetProgress = readProgress();
      if (reducedMotion.matches) currentProgress = targetProgress;
      if (frame === 0) {
        lastTime = performance.now();
        frame = window.requestAnimationFrame(render);
      }
    };

    currentProgress = readProgress();
    targetProgress = currentProgress;
    updateJourney(journey, currentProgress);

    if (window.location.hash === "#waitlist") {
      setWaitlistOpen(true);
      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: journey.offsetHeight - window.innerHeight,
          behavior: reducedMotion.matches ? "auto" : "smooth",
        });
      });
    }

    window.addEventListener("scroll", scheduleRender, { passive: true });
    window.addEventListener("resize", scheduleRender, { passive: true });
    reducedMotion.addEventListener("change", scheduleRender);

    return () => {
      window.removeEventListener("scroll", scheduleRender);
      window.removeEventListener("resize", scheduleRender);
      reducedMotion.removeEventListener("change", scheduleRender);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleWaitlistOpen = () => {
    setWaitlistStatus("idle");
    setWaitlistError("");
    setWaitlistOpen(true);
  };

  const handleWaitlistClose = () => {
    if (waitlistStatus === "loading") return;
    setWaitlistOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      setWaitlistStatus("invalid");
      emailRef.current?.focus();
      return;
    }

    setWaitlistStatus("loading");
    setWaitlistError("");

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

      setWaitlistStatus("success");
      setWaitlistOpen(false);
    } catch {
      setWaitlistStatus("error");
      setWaitlistError("Couldn’t record the request. Try again.");
    }
  };

  return (
    <main className="hero-lab relative min-h-[100dvh] bg-[#18372c] text-white" data-typeface={typeface} aria-labelledby="hero-lab-title">
      <div className="hero-lab__journey" ref={journeyRef}>
        <section className="hero-lab__stage" aria-label="Cortex introduction">
          <div className="hero-lab__field pointer-events-auto absolute inset-0" data-hero-layer="field" aria-hidden="true">
            <Dither
              waveColor={[0.5, 0.63, 0.55]}
              baseColor={[0.1, 0.16, 0.13]}
              highlightColor={[0.76, 0.82, 0.77]}
              colorNum={16}
              pixelSize={1.5}
              ditherBias={0.035}
              waveAmplitude={0.38}
              waveFrequency={2.45}
              waveSpeed={0.038}
              disableAnimation={prefersReducedMotion}
              enableMouseInteraction={!prefersReducedMotion}
              mouseRadius={0.34}
            />
          </div>

          <div className="hero-lab__veil pointer-events-none absolute inset-0" />
          <div className="hero-lab__glow pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="hero-lab__mist pointer-events-none absolute inset-0" aria-hidden="true"><span /><span /><span /></div>

          <div className="hero-lab__shared-mark" data-hero-layer="shared-mark" aria-hidden="true">
            <span className="hero-lab__shared-mark-shell">
              <img className="hero-lab__shared-logo" src={cortexHeroMark} alt="" draggable={false} />
            </span>
          </div>

          <div className="hero-lab__shell relative mx-auto flex min-h-[100dvh] max-w-[1680px] flex-col">
            <div className="hero-lab__content flex flex-1 items-center">
              <section className="hero-lab__copy">
                <div className="hero-lab__intro-lockup">
                  <span className="hero-lab__wordmark">CORTEX</span>
                  <h1 id="hero-lab-title" className="hero-lab__headline text-[#f2f4f1]">
                    <span className="hero-lab__headline-line" data-transient="Where scat·ered intelligence">Where scattered intelligence</span>
                    <span className="hero-lab__headline-line" data-transient="becomes coor·dinated action.">becomes <strong>coordinated action.</strong></span>
                  </h1>
                </div>
              </section>
            </div>
          </div>

          <span className="hero-lab__scroll-cue" aria-hidden="true"><span /></span>

          <section id="waitlist" className="hero-lab__access hero-lab__layer" aria-labelledby="hero-access-title">
            <div className="hero-lab__access-inner">
              <p className="hero-lab__access-kicker">EARLY ACCESS</p>
              <h2 id="hero-access-title">Be first inside Cortex.</h2>
              <p className="hero-lab__access-copy">Private access opens in small waves.</p>

              <div className="hero-lab__waitlist" data-waitlist-open={waitlistOpen} data-waitlist-status={waitlistStatus}>
                {waitlistStatus === "success" ? (
                  <div className="hero-lab__waitlist-success" role="status" aria-live="polite">
                    <span className="hero-lab__success-mark" aria-hidden="true" />
                    <strong>Access request received.</strong>
                    <span>We’ll keep the next opening close.</span>
                  </div>
                ) : waitlistOpen ? (
                  <form className="hero-lab__waitlist-form" noValidate onSubmit={handleSubmit} onKeyDown={(event) => event.key === "Escape" && handleWaitlistClose()}>
                    <label className="sr-only" htmlFor="hero-waitlist-email">Email address</label>
                    <input
                      ref={emailRef}
                      id="hero-waitlist-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={email}
                      aria-invalid={waitlistStatus === "invalid"}
                      aria-describedby={waitlistStatus === "invalid" || waitlistStatus === "error" ? "hero-waitlist-message" : undefined}
                      required
                      onInvalid={() => {
                        setWaitlistStatus("invalid");
                        setWaitlistError("Enter a valid email address.");
                      }}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (waitlistStatus === "invalid" || waitlistStatus === "error") setWaitlistStatus("idle");
                      }}
                    />
                    <button type="submit" disabled={waitlistStatus === "loading"}>
                      {waitlistStatus === "loading" ? "Sending…" : "Request access"}
                    </button>
                  </form>
                ) : (
                  <button ref={triggerRef} className="hero-lab__access-trigger" type="button" onClick={handleWaitlistOpen}>
                    Request access
                  </button>
                )}

                {waitlistStatus === "invalid" && <p id="hero-waitlist-message" className="hero-lab__waitlist-message" role="alert">Enter a valid email address.</p>}
                {waitlistStatus === "error" && <p id="hero-waitlist-message" className="hero-lab__waitlist-message" role="alert">{waitlistError}</p>}
              </div>

              <Link className="hero-lab__learn-more" to="/project">
                Discover the project <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </section>

        </section>
      </div>
    </main>
  );
}
