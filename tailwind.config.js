/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        evangelina: '#A78BFA',
        noah: '#60A5FA',
        warm: {
          50: '#FDFBF7',
          100: '#F5F0EB',
          200: '#E8DFD5',
        },
      },
    },
  },
  plugins: [],
}
