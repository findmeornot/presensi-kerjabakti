/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        card: '#FFFFFF',
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
          dark: '#1E40AF',
        },
        text: {
          main: '#0F172A',
          muted: '#64748B',
        },
        success: {
          DEFAULT: '#16A34A',
          light: '#F0FDF4',
          border: '#BBF7D0',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FFFBEB',
          border: '#FDE68A',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FEF2F2',
          border: '#FECACA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'subtle': '12px',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card': '0 4px 6px -1px rgb(0 0 0 / 0.04), 0 2px 4px -2px rgb(0 0 0 / 0.03)',
        'elevated': '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.03)',
      },
    },
  },
  plugins: [],
}
