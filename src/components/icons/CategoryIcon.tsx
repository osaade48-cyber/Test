import { forwardRef, type SVGProps } from "react";
import { Baby, Bath, BedDouble, BookOpen, Milk, Shirt, ToyBrick } from "lucide-react";
import type { CategoryId } from "@/types/models";
import { cn } from "@/lib/cn";

type P = Omit<SVGProps<SVGSVGElement>, "ref"> & { size?: number | string };

/** Custom icons drawn on lucide's 24px grid with 2px round strokes so the set matches. */
const base = (size: number | string = 24) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const StrollerIcon = forwardRef<SVGSVGElement, P>(({ size, ...p }, ref) => (
  <svg ref={ref} {...base(size)} {...p}>
    <path d="M4 4h1.5l2 9" />
    <path d="M7.5 13h11a1 1 0 0 0 1-1.2A8 8 0 0 0 12 5v8" />
    <path d="M9 13l-1.5 4M17 13l1.5 4" />
    <circle cx="7" cy="19" r="2" />
    <circle cx="19" cy="19" r="2" />
  </svg>
));

export const CarSeatIcon = forwardRef<SVGSVGElement, P>(({ size, ...p }, ref) => (
  <svg ref={ref} {...base(size)} {...p}>
    <path d="M7 3h4a2 2 0 0 1 2 2v6l5 2a2 2 0 0 1 1.2 1.8V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M9 9v5h6" />
    <path d="M5 17h14" />
  </svg>
));

export const HighChairIcon = forwardRef<SVGSVGElement, P>(({ size, ...p }, ref) => (
  <svg ref={ref} {...base(size)} {...p}>
    <path d="M8 3v8h8V5" />
    <path d="M5 11h14" />
    <path d="M8 11l-3 10M16 11l3 10" />
    <path d="M6.5 16h11" />
  </svg>
));

export const CarrierIcon = forwardRef<SVGSVGElement, P>(({ size, ...p }, ref) => (
  <svg ref={ref} {...base(size)} {...p}>
    <circle cx="12" cy="5" r="2" />
    <path d="M7 3l2 6M17 3l-2 6" />
    <path d="M8 9h8l-1 8a3 3 0 0 1-6 0z" />
    <path d="M10 21h4" />
  </svg>
));

const MAP: Record<CategoryId, React.ElementType> = {
  clothing: Shirt,
  prams: StrollerIcon,
  "car-seats": CarSeatIcon,
  nursery: BedDouble,
  "high-chairs": HighChairIcon,
  feeding: Milk,
  carriers: CarrierIcon,
  toys: ToyBrick,
  books: BookOpen,
  bath: Bath,
};

export function CategoryIcon({ id, className, size = 20 }: { id: CategoryId | "all"; className?: string; size?: number }) {
  const Icon = id === "all" ? Baby : MAP[id];
  return <Icon size={size} className={className} aria-hidden />;
}

/** Category icon inside a soft rounded tile. */
export function CategoryTile({ id, className, size = 22 }: { id: CategoryId | "all"; className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center justify-center rounded-md bg-brand-soft text-brand", className)}>
      <CategoryIcon id={id} size={size} />
    </span>
  );
}
