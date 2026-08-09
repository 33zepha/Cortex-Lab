import { useEffect, useRef } from 'react';
import './LetterGlitch.css';

const LetterGlitch = ({
  glitchColors = ['#26342f', '#536c62', '#8fa69b'],
  className = '',
  glitchSpeed = 50,
  centerVignette = false,
  outerVignette = true,
  smooth = true,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789'
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const letters = useRef([]);
  const grid = useRef({ columns: 0, rows: 0 });
  const context = useRef(null);
  const lastGlitchTime = useRef(Date.now());
  const metrics = useRef({ fontSize: 12, charWidth: 8, charHeight: 17 });
  const dimensions = useRef({ width: 1, height: 1 });

  const lettersAndSymbols = Array.from(characters);
  const getRandomChar = () => lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)];
  const getRandomColor = () => glitchColors[Math.floor(Math.random() * glitchColors.length)];

  const parseColor = color => {
    const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(color);
    if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
    const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const normalized = color.replace(short, (_m, r, g, b) => `${r}${r}${g}${g}${b}${b}`);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
  };

  const interpolateColor = (start, end, factor) =>
    `rgb(${Math.round(start.r + (end.r - start.r) * factor)}, ${Math.round(start.g + (end.g - start.g) * factor)}, ${Math.round(start.b + (end.b - start.b) * factor)})`;

  const smoothstep = value => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };

  // Sparse computational field: quiet editorial space on the left, increasing
  // information density toward a controlled processing region on the right.
  const activityAt = (x, y) => {
    const nx = x / Math.max(1, dimensions.current.width);
    const ny = y / Math.max(1, dimensions.current.height);
    const enter = smoothstep((nx - 0.2) / 0.5);
    const processor = Math.exp(-(((nx - 0.79) / 0.27) ** 2 + ((ny - 0.51) / 0.38) ** 2));
    const upper = Math.exp(-(((nx - 0.72) / 0.2) ** 2 + ((ny - 0.25) / 0.18) ** 2));
    const lower = Math.exp(-(((nx - 0.86) / 0.19) ** 2 + ((ny - 0.78) / 0.17) ** 2));
    return Math.max(0.025, Math.min(1, enter * (0.2 + processor * 0.66 + upper * 0.18 + lower * 0.16)));
  };

  // High-tech without sci-fi iconography: transient alignment is expressed as
  // timing, addressing and ordered lanes rather than glowing circuits or HUDs.
  const protocolAt = (column, row, time) => {
    const { columns, rows } = grid.current;
    if (!columns || !rows) return { influence: 0, char: '', alpha: 0 };
    const nx = column / columns;
    const ny = row / rows;
    const compact = dimensions.current.width < 760;

    // A slow scan window travels through the active field. It is intentionally
    // broad and faint: more oscilloscope / compute fabric than laser scanner.
    const scan = (time * 0.026) % 1;
    const scanY = 0.18 + scan * 0.66;
    const scanBand = Math.exp(-(((ny - scanY) / 0.018) ** 2));
    const scanMask = smoothstep((nx - (compact ? 0.43 : 0.57)) / 0.16) * (1 - smoothstep((nx - 0.97) / 0.04));

    // Deterministic address lanes wake in sequence. They never form a literal
    // interface; they simply make the random field behave like a system.
    const lanePhase = Math.floor(time / 2.8) % 4;
    const laneRows = compact
      ? [Math.floor(rows * 0.34), Math.floor(rows * 0.48), Math.floor(rows * 0.62), Math.floor(rows * 0.76)]
      : [Math.floor(rows * 0.28), Math.floor(rows * 0.42), Math.floor(rows * 0.56), Math.floor(rows * 0.7)];
    const laneDistance = Math.abs(row - laneRows[lanePhase]);
    const lane = laneDistance === 0 && nx > (compact ? 0.5 : 0.62) && nx < 0.94 ? 1 : 0;

    // Short vertical registration marks establish precision without drawing a
    // box, grid, circuit, crosshair or any other familiar futurist trope.
    const registerColumn = Math.floor(columns * (compact ? 0.78 : 0.81));
    const register = Math.abs(column - registerColumn) === 0 && row % 7 <= 1 && ny > 0.2 && ny < 0.82 ? 1 : 0;

    // Every few seconds a tiny packet resolves into a stable 6-cell sequence,
    // then disappears. This gives the impression of computation completing.
    const packetCycle = (time % 9.6) / 9.6;
    const packetEnvelope = smoothstep((packetCycle - 0.2) / 0.1) * (1 - smoothstep((packetCycle - 0.7) / 0.12));
    const packetRow = Math.floor(rows * (compact ? 0.56 : 0.51));
    const packetStart = Math.floor(columns * (compact ? 0.63 : 0.72));
    const packetIndex = column - packetStart;
    const packet = row === packetRow && packetIndex >= 0 && packetIndex < 6 ? packetEnvelope : 0;
    const packetChars = ['C', '0', 'R', 'T', 'E', 'X'];

    const scanInfluence = scanBand * scanMask * 0.2;
    const laneInfluence = lane * 0.38;
    const registerInfluence = register * 0.22;
    const packetInfluence = packet * 0.62;
    const influence = Math.min(1, scanInfluence + laneInfluence + registerInfluence + packetInfluence);

    let char = '';
    if (packetInfluence > 0.1) char = packetChars[packetIndex];
    else if (laneInfluence > 0) char = column % 9 === 0 ? ':' : column % 4 === 0 ? '·' : '─';
    else if (registerInfluence > 0) char = row % 7 === 0 ? '┆' : '·';

    return { influence, char, alpha: influence };
  };

  const calculateGrid = (width, height) => ({
    columns: Math.ceil(width / metrics.current.charWidth),
    rows: Math.ceil(height / metrics.current.charHeight)
  });

  const initializeLetters = (columns, rows) => {
    grid.current = { columns, rows };
    letters.current = Array.from({ length: columns * rows }, (_, index) => {
      const color = getRandomColor();
      const column = index % columns;
      const row = Math.floor(index / columns);
      return {
        char: getRandomChar(),
        color,
        sourceColor: color,
        targetColor: color,
        colorProgress: 1,
        activity: activityAt(column * metrics.current.charWidth, row * metrics.current.charHeight),
        phase: Math.random() * Math.PI * 2,
        opacity: 0.16 + Math.random() * 0.4
      };
    });
  };

  const drawLetters = timestamp => {
    if (!context.current || !canvasRef.current || letters.current.length === 0) return;
    const ctx = context.current;
    const { width, height } = canvasRef.current.getBoundingClientRect();
    const { fontSize, charWidth, charHeight } = metrics.current;
    const time = (timestamp || performance.now()) * 0.001;
    ctx.clearRect(0, 0, width, height);
    ctx.font = `500 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    ctx.textBaseline = 'top';

    letters.current.forEach((letter, index) => {
      const column = index % grid.current.columns;
      const row = Math.floor(index / grid.current.columns);
      const x = column * charWidth;
      const y = row * charHeight;
      const breath = 0.96 + Math.sin(time * 0.21 + letter.phase) * 0.04;
      const protocol = protocolAt(column, row, time);
      const ambient = letter.opacity * letter.activity * breath;
      const alpha = Math.min(0.84, ambient + protocol.alpha);
      if (alpha < 0.022) return;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = protocol.influence > 0.16 ? '#a8bbb1' : letter.color;
      ctx.fillText(protocol.char || letter.char, x, y);
    });
    ctx.globalAlpha = 1;
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    const compact = rect.width < 760;
    metrics.current = compact
      ? { fontSize: 10.5, charWidth: 7, charHeight: 15 }
      : { fontSize: 12, charWidth: 7.8, charHeight: 16.5 };
    dimensions.current = { width: rect.width, height: rect.height };
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    if (context.current) context.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    const nextGrid = calculateGrid(rect.width, rect.height);
    initializeLetters(nextGrid.columns, nextGrid.rows);
    drawLetters();
  };

  const updateLetters = () => {
    if (!letters.current.length) return;
    const updateCount = Math.max(1, Math.floor(letters.current.length * 0.01));
    let attempts = 0;
    let updated = 0;
    while (updated < updateCount && attempts < updateCount * 14) {
      attempts += 1;
      const index = Math.floor(Math.random() * letters.current.length);
      const letter = letters.current[index];
      if (!letter || Math.random() > letter.activity * 0.86 + 0.025) continue;
      letter.char = getRandomChar();
      letter.sourceColor = letter.color;
      letter.targetColor = getRandomColor();
      letter.opacity = 0.14 + Math.random() * 0.44;
      if (!smooth) {
        letter.color = letter.targetColor;
        letter.colorProgress = 1;
      } else letter.colorProgress = 0;
      updated += 1;
    }
  };

  const handleSmoothTransitions = () => {
    let needsRedraw = false;
    letters.current.forEach(letter => {
      if (letter.colorProgress >= 1) return;
      letter.colorProgress = Math.min(1, letter.colorProgress + 0.024);
      const start = parseColor(letter.sourceColor);
      const end = parseColor(letter.targetColor);
      if (start && end) {
        letter.color = interpolateColor(start, end, letter.colorProgress);
        needsRedraw = true;
      }
    });
    return needsRedraw;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    context.current = canvas.getContext('2d', { alpha: true });
    resizeCanvas();
    let resizeTimeout;
    let running = true;
    let visible = true;
    let lastAmbientDraw = 0;

    const animate = timestamp => {
      if (!running) return;
      if (visible) {
        const now = Date.now();
        let changed = false;
        if (now - lastGlitchTime.current >= glitchSpeed) {
          updateLetters();
          lastGlitchTime.current = now;
          changed = true;
        }
        if (smooth && handleSmoothTransitions()) changed = true;
        if (changed || timestamp - lastAmbientDraw > 62) {
          drawLetters(timestamp);
          lastAmbientDraw = timestamp;
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resizeCanvas, 100);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
    const intersectionObserver = new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? true;
    }, { threshold: 0.02 });
    intersectionObserver.observe(canvas);
    animate(performance.now());

    return () => {
      running = false;
      clearTimeout(resizeTimeout);
      cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [characters, glitchColors, glitchSpeed, smooth]);

  return (
    <div className={`letter-glitch ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="letter-glitch__canvas" />
      <div className="letter-glitch__depth" />
      {outerVignette && <div className="letter-glitch__outer-vignette" />}
      {centerVignette && <div className="letter-glitch__center-vignette" />}
    </div>
  );
};

export default LetterGlitch;
