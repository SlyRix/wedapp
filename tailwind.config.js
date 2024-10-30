// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wedding': {
          'purple': {
            light: '#9D89BC',    // Soft purple
            DEFAULT: '#5603AD',  // Main purple
            dark: '#3B0764',     // Deep purple
          },
          'green': {
            light: '#DCECC9',    // Light sage green
            DEFAULT: '#93C572',  // Vibrant green
            dark: '#2E6B34',     // Deep green
          },
          'accent': {
            light: '#F8F7FD',    // Light background
            cream: '#FFF8E7',    // Warm cream
            gold: '#FFD700',     // Accent gold
          }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}