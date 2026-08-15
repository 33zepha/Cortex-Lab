import { useState, type PropsWithChildren } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Brain, Check, ChevronRight, GitBranch, Menu, Radio, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { ClaudeMark } from "@/components/brand/ClaudeMark";
import { CortexLogo } from "@/components/brand/CortexLogo";
import { DeepSeekMark, GeminiMark, MistralMark } from "@/components/brand/ProviderMarks";
import { OpenAiMark } from "@/components/brand/OpenAiMark";
import "./ReferenceAppScreen.css";

type ReferenceColumnProps = PropsWithChildren<{
  className: string;
  delay: number;
  element?: "section" | "aside";
}>;

function ReferenceColumn({ children, className, delay, element = "section" }: ReferenceColumnProps) {
  const reducedMotion = useReducedMotion();
  const Surface = element === "aside" ? motion.aside : motion.section;

  return (
    <Surface
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { delay, duration: 0.62, ease: [0.22, 1, 0.36, 1] }
      }
    >
      {children}
    </Surface>
  );
}

function PanelHeader() {
  return (
    <header className="cortex-panel-header">
      <Link className="cortex-panel-header__brand" to="/" aria-label="Cortex home">
        <CortexLogo aria-hidden="true" />
        <span>Cortex</span>
      </Link>
      <div className="cortex-panel-header__actions">
        <Link className="cortex-pill cortex-pill--dark cortex-panel-header__cta" to="/signup">
          Get started
        </Link>
        <motion.button className="cortex-menu-button" type="button" aria-label="Open menu" whileTap={{ scale: 0.92 }}>
          <Menu aria-hidden="true" />
        </motion.button>
      </div>
    </header>
  );
}

const aiProviders = [
  { name: "GPT", fullName: "OpenAI", Mark: OpenAiMark, tone: "cortex-ai-provider--openai" },
  { name: "Claude", fullName: "Anthropic", Mark: ClaudeMark, tone: "cortex-ai-provider--claude" },
  { name: "Gemini", fullName: "Google", Mark: GeminiMark, tone: "cortex-ai-provider--gemini" },
  { name: "Mistral", fullName: "Mistral", Mark: MistralMark, tone: "cortex-ai-provider--mistral" },
  { name: "DeepSeek", fullName: "DeepSeek", Mark: DeepSeekMark, tone: "cortex-ai-provider--deepseek" },
] as const;

const agentRoles = [
  { label: "Manager", detail: "directs", Icon: Brain },
  { label: "Runners", detail: "executes", Icon: GitBranch },
  { label: "Research", detail: "grounds", Icon: Search },
  { label: "RTC", detail: "syncs", Icon: Radio },
] as const;

function AiAccessPanel() {
  return (
    <div className="cortex-ai-panel">
      <div className="cortex-ai-panel__header">
        <div>
          <small>Available intelligence</small>
          <strong>Model layer</strong>
        </div>
        <span className="cortex-ai-panel__status"><i /> live</span>
      </div>
      <div className="cortex-ai-panel__providers" aria-label="Available AI providers">
        {aiProviders.map(({ name, fullName, Mark, tone }) => (
          <div className={`cortex-ai-provider ${tone}`} key={name} title={fullName}>
            <span className="cortex-ai-provider__mark"><Mark title={fullName} /></span>
            <span>{name}</span>
          </div>
        ))}
      </div>
      <div className="cortex-ai-panel__route">
        <span>Hermes agent</span>
        <i aria-hidden="true" />
        <strong>orchestrates</strong>
        <i aria-hidden="true" />
        <span>Cortex system</span>
      </div>
      <div className="cortex-ai-panel__roles" aria-label="Agent roles Cortex can spawn">
        {agentRoles.map(({ label, detail, Icon }) => (
          <div className="cortex-ai-role" key={label}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
            <small>{detail}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function RevenueChart() {
  return (
    <div className="cortex-chart cortex-chart--revenue">
      <div className="cortex-chart__topline">
        <div>
          <small>Throughput</small>
          <strong>42 runs</strong>
        </div>
        <span className="cortex-growth">↑ 11% vs last cycle</span>
      </div>
      <svg viewBox="0 0 300 135" role="img" aria-label="Throughput trend chart">
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
        <div className="cortex-dashboard-preview__mini-brand"><CortexLogo /> <span>Cortex</span></div>
        <span className="cortex-dashboard-preview__nav cortex-dashboard-preview__nav--active">Mission overview</span>
        <span className="cortex-dashboard-preview__nav">Signals</span>
        <span className="cortex-dashboard-preview__nav">Evidence</span>
        <span className="cortex-dashboard-preview__nav">Collaborators</span>
        <span className="cortex-dashboard-preview__nav">History</span>
      </aside>
      <div className="cortex-dashboard-preview__main">
        <div className="cortex-dashboard-preview__toolbar"><span>Mission overview</span><span>Objective / Launch briefing</span></div>
        <div className="cortex-dashboard-preview__stats">
          <div><small>Agents</small><strong>06</strong></div>
          <div><small>Elapsed</small><strong>00:13:52</strong></div>
          <div><small>Runs</small><strong>17</strong></div>
          <div><small>Proofs</small><strong>04</strong></div>
        </div>
        <div className="cortex-dashboard-preview__graph">
          <div className="cortex-dashboard-preview__graph-head"><span>Mission activity</span><i /><i /></div>
          <svg viewBox="0 0 240 90"><path d="M3 58c18-30 28-28 45-2s26 15 40-1 24-22 37-7 20 24 34 7 23-36 39-18 21 26 39 17" /><path d="M3 39c15 17 25 24 41 19s25-34 39-18 25 30 38 13 21-24 36-14 22 23 37 5 25-19 43 11" /></svg>
        </div>
      </div>
    </div>
  );
}

function AdsPreview() {
  return (
    <div className="cortex-ads-preview" aria-hidden="true">
      <div className="cortex-ads-preview__title"><span className="cortex-meta-icon">◉</span><strong>Mission signals</strong></div>
      <div className="cortex-ads-preview__metrics">
        <div><small>Active runs</small><strong>06</strong><span className="cortex-metric-chip cortex-metric-chip--green">↗ 14% vs last cycle</span></div>
        <div><small>Proofs returned</small><strong>18</strong><span className="cortex-metric-chip cortex-metric-chip--red">↘ 8% vs last cycle</span></div>
      </div>
    </div>
  );
}

function Testimonial() {
  return (
    <figure className="cortex-testimonial">
      <blockquote>“Cortex has transformed the way we direct complex work. Its clear operating model, coordinated agents, and traceable execution give our team a system we trust when decisions need to move.”</blockquote>
      <div className="cortex-testimonial__person">
        <div className="cortex-avatar" aria-hidden="true">M</div>
        <strong>Early design partner</strong>
        <span>Operations team</span>
      </div>
      <div className="cortex-testimonial__controls" aria-hidden="true">
        <span><ArrowLeft /></span>
        <span><ArrowRight /></span>
      </div>
    </figure>
  );
}

function MenuCard() {
  const items = ["Platform", "Agent layer", "Workflows", "About Cortex", "Access"];
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

const pricingModes = {
  monthly: {
    label: "Monthly",
    title: "Private beta",
    access: "Early access",
    description: "Bring one focused workflow into Cortex and see what coordinated intelligence can return.",
    features: ["1 workspace.", "One active mission.", "Core agent coordination.", "Traceable outcomes."],
  },
  yearly: {
    label: "Yearly",
    title: "Design partner",
    access: "Priority access",
    description: "Bring a larger operating problem into Cortex and shape the system around the work that matters.",
    features: ["1 workspace.", "Priority onboarding.", "Core agent coordination.", "Shared review sessions."],
  },
} as const;

function PricingCard() {
  const [mode, setMode] = useState<keyof typeof pricingModes>("monthly");
  const details = pricingModes[mode];

  return (
    <section className="cortex-panel cortex-pricing-card" aria-labelledby="cortex-plan-title">
      <div className="cortex-pricing-card__body">
        <h2 id="cortex-plan-title">Choose the right way to start.</h2>
        <p>Choose the access path that fits your work and gives every mission room to grow.</p>
        <div className="cortex-segmented" role="tablist" aria-label="Access path">
          {(Object.keys(pricingModes) as Array<keyof typeof pricingModes>).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              className={mode === key ? "cortex-segmented__active" : undefined}
              onClick={() => setMode(key)}
            >
              {pricingModes[key].label}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            className="cortex-plan"
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3>{details.title}</h3>
            <p>{details.description}</p>
            <hr />
            <h4>{details.access}</h4>
            <ul>
              {details.features.map((item) => (
                <li key={item}><Check aria-hidden="true" />{item}</li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

export function ReferenceAppScreen() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="cortex-reference" aria-labelledby="cortex-page-title">
      <div className="cortex-reference__stage">
        <ReferenceColumn className="cortex-panel cortex-column cortex-column--intro" delay={0.04}>
          <PanelHeader />
          <div className="cortex-column__body cortex-intro">
            <h1 id="cortex-page-title">Turn scattered intelligence into coordinated action</h1>
            <p>Coordinate your agents, direct complex work, and return each outcome with a reason you can trust.</p>
            <Link className="cortex-pill cortex-pill--dark cortex-intro__cta" to="/signup">Start a mission</Link>
            <div className="cortex-media cortex-media--dashboard"><DashboardPreview /></div>
          </div>
        </ReferenceColumn>

        <ReferenceColumn className="cortex-panel cortex-column cortex-column--metrics" delay={0.1}>
          <div className="cortex-column__body">
            <div className="cortex-media cortex-media--sessions"><AiAccessPanel /></div>
            <h2>One model layer. Many specialized agents.</h2>
            <p>Cortex gives Hermes access to a living pool of model families, then turns each one into the right specialist for the mission.</p>
            <div className="cortex-media cortex-media--revenue"><RevenueChart /></div>
            <h2>Increase output through orchestration</h2>
            <p>Give every agent a role, keep complex work moving, and return with a clear record of what was done.</p>
            <div className="cortex-media cortex-media--ads"><AdsPreview /></div>
          </div>
        </ReferenceColumn>

        <ReferenceColumn className="cortex-column cortex-column--showcase" delay={0.16}>
          <Testimonial />
          <div className="cortex-showcase__body">
            <h2>Direct Your Agents. Transform Your Work.</h2>
            <p>Experience the power of Cortex and rethink how complex work is planned, executed, and reviewed. Unlock the potential of coordinated intelligence. Begin today and turn scattered effort into reliable outcomes.</p>
            <Link className="cortex-pill cortex-pill--dark cortex-showcase__cta" to="/signup">Explore the system</Link>
            <div className="cortex-product-menu">
              <h3>Cortex</h3>
              {["Missions", "Agents", "Integrations", "Security & privacy", "Documentation"].map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>
        </ReferenceColumn>

        <ReferenceColumn className="cortex-column cortex-column--utility" delay={0.22} element="aside">
          <MenuCard />
          <PricingCard />
        </ReferenceColumn>
      </div>
      <footer className="cortex-reference__footer">
        <span>© {new Date().getFullYear()} Cortex</span>
        <span>Operational intelligence for consequential work.</span>
      </footer>
      </main>
    </MotionConfig>
  );
}
