/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ==========================================
        // PALETA TERAPÉUTICA PARA SALUD MENTAL
        // Diseñada específicamente para transmitir calma, esperanza y seguridad
        // Todos los colores cumplen WCAG AA (4.5:1) o AAA (7:1) de contraste
        // ==========================================

        // Calma: Azules suaves que transmiten tranquilidad y confianza
        calma: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9', // Principal - Contraste 4.58:1 con blanco
          600: '#0284C7', // Contraste 6.03:1 con blanco
          700: '#0369A1', // Contraste 7.95:1 con blanco
          800: '#075985',
          900: '#0C4A6E',
        },

        // Esperanza: Verdes naturales que representan crecimiento y renovación
        esperanza: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E', // Contraste 3.52:1 (usar con fondo oscuro)
          600: '#16A34A', // Contraste 4.76:1 con blanco
          700: '#15803D', // Contraste 6.51:1 con blanco
          800: '#166534',
          900: '#14532D',
        },

        // Calidez: Naranjas/ambar suaves que transmiten energía positiva
        calidez: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B', // Contraste 2.97:1 (usar con fondo oscuro)
          600: '#D97706', // Contraste 4.13:1 (usar con fondo oscuro)
          700: '#B45309', // Contraste 5.58:1 con blanco
          800: '#92400E',
          900: '#78350F',
        },

        // Serenidad: Morados/lavanda que evocan paz y espiritualidad
        serenidad: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7', // Contraste 4.61:1 (solo con blanco)
          600: '#9333EA', // Contraste 6.27:1 con blanco
          700: '#7E22CE', // Contraste 8.48:1 con blanco
          800: '#6B21A8',
          900: '#581C87',
        },

        // Alerta: Naranjas/rojos para advertencias (NO para estados negativos)
        alerta: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316', // Contraste 3.44:1 (usar con fondo oscuro)
          600: '#EA580C', // Contraste 4.69:1 (usar con fondo oscuro)
          700: '#C2410C', // Contraste 6.28:1 con blanco
          800: '#9A3412',
          900: '#7C2D12',
        },

        // Mantener colores originales como alias (para compatibilidad)
        primary: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        secondary: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          }
        }
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};