import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-brand-panel)] disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-strong)]": variant === "default",
            "bg-red-500 text-slate-50 hover:bg-red-500/90": variant === "destructive",
            "border border-[var(--color-brand-border)] bg-white text-[var(--color-brand-ink)] hover:bg-[var(--color-brand-surface)]": variant === "outline",
            "bg-[var(--color-brand-surface-muted)] text-[var(--color-brand-ink)] hover:bg-[var(--color-brand-primary-soft)]": variant === "secondary",
            "text-[var(--color-brand-ink)] hover:bg-[var(--color-brand-surface-muted)]": variant === "ghost",
            "text-[var(--color-brand-primary)] underline-offset-4 hover:underline": variant === "link",
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
