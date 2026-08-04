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
        // Paleta Garnet / Burgundy basada na imagem fornecida pelo usuário:
        // #170000 (Hex 1) | #350a06 (Hex 2) | #56070c (Hex 3) | #8f3d38 (Hex 4) | #cb7169 (Hex 5)
        garnet: {
          50: '#fdf4f4',
          100: '#fbe6e5',
          200: '#f6cecb',
          300: '#eba7a2',
          400: '#cb7169', // #cb7169 (Hex 5)
          500: '#8f3d38', // #8f3d38 (Hex 4)
          600: '#56070c', // #56070c (Hex 3)
          700: '#350a06', // #350a06 (Hex 2)
          800: '#260404',
          900: '#170000', // #170000 (Hex 1)
          950: '#0c0000',
        },
        // Mapeamento direto de 'orange' para a nova paleta Garnet/Burgundy
        orange: {
          50: '#fdf4f4',
          100: '#fbe6e5',
          200: '#f6cecb',
          300: '#eba7a2',
          400: '#cb7169',
          500: '#8f3d38',
          600: '#56070c',
          700: '#350a06',
          800: '#260404',
          900: '#170000',
          950: '#0c0000',
        },
        // Mapeamento de 'amber' para tons complementares rosa-terracota
        amber: {
          50: '#fdf4f4',
          100: '#fbe6e5',
          200: '#f6cecb',
          300: '#eba7a2',
          400: '#d98279',
          500: '#cb7169',
          600: '#a84e49',
          700: '#8f3d38',
          800: '#56070c',
          900: '#350a06',
          950: '#170000',
        },
        surface: {
          page: '#170000',
          card: '#270707',
          input: '#1f0404',
        },
        accent: {
          DEFAULT: '#8f3d38',
          soft: 'rgba(143,61,56,0.15)',
          softer: 'rgba(203,113,105,0.08)',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #8f3d38 0%, #56070c 100%)',
        'gradient-dark': 'linear-gradient(135deg, #350a06 0%, #170000 100%)',
        'gradient-garnet': 'linear-gradient(135deg, #cb7169 0%, #8f3d38 50%, #56070c 100%)',
      },
      boxShadow: {
        'focus-ring': '0 0 0 3px rgba(143,61,56,0.25)',
        'garnet': '0 10px 25px -5px rgba(143, 61, 56, 0.3)',
        'garnet-lg': '0 20px 40px -10px rgba(86, 7, 12, 0.4)',
      },
    },
  },
  plugins: [],
}
