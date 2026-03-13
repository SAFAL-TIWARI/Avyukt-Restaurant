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
          DEFAULT: '#800000', // --first-color
          dark: '#5D001E',    // --first-color-alt
        },
        secondary: '#D4AF37', // --second-color
        title: '#1A1A1A',     // --title-color
        text: {
          DEFAULT: '#555555', // --text-color
          light: '#888888',   // --text-color-light
        },
        body: '#FFFDD0',      // --body-color
      },
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        title: ['Playfair Display', 'serif'],
      },
      spacing: {
        header: '3.5rem',
      }
    },
  },
  plugins: [],
}
