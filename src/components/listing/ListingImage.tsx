import type { CategoryId, ListingPhoto } from "@/types/models";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { cn } from "@/lib/cn";

const TINTS = [
  "bg-brand-soft text-brand",
  "bg-lilac-soft text-lilac",
  "bg-sky-soft text-sky",
  "bg-warn-soft text-warn",
  "bg-success-soft text-success",
];

/**
 * Renders a listing photo. Seed data uses `mock:<category>:<n>` placeholders,
 * drawn as a soft tile with the category icon instead of a fake photo.
 */
export function ListingImage({ photo, className, iconSize = 64, rounded = true }: { photo?: ListingPhoto; className?: string; iconSize?: number; rounded?: boolean }) {
  if (photo && !photo.url.startsWith("mock:")) {
    return <img src={photo.url} alt={photo.alt} loading="lazy" className={cn("h-full w-full object-cover", rounded && "rounded-[inherit]", className)} />;
  }
  const [, cat = "toys", n = "0"] = (photo?.url ?? "mock:toys:0").split(":");
  const tint = TINTS[(Number(n) + cat.length) % TINTS.length];
  return (
    <div role="img" aria-label={photo?.alt ?? "No photo"} className={cn("flex h-full w-full items-center justify-center", tint, className)}>
      <CategoryIcon id={cat as CategoryId} size={iconSize} className="opacity-70" />
    </div>
  );
}
