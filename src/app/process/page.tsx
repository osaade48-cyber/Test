import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Container, PageHeader, SectionIntro } from "@/components/ui/Section";
import { BRAND } from "@/config/brand";

export const metadata: Metadata = {
  title: "Process",
  description: "From enquiry and site visit to build and installation by our own landscaping crew, with optional site works.",
};

const STEPS = [
  {
    n: "01",
    title: "Enquiry",
    lead: "Configure your home and send it to us, or simply get in touch.",
    body: `We read every enquiry personally and reply ${BRAND.responseTime}. We’ll ask a little about your dog, your garden and your timing, and answer anything you’d like to know.`,
  },
  {
    n: "02",
    title: "Site visit",
    lead: "We come to you, measure, and find the right place for it.",
    body: "We look at access, levels, drainage, sun and shade, and how the home will sit with your house and garden. You receive a fixed quote for the home, installation and any site works.",
  },
  {
    n: "03",
    title: "Your build slot",
    lead: "We build a limited number of homes each month.",
    body: "Once you approve the quote, we reserve your build slot. Your home is made to order in our Sydney workshop, which typically takes " +
      BRAND.buildWeeks +
      ". We’ll keep you updated as it comes together.",
  },
  {
    n: "04",
    title: "Installation",
    lead: "Installed by our own landscaping crew, never a courier.",
    body: `The same team that builds gardens across Sydney delivers, levels and installs your home, ${BRAND.installTime}. We leave the site clean, and your dog’s new home ready to use.`,
  },
];

const SITE_WORKS = [
  {
    title: "Base pad",
    body: "A level, free-draining foundation: honed concrete pavers, a concrete slab or compacted crushed rock, matched to your garden.",
  },
  {
    title: "Drainage",
    body: "Ag drains, grated channels or regrading where water gathers, so the home and its surroundings stay dry after a storm.",
  },
  {
    title: "Planting",
    body: "Considered planting around the home and in the planter box: hardy ornamental grasses and natives that suit the aspect.",
  },
  {
    title: "Paths & edging",
    body: "Stepping stones, gravel or a short paved path to the home, with clean steel or stone edging.",
  },
];

export default function ProcessPage() {
  return (
    <>
      <PageHeader eyebrow="Process" title={<>Unhurried, from first conversation to installation.</>}>
        We are a Sydney landscaping and excavation business first. That means every home is installed properly, on
        properly prepared ground, by people who do this every day.
      </PageHeader>

      <section className="pb-28 md:pb-40">
        <Container>
          <ol className="border-t border-line">
            {STEPS.map((s) => (
              <Reveal as="li" key={s.n} className="grid gap-6 border-b border-line py-12 md:grid-cols-12 md:gap-10 md:py-16">
                <p className="font-serif text-sm text-muted md:col-span-1">{s.n}</p>
                <h2 className="heading text-4xl md:col-span-4 md:text-5xl">{s.title}</h2>
                <div className="md:col-span-6 md:col-start-7">
                  <p className="heading text-2xl leading-snug text-ink">{s.lead}</p>
                  <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <section className="bg-paper-2 py-28 md:py-40">
        <Container>
          <SectionIntro eyebrow="Optional site works" title={<>The ground beneath it matters.</>}>
            Because installation is done by our own landscaping crew, we can prepare the site at the same time. Site
            works are optional and quoted after the site visit.
          </SectionIntro>
          <div className="mt-16 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4 md:mt-24">
            {SITE_WORKS.map((w, i) => (
              <Reveal key={w.title} delay={i * 120} className="bg-paper-2 py-8 sm:px-8 sm:first:pl-0">
                <h3 className="heading text-3xl">{w.title}</h3>
                <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">{w.body}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-28 md:py-40">
        <Container className="flex flex-col items-start gap-10 md:flex-row md:items-end md:justify-between">
          <SectionIntro title={<>Begin with a conversation.</>}>
            Configure your home first, or send us a note and we’ll start from there.
          </SectionIntro>
          <Reveal delay={200} className="flex flex-col gap-4 sm:flex-row">
            <Link href="/configure" className="btn btn-primary">
              Configure your home
            </Link>
            <Link href="/enquire" className="btn btn-outline">
              Enquire
            </Link>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
