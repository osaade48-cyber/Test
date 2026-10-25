import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { Gallery } from "@/components/home/Gallery";
import { IconClean, IconInsulated, IconRaised, IconVentilated } from "@/components/home/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { Container, SectionIntro } from "@/components/ui/Section";
import { SIZES, formatAUD } from "@/lib/configurator";

const PRINCIPLES = [
  {
    title: "Proportion",
    body: "Low and wide, scaled to how dogs actually rest. A single skillion roof rises gently from left to right. Never a box with a pitched roof.",
  },
  {
    title: "Restraint",
    body: "Three panel colours, two finishes, one dark timber. Fewer choices, each one right, so every home sits quietly beside the house it belongs to.",
  },
  {
    title: "Permanence",
    body: "Aluminium, Colorbond and composite: materials made for the Australian outdoors, chosen to look as composed in ten years as on the day it arrives.",
  },
];

const MATERIALS = [
  { title: "Aluminium frame", body: "Rigid, light and rust-free. It won’t rot, warp or attract termites." },
  { title: "Colorbond cladding", body: "The steel Australians trust on their own roofs, in Surfmist, Dune or Monument." },
  { title: "Timber-look battens", body: "The warmth of dark timber in powder-coated aluminium. No oiling, no splinters." },
  { title: "Composite decking", body: "Dense, splinter-free boards that hose clean and never need staining." },
];

const CLIMATE = [
  { icon: IconInsulated, title: "Insulated", body: "Insulated walls and roof temper the heat of a Sydney summer and the chill of a winter night." },
  { icon: IconVentilated, title: "Ventilated", body: "A slatted front vent and rear vents keep air moving, with a deep overhang shading the entrance." },
  { icon: IconRaised, title: "Raised floor", body: "Lifted 150 mm off the ground, away from damp, radiant heat and insects." },
  { icon: IconClean, title: "Easy to clean", body: "A lift-off roof and a wipe-clean floor turned up 50 mm at the walls. Hose, wipe, done." },
];

const STEPS = [
  { n: "01", title: "Configure", body: "Design your home in 3D: size, colour, finish, interior and add-ons, with an indicative price as you go." },
  { n: "02", title: "Consult", body: "We talk through your dog and your garden, then visit to measure, check access and choose the right spot." },
  { n: "03", title: "Built", body: "Your home is built by hand in our Sydney workshop, in one of a limited number of monthly build slots." },
  { n: "04", title: "Installed", body: "Our own landscaping crew delivers and installs it, with optional base pad, drainage and planting." },
];

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Design philosophy */}
      <section className="py-28 md:py-44">
        <Container>
          <div className="grid gap-16 md:grid-cols-12">
            <div className="md:col-span-5">
              <SectionIntro eyebrow="Design philosophy" title={<>A considered place to rest.</>} />
            </div>
            <div className="md:col-span-6 md:col-start-7">
              <Reveal delay={120}>
                <p className="heading text-2xl leading-snug text-ink-soft md:text-[1.9rem]">
                  Most dog kennels are an afterthought. Ours begins as architecture: a low, wide form, a deep sheltering
                  overhang and a quiet palette chosen to sit beside your home rather than compete with it.
                </p>
              </Reveal>
            </div>
          </div>
          <div className="mt-20 grid gap-12 border-t border-line pt-12 md:mt-28 md:grid-cols-3 md:gap-16">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.title} delay={i * 140}>
                <p className="font-serif text-sm text-muted">0{i + 1}</p>
                <h3 className="heading mt-3 text-3xl">{p.title}</h3>
                <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">{p.body}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Craftsmanship & materials */}
      <section className="pb-28 md:pb-44">
        <Container>
          <div className="grid items-center gap-14 md:grid-cols-12 md:gap-10">
            <Reveal className="md:col-span-7">
              <div className="relative aspect-[4/5] overflow-hidden bg-paper-2 sm:aspect-[5/4]">
                <Image
                  src="/images/craft.jpg"
                  alt="Detail of the dark timber-look sliding door, engraved plaque and black-framed opening"
                  fill
                  sizes="(min-width: 768px) 58vw, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
            <div className="md:col-span-4 md:col-start-9">
              <SectionIntro eyebrow="Craftsmanship & materials" title={<>Made to stay outside.</>}>
                Built by hand in Sydney from materials that belong in the Australian outdoors. Every joint, reveal and
                edge is detailed the way we would detail a house.
              </SectionIntro>
              <dl className="mt-10 divide-y divide-line border-y border-line">
                {MATERIALS.map((m, i) => (
                  <Reveal key={m.title} delay={i * 90} className="py-5">
                    <dt className="text-sm font-medium">{m.title}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-muted">{m.body}</dd>
                  </Reveal>
                ))}
              </dl>
            </div>
          </div>
        </Container>
      </section>

      {/* Australian climate */}
      <section className="bg-paper-2 py-28 md:py-40">
        <Container>
          <SectionIntro eyebrow="Built for the Australian climate" title={<>Comfortable in every season.</>}>
            Sydney summers are long and its storms are sudden. Every home is insulated, ventilated and lifted off the
            ground as standard, not as an option.
          </SectionIntro>
          <div className="mt-16 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4 md:mt-24">
            {CLIMATE.map((c, i) => (
              <Reveal key={c.title} delay={i * 120}>
                <c.icon />
                <h3 className="heading mt-6 text-2xl">{c.title}</h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">{c.body}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="py-28 md:py-44">
        <Container>
          <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
            <SectionIntro eyebrow="How it works" title={<>From first sketch to first nap.</>} />
            <Reveal delay={200}>
              <Link href="/process" className="link-arrow shrink-0">
                The full process
              </Link>
            </Reveal>
          </div>
          <ol className="mt-16 grid gap-px bg-line md:mt-24 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 140} className="bg-paper py-8 md:px-8 md:py-10 md:first:pl-0">
                <p className="font-serif text-sm text-muted">{s.n}</p>
                <h3 className="heading mt-4 text-3xl">{s.title}</h3>
                <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">{s.body}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {/* Gallery */}
      <section className="pb-28 md:pb-44">
        <Container>
          <SectionIntro eyebrow="Gallery" title={<>Quietly at home.</>} className="mb-14 md:mb-20" />
          <Gallery />
        </Container>
      </section>

      {/* Final call to action */}
      <section className="relative overflow-hidden bg-night text-paper">
        <Image src="/images/gallery/dusk-front.jpg" alt="" fill sizes="100vw" className="object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/60 to-night/30" />
        <Container className="relative py-32 md:py-48">
          <div className="max-w-2xl">
            <Reveal>
              <p className="eyebrow text-paper/60">By enquiry only</p>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="display mt-6 text-5xl md:text-7xl">A limited number of homes, each month.</h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-8 max-w-lg text-[1.02rem] leading-relaxed text-paper/70">
                Medium from {formatAUD(SIZES.M.base)}, Large from {formatAUD(SIZES.L.base)}, inc. GST. Configure yours,
                or reserve a build slot and we’ll take it from there.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/configure" className="btn btn-light">
                  Configure your home
                </Link>
                <Link href="/enquire?intent=reserve" className="btn btn-outline-light">
                  Reserve a build slot
                </Link>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
