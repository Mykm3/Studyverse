import { forwardRef } from "react"
import { cn } from "../../lib/utils"

const Slider = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("relative flex w-full touch-none select-none items-center", className)}>
    <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <div
        className="absolute h-full bg-primary"
        style={{ width: `${(props.defaultValue?.[0] / props.max) * 100}%` }}
      />
    </div>
    <div
      className="absolute h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      style={{ left: `calc(${(props.defaultValue?.[0] / props.max) * 100}% - 10px)` }}
    />
  </div>
))
Slider.displayName = "Slider"

export { Slider }