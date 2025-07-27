import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

// Dialog Context
const DialogContext = React.createContext();

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;

  return (
    <DialogContext.Provider value={{ onOpenChange }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
        <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );
}

export function DialogContent({ children, className = "" }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

export function DialogHeader({ children }) {
  return (
    <div className="mb-4">
      {children}
    </div>
  );
}

export function DialogTitle({ children, className = "" }) {
  return (
    <h2 className={`text-lg font-semibold ${className}`}>
      {children}
    </h2>
  );
}

export function DialogDescription({ children, className = "" }) {
  return (
    <p className={`text-sm text-gray-600 ${className}`}>
      {children}
    </p>
  );
}

export function DialogClose({ children, ...props }) {
  const { onOpenChange } = React.useContext(DialogContext);
  
  return (
    <Button
      variant="ghost"
      size="sm"
      className="absolute top-4 right-4 h-6 w-6 p-0"
      onClick={() => onOpenChange(false)}
      {...props}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </Button>
  );
} 