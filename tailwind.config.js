/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './app.js'],
  theme: {
    extend: {
      colors: {
        slate: { 850: '#151f32', 900: '#0f172a', 950: '#090d16' }
      }
    }
  },
  plugins: []
};
