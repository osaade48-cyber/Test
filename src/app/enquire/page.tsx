import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquire/EnquiryForm";
import { Container, PageHeader } from "@/components/ui/Section";
import { configFromParams } from "@/lib/configurator";
import { BRAND } from "@/config/brand";

export const metadata: Metadata = {
  title: "Enquire",
  description: `Request your build or reserve a build slot. ${BRAND.name} builds a limited number of homes each month, by enquiry only.`,
};

export default async function EnquirePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const config = configFromParams(sp);
  return (
    <>
      <PageHeader eyebrow="Enquire" title={<>Request your build.</>}>
        We build a limited number of homes each month. Tell us a little about your dog and your garden, and we’ll arrange a time to talk and visit.
      </PageHeader>
      <section className="pb-28 md:pb-40">
        <Container>
          <EnquiryForm config={config} initialIntent={sp.intent === "reserve" ? "reserve" : "consult"} />
        </Container>
      </section>
    </>
  );
}
