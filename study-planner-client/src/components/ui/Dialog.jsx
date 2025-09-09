import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const Dialog = ({ open, onOpenChange, children, size = "md" }) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      // Store original body style
      const originalStyle = window.getComputedStyle(document.body).overflow;
      const originalHeight = document.body.style.height;
      
      // Lock scroll
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.documentElement.style.overflow = 'hidden';
      
      // Cleanup function to restore scroll
      return () => {
        document.body.style.overflow = originalStyle;
        document.body.style.height = originalHeight;
        document.documentElement.style.overflow = '';
      };
    }
  }, [open]);

  if (!open) return null;

  // Define size classes
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl"
  };

  // Render modal at document.body level to avoid parent container issues
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      {/* Modal content - prevent click through */}
      <div
        className={`relative bg-white rounded-lg shadow-lg w-full ${sizeClasses[size]} cursor-default`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

const DialogContent = ({ children, className = "" }) => {
  return (
    <div className={`p-6 max-h-[90vh] overflow-y-auto ${className}`}>
      {children}
    </div>
  );
};

const DialogHeader = ({ children, className = "" }) => {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
};

const DialogTitle = ({ children, className = "" }) => {
  return (
    <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h2>
  );
};

const DialogDescription = ({ children, className = "" }) => {
  return (
    <p className={`text-sm text-gray-600 mt-1 ${className}`}>
      {children}
    </p>
  );
};

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription };
export default Dialog;