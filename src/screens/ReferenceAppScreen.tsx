import { useState, type PropsWithChildren, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Brain, Check, ChevronRight, GitBranch, Menu, Radio, Search, UserRound } from "lucide-react";
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
  { name: "Grok", fullName: "xAI", Mark: GrokMark, tone: "cortex-ai-provider--grok" },
  { name: "Gemini", fullName: "Google", Mark: GeminiMark, tone: "cortex-ai-provider--gemini" },
  { name: "Mistral", fullName: "Mistral", Mark: MistralMark, tone: "cortex-ai-provider--mistral" },
  { name: "DeepSeek", fullName: "DeepSeek", Mark: DeepSeekMark, tone: "cortex-ai-provider--deepseek" },
] as const;

function GrokMark({ title }: { title?: string }) {
  return (
    <span
      className="cortex-grok-mark"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      𝕏
    </span>
  );
}

const agentRoles = [
  { label: "Manager", detail: "directs", Icon: Brain },
  { label: "Runners", detail: "executes", Icon: GitBranch },
  { label: "Research", detail: "grounds", Icon: Search },
  { label: "RTC", detail: "syncs", Icon: Radio },
] as const;

type CortexSystemNodeProps = {
  className?: string;
  context?: string;
  detail: string;
  mark: ReactNode;
  title: string;
};

function CortexSystemZoneHeader({ detail, index, label }: { detail: string; index: string; label: string }) {
  return (
    <div className="cortex-ai-zone__header">
      <span><em>{index}</em>{label}</span>
      <small>{detail}</small>
    </div>
  );
}

function CortexSystemNode({ className, context, detail, mark, title }: CortexSystemNodeProps) {
  return (
    <div className={`cortex-ai-system-node${className ? ` ${className}` : ""}`}>
      <span className="cortex-ai-system-node__mark">{mark}</span>
      <div>
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
      {context ? <span className="cortex-ai-system-node__context">{context}</span> : null}
    </div>
  );
}

function AiAccessPanel() {
  return (
    <div className="cortex-ai-panel" aria-label="Cortex linked operating system">
      <div className="cortex-ai-panel__header">
        <div>
          <small>Cortex operating system</small>
          <strong>Linked system</strong>
        </div>
        <span className="cortex-ai-panel__status">brief in · result out</span>
      </div>
      <div className="cortex-ai-system-map">
        <span className="cortex-ai-system-map__thread" aria-hidden="true" />
        <section className="cortex-ai-zone cortex-ai-zone--input">
          <CortexSystemZoneHeader index="01" label="Input state" detail="human intent" />
          <CortexSystemNode
            className="cortex-ai-system-node--human"
            detail="brief / objective"
            mark={<UserRound aria-hidden="true" />}
            title="Human"
          />
        </section>

        <section className="cortex-ai-zone cortex-ai-zone--control">
          <CortexSystemZoneHeader index="02" label="Control plane" detail="Cortex owns the mission" />
          <CortexSystemNode
            className="cortex-ai-system-node--cortex"
            context="frames the work"
            detail="mission layer"
            mark={<CortexLogo aria-hidden="true" />}
            title="Cortex"
          />
          <CortexSystemNode
            className="cortex-ai-system-node--hermes"
            context="routes the mission"
            detail="operator / orchestrator"
            mark={<img src="/hermes-logo.jpeg" alt="" />}
            title="Hermes"
          />
        </section>

        <section className="cortex-ai-zone cortex-ai-zone--orchestration">
          <CortexSystemZoneHeader index="03" label="Orchestration" detail="Hermes composes the run" />
          <div className="cortex-ai-branch-field">
            <div className="cortex-ai-branch cortex-ai-branch--models">
              <div className="cortex-ai-branch__header">
                <span className="cortex-ai-branch__signal" aria-hidden="true" />
                <div>
                  <span>Model fabric</span>
                  <small>selected per task</small>
                </div>
              </div>
              <div className="cortex-ai-panel__providers" aria-label="AI models available to Hermes">
                {aiProviders.map(({ name, fullName, Mark, tone }) => (
                  <div className={`cortex-ai-provider ${tone}`} key={name} title={fullName}>
                    <span className="cortex-ai-provider__mark"><Mark title={fullName} /></span>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="cortex-ai-branch cortex-ai-branch--agents">
              <div className="cortex-ai-branch__header">
                <span className="cortex-ai-branch__signal" aria-hidden="true" />
                <div>
                  <span>Agent runtime</span>
                  <small>roles spawned for the run</small>
                </div>
              </div>
              <div className="cortex-ai-panel__roles" aria-label="Agent roles spawned by Hermes">
                {agentRoles.map(({ label, detail, Icon }) => (
                  <div className="cortex-ai-role" key={label}>
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                    <small>{detail}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="cortex-ai-zone cortex-ai-zone--synthesis">
          <CortexSystemZoneHeader index="04" label="Synthesis state" detail="Cortex closes the loop" />
          <CortexSystemNode
            className="cortex-ai-system-node--cortex-return"
            context="keeps the trace"
            detail="reviews / assembles"
            mark={<CortexLogo aria-hidden="true" />}
            title="Cortex"
          />
        </section>

        <section className="cortex-ai-zone cortex-ai-zone--output">
          <CortexSystemZoneHeader index="05" label="Output state" detail="ready for the human" />
          <CortexSystemNode
            className="cortex-ai-system-node--result"
            detail="research · build · review · delivery"
            mark={<Check aria-hidden="true" />}
            title="Result"
          />
        </section>
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
        <Link className="cortex-pill cortex-pill--dark" to="/hero-lab#access">Join the waitlist</Link>
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
            <Link className="cortex-pill cortex-pill--dark cortex-intro__cta" to="/hero-lab#access">Join the waitlist</Link>
          </div>
        </ReferenceColumn>

        <ReferenceColumn className="cortex-panel cortex-column cortex-column--metrics" delay={0.1}>
          <div className="cortex-column__body">
            <div className="cortex-media cortex-media--sessions"><AiAccessPanel /></div>
            <h2>A brief becomes a finished outcome.</h2>
            <p>Cortex frames the mission, Hermes coordinates the models and agents, then brings the work back for review and delivery.</p>
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
