/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          gold: '#C5A059',
          blue: '#2563eb',
        },
        surface: {
          900: '#0A0A0B',
          800: '#141417',
          700: '#1C1C21',
        }
      }
    },
  },
  plugins: [],
}
