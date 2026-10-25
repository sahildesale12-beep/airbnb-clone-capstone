/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: { airbnb: '#FF385C', ink: '#222222', muted: '#717171' },
      boxShadow: { soft: '0 4px 24px rgba(0,0,0,0.08)' },
    },
  },
  plugins: [],
};
