import { forwardRef } from "react"
import { cn } from "../../lib/utils"

const Card = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md", className)}
    style={{
      backgroundColor: "var(--card-background)",
      color: "var(--card-foreground)",
      borderColor: "var(--border-color)",
      borderRadius: "0.75rem",
      boxShadow: "0 2px 4px -1px rgba(0, 0, 0, 0.03), 0 1px 2px -1px rgba(0, 0, 0, 0.02)",
    }}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1 p-4 pt-5 pb-3", className)} {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = forwardRef(({ className, ...props }, ref) => {
  // Check if the card has a background color class that would need white text
  const hasColoredBackground = className?.includes('bg-gradient') || 
                              className?.includes('bg-primary') || 
                              className?.includes('text-white') ||
                              props.style?.color === 'white';
  
  return (
    <h3 
      ref={ref} 
      className={cn("text-lg font-semibold leading-none tracking-tight", className)} 
      style={{
        color: hasColoredBackground ? 'white' : "var(--foreground-color)",
        ...props.style
      }}
      {...props} 
    />
  );
})
CardTitle.displayName = "CardTitle"

const CardDescription = forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-xs text-muted-foreground mt-1", className)} {...props} />
))
CardDescription.displayName = "CardDescription"

const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-3", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-4 pt-0 justify-end", className)} {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

