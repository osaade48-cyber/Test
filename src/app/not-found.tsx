import Link from "next/link";
import { Container } from "@/components/ui/Section";

export default function NotFound() {
  return (
    <section className="flex min-h-[80svh] items-center pt-24">
      <Container>
        <p className="eyebrow text-muted">Not found</p>
        <h1 className="display mt-6 text-6xl md:text-8xl">This page has wandered off.</h1>
        <Link href="/" className="link-arrow mt-12">
          Return home
        </Link>
      </Container>
    </section>
  );
}
