import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Menu, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { CortexLogo } from "@/components/brand/CortexLogo";
import "./HeroLabScreen.css";

function PanelHeader() {
  return (
    <header className="cortex-panel-header">
      <Link className="cortex-panel-header__brand" to="/" aria-label="Cortex home">
        <CortexLogo aria-hidden="true" />
        <span>CORTEX</span>
      </Link>
      <div className="cortex-panel-header__actions">
        <Link className="cortex-pill cortex-pill--dark cortex-panel-header__cta" to="/signup">
          Get started
        </Link>
        <button className="cortex-menu-button" type="button" aria-label="Open menu">
          <Menu aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

function SessionsChart() {
  return (
    <div className="cortex-chart">
      <div className="cortex-chart__topline">
        <strong>Sessions</strong>
        <MoreHorizontal aria-hidden="true" />
      </div>
      <div className="cortex-chart__legend">
        <span><i className="cortex-chart__dot cortex-chart__dot--yellow" />New signal</span>
        <span><i className="cortex-chart__dot cortex-chart__dot--blue" />Active mission</span>
      </div>
      <svg viewBox="0 0 300 138" role="img" aria-label="Sessions trend chart">
        <g className="cortex-chart__grid">
          <path d="M29 15H289" />
          <path d="M29 48H289" />
          <path d="M29 81H289" />
          <path d="M29 114H289" />
        </g>
        <path className="cortex-chart__line cortex-chart__line--yellow" d="M29 48C45 58 54 105 73 90S97 46 114 62s20 27 36 19 24 31 44 11 23-49 39-19 33 38 56 11" />
        <path className="cortex-chart__line cortex-chart__line--blue" d="M29 28C43 50 52 75 69 82s28-17 43-8 19 16 31 14 21-15 36-14 23 29 38 17 27-34 40-20 21 25 32 19 26 18 40 36" />
        <g className="cortex-chart__labels">
          <text x="26" y="132">1 Sep</text>
          <text x="103" y="132">7 Sep</text>
          <text x="181" y="132">14 Sep</text>
          <text x="261" y="132">21 Sep</text>
          <text x="0" y="18">100</text>
          <text x="2" y="51">75</text>
          <text x="2" y="84">50</text>
          <text x="2" y="117">0</text>
        </g>
      </svg>
    </div>
  );
}

function RevenueChart() {
  return (
    <div className="cortex-chart cortex-chart--revenue">
      <div className="cortex-chart__topline">
        <div>
          <small>Impact</small>
          <strong>$45.43K</strong>
        </div>
        <span className="cortex-growth">↗ 11% this last month</span>
      </div>
      <svg viewBox="0 0 300 135" role="img" aria-label="Impact trend chart">
        <g className="cortex-chart__grid">
          <path d="M28 20H288" />
          <path d="M28 52H288" />
          <path d="M28 84H288" />
          <path d="M28 116H288" />
        </g>
        <path className="cortex-chart__area" d="M28 82C50 96 60 109 80 101s25-37 43-36 27 43 45 45 25-43 44-47 44 1 76 7v46H28Z" />
        <path className="cortex-chart__line cortex-chart__line--violet" d="M28 82C50 96 60 109 80 101s25-37 43-36 27 43 45 45 25-43 44-47 44 1 76 7" />
        <g className="cortex-chart__labels">
          <text x="25" y="132">1 Sep</text>
          <text x="91" y="132">7 Sep</text>
          <text x="157" y="132">14 Sep</text>
          <text x="223" y="132">21 Sep</text>
          <text x="275" y="132">28 Sep</text>
          <text x="0" y="22">$16k</text>
          <text x="0" y="86">$8k</text>
        </g>
      </svg>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="cortex-dashboard-preview" aria-hidden="true">
      <aside className="cortex-dashboard-preview__sidebar">
        <div className="cortex-dashboard-preview__mini-brand"><CortexLogo /> <span>CORTEX</span></div>
        <span className="cortex-dashboard-preview__nav cortex-dashboard-preview__nav--active">Mission overview</span>
        <span className="cortex-dashboard-preview__nav">Signals</span>
        <span className="cortex-dashboard-preview__nav">Evidence</span>
        <span className="cortex-dashboard-preview__nav">Collaborators</span>
        <span className="cortex-dashboard-preview__nav">History</span>
      </aside>
      <div className="cortex-dashboard-preview__main">
        <div className="cortex-dashboard-preview__toolbar"><span>Profile</span><span>03 Sep 2025 — 27 Sep 2025</span></div>
        <div className="cortex-dashboard-preview__stats">
          <div><small>Signals</small><strong>605</strong></div>
          <div><small>Mission time</small><strong>00:13:52</strong></div>
          <div><small>Sources</small><strong>617</strong></div>
          <div><small>Teams</small><strong>34</strong></div>
        </div>
        <div className="cortex-dashboard-preview__graph">
          <div className="cortex-dashboard-preview__graph-head"><span>Signal movement</span><i /><i /></div>
          <svg viewBox="0 0 240 90"><path d="M3 58c18-30 28-28 45-2s26 15 40-1 24-22 37-7 20 24 34 7 23-36 39-18 21 26 39 17" /><path d="M3 39c15 17 25 24 41 19s25-34 39-18 25 30 38 13 21-24 36-14 22 23 37 5 25-19 43 11" /></svg>
        </div>
      </div>
    </div>
  );
}

function AdsPreview() {
  return (
    <div className="cortex-ads-preview" aria-hidden="true">
      <div className="cortex-ads-preview__title"><span className="cortex-meta-icon">◉</span><strong>Mission channels</strong></div>
      <div className="cortex-ads-preview__metrics">
        <div><small>Sources</small><strong>$2.60k</strong><span className="cortex-metric-chip cortex-metric-chip--green">↗ 14% this month</span></div>
        <div><small>Evidence</small><strong>$4.90k</strong><span className="cortex-metric-chip cortex-metric-chip--red">↘ 8% this month</span></div>
      </div>
    </div>
  );
}

function Testimonial() {
  return (
    <figure className="cortex-testimonial">
      <blockquote>“Cortex has transformed the way we move from one objective to work people can actually prove. The clarity is a game changer.”</blockquote>
      <div className="cortex-testimonial__person">
        <div className="cortex-avatar" aria-hidden="true">M</div>
        <strong>Maya Chen</strong>
        <span>Operations Lead, Northstar</span>
      </div>
      <div className="cortex-testimonial__controls">
        <button type="button" aria-label="Previous testimonial"><ArrowLeft aria-hidden="true" /></button>
        <button type="button" aria-label="Next testimonial"><ArrowRight aria-hidden="true" /></button>
      </div>
    </figure>
  );
}

function MenuCard() {
  const items = ["Product", "Missions", "Solutions", "Company", "Pricing"];
  return (
    <section className="cortex-menu-card" aria-label="Cortex menu">
      <nav>
        {items.map((item) => (
          <Link to="/project" key={item}>
            <span>{item}</span>
            <ChevronRight aria-hidden="true" />
          </Link>
        ))}
      </nav>
      <div className="cortex-menu-card__actions">
        <Link className="cortex-pill cortex-pill--lavender" to="/login">Log in</Link>
        <Link className="cortex-pill cortex-pill--dark" to="/signup">Get started</Link>
      </div>
    </section>
  );
}

function PricingCard() {
  return (
    <section className="cortex-panel cortex-pricing-card" aria-labelledby="cortex-plan-title">
      <PanelHeader />
      <div className="cortex-pricing-card__body">
        <h2 id="cortex-plan-title">Choose your right plan.</h2>
        <p>Choose the plan that fits the complexity of your work and keeps every decision connected to evidence.</p>
        <div className="cortex-segmented" role="group" aria-label="Billing period">
          <span className="cortex-segmented__active">Monthly</span>
          <span>Yearly</span>
        </div>
        <div className="cortex-plan">
          <h3>Field</h3>
          <p>Start with the essential context to move from objective to action with precision.</p>
          <hr />
          <h4>Free</h4>
          <ul>
            {["1 active mission.", "Up to 50,000 source pages per month.", "Templates to start quickly.", "Unlimited collaborators."].map((item) => (
              <li key={item}><Check aria-hidden="true" />{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function HeroLabScreen() {
  return (
    <main className="cortex-reference" aria-labelledby="cortex-page-title">
      <div className="cortex-reference__stage">
        <section className="cortex-panel cortex-column cortex-column--intro">
          <PanelHeader />
          <div className="cortex-column__body cortex-intro">
            <h1 id="cortex-page-title">Uncover the signal behind every decision.</h1>
            <p>Turn complex work into a clear operating picture, connect the evidence, and move with precision.</p>
            <Link className="cortex-pill cortex-pill--dark cortex-intro__cta" to="/signup">Start a mission</Link>
            <div className="cortex-media cortex-media--dashboard"><DashboardPreview /></div>
          </div>
        </section>

        <section className="cortex-panel cortex-column cortex-column--metrics">
          <PanelHeader />
          <div className="cortex-column__body">
            <div className="cortex-media cortex-media--sessions"><SessionsChart /></div>
            <h2>Unlock operational clarity</h2>
            <p>Gain instant insight into the state of your work, with real-time signals that keep every decision connected.</p>
            <div className="cortex-media cortex-media--revenue"><RevenueChart /></div>
            <h2>Increase confidence with live context</h2>
            <p>Use Cortex to surface the right evidence at the right moment, so your team can act without losing the thread.</p>
            <div className="cortex-media cortex-media--ads"><AdsPreview /></div>
          </div>
        </section>

        <section className="cortex-column cortex-column--showcase">
          <Testimonial />
          <div className="cortex-showcase__body">
            <h2>Make the right move. Transform your strategy.</h2>
            <p>Experience a clearer way to understand consequential work. Bring objectives, signals, and proof into one operating system.</p>
            <Link className="cortex-pill cortex-pill--dark cortex-showcase__cta" to="/signup">Get started</Link>
            <div className="cortex-product-menu">
              <h3>Product</h3>
              {["Analysis", "Scale", "Integrations", "Security & Privacy", "Evidence"].map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>
        </section>

        <aside className="cortex-column cortex-column--utility">
          <MenuCard />
          <PricingCard />
        </aside>
      </div>
      <footer className="cortex-reference__footer">
        <span>© {new Date().getFullYear()} Cortex</span>
        <span>Operational intelligence for consequential work.</span>
      </footer>
    </main>
  );
}
