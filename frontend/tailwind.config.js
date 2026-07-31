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
        display: ['Sora', 'sans-serif'],
      },
      colors: {
        surface: {
          page: '#09090b',
          card: '#141416',
          input: '#0f0f11',
        },
        accent: {
          DEFAULT: '#f97316',
          soft: 'rgba(249,115,22,0.12)',
          softer: 'rgba(249,115,22,0.06)',
        },
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'gradient-dark': 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
      },
      boxShadow: {
        'focus-ring': '0 0 0 3px rgba(249,115,22,0.15)',
        'green': '0 10px 25px -5px rgba(34, 197, 94, 0.3)',
        'green-lg': '0 20px 40px -10px rgba(34, 197, 94, 0.4)',
      },
    },
  },
  plugins: [],
}
