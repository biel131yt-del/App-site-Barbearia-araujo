import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 🎨 Identidade visual Barbearia Araujo
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#2563eb",
          600: "#1E3A8A", // azul royal
          700: "#1e40af",
          800: "#1e3a5f",
          900: "#0A2540", // azul profundo
          950: "#06182b",
        },
        accent: {
          DEFAULT: "#DC2626", // vermelho destaque
          light: "#EF4444",
          dark: "#991b1b",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        display: ["var(--font-display)", "Oswald", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 4px 24px -6px rgba(10, 37, 64, 0.15)",
        "card-hover": "0 8px 32px -6px rgba(10, 37, 64, 0.25)",
        "glow-red": "0 0 24px -4px rgba(220, 38, 38, 0.55)",
        "glow-red-sm": "0 0 12px -2px rgba(220, 38, 38, 0.5)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "spin-lento": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        tesoura: {
          "0%, 100%": { transform: "rotate(-8deg)" },
          "50%": { transform: "rotate(8deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "spin-lento": "spin-lento 60s linear infinite",
        tesoura: "tesoura 1.6s ease-in-out infinite",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
};
export default config;
