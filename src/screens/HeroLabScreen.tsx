import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import Dither from "@/components/hero/Dither";
import cortexHeroMark from "@/assets/cortex-hero-mark.png";
import "./HeroLabScreen.css";

const COMPONENTS = [
  { index: "01", name: "Context", detail: "The work stays in view.", signal: "context" },
  { index: "02", name: "Models", detail: "Capabilities, in formation.", signal: "models" },
  { index: "03", name: "Agents", detail: "Specialists, aligned.", signal: "agents" },
  { index: "04", name: "Execution", detail: "Every move, visible.", signal: "execution" },
] as const;

const AGENTS = [
  { name: "Planner", state: "framing intent", x: 17, y: 50, tone: "quiet" },
  { name: "Researcher", state: "assembling context", x: 40, y: 18, tone: "active" },
  { name: "Builder", state: "moving the work", x: 71, y: 25, tone: "active" },
  { name: "Evaluator", state: "checking the result", x: 82, y: 71, tone: "quiet" },
] as const;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(value: number) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function phase(progress: number, start: number, end: number) {
  return smoothstep((progress - start) / (end - start));
}

function updateJourney(journey: HTMLElement, progress: number) {
  const intro = 1 - phase(progress, 0.08, 0.25);
  const componentsIn = phase(progress, 0.14, 0.27);
  const componentsOut = phase(progress, 0.42, 0.53);
  const components = componentsIn * (1 - componentsOut);
  const graphIn = phase(progress, 0.42, 0.55);
  const graphOut = phase(progress, 0.69, 0.82);
  const graph = graphIn * (1 - graphOut);
  const waitlist = phase(progress, 0.69, 0.88);

  journey.style.setProperty("--journey-progress", progress.toFixed(3));
  journey.style.setProperty("--hero-field-scale", (1.012 + progress * 1.62).toFixed(3));
  journey.style.setProperty("--hero-field-rotate", `${(progress * 1.4 - 0.2).toFixed(2)}deg`);
  journey.style.setProperty("--hero-intro-opacity", intro.toFixed(3));
  journey.style.setProperty("--hero-intro-y", `${((1 - intro) * -26).toFixed(1)}px`);
  journey.style.setProperty("--hero-components-opacity", components.toFixed(3));
  journey.style.setProperty("--hero-components-y", `${((1 - components) * 28).toFixed(1)}px`);
  journey.style.setProperty("--hero-components-scale", (0.96 + components * 0.04).toFixed(3));
  journey.style.setProperty("--hero-graph-opacity", graph.toFixed(3));
  journey.style.setProperty("--hero-graph-y", `${((1 - graph) * 30).toFixed(1)}px`);
  journey.style.setProperty("--hero-graph-scale", (0.965 + graph * 0.035).toFixed(3));
  journey.style.setProperty("--hero-waitlist-opacity", waitlist.toFixed(3));
  journey.style.setProperty("--hero-waitlist-y", `${((1 - waitlist) * 32).toFixed(1)}px`);
  journey.style.setProperty("--hero-waitlist-scale", (0.96 + waitlist * 0.04).toFixed(3));

  journey.dataset.journeyStage =
    waitlist > 0.5 ? "waitlist" : graph > 0.5 ? "agents" : components > 0.5 ? "components" : "surface";
}

export function HeroLabScreen() {
  const journeyRef = useRef<HTMLDivElement>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const journey = journeyRef.current;
    if (!journey) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const travel = Math.max(1, journey.offsetHeight - window.innerHeight);
      const progress = clamp01(-journey.getBoundingClientRect().top / travel);
      updateJourney(journey, progress);
    };
    const scheduleMeasure = () => {
      if (frame === 0) frame = window.requestAnimationFrame(measure);
    };

    scheduleMeasure();
    window.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", scheduleMeasure);

    return () => {
      window.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
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

          <section className="hero-lab__layer hero-lab__components" aria-labelledby="hero-components-title">
            <div className="hero-lab__layer-inner hero-lab__components-inner">
              <div className="hero-lab__section-heading">
                <p className="hero-lab__kicker">Inside the layer</p>
                <h2 id="hero-components-title">Four parts.<br /><em>One motion.</em></h2>
              </div>

              <div className="hero-lab__components-grid">
                {COMPONENTS.map((component) => (
                  <article className="hero-lab__component-card" key={component.name}>
                    <div className={`hero-lab__component-signal hero-lab__component-signal--${component.signal}`} aria-hidden="true">
                      <span /><span /><span /><span />
                    </div>
                    <div className="hero-lab__component-meta">
                      <span>{component.index}</span>
                      <span>system</span>
                    </div>
                    <h3>{component.name}</h3>
                    <p>{component.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="hero-lab__layer hero-lab__graph" aria-labelledby="hero-graph-title">
            <div className="hero-lab__layer-inner hero-lab__graph-inner">
              <div className="hero-lab__section-heading hero-lab__graph-heading">
                <p className="hero-lab__kicker">Agents in relation</p>
                <h2 id="hero-graph-title">Coordination<br /><em>you can see.</em></h2>
              </div>

              <div className="hero-lab__graph-canvas" role="img" aria-label="A visible relation graph connecting Planner, Researcher, Builder and Evaluator">
                <svg className="hero-lab__graph-lines" viewBox="0 0 600 300" fill="none" aria-hidden="true">
                  <path d="M98 150C164 150 176 64 240 64S325 114 365 114 425 82 493 82" />
                  <path d="M98 150C174 150 193 238 272 238S366 180 430 180 475 194 505 216" />
                  <path d="M240 64C300 64 300 114 365 114" />
                  <path d="M365 114C399 114 397 180 430 180" />
                  <circle cx="365" cy="114" r="4" />
                  <circle cx="430" cy="180" r="3" />
                </svg>

                <div className="hero-lab__graph-center">
                  <span className="hero-lab__graph-center-dot" />
                  <span>intent</span>
                </div>

                {AGENTS.map((agent) => (
                  <div
                    className={`hero-lab__agent-node hero-lab__agent-node--${agent.tone}`}
                    key={agent.name}
                    style={{ "--node-x": `${agent.x}%`, "--node-y": `${agent.y}%` } as CSSProperties}
                  >
                    <span className="hero-lab__agent-node-dot" aria-hidden="true" />
                    <span className="hero-lab__agent-node-copy">
                      <strong>{agent.name}</strong>
                      <small>{agent.state}</small>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="hero-lab__layer hero-lab__waitlist" aria-labelledby="hero-waitlist-title">
            <div className="hero-lab__layer-inner hero-lab__waitlist-inner">
              <div className="hero-lab__waitlist-mark" aria-hidden="true">
                <img src={cortexHeroMark} alt="" draggable={false} />
              </div>
              <p className="hero-lab__kicker">The next layer</p>
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
            </div>
          </section>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#10261d]/24 to-transparent" />
        </section>
      </div>
    </main>
  );
}
