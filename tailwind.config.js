/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'matsuri-paper':    '#F5F2E9',
        'matsuri-ink':      '#1A1A1A',
        'matsuri-imperial': '#AA0000',
        'matsuri-jade':     '#00A86B',
        'matsuri-gold':     '#C9A84C',
        'matsuri-stone':    '#8B6914',
        'tone-1':           '#3B82F6',
        'tone-2':           '#00A86B',
        'tone-3':           '#9B59B6',
        'tone-4':           '#AA0000',
      },
      fontFamily: {
        hanzi:   ['"Noto Serif SC"', 'serif'],
        display: ['Cinzel', 'serif'],
        body:    ['Georgia', 'serif'],
      },
      animation: {
        'float':    'float 3s ease-in-out infinite',
        'flash-red': 'flashRed 0.4s ease-out',
        'gold-burst':'goldBurst 0.6s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        flashRed: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%':      { backgroundColor: 'rgba(170,0,0,0.3)' },
        },
        goldBurst: {
          '0%':   { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(2.5)' },
        },
      },
    },
  },
  plugins: [],
}
