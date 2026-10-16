import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./Button";

// ─── Toasts ────────────────────────────────────────────────────────────────

interface ToastItem {
  id: number;
  message: string;
  tone: "success" | "error";
}

const ToastCtx = createContext<(message: string, tone?: ToastItem["tone"]) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const show = useCallback((message: string, tone: ToastItem["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s.slice(-2), { id, message, tone }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 2800);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-8" aria-live="polite" role="status">
          {items.map((t) => (
            <div key={t.id} className="pointer-events-auto flex animate-toast-in items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-body text-on-ink shadow-pop">
              {t.tone === "success" ? <CheckCircle2 className="h-4 w-4 text-success-soft" aria-hidden /> : <AlertCircle className="h-4 w-4 text-danger-soft" aria-hidden />}
              {t.message}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

// ─── Modal / bottom sheet ──────────────────────────────────────────────────

function useLockScroll(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const on = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [open, onClose]);
}

function useFocusFirst(open: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => {
      const el = ref.current?.querySelector<HTMLElement>("input, textarea, select, button:not([data-close])") ?? ref.current;
      el?.focus();
    }, 30);
    return () => {
      clearTimeout(t);
      prev?.focus?.();
    };
  }, [open]);
  return ref;
}

/** Bottom sheet on mobile, centred dialog on desktop. */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}) {
  useLockScroll(open);
  useEscape(open, onClose);
  const ref = useFocusFirst(open);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-6">
      <div className="absolute inset-0 animate-fade bg-black/40" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92vh] w-full animate-sheet-in flex-col rounded-t-xl bg-surface shadow-pop md:animate-fade md:rounded-xl",
          size === "md" ? "md:max-w-lg" : "md:max-w-2xl",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-2">
          <h2 className="text-h2">{title}</h2>
          <IconButton label="Close" onClick={onClose} data-close>
            <X className="h-5 w-5" />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Right-hand side drawer (filters). */
export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  useLockScroll(open);
  useEscape(open, onClose);
  const ref = useFocusFirst(open);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 animate-fade bg-black/40" onClick={onClose} aria-hidden />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="relative flex h-full w-full max-w-md animate-drawer-in flex-col bg-surface shadow-pop">
        <div className="flex items-center justify-between border-b border-line px-5 py-2">
          <h2 className="text-h2">{title}</h2>
          <IconButton label="Close filters" onClick={onClose} data-close>
            <X className="h-5 w-5" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
