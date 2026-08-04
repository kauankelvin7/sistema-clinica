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
        // Paleta Garnet / Burgundy escurecida em 1 tom:
        // #0d0000 | #230503 | #3d0407 | #6e2d29 | #a6544d
        garnet: {
          50: '#f9eaea',
          100: '#f0cecd',
          200: '#e19d9a',
          300: '#ca756f',
          400: '#a6544d', // Escurecido (antes #cb7169)
          500: '#6e2d29', // Escurecido (antes #8f3d38)
          600: '#3d0407', // Escurecido (antes #56070c)
          700: '#230503', // Escurecido (antes #350a06)
          800: '#170202',
          900: '#0d0000', // Escurecido (antes #170000)
          950: '#050000',
        },
        // Mapeamento direto de 'orange' para a nova paleta Garnet/Burgundy escurecida
        orange: {
          50: '#f9eaea',
          100: '#f0cecd',
          200: '#e19d9a',
          300: '#ca756f',
          400: '#a6544d',
          500: '#6e2d29',
          600: '#3d0407',
          700: '#230503',
          800: '#170202',
          900: '#0d0000',
          950: '#050000',
        },
        amber: {
          50: '#f9eaea',
          100: '#f0cecd',
          200: '#e19d9a',
          300: '#ca756f',
          400: '#b8665f',
          500: '#a6544d',
          600: '#8c3d37',
          700: '#6e2d29',
          800: '#3d0407',
          900: '#230503',
          950: '#0d0000',
        },
        surface: {
          page: '#0d0000',
          card: '#1a0303',
          input: '#120202',
        },
        accent: {
          DEFAULT: '#6e2d29',
          soft: 'rgba(110,45,41,0.18)',
          softer: 'rgba(166,84,77,0.10)',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6e2d29 0%, #3d0407 100%)',
        'gradient-dark': 'linear-gradient(135deg, #230503 0%, #0d0000 100%)',
        'gradient-garnet': 'linear-gradient(135deg, #a6544d 0%, #6e2d29 50%, #3d0407 100%)',
      },
      boxShadow: {
        'focus-ring': '0 0 0 3px rgba(110,45,41,0.25)',
        'garnet': '0 10px 25px -5px rgba(110, 45, 41, 0.3)',
        'garnet-lg': '0 20px 40px -10px rgba(61, 4, 7, 0.4)',
      },
    },
  },
  plugins: [],
}
