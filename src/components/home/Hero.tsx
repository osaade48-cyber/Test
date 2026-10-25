"use client";

import Link from "next/link";
import { SceneView } from "@/components/three/SceneView";
import { DEFAULT_CONFIG, type Config } from "@/lib/configurator";
import { BRAND } from "@/config/brand";

const HERO_CONFIG: Config = {
  ...DEFAULT_CONFIG,
  colour: "charcoal",
  addons: { deck: true, lights: true, planter: true, bed: false },
  plaque: "ARCHIE",
};

/** Full-screen hero: the home at dusk, LEDs glowing, slowly turning. */
export function Hero() {
  return (
    <section className="relative h-svh min-h-[560px] w-full overflow-hidden bg-night text-paper">
      <div className="absolute inset-0">
      <SceneView
        className="h-full w-full"
        config={HERO_CONFIG}
        dusk
        doorOpen
        mode="hero"
        tone="dark"
        poster="/images/hero-poster.jpg"
        posterMobile="/images/hero-poster-mobile.jpg"
        posterAlt="A charcoal modular dog home at dusk, its LED lights glowing warmly"
        caption="Architecture, for them"
      />
      </div>
      {/* legibility scrim */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night/85 via-night/10 to-night/30" />

      <div className="absolute inset-x-0 bottom-0 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:pb-20">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <p className="eyebrow fade-in-slow text-paper/70" style={{ animationDelay: "200ms" }}>
            Luxury modular dog homes · {BRAND.location.split(",")[0]}
          </p>
          <h1 className="display fade-in-slow mt-5 text-[3.4rem] sm:text-7xl md:text-[7.5rem]" style={{ animationDelay: "450ms" }}>
            {BRAND.tagline}
          </h1>
          <div className="fade-in-slow mt-8 flex flex-col gap-6 sm:flex-row sm:items-center md:mt-10" style={{ animationDelay: "800ms" }}>
            <p className="max-w-md text-[0.95rem] leading-relaxed text-paper/75">
              Designed, built and installed in Sydney. A limited number of homes each month, by enquiry only.
            </p>
            <div className="flex items-center gap-6 sm:ml-auto">
              <Link href="/configure" className="btn btn-light">
                Configure yours
              </Link>
              <Link href="/enquire" className="link-arrow text-paper">
                Request your build
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
