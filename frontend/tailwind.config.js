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
      },
      colors: {
        primary: {
          50: '#EDE9FE',
          100: '#C4B5FD',
          200: '#A29BFE',
          500: '#6C61FF',
          600: '#5A4FD6',
          700: '#4A3FB0',
          900: '#2D253C',
        },
        slate: {
          50: '#F8FAFC',
          950: '#0A0F2C',
        }
      },
    },
  },
  plugins: [],
}
