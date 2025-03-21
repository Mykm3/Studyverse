import { forwardRef } from "react"
import { cn } from "../../lib/utils"

// This is a simplified version for demonstration
// In a real project, you would use @radix-ui/react-dropdown-menu

const DropdownMenu = ({ children }) => {
  return <div className="relative inline-block text-left">{children}</div>
}

const DropdownMenuTrigger = forwardRef(({ className, asChild, ...props }, ref) => {
  return <button ref={ref} className={cn("inline-flex w-full justify-center", className)} {...props} />
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = forwardRef(({ className, align = "center", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        {
          "origin-top-right right-0": align === "end",
          "origin-top-left left-0": align === "start",
          "origin-top": align === "center",
        },
        className,
      )}
      {...props}
    />
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = forwardRef(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      {...props}
    />
  )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }