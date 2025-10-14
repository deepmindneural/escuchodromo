import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

const botonVariantes = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl",
  {
    variants: {
      variante: {
        predeterminado: "bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-red-600 hover:to-pink-600",
        destructivo: "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800",
        contorno: "border-2 border-teal-200 bg-white text-teal-600 hover:bg-teal-50 hover:border-teal-300",
        secundario: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300",
        fantasma: "text-teal-600 hover:bg-teal-50",
        enlace: "text-teal-600 underline-offset-4 hover:underline hover:text-red-700",
        exito: "bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700",
      },
      tamano: {
        predeterminado: "h-11 px-6 py-3",
        sm: "h-9 px-4 py-2 text-sm",
        lg: "h-13 px-8 py-4 text-lg",
        xl: "h-16 px-12 py-5 text-xl",
        icono: "h-11 w-11",
      },
    },
    defaultVariants: {
      variante: "predeterminado",
      tamano: "predeterminado",
    },
  }
)

export interface PropiedadesBoton
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof botonVariantes> {
  cargando?: boolean;
  icono?: React.ReactNode;
  animacion?: boolean;
}

const Boton = React.forwardRef<HTMLButtonElement, PropiedadesBoton>(
  ({ className, variante, tamano, cargando, icono, animacion = true, children, disabled, ...props }, ref) => {
    const BotonComponent = animacion ? motion.button : 'button';
    const animacionProps = animacion ? {
      whileHover: { scale: disabled || cargando ? 1 : 1.02 },
      whileTap: { scale: disabled || cargando ? 1 : 0.98 },
    } : {};

    return (
      <button
        className={botonVariantes({ variante, tamano, className })}
        ref={ref}
        disabled={disabled || cargando}
        {...props}
      >
        {cargando ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            <span>Cargando...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {icono && <span>{icono}</span>}
            {children && <span>{children}</span>}
          </div>
        )}
      </button>
    )
  }
)
Boton.displayName = "Boton"

export { Boton, botonVariantes }