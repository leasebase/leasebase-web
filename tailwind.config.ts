import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        surface: {
          DEFAULT: "#0f172a",
          raised: "#1e293b",
          overlay: "#334155",
        },
        success: { DEFAULT: "#10b981", light: "#d1fae5" },
        warning: { DEFAULT: "#f59e0b", light: "#fef3c7" },
        danger: { DEFAULT: "#ef4444", light: "#fee2e2" },
        info: { DEFAULT: "#3b82f6", light: "#dbeafe" },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)",
        modal: "0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)",
      },
      ringWidth: {
        focus: "2px",
      },
      ringColor: {
        focus: "#10b981",
      },
    },
  },
  plugins: [],
};

export default config;
