import { CortexHero } from "./reference/CortexHero";
import { CortexSystemMap } from "./reference/CortexSystemMap";
import "./ReferenceAppScreen.css";

export function ReferenceAppScreen() {
  return (
    <main className="cortex-reference">
      <CortexHero />

      <section className="cortex-reference__story" aria-labelledby="cortex-system-intro">
        <div className="cortex-reference__intro">
          <h2 id="cortex-system-intro">A brief enters as intent. It returns as coordinated work.</h2>
          <p>
            Cortex frames the objective. Hermes routes it through the right models and agents. Cortex reviews the
            trace and returns the result.
          </p>
        </div>

        <div className="cortex-reference__grid">
          <section className="cortex-reference__system" aria-label="Cortex operating path">
            <CortexSystemMap />
          </section>

          <aside className="cortex-reference__brief" aria-label="Example brief">
            <p>Research the market, then brief me before morning.</p>
          </aside>

          <section className="cortex-reference__result" aria-labelledby="cortex-result-title">
            <h3 id="cortex-result-title">A reasoned result, with the work behind it.</h3>
            <p>The evidence, decisions, and execution return as one reviewable outcome.</p>
          </section>

          <section className="cortex-reference__closing" id="access" aria-labelledby="cortex-closing-title">
            <h3 id="cortex-closing-title">One objective in. The right intelligence, coordinated around it.</h3>
            <a href="mailto:hello@cortexlab.online?subject=Private%20access%20request">Request private access</a>
          </section>
        </div>
      </section>
    </main>
  );
}

export default ReferenceAppScreen;
