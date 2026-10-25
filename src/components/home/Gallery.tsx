import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";

export const GALLERY = [
  { src: "/images/gallery/dusk-front.jpg", alt: "Charcoal home at dusk with the LED kit glowing under the roof and deck", caption: "Charcoal · Flat panel · at dusk", span: "md:col-span-7 md:row-span-2", ratio: "aspect-[4/5] md:aspect-auto md:h-full" },
  { src: "/images/gallery/white-day.jpg", alt: "White board-and-batten home with planter in daylight", caption: "White · Board & batten", span: "md:col-span-5", ratio: "aspect-[4/3]" },
  { src: "/images/gallery/interior.jpg", alt: "Birch ply interior with the premium washable bed", caption: "Birch ply interior", span: "md:col-span-5", ratio: "aspect-[4/3]" },
  { src: "/images/gallery/neutral-left.jpg", alt: "Neutral home from the left, with the side window and planted planter box", caption: "Neutral · Planter box", span: "md:col-span-4", ratio: "aspect-[4/3]" },
  { src: "/images/gallery/plaque.jpg", alt: "Engraved bronze name plaque on the timber-look sliding door", caption: "Engraved plaque", span: "md:col-span-4", ratio: "aspect-[4/3]" },
  { src: "/images/gallery/dusk-left.jpg", alt: "White home at dusk with warm light washing the planter", caption: "White · at dusk", span: "md:col-span-4", ratio: "aspect-[4/3]" },
];

/** Horizontal swipe on phones, an editorial grid on larger screens. */
export function Gallery() {
  return (
    <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-12 md:gap-4 md:overflow-visible md:px-0">
      {GALLERY.map((g, i) => (
        <Reveal key={g.src} delay={(i % 3) * 120} className={`w-[82vw] shrink-0 snap-center sm:w-[60vw] md:w-auto ${g.span}`}>
          <figure className="h-full">
            <div className={`relative overflow-hidden bg-paper-2 ${g.ratio}`}>
              <Image
                src={g.src}
                alt={g.alt}
                fill
                sizes="(min-width: 768px) 50vw, 82vw"
                className="object-cover transition-transform duration-[2400ms] ease-[var(--ease-lux)] hover:scale-[1.03]"
              />
            </div>
            <figcaption className="mt-3 text-xs tracking-wide text-muted">{g.caption}</figcaption>
          </figure>
        </Reveal>
      ))}
    </div>
  );
}
