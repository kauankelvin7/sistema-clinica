/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#667eea',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        violet: {
          500: '#764ba2',
          600: '#6b3fa0',
        },
        pink: {
          400: '#f093fb',
          500: '#ec4899',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        'gradient-card': 'linear-gradient(to bottom, #ffffff 0%, #fafbfc 100%)',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(102, 126, 234, 0.1), 0 2px 4px -1px rgba(102, 126, 234, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(102, 126, 234, 0.2), 0 4px 6px -2px rgba(102, 126, 234, 0.1)',
      },
    },
  },
  plugins: [],
}
