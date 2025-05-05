import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden transform hover:-translate-y-0.5 active:translate-y-0 hover:shadow-md",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 after:absolute after:content-[''] after:bg-white after:h-8 after:w-8 after:opacity-0 after:rounded-full after:scale-0 hover:after:opacity-20 hover:after:scale-150 after:transition-all after:duration-500 after:-z-10",
        gradient: 
          "bg-gradient text-white shadow hover:shadow-lg hover:shadow-primary/20 border border-transparent",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-red-500/30",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-primary/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        success:
          "bg-success text-success-foreground shadow-sm hover:bg-success/90 hover:shadow-green-500/30",
        warning:
          "bg-warning text-warning-foreground shadow-sm hover:bg-warning/90 hover:shadow-amber-500/30",
        accent:
          "bg-accent text-accent-foreground shadow-sm hover:bg-accent-foreground/10 hover:text-accent-foreground hover:shadow-purple-500/20",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:shadow-none",
        link: "text-primary underline-offset-4 hover:underline hover:shadow-none hover:translate-y-0",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-md px-10 text-base",
        icon: "h-9 w-9",
        fab: "h-14 w-14 rounded-full",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        wiggle: "animate-wiggle",
      },
      rounded: {
        default: "rounded-md",
        full: "rounded-full",
        none: "rounded-none",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
      rounded: "default",
    },
  }
);

// Add the wiggle animation to index.css
// @keyframes wiggle {
//   0%, 100% { transform: rotate(0deg); }
//   25% { transform: rotate(-1deg); }
//   75% { transform: rotate(1deg); }
// }

const Button = React.forwardRef(
  ({ className, variant, size, animation, rounded, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, animation, rounded, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };

