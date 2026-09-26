// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // BarberShop brand palette: Accent Gold / Secondary Dark
        amber: {
          600: '#D4AF37',
          700: '#B8942F',
        },
        neutral: {
          800: '#24324A',
          900: '#1B263B',
        },
      },
    },
  },
  plugins: [],
}
