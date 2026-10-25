"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/config/brand";
import { NAV } from "./Header";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/render") || pathname.startsWith("/configure")) return null;
  return (
    <footer className="border-t border-line bg-paper-2">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-16 md:grid-cols-12 md:px-10 md:py-24">
        <div className="md:col-span-5">
          <p className="wordmark text-lg">{BRAND.name}</p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
            Luxury modular dog homes, designed, built and installed in {BRAND.serviceArea}. By enquiry only.
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-x-8 gap-y-3 md:col-span-4" aria-label="Footer">
          {[...NAV, { href: "/enquire", label: "Enquire" }].map((n) => (
            <Link key={n.href} href={n.href} className="text-sm text-ink-soft transition-colors duration-500 hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 text-sm text-ink-soft md:col-span-3">
          <p className="eyebrow mb-4 text-muted">Studio</p>
          <p>{BRAND.location}</p>
          {BRAND.email && (
            <p>
              <a href={`mailto:${BRAND.email}`} className="hover:text-ink">
                {BRAND.email}
              </a>
            </p>
          )}
          {BRAND.phone && (
            <p>
              <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`} className="hover:text-ink">
                {BRAND.phone}
              </a>
            </p>
          )}
          {BRAND.instagram && (
            <p>
              <a href={`https://instagram.com/${BRAND.instagram.replace("@", "")}`} className="hover:text-ink" target="_blank" rel="noreferrer">
                Instagram
              </a>
            </p>
          )}
        </div>
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-2 border-t border-line px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-xs text-muted md:flex-row md:justify-between md:px-10">
        <p>
          © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </p>
        <p>Prices are indicative and include GST.</p>
      </div>
    </footer>
  );
}
