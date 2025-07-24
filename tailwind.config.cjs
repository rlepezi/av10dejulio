/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // @tailwindcss/line-clamp ya está incluido por defecto en Tailwind CSS v3.3+
  ],
}