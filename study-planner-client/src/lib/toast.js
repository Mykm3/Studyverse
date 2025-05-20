import { useToast as useToastHook } from "../components/ui/use-toast";

// This is a singleton pattern to provide toast functionality outside of React components
let toastFunction = null;

// Function to set the toast function from a component
export const setToastFunction = (fn) => {
  toastFunction = fn;
};

// Function to show toast notifications
export const showToast = ({ title, description, variant = 'default' }) => {
  if (toastFunction) {
    toastFunction({ title, description, variant });
  } else {
    console.warn('Toast function not initialized. Make sure to use ToastProvider.');
    console.info('Toast content:', { title, description, variant });
  }
};

// Hook to use inside components that provides both the toast function and setter
export const useToast = () => {
  const { toast, toasts } = useToastHook();
  
  // Set the toast function for use outside of components
  setToastFunction(toast);
  
  return { toast, toasts };
}; 