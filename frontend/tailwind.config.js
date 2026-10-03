/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      colors: {
        // Mapeamento dinâmico baseado nas variáveis CSS aplicadas pelo ThemeManager
        garnet: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
          950: 'rgb(var(--color-primary-950) / <alpha-value>)',
        },
        orange: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
          950: 'rgb(var(--color-primary-950) / <alpha-value>)',
        },
        surface: {
          page: 'rgb(var(--color-bg-page) / <alpha-value>)',
          card: 'rgb(var(--color-bg-card) / <alpha-value>)',
          input: 'rgb(var(--color-bg-input) / <alpha-value>)',
        },
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        panel: 'rgb(var(--color-panel) / <alpha-value>)',
        input: 'rgb(var(--color-input) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        brand: {
          DEFAULT: 'rgb(var(--color-brand) / <alpha-value>)',
          hover: 'rgb(var(--color-brand-hover) / <alpha-value>)',
          foreground: 'rgb(var(--color-brand-foreground) / <alpha-value>)',
        },
        sidebar: {
          DEFAULT: 'rgb(var(--color-sidebar) / <alpha-value>)',
          ink: 'rgb(var(--color-sidebar-ink) / <alpha-value>)',
        },
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--color-primary-500))',
          soft: 'rgba(var(--color-primary-500), 0.15)',
          softer: 'rgba(var(--color-primary-400), 0.10)',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, rgb(var(--color-primary-500)) 0%, rgb(var(--color-primary-600)) 100%)',
        'gradient-dark': 'linear-gradient(135deg, rgb(var(--color-primary-700)) 0%, rgb(var(--color-primary-900)) 100%)',
        'gradient-garnet': 'linear-gradient(135deg, rgb(var(--color-primary-400)) 0%, rgb(var(--color-primary-500)) 50%, rgb(var(--color-primary-600)) 100%)',
      },
      boxShadow: {
        'focus-ring': '0 0 0 3px rgba(var(--color-primary-500), 0.25)',
        'garnet': '0 10px 25px -5px rgba(var(--color-primary-500), 0.3)',
        'garnet-lg': '0 20px 40px -10px rgba(var(--color-primary-600), 0.4)',
      },
    },
  },
  plugins: [],
}
