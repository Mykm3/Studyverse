"use client"

import { forwardRef } from "react"
import { cn } from "../../lib/utils"

const Switch = forwardRef(({ className, checked, onChange, ...props }, ref) => (
  <div className={cn("inline-flex items-center", className)}>
    <input type="checkbox" className="peer sr-only" ref={ref} checked={checked} onChange={onChange} {...props} />
    <div
      className={cn(
        "peer h-[24px] w-[44px] cursor-pointer rounded-full bg-input ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-input",
      )}
      onClick={onChange}
    >
      <div
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </div>
  </div>
))
Switch.displayName = "Switch"

export { Switch }

