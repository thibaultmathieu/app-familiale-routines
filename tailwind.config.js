/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fond crème — identité de l'app (conservé du prototype)
        warm: {
          50: '#FDFBF7',
          100: '#F5F0EB',
          200: '#E8DFD5',
          300: '#DDD0C0',
        },
        // Neutres chauds — remplacent les gris bleutés Tailwind
        ink: {
          DEFAULT: '#3F3A35',
          soft: '#6F675F',
          faint: '#9C938A',
        },
        line: {
          DEFAULT: '#EDE6DD',
          strong: '#DBD0C2',
        },
        // Fonctionnels chaleureux
        success: {
          50: '#EEF8F0',
          100: '#DCF1E1',
          200: '#B8E3C8',
          300: '#8AD1A4',
          400: '#4CAF6E',
          500: '#3D9C5F',
          600: '#2E8A50',
        },
        honey: {
          50: '#FDF6EC',
          100: '#FAEDD8',
          200: '#F3D9AC',
          300: '#ECC178',
          400: '#E8A33D',
          500: '#D98E20',
          600: '#B97417',
          700: '#945C10',
        },
        danger: {
          50: '#FCEFEC',
          100: '#F9DFD9',
          300: '#EFA28F',
          400: '#E2674F',
          500: '#D05540',
          600: '#B23E2B',
        },
        night: {
          400: '#8B85D6',
          500: '#6F68C4',
        },
      },
      fontFamily: {
        display: ['"Fredoka Variable"', 'ui-rounded', 'system-ui', 'sans-serif'],
        sans: ['"Nunito Variable"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(63, 58, 53, 0.06), 0 4px 12px rgba(63, 58, 53, 0.05)',
        raised: '0 2px 6px rgba(63, 58, 53, 0.08), 0 8px 20px rgba(63, 58, 53, 0.07)',
        overlay: '0 8px 30px rgba(63, 58, 53, 0.20)',
      },
      zIndex: {
        overlay: '40',
        modal: '50',
        toast: '60',
      },
    },
  },
  plugins: [],
}
