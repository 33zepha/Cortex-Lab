import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";

type LayerProps = {
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

function random01(index: number, seed: number) {
  const value = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function PixelLayer({
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
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const result = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      const angle = random01(index, phase + 1) * Math.PI * 2;
      const radius = Math.pow(random01(index, phase + 2), 0.72);
      const ellipticalBias = 0.72 + random01(index, phase + 3) * 0.48;

      result[index * 3] = Math.cos(angle) * spreadX * radius * ellipticalBias;
      result[index * 3 + 1] = Math.sin(angle) * spreadY * radius;
      result[index * 3 + 2] = (random01(index, phase + 4) - 0.5) * depth;
    }

    return result;
  }, [count, depth, phase, spreadX, spreadY]);

  useFrame(({ clock, pointer }) => {
    const points = ref.current;
    if (!points) return;

    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
    const controlFocus = Math.exp(-Math.pow((progress - 0.42) / 0.13, 2));
    const capabilityFocus = Math.exp(-Math.pow((progress - 0.66) / 0.18, 2));
    const time = clock.elapsedTime;

    points.rotation.z = Math.sin(time * speed + phase) * 0.025 + pointer.x * 0.018;
    points.position.x =
      Math.sin(progress * Math.PI * 1.8 + phase) * (0.46 - controlFocus * 0.2) +
      pointer.x * 0.12;
    points.position.y =
      Math.cos(progress * Math.PI * 1.35 + phase) * 0.3 -
      progress * 0.4 +
      pointer.y * 0.08;

    const scale = 1 - controlFocus * 0.24 + capabilityFocus * 0.08;
    points.scale.setScalar(scale);
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
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

function PixelField() {
  return (
    <group>
      <PixelLayer
        count={760}
        spreadX={8.6}
        spreadY={5.2}
        depth={1.5}
        size={1.3}
        opacity={0.16}
        color="#5268ef"
        phase={0.7}
        speed={0.18}
      />
      <PixelLayer
        count={430}
        spreadX={6.8}
        spreadY={4.2}
        depth={1.2}
        size={1.9}
        opacity={0.1}
        color="#8777f1"
        phase={2.3}
        speed={0.13}
      />
      <PixelLayer
        count={220}
        spreadX={5.2}
        spreadY={3.4}
        depth={0.8}
        size={2.6}
        opacity={0.055}
        color="#354bd9"
        phase={4.1}
        speed={0.09}
      />
    </group>
  );
}

export function LandingAtmosphere() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="landing-atmosphere" aria-hidden="true">
      <Canvas
        orthographic
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 10], zoom: 92 }}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        frameloop={reducedMotion ? "demand" : "always"}
      >
        <PixelField />
      </Canvas>
    </div>
  );
}
