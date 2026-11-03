/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F7F3E8',
        doodle: '#EAE4D3',
        ink: { DEFAULT: '#2C2623', muted: '#68625D' },
        olive: '#3E5634',
        forest: '#3E5634',
        sage: '#6E8C5F',
        pill: '#4B6440',
        peach: '#F9EFE6',
        gold: '#E5A922',
        flag: '#C83E3B',
        caution: '#C67314',
        verified: '#356832',
        slate: '#68625D',
        mint: '#F2F7F0',
        butter: '#FBF7EC',
        blush: '#FDF3F1',
        sky: '#F2F6F9',
        lilac: '#F5F2FA',
      },
      fontFamily: {
        display: ['"Inter Variable"', 'system-ui', 'sans-serif'],
        brand: ['"Quicksand Variable"', '"Inter Variable"', 'sans-serif'],
        serif: ['"Fraunces Variable"', 'Georgia', 'serif'],
        editorial: ['"Fraunces Variable"', 'Georgia', 'serif'],
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        crisp: '2px 2px 0px #2C2623',
        card: '3px 3px 0px #2C2623',
        brutal: '3px 3px 0px #2C2623',
        'brutal-lg': '4px 4px 0px #2C2623',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
        float: 'float 5s ease-in-out infinite',
        wiggle: 'wiggle 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
