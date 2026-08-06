import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/shared-ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A0F1C',
          900: '#0F1626',
          800: '#161F35',
          700: '#212C48',
        },
        gold: {
          400: '#D9BD87',
          500: '#C6A15B',
          600: '#AD8A48',
        },
        cream: {
          50: '#FBF9F4',
          100: '#F5F1E7',
        },
        springs: {
          500: '#2F6F62',
          600: '#255950',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        luxury: '0 20px 60px -20px rgba(10, 15, 28, 0.35)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
