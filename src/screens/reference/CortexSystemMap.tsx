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
type MeasureKey = "human" | "cortex" | "hermes" | "models" | "agents" | "cortex-return" | "result";

type MeasuredBox = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
};

type Point = {
  x: number;
  y: number;
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

function edgePoint(box: MeasuredBox, toward: Point): Point {
  const horizontalDistance = Math.abs(toward.x - box.centerX);
  const verticalDistance = Math.abs(toward.y - box.centerY);

  if (verticalDistance > horizontalDistance) {
    return toward.y >= box.centerY ? { x: box.centerX, y: box.bottom } : { x: box.centerX, y: box.top };
  }

  return toward.x >= box.centerX ? { x: box.right, y: box.centerY } : { x: box.left, y: box.centerY };
}

function curveBetween(from: Point, to: Point): string {
  return `M ${from.x} ${from.y} ${curveSegment(from, to)}`;
}

function curveSegment(from: Point, to: Point): string {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const horizontal = Math.abs(deltaX) >= Math.abs(deltaY);

  if (horizontal) {
    const curve = Math.max(28, Math.min(130, Math.abs(deltaX) * 0.46));
    const direction = Math.sign(deltaX) || 1;
    return `C ${from.x + direction * curve} ${from.y}, ${to.x - direction * curve} ${to.y}, ${to.x} ${to.y}`;
  }

  const curve = Math.max(30, Math.min(110, Math.abs(deltaY) * 0.42));
  const direction = Math.sign(deltaY) || 1;
  return `C ${from.x} ${from.y + direction * curve}, ${to.x} ${to.y - direction * curve}, ${to.x} ${to.y}`;
}

function routeThrough(source: Point, waypoints: Point[], target: Point): string {
  let path = `M ${source.x} ${source.y}`;
  let previous = source;

  for (const point of [...waypoints, target]) {
    path += ` ${curveSegment(previous, point)}`;
    previous = point;
  }

  return path;
}

function connectBoxes(source: MeasuredBox, target: MeasuredBox): string {
  const sourcePoint = edgePoint(source, { x: target.centerX, y: target.centerY });
  const targetPoint = edgePoint(target, { x: source.centerX, y: source.centerY });
  return curveBetween(sourcePoint, targetPoint);
}

function connectFromPoint(source: Point, target: MeasuredBox): string {
  return curveBetween(source, edgePoint(target, source));
}

function makeWidePaths(boxes: Partial<Record<MeasureKey, MeasuredBox>>): ConnectorPath[] {
  const human = boxes.human;
  const cortex = boxes.cortex;
  const hermes = boxes.hermes;
  const models = boxes.models;
  const agents = boxes.agents;
  const returnNode = boxes["cortex-return"];
  const result = boxes.result;

  if (!human || !cortex || !hermes || !models || !agents || !returnNode || !result) return [];

  const paths: ConnectorPath[] = [
    { id: "human-cortex", d: connectBoxes(human, cortex), stage: 0 },
    { id: "cortex-hermes", d: connectBoxes(cortex, hermes), stage: 0 },
  ];

  const fork = {
    x: (models.right + agents.left) / 2,
    y: Math.min(models.top, agents.top) - 18,
  };
  const hermesExit = { x: hermes.centerX, y: hermes.bottom };
  const modelsEntry = { x: models.right, y: models.centerY };
  const agentsEntry = { x: agents.centerX, y: agents.top };
  paths.push(
    { id: "hermes-fork", d: curveBetween(hermesExit, fork), stage: 1 },
    {
      id: "fork-models",
      d: curveBetween(fork, modelsEntry),
      stage: 1,
    },
    {
      id: "fork-agents",
      d: curveBetween(fork, agentsEntry),
      stage: 2,
    },
  );

  const recombine = {
    x: returnNode.left - 20,
    y: returnNode.centerY,
  };
  paths.push(
    {
      id: "models-recombine",
      d: curveBetween(edgePoint(models, recombine), recombine),
      stage: 3,
    },
    {
      id: "agents-recombine",
      d: curveBetween(edgePoint(agents, recombine), recombine),
      stage: 3,
    },
    {
      id: "recombine-return",
      d: connectFromPoint(recombine, returnNode),
      stage: 3,
    },
    { id: "return-result", d: connectBoxes(returnNode, result), stage: 3 },
  );

  return paths;
}

function makeStackedPaths(boxes: Partial<Record<MeasureKey, MeasuredBox>>): ConnectorPath[] {
  const human = boxes.human;
  const cortex = boxes.cortex;
  const hermes = boxes.hermes;
  const models = boxes.models;
  const agents = boxes.agents;
  const returnNode = boxes["cortex-return"];
  const result = boxes.result;

  if (!human || !cortex || !hermes || !models || !agents || !returnNode || !result) return [];

  // Keep the two branches legible without tracing the outside of the fields. The
  // collector stays near the right edge of the actual fields and is hidden under
  // them, so only the useful links remain visible in the gaps between stages.
  const sideX = Math.max(models.right, agents.right) - 22;
  const modelEntry = { x: models.centerX, y: models.top };
  const agentEntry = { x: agents.right - 24, y: agents.top };
  const agentBranch = { x: sideX, y: agents.top - 18 };
  const modelExit = { x: models.right - 24, y: models.bottom };
  const agentExit = { x: agents.right - 24, y: agents.bottom };
  const lowerCollector = { x: sideX, y: agents.bottom + 18 };

  return [
    { id: "human-cortex", d: connectBoxes(human, cortex), stage: 0 },
    { id: "cortex-hermes", d: connectBoxes(cortex, hermes), stage: 0 },
    {
      id: "hermes-models",
      d: curveBetween({ x: hermes.centerX - 16, y: hermes.bottom }, modelEntry),
      stage: 1,
    },
    {
      id: "hermes-agents",
      d: routeThrough(
        { x: hermes.right - 20, y: hermes.bottom },
        [{ x: sideX, y: hermes.bottom + 18 }, agentBranch],
        agentEntry,
      ),
      stage: 2,
    },
    {
      id: "models-recombine",
      d: routeThrough(modelExit, [{ x: sideX, y: models.bottom + 18 }], lowerCollector),
      stage: 3,
    },
    {
      id: "agents-recombine",
      d: curveBetween(agentExit, lowerCollector),
      stage: 3,
    },
    {
      id: "recombine-return",
      d: connectFromPoint(lowerCollector, returnNode),
      stage: 3,
    },
    { id: "return-result", d: connectBoxes(returnNode, result), stage: 3 },
  ];
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
      <span className="cortex-system-map__node-mark" aria-hidden="true">{item.mark}</span>
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
      animate={visible ? { opacity: 1, clipPath: "inset(0% 0% 0% 0%)" } : { opacity: 0, clipPath: "inset(0% 0% 10% 0%)" }}
      transition={{ duration: reducedMotion ? 0 : 0.82, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function FieldDetail({ item }: { item: SystemItem | undefined }) {
  return (
    <div className={`cortex-system-map__field-detail${item ? " is-filled" : ""}`} aria-live="polite">
      <AnimatePresence initial={false} mode="wait">
        {item ? (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
          >
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
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
  const measuredRefs = useRef<Partial<Record<MeasureKey, HTMLElement | null>>>({});
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

  const registerRef = (id: MeasureKey) => (element: HTMLElement | null) => {
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

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [isInView, reducedMotion, reducedMotionPreference]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frame = 0;
    const measure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const canvasRect = canvas.getBoundingClientRect();
        const boxes = Object.entries(measuredRefs.current).reduce<Partial<Record<MeasureKey, MeasuredBox>>>((result, [id, element]) => {
          if (element) result[id as MeasureKey] = getMeasuredBox(element, canvasRect);
          return result;
        }, {});

        const nextPaths = canvas.clientWidth >= 680 ? makeWidePaths(boxes) : makeStackedPaths(boxes);
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
          <div ref={registerRef("models")} className="cortex-system-map__field cortex-system-map__field--models" aria-labelledby="cortex-system-map-models-title">
            <h3 id="cortex-system-map-models-title" className="cortex-system-map__field-title">Models</h3>
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
          <div ref={registerRef("agents")} className="cortex-system-map__field cortex-system-map__field--agents" aria-labelledby="cortex-system-map-agents-title">
            <h3 id="cortex-system-map-agents-title" className="cortex-system-map__field-title">Agents</h3>
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
