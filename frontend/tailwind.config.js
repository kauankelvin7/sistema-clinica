/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#7c3aed', // Roxo vibrante
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#2e1065',
        },
        secondary: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4', // Ciano vibrante
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        highlight: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f59e42', // Laranja suave
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        darkbg: {
          900: '#18181b',
          800: '#232336',
          700: '#27272a',
        },
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #581c87 100%)',
        'gradient-card': 'linear-gradient(to bottom, #ffffff 0%, #fafbfc 100%)',
      },
      boxShadow: {
        'card': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 20px 30px -10px rgba(168, 85, 247, 0.3), 0 10px 15px -5px rgba(168, 85, 247, 0.2)',
        'purple': '0 10px 25px -5px rgba(168, 85, 247, 0.3)',
        'purple-lg': '0 20px 40px -10px rgba(168, 85, 247, 0.4)',
      },
    },
  },
  plugins: [],
}
