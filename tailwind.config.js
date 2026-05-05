/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nsw-blue': {
          DEFAULT: '#002664',
          hover: '#000132',
          light: '#cbe3f3',
        },
        'nsw-teal': '#2e808e',
        'nsw-red': {
          DEFAULT: '#D7153A',
          hover: '#b81900',
        },
        'nsw-white': '#FFFFFF',
        'nsw-grey': {
          100: '#F4F4F4', // Lightest
          200: '#EBEBEB', // Light
          300: '#D6D6D6', // Mid
          400: '#4D4D4D', // Dark
        },
        'nsw-black': '#22272B',
        'nsw-focus': '#0085B3',
        'nsw-success': '#008A00',
        'nsw-danger': '#B81900',
      },
      fontFamily: {
        sans: ['"Public Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
