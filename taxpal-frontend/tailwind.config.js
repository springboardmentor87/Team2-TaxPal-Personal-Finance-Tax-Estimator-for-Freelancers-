/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7C3AED',
          50: '#F5F0FE',
          100: '#F3E8FF',
          200: '#E4D2FE',
          300: '#CBAAFC',
          400: '#AD7CF9',
          500: '#7C3AED',
          600: '#6D28D9',
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#3B1873'
        },
        lavender: '#F3E8FF'
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['Inter', 'sans-serif']
      },
      borderRadius: {
        xl: '16px',
        '2xl': '18px',
        '3xl': '20px'
      },
      boxShadow: {
        soft: '0 2px 8px rgba(124, 58, 237, 0.06), 0 1px 2px rgba(17, 12, 46, 0.04)',
        card: '0 8px 24px -6px rgba(124, 58, 237, 0.12), 0 2px 6px rgba(17, 12, 46, 0.04)',
        'card-hover': '0 16px 36px -8px rgba(124, 58, 237, 0.22), 0 4px 10px rgba(17, 12, 46, 0.06)'
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        growBar: {
          '0%': { transform: 'scaleY(0)' },
          '100%': { transform: 'scaleY(1)' }
        }
      },
      animation: {
        fadeUp: 'fadeUp 0.5s ease both',
        growBar: 'growBar 0.6s cubic-bezier(0.22, 1, 0.36, 1) both'
      }
    }
  },
  plugins: []
};
