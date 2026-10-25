"use client";

import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerformanceMonitor, AdaptiveDpr } from "@react-three/drei";
import type { Config } from "@/lib/configurator";
import { AnimationProvider } from "./animation";
import { Atmosphere } from "./Atmosphere";
import { CameraRig, FOV, type Focus } from "./CameraRig";
import { DogHome } from "./DogHome";
import { Effects } from "./Effects";
import { Garden } from "./Garden";

export type SceneProps = {
  config: Config;
  dusk: boolean;
  doorOpen: boolean;
  mode: "hero" | "configurator" | "still";
  focus?: Focus;
  focusKey?: number;
  /** Pause rendering (e.g. when scrolled off screen) to save battery. */
  paused?: boolean;
  heroLift?: number;
  onReady?: () => void;
};

function Ready({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    // Two frames after everything has loaded, so the first visible frame is complete.
    const id = requestAnimationFrame(() => requestAnimationFrame(() => onReady?.()));
    return () => cancelAnimationFrame(id);
  }, [onReady]);
  return null;
}

function isLowPower() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 820;
}

/**
 * The full 3D scene: model, garden, lighting, camera and effects. Loaded lazily
 * (next/dynamic, ssr: false) by SceneLoader so it never blocks the page.
 */
export default function Scene({
  config,
  dusk,
  doorOpen,
  mode,
  focus = "overview",
  focusKey = 0,
  paused = false,
  heroLift = 0,
  onReady,
}: SceneProps) {
  const [lowPower] = useState(isLowPower);
  const [degraded, setDegraded] = useState(false);
  const maxDpr = mode === "still" ? 2 : lowPower ? 1.5 : 2;

  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, degraded ? 1.25 : maxDpr]}
      frameloop={paused ? "never" : "always"}
      camera={{ fov: FOV, near: 0.05, far: 60, position: [4, 1.6, 4.5] }}
      gl={{
        antialias: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: mode === "still",
        toneMapping: THREE.NoToneMapping,
      }}
      style={{ touchAction: mode === "configurator" ? "none" : "auto" }}
      aria-hidden
    >
      <PerformanceMonitor onDecline={() => setDegraded(true)} flipflops={2} />
      <AdaptiveDpr pixelated={false} />
      <Suspense fallback={null}>
        <AnimationProvider dusk={dusk} doorOpen={doorOpen} lights={config.addons.lights}>
          <Atmosphere shadowMapSize={lowPower ? 1024 : 2048} />
          <DogHome config={config} />
          <Garden config={config} />
          <CameraRig focus={focus} focusKey={focusKey} size={config.size} doorOpen={doorOpen} mode={mode} heroLift={heroLift} />
          <Effects ao={!lowPower && !degraded} />
          <Ready onReady={onReady} />
        </AnimationProvider>
      </Suspense>
      {mode === "configurator" && (
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.07}
          rotateSpeed={0.55}
          zoomSpeed={0.6}
          minDistance={1.6}
          maxDistance={10}
          minPolarAngle={Math.PI * 0.18}
          maxPolarAngle={Math.PI * 0.485}
        />
      )}
    </Canvas>
  );
}
