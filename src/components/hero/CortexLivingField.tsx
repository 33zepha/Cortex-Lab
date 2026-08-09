import { useEffect, useRef } from "react";

type Vec3 = { x: number; y: number; z: number };
type SurfacePoint = Vec3 & { phase: number; energy: number; glyph: 0 | 1 | 2 };
type Link = readonly [number, number];
type ProjectedPoint = { x: number; y: number; z: number; alpha: number; size: number; energy: number; glyph: 0 | 1 | 2 };
type Particle = Vec3 & { phase: number; drift: number; energy: number };
type SceneData = { points: SurfacePoint[]; links: Link[]; particles: Particle[] };
type CortexLivingFieldProps = { className?: string };

const TAU = Math.PI * 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

function surfacePosition(u: number, v: number): Vec3 {
  const gap = 1.12;
  const theta = gap * 0.5 + u * (TAU - gap);
  const phi = v * TAU;
  const endTaper = 0.72 + 0.28 * Math.pow(Math.sin(Math.PI * u), 0.45);
  const centerRadius = 1.08 + 0.08 * Math.sin(theta * 3 - 0.4);
  const tubeRadius = (0.39 + 0.045 * Math.sin(theta * 2 + 0.8)) * endTaper;
  const radialX = Math.cos(theta);
  const radialY = Math.sin(theta);
  const centerX = radialX * centerRadius + 0.1 * Math.sin(theta * 2);
  const centerY = radialY * 0.89 + 0.1 * Math.cos(theta * 1.45);
  const centerZ = 0.14 * Math.sin(theta * 2) + 0.05 * Math.cos(theta * 3);
  const cross = Math.cos(phi) * tubeRadius;
  const depth = Math.sin(phi) * tubeRadius * 0.86;

  return {
    x: centerX + radialX * cross,
    y: centerY + radialY * cross + 0.035 * Math.sin(phi * 2 + theta),
    z: centerZ + depth + 0.035 * Math.sin(theta * 2.4 + phi * 1.3),
  };
}

