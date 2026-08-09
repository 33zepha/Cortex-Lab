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

  const lettersAndSymbols = Array.from(characters);
  const fontSize = 16;
  const charWidth = 10;
  const charHeight = 20;

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

  const calculateGrid = (width, height) => ({
    columns: Math.ceil(width / charWidth),
    rows: Math.ceil(height / charHeight)
  });

  const initializeLetters = (columns, rows) => {
    grid.current = { columns, rows };
    letters.current = Array.from({ length: columns * rows }, () => {
      const color = getRandomColor();
      return {
        char: getRandomChar(),
        color,
        targetColor: color,
        colorProgress: 1
      };
    });
  };

  const drawLetters = () => {
    if (!context.current || !canvasRef.current || letters.current.length === 0) return;
    const ctx = context.current;
    const { width, height } = canvasRef.current.getBoundingClientRect();

    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    ctx.textBaseline = 'top';

    letters.current.forEach((letter, index) => {
      const x = (index % grid.current.columns) * charWidth;
      const y = Math.floor(index / grid.current.columns) * charHeight;
      ctx.fillStyle = letter.color;
      ctx.fillText(letter.char, x, y);
    });
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = parent.getBoundingClientRect();

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
    const updateCount = Math.max(1, Math.floor(letters.current.length * 0.05));

    for (let i = 0; i < updateCount; i += 1) {
      const index = Math.floor(Math.random() * letters.current.length);
      const letter = letters.current[index];
      if (!letter) continue;

      letter.char = getRandomChar();
      letter.targetColor = getRandomColor();

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

      letter.colorProgress = Math.min(1, letter.colorProgress + 0.05);
      const startRgb = parseColor(letter.color);
      const endRgb = parseColor(letter.targetColor);

      if (startRgb && endRgb) {
        letter.color = interpolateColor(startRgb, endRgb, letter.colorProgress);
        needsRedraw = true;
      }
    });

    if (needsRedraw) drawLetters();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    context.current = canvas.getContext('2d');
    resizeCanvas();

    let resizeTimeout;
    let running = true;

    const animate = () => {
      if (!running) return;

      const now = Date.now();
      if (now - lastGlitchTime.current >= glitchSpeed) {
        updateLetters();
        drawLetters();
        lastGlitchTime.current = now;
      }

      if (smooth) handleSmoothTransitions();
      animationRef.current = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resizeCanvas, 100);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
    animate();

    return () => {
      running = false;
      clearTimeout(resizeTimeout);
      cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
    };
  }, [characters, glitchColors, glitchSpeed, smooth]);

  return (
    <div className={`letter-glitch ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="letter-glitch__canvas" />
      {outerVignette && <div className="letter-glitch__outer-vignette" />}
      {centerVignette && <div className="letter-glitch__center-vignette" />}
    </div>
  );
};

export default LetterGlitch;
