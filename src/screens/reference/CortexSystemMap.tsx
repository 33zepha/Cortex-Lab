import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Brain, Check, GitBranch, Radio, Search, UserRound } from "lucide-react";
import { ClaudeMark } from "@/components/brand/ClaudeMark";
import { CortexLogo } from "@/components/brand/CortexLogo";
import { DeepSeekMark, GeminiMark, MistralMark } from "@/components/brand/ProviderMarks";
import { OpenAiMark } from "@/components/brand/OpenAiMark";
import "./CortexSystemMap.css";

type SystemItem = {
  id: string;
  title: string;
  detail: string;
  mark: ReactNode;
};

type CoreSize = "human" | "cortex" | "hermes" | "return" | "result";

type MeasuredBox = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
};

type ConnectorPath = {
  id: string;
  d: string;
  stage: number;
};

const coreItems: Record<CoreSize, SystemItem> = {
  human: {
    id: "human",
    title: "Human",
    detail: "Defines the objective and the boundary of the work.",
    mark: <UserRound aria-hidden="true" />,
  },
  cortex: {
    id: "cortex",
    title: "Cortex",
    detail: "Frames the mission and keeps the decision path coherent.",
    mark: <CortexLogo aria-hidden="true" />,
  },
  hermes: {
    id: "hermes",
    title: "Hermes",
    detail: "Routes the mission through the right models and roles.",
    mark: <img src="/hermes-logo.jpeg" alt="" />,
  },
  return: {
    id: "cortex-return",
    title: "Cortex",
    detail: "Reviews the trace and assembles a usable outcome.",
    mark: <CortexLogo aria-hidden="true" />,
  },
  result: {
    id: "result",
    title: "Result",
    detail: "The researched, built, reviewed, or delivered outcome.",
    mark: <Check aria-hidden="true" />,
  },
};

const modelItems: SystemItem[] = [
  {
    id: "gpt",
    title: "GPT",
    detail: "Open-ended reasoning for broad missions and synthesis.",
    mark: <OpenAiMark title="OpenAI" />,
  },
  {
    id: "claude",
    title: "Claude",
    detail: "Careful reading and nuanced synthesis when context matters.",
    mark: <ClaudeMark title="Anthropic" />,
  },
  {
    id: "grok",
    title: "Grok",
    detail: "Fast access to live signals and exploratory research.",
    mark: <span className="cortex-system-map__grok-mark" aria-hidden="true">𝕏</span>,
  },
  {
    id: "gemini",
    title: "Gemini",
    detail: "Multimodal reasoning across long and varied context.",
    mark: <GeminiMark title="Google" />,
  },
  {
    id: "mistral",
    title: "Mistral",
    detail: "Efficient execution for focused, controllable tasks.",
    mark: <MistralMark title="Mistral" />,
  },
  {
    id: "deepseek",
    title: "DeepSeek",
    detail: "Technical depth for demanding reasoning and code work.",
    mark: <DeepSeekMark title="DeepSeek" />,
  },
];

const roleItems: SystemItem[] = [
  {
    id: "manager",
    title: "Manager",
    detail: "Shapes the mission and keeps every role aligned.",
    mark: <Brain aria-hidden="true" />,
  },
  {
    id: "runners",
    title: "Runners",
    detail: "Carry out the concrete tasks inside the run.",
    mark: <GitBranch aria-hidden="true" />,
  },
  {
    id: "research",
    title: "Research",
    detail: "Finds, checks, and grounds the work in evidence.",
    mark: <Search aria-hidden="true" />,
  },
  {
    id: "rtc",
    title: "RTC",
    detail: "Keeps active work synchronised as it moves.",
    mark: <Radio aria-hidden="true" />,
  },
];

const connectorDefinitions = [
  { id: "human-cortex", from: "human", to: "cortex", stage: 0 },
  { id: "cortex-hermes", from: "cortex", to: "hermes", stage: 0 },
  { id: "hermes-models", from: "hermes", to: "models", stage: 1 },
  { id: "hermes-agents", from: "hermes", to: "agents", stage: 2 },
  { id: "models-return", from: "models", to: "cortex-return", stage: 3 },
  { id: "agents-return", from: "agents", to: "cortex-return", stage: 3 },
  { id: "return-result", from: "cortex-return", to: "result", stage: 3 },
] as const;

function getMeasuredBox(element: HTMLElement, canvas: DOMRect): MeasuredBox {
  const rect = element.getBoundingClientRect();
  const left = rect.left - canvas.left;
  const top = rect.top - canvas.top;

  return {
    left,
    right: left + rect.width,
    top,
    bottom: top + rect.height,
    centerX: left + rect.width / 2,
    centerY: top + rect.height / 2,
  };
}

function connectBoxes(source: MeasuredBox, target: MeasuredBox): string {
  const deltaX = target.centerX - source.centerX;
  const deltaY = target.centerY - source.centerY;
  const isMostlyVertical = Math.abs(deltaX) < 48;

  if (isMostlyVertical) {
    const sourceY = deltaY >= 0 ? source.bottom : source.top;
    const targetY = deltaY >= 0 ? target.top : target.bottom;
    const curve = Math.max(30, Math.min(110, Math.abs(targetY - sourceY) * 0.42));

    return `M ${source.centerX} ${sourceY} C ${source.centerX} ${sourceY + Math.sign(deltaY) * curve}, ${target.centerX} ${targetY - Math.sign(deltaY) * curve}, ${target.centerX} ${targetY}`;
  }

  const toRight = deltaX > 0;
  const sourceX = toRight ? source.right : source.left;
  const targetX = toRight ? target.left : target.right;
  const curve = Math.max(34, Math.min(150, Math.abs(targetX - sourceX) * 0.48));

  return `M ${sourceX} ${source.centerY} C ${sourceX + (toRight ? curve : -curve)} ${source.centerY}, ${targetX - (toRight ? curve : -curve)} ${target.centerY}, ${targetX} ${target.centerY}`;
}

function SelectableNode({
  item,
  nodeRef,
  onSelect,
  selected,
  size,
}: {
  item: SystemItem;
  nodeRef?: (element: HTMLButtonElement | null) => void;
  onSelect: (id: string) => void;
  selected: boolean;
  size: CoreSize;
}) {
  return (
    <motion.button
      ref={nodeRef}
      layout
      type="button"
      className={`cortex-system-map__node cortex-system-map__node--${size}${selected ? " is-selected" : ""}`}
      aria-expanded={selected}
      onClick={() => onSelect(item.id)}
      transition={{ layout: { duration: 0.72, ease: [0.16, 1, 0.3, 1] } }}
    >
      <span className="cortex-system-map__node-mark" aria-hidden="true">
        {item.mark}
      </span>
      <span className="cortex-system-map__node-copy">
        <strong>{item.title}</strong>
        <AnimatePresence initial={false} mode="wait">
          {selected ? (
            <motion.span
              key={item.detail}
              className="cortex-system-map__node-detail"
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -4 }}
              transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
            >
              {item.detail}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

function RevealedStage({
  children,
  className = "",
  index,
  reducedMotion,
  revealedThrough,
}: {
  children: ReactNode;
  className?: string;
  index: number;
  reducedMotion: boolean;
  revealedThrough: number;
}) {
  const visible = reducedMotion || revealedThrough >= index;

  return (
    <motion.div
      className={`cortex-system-map__stage ${className}`}
      initial={false}
      animate={visible ? { opacity: 1, clipPath: "inset(0% 0% 0% 0%)" } : { opacity: 0, clipPath: "inset(0% 0% 12% 0%)" }}
      transition={{ duration: reducedMotion ? 0 : 0.82, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function FieldDetail({ item }: { item: SystemItem | undefined }) {
  return (
    <AnimatePresence initial={false} mode="wait">
      {item ? (
        <motion.div
          key={item.id}
          className="cortex-system-map__field-detail"
          initial={{ opacity: 0, height: 0, y: -5 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -5 }}
          transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
        >
          <strong>{item.title}</strong>
          <span>{item.detail}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ConnectorLayer({
  paths,
  reducedMotion,
  revealedThrough,
}: {
  paths: ConnectorPath[];
  reducedMotion: boolean;
  revealedThrough: number;
}) {
  return (
    <svg className="cortex-system-map__connector-layer" aria-hidden="true" focusable="false">
      {paths.map((path) => (
        <motion.path
          key={path.id}
          d={path.d}
          className={`cortex-system-map__connector cortex-system-map__connector--${path.id}`}
          initial={{ opacity: 0, pathLength: 0 }}
          animate={revealedThrough >= path.stage ? { opacity: 1, pathLength: 1 } : { opacity: 0, pathLength: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.82, ease: [0.16, 1, 0.3, 1] }}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

export function CortexSystemMap() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const measuredRefs = useRef<Record<string, HTMLElement | null>>({});
  const isInView = useInView(canvasRef, {
    amount: 0.2,
    margin: "-10% 0px -10% 0px",
    once: false,
  });
  const reducedMotionPreference = useReducedMotion();
  const reducedMotion = reducedMotionPreference === true;
  const revealRun = useRef(0);
  const [revealedThrough, setRevealedThrough] = useState(-1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paths, setPaths] = useState<ConnectorPath[]>([]);

  const registerRef = (id: string) => (element: HTMLElement | null) => {
    measuredRefs.current[id] = element;
  };

  useEffect(() => {
    if (reducedMotionPreference === null) return;

    revealRun.current += 1;
    const currentRun = revealRun.current;

    if (!isInView) {
      setRevealedThrough(-1);
      setSelectedId(null);
      return;
    }

    if (reducedMotion) {
      setRevealedThrough(3);
      return;
    }

    setRevealedThrough(-1);
    const timers = [0, 1, 2, 3].map((stage) =>
      window.setTimeout(() => {
        if (revealRun.current === currentRun) setRevealedThrough(stage);
      }, 160 + stage * 760),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [isInView, reducedMotion, reducedMotionPreference]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frame = 0;

    const measure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const canvasRect = canvas.getBoundingClientRect();
        const boxes = Object.entries(measuredRefs.current).reduce<Record<string, MeasuredBox>>((result, [id, element]) => {
          if (element) result[id] = getMeasuredBox(element, canvasRect);
          return result;
        }, {});

        const nextPaths = connectorDefinitions.flatMap(({ from, id, stage, to }) => {
          const source = boxes[from];
          const target = boxes[to];
          if (!source || !target) return [];
          return [{ id, d: connectBoxes(source, target), stage }];
        });

        setPaths(nextPaths);
      });
    };

    measure();
    window.addEventListener("resize", measure);

    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(canvas);
    Object.values(measuredRefs.current).forEach((element) => {
      if (element) observer?.observe(element);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [isInView, revealedThrough, selectedId]);

  const selectItem = (id: string) => {
    setSelectedId((current) => (current === id ? null : id));
  };

  const selectedModel = modelItems.find((item) => item.id === selectedId);
  const selectedRole = roleItems.find((item) => item.id === selectedId);

  return (
    <section ref={canvasRef} className="cortex-system-map" aria-label="Cortex system map">
      <ConnectorLayer paths={paths} reducedMotion={reducedMotion} revealedThrough={revealedThrough} />

      <div className="cortex-system-map__layout">
        <RevealedStage index={0} reducedMotion={reducedMotion} revealedThrough={revealedThrough} className="cortex-system-map__stage--human">
          <SelectableNode
            item={coreItems.human}
            nodeRef={registerRef("human")}
            onSelect={selectItem}
            selected={selectedId === coreItems.human.id}
            size="human"
          />
        </RevealedStage>

        <RevealedStage index={0} reducedMotion={reducedMotion} revealedThrough={revealedThrough} className="cortex-system-map__stage--cortex">
          <SelectableNode
            item={coreItems.cortex}
            nodeRef={registerRef("cortex")}
            onSelect={selectItem}
            selected={selectedId === coreItems.cortex.id}
            size="cortex"
          />
        </RevealedStage>

        <RevealedStage index={0} reducedMotion={reducedMotion} revealedThrough={revealedThrough} className="cortex-system-map__stage--hermes">
          <SelectableNode
            item={coreItems.hermes}
            nodeRef={registerRef("hermes")}
            onSelect={selectItem}
            selected={selectedId === coreItems.hermes.id}
            size="hermes"
          />
        </RevealedStage>

        <RevealedStage index={1} reducedMotion={reducedMotion} revealedThrough={revealedThrough} className="cortex-system-map__stage--models">
          <div ref={registerRef("models")} className="cortex-system-map__field cortex-system-map__field--models" aria-label="AI models">
            <div className="cortex-system-map__model-list">
              {modelItems.map((item) => (
                <motion.button
                  layout
                  type="button"
                  key={item.id}
                  className={`cortex-system-map__model${selectedId === item.id ? " is-selected" : ""}`}
                  aria-expanded={selectedId === item.id}
                  onClick={() => selectItem(item.id)}
                  transition={{ layout: { duration: 0.72, ease: [0.16, 1, 0.3, 1] } }}
                >
                  <span className="cortex-system-map__model-mark" aria-hidden="true">{item.mark}</span>
                  <span className="cortex-system-map__model-name">{item.title}</span>
                </motion.button>
              ))}
            </div>
            <FieldDetail item={selectedModel} />
          </div>
        </RevealedStage>

        <RevealedStage index={2} reducedMotion={reducedMotion} revealedThrough={revealedThrough} className="cortex-system-map__stage--agents">
          <div ref={registerRef("agents")} className="cortex-system-map__field cortex-system-map__field--agents" aria-label="Agent roles">
            <div className="cortex-system-map__role-list">
              {roleItems.map((item) => (
                <motion.button
                  layout
                  type="button"
                  key={item.id}
                  className={`cortex-system-map__role${selectedId === item.id ? " is-selected" : ""}`}
                  aria-expanded={selectedId === item.id}
                  onClick={() => selectItem(item.id)}
                  transition={{ layout: { duration: 0.72, ease: [0.16, 1, 0.3, 1] } }}
                >
                  <span className="cortex-system-map__role-mark" aria-hidden="true">{item.mark}</span>
                  <span className="cortex-system-map__role-name">{item.title}</span>
                </motion.button>
              ))}
            </div>
            <FieldDetail item={selectedRole} />
          </div>
        </RevealedStage>

        <RevealedStage index={3} reducedMotion={reducedMotion} revealedThrough={revealedThrough} className="cortex-system-map__stage--return">
          <SelectableNode
            item={coreItems.return}
            nodeRef={registerRef("cortex-return")}
            onSelect={selectItem}
            selected={selectedId === coreItems.return.id}
            size="return"
          />
        </RevealedStage>

        <RevealedStage index={3} reducedMotion={reducedMotion} revealedThrough={revealedThrough} className="cortex-system-map__stage--result">
          <SelectableNode
            item={coreItems.result}
            nodeRef={registerRef("result")}
            onSelect={selectItem}
            selected={selectedId === coreItems.result.id}
            size="result"
          />
        </RevealedStage>
      </div>
    </section>
  );
}

export default CortexSystemMap;
