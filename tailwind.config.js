/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        brand: { 50: '#EEF4FF', 100: '#DDEAFF', 200: '#BBCFFF', 400: '#4D8EF5', 500: '#1264F0', 600: '#0D52CC', 700: '#0A3FA3' },
      },
    },
  },
  plugins: [],
}
