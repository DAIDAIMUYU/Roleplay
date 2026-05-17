import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          100: "oklch(0.145 0.005 285)",
          200: "oklch(0.185 0.005 285)",
          300: "oklch(0.225 0.005 285)",
          content: "oklch(0.92 0.005 285)",
        },
        accent: {
          DEFAULT: "oklch(0.70 0.15 25)",
          content: "oklch(0.98 0.01 25)",
        },
        muted: "oklch(0.55 0.01 285)",
        border: "oklch(0.28 0.01 285)",
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
        app: "0.75rem",
        card: "0.5rem",
        btn: "0.5rem",
        input: "0.5rem",
        avatar: "9999px",
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top, 0px)",
        "safe-bottom": "env(safe-area-inset-bottom, 0px)",
        "safe-left": "env(safe-area-inset-left, 0px)",
        "safe-right": "env(safe-area-inset-right, 0px)",
      },
    },
  },
  plugins: [],
} satisfies Config;
