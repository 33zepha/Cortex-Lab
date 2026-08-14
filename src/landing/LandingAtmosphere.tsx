import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { type MotionValue, useReducedMotion } from "framer-motion";
import * as THREE from "three";

type LayerProps = {
  progress: MotionValue<number>;
  reducedMotion: boolean;
  count: number;
  spreadX: number;
  spreadY: number;
  depth: number;
  size: number;
  opacity: number;
  color: string;
  phase: number;
  speed: number;
};

type LandingAtmosphereProps = {
  progress: MotionValue<number>;
};

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp01((value - edge0) / Math.max(edge1 - edge0, 0.0001));
  return t * t * (3 - 2 * t);
}

function mix(a: number, b: number, amount: number) {
  return a + (b - a) * amount;
}

function random01(index: number, seed: number) {
  const value = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function PixelLayer({
  progress,
  reducedMotion,
  count,
  spreadX,
  spreadY,
  depth,
  size,
  opacity,
  color,
  phase,
  speed,
}: LayerProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const states = useMemo(() => {
    const chaos = new Float32Array(count * 3);
    const coordination = new Float32Array(count * 3);
    const resolution = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      const i3 = index * 3;

      const chaosAngle = random01(index, phase + 1) * Math.PI * 2;
      const chaosRadius = Math.pow(random01(index, phase + 2), 0.58);
      const chaosBias = 0.68 + random01(index, phase + 3) * 0.62;

      chaos[i3] = Math.cos(chaosAngle) * spreadX * chaosRadius * chaosBias;
      chaos[i3 + 1] = Math.sin(chaosAngle) * spreadY * chaosRadius;
      chaos[i3 + 2] = (random01(index, phase + 4) - 0.5) * depth;

      const lane = Math.floor(random01(index, phase + 5) * 5) - 2;
      const laneProgress = random01(index, phase + 6);
      const laneJitter = random01(index, phase + 7) - 0.5;
      const laneWave = Math.sin(laneProgress * Math.PI * 2 + phase + lane * 0.7);

      coordination[i3] = (laneProgress - 0.5) * spreadX * 1.08 + laneJitter * 0.28;
      coordination[i3 + 1] = lane * 0.42 + laneWave * 0.18 + laneJitter * 0.12;
      coordination[i3 + 2] = (random01(index, phase + 8) - 0.5) * depth * 0.32;

      const quietX = (random01(index, phase + 9) - 0.5) * spreadX * 0.96;
      const quietJitter = random01(index, phase + 10) - 0.5;

      resolution[i3] = quietX;
      resolution[i3 + 1] = quietJitter * 0.42 + Math.sin(quietX * 0.72 + phase) * 0.055;
      resolution[i3 + 2] = (random01(index, phase + 11) - 0.5) * depth * 0.12;
    }

    return {
      chaos,
      coordination,
      resolution,
      working: chaos.slice(),
    };
  }, [count, depth, phase, spreadX, spreadY]);

  useFrame(({ clock, pointer }) => {
    const points = pointsRef.current;
    const geometry = geometryRef.current;
    const material = materialRef.current;
    if (!points || !geometry || !material) return;

    const pageProgress = reducedMotion ? 0.55 : clamp01(progress.get());
    const coordinationMix = smoothstep(0.05, 0.38, pageProgress);
    const resolutionMix = smoothstep(0.68, 0.96, pageProgress);
    const time = clock.elapsedTime;

    const chaosDrift = (1 - coordinationMix) * 0.085;
    const coordinatedDrift = coordinationMix * (1 - resolutionMix) * 0.034;
    const quietDrift = resolutionMix * 0.006;
    const drift = chaosDrift + coordinatedDrift + quietDrift;

    for (let index = 0; index < count; index += 1) {
      const i3 = index * 3;
      const seed = index * 0.117 + phase;

      const coordinatedX = mix(states.chaos[i3], states.coordination[i3], coordinationMix);
      const coordinatedY = mix(states.chaos[i3 + 1], states.coordination[i3 + 1], coordinationMix);
      const coordinatedZ = mix(states.chaos[i3 + 2], states.coordination[i3 + 2], coordinationMix);

      states.working[i3] =
        mix(coordinatedX, states.resolution[i3], resolutionMix) +
        Math.sin(time * speed + seed) * drift;
      states.working[i3 + 1] =
        mix(coordinatedY, states.resolution[i3 + 1], resolutionMix) +
        Math.cos(time * speed * 0.82 + seed * 1.31) * drift * 0.72;
      states.working[i3 + 2] = mix(coordinatedZ, states.resolution[i3 + 2], resolutionMix);
    }

    const positionAttribute = geometry.getAttribute("position") as THREE.BufferAttribute;
    positionAttribute.needsUpdate = true;

    const pointerWeight = reducedMotion ? 0 : (1 - resolutionMix) * 0.085;
    points.position.x = pointer.x * pointerWeight;
    points.position.y = pointer.y * pointerWeight * 0.55;
    points.rotation.z = Math.sin(time * speed * 0.34 + phase) * 0.005 * (1 - resolutionMix);

    material.opacity = opacity * mix(0.78, 1.12, coordinationMix) * mix(1, 0.24, resolutionMix);
    material.size = size * mix(1.08, 0.9, resolutionMix);
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[states.working, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color={color}
        size={size}
        sizeAttenuation={false}
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

function PixelField({ progress, reducedMotion }: LandingAtmosphereProps & { reducedMotion: boolean }) {
  return (
    <group>
      <PixelLayer
        progress={progress}
        reducedMotion={reducedMotion}
        count={620}
        spreadX={8.8}
        spreadY={5.4}
        depth={1.45}
        size={1.25}
        opacity={0.17}
        color="#5268ef"
        phase={0.7}
        speed={0.2}
      />
      <PixelLayer
        progress={progress}
        reducedMotion={reducedMotion}
        count={350}
        spreadX={7.2}
        spreadY={4.5}
        depth={1.1}
        size={1.8}
        opacity={0.105}
        color="#8475ef"
        phase={2.3}
        speed={0.15}
      />
      <PixelLayer
        progress={progress}
        reducedMotion={reducedMotion}
        count={150}
        spreadX={5.8}
        spreadY={3.8}
        depth={0.72}
        size={2.5}
        opacity={0.06}
        color="#354bd9"
        phase={4.1}
        speed={0.11}
      />
    </group>
  );
}

export function LandingAtmosphere({ progress }: LandingAtmosphereProps) {
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <div className="landing-atmosphere" aria-hidden="true">
      <div className="landing-atmosphere__sticky">
        <Canvas
          orthographic
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 10], zoom: 92 }}
          gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
          frameloop={reducedMotion ? "demand" : "always"}
        >
          <PixelField progress={progress} reducedMotion={reducedMotion} />
        </Canvas>
      </div>
    </div>
  );
}
