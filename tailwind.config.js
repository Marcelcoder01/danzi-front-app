/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      keyframes: {
        'login-enter': {
          'from': {
            opacity: '0',
            transform: 'translateY(12px) scale(.98)',
          },
          'to': {
            opacity: '1',
            transform: 'none',
          },
        },
      },
    },
  },
  plugins: [
    require("daisyui"),
  ],
}
