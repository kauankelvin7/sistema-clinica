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
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
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
