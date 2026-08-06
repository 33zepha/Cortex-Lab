import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      mobile: "390px",
      tablet: "768px",
      laptop: "1280px",
      desktop: "1440px",
    },
    fontFamily: {
      sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      mono: ["Geist Mono", "ui-monospace", "SF Mono", "Menlo", "monospace"],
    },
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: {
          1: "var(--color-surface-1)",
          2: "var(--color-surface-2)",
          3: "var(--color-surface-3)",
          overlay: "var(--color-surface-overlay)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          "on-accent": "var(--color-text-on-accent)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
          focus: "var(--color-border-focus)",
        },
        accent: {
          indigo: "var(--color-accent-indigo)",
          "indigo-muted": "var(--color-accent-indigo-muted)",
          electric: "var(--color-accent-electric)",
          violet: "var(--color-accent-violet)",
        },
        success: { DEFAULT: "var(--color-success)", muted: "var(--color-success-muted)" },
        warning: { DEFAULT: "var(--color-warning)", muted: "var(--color-warning-muted)" },
        error: { DEFAULT: "var(--color-error)", muted: "var(--color-error-muted)" },
        info: { DEFAULT: "var(--color-info)", muted: "var(--color-info-muted)" },
        chart: {
          line: "var(--chart-line)",
          bar: "var(--chart-bar)",
        },
      },
      fontSize: {
        xs: "var(--text-xs)",
        sm: "var(--text-sm)",
        base: "var(--text-base)",
        md: "var(--text-md)",
        lg: "var(--text-lg)",
        xl: "var(--text-xl)",
        "2xl": "var(--text-2xl)",
        "3xl": "var(--text-3xl)",
        "4xl": "var(--text-4xl)",
        // Échelle nommée du brief — une classe = taille + line-height + poids + tracking
        "page-title": ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }],
        metric: ["1.125rem", { lineHeight: "1.5rem", fontWeight: "600", letterSpacing: "-0.1px" }],
        label: ["0.75rem", { lineHeight: "1rem", fontWeight: "500" }],
        "body-text": ["0.8125rem", { lineHeight: "1.25rem", fontWeight: "400" }],
        filter: ["0.8125rem", { lineHeight: "1rem", fontWeight: "500" }],
      },
      letterSpacing: {
        tight: "var(--tracking-tight)",
        normal: "var(--tracking-normal)",
        wide: "var(--tracking-wide)",
      },
      spacing: {
        0: "var(--space-0)",
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        10: "var(--space-10)",
        12: "var(--space-12)",
        16: "var(--space-16)",
        20: "var(--space-20)",
        24: "var(--space-24)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        focus: "var(--shadow-focus)",
      },
      zIndex: {
        sticky: "var(--z-sticky)",
        panel: "var(--z-panel)",
        overlay: "var(--z-overlay)",
        dialog: "var(--z-dialog)",
        palette: "var(--z-command-palette)",
        tooltip: "var(--z-tooltip)",
      },
      transitionDuration: {
        fast: "120ms",
        standard: "180ms",
        slow: "220ms",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "drawer-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "sheet-in": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "fade-in": "fade-in 180ms cubic-bezier(0.4,0,0.2,1)",
        "slide-up": "slide-up 180ms cubic-bezier(0.4,0,0.2,1)",
        "slide-in-right": "slide-in-right 180ms cubic-bezier(0.4,0,0.2,1)",
        "drawer-in": "drawer-in 220ms cubic-bezier(0.4,0,0.2,1)",
        "sheet-in": "sheet-in 220ms cubic-bezier(0.4,0,0.2,1)",
        shimmer: "shimmer 1.8s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
