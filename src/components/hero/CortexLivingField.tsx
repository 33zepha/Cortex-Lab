import { useEffect, useRef } from "react";

type CortexLivingFieldProps = { className?: string };

type StoryState = {
  approach: number;
  braid: number;
  cohere: number;
};

const STORY = {
  approachStart: 8,
  braidStart: 18,
  cohereStart: 32,
  settledAt: 44,
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function storyState(elapsedSeconds: number, reducedMotion: boolean): StoryState {
  if (reducedMotion) return { approach: 1, braid: 0.84, cohere: 0.7 };
  return {
    approach: smoothstep(STORY.approachStart, STORY.braidStart, elapsedSeconds),
    braid: smoothstep(STORY.braidStart, STORY.cohereStart, elapsedSeconds),
    cohere: smoothstep(STORY.cohereStart, STORY.settledAt, elapsedSeconds),
  };
}

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_story;
uniform vec2 u_pointer;
uniform float u_mobile;

out vec4 outColor;

#define PI 3.141592653589793
#define TAU 6.283185307179586
#define STEPS 52

float saturate(float x) { return clamp(x, 0.0, 1.0); }

float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.55;
  for (int i = 0; i < 3; i++) {
    value += noise3(p) * amplitude;
    p = p * 2.03 + vec3(1.7, -2.1, 0.9);
    amplitude *= 0.47;
  }
  return value;
}

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

vec3 nucleusCenter(int id, float time) {
  vec3 c;
  float phase;
  if (id == 0) { c = vec3(0.68, 0.86, -0.10); phase = 0.3; }
  else if (id == 1) { c = vec3(-0.08, 0.02, 0.20); phase = 2.45; }
  else { c = vec3(0.72, -0.88, -0.02); phase = 4.7; }

  float drift = 0.035 * (1.0 - u_story.y * 0.7);
  c.x += sin(time * 0.19 + phase) * drift;
  c.y += cos(time * 0.155 + phase) * drift * 0.75;
  c.z += sin(time * 0.13 + phase * 0.8) * drift * 0.9;
  return c;
}

vec3 approachCenter(int id) {
  if (id == 0) return vec3(0.34, 0.56, -0.05);
  if (id == 1) return vec3(0.08, 0.0, 0.11);
  return vec3(0.36, -0.56, -0.01);
}

vec3 coreScale(int id) {
  if (id == 0) return vec3(0.46, 0.54, 0.38);
  if (id == 1) return vec3(0.42, 0.47, 0.42);
  return vec3(0.49, 0.52, 0.37);
}

vec3 coreTone(int id) {
  if (id == 0) return vec3(0.83, 0.88, 0.82);
  if (id == 1) return vec3(0.68, 0.79, 0.74);
  return vec3(0.76, 0.78, 0.84);
}

float livingCore(vec3 p, int id, float time, out float skin, out float inner) {
  float phase = id == 0 ? 0.3 : (id == 1 ? 2.45 : 4.7);
  vec3 c = mix(nucleusCenter(id, time), approachCenter(id), u_story.x);
  vec3 q = p - c;

  float angle = (id == 0 ? -0.18 : (id == 1 ? 0.11 : 0.19));
  q.xz = rot(angle) * q.xz;

  float breath = 1.0 + sin(time * (0.34 + float(id) * 0.026) + phase) * 0.035;
  vec3 scale = coreScale(id) * breath;

  float organic = fbm(q * 2.2 + vec3(phase, time * 0.035, -phase)) - 0.5;
  float wave = sin(q.y * 5.0 + phase + time * 0.23) * 0.022;
  vec3 warped = q;
  warped.x += organic * 0.10 + wave;
  warped.z += organic * 0.075 - wave * 0.6;

  float r = length(warped / scale);
  float membraneWidth = mix(0.105, 0.075, u_story.x);
  skin = exp(-pow((r - 0.86) / membraneWidth, 2.0));
  inner = exp(-r * r * 2.8) * (0.72 + 0.28 * sin((q.y + q.x * 0.45) * 11.0 + phase));

  float pulse = 0.86 + 0.14 * sin(time * 0.42 + phase + organic * 3.0);
  return (skin * 0.86 + inner * 0.16) * pulse;
}

vec3 braidAxis(float y) {
  return vec3(
    0.20 + sin(y * 1.38) * 0.055,
    y,
    sin(y * 1.02) * 0.045
  );
}

float braidStrand(vec3 p, int id, float time, out float skin, out float inner) {
  float phase = float(id) * (TAU / 3.0);
  float y = clamp(p.y, -1.55, 1.55);
  vec3 axis = braidAxis(y);

  float settle = mix(1.0, 0.58, u_story.z);
  float helixRadius = mix(0.34, 0.20, u_story.z) * settle + 0.08;
  float angle = y * 2.05 + phase + sin(y * 1.25) * 0.14;
  vec3 strandCenter = axis + vec3(cos(angle) * helixRadius, 0.0, sin(angle) * helixRadius * 0.76);

  float ends = smoothstep(1.68, 1.30, abs(y));
  float organic = fbm(vec3(p.x * 2.4, y * 1.45 + phase, p.z * 2.4 + time * 0.028)) - 0.5;
  float radius = mix(0.19, 0.23, u_story.z) * (1.0 + organic * 0.12);
  vec3 d = p - strandCenter;
  d.x += organic * 0.035;
  d.z -= organic * 0.028;

  float r = length(vec2(d.x, d.z)) / radius;
  skin = exp(-pow((r - 0.78) / 0.13, 2.0)) * ends;
  inner = exp(-r * r * 2.7) * ends;

  float travelling = 0.82 + 0.18 * sin(y * 4.1 - time * 0.37 + phase + organic * 2.0);
  return (skin * 0.76 + inner * 0.21) * travelling;
}

float unifiedBody(vec3 p, float time, out float skin, out float inner) {
  vec3 q = p - braidAxis(clamp(p.y, -1.45, 1.45));
  float ends = smoothstep(1.62, 1.25, abs(p.y));
  float organic = fbm(vec3(q.x * 2.6, p.y * 1.12 + time * 0.025, q.z * 2.6)) - 0.5;
  q.x += organic * 0.055;
  q.z -= organic * 0.043;

  float radius = 0.39 + 0.035 * sin(p.y * 2.1) + organic * 0.04;
  float r = length(vec2(q.x, q.z)) / radius;
  skin = exp(-pow((r - 0.9) / 0.105, 2.0)) * ends;

  float lamella = 0.5 + 0.5 * sin(p.y * 8.4 + q.x * 5.0 - time * 0.16 + organic * 3.0);
  inner = exp(-r * r * 2.15) * mix(0.34, 0.72, lamella) * ends;
  return skin * 0.82 + inner * 0.16;
}

vec4 sampleField(vec3 p, float time) {
  float density = 0.0;
  vec3 colour = vec3(0.0);
  float totalWeight = 0.0;
  float maxSkin = 0.0;

  for (int id = 0; id < 3; id++) {
    float cSkin;
    float cInner;
    float core = livingCore(p, id, time, cSkin, cInner);

    float bSkin;
    float bInner;
    float braid = braidStrand(p, id, time, bSkin, bInner);

    float localDensity = mix(core, braid, u_story.y);
    float w = max(localDensity, 0.0001);
    density += localDensity;
    colour += coreTone(id) * w;
    totalWeight += w;
    maxSkin = max(maxSkin, mix(cSkin, bSkin, u_story.y));
  }

  float uSkin;
  float uInner;
  float united = unifiedBody(p, time, uSkin, uInner);
  float unitedBlend = u_story.z;
  density = mix(density, max(density * 0.46, united * 1.18), unitedBlend);

  vec3 braidedTone = totalWeight > 0.0 ? colour / totalWeight : vec3(0.76, 0.82, 0.79);
  vec3 unitedTone = vec3(0.76, 0.84, 0.80);
  colour = mix(braidedTone, unitedTone, unitedBlend * 0.72);
  maxSkin = mix(maxSkin, uSkin, unitedBlend);

  return vec4(colour, density * (0.70 + maxSkin * 0.34));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag * 2.0 - u_resolution.xy) / u_resolution.y;
  float aspect = u_resolution.x / u_resolution.y;

  float desktopShift = smoothstep(1.12, 1.62, aspect);
  uv.x -= mix(0.03, 0.56, desktopShift);

  vec2 pointer = u_pointer * vec2(0.05, 0.035) * (1.0 - u_story.z * 0.55);
  uv += pointer;

  vec3 ro = vec3(0.0, 0.0, 3.7);
  vec3 rd = normalize(vec3(uv.x * 0.92, uv.y * 0.92, -2.25));

  float yaw = 0.11 + sin(u_time * 0.075) * 0.026 * (1.0 - u_story.z * 0.7);
  float pitch = -0.055 + cos(u_time * 0.061) * 0.018 * (1.0 - u_story.z * 0.7);
  rd.xz = rot(yaw) * rd.xz;
  rd.yz = rot(pitch) * rd.yz;

  vec3 accum = vec3(0.0);
  float alpha = 0.0;
  float t = 1.45;
  float stepSize = mix(0.092, 0.074, 1.0 - u_mobile);

  for (int i = 0; i < STEPS; i++) {
    if (alpha > 0.965) break;
    vec3 p = ro + rd * t;
    vec4 field = sampleField(p, u_time);

    float depthFade = smoothstep(4.8, 2.0, t);
    float d = field.a * depthFade;
    float absorption = 1.0 - exp(-d * stepSize * 4.15);

    if (absorption > 0.001) {
      float sideLight = 0.68 + 0.32 * saturate(0.5 + p.x * 0.32 - p.z * 0.12);
      float topLight = 0.74 + 0.26 * saturate(0.5 + p.y * 0.16);
      float optical = 0.82 + 0.18 * sin(p.y * 3.2 + p.z * 2.1 + u_time * 0.08);
      vec3 sampleColour = field.rgb * sideLight * topLight * optical;
      sampleColour += vec3(0.05, 0.075, 0.062) * d * 0.35;

      float contribution = (1.0 - alpha) * absorption;
      accum += sampleColour * contribution;
      alpha += contribution;
    }

    t += stepSize;
  }

  float vignette = 1.0 - smoothstep(0.68, 1.58, length(uv * vec2(0.72, 0.88)));
  accum *= mix(0.74, 1.0, vignette);

  float softPresence = alpha * 0.035;
  accum += vec3(0.12, 0.17, 0.145) * softPresence;
  accum = pow(accum, vec3(0.92));

  outColor = vec4(accum, alpha * 0.92);
}
`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create WebGL shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create WebGL program");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Unknown WebGL link error";
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

export function CortexLivingField({ className = "" }: CortexLivingFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return undefined;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
      premultipliedAlpha: true,
    });

    if (!gl) {
      host.dataset.webglFallback = "true";
      return undefined;
    }

    let program: WebGLProgram;
    try {
      program = createProgram(gl);
    } catch (error) {
      console.warn("[CortexLivingField] WebGL shader unavailable", error);
      host.dataset.webglFallback = "true";
      return undefined;
    }

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const storyLocation = gl.getUniformLocation(program, "u_story");
    const pointerLocation = gl.getUniformLocation(program, "u_pointer");
    const mobileLocation = gl.getUniformLocation(program, "u_mobile");

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    let cssWidth = 1;
    let cssHeight = 1;
    let renderWidth = 1;
    let renderHeight = 1;
    let frameHandle = 0;
    let visible = true;
    let pointerX = 0;
    let pointerY = 0;
    let smoothPointerX = 0;
    let smoothPointerY = 0;
    let lastFrame = 0;
    const startedAt = performance.now();
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = reducedMotionQuery.matches;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      cssWidth = Math.max(1, rect.width);
      cssHeight = Math.max(1, rect.height);
      const mobile = window.innerWidth < 760;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.15 : 1.45);
      const renderScale = mobile ? 0.72 : 0.86;
      renderWidth = Math.max(1, Math.round(cssWidth * dpr * renderScale));
      renderHeight = Math.max(1, Math.round(cssHeight * dpr * renderScale));
      if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
        canvas.width = renderWidth;
        canvas.height = renderHeight;
      }
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      gl.viewport(0, 0, renderWidth, renderHeight);
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

    const draw = (timestamp: number) => {
      frameHandle = window.requestAnimationFrame(draw);
      if (!visible) return;

      const mobile = window.innerWidth < 760;
      const minInterval = mobile ? 1000 / 34 : 1000 / 55;
      if (timestamp - lastFrame < minInterval) return;
      lastFrame = timestamp;

      smoothPointerX += (pointerX - smoothPointerX) * 0.025;
      smoothPointerY += (pointerY - smoothPointerY) * 0.025;

      const elapsed = reducedMotion ? STORY.settledAt : Math.max(0, (timestamp - startedAt) * 0.001);
      const state = storyState(elapsed, reducedMotion);
      const time = reducedMotion ? 18 : timestamp * 0.001;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(resolutionLocation, renderWidth, renderHeight);
      gl.uniform1f(timeLocation, time);
      gl.uniform3f(storyLocation, state.approach, state.braid, state.cohere);
      gl.uniform2f(pointerLocation, smoothPointerX, -smoothPointerY);
      gl.uniform1f(mobileLocation, mobile ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    frameHandle = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frameHandle);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      reducedMotionQuery.removeEventListener("change", onReducedMotionChange);
      if (buffer) gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`relative h-full w-full overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-[16%] rounded-full bg-[radial-gradient(circle,rgba(113,132,122,0.075),rgba(31,37,34,0.025)_42%,transparent_72%)] blur-3xl [div[data-webgl-fallback=true]_&]:opacity-100 opacity-40" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
