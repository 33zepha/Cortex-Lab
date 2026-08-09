import { useEffect, useRef } from 'react';
import './LetterGlitch.css';

const SYSTEM_FRAGMENTS = [
  'AGENT:03',
  'CTX 84%',
  'RUN_018',
  'MEM:READY',
  'MODEL/02',
  'TRACE:A17',
  'ROUTE:7F2',
  'CACHE:HIT',
  'TASK:02',
  'SYNC:OK'
];

const CLUSTER_FRAGMENTS = ['<>', '[]', '/02', 'A17', '++', '0x7', '::', 'R2'];
const CORTEX_CHARACTERS = ['C', 'O', 'R', 'T', 'E', 'X'];

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
  const metrics = useRef({ fontSize: 12, charWidth: 7.8, charHeight: 16.5 });
  const cortexEvent = useRef({ row: 0, column: 0, startedAt: -99, duration: 0, nextAt: 1.8 });
  const informationEvents = useRef({
    system: [],
    clusters: [],
    nextSystemAt: 2.4,
    nextClusterAt: 1.8,
    lastPosition: null
  });
  const pointer = useRef({ x: -1000, y: -1000, movedAt: -99 });
  const reducedMotion = useRef(false);

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

  const randomBetween = (min, max) => min + Math.random() * (max - min);

  const pickEventPosition = (length, previousPosition = null) => {
    const { columns, rows } = grid.current;
    const marginX = Math.min(6, Math.max(3, Math.floor(columns * 0.035)));
    const marginY = Math.min(6, Math.max(3, Math.floor(rows * 0.05)));
    const maxColumn = Math.max(marginX, columns - marginX - length);
    const maxRow = Math.max(marginY, rows - marginY - 1);
    const minDistance = Math.max(8, Math.floor(columns * 0.16));

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const position = {
        column: marginX + Math.floor(Math.random() * Math.max(1, maxColumn - marginX + 1)),
        row: marginY + Math.floor(Math.random() * Math.max(1, maxRow - marginY + 1))
      };

      if (
        !previousPosition ||
        Math.abs(position.column - previousPosition.column) > minDistance ||
        Math.abs(position.row - previousPosition.row) > Math.max(5, Math.floor(rows * 0.16))
      ) {
        return position;
      }
    }

    return {
      column: marginX,
      row: Math.min(maxRow, Math.max(marginY, Math.floor(rows * 0.5)))
    };
  };

  const activityAt = (column, row) => {
    const { columns, rows } = grid.current;
    if (!columns || !rows) return 0.55;
    const nx = column / columns;
    const ny = row / rows;

    // Broad, imperfect pools keep the entire viewport alive. The modulation is
    // intentionally low contrast: it should read as load distribution, never
    // as a visible grid, scan or decorative wave.
    const poolA = Math.exp(-(((nx - 0.2) / 0.42) ** 2 + ((ny - 0.28) / 0.48) ** 2));
    const poolB = Math.exp(-(((nx - 0.76) / 0.48) ** 2 + ((ny - 0.62) / 0.52) ** 2));
    const poolC = Math.exp(-(((nx - 0.48) / 0.58) ** 2 + ((ny - 0.9) / 0.22) ** 2));
    const lowFrequencyVariation =
      Math.sin(nx * 6.1 + Math.sin(ny * 3.3) * 1.4) * 0.045 +
      Math.cos(ny * 5.4 + Math.sin(nx * 2.7) * 1.2) * 0.04;
    return Math.max(0.27, Math.min(0.9, 0.4 + poolA * 0.13 + poolB * 0.18 + poolC * 0.08 + lowFrequencyVariation));
  };

  const scheduleCortexEvent = time => {
    const event = cortexEvent.current;
    if (time < event.nextAt) return;
    const { columns, rows } = grid.current;
    if (!columns || !rows) return;

    const position = pickEventPosition(CORTEX_CHARACTERS.length, {
      column: event.column,
      row: event.row
    });
    event.column = position.column;
    event.row = position.row;
    event.startedAt = time;
    event.duration = 5.8 + Math.random() * 3.2;
    event.nextAt = time + event.duration + 4.2 + Math.random() * 8.4;
  };

  const cortexAt = (column, row, time) => {
    const event = cortexEvent.current;
    const index = column - event.column;
    if (row !== event.row || index < 0 || index > 5) return null;

    const elapsed = time - event.startedAt;
    if (elapsed < 0 || elapsed > event.duration) return null;

    const enterDelay = index * 0.16 + Math.sin(index * 1.63) * 0.035;
    const exitDelay = (5 - index) * 0.12 + Math.cos(index * 1.21) * 0.03;
    const reveal = smoothstep((elapsed - enterDelay) / 0.76);
    const fadeStart = event.duration - 1.65 + exitDelay;
    const fade = 1 - smoothstep((elapsed - fadeStart) / 0.9);
    const stability = Math.max(0, reveal * fade);
    if (stability < 0.02) return null;

    const chars = CORTEX_CHARACTERS;
    const settled = stability > 0.52 || Math.sin(time * 16 + index * 2.2) > 0.25;
    return {
      char: settled ? chars[index] : getRandomChar(),
      alpha: 0.2 + stability * 0.78
    };
  };

  const resetInformationEvents = time => {
    informationEvents.current = {
      system: [],
      clusters: [],
      nextSystemAt: time + randomBetween(2.2, 4.4),
      nextClusterAt: time + randomBetween(1.4, 3.2),
      lastPosition: null
    };
  };

  const scheduleInformationEvents = time => {
    if (reducedMotion.current) return;

    const state = informationEvents.current;
    state.system = state.system.filter(event => time < event.startedAt + event.duration);
    state.clusters = state.clusters.filter(event => time < event.startedAt + event.duration);

    if (time >= state.nextClusterAt && state.clusters.length < 2) {
      const text = CLUSTER_FRAGMENTS[Math.floor(Math.random() * CLUSTER_FRAGMENTS.length)];
      const position = pickEventPosition(text.length, state.lastPosition);
      state.clusters.push({
        text,
        column: position.column,
        row: position.row,
        startedAt: time,
        duration: randomBetween(1.8, 3.4),
        kind: 'cluster'
      });
      state.lastPosition = position;
      state.nextClusterAt = time + randomBetween(3.6, 7.8);
    }

    if (time >= state.nextSystemAt && state.system.length < 2) {
      const text = SYSTEM_FRAGMENTS[Math.floor(Math.random() * SYSTEM_FRAGMENTS.length)];
      const position = pickEventPosition(text.length, state.lastPosition);
      state.system.push({
        text,
        column: position.column,
        row: position.row,
        startedAt: time,
        duration: randomBetween(2.2, 4.2),
        kind: 'system'
      });
      state.lastPosition = position;
      state.nextSystemAt = time + randomBetween(4.6, 9.4);
    }
  };

  const drawTransientEvent = (ctx, event, time, charWidth, charHeight) => {
    const elapsed = time - event.startedAt;
    const entrance = smoothstep(elapsed / 0.34);
    const exit = 1 - smoothstep((elapsed - (event.duration - 0.76)) / 0.76);
    const envelope = Math.max(0, entrance * exit);
    if (envelope < 0.01) return;

    const resolved = smoothstep((elapsed - 0.42) / 0.48);
    const eventAlpha = event.kind === 'system' ? 0.5 : 0.28;
    const text = Array.from(event.text);

    text.forEach((character, index) => {
      const reveal = smoothstep((elapsed - index * 0.045) / 0.24);
      if (reveal < 0.01) return;

      const legible = resolved > 0.45 && Math.sin(time * 8.2 + index * 3.7 + event.row) > -0.2;
      ctx.globalAlpha = Math.min(0.76, eventAlpha * envelope * reveal);
      ctx.fillStyle = event.kind === 'system' ? '#a5b7ad' : '#72877b';
      ctx.fillText(legible ? character : getRandomChar(), (event.column + index) * charWidth, event.row * charHeight);
    });
  };

  const initializeLetters = (columns, rows) => {
    grid.current = { columns, rows };
    const now = performance.now() * 0.001;
    resetInformationEvents(now);
    letters.current = Array.from({ length: columns * rows }, (_, index) => {
      const color = getRandomColor();
      const column = index % columns;
      const row = Math.floor(index / columns);
      const stable = Math.random() < 0.075;
      return {
        char: getRandomChar(),
        color,
        sourceColor: color,
        targetColor: color,
        colorProgress: 1,
        activity: activityAt(column, row),
        phase: Math.random() * Math.PI * 2,
        opacity: 0.12 + Math.random() * 0.35,
        cadence: 0.7 + Math.random() * 1.3,
        signalUntil: stable ? now + randomBetween(2.4, 5.2) : 0,
        stableUntil: stable ? now + randomBetween(3.2, 7.2) : 0
      };
    });
  };

  const drawLetters = timestamp => {
    if (!context.current || !canvasRef.current || letters.current.length === 0) return;
    const ctx = context.current;
    const { width, height } = canvasRef.current.getBoundingClientRect();
    const { fontSize, charWidth, charHeight } = metrics.current;
    const time = (timestamp || performance.now()) * 0.001;
    const pointerAge = Math.max(0, time - pointer.current.movedAt);
    const pointerFade = 1 - smoothstep(pointerAge / 2.8);
    scheduleInformationEvents(time);
    scheduleCortexEvent(time);

    ctx.clearRect(0, 0, width, height);
    ctx.font = `500 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    ctx.textBaseline = 'top';

    letters.current.forEach((letter, index) => {
      const column = index % grid.current.columns;
      const row = Math.floor(index / grid.current.columns);
      const x = column * charWidth;
      const y = row * charHeight;
      const breath = 0.95 + Math.sin(time * (0.15 + letter.cadence * 0.035) + letter.phase) * 0.05;
      const rowPulse = 0.94 + Math.sin(time * 0.27 + row * 0.43) * 0.06;
      const current =
        Math.sin(column * 0.075 + row * 0.11 - time * 0.19 + letter.phase * 0.18) * 0.5 +
        Math.sin(column * 0.021 - row * 0.064 + time * 0.11) * 0.5;
      const currentLift = 0.9 + current * 0.11;
      let pointerFocus = 0;
      if (pointerFade > 0.001) {
        const dx = (x - pointer.current.x) / 150;
        const dy = (y - pointer.current.y) / 110;
        pointerFocus = Math.exp(-(dx * dx + dy * dy)) * pointerFade;
      }
      const cortex = cortexAt(column, row, time);
      const stable = letter.stableUntil > time;
      const active = letter.signalUntil > time;
      const signalLift = stable ? 0.1 : active ? 0.045 : 0;
      const focusLift = pointerFocus * 0.025;
      const ambientAlpha =
        letter.opacity * letter.activity * breath * rowPulse * currentLift + signalLift + focusLift;
      const alpha = cortex ? Math.max(ambientAlpha, cortex.alpha) : ambientAlpha;
      if (alpha < 0.024) return;

      ctx.globalAlpha = Math.min(0.96, alpha);
      ctx.fillStyle = cortex ? '#c1cec6' : stable ? '#9aada2' : letter.color;
      ctx.fillText(cortex?.char || letter.char, x, y);
    });

    informationEvents.current.clusters.forEach(event => {
      drawTransientEvent(ctx, event, time, charWidth, charHeight);
    });
    informationEvents.current.system.forEach(event => {
      drawTransientEvent(ctx, event, time, charWidth, charHeight);
    });

    ctx.globalAlpha = 1;
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const compact = rect.width < 760;
    const dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2);
    metrics.current = compact
      ? { fontSize: 10.2, charWidth: 6.8, charHeight: 14.6 }
      : { fontSize: 11.5, charWidth: 7.45, charHeight: 15.7 };

    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    if (context.current) context.current.setTransform(dpr, 0, 0, dpr, 0, 0);

    const columns = Math.ceil(rect.width / metrics.current.charWidth);
    const rows = Math.ceil(rect.height / metrics.current.charHeight);
    initializeLetters(columns, rows);
    const now = performance.now() * 0.001;
    if (reducedMotion.current) {
      const compactField = rect.width < 760;
      cortexEvent.current = {
        column: compactField ? Math.max(5, Math.floor(columns * 0.56)) : Math.max(5, Math.floor(columns * 0.72)),
        row: compactField ? Math.max(5, Math.floor(rows * 0.28)) : Math.max(5, Math.floor(rows * 0.46)),
        startedAt: now - 1.8,
        duration: 100000,
        nextAt: Number.POSITIVE_INFINITY
      };
    } else {
      cortexEvent.current.nextAt = now + 2.8 + Math.random() * 2.2;
    }
    drawLetters(performance.now());
  };

  const updateLetters = time => {
    if (!letters.current.length) return;
    const updateRatio = metrics.current.charWidth < 7 ? 0.009 : 0.012;
    const updateCount = Math.max(2, Math.floor(letters.current.length * updateRatio));
    for (let i = 0; i < updateCount; i += 1) {
      const index = Math.floor(Math.random() * letters.current.length);
      const letter = letters.current[index];
      if (!letter) continue;
      const column = index % grid.current.columns;
      const row = Math.floor(index / grid.current.columns);
      const x = column * metrics.current.charWidth;
      const y = row * metrics.current.charHeight;
      const pointerAge = Math.max(0, time - pointer.current.movedAt);
      const pointerFade = 1 - smoothstep(pointerAge / 2.8);
      const pointerFocus =
        pointerFade > 0.001
          ? Math.exp(-(((x - pointer.current.x) / 170) ** 2 + ((y - pointer.current.y) / 125) ** 2)) * pointerFade
          : 0;

      if (letter.stableUntil > time && Math.random() > 0.06 + pointerFocus * 0.14) continue;
      if (Math.random() > 0.42 + letter.activity * 0.48 + pointerFocus * 0.08) continue;

      letter.char = getRandomChar();
      letter.sourceColor = letter.color;
      letter.targetColor = getRandomColor();
      letter.opacity = 0.11 + Math.random() * 0.38;
      letter.signalUntil = Math.random() < 0.18 ? time + randomBetween(0.55, 1.8) : 0;
      letter.stableUntil = Math.random() < 0.055 ? time + randomBetween(2.6, 6.4) : 0;
      if (!smooth) {
        letter.color = letter.targetColor;
        letter.colorProgress = 1;
      } else {
        letter.colorProgress = 0;
      }
    }
  };

  const handleSmoothTransitions = () => {
    let needsRedraw = false;
    letters.current.forEach(letter => {
      if (letter.colorProgress >= 1) return;
      letter.colorProgress = Math.min(1, letter.colorProgress + 0.022);
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
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.current = motionQuery.matches;
    context.current = canvas.getContext('2d', { alpha: true });
    resizeCanvas();

    let resizeTimeout;
    let running = true;
    let visible = true;
    let lastAmbientDraw = 0;

    const animate = timestamp => {
      if (!running) return;
      if (visible && !reducedMotion.current) {
        const now = Date.now();
        let changed = false;
        if (now - lastGlitchTime.current >= glitchSpeed) {
          updateLetters(timestamp * 0.001);
          lastGlitchTime.current = now;
          changed = true;
        }
        if (smooth && handleSmoothTransitions()) changed = true;
        if (changed || timestamp - lastAmbientDraw > 58) {
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
    const handlePointerMove = event => {
      const rect = canvas.getBoundingClientRect();
      pointer.current.x = event.clientX - rect.left;
      pointer.current.y = event.clientY - rect.top;
      pointer.current.movedAt = performance.now() * 0.001;
    };
    const handleMotionChange = event => {
      reducedMotion.current = event.matches;
      resizeCanvas();
    };
    const resizeObserver = new ResizeObserver(handleResize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
    const intersectionObserver = new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? true;
    }, { threshold: 0.02 });
    intersectionObserver.observe(canvas);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    motionQuery.addEventListener('change', handleMotionChange);
    animate(performance.now());

    return () => {
      running = false;
      clearTimeout(resizeTimeout);
      cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      motionQuery.removeEventListener('change', handleMotionChange);
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
