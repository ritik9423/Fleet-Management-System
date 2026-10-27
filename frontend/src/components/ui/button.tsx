import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0078d4] disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#0078d4] hover:bg-[#0069ba] text-white font-semibold shadow-sm shadow-[#0078d4]/25",
        purple:
          "bg-[#5542f6] hover:bg-[#4332d9] text-white font-semibold shadow-sm shadow-[#5542f6]/20",
        destructive:
          "bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20",
        outline:
          "border border-[#e2e8f0] bg-white hover:bg-slate-50 text-slate-700 shadow-sm",
        secondary:
          "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/70",
        ghost:
          "hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors",
        link:
          "text-[#0078d4] underline-offset-4 hover:underline hover:text-[#004578]",
        success:
          "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20",
        industrial:
          "bg-[#0078d4] hover:bg-[#0069ba] text-white shadow-sm font-medium",
      },
      size: {
        default: "h-9.5 px-4 py-2",
        sm: "h-8.5 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-7 text-base",
        icon: "h-9.5 w-9.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
