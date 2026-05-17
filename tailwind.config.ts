import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#ffffff",
          50: "#f8f7fc",
          100: "#f0eef8",
          200: "#e4e0f3",
          300: "#cdc6e8",
        },
        brand: {
          50: "#eef1ff",
          100: "#dbe2ff",
          200: "#c0caff",
          300: "#96a4ff",
          400: "#6c72f8",
          500: "#5c4fe0",
          600: "#4f3ac4",
          700: "#42309e",
          800: "#382b80",
          900: "#312868",
        },
        ink: {
          900: "#171528",
          700: "#2d2a3f",
          500: "#5c5970",
          300: "#9c99ab",
          200: "#c5c2cf",
          100: "#e6e4eb",
        },
        amber: {
          light: "#fef3c7",
          DEFAULT: "#f59e0b",
        },
        rose: {
          light: "#ffe4e6",
          DEFAULT: "#e11d48",
        },
        emerald: {
          light: "#d1fae5",
          DEFAULT: "#10b981",
        },
        sky: {
          light: "#e0f2fe",
          DEFAULT: "#0ea5e9",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "Noto Sans SC",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        app: "1rem",
        card: "0.75rem",
        btn: "2rem",
        input: "0.625rem",
        avatar: "9999px",
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top, 0px)",
        "safe-bottom": "env(safe-area-inset-bottom, 0px)",
        "safe-left": "env(safe-area-inset-left, 0px)",
        "safe-right": "env(safe-area-inset-right, 0px)",
      },
      boxShadow: {
        card: "0 1px 3px rgba(23, 21, 40, 0.06), 0 1px 2px rgba(23, 21, 40, 0.04)",
        elevated:
          "0 4px 12px rgba(23, 21, 40, 0.08), 0 2px 4px rgba(23, 21, 40, 0.04)",
        modal:
          "0 20px 40px rgba(23, 21, 40, 0.15), 0 8px 16px rgba(23, 21, 40, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
