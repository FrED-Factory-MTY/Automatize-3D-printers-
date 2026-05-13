/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Sora', 'sans-serif'],
      },
      colors: {
        ink:     '#0d0f12',
        surface: '#13161b',
        panel:   '#1a1e26',
        border:  '#252b36',
        dim:     '#334155',
        accent:  '#00d4aa',
        accent2: '#0ea5e9',
      },
    },
  },
  plugins: [],
};
