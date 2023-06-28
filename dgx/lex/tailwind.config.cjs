const colors = require('tailwindcss/colors')
const defaultTheme = require('tailwindcss/defaultTheme')

// this seems odd, but solid uses colors like border-solid-lightborder
const colorScheme = colors.neutral

module.exports = {
  mode: 'jit',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}','../../packages/ui/src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
        mono: [
          "Inconsolata",
          "Source Code Pro",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          ...defaultTheme.fontFamily.sans
        ],
      },
      colors: {
        solid: {
          dark: colorScheme["900"],
          darkbg: colorScheme["800"],
          darkitem: colorScheme["700"],
          darkaction: colorScheme["500"],
          light: "#FFFFFF",
          lightbg: colorScheme["100"],
          lightitem: colorScheme["200"],
          lightaction: colorScheme["400"],
          accent: "#1D4ED8",
          accentlight: "#1D4ED8",

        }
      }
    }
  },
  variants: {
    extend: {
      visibility: ["group-hover"],
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],

}
