import type { Config } from "tailwindcss";

/**
 * Drafted design system.
 * Premium sports-tech aesthetic: dark by default, glassmorphism, bold type,
 * sportsbook-style urgency accents. Tokens map to CSS variables in globals.css
 * so themes (and future tournament skins) can be swapped at runtime.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "rgb(var(--bg) / <alpha-value>)",
          elevated: "rgb(var(--bg-elevated) / <alpha-value>)",
        },
        surface: "rgb(var(--surface) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
        },
        // Brand: electric pitch-green primary, gold for trophies/streaks.
        brand: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          dark: "rgb(var(--brand-dark) / <alpha-value>)",
        },
        gold: "rgb(var(--gold) / <alpha-value>)",
        win: "rgb(var(--win) / <alpha-value>)",
        loss: "rgb(var(--loss) / <alpha-value>)",
        live: "rgb(var(--live) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.37), inset 0 1px 0 rgba(255,255,255,0.06)",
        glow: "0 0 24px rgba(var(--brand) / 0.45)",
        "glow-gold": "0 0 24px rgba(var(--gold) / 0.45)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "pulse-live": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        "score-pop": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "rank-rise": {
          "0%": { transform: "translateY(8px)", opacity: "0.4" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-up": {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "70%": { transform: "scale(1.06)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        "glow-pulse": {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(var(--brand) / 0.55)" },
          "50%": { boxShadow: "0 0 32px 4px rgba(var(--brand) / 0.55)" },
        },
        "clock-pulse": {
          "0%,100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
        },
      },
      animation: {
        "pulse-live": "pulse-live 1.4s ease-in-out infinite",
        "score-pop": "score-pop 420ms cubic-bezier(.2,.9,.3,1.4)",
        "rank-rise": "rank-rise 360ms ease-out",
        shimmer: "shimmer 1.6s infinite",
        "fade-up": "fade-up 360ms ease-out both",
        "pop-in": "pop-in 380ms cubic-bezier(.2,.9,.3,1.4) both",
        "glow-pulse": "glow-pulse 1.8s ease-in-out infinite",
        "clock-pulse": "clock-pulse 600ms ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
