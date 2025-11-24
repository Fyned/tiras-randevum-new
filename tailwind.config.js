/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#111827', // Koyu renk (Ana tema)
        secondary: '#4F46E5', // İndigo (Vurgu rengi)
        accent: '#F59E0B', // Turuncu (Dikkat rengi)
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Modern font
      }
    },
  },
  plugins: [],
}