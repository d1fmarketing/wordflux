/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        wf: {
          magenta: '#e50c78',
          orange: '#ef450a',
          navy: '#000023',
          soft: '#fff9f9',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        }
      },
      fontFamily: {
        display: ['Wondra', 'Poppins', 'system-ui'],
        body: ['Belkin', 'Inter', 'system-ui'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(229, 12, 120, 0.5)' },
          '100%': { boxShadow: '0 0 30px rgba(239, 69, 10, 0.8)' }
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        DEFAULT: '1.25rem',
        'xl': '1.25rem',
        '2xl': '1.25rem'
      },
      boxShadow: {
        'card': '0 6px 24px rgba(0, 0, 0, 0.25)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.15)'
      }
    }
  },
  plugins: [],
}