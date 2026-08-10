import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import cortexHeroMark from "@/assets/cortex-hero-mark.png";
import "./ProjectScreen.css";

const CHAPTERS = [
  {
    index: "01",
    eyebrow: "The problem",
    title: <>Intelligent work<br />is still <em>fragmented.</em></>,
    copy: "Context lives in one place, models in another, and execution disappears across tools. The more capable the system becomes, the harder it is to keep the work coherent.",
  },
  {
    index: "02",
    eyebrow: "The layer",
    title: <>One place for<br /><em>work in motion.</em></>,
    copy: "Cortex brings context, capabilities and execution into one operational layer. Work can move across specialists without losing its goal, state or history.",
  },
  {
    index: "03",
    eyebrow: "The principle",
    title: <>Coordination<br /><em>without opacity.</em></>,
    copy: "You keep visibility over what is happening, why it is happening and where human judgment belongs. Cortex coordinates the system; it does not hide it.",
  },
] as const;

export function ProjectScreen() {
  return (
    <main className="project-story">
      <header className="project-story__header">
        <Link className="project-story__brand" to="/" aria-label="Back to Cortex">
          <img src={cortexHeroMark} alt="" draggable={false} />
          <span>Cortex</span>
        </Link>
        <Link className="project-story__back" to="/">
          Back
          <ArrowLeft aria-hidden="true" />
        </Link>
      </header>

      <section className="project-story__intro" aria-labelledby="project-title">
        <p className="project-story__eyebrow">What Cortex is</p>
        <h1 id="project-title">A clearer way to run<br /><em>intelligent work.</em></h1>
        <p className="project-story__lead">Cortex is the operational layer between an intention and the systems capable of carrying it out.</p>
        <span className="project-story__scroll" aria-hidden="true">Scroll to understand <i /></span>
      </section>

      <div className="project-story__chapters">
        {CHAPTERS.map((chapter) => (
          <section className="project-story__chapter" key={chapter.index}>
            <div className="project-story__chapter-meta">
              <span>{chapter.index}</span>
              <span>{chapter.eyebrow}</span>
            </div>
            <div className="project-story__chapter-copy">
              <h2>{chapter.title}</h2>
              <p>{chapter.copy}</p>
            </div>
          </section>
        ))}
      </div>

      <section className="project-story__closing" aria-labelledby="project-closing-title">
        <img src={cortexHeroMark} alt="" draggable={false} />
        <p className="project-story__eyebrow">Early access</p>
        <h2 id="project-closing-title">See what takes<br /><em>shape next.</em></h2>
        <Link className="project-story__cta" to="/#access">
          Join the waitlist
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
