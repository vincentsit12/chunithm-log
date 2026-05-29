/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/features/**/*.{js,ts,jsx,tsx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: '#8b5cf6',
          amber: '#22d3ee',
          navy: '#6d28d9',
          ink: '#e6e7ff',
          panel: '#11152b',
          panelAlt: '#1a2142',
          border: '#7c3aed',
        },
      },
      boxShadow: {
        glow: '0 24px 80px rgba(37, 18, 77, 0.45)',
      },
    },
  },
  plugins: [],
}