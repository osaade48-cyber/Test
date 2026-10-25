import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1440px] px-5 md:px-10 ${className}`}>{children}</div>;
}

/** Eyebrow + serif heading + optional lede, used to open each section. */
export function SectionIntro({
  eyebrow,
  title,
  children,
  align = "left",
  tone = "light",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
}) {
  const center = align === "center";
  return (
    <div className={`${center ? "mx-auto text-center" : ""} max-w-2xl ${className}`}>
      {eyebrow && (
        <Reveal>
          <p className={`eyebrow mb-6 ${tone === "dark" ? "text-paper/60" : "text-muted"}`}>{eyebrow}</p>
        </Reveal>
      )}
      <Reveal delay={80}>
        <h2 className="heading text-[2.4rem] leading-[1.04] sm:text-5xl md:text-[3.6rem]">{title}</h2>
      </Reveal>
      {children && (
        <Reveal delay={160}>
          <div className={`lede mt-7 ${tone === "dark" ? "!text-paper/70" : ""}`}>{children}</div>
        </Reveal>
      )}
    </div>
  );
}

/** Page header for inner pages. */
export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <section className="pt-36 pb-16 md:pt-48 md:pb-24">
      <Container>
        <Reveal>
          <p className="eyebrow mb-6 text-muted">{eyebrow}</p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="display max-w-4xl text-[3.2rem] sm:text-6xl md:text-[5.5rem]">{title}</h1>
        </Reveal>
        {children && (
          <Reveal delay={180}>
            <div className="lede mt-8 max-w-2xl">{children}</div>
          </Reveal>
        )}
      </Container>
    </section>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="18" height="10" viewBox="0 0 18 10" fill="none" aria-hidden>
      <path d="M0 5h16.5M12.5 1l4 4-4 4" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
