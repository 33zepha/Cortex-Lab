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

  const activityAt = (x, y) => {
    const nx = x / Math.max(1, dimensions.current.width);
    const ny = y / Math.max(1, dimensions.current.height);
    const enter = smoothstep((nx - 0.13) / 0.56);
    const processor = Math.exp(-(((nx - 0.76) / 0.31) ** 2 + ((ny - 0.51) / 0.42) ** 2));
    const upper = Math.exp(-(((nx - 0.66) / 0.24) ** 2 + ((ny - 0.22) / 0.2) ** 2));
    const lower = Math.exp(-(((nx - 0.88) / 0.2) ** 2 + ((ny - 0.8) / 0.19) ** 2));
    return Math.max(0.03, Math.min(1, enter * (0.19 + processor * 0.7 + upper * 0.15 + lower * 0.14)));
  };

  // CORTEX is not overlaid as UI. Six existing cells gradually settle into the
  // word, each on its own timing, hold briefly, then lose coherence one-by-one.
  const cortexAt = (column, row, time) => {
    const { columns, rows } = grid.current;
    if (!columns || !rows) return { influence: 0, char: '' };

    const compact = dimensions.current.width < 760;
    const word = ['C', 'O', 'R', 'T', 'E', 'X'];
    const wordRow = Math.floor(rows * (compact ? 0.58 : 0.51));
    const startColumn = Math.floor(columns * (compact ? 0.57 : 0.7));
    const index = column - startColumn;
    if (row !== wordRow || index < 0 || index >= word.length) return { influence: 0, char: '' };

    const cycle = (time % 15.5) / 15.5;
    const stagger = index * 0.018;
    const rise = smoothstep((cycle - (0.2 + stagger)) / 0.095);
    const fall = 1 - smoothstep((cycle - (0.7 + stagger * 0.38)) / 0.13);
    const envelope = Math.max(0, rise * fall);

    return {
      influence: envelope * (0.62 + index * 0.025),
      char: word[index]
    };
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
      const breath = 0.96 + Math.sin(time * 0.2 + letter.phase) * 0.04;
      const cortex = cortexAt(column, row, time);
      const ambient = letter.opacity * letter.activity * breath;
      const alpha = Math.min(0.86, ambient + cortex.influence * 0.72);
      if (alpha < 0.022) return;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = cortex.influence > 0.08 ? '#afc0b7' : letter.color;
      ctx.fillText(cortex.influence > 0.16 ? cortex.char : letter.char, x, y);
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
      } else {
        letter.colorProgress = 0;
      }
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
