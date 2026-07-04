/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './lib/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Encre / fond dojo
        sumi: {
          DEFAULT: '#14141C',
          light: '#1E1E2A',
          card: '#20202E',
          border: '#2E2E3E',
        },
        // Rouge torii — actions principales
        torii: {
          DEFAULT: '#C9403A',
          dark: '#A32E29',
          soft: '#E06B66',
        },
        // Papier washi — textes clairs
        paper: {
          DEFAULT: '#F3EAD8',
          dim: '#B8B0A0',
          faint: '#7E7A70',
        },
        // Or — XP et récompenses
        gold: {
          DEFAULT: '#D9A441',
          soft: '#EFC97E',
        },
        // Vert matcha — succès / validation
        matcha: {
          DEFAULT: '#7BA05B',
          dark: '#5C7A43',
        },
      },
    },
  },
  plugins: [],
};
