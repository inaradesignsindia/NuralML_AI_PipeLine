/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // TradingView-inspired color palette
        'tv-dark': '#0E0F14',
        'tv-darker': '#0A0B0E',
        'tv-dark-gray': '#1A1B23',
        'tv-gray': '#2A2E39',
        'tv-light-gray': '#363A45',
        'tv-border': '#434651',
        'tv-text': '#D1D4DC',
        'tv-text-secondary': '#787B86',
        'tv-accent': '#2962FF',
        'tv-accent-hover': '#1E53E5',
        'tv-success': '#089981',
        'tv-error': '#F23645',
        'tv-warning': '#FF6B35',
        'tv-chart-bg': '#131722',
        'tv-chart-grid': '#1E222D',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'glass': 'rgba(255, 255, 255, 0.05)',
        'glass-dark': 'rgba(0, 0, 0, 0.1)',
        'tv-gradient': 'linear-gradient(135deg, #0E0F14 0%, #1A1B23 100%)',
      },
      boxShadow: {
        'tv': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'tv-lg': '0 4px 16px rgba(0, 0, 0, 0.4)',
      },
      fontFamily: {
        'tv': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

