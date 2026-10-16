import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * `brand` (gradient) is reserved for the primary Sell / List action and Kindo Pro.
 * Everything else uses `primary` (solid ink) or `secondary`.
 */
export type ButtonVariant = "primary" | "brand" | "secondary" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-on-ink hover:bg-ink/90",
  brand: "bg-brand-gradient text-white shadow-card hover:brightness-105",
  secondary: "bg-surface text-ink border border-line hover:bg-surface-2",
  ghost: "text-ink hover:bg-surface-2",
  danger: "bg-danger text-white hover:bg-danger/90",
  soft: "bg-lilac-soft text-lilac hover:bg-lilac-soft/70",
};

const sizes: Record<Size, string> = {
  sm: "min-h-[36px] px-3 text-caption gap-1.5 rounded-sm",
  md: "min-h-tap px-4 text-body gap-2 rounded-md",
  lg: "min-h-[52px] px-6 text-body gap-2 rounded-md font-semibold",
};

interface Common {
  variant?: ButtonVariant;
  size?: Size;
  icon?: ReactNode;
  full?: boolean;
  loading?: boolean;
}

export const buttonClass = ({ variant = "primary", size = "md", full }: Common) =>
  cn(
    "inline-flex items-center justify-center font-medium press select-none disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
    variants[variant],
    sizes[size],
    full && "w-full",
  );

export const Button = forwardRef<HTMLButtonElement, Common & ButtonHTMLAttributes<HTMLButtonElement>>(function Button(
  { variant, size, icon, full, loading, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cn(buttonClass({ variant, size, full }), className)} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

export function ButtonLink({ variant, size, icon, full, className, children, ...rest }: Common & LinkProps) {
  return (
    <Link className={cn(buttonClass({ variant, size, full }), className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

/** Square icon-only button. `label` is required for screen readers. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  { label: string; variant?: "plain" | "surface" | "overlay"; badge?: number } & ButtonHTMLAttributes<HTMLButtonElement>
>(function IconButton({ label, variant = "plain", badge, className, children, type = "button", ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={badge ? `${label} (${badge})` : label}
      title={label}
      className={cn(
        "inline-flex h-tap w-tap shrink-0 items-center justify-center rounded-full press text-ink",
        badge != null && "relative",
        variant === "plain" && "hover:bg-surface-2",
        variant === "surface" && "bg-surface border border-line hover:bg-surface-2",
        variant === "overlay" && "bg-surface/90 backdrop-blur shadow-card hover:bg-surface",
        className,
      )}
      {...rest}
    >
      {children}
      {!!badge && (
        <span className="absolute right-1 top-1 min-w-[18px] rounded-full bg-brand px-1 text-[11px] font-semibold leading-[18px] text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
});
