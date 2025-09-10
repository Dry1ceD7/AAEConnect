/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        aae: {
          primary: '#00BCD4',      // Cyan - AAE Primary Brand Color
          secondary: '#0097A7',    // Dark Cyan - Secondary Brand Color
          accent: '#00E5FF',       // Light Cyan - Accent Color
          gray: '#757575',         // Professional Gray
          dark: '#212121',         // Dark Text
          light: '#fafafa',        // Light Background
        }
      },
      fontFamily: {
        'aae': ['Inter', 'Noto Sans Thai', 'system-ui', 'sans-serif'],
        'thai': ['Noto Sans Thai', 'Inter', 'sans-serif']
      },
      animation: {
        'pulse-online': 'pulse-online 2s infinite',
        'typing-bounce': 'typing-bounce 1.5s infinite ease-in-out',
        'shimmer': 'shimmer 2s infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out'
      },
      keyframes: {
        'pulse-online': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        },
        'typing-bounce': {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' }
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        'fadeIn': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'slideUp': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      boxShadow: {
        'aae-soft': '0 2px 15px -3px rgba(0, 188, 212, 0.08), 0 10px 20px -2px rgba(0, 188, 212, 0.04)',
        'aae-medium': '0 4px 25px -5px rgba(0, 188, 212, 0.15), 0 10px 10px -5px rgba(0, 188, 212, 0.04)',
        'aae-strong': '0 10px 40px -15px rgba(0, 188, 212, 0.25)'
      },
      backdropBlur: {
        'xs': '2px'
      },
      transitionTimingFunction: {
        'aae-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'aae-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class'
    }),
    require('@tailwindcss/typography'),
    // Custom plugin for AAE-specific utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.text-aae-gradient': {
          background: `linear-gradient(135deg, ${theme('colors.aae.primary')} 0%, ${theme('colors.aae.accent')} 100%)`,
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          '-webkit-text-fill-color': 'transparent'
        },
        '.bg-aae-gradient': {
          background: `linear-gradient(135deg, ${theme('colors.aae.primary')} 0%, ${theme('colors.aae.secondary')} 100%)`
        },
        '.glass-aae': {
          background: 'rgba(255, 255, 255, 0.9)',
          'backdrop-filter': 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        },
        '.performance-optimized': {
          'will-change': 'transform, opacity',
          transform: 'translateZ(0)',
          'backface-visibility': 'hidden'
        }
      }
      addUtilities(newUtilities)
    }
  ],
  // Enable JIT mode for better performance
  mode: 'jit',
  
  // Dark mode configuration for future use
  darkMode: 'class'
}
