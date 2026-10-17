import { type ReactNode } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/orderState";
import { initials } from "@/lib/format";

const toneClass: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  info: "bg-sky-soft text-sky",
  success: "bg-success-soft text-success",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  lilac: "bg-lilac-soft text-lilac",
};

export function Badge({ tone = "neutral", children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-caption font-medium whitespace-nowrap", toneClass[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

/** Selectable filter chip — 44px tall for touch. */
export function Chip({
  active,
  children,
  onClick,
  icon,
  className,
  label,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "inline-flex min-h-tap shrink-0 items-center gap-2 rounded-full border px-4 text-body font-medium press snap-start",
        active ? "border-ink bg-ink text-on-ink" : "border-line bg-surface text-ink hover:bg-surface-2",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-surface-2", className)} aria-hidden>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-surface/60 to-transparent" />
    </div>
  );
}

export function Avatar({ name, color, size = 36, className }: { name: string; color: string; size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white", className)}
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function Stars({ rating, size = 14, className }: { rating: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating.toFixed(1)} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} width={size} height={size} className={i <= Math.round(rating) ? "fill-warn text-warn" : "text-line"} aria-hidden />
      ))}
    </span>
  );
}

export function SectionHeader({ title, action, count }: { title: string; action?: ReactNode; count?: number }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="text-h2">
        {title}
        {count != null && <span className="ml-2 font-sans text-caption font-normal text-muted">{count} items</span>}
      </h2>
      {action}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; count?: number }[];
  className?: string;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn("inline-flex rounded-full bg-surface-2 p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-body font-medium transition",
            value === o.value ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
          {o.count != null && <span className="text-caption text-muted">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex min-h-tap cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block text-body font-medium">{label}</span>
        {description && <span className="block text-caption text-muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn("relative h-7 w-12 shrink-0 rounded-full transition", checked ? "bg-ink" : "bg-line")}
      >
        <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-surface shadow transition-all", checked ? "left-6" : "left-1")} />
      </button>
    </label>
  );
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-caption text-danger">{error}</p> : hint ? <p className="mt-1 text-caption text-muted">{hint}</p> : null}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("card p-4 md:p-5", className)}>{children}</div>;
}

export function Notice({ tone = "info", icon, title, children, className }: { tone?: Tone; icon?: ReactNode; title?: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex gap-3 rounded-md p-3.5 text-caption", toneClass[tone], className)} role={tone === "danger" || tone === "warn" ? "alert" : undefined}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "text-ink/80")}>{children}</div>}
      </div>
    </div>
  );
}
