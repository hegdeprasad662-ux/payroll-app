/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Light-blue brand palette (sky family)
        brand: {
          DEFAULT: '#0284c7',
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        ink: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
        },
      },
      boxShadow: {
        card:      '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        cardHover: '0 4px 12px rgba(2, 132, 199, 0.10), 0 2px 4px rgba(15, 23, 42, 0.06)',
        glow:      '0 0 0 4px rgba(2, 132, 199, 0.12)',
        inset:     'inset 0 1px 2px rgba(15, 23, 42, 0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system',
               '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
