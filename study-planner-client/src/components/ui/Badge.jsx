import { forwardRef } from "react"
import { cn } from "../../lib/utils"

const Badge = forwardRef(({ className, variant = "default", ...props }, ref) => {
  const variantClasses = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    error: "bg-destructive/10 text-destructive",
    outline: "border border-border"
  }

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
})

Badge.displayName = "Badge"

export { Badge } 