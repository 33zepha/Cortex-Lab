import { useEffect, useRef } from "react";

type Vec3 = { x: number; y: number; z: number };
type ClusterId = 0 | 1 | 2;
type FieldPoint = {
  cluster: ClusterId;
  u: number;
  v: number;
  phase: number;
  energy: number;
  shell: number;
  jitter: Vec3;
};
type Filament = {
  cluster: ClusterId;
  phase: number;
  offset: number;
  energy: number;
};
type AmbientMote = {
  cluster: ClusterId;
  phase: number;
  radius: number;
  vertical: number;
  depth: number;
  energy: number;
};
type SceneData = {
  points: FieldPoint[];
  filaments: Filament[];
  motes: AmbientMote[];
};
type ProjectedPoint = {
  x: number;
  y: number;
  z: number;
  alpha: number;
  size: number;
  energy: number;
  cluster: ClusterId;
};
type ClusterConfig = {
  anchor: Vec3;
  approachAnchor: Vec3;
  radius: Vec3;
  tilt: number;
  phase: number;
  tone: readonly [number, number, number];
};
type StoryState = {
  approach: number;
  braid: number;
  cohere: number;
};
type CortexLivingFieldProps = { className?: string };

const TAU = Math.PI * 2;
const GOLDEN = 0.6180339887498949;
const STORY = {
  approachStart: 7,
  braidStart: 15,
  cohereStart: 27,
  settledAt: 35,
} as const;

const CLUSTERS: readonly ClusterConfig[] = [
  {
    anchor: { x: 0.48, y: 1.02, z: -0.18 },
    approachAnchor: { x: 0.25, y: 0.72, z: -0.08 },
    radius: { x: 0.5, y: 0.59, z: 0.39 },
    tilt: -0.24,
    phase: 0.35,
    tone: [236, 239, 233],
  },
  {
    anchor: { x: -0.36, y: 0.02, z: 0.24 },
    approachAnchor: { x: -0.1, y: 0.02, z: 0.13 },
    radius: { x: 0.46, y: 0.52, z: 0.43 },
    tilt: 0.11,
    phase: 2.45,
    tone: [219, 229, 224],
  },
  {
    anchor: { x: 0.54, y: -1.03, z: -0.04 },
    approachAnchor: { x: 0.27, y: -0.72, z: -0.02 },
    radius: { x: 0.54, y: 0.57, z: 0.38 },
    tilt: 0.22,
    phase: 4.6,
    tone: [229, 232, 238],
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
  const t = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
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
  if (reducedMotion) return { approach: 1, braid: 0.84, cohere: 0.62 };
  return {
    approach: smoothstep(STORY.approachStart, STORY.braidStart, elapsedSeconds),
    braid: smoothstep(STORY.braidStart, STORY.cohereStart, elapsedSeconds),
    cohere: smoothstep(STORY.cohereStart, STORY.settledAt, elapsedSeconds),
  };
}

function nucleusPosition(point: FieldPoint, time: number, reducedMotion: boolean): Vec3 {
  const config = clusterConfig(point.cluster);
  const latitude = Math.asin(clamp(point.u * 2 - 1, -1, 1));
  const longitude = point.v * TAU + config.tilt;
  const latCos = Math.cos(latitude);
  const sculpt = 1 + Math.sin(longitude * 2.7 + latitude * 1.8 + config.phase) * 0.055;
  const shell = point.shell * sculpt;
  const breath = reducedMotion
    ? 1
    : 1 + Math.sin(time * (0.31 + point.cluster * 0.025) + config.phase) * 0.015;
  const drift = reducedMotion ? 0 : 0.034;
  const anchor: Vec3 = {
    x: config.anchor.x + Math.sin(time * 0.17 + config.phase) * drift,
    y: config.anchor.y + Math.cos(time * 0.145 + config.phase) * drift * 0.72,
    z: config.anchor.z + Math.sin(time * 0.13 + config.phase * 0.7) * drift * 0.8,
  };

  return {
    x: anchor.x + latCos * Math.cos(longitude) * config.radius.x * shell * breath,
    y: anchor.y + Math.sin(latitude) * config.radius.y * shell * breath,
    z: anchor.z + latCos * Math.sin(longitude) * config.radius.z * shell * breath,
  };
}

function approachPosition(point: FieldPoint, time: number, reducedMotion: boolean): Vec3 {
  const config = clusterConfig(point.cluster);
  const s = point.u * 2 - 1;
  const phi = point.v * TAU + config.phase * 0.32;
  const taper = 0.74 + 0.26 * Math.cos(s * Math.PI * 0.5);
  const tube = (0.205 + point.cluster * 0.008) * taper * point.shell;
  const longitudinal = 0.57 + point.cluster * 0.025;
  const motion = reducedMotion ? 0 : Math.sin(time * 0.22 + config.phase) * 0.018;
  const lean = config.tilt * 0.72;

  return {
    x: config.approachAnchor.x + s * lean + Math.cos(phi) * tube + motion,
    y: config.approachAnchor.y + s * longitudinal + Math.sin(phi) * tube * 0.5,
    z: config.approachAnchor.z + Math.sin(phi) * tube * 0.9 + Math.sin(s * Math.PI + config.phase) * 0.06,
  };
}

function braidPosition(point: FieldPoint, time: number, cohere: number, reducedMotion: boolean): Vec3 {
  const s = point.u * 2 - 1;
  const config = clusterConfig(point.cluster);
  const strandPhase = point.cluster * (TAU / 3);
  const angle = strandPhase + s * Math.PI * 1.12 + Math.sin(s * Math.PI * 0.72) * 0.14;
  const centerTension = Math.exp(-s * s * 4.1);
  const settle = mix(1, 0.82, cohere);
  const helixRadius = (0.38 - centerTension * 0.07 * cohere) * settle;
  const fibreRadius = (0.14 + Math.cos(s * Math.PI) * 0.012) * point.shell * mix(1, 0.9, cohere);
  const phi = point.v * TAU + point.phase * 0.05;
  const axisX = 0.075 + Math.sin(s * Math.PI * 0.95) * 0.06;
  const axisZ = Math.sin(s * Math.PI * 0.74) * 0.038;
  const living = reducedMotion ? 0 : Math.sin(time * 0.19 + config.phase + s * 2.1) * 0.013 * (1 - cohere * 0.7);

  return {
    x: axisX + Math.cos(angle) * (helixRadius + Math.cos(phi) * fibreRadius) + living,
    y: s * 1.42 + Math.sin(phi) * fibreRadius * 0.62,
    z: axisZ + Math.sin(angle) * (helixRadius * 0.78 + Math.cos(phi) * fibreRadius * 0.72),
  };
}

function livingPosition(point: FieldPoint, time: number, state: StoryState, reducedMotion: boolean): Vec3 {
  const nucleus = nucleusPosition(point, time, reducedMotion);
  const approach = approachPosition(point, time, reducedMotion);
  const braided = braidPosition(point, time, state.cohere, reducedMotion);
  const position = mixVec(mixVec(nucleus, approach, state.approach), braided, state.braid);
  const jitterFade = 1 - state.braid * 0.68;

  return {
    x: position.x + point.jitter.x * jitterFade,
    y: position.y + point.jitter.y * jitterFade,
    z: position.z + point.jitter.z * jitterFade,
  };
}

function buildScene(compact: boolean): SceneData {
  const random = seededRandom(compact ? 0x6c0a7 : 0xc07e91);
  const points: FieldPoint[] = [];
  const filaments: Filament[] = [];
  const motes: AmbientMote[] = [];
  const pointCount = compact ? 420 : 720;
  const filamentCount = compact ? 6 : 9;

  for (let cluster = 0; cluster < 3; cluster += 1) {
    const clusterId = cluster as ClusterId;
    for (let index = 0; index < pointCount; index += 1) {
      const u = (index + 0.5) / pointCount;
      const v = (index * GOLDEN + random() * 0.02) % 1;
      const shell = 0.78 + Math.pow(random(), 0.52) * 0.25;
      const jitterScale = compact ? 0.016 : 0.012;
      points.push({
        cluster: clusterId,
        u,
        v,
        phase: random() * TAU,
        energy: 0.38 + Math.pow(random(), 0.55) * 0.62,
        shell,
        jitter: {
          x: (random() - 0.5) * jitterScale,
          y: (random() - 0.5) * jitterScale,
          z: (random() - 0.5) * jitterScale,
        },
      });
    }

    for (let index = 0; index < filamentCount; index += 1) {
      filaments.push({
        cluster: clusterId,
        phase: (index / filamentCount + random() * 0.045) % 1,
        offset: (random() - 0.5) * 0.08,
        energy: 0.5 + random() * 0.5,
      });
    }

    const moteCount = compact ? 5 : 8;
    for (let index = 0; index < moteCount; index += 1) {
      motes.push({
        cluster: clusterId,
        phase: random() * TAU,
        radius: 0.72 + random() * 0.78,
        vertical: random() - 0.5,
        depth: random() - 0.5,
        energy: 0.16 + random() * 0.24,
      });
    }
  }

  return { points, filaments, motes };
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
      const dpr = Math.min(window.devicePixelRatio || 1, width < 760 ? 1.45 : 1.85);
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
      const cameraDistance = 5.1;
      const depth = Math.max(2.9, cameraDistance - point.z);
      const scale = focal / depth;
      return { x: centerX + point.x * scale, y: centerY - point.y * scale, z: point.z };
    };

    const drawFilaments = (
      time: number,
      state: StoryState,
      centerX: number,
      centerY: number,
      focal: number,
      rx: number,
      ry: number,
      rz: number,
    ) => {
      const samples = compact ? 22 : 30;
      for (const filament of scene.filaments) {
        const tone = clusterConfig(filament.cluster).tone;
        context.beginPath();
        for (let index = 0; index <= samples; index += 1) {
          const u = index / samples;
          const synthetic: FieldPoint = {
            cluster: filament.cluster,
            u,
            v: (filament.phase + filament.offset * Math.sin(u * Math.PI)) % 1,
            phase: filament.phase * TAU,
            energy: filament.energy,
            shell: 0.92 + Math.sin(u * Math.PI) * 0.06,
            jitter: { x: 0, y: 0, z: 0 },
          };
          const raw = livingPosition(synthetic, time, state, reducedMotion);
          const rotated = rotatePoint(raw, rx, ry, rz);
          const screen = project(rotated, centerX, centerY, focal);
          if (index === 0) context.moveTo(screen.x, screen.y);
          else context.lineTo(screen.x, screen.y);
        }
        const strength = 0.018 + state.approach * 0.012 + state.braid * 0.028;
        context.strokeStyle = `rgba(${tone[0]}, ${tone[1]}, ${tone[2]}, ${strength * filament.energy})`;
        context.lineWidth = compact ? 0.62 : 0.72;
        context.stroke();
      }
    };

    const drawDialogue = (
      elapsed: number,
      state: StoryState,
      centerX: number,
      centerY: number,
      focal: number,
      rx: number,
      ry: number,
      rz: number,
    ) => {
      const visibilityAmount = state.approach * (1 - state.braid * 0.72);
      if (visibilityAmount < 0.025) return;

      for (let pair = 0; pair < 2; pair += 1) {
        const fromConfig = clusterConfig(pair as ClusterId);
        const toConfig = clusterConfig((pair + 1) as ClusterId);
        const from = mixVec(fromConfig.anchor, fromConfig.approachAnchor, state.approach);
        const to = mixVec(toConfig.anchor, toConfig.approachAnchor, state.approach);
        const control: Vec3 = {
          x: (from.x + to.x) * 0.5 + (pair === 0 ? -0.12 : 0.12),
          y: (from.y + to.y) * 0.5,
          z: (from.z + to.z) * 0.5 + 0.17,
        };
        const samples = compact ? 24 : 32;
        context.beginPath();
        for (let index = 0; index <= samples; index += 1) {
          const t = index / samples;
          const rotated = rotatePoint(bezierPoint(from, control, to, t), rx, ry, rz);
          const screen = project(rotated, centerX, centerY, focal);
          if (index === 0) context.moveTo(screen.x, screen.y);
          else context.lineTo(screen.x, screen.y);
        }
        context.strokeStyle = `rgba(226, 233, 228, ${0.012 + visibilityAmount * 0.038})`;
        context.lineWidth = compact ? 0.48 : 0.56;
        context.stroke();

        const signalCount = compact ? 1 : 2;
        for (let signal = 0; signal < signalCount; signal += 1) {
          const signalT = reducedMotion
            ? 0.48
            : (elapsed * (0.038 + signal * 0.006) + pair * 0.29 + signal * 0.41) % 1;
          const rotated = rotatePoint(bezierPoint(from, control, to, signalT), rx, ry, rz);
          const screen = project(rotated, centerX, centerY, focal);
          context.beginPath();
          context.arc(screen.x, screen.y, compact ? 0.72 : 0.9, 0, TAU);
          context.fillStyle = `rgba(244, 247, 243, ${0.18 + visibilityAmount * 0.42})`;
          context.fill();
        }
      }
    };

    const draw = (timestamp: number) => {
      frameHandle = window.requestAnimationFrame(draw);
      if (!visible) return;
      const minInterval = compact ? 1000 / 42 : 1000 / 60;
      if (timestamp - lastFrame < minInterval) return;
      lastFrame = timestamp;

      const time = reducedMotion ? 0 : timestamp * 0.001;
      const elapsed = reducedMotion ? STORY.settledAt : Math.max(0, (timestamp - startedAt) * 0.001);
      const state = storyState(elapsed, reducedMotion);
      smoothPointerX += (pointerX - smoothPointerX) * 0.026;
      smoothPointerY += (pointerY - smoothPointerY) * 0.026;
      context.clearRect(0, 0, width, height);

      const centerX = compact ? width * 0.56 : width * 0.745;
      const centerY = compact ? height * 0.49 : height * 0.5;
      const focal = Math.min(width, height) * (compact ? 1.13 : 1.22);
      const stability = state.braid * 0.6 + state.cohere * 0.32;
      const rx = -0.12 + Math.sin(time * 0.11) * 0.019 * (1 - stability) - smoothPointerY * 0.028;
      const ry = 0.31 + Math.sin(time * 0.09) * 0.035 * (1 - stability * 0.6) + smoothPointerX * 0.052;
      const rz = -0.02 + Math.sin(time * 0.075) * 0.011;

      const auraRadius = Math.min(width, height) * (compact ? 0.52 : 0.56);
      const aura = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, auraRadius);
      aura.addColorStop(0, `rgba(91, 104, 97, ${0.018 + state.braid * 0.016})`);
      aura.addColorStop(0.46, "rgba(40, 48, 44, 0.012)");
      aura.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = aura;
      context.fillRect(0, 0, width, height);

      drawFilaments(time, state, centerX, centerY, focal, rx, ry, rz);

      const projected: Array<ProjectedPoint | undefined> = new Array(scene.points.length);
      for (let index = 0; index < scene.points.length; index += 1) {
        const point = scene.points[index];
        if (!point) continue;
        const raw = livingPosition(point, time, state, reducedMotion);
        const rotated = rotatePoint(raw, rx, ry, rz);
        const screen = project(rotated, centerX, centerY, focal);
        const depthLight = clamp((rotated.z + 1.15) / 2.3, 0.045, 1);
        const calmPulse = reducedMotion ? 1 : 0.94 + Math.sin(time * 0.72 + point.phase) * 0.06;
        const structureGain = 0.9 + state.braid * 0.12 + state.cohere * 0.04;
        projected[index] = {
          x: screen.x,
          y: screen.y,
          z: screen.z,
          alpha: clamp((0.035 + depthLight * 0.72) * point.energy * calmPulse * structureGain, 0.018, 0.88),
          size: clamp((0.48 + depthLight * 1.25) * (0.78 + point.energy * 0.42), 0.44, 2.05),
          energy: point.energy,
          cluster: point.cluster,
        };
      }

      const ordered = projected
        .filter((point): point is ProjectedPoint => Boolean(point))
        .sort((a, b) => a.z - b.z);

      for (const point of ordered) {
        const tone = clusterConfig(point.cluster).tone;
        const front = clamp((point.z + 1.05) / 2.1, 0, 1);
        const haloAlpha = point.alpha * front * point.energy * 0.055;
        if (haloAlpha > 0.008 && point.energy > 0.62) {
          context.beginPath();
          context.arc(point.x, point.y, point.size * 2.15, 0, TAU);
          context.fillStyle = `rgba(${tone[0]}, ${tone[1]}, ${tone[2]}, ${haloAlpha})`;
          context.fill();
        }
      }

      for (const point of ordered) {
        const tone = clusterConfig(point.cluster).tone;
        const brightness = Math.round(point.energy * 8);
        const red = Math.min(255, tone[0] + brightness);
        const green = Math.min(255, tone[1] + brightness);
        const blue = Math.min(255, tone[2] + brightness);
        context.beginPath();
        context.arc(point.x, point.y, point.size * 0.46, 0, TAU);
        context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${point.alpha})`;
        context.fill();
      }

      drawDialogue(elapsed, state, centerX, centerY, focal, rx, ry, rz);

      for (const mote of scene.motes) {
        const config = clusterConfig(mote.cluster);
        const storyAnchor = mixVec(config.anchor, config.approachAnchor, state.approach * (1 - state.braid * 0.7));
        const drift = time * (0.025 + mote.energy * 0.025) + mote.phase;
        const raw: Vec3 = {
          x: storyAnchor.x + Math.cos(drift) * mote.radius * (1 - state.braid * 0.46),
          y: storyAnchor.y + mote.vertical * 1.22 + Math.sin(drift * 0.7) * 0.08,
          z: storyAnchor.z + mote.depth * 0.86 + Math.sin(drift) * 0.1,
        };
        const rotated = rotatePoint(raw, rx * 0.46, ry * 0.4, rz * 0.35);
        const screen = project(rotated, centerX, centerY, focal);
        const depth = clamp((rotated.z + 2) / 4, 0.08, 1);
        const alpha = mote.energy * depth * (1 - state.cohere * 0.4) * 0.42;
        context.beginPath();
        context.arc(screen.x, screen.y, compact ? 0.34 : 0.42, 0, TAU);
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
