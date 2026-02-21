import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#0a0a0a',
        elevated: '#111111',
        raised: '#1a1a1a',
        accent: '#00e5ff',
        'accent-dim': 'rgba(0, 229, 255, 0.12)',
        'accent-border': 'rgba(0, 229, 255, 0.30)',
        success: '#39d98a',
        warning: '#f5a623',
        danger: '#e85555',
        violet: '#9d6fff',
        pink: '#e0508a',
        primary: {
          DEFAULT: '#00e5ff',
          foreground: '#000000',
        },
        muted: {
          DEFAULT: '#52526a',
          foreground: '#9898b0',
        },
        border: 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        display: ['Orbitron', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'Courier New', 'monospace'],
        sans: ['Space Mono', 'Courier New', 'monospace'],
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease',
        'slide-in-right': 'slide-in-right 0.3s ease',
        'pulse-glow': 'pulse-glow 1.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
