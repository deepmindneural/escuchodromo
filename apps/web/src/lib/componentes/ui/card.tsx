'use client';

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const cardVariantes = cva(
  "rounded-xl border bg-card text-card-foreground shadow-lg",
  {
    variants: {
      variante: {
        predeterminado: "bg-white border-gray-200",
        gradiente: "bg-gradient-to-br from-white to-gray-50 border-gray-200",
        teal: "bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200",
        transparente: "bg-white/80 backdrop-blur-sm border-white/20",
      },
      padding: {
        predeterminado: "p-6",
        sm: "p-4",
        lg: "p-8",
        ninguno: "p-0",
      },
    },
    defaultVariants: {
      variante: "predeterminado",
      padding: "predeterminado",
    },
  }
)

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariantes>
>(({ className, variante, padding, ...props }, ref) => (
  <div
    ref={ref}
    className={cardVariantes({ variante, padding, className })}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 pb-6 ${className || ''}`}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-2xl font-bold leading-none tracking-tight text-gray-900 ${className || ''}`}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-gray-600 leading-relaxed ${className || ''}`}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={`pt-0 ${className || ''}`} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center pt-6 ${className || ''}`}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariantes }
export type { VariantProps }