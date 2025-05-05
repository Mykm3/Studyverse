import { forwardRef, useState, useEffect, useRef, Children, cloneElement } from "react"
import { cn } from "../../lib/utils"

// This is a simplified version for demonstration
// In a real project, you would use @radix-ui/react-dropdown-menu

const DropdownMenu = ({ children }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Clone children and pass open state and toggle function */}
      {Children.map(children, child => {
        if (!child) return null;
        
        if (child.type?.displayName === "DropdownMenuTrigger") {
          return cloneElement(child, {
            onClick: (e) => {
              e.stopPropagation();
              setOpen(!open);
            },
            'aria-expanded': open
          });
        }
        
        if (child.type?.displayName === "DropdownMenuContent") {
          return cloneElement(child, {
            open: open,
            onClose: () => setOpen(false)
          });
        }
        
        return child;
      })}
    </div>
  );
}

const DropdownMenuTrigger = forwardRef(({ className, asChild, ...props }, ref) => {
  const Comp = asChild ? "div" : "button"
  return <Comp ref={ref} className={cn("inline-flex w-full justify-center", className)} {...props} />
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = forwardRef(({ className, align = "end", open, onClose, ...props }, ref) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setMounted(true);
      }, 5);
      return () => clearTimeout(timer);
    } else {
      setMounted(false);
    }
  }, [open]);
  
  if (!open) return null;
  
  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-700 shadow-md transition-opacity duration-150",
        {
          "opacity-0": !mounted,
          "opacity-100": mounted,
          "right-1 top-0 -translate-y-[90%]": align === "end",
          "left-0 top-full mt-1": align === "start",
          "left-1/2 top-full mt-1 -translate-x-1/2": align === "center",
        },
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    />
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = forwardRef(({ className, onClick, ...props }, ref) => {
  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
      // Find the closest DropdownMenu component and close it
      const dropdownMenu = e.currentTarget.closest('[aria-expanded="true"]');
      if (dropdownMenu) {
        const event = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        document.dispatchEvent(event);
      }
    }
  };

  return (
    <button
      ref={ref}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 hover:bg-gray-100 hover:text-gray-900",
        className,
      )}
      onClick={handleClick}
      {...props}
    />
  )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }