import { useEffect, useRef } from "react";

type Vec3 = { x: number; y: number; z: number };
type ClusterId = 0 | 1 | 2;
type Glyph = 0 | 1 | 2;
type PointLink = readonly [number, number];
type BridgeLink = readonly [number, number, number];
type SurfacePoint = {
  cluster: ClusterId;
  u: number;
  v: number;
  phase: number;
  energy: number;
  glyph: Glyph;
  jitterX: number;
  jitterY: number;
  jitterZ: number;
};
type AmbientParticle = Vec3 & {
  cluster: ClusterId;
  phase: number;
  drift: number;
  energy: number;
};
type SceneData = {
  points: SurfacePoint[];
  links: PointLink[];
  bridges: BridgeLink[];
  particles: AmbientParticle[];
};
type ProjectedPoint = {
  x: number;
  y: number;
  z: number;
  alpha: number;
  size: number;
  energy: number;
  glyph: Glyph;
  cluster: ClusterId;
};
type ClusterConfig = {
  anchor: Vec3;
  approachAnchor: Vec3;
  radius: Vec3;
  tilt: number;
  driftPhase: number;
  tone: readonly [number, number, number];
};
type StoryState = {
  approach: number;
  braid: number;
  cohere: number;
};
type CortexLivingFieldProps = { className?: string };

const TAU = Math.PI * 2;
const STORY = {
  approachStart: 5.5,
  braidStart: 12.5,
  cohereStart: 21.5,
  settledAt: 26,
} as const;

const CLUSTERS: readonly ClusterConfig[] = [
  {
    anchor: { x: 0.42, y: 0.98, z: -0.12 },
    approachAnchor: { x: 0.24, y: 0.68, z: -0.05 },
    radius: { x: 0.43, y: 0.53, z: 0.32 },
    tilt: -0.18,
    driftPhase: 0.2,
    tone: [239, 240, 235],
  },
  {
    anchor: { x: -0.3, y: 0.02, z: 0.2 },
    approachAnchor: { x: -0.08, y: 0.01, z: 0.13 },
    radius: { x: 0.37, y: 0.44, z: 0.36 },
    tilt: 0.13,
    driftPhase: 2.4,
    tone: [224, 231, 227],
  },
  {
    anchor: { x: 0.5, y: -0.97, z: -0.06 },
    approachAnchor: { x: 0.25, y: -0.67, z: -0.03 },
    radius: { x: 0.47, y: 0.5, z: 0.31 },
    tilt: 0.2,
    driftPhase: 4.5,
    tone: [232, 234, 240],
  },
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mix(a: number, b: number, amount: number) {
  return a + (b - a) * amount;
}

function mixVec(a: Vec3, b: Vec3, amount: number): Vec3 {
  return {
    x: mix(a.x, b.x, amount),
    y: mix(a.y, b.y, amount),
    z: mix(a.z, b.z, amount),
  };
}

function smoothstep(edge0: number, edge1: number, value: number) {
  if (edge0 === edge1) return value < edge0 ? 0 : 1;
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clusterConfig(cluster: ClusterId): ClusterConfig {
  return CLUSTERS[cluster]!;
}

function storyState(elapsedSeconds: number, reducedMotion: boolean): StoryState {
  if (reducedMotion) {
    return { approach: 1, braid: 0.82, cohere: 0.58 };
  }

  return {
    approach: smoothstep(STORY.approachStart, STORY.braidStart, elapsedSeconds),
    braid: smoothstep(STORY.braidStart, STORY.cohereStart, elapsedSeconds),
    cohere: smoothstep(STORY.cohereStart, STORY.settledAt, elapsedSeconds),
  };
}

function nucleusPosition(point: SurfacePoint, time: number, reducedMotion: boolean): Vec3 {
  const config = clusterConfig(point.cluster);
  const latitude = (point.u - 0.5) * Math.PI;
  const longitude = point.v * TAU + config.tilt;
  const latCos = Math.cos(latitude);
  const breathing = reducedMotion
    ? 1
    : 1 + Math.sin(time * (0.38 + point.cluster * 0.035) + config.driftPhase) * 0.018;
  const localWarp = 1 + 0.055 * Math.sin(longitude * 3 + latitude * 2 + config.driftPhase);
  const x = latCos * Math.cos(longitude) * config.radius.x * localWarp;
  const y = Math.sin(latitude) * config.radius.y;
  const z = latCos * Math.sin(longitude) * config.radius.z * (1.04 - localWarp * 0.05);
  const driftAmount = reducedMotion ? 0 : 0.032;
  const anchor: Vec3 = {
    x: config.anchor.x + Math.sin(time * 0.21 + config.driftPhase) * driftAmount,
    y: config.anchor.y + Math.cos(time * 0.18 + config.driftPhase) * driftAmount * 0.7,
    z: config.anchor.z + Math.sin(time * 0.16 + config.driftPhase * 0.7) * driftAmount * 0.8,
  };

  return {
    x: anchor.x + x * breathing,
    y: anchor.y + y * breathing,
    z: anchor.z + z * breathing,
  };
}

function approachPosition(point: SurfacePoint, time: number, reducedMotion: boolean): Vec3 {
  const config = clusterConfig(point.cluster);
  const s = point.u * 2 - 1;
  const phi = point.v * TAU + config.driftPhase * 0.28;
  const compression = 0.78 + 0.22 * Math.cos(s * Math.PI * 0.5);
  const tube = (0.18 + point.cluster * 0.012) * compression;
  const longitudinal = 0.49 + point.cluster * 0.025;
  const lean = config.tilt * 0.7;
  const motion = reducedMotion ? 0 : Math.sin(time * 0.3 + config.driftPhase) * 0.018;

  return {
    x: config.approachAnchor.x + s * lean + Math.cos(phi) * tube + motion,
    y: config.approachAnchor.y + s * longitudinal + Math.sin(phi) * tube * 0.45,
    z: config.approachAnchor.z + Math.sin(phi) * tube * 0.82 + Math.sin(s * Math.PI + config.driftPhase) * 0.055,
  };
}

function braidPosition(point: SurfacePoint, time: number, cohere: number, reducedMotion: boolean): Vec3 {
  const s = point.u * 2 - 1;
  const config = clusterConfig(point.cluster);
  const clusterPhase = point.cluster * (TAU / 3);
  const turns = 1.08;
  const angle = clusterPhase + s * Math.PI * turns + Math.sin(s * Math.PI * 0.65) * 0.12;
  const centerPinch = Math.exp(-s * s * 4.6);
  const settle = mix(1, 0.74, cohere);
  const braidRadius = (0.34 - centerPinch * 0.085 * cohere) * settle;
  const tubeRadius = (0.115 + 0.012 * Math.cos(s * Math.PI)) * mix(1, 0.88, cohere);
  const phi = point.v * TAU + point.phase * 0.05;
  const radialX = Math.cos(angle);
  const radialZ = Math.sin(angle);
  const axisX = 0.075 + Math.sin(s * Math.PI) * 0.055;
  const axisZ = Math.sin(s * Math.PI * 0.72) * 0.035;
  const living = reducedMotion
    ? 0
    : Math.sin(time * 0.23 + config.driftPhase + s * 2.2) * 0.012 * (1 - cohere * 0.65);

  return {
    x: axisX + radialX * (braidRadius + Math.cos(phi) * tubeRadius) + living,
    y: s * 1.28 + Math.sin(phi) * tubeRadius * 0.58,
    z: axisZ + radialZ * (braidRadius * 0.77 + Math.cos(phi) * tubeRadius * 0.72),
  };
}

function livingPosition(point: SurfacePoint, time: number, state: StoryState, reducedMotion: boolean): Vec3 {
  const nucleus = nucleusPosition(point, time, reducedMotion);
  const approach = approachPosition(point, time, reducedMotion);
  const braided = braidPosition(point, time, state.cohere, reducedMotion);

  const approachBlend = state.approach;
  const braidBlend = state.braid;
  const preBraid = mixVec(nucleus, approach, approachBlend);
  const position = mixVec(preBraid, braided, braidBlend);
  const jitterFade = 1 - braidBlend * 0.55;

  return {
    x: position.x + point.jitterX * jitterFade,
    y: position.y + point.jitterY * jitterFade,
    z: position.z + point.jitterZ * jitterFade,
  };
}

function buildScene(compact: boolean): SceneData {
  const random = seededRandom(compact ? 0xb12a17 : 0xc07e7b);
  const rows = compact ? 18 : 26;
  const cols = compact ? 9 : 12;
  const points: SurfacePoint[] = [];
  const links: PointLink[] = [];
  const bridges: BridgeLink[] = [];
  const clusterStart: number[] = [];

  for (let cluster = 0; cluster < 3; cluster += 1) {
    const clusterId = cluster as ClusterId;
    clusterStart.push(points.length);
    for (let row = 0; row < rows; row += 1) {
      const u = (row + 0.5) / rows;
      for (let col = 0; col < cols; col += 1) {
        const v = (col + (row % 2) * 0.35) / cols;
        const glyphRoll = random();
        const glyph: Glyph = glyphRoll < 0.055 ? 0 : glyphRoll < 0.12 ? 1 : 2;
        const jitter = compact ? 0.025 : 0.018;
        points.push({
          cluster: clusterId,
          u,
          v,
          phase: random() * TAU,
          energy: 0.42 + random() * 0.58,
          glyph,
          jitterX: (random() - 0.5) * jitter,
          jitterY: (random() - 0.5) * jitter,
          jitterZ: (random() - 0.5) * jitter,
        });
      }
    }
  }

  for (let cluster = 0; cluster < 3; cluster += 1) {
    const start = clusterStart[cluster] ?? 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const index = start + row * cols + col;
        const around = start + row * cols + ((col + 1) % cols);
        if (random() < 0.37) links.push([index, around]);
        if (row < rows - 1 && random() < 0.52) links.push([index, start + (row + 1) * cols + col]);
        if (row < rows - 2 && random() < 0.045) {
          const offset = random() < 0.5 ? 1 : -1;
          const targetCol = (col + offset + cols) % cols;
          links.push([index, start + (row + 2) * cols + targetCol]);
        }
      }
    }
  }

  const bridgeCount = compact ? 7 : 11;
  const centerRowsStart = Math.floor(rows * 0.28);
  const centerRowsSpan = Math.max(1, Math.floor(rows * 0.45));
  for (let pair = 0; pair < 2; pair += 1) {
    const fromStart = clusterStart[pair] ?? 0;
    const toStart = clusterStart[pair + 1] ?? 0;
    for (let bridge = 0; bridge < bridgeCount; bridge += 1) {
      const row = centerRowsStart + Math.floor(random() * centerRowsSpan);
      const fromCol = Math.floor(random() * cols);
      const toCol = (fromCol + (random() < 0.5 ? 1 : cols - 1)) % cols;
      bridges.push([
        fromStart + row * cols + fromCol,
        toStart + row * cols + toCol,
        random() * TAU,
      ]);
    }
  }

  const particleCount = compact ? 30 : 48;
  const particles: AmbientParticle[] = [];
  for (let index = 0; index < particleCount; index += 1) {
    const cluster = (index % 3) as ClusterId;
    const config = clusterConfig(cluster);
    const angle = random() * TAU;
    const radius = 0.66 + random() * 1.05;
    particles.push({
      cluster,
      x: config.anchor.x + Math.cos(angle) * radius,
      y: config.anchor.y + (random() - 0.5) * 1.18,
      z: config.anchor.z + Math.sin(angle) * radius * 0.58,
      phase: random() * TAU,
      drift: 0.12 + random() * 0.3,
      energy: 0.12 + random() * 0.3,
    });
  }

  return { points, links, bridges, particles };
}

function rotatePoint(point: Vec3, rx: number, ry: number, rz: number): Vec3 {
  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);
  const cosZ = Math.cos(rz);
  const sinZ = Math.sin(rz);
  const y1 = point.y * cosX - point.z * sinX;
  const z1 = point.y * sinX + point.z * cosX;
  const x2 = point.x * cosY + z1 * sinY;
  const z2 = -point.x * sinY + z1 * cosY;

  return { x: x2 * cosZ - y1 * sinZ, y: x2 * sinZ + y1 * cosZ, z: z2 };
}

function bezierPoint(a: Vec3, control: Vec3, b: Vec3, t: number): Vec3 {
  const inverse = 1 - t;
  return {
    x: inverse * inverse * a.x + 2 * inverse * t * control.x + t * t * b.x,
    y: inverse * inverse * a.y + 2 * inverse * t * control.y + t * t * b.y,
    z: inverse * inverse * a.z + 2 * inverse * t * control.z + t * t * b.z,
  };
}

export function CortexLivingField({ className = "" }: CortexLivingFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return undefined;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return undefined;

    let width = 1;
    let height = 1;
    let dpr = 1;
    let compact = false;
    let scene = buildScene(false);
    let frameHandle = 0;
    let visible = true;
    let lastFrame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let smoothPointerX = 0;
    let smoothPointerY = 0;
    const startedAt = performance.now();
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = reducedMotionQuery.matches;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, width < 760 ? 1.35 : 1.75);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const nextCompact = width < 760;
      if (nextCompact !== compact) {
        compact = nextCompact;
        scene = buildScene(compact);
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.02 },
    );
    intersectionObserver.observe(host);

    const onPointerMove = (event: PointerEvent) => {
      pointerX = clamp((event.clientX / window.innerWidth - 0.5) * 2, -1, 1);
      pointerY = clamp((event.clientY / window.innerHeight - 0.5) * 2, -1, 1);
    };
    const onReducedMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    reducedMotionQuery.addEventListener("change", onReducedMotionChange);

    const project = (point: Vec3, centerX: number, centerY: number, focal: number) => {
      const cameraDistance = 4.9;
      const depth = Math.max(2.7, cameraDistance - point.z);
      const scale = focal / depth;
      return { x: centerX + point.x * scale, y: centerY - point.y * scale, z: point.z };
    };

    const drawBridgeSignals = (
      elapsed: number,
      state: StoryState,
      centerX: number,
      centerY: number,
      focal: number,
      rx: number,
      ry: number,
      rz: number,
    ) => {
      const dialogue = state.approach * (1 - state.braid * 0.62);
      if (dialogue < 0.03) return;

      for (let pair = 0; pair < 2; pair += 1) {
        const fromConfig = clusterConfig(pair as ClusterId);
        const toConfig = clusterConfig((pair + 1) as ClusterId);
        const from = mixVec(fromConfig.anchor, fromConfig.approachAnchor, state.approach);
        const to = mixVec(toConfig.anchor, toConfig.approachAnchor, state.approach);
        const control: Vec3 = {
          x: (from.x + to.x) * 0.5 + (pair === 0 ? -0.12 : 0.1),
          y: (from.y + to.y) * 0.5,
          z: (from.z + to.z) * 0.5 + 0.16,
        };
        const samples = 28;
        context.beginPath();
        for (let index = 0; index <= samples; index += 1) {
          const t = index / samples;
          const raw = bezierPoint(from, control, to, t);
          const rotated = rotatePoint(raw, rx, ry, rz);
          const screen = project(rotated, centerX, centerY, focal);
          if (index === 0) context.moveTo(screen.x, screen.y);
          else context.lineTo(screen.x, screen.y);
        }
        context.strokeStyle = `rgba(224, 230, 226, ${0.018 + dialogue * 0.045})`;
        context.lineWidth = 0.55;
        context.stroke();

        for (let signal = 0; signal < 2; signal += 1) {
          const signalT = reducedMotion
            ? 0.45 + signal * 0.12
            : (elapsed * (0.055 + signal * 0.007) + pair * 0.31 + signal * 0.47) % 1;
          const raw = bezierPoint(from, control, to, signalT);
          const rotated = rotatePoint(raw, rx, ry, rz);
          const screen = project(rotated, centerX, centerY, focal);
          context.beginPath();
          context.arc(screen.x, screen.y, compact ? 0.9 : 1.15, 0, TAU);
          context.fillStyle = `rgba(245, 247, 244, ${0.22 + dialogue * 0.48})`;
          context.fill();
        }
      }
    };

    const drawBraidSignals = (
      time: number,
      state: StoryState,
      centerX: number,
      centerY: number,
      focal: number,
      rx: number,
      ry: number,
      rz: number,
    ) => {
      if (state.braid < 0.08) return;
      const signalCount = compact ? 4 : 6;
      for (let signal = 0; signal < signalCount; signal += 1) {
        const cluster = (signal % 3) as ClusterId;
        const u = reducedMotion ? 0.34 + signal * 0.055 : (time * (0.018 + (signal % 2) * 0.004) + signal * 0.173) % 1;
        const synthetic: SurfacePoint = {
          cluster,
          u,
          v: 0.12 + ((signal * 0.19) % 0.7),
          phase: signal * 0.71,
          energy: 1,
          glyph: 2,
          jitterX: 0,
          jitterY: 0,
          jitterZ: 0,
        };
        const raw = braidPosition(synthetic, time, state.cohere, reducedMotion);
        const rotated = rotatePoint(raw, rx, ry, rz);
        const screen = project(rotated, centerX, centerY, focal);
        const pulse = reducedMotion ? 0.7 : 0.5 + 0.5 * Math.sin(time * 1.8 + signal * 1.2) ** 2;
        context.beginPath();
        context.arc(screen.x, screen.y, (compact ? 0.9 : 1.2) + pulse * 0.7, 0, TAU);
        context.fillStyle = `rgba(248, 249, 246, ${state.braid * (0.24 + pulse * 0.45)})`;
        context.fill();
      }
    };

    const draw = (timestamp: number) => {
      frameHandle = window.requestAnimationFrame(draw);
      if (!visible) return;
      const minInterval = compact ? 1000 / 38 : 1000 / 60;
      if (timestamp - lastFrame < minInterval) return;
      lastFrame = timestamp;

      const time = reducedMotion ? 0 : timestamp * 0.001;
      const elapsed = reducedMotion ? STORY.settledAt : Math.max(0, (timestamp - startedAt) * 0.001);
      const state = storyState(elapsed, reducedMotion);
      smoothPointerX += (pointerX - smoothPointerX) * 0.03;
      smoothPointerY += (pointerY - smoothPointerY) * 0.03;
      context.clearRect(0, 0, width, height);

      const centerX = compact ? width * 0.55 : width * 0.74;
      const centerY = compact ? height * 0.48 : height * 0.5;
      const focal = Math.min(width, height) * (compact ? 1.03 : 1.17);
      const stability = state.braid * 0.55 + state.cohere * 0.35;
      const rx = -0.12 + Math.sin(time * 0.13) * 0.022 * (1 - stability) - smoothPointerY * 0.032;
      const ry = 0.34 + Math.sin(time * 0.1) * 0.042 * (1 - stability * 0.55) + smoothPointerX * 0.058;
      const rz = -0.025 + Math.sin(time * 0.09) * 0.014;

      const auraRadius = Math.min(width, height) * (compact ? 0.45 : 0.52);
      const aura = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, auraRadius);
      aura.addColorStop(0, `rgba(74, 84, 79, ${0.018 + state.braid * 0.018})`);
      aura.addColorStop(0.45, "rgba(39, 45, 42, 0.016)");
      aura.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = aura;
      context.fillRect(0, 0, width, height);

      const projected: ProjectedPoint[] = [];
      for (let index = 0; index < scene.points.length; index += 1) {
        const point = scene.points[index];
        if (!point) continue;
        const raw = livingPosition(point, time, state, reducedMotion);
        const micro = reducedMotion
          ? 0
          : Math.sin(time * (0.56 + point.cluster * 0.045) + point.phase) * 0.008 * (1 - state.cohere * 0.6);
        const rotated = rotatePoint({ x: raw.x, y: raw.y, z: raw.z + micro }, rx, ry, rz);
        const screen = project(rotated, centerX, centerY, focal);
        const depthLight = clamp((rotated.z + 1.08) / 2.15, 0.06, 1);
        const pulse = reducedMotion ? 1 : 0.91 + Math.sin(time * 0.95 + point.phase) * 0.09;
        const structureGain = 0.88 + state.braid * 0.14 + state.cohere * 0.07;
        projected[index] = {
          x: screen.x,
          y: screen.y,
          z: screen.z,
          alpha: clamp((0.085 + depthLight * 0.74) * point.energy * pulse * structureGain, 0.028, 0.93),
          size: clamp((0.58 + depthLight * 1.18) * (0.84 + point.energy * 0.34), 0.52, 2.12),
          energy: point.energy,
          glyph: point.glyph,
          cluster: point.cluster,
        };
      }

      context.lineWidth = compact ? 0.4 : 0.48;
      for (const [fromIndex, toIndex] of scene.links) {
        const from = projected[fromIndex];
        const to = projected[toIndex];
        if (!from || !to) continue;
        const dx = from.x - to.x;
        const dy = from.y - to.y;
        if (dx * dx + dy * dy > (compact ? 1300 : 2200)) continue;
        const front = clamp((from.z + to.z + 1.7) / 3.4, 0.02, 1);
        const alpha = Math.min(from.alpha, to.alpha) * front * (0.115 + state.braid * 0.035);
        if (alpha < 0.01) continue;
        const tone = clusterConfig(from.cluster).tone;
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.strokeStyle = `rgba(${tone[0]}, ${tone[1]}, ${tone[2]}, ${alpha})`;
        context.stroke();
      }

      const bridgeStrength = state.approach * (0.18 + state.braid * 0.82);
      if (bridgeStrength > 0.025) {
        for (const [fromIndex, toIndex, phase] of scene.bridges) {
          const from = projected[fromIndex];
          const to = projected[toIndex];
          if (!from || !to) continue;
          const dx = from.x - to.x;
          const dy = from.y - to.y;
          const distanceSquared = dx * dx + dy * dy;
          const maxDistance = compact ? 5200 : 8600;
          if (distanceSquared > maxDistance) continue;
          const breathing = reducedMotion ? 0.72 : 0.58 + 0.42 * Math.sin(time * 0.62 + phase) ** 2;
          const alpha = bridgeStrength * breathing * Math.min(from.alpha, to.alpha) * 0.19;
          if (alpha < 0.008) continue;
          context.beginPath();
          context.moveTo(from.x, from.y);
          context.lineTo(to.x, to.y);
          context.strokeStyle = `rgba(231, 235, 231, ${alpha})`;
          context.lineWidth = compact ? 0.38 : 0.46;
          context.stroke();
        }
      }

      const ordered = projected.filter((point): point is ProjectedPoint => Boolean(point)).sort((a, b) => a.z - b.z);
      for (const point of ordered) {
        const tone = clusterConfig(point.cluster).tone;
        const brighten = Math.round(point.energy * 7);
        const red = Math.min(255, tone[0] + brighten);
        const green = Math.min(255, tone[1] + brighten);
        const blue = Math.min(255, tone[2] + brighten);
        context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${point.alpha})`;
        if (point.glyph === 0 && point.size > 0.9) {
          context.beginPath();
          context.arc(point.x, point.y, point.size * 0.86, 0, TAU);
          context.lineWidth = Math.max(0.42, point.size * 0.3);
          context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${point.alpha * 0.82})`;
          context.stroke();
        } else if (point.glyph === 1 && point.size > 0.84) {
          context.fillRect(point.x - point.size * 0.2, point.y - point.size * 0.9, point.size * 0.4, point.size * 1.8);
        } else {
          context.beginPath();
          context.arc(point.x, point.y, point.size * 0.5, 0, TAU);
          context.fill();
        }
      }

      drawBridgeSignals(elapsed, state, centerX, centerY, focal, rx, ry, rz);
      drawBraidSignals(time, state, centerX, centerY, focal, rx, ry, rz);

      for (const particle of scene.particles) {
        const config = clusterConfig(particle.cluster);
        const storyAnchor = mixVec(config.anchor, config.approachAnchor, state.approach * (1 - state.braid));
        const driftAngle = time * particle.drift * 0.05 + particle.phase;
        const raw: Vec3 = state.braid > 0.02
          ? {
              x: mix(particle.x, storyAnchor.x + Math.cos(driftAngle) * 0.62, state.braid * 0.72),
              y: mix(particle.y, storyAnchor.y + Math.sin(driftAngle * 0.7) * 0.68, state.braid * 0.72),
              z: mix(particle.z, storyAnchor.z + Math.sin(driftAngle) * 0.42, state.braid * 0.72),
            }
          : {
              x: particle.x + Math.cos(driftAngle) * 0.055,
              y: particle.y + Math.sin(driftAngle * 0.8) * 0.045,
              z: particle.z + Math.sin(driftAngle) * 0.05,
            };
        const rotated = rotatePoint(raw, rx * 0.48, ry * 0.42, rz * 0.35);
        const screen = project(rotated, centerX, centerY, focal);
        const depth = clamp((rotated.z + 2.2) / 4.4, 0.08, 1);
        const fadeWithStructure = 1 - state.cohere * 0.34;
        const alpha = particle.energy * depth * fadeWithStructure * (reducedMotion ? 0.38 : 0.32 + 0.18 * Math.sin(time * 0.7 + particle.phase) ** 2);
        context.beginPath();
        context.arc(screen.x, screen.y, compact ? 0.38 + depth * 0.38 : 0.4 + depth * 0.5, 0, TAU);
        context.fillStyle = `rgba(${config.tone[0]}, ${config.tone[1]}, ${config.tone[2]}, ${alpha})`;
        context.fill();
      }
    };

    frameHandle = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frameHandle);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      reducedMotionQuery.removeEventListener("change", onReducedMotionChange);
    };
  }, []);

  return (
    <div ref={hostRef} className={`relative h-full w-full overflow-hidden ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
