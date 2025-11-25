/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9',
        secondary: '#38bdf8',
        muted: '#1f2937',
      },
    },
  },
  plugins: [],
};