function buildScene(compact: boolean): SceneData {
  const random = seededRandom(compact ? 0x91c07 : 0xc07e5);
  const rows = compact ? 42 : 58;
  const cols = compact ? 13 : 19;
  const points: SurfacePoint[] = [];
  const links: Link[] = [];

  for (let row = 0; row < rows; row += 1) {
    const u = row / (rows - 1);
    for (let col = 0; col < cols; col += 1) {
      const v = col / cols;
      const base = surfacePosition(u, v);
      const jitter = compact ? 0.017 : 0.013;
      const glyphRoll = random();
      const glyph: 0 | 1 | 2 = glyphRoll < 0.075 ? 0 : glyphRoll < 0.17 ? 1 : 2;
      points.push({
        x: base.x + (random() - 0.5) * jitter,
        y: base.y + (random() - 0.5) * jitter,
        z: base.z + (random() - 0.5) * jitter,
        phase: random() * TAU,
        energy: 0.38 + random() * 0.62,
        glyph,
      });
    }
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;
      const around = row * cols + ((col + 1) % cols);
      if (random() < 0.34) links.push([index, around]);
      if (row < rows - 1 && random() < 0.48) links.push([index, (row + 1) * cols + col]);
      if (row < rows - 2 && random() < 0.055) {
        const offset = random() < 0.5 ? 1 : -1;
        const targetCol = (col + offset + cols) % cols;
        links.push([index, (row + 2) * cols + targetCol]);
      }
    }
  }

  const particleCount = compact ? 54 : 92;
  const particles: Particle[] = Array.from({ length: particleCount }, () => {
    const angle = random() * TAU;
    const radius = 1.45 + random() * 1.55;
    return {
      x: Math.cos(angle) * radius,
      y: (random() - 0.5) * 2.3,
      z: Math.sin(angle) * radius * 0.68,
      phase: random() * TAU,
      drift: 0.15 + random() * 0.38,
      energy: 0.18 + random() * 0.42,
    };
  });

  return { points, links, particles };
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
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = reducedMotionQuery.matches;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, width < 760 ? 1.35 : 1.7);
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
      const cameraDistance = 4.7;
      const depth = Math.max(2.6, cameraDistance - point.z);
      const scale = focal / depth;
      return { x: centerX + point.x * scale, y: centerY - point.y * scale, z: point.z };
    };

    const drawOrbit = (time: number, centerX: number, centerY: number, focal: number, radiusX: number, radiusY: number, tilt: number, phase: number, alpha: number) => {
      context.beginPath();
      const samples = compact ? 58 : 80;
      for (let index = 0; index <= samples; index += 1) {
        const t = index / samples;
        const angle = t * TAU + phase + time * 0.012;
        const raw: Vec3 = { x: Math.cos(angle) * radiusX, y: Math.sin(angle) * radiusY, z: Math.sin(angle + phase) * 0.24 };
        const rotated = rotatePoint(raw, tilt, -0.22, 0.08);
        const projected = project(rotated, centerX, centerY, focal);
        if (index === 0) context.moveTo(projected.x, projected.y);
        else context.lineTo(projected.x, projected.y);
      }
      context.strokeStyle = `rgba(214, 220, 216, ${alpha})`;
      context.lineWidth = 0.55;
      context.stroke();
    };

    const draw = (timestamp: number) => {
      frameHandle = window.requestAnimationFrame(draw);
      if (!visible) return;
      const minInterval = compact ? 1000 / 38 : 1000 / 60;
      if (timestamp - lastFrame < minInterval) return;
      lastFrame = timestamp;
      const time = reducedMotion ? 0 : timestamp * 0.001;
      smoothPointerX += (pointerX - smoothPointerX) * 0.032;
      smoothPointerY += (pointerY - smoothPointerY) * 0.032;
      context.clearRect(0, 0, width, height);

      const centerX = compact ? width * 0.53 : width * 0.72;
      const centerY = compact ? height * 0.47 : height * 0.5;
      const focal = Math.min(width, height) * (compact ? 1.08 : 1.23);
      const breathe = reducedMotion ? 1 : 1 + Math.sin(time * 0.55) * 0.012;
      const rx = -0.13 + Math.sin(time * 0.16) * 0.025 - smoothPointerY * 0.038;
      const ry = 0.42 + Math.sin(time * 0.12) * 0.052 + smoothPointerX * 0.07;
      const rz = -0.035 + Math.sin(time * 0.1) * 0.018;

      const aura = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width, height) * 0.56);
      aura.addColorStop(0, "rgba(74, 82, 78, 0.055)");
      aura.addColorStop(0.42, "rgba(35, 41, 38, 0.026)");
      aura.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = aura;
      context.fillRect(0, 0, width, height);

      drawOrbit(time, centerX, centerY, focal, 1.78, 0.5, 0.34, 0.4, 0.034);
      if (!compact) drawOrbit(time, centerX, centerY, focal, 1.55, 0.78, -0.38, 2.2, 0.021);

      const projected: ProjectedPoint[] = new Array(scene.points.length);
      for (let index = 0; index < scene.points.length; index += 1) {
        const point = scene.points[index];
        if (!point) continue;
        const microMotion = reducedMotion ? 0 : Math.sin(time * 0.72 + point.phase) * 0.018;
        const rotated = rotatePoint({ x: point.x * breathe, y: point.y * breathe, z: point.z * breathe + microMotion }, rx, ry, rz);
        const screen = project(rotated, centerX, centerY, focal);
        const depthLight = clamp((rotated.z + 0.95) / 1.95, 0.05, 1);
        const flicker = reducedMotion ? 1 : 0.88 + 0.12 * Math.sin(time * 1.35 + point.phase * 1.7);
        projected[index] = {
          x: screen.x,
          y: screen.y,
          z: screen.z,
          alpha: clamp((0.1 + depthLight * 0.72) * point.energy * flicker, 0.035, 0.92),
          size: clamp((0.62 + depthLight * 1.25) * (0.82 + point.energy * 0.36), 0.55, 2.2),
          energy: point.energy,
          glyph: point.glyph,
        };
      }

      context.lineWidth = compact ? 0.42 : 0.5;
      for (const [fromIndex, toIndex] of scene.links) {
        const from = projected[fromIndex];
        const to = projected[toIndex];
        if (!from || !to) continue;
        const dx = from.x - to.x;
        const dy = from.y - to.y;
        if (dx * dx + dy * dy > (compact ? 1550 : 2600)) continue;
        const front = clamp((from.z + to.z + 1.55) / 3.1, 0.02, 1);
        const alpha = Math.min(from.alpha, to.alpha) * front * 0.16;
        if (alpha < 0.012) continue;
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.strokeStyle = `rgba(210, 218, 213, ${alpha})`;
        context.stroke();
      }

      const ordered = [...projected].sort((a, b) => a.z - b.z);
      for (const point of ordered) {
        const white = 228 + Math.round(point.energy * 24);
        context.fillStyle = `rgba(${white}, ${white + 1}, ${white}, ${point.alpha})`;
        if (point.glyph === 0 && point.size > 0.9) {
          context.beginPath();
          context.arc(point.x, point.y, point.size * 0.92, 0, TAU);
          context.lineWidth = Math.max(0.45, point.size * 0.34);
          context.strokeStyle = `rgba(${white}, ${white + 1}, ${white}, ${point.alpha * 0.86})`;
          context.stroke();
        } else if (point.glyph === 1 && point.size > 0.82) {
          context.fillRect(point.x - point.size * 0.22, point.y - point.size, point.size * 0.44, point.size * 2);
        } else {
          context.beginPath();
          context.arc(point.x, point.y, point.size * 0.52, 0, TAU);
          context.fill();
        }
      }

      for (let signalIndex = 0; signalIndex < 12; signalIndex += 1) {
        const phase = signalIndex / 12;
        const u = reducedMotion ? phase : (phase + time * (0.018 + (signalIndex % 3) * 0.004)) % 1;
        const v = ((signalIndex * 0.173) % 1 + Math.sin(time * 0.17 + signalIndex) * 0.025 + 1) % 1;
        const rotated = rotatePoint(surfacePosition(u, v), rx, ry, rz);
        const signal = project(rotated, centerX, centerY, focal);
        const front = clamp((rotated.z + 0.9) / 1.8, 0.12, 1);
        const pulse = reducedMotion ? 0.75 : 0.56 + 0.44 * Math.sin(time * 2.2 + signalIndex * 1.7) ** 2;
        const radius = (compact ? 1 : 1.25) + front * 0.85;
        context.beginPath();
        context.arc(signal.x, signal.y, radius, 0, TAU);
        context.fillStyle = `rgba(248, 250, 248, ${0.28 + front * pulse * 0.62})`;
        context.fill();
      }

      for (const particle of scene.particles) {
        const driftAngle = time * particle.drift * 0.055 + particle.phase;
        const drifted: Vec3 = {
          x: particle.x + Math.cos(driftAngle) * 0.075,
          y: particle.y + Math.sin(driftAngle * 0.9) * 0.055,
          z: particle.z + Math.sin(driftAngle) * 0.065,
        };
        const rotated = rotatePoint(drifted, rx * 0.55, ry * 0.45, rz * 0.4);
        const screen = project(rotated, centerX, centerY, focal);
        const depth = clamp((rotated.z + 2.2) / 4.4, 0.08, 1);
        const alpha = particle.energy * depth * (reducedMotion ? 0.45 : 0.4 + 0.22 * Math.sin(time * 0.8 + particle.phase) ** 2);
        const radius = compact ? 0.38 + depth * 0.45 : 0.42 + depth * 0.58;
        context.beginPath();
        context.arc(screen.x, screen.y, radius, 0, TAU);
        context.fillStyle = `rgba(222, 228, 224, ${alpha})`;
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
