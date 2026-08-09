import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Dither from "@/components/hero/Dither";
import cortexHeroMark from "@/assets/cortex-hero-mark.png";
import "./HeroLabScreen.css";

const WAITLIST_REVEALS = [
  { name: "mark", start: 0, end: 0.34 },
  { name: "kicker", start: 0.08, end: 0.42 },
  { name: "title", start: 0.14, end: 0.5 },
  { name: "copy", start: 0.22, end: 0.58 },
  { name: "form", start: 0.3, end: 0.68 },
  { name: "link", start: 0.4, end: 0.76 },
] as const;

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
  const intro = 1 - phase(progress, 0.08, 0.42);
  const waitlist = phase(progress, 0.3, 0.78);
  const depth = smootherstep(progress);
  const waitlistReveal = phase(progress, 0.36, 0.84);

  journey.style.setProperty("--journey-progress", progress.toFixed(4));
  journey.style.setProperty("--hero-field-scale", mix(1.012, 2.22, depth).toFixed(4));
  journey.style.setProperty("--hero-field-rotate", `${mix(-0.14, 0.58, depth).toFixed(3)}deg`);
  journey.style.setProperty("--hero-field-x", `${mix(0, -1.2, depth).toFixed(2)}%`);
  journey.style.setProperty("--hero-field-y", `${mix(0, -0.65, depth).toFixed(2)}%`);
  journey.style.setProperty("--hero-glow-opacity", mix(0.72, 0.96, phase(progress, 0.05, 0.72)).toFixed(3));
  journey.style.setProperty("--hero-intro-opacity", intro.toFixed(4));
  journey.style.setProperty("--hero-intro-y", `${((1 - intro) * -24).toFixed(1)}px`);
  journey.style.setProperty("--hero-waitlist-opacity", waitlist.toFixed(4));
  journey.style.setProperty("--hero-waitlist-y", `${((1 - waitlist) * 34).toFixed(2)}px`);
  journey.style.setProperty("--hero-waitlist-scale", mix(0.96, 1, waitlist).toFixed(4));

  WAITLIST_REVEALS.forEach(({ name, start, end }) => {
    const reveal = phase(waitlistReveal, start, end);
    journey.style.setProperty(`--hero-waitlist-${name}`, reveal.toFixed(4));
    journey.style.setProperty(`--hero-waitlist-${name}-y`, `${mix(16, 0, reveal).toFixed(2)}px`);
  });

  const waitlistLayer = journey.querySelector<HTMLElement>(".hero-lab__waitlist");
  const active = waitlist > 0.5;
  if (journey.dataset.journeyStage !== (active ? "waitlist" : "surface")) {
    journey.dataset.journeyStage = active ? "waitlist" : "surface";
    if (waitlistLayer) {
      waitlistLayer.inert = !active;
      waitlistLayer.setAttribute("aria-hidden", String(!active));
    }
  }
}

export function HeroLabScreen() {
  const journeyRef = useRef<HTMLDivElement>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const journey = journeyRef.current;
    if (!journey) return;

    if (window.location.hash === "#waitlist") {
      window.requestAnimationFrame(() => window.scrollTo({ top: journey.offsetHeight, behavior: "smooth" }));
    }

    let frame = 0;
    let currentProgress = 0;
    let targetProgress = 0;
    let lastTime = performance.now();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }
    setJoined(true);
  };

  return (
    <main className="hero-lab relative min-h-[100dvh] bg-[#18372c] text-white" aria-labelledby="hero-lab-title">
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
              enableMouseInteraction={true}
              mouseRadius={0.34}
            />
          </div>

          <div className="hero-lab__veil pointer-events-none absolute inset-0" />
          <div className="hero-lab__glow pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="hero-lab__frame pointer-events-none absolute inset-x-6 bottom-6 top-6 sm:inset-x-10 sm:bottom-9 sm:top-9 lg:inset-x-14 xl:inset-x-16" />

          <div className="hero-lab__shell relative mx-auto flex min-h-[100dvh] max-w-[1680px] flex-col">
            <div className="hero-lab__content flex flex-1 items-center">
              <section className="hero-lab__copy max-w-[470px] lg:-translate-y-2 lg:max-w-[455px]">
                <div className="hero-lab__brand" aria-label="Cortex">
                  <img className="hero-lab__logo" src={cortexHeroMark} alt="Cortex mark" draggable={false} />
                </div>
                <div className="hero-lab__intro-lockup">
                  <h1 id="hero-lab-title" className="hero-lab__headline max-w-[470px] text-balance text-[#f2f4f1]">
                    <span>One</span>
                    <span className="hero-lab__headline-italic">operational</span>
                    <span className="hero-lab__headline-strong">layer.</span>
                  </h1>
                  <p className="hero-lab__promise">for intelligent work.</p>
                </div>
              </section>
            </div>
          </div>

          <span className="hero-lab__scroll-cue" aria-hidden="true"><span /></span>

          <section className="hero-lab__layer hero-lab__waitlist" aria-labelledby="hero-waitlist-title">
            <div className="hero-lab__layer-inner hero-lab__waitlist-inner">
              <div className="hero-lab__waitlist-mark" aria-hidden="true">
                <img src={cortexHeroMark} alt="" draggable={false} />
              </div>
              <p className="hero-lab__kicker">Early access</p>
              <h2 id="hero-waitlist-title">Cortex is<br /><em>taking shape.</em></h2>
              <p className="hero-lab__waitlist-copy">Join the first people inside the system.</p>

              {joined ? (
                <div className="hero-lab__waitlist-success" role="status" aria-live="polite">
                  <strong>You’re on the list.</strong>
                  <span>We’ll keep the next opening close.</span>
                </div>
              ) : (
                <form className="hero-lab__waitlist-form" onSubmit={handleSubmit}>
                  <label className="sr-only" htmlFor="hero-waitlist-email">Email address</label>
                  <input id="hero-waitlist-email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
                  <button type="submit">Join the waitlist <span aria-hidden="true">↗</span></button>
                </form>
              )}

              <Link className="hero-lab__learn-more" to="/project">
                Learn more <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </section>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#10261d]/24 to-transparent" />
        </section>
      </div>
    </main>
  );
}
