import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleCustomEvent = (event) => {
      const { message, type = "default" } = event.detail;
      const id = Date.now();
      
      setToasts((prev) => [...prev, { id, message, type }]);
      
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 3000);
    };

    window.addEventListener("show-toast", handleCustomEvent);
    return () => window.removeEventListener("show-toast", handleCustomEvent);
  }, []);

  return createPortal(
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg px-4 py-2 text-white shadow-lg transform transition-all duration-300 ${
            toast.type === "error"
              ? "bg-red-500"
              : toast.type === "success"
              ? "bg-green-500"
              : "bg-gray-800"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>,
    document.body
  );
}

// Helper function to show toasts
export function showToast(message, type = "default") {
  const event = new CustomEvent("show-toast", {
    detail: { message, type },
  });
  window.dispatchEvent(event);
} 