import { useEffect } from 'react';
import { useToast } from './use-toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            backgroundColor: toast.variant === 'destructive' ? '#ef4444' : '#4a90e2',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '500' }}>
            {toast.title}
          </h4>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
            {toast.description}
          </p>
        </div>
      ))}
    </div>
  );
}

// Helper function to show toasts
export function showToast(message, type = "default") {
  const event = new CustomEvent("show-toast", {
    detail: { message, type },
  });
  window.dispatchEvent(event);
} 