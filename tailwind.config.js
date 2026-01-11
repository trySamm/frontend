/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Enable RTL support
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef3f2',
          100: '#fee4e2',
          200: '#fececa',
          300: '#fcaaa4',
          400: '#f87a70',
          500: '#ef5343',
          600: '#dc3626',
          700: '#b92a1c',
          800: '#99261b',
          900: '#7f251d',
          950: '#450f0a',
        },
        neutral: {
          850: '#1f2027',
          925: '#13141a',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        arabic: ['IBM Plex Sans Arabic', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

