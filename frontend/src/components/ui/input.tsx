import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-[#0078d4] focus-visible:ring-2 focus-visible:ring-[#0078d4]/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
