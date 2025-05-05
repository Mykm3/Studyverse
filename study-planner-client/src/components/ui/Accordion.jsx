import { useState, createContext, useContext } from "react";
import { cn } from "../../lib/utils";
import { ChevronDown } from "lucide-react";

const AccordionContext = createContext(null);

export const Accordion = ({ children, type = "single", className, ...props }) => {
  const [openItems, setOpenItems] = useState(new Set());

  const toggleItem = (value) => {
    const newOpenItems = new Set(openItems);
    
    if (type === "single") {
      if (openItems.has(value)) {
        newOpenItems.clear();
      } else {
        newOpenItems.clear();
        newOpenItems.add(value);
      }
    } else {
      if (openItems.has(value)) {
        newOpenItems.delete(value);
      } else {
        newOpenItems.add(value);
      }
    }
    
    setOpenItems(newOpenItems);
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className={cn("space-y-2", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

export const AccordionItem = ({ children, value, className, ...props }) => {
  return (
    <div
      className={cn("border border-border rounded-lg overflow-hidden bg-card shadow-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const AccordionTrigger = ({ children, className, value, ...props }) => {
  const { openItems, toggleItem } = useContext(AccordionContext);
  const isOpen = openItems.has(value);

  return (
    <button
      type="button"
      onClick={() => toggleItem(value)}
      className={cn(
        "flex w-full items-center justify-between p-4 font-medium text-left transition-colors hover:bg-muted/30 dark:hover:bg-muted/20",
        isOpen && "border-b border-border",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", {
          "transform rotate-180": isOpen,
        })}
      />
    </button>
  );
};

export const AccordionContent = ({ children, className, value, ...props }) => {
  const { openItems } = useContext(AccordionContext);
  const isOpen = openItems.has(value);

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-300",
        isOpen ? "max-h-96" : "max-h-0"
      )}
      {...props}
    >
      {isOpen && <div className={cn("p-4 pt-0", className)}>{children}</div>}
    </div>
  );
}; 