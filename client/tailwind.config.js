/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        finops: {
          dark: '#0B0F19',
          surface: '#111827',
          card: '#1F2937',
          border: '#374151',
          accent: '#10B981', // Emerald for FinOps savings
          warning: '#F59E0B',
          danger: '#EF4444',
          primary: '#6366F1'
        }
      }
    },
  },
  plugins: [],
}
