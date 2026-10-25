"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND } from "@/config/brand";

export const NAV = [
  { href: "/the-home", label: "The Home" },
  { href: "/configure", label: "Configure" },
  { href: "/process", label: "Process" },
  { href: "/faq", label: "FAQ" },
];

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const overHero = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > (overHero ? window.innerHeight * 0.7 : 24));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overHero]);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  if (pathname.startsWith("/render")) return null;

  const light = overHero && !scrolled && !open;
  const solid = !light && !open;

  return (
    <>
      <header
        className={[
          "fixed inset-x-0 top-0 z-50 transition-[background-color,color,border-color] duration-700 ease-[var(--ease-lux)]",
          "pt-[env(safe-area-inset-top)]",
          light ? "text-paper border-transparent" : "text-ink",
          solid ? "bg-paper/92 backdrop-blur-md border-b border-line/70" : "border-b border-transparent",
        ].join(" ")}
      >
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 md:h-20 md:px-10">
          <Link href="/" className="wordmark text-[0.95rem] md:text-[1.05rem]" aria-label={`${BRAND.name}, home`}>
            {BRAND.name}
          </Link>
          <nav className="hidden items-center gap-10 lg:flex" aria-label="Main">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`eyebrow transition-opacity duration-500 hover:opacity-100 ${pathname === n.href ? "opacity-100" : "opacity-70"}`}
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/enquire"
              className={`btn min-h-10 px-5 ${light ? "btn-outline-light" : "btn-outline"}`}
            >
              Enquire
            </Link>
          </nav>
          <button
            type="button"
            className="eyebrow -mr-2 p-2 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={[
          "fixed inset-0 z-40 flex flex-col bg-paper px-6 pt-28 pb-[max(2rem,env(safe-area-inset-bottom))] transition-opacity duration-700 ease-[var(--ease-lux)] lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        aria-hidden={!open}
      >
        <nav className="flex flex-col gap-5" aria-label="Mobile">
          {[{ href: "/", label: "Home" }, ...NAV, { href: "/enquire", label: "Enquire" }].map((n, i) => (
            <Link
              key={n.href}
              href={n.href}
              tabIndex={open ? 0 : -1}
              className="heading text-[2.6rem] transition-all duration-700 ease-[var(--ease-lux)]"
              style={{
                transitionDelay: open ? `${120 + i * 60}ms` : "0ms",
                opacity: open ? 1 : 0,
                transform: open ? "none" : "translateY(14px)",
              }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-line pt-6 text-sm text-muted">
          <p>By enquiry only. A limited number of homes each month.</p>
          <p className="mt-1">{BRAND.location}</p>
        </div>
      </div>
    </>
  );
}
