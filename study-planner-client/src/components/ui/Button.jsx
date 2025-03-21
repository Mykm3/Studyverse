import { forwardRef } from "react"
import { cn } from "../../lib/utils"
import { Slot } from "@radix-ui/react-slot"

const Button = forwardRef(({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  // Define styles based on variant and size
  const styles = {
    backgroundColor: "transparent",
    color: "var(--foreground-color)",
    borderRadius: "0.375rem",
  }

  if (variant === "default") {
    styles.backgroundColor = "var(--primary-color)"
    styles.color = "var(--primary-foreground)"
  } else if (variant === "destructive") {
    styles.backgroundColor = "var(--destructive-color)"
    styles.color = "var(--destructive-foreground)"
  } else if (variant === "outline") {
    styles.backgroundColor = "transparent"
    styles.color = "var(--foreground-color)"
    styles.border = "1px solid var(--border-color)"
  } else if (variant === "secondary") {
    styles.backgroundColor = "var(--secondary-color)"
    styles.color = "var(--secondary-foreground)"
  } else if (variant === "ghost") {
    styles.backgroundColor = "transparent"
  }

  // Size styles
  if (size === "default") {
    styles.height = "2.5rem"
    styles.padding = "0 1rem"
  } else if (size === "sm") {
    styles.height = "2.25rem"
    styles.padding = "0 0.75rem"
    styles.fontSize = "0.875rem"
  } else if (size === "lg") {
    styles.height = "2.75rem"
    styles.padding = "0 2rem"
  } else if (size === "icon") {
    styles.height = "2.25rem"
    styles.width = "2.25rem"
    styles.padding = "0"
  }

  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      ref={ref}
      style={styles}
      {...props}
    />
  )
})

Button.displayName = "Button"

export { Button }

