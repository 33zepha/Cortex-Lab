import { useEffect, useRef } from 'react';
import './LetterGlitch.css';

const LetterGlitch = ({
  glitchColors = ['#2b4539', '#61dca3', '#61b3dc'],
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
  const metrics = useRef({ fontSize: 13, charWidth: 8, charHeight: 17 });
  const dimensions = useRef({ width: 1, height: 1 });

  const lettersAndSymbols = Array.from(characters);

  const getRandomChar = () =>
    lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)];

  const getRandomColor = () =>
    glitchColors[Math.floor(Math.random() * glitchColors.length)];

  const parseColor = color => {
    const rgbMatch = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(color);
    if (rgbMatch) {
      return {
        r: Number(rgbMatch[1]),
        g: Number(rgbMatch[2]),
        b: Number(rgbMatch[3])
      };
    }

    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const normalized = color.replace(shorthandRegex, (_match, r, g, b) => `${r}${r}${g}${g}${b}${b}`);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);

    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  };

  const interpolateColor = (start, end, factor) => {
    const result = {
      r: Math.round(start.r + (end.r - start.r) * factor),
      g: Math.round(start.g + (end.g - start.g) * factor),
      b: Math.round(start.b + (end.b - start.b) * factor)
    };
    return `rgb(${result.r}, ${result.g}, ${result.b})`;
  };

  const smoothstep = value => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };

  // Cortex art direction: the field is deliberately quiet on the left and
  // gathers into several overlapping zones of activity on the right.
  const activityAt = (x, y) => {
    const nx = x / Math.max(1, dimensions.current.width);
    const ny = y / Math.max(1, dimensions.current.height);

    const calmLeft = smoothstep((nx - 0.22) / 0.5);
    const basinA = Math.exp(-(((nx - 0.77) / 0.2) ** 2 + ((ny - 0.34) / 0.26) ** 2));
    const basinB = Math.exp(-(((nx - 0.7) / 0.28) ** 2 + ((ny - 0.72) / 0.24) ** 2));
    const basinC = Math.exp(-(((nx - 0.92) / 0.16) ** 2 + ((ny - 0.53) / 0.36) ** 2));
    const structure = Math.min(1, basinA * 0.74 + basinB * 0.58 + basinC * 0.52);

    return Math.max(0.035, Math.min(1, calmLeft * (0.26 + structure * 0.92)));
  };

  const calculateGrid = (width, height) => ({
    columns: Math.ceil(width / metrics.current.charWidth),
    rows: Math.ceil(height / metrics.current.charHeight)
  });

  const initializeLetters = (columns, rows) => {
    grid.current = { columns, rows };
    const { charWidth, charHeight } = metrics.current;

    letters.current = Array.from({ length: columns * rows }, (_, index) => {
      const color = getRandomColor();
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = column * charWidth;
      const y = row * charHeight;
      const activity = activityAt(x, y);

      return {
        char: getRandomChar(),
        color,
        sourceColor: color,
        targetColor: color,
        colorProgress: 1,
        activity,
        phase: Math.random() * Math.PI * 2,
        opacity: 0.22 + Math.random() * 0.42
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
      const x = (index % grid.current.columns) * charWidth;
      const y = Math.floor(index / grid.current.columns) * charHeight;
      const breath = 0.93 + Math.sin(time * 0.32 + letter.phase) * 0.07;
      const alpha = letter.opacity * letter.activity * breath;
      if (alpha < 0.025) return;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = letter.color;
      ctx.fillText(letter.char, x, y);
    });

    ctx.globalAlpha = 1;
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = parent.getBoundingClientRect();
    const compact = rect.width < 760;
    metrics.current = compact
      ? { fontSize: 12, charWidth: 7.5, charHeight: 16 }
      : { fontSize: 13, charWidth: 8.25, charHeight: 17.5 };
    dimensions.current = { width: rect.width, height: rect.height };

    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    if (context.current) {
      context.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const { columns, rows } = calculateGrid(rect.width, rect.height);
    initializeLetters(columns, rows);
    drawLetters();
  };

  const updateLetters = () => {
    if (letters.current.length === 0) return;

    // Update fewer cells than stock React Bits and heavily bias those updates
    // toward the active basins. This creates local movement instead of TV static.
    const updateCount = Math.max(1, Math.floor(letters.current.length * 0.017));
    let attempts = 0;
    let updated = 0;

    while (updated < updateCount && attempts < updateCount * 10) {
      attempts += 1;
      const index = Math.floor(Math.random() * letters.current.length);
      const letter = letters.current[index];
      if (!letter || Math.random() > letter.activity * 0.92 + 0.04) continue;

      letter.char = getRandomChar();
      letter.sourceColor = letter.color;
      letter.targetColor = getRandomColor();
      letter.opacity = 0.18 + Math.random() * 0.52;

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

      letter.colorProgress = Math.min(1, letter.colorProgress + 0.032);
      const startRgb = parseColor(letter.sourceColor);
      const endRgb = parseColor(letter.targetColor);

      if (startRgb && endRgb) {
        letter.color = interpolateColor(startRgb, endRgb, letter.colorProgress);
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

        // A very slow redraw keeps the field breathing even between glitches.
        if (changed || timestamp - lastAmbientDraw > 110) {
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
