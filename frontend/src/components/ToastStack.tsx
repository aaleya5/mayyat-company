import { useEffect } from "react";

export interface ToastData {
  id: number;
  message: string;
  variant: "success" | "error";
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: number) => void;
}

/**
 * Toast - a single dismissible notification.
 * Auto-dismisses after 4s. Rendered by <ToastStack>.
 */
function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.variant === "success";

  return (
    <div
      role="status"
      className={`flex items-start gap-3 border px-4 py-3 shadow-md ${
        isSuccess
          ? "border-success/30 bg-surface text-success"
          : "border-danger/30 bg-surface text-danger"
      }`}
    >
      <span className="mt-0.5 text-base">{isSuccess ? "✓" : "⚠️"}</span>
      <p className="flex-1 text-sm text-ink-text">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="border-none bg-transparent text-muted transition-colors hover:text-ink-text"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

interface ToastStackProps {
  toasts: ToastData[];
  onDismiss: (id: number) => void;
}

export default function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[1100] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}