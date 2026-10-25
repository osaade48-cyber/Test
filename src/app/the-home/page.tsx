import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Elevation } from "@/components/home/Elevation";
import { Reveal } from "@/components/ui/Reveal";
import { Container, PageHeader, SectionIntro } from "@/components/ui/Section";
import { ADDONS, ADDON_KEYS, COLOURS, FLOORS, LININGS, LOOKS, SIZES, addonPrice, formatAUD, type SizeKey } from "@/lib/configurator";
import { specRows } from "@/lib/dimensions";

export const metadata: Metadata = {
  title: "The Home",
  description: "Specifications, dimensions and materials of our modular dog home, in Medium and Large.",
};

const STANDARD = [
  "Insulated walls and roof",
  "Raised floor, 150 mm above ground",
  "Slatted timber-look front vent, rear and side vents",
  "Lift-off roof for cleaning",
  "Wipe-clean floor, turned up 50 mm at the walls",
  "Dark timber-look sliding door on a top track",
  "Black-framed front opening and side window",
  "Engraved name plaque",
  "Installation by our own crew",
];

const MATERIALS: [string, string][] = [
  ["Frame", "Aluminium"],
  ["Cladding", "Colorbond steel / aluminium panels"],
  ["Roof", "Charcoal, standing-seam profile, deep front overhang"],
  ["Fascia & soffit", "Dark timber-look aluminium"],
  ["Vent, door & battens", "Dark timber-look aluminium battens"],
  ["Trim & frames", "Charcoal / black powder coat"],
  ["Deck (optional)", "Composite timber-look decking"],
];

export default function TheHomePage() {
  return (
    <>
      <PageHeader eyebrow="The Home" title={<>One design, in two sizes.</>}>
        A low, wide modular home with a skillion roof, a deep front overhang and a sliding timber-look door. Every
        home shares the same architecture, materials and details.
      </PageHeader>

      <section>
        <Container>
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden bg-paper-2 sm:aspect-[16/9]">
              <Image
                src="/images/the-home.jpg"
                alt="Charcoal modular dog home with deck and planter, seen from the front right in daylight"
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Sizes */}
      <section className="py-28 md:py-40">
        <Container>
          <SectionIntro eyebrow="Sizes" title={<>Sized to the dog, not the catalogue.</>}>
            Measured to let your dog stand, turn and stretch out fully, without so much volume that it loses its warmth.
          </SectionIntro>
          <div className="mt-16 grid gap-px bg-line md:mt-24 md:grid-cols-2">
            {(Object.keys(SIZES) as SizeKey[]).map((k, i) => {
              const s = SIZES[k];
              return (
                <Reveal key={k} delay={i * 140} className="bg-paper py-10 md:px-10 md:first:pl-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="heading text-5xl">{s.label}</h3>
                    <p className="text-sm text-muted">from {formatAUD(s.base)}</p>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{s.dogs}</p>
                  <div className="mt-10 text-ink">
                    <Elevation size={k} />
                  </div>
                  <dl className="mt-8 divide-y divide-line border-y border-line text-sm">
                    {specRows(k).map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-6 py-3">
                        <dt className="text-muted">{label}</dt>
                        <dd className="text-right tabular-nums">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>
              );
            })}
          </div>
          <p className="mt-6 text-xs text-muted">Dimensions are nominal and may vary slightly between builds.</p>
        </Container>
      </section>

      {/* Standard + materials */}
      <section className="bg-paper-2 py-28 md:py-40">
        <Container>
          <div className="grid gap-20 md:grid-cols-2 md:gap-24">
            <div>
              <SectionIntro eyebrow="Included as standard" title={<>Nothing essential is optional.</>} />
              <ul className="mt-12 divide-y divide-line border-y border-line">
                {STANDARD.map((s, i) => (
                  <Reveal as="li" key={s} delay={i * 50} className="py-4 text-[0.95rem] text-ink-soft">
                    {s}
                  </Reveal>
                ))}
              </ul>
            </div>
            <div>
              <SectionIntro eyebrow="Materials" title={<>Specified like a house.</>} />
              <dl className="mt-12 divide-y divide-line border-y border-line">
                {MATERIALS.map(([k, v], i) => (
                  <Reveal key={k} delay={i * 50} className="grid grid-cols-[9rem_1fr] gap-6 py-4 text-[0.95rem]">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-ink-soft">{v}</dd>
                  </Reveal>
                ))}
              </dl>
            </div>
          </div>
        </Container>
      </section>

      {/* Options */}
      <section className="py-28 md:py-40">
        <Container>
          <SectionIntro eyebrow="Options" title={<>A short list, on purpose.</>}>
            We keep the choices few so that every combination looks right.
          </SectionIntro>
          <div className="mt-16 grid gap-14 md:mt-24 md:grid-cols-2 lg:grid-cols-4">
            <Reveal>
              <h3 className="eyebrow text-muted">Panel colour</h3>
              <ul className="mt-6 space-y-4">
                {Object.values(COLOURS).map((c) => (
                  <li key={c.label} className="flex items-center gap-4">
                    <span className="h-8 w-8 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]" style={{ background: c.hex }} />
                    <span className="text-sm">
                      {c.label} <span className="text-muted">· Colorbond {c.colorbond}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={100}>
              <h3 className="eyebrow text-muted">Panel look</h3>
              <ul className="mt-6 space-y-3 text-sm">
                {Object.values(LOOKS).map((l) => (
                  <li key={l.label}>{l.label}</li>
                ))}
              </ul>
              <h3 className="eyebrow mt-10 text-muted">Inside walls</h3>
              <ul className="mt-6 space-y-3 text-sm">
                {Object.values(LININGS).map((l) => (
                  <li key={l.label}>{l.label}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={200}>
              <h3 className="eyebrow text-muted">Floor</h3>
              <ul className="mt-6 space-y-3 text-sm">
                {Object.values(FLOORS).map((f) => (
                  <li key={f.label} className="flex justify-between gap-4">
                    <span>{f.label}</span>
                    <span className="text-muted">{f.price ? `+${formatAUD(f.price)}` : "Included"}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={300}>
              <h3 className="eyebrow text-muted">Add-ons</h3>
              <ul className="mt-6 space-y-3 text-sm">
                {ADDON_KEYS.map((k) => (
                  <li key={k} className="flex justify-between gap-4">
                    <span>{ADDONS[k].label}</span>
                    <span className="text-right text-muted">
                      {k === "deck"
                        ? `+${formatAUD(addonPrice(k, "M"))} / ${formatAUD(addonPrice(k, "L"))}`
                        : `+${formatAUD(addonPrice(k, "L"))}`}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal delay={200}>
            <div className="mt-20 flex flex-col gap-4 sm:flex-row">
              <Link href="/configure" className="btn btn-primary">
                Configure your home
              </Link>
              <Link href="/enquire" className="btn btn-outline">
                Request your build
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
