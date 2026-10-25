import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Container, PageHeader } from "@/components/ui/Section";
import { BRAND } from "@/config/brand";
import { SIZES, formatAUD } from "@/lib/configurator";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about our modular dog homes: sizing, climate, cleaning, pricing, installation and more.",
};

const FAQS: { group: string; items: { q: string; a: string }[] }[] = [
  {
    group: "The home",
    items: [
      {
        q: "Which size is right for my dog?",
        a: `Medium suits dogs of roughly 10–25 kg and Large suits 25–45 kg. As a guide, your dog should be able to stand, turn around and lie fully stretched out. If your dog sits between sizes, tell us their breed and measurements and we’ll advise.`,
      },
      {
        q: "Will it stay comfortable in a Sydney summer?",
        a: "Every home has insulated walls and roof, a slatted front vent with rear and side vents for cross-ventilation, and a deep front overhang to shade the entrance. The raised floor keeps it off hot ground. During the site visit we’ll also suggest the best position for shade and breeze.",
      },
      {
        q: "And in heavy rain?",
        a: "The floor is raised 150 mm off the ground, the roof overhangs on all sides, and the Colorbond cladding and aluminium frame are made for the Australian weather. Optional drainage works can be added if water collects where the home will sit.",
      },
      {
        q: "How do I clean it?",
        a: "The roof lifts off for full access. The floor is wipe-clean and turned up 50 mm at the walls, so it can be wiped or hosed out without water reaching the wall linings. The premium bed has a removable, washable cover.",
      },
      {
        q: "Can I choose other colours or materials?",
        a: "We keep the palette deliberately short so that every home looks right. If you have a specific need, mention it in your enquiry and we’ll tell you honestly what’s possible.",
      },
    ],
  },
  {
    group: "Pricing & ordering",
    items: [
      {
        q: "How much does it cost?",
        a: `Medium starts from ${formatAUD(SIZES.M.base)} and Large from ${formatAUD(SIZES.L.base)}, including GST. The configurator shows an indicative price as you choose options. Your final quote, including installation and any site works, is confirmed after the site visit.`,
      },
      {
        q: "Why is it by enquiry only?",
        a: "Every home is made to order and installed on site by our own crew, so we take on a limited number each month. Speaking with you first means we can get the size, position and groundwork right.",
      },
      {
        q: "How long does it take?",
        a: `Once your build slot is confirmed, building typically takes ${BRAND.buildWeeks}. Installation is ${BRAND.installTime}, plus any site works we’ve agreed.`,
      },
      {
        q: "What does reserving a build slot mean?",
        a: "It tells us you’re ready to proceed. We’ll prioritise your site visit and hold a place in the build schedule while we confirm the details with you.",
      },
    ],
  },
  {
    group: "Installation",
    items: [
      {
        q: "Where do you install?",
        a: `We install across ${BRAND.serviceArea}. If you’re further afield, get in touch and we’ll let you know if we can help.`,
      },
      {
        q: "Who installs it?",
        a: "Our own landscaping and excavation crew, never a courier or subcontractor. They can also prepare a base pad, drainage and planting at the same visit.",
      },
      {
        q: "Do I need council approval?",
        a: "Requirements depend on your property and council. We’ll talk this through during the site visit, and let you know if anything needs to be checked before installation.",
      },
      {
        q: "Can it be moved later?",
        a: "Yes. The home is modular, so it can be relocated within your garden, or to a new home. Ask us and our crew can do this for you.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHeader eyebrow="FAQ" title={<>Questions, answered.</>}>
        If you can’t find what you’re looking for, <Link href="/enquire" className="underline decoration-line underline-offset-4 hover:decoration-ink">ask us directly</Link>.
      </PageHeader>
      <section className="pb-28 md:pb-40">
        <Container>
          <div className="space-y-20">
            {FAQS.map((g) => (
              <div key={g.group} className="grid gap-8 md:grid-cols-12">
                <Reveal className="md:col-span-4">
                  <h2 className="eyebrow text-muted">{g.group}</h2>
                </Reveal>
                <div className="border-t border-line md:col-span-8">
                  {g.items.map((f, i) => (
                    <Reveal key={f.q} delay={i * 60}>
                      <details className="group border-b border-line">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                          <span className="heading text-2xl md:text-[1.7rem]">{f.q}</span>
                          <span
                            aria-hidden
                            className="relative mt-3 h-3 w-3 shrink-0 before:absolute before:top-1/2 before:left-0 before:h-px before:w-3 before:bg-ink after:absolute after:top-0 after:left-1/2 after:h-3 after:w-px after:bg-ink after:transition-transform after:duration-500 group-open:after:scale-y-0"
                          />
                        </summary>
                        <p className="max-w-2xl pb-8 text-[0.98rem] leading-relaxed text-ink-soft">{f.a}</p>
                      </details>
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
