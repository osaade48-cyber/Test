"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SceneProps } from "./Scene";

/**
 * Lazy wrapper for the 3D scene. three.js only downloads after the page is
 * interactive; until the first frame is ready an elegant loading state (and an
 * optional poster render) is shown, then the canvas fades in.
 */
const Scene = dynamic(() => import("./Scene"), { ssr: false, loading: () => null });

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

type Props = Omit<SceneProps, "onReady" | "paused"> & {
  poster?: string;
  /** Optional portrait poster for phones. */
  posterMobile?: string;
  posterAlt?: string;
  /** Loading caption, e.g. "Preparing your home". */
  caption?: string;
  tone?: "light" | "dark";
  className?: string;
  onReady?: () => void;
  /** Stop rendering (keeps the last frame), e.g. for still renders. */
  freeze?: boolean;
};

export function SceneView({ poster, posterMobile, posterAlt = "", caption = "Preparing your home", tone = "light", className = "", onReady, freeze = false, ...scene }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => setSupported(hasWebGL()), []);

  // Pause rendering when off screen or the tab is hidden.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let onScreen = true;
    const update = () => setVisible(onScreen && document.visibilityState === "visible");
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      update();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  const handleReady = useCallback(() => {
    setReady(true);
    onReady?.();
  }, [onReady]);

  const dark = tone === "dark";
  return (
    <div ref={ref} className={`relative overflow-hidden ${dark ? "bg-night" : "bg-[#ebe7e0]"} ${className}`}>
      {poster && (
        <Image
          src={poster}
          alt={posterAlt}
          fill
          priority
          sizes="100vw"
          className={`object-cover transition-opacity duration-[1600ms] ease-[var(--ease-lux)] ${posterMobile ? "hidden md:block" : ""} ${ready ? "opacity-0" : "opacity-100"}`}
        />
      )}
      {posterMobile && (
        <Image
          src={posterMobile}
          alt={posterAlt}
          fill
          priority
          sizes="100vw"
          className={`object-cover transition-opacity duration-[1600ms] ease-[var(--ease-lux)] md:hidden ${ready ? "opacity-0" : "opacity-100"}`}
        />
      )}
      {supported && (
        <div className={`absolute inset-0 transition-opacity duration-[1600ms] ease-[var(--ease-lux)] ${ready ? "opacity-100" : "opacity-0"}`}>
          <Scene {...scene} paused={!visible || freeze} onReady={handleReady} />
        </div>
      )}
      {/* Loading state */}
      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ease-[var(--ease-lux)] ${
          ready || supported === false ? "opacity-0" : "opacity-100"
        } ${poster ? "items-end pb-[18%]" : ""}`}
        aria-hidden={ready}
      >
        <div className={`flex flex-col items-center gap-4 ${dark || poster ? "text-paper/80" : "text-muted"}`}>
          <span className="eyebrow">{caption}</span>
          <span className={`relative block h-px w-28 overflow-hidden ${dark || poster ? "bg-paper/20" : "bg-ink/10"}`}>
            <span className={`loading-line absolute inset-y-0 left-0 w-1/3 ${dark || poster ? "bg-paper/80" : "bg-ink/60"}`} />
          </span>
        </div>
      </div>
      {supported === false && !poster && (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-muted">
          Your browser doesn’t support 3D graphics. You can still request a build and we’ll send renders of your configuration.
        </div>
      )}
    </div>
  );
}
