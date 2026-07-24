import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
        chart: {
          1: "oklch(var(--chart-1))",
          2: "oklch(var(--chart-2))",
          3: "oklch(var(--chart-3))",
          4: "oklch(var(--chart-4))",
          5: "oklch(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar))",
          foreground: "oklch(var(--sidebar-foreground))",
          primary: "oklch(var(--sidebar-primary))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground))",
          accent: "oklch(var(--sidebar-accent))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border))",
          ring: "oklch(var(--sidebar-ring))",
        },
        reel: {
          DEFAULT: "oklch(var(--reel) / <alpha-value>)",
          foreground: "oklch(var(--reel-foreground))",
        },
        shop: {
          DEFAULT: "oklch(var(--shop) / <alpha-value>)",
          foreground: "oklch(var(--shop-foreground))",
        },
        ainews: {
          DEFAULT: "oklch(var(--ainews) / <alpha-value>)",
          foreground: "oklch(var(--ainews-foreground))",
        },
        learn: {
          DEFAULT: "oklch(var(--learn) / <alpha-value>)",
          foreground: "oklch(var(--learn-foreground))",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.05)",
        subtle: "0 2px 8px -2px oklch(0.05 0.02 50 / 0.4)",
        elevated: "0 8px 24px -6px oklch(0.05 0.02 50 / 0.5), 0 2px 6px -2px oklch(0.05 0.02 50 / 0.3)",
        coin: "0 4px 14px -2px oklch(0.78 0.165 80 / 0.35), 0 1px 3px oklch(0.78 0.165 80 / 0.2)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "coin-pop": {
          "0%": { transform: "scale(0.6) translateY(8px)", opacity: "0" },
          "50%": { transform: "scale(1.15) translateY(-4px)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        "coin-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "streak-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
        },
        "progress-shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "reel-snap": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.012)" },
          "100%": { transform: "scale(1)" },
        },
        "card-press": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.94)" },
          "100%": { transform: "scale(1)" },
        },
        "reader-fade": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "coin-pop": "coin-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "coin-float": "coin-float 3s ease-in-out infinite",
        "streak-pulse": "streak-pulse 2s ease-in-out infinite",
        "progress-shimmer": "progress-shimmer 2.5s linear infinite",
        "reel-snap": "reel-snap 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "card-press": "card-press 0.18s ease-out",
        "reader-fade": "reader-fade 0.4s ease-out",
      },
    },
  },
  plugins: [typography, containerQueries, animate],
};
