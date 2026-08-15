import { useEffect, useRef, useState, type PropsWithChildren, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUp, Brain, Check, ChevronRight, GitBranch, Mic, Paperclip, Plus, Radio, Search, UserRound } from "lucide-react";
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
      </Link>
    </header>
  );
}

const cortexCommands = [
  "Research the market,\nthen brief me before morning.",
  "Turn this brief into a launch plan with the right agents.",
  "Compare the options and recommend the move with evidence.",
] as const;

function CortexCommandRail() {
  const reducedMotion = useReducedMotion();
  const [commandIndex, setCommandIndex] = useState(0);
  const [displayedCommand, setDisplayedCommand] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (reducedMotion === null) return;

    const command = cortexCommands[commandIndex] ?? cortexCommands[0] ?? "";

    if (reducedMotion) {
      setDisplayedCommand(command);
      setIsDeleting(false);
      return;
    }

    if (!isDeleting && displayedCommand === command) {
      const holdTimer = window.setTimeout(() => setIsDeleting(true), 1650);
      return () => window.clearTimeout(holdTimer);
    }

    if (isDeleting && displayedCommand.length === 0) {
      const gapTimer = window.setTimeout(() => {
        setCommandIndex((current) => (current + 1) % cortexCommands.length);
        setIsDeleting(false);
      }, 320);
      return () => window.clearTimeout(gapTimer);
    }

    const typingTimer = window.setTimeout(() => {
      setDisplayedCommand((current) => {
        if (isDeleting) return Array.from(current).slice(0, -1).join("");
        return command.slice(0, Array.from(current).length + 1);
      });
    }, isDeleting ? 30 : 48);

    return () => window.clearTimeout(typingTimer);
  }, [commandIndex, displayedCommand, isDeleting, reducedMotion]);

  const hasMessage = displayedCommand.length > 0;

  return (
    <motion.div
      className="cortex-command-rail"
      aria-label="Example Cortex commands"
      initial={reducedMotion ? false : { opacity: 0, y: 112 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { delay: 0.18, duration: 1.2, ease: [0.16, 1, 0.3, 1] }
      }
    >
      <div className="cortex-command-rail__viewport" aria-hidden="true">
        <div className="cortex-command-rail__chat-space">
          <div className="cortex-command-rail__empty-state">
            <span className="cortex-command-rail__chat-mark"><CortexLogo aria-hidden="true" /></span>
          </div>
          <div className="cortex-command-rail__messages">
            <div className="cortex-command-rail__composer">
              <div className="cortex-command-rail__composer-copy">
                <span className="cortex-command-rail__phrases">
                  <span className="cortex-command-rail__phrase">
                    {displayedCommand}
                    <span className="cortex-command-rail__caret" />
                  </span>
                </span>
              </div>
              <div className="cortex-command-rail__composer-toolbar">
                <div className="cortex-command-rail__tools">
                  <span className="cortex-command-rail__tool"><Plus aria-hidden="true" /></span>
                  <span className="cortex-command-rail__tool"><Paperclip aria-hidden="true" /></span>
                </div>
                <div className="cortex-command-rail__actions">
                  <span className="cortex-command-rail__tool"><Mic aria-hidden="true" /></span>
                  <AnimatePresence initial={false}>
                    {hasMessage ? (
                      <motion.span
                        className="cortex-command-rail__sent-mark"
                        initial={{ opacity: 0, scale: 0.72, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.72, y: 4 }}
                        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <ArrowUp aria-hidden="true" />
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <span className="sr-only">Example commands: map the signal across the market; turn this brief into a launch plan; research the field and show what changed.</span>
    </motion.div>
  );
}

const aiProviders = [
  { id: "gpt", name: "GPT", fullName: "OpenAI", description: "General reasoning for open-ended missions.", Mark: OpenAiMark, tone: "cortex-ai-provider--openai" },
  { id: "claude", name: "Claude", fullName: "Anthropic", description: "Careful synthesis for nuanced work.", Mark: ClaudeMark, tone: "cortex-ai-provider--claude" },
  { id: "grok", name: "Grok", fullName: "xAI", description: "Fast context for live signals and research.", Mark: GrokMark, tone: "cortex-ai-provider--grok" },
  { id: "gemini", name: "Gemini", fullName: "Google", description: "Multimodal reasoning across broad context.", Mark: GeminiMark, tone: "cortex-ai-provider--gemini" },
  { id: "mistral", name: "Mistral", fullName: "Mistral", description: "Efficient execution for focused tasks.", Mark: MistralMark, tone: "cortex-ai-provider--mistral" },
  { id: "deepseek", name: "DeepSeek", fullName: "DeepSeek", description: "Deep technical reasoning when the run needs it.", Mark: DeepSeekMark, tone: "cortex-ai-provider--deepseek" },
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
  { id: "manager", label: "Manager", description: "Shapes the mission and keeps every role aligned.", Icon: Brain },
  { id: "runners", label: "Runners", description: "Carry out the concrete tasks inside the run.", Icon: GitBranch },
  { id: "research", label: "Research", description: "Finds, checks, and grounds the work in evidence.", Icon: Search },
  { id: "rtc", label: "RTC", description: "Keeps the active work synchronised as it moves.", Icon: Radio },
] as const;

type CortexSystemNodeProps = {
  className?: string;
  detail: string;
  mark: ReactNode;
  title: string;
};

function CortexSystemNode({ className, detail, mark, onSelect, selected, title }: CortexSystemNodeProps & { onSelect: () => void; selected: boolean }) {
  return (
    <motion.button
      layout
      type="button"
      className={`cortex-ai-system-node${className ? ` ${className}` : ""}${selected ? " is-selected" : ""}`}
      aria-expanded={selected}
      onClick={onSelect}
      transition={{ layout: { duration: 0.52, ease: [0.16, 1, 0.3, 1] } }}
    >
      <span className="cortex-ai-system-node__mark">{mark}</span>
      <span className="cortex-ai-system-node__copy">
        <strong>{title}</strong>
        <AnimatePresence initial={false} mode="wait">
          {selected ? (
            <motion.small
              key={detail}
              className="cortex-ai-system-node__detail"
              initial={{ opacity: 0, height: 0, y: -3 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -3 }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            >
              {detail}
            </motion.small>
          ) : null}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

type CortexSystemSelectionProps = {
  description: string;
  label: string;
};

function CortexSystemSelection({ description, label }: CortexSystemSelectionProps) {
  return (
    <motion.div
      className="cortex-ai-selection"
      initial={{ opacity: 0, height: 0, y: -4 }}
      animate={{ opacity: 1, height: "auto", y: 0 }}
      exit={{ opacity: 0, height: 0, y: -4 }}
      transition={{ duration: 0.46, ease: [0.16, 1, 0.3, 1] }}
    >
      <strong>{label}</strong>
      <p>{description}</p>
    </motion.div>
  );
}

type CortexSystemZoneProps = PropsWithChildren<{
  className: string;
  delay: number;
  index: number;
  revealedThrough: number;
}>;

function CortexSystemZone({ children, className, delay, index, revealedThrough }: CortexSystemZoneProps) {
  const reducedMotion = useReducedMotion();
  const isRevealed = revealedThrough >= index;

  return (
    <motion.section
      className={className}
      initial={reducedMotion ? false : { opacity: 0, x: 16, y: 12 }}
      animate={reducedMotion || isRevealed ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: 16, y: 12 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { delay, duration: 0.95, ease: [0.16, 1, 0.3, 1] }
      }
    >
      {children}
    </motion.section>
  );
}

function CortexSystemLink({ visible }: { visible: boolean }) {
  return (
    <motion.span
      className="cortex-ai-link"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="cortex-ai-link__port" />
    </motion.span>
  );
}

function AiAccessPanel() {
  const reducedMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelInView = useInView(panelRef, {
    once: true,
    amount: 0.12,
    margin: "-12% 0px -12% 0px",
  });
  const [revealedThrough, setRevealedThrough] = useState(-1);
  const [selectedSystemItem, setSelectedSystemItem] = useState<string | null>(null);

  useEffect(() => {
    if (reducedMotion === null || !panelInView) return;

    if (reducedMotion) {
      setRevealedThrough(4);
      return;
    }

    const timers = [0, 1, 2, 3, 4].map((index) =>
      window.setTimeout(() => {
        setRevealedThrough((current) => Math.max(current, index));
      }, index * 820),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [panelInView, reducedMotion]);

  return (
    <div ref={panelRef} className="cortex-ai-panel" aria-label="Cortex linked operating system">
      <div className="cortex-ai-system-map">
        <CortexSystemZone className="cortex-ai-zone cortex-ai-zone--input" delay={0.08} index={0} revealedThrough={revealedThrough}>
          <CortexSystemNode
            className="cortex-ai-system-node--human"
            detail="Defines the brief, objective, and boundary of the work."
            mark={<UserRound aria-hidden="true" />}
            onSelect={() => setSelectedSystemItem("human")}
            selected={selectedSystemItem === "human"}
            title="Human"
          />
        </CortexSystemZone>
        <CortexSystemLink visible={revealedThrough >= 0} />

        <CortexSystemZone className="cortex-ai-zone cortex-ai-zone--control" delay={0.16} index={1} revealedThrough={revealedThrough}>
          <CortexSystemNode
            className="cortex-ai-system-node--cortex"
            detail="Frames the mission and keeps the decision path coherent."
            mark={<CortexLogo aria-hidden="true" />}
            onSelect={() => setSelectedSystemItem("cortex")}
            selected={selectedSystemItem === "cortex"}
            title="Cortex"
          />
          <CortexSystemNode
            className="cortex-ai-system-node--hermes"
            detail="Routes the mission across models and agent roles."
            mark={<img src="/hermes-logo.jpeg" alt="" />}
            onSelect={() => setSelectedSystemItem("hermes")}
            selected={selectedSystemItem === "hermes"}
            title="Hermes"
          />
        </CortexSystemZone>
        <CortexSystemLink visible={revealedThrough >= 1} />

        <CortexSystemZone className="cortex-ai-zone cortex-ai-zone--orchestration" delay={0.24} index={2} revealedThrough={revealedThrough}>
          <div className="cortex-ai-branch-field">
            <div className="cortex-ai-branch cortex-ai-branch--models" aria-label="AI models">
              <div className="cortex-ai-panel__providers" aria-label="AI models available to Hermes">
                {aiProviders.map(({ id, name, fullName, Mark, tone }) => (
                  <button
                    type="button"
                    className={`cortex-ai-provider ${tone}${selectedSystemItem === id ? " is-selected" : ""}`}
                    key={id}
                    title={fullName}
                    aria-pressed={selectedSystemItem === id}
                    onClick={() => setSelectedSystemItem(id)}
                  >
                    <span className="cortex-ai-provider__mark"><Mark title={fullName} /></span>
                    <span className="cortex-ai-provider__name">{name}</span>
                  </button>
                ))}
              </div>
              <AnimatePresence initial={false} mode="wait">
                {selectedSystemItem && aiProviders.some(({ id }) => id === selectedSystemItem) ? (() => {
                  const provider = aiProviders.find(({ id }) => id === selectedSystemItem);
                  return provider ? <CortexSystemSelection key={provider.id} label={provider.name} description={provider.description} /> : null;
                })() : null}
              </AnimatePresence>
            </div>
            <div className="cortex-ai-branch cortex-ai-branch--agents" aria-label="Agent roles">
              <div className="cortex-ai-panel__roles" aria-label="Agent roles spawned by Hermes">
                {agentRoles.map(({ id, label, Icon }) => (
                  <button
                    type="button"
                    className={`cortex-ai-role${selectedSystemItem === id ? " is-selected" : ""}`}
                    key={id}
                    aria-pressed={selectedSystemItem === id}
                    onClick={() => setSelectedSystemItem(id)}
                  >
                    <Icon aria-hidden="true" />
                    <span className="cortex-ai-role__name">{label}</span>
                  </button>
                ))}
              </div>
              <AnimatePresence initial={false} mode="wait">
                {selectedSystemItem && agentRoles.some(({ id }) => id === selectedSystemItem) ? (() => {
                  const role = agentRoles.find(({ id }) => id === selectedSystemItem);
                  return role ? <CortexSystemSelection key={role.id} label={role.label} description={role.description} /> : null;
                })() : null}
              </AnimatePresence>
            </div>
          </div>
        </CortexSystemZone>
        <CortexSystemLink visible={revealedThrough >= 2} />

        <CortexSystemZone className="cortex-ai-zone cortex-ai-zone--synthesis" delay={0.32} index={3} revealedThrough={revealedThrough}>
          <CortexSystemNode
            className="cortex-ai-system-node--cortex-return"
            detail="Reviews the trace before the result is returned."
            mark={<CortexLogo aria-hidden="true" />}
            onSelect={() => setSelectedSystemItem("cortex-return")}
            selected={selectedSystemItem === "cortex-return"}
            title="Cortex"
          />
        </CortexSystemZone>
        <CortexSystemLink visible={revealedThrough >= 3} />

        <CortexSystemZone className="cortex-ai-zone cortex-ai-zone--output" delay={0.4} index={4} revealedThrough={revealedThrough}>
          <CortexSystemNode
            className="cortex-ai-system-node--result"
            detail="Research, build, review, or delivery returned to the human."
            mark={<Check aria-hidden="true" />}
            onSelect={() => setSelectedSystemItem("result")}
            selected={selectedSystemItem === "result"}
            title="Result"
          />
        </CortexSystemZone>
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
        <Link className="cortex-pill cortex-pill--dark" to="/hero-lab#access">Request private access</Link>
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
            <h1 id="cortex-page-title"><span className="cortex-intro__accent">Cortex</span> turns scattered intelligence into coordinated action</h1>
            <p>Coordinate your agents, direct complex work, and return each outcome with a reason you can trust.</p>
            <Link className="cortex-pill cortex-pill--dark cortex-intro__cta" to="/hero-lab#access">Request private access</Link>
            <CortexCommandRail />
          </div>
        </ReferenceColumn>

        <ReferenceColumn className="cortex-panel cortex-column cortex-column--metrics" delay={0.1}>
          <div className="cortex-column__body">
            <div className="cortex-system-lede">
              <h2>How a brief moves through Cortex.</h2>
              <p>The system below shows the handoff: human intent enters Cortex, Hermes routes the work through models and agents, and the result comes back ready to use.</p>
            </div>
            <div className="cortex-media cortex-media--sessions">
              <motion.div
                className="cortex-system-module"
                initial={{ opacity: 0, x: 28, y: 18, scale: 0.97, rotate: 0.2 }}
                whileInView={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
                viewport={{ once: true, amount: 0.18 }}
                transition={{ delay: 0.12, duration: 1.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <AiAccessPanel />
              </motion.div>
            </div>
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
