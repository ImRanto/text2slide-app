/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/**/*.{js,ts,jsx,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#C43E1C',
          hover: '#A93418',
          soft: '#FBE9E3',
          dark: '#E8603C'
        },
        surface: {
          app: '#FAF7F5',
          card: '#FFFFFF',
          line: '#E8DFDA',
          ink: '#2B2220',
          mute: '#6B5D57',
          'app-dark': '#1E1917',
          'card-dark': '#2A2321',
          'line-dark': '#3A302D',
          'ink-dark': '#F3EDEA',
          'mute-dark': '#B5A7A1'
        }
      },
      fontFamily: {
        sans: ['"Segoe UI Variable"', '"Segoe UI"', 'Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
