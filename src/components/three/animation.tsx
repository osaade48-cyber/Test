"use client";

import { createContext, useContext, useRef, type ReactNode, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";

/**
 * Smoothly animated scene values (0..1), shared by lights, materials and the door.
 * Components read them inside useFrame, so transitions never trigger React renders.
 */
export type Anim = { dusk: number; door: number; lights: number };

const AnimContext = createContext<RefObject<Anim> | null>(null);

export function useAnim() {
  const ctx = useContext(AnimContext);
  if (!ctx) throw new Error("useAnim must be used inside <AnimationProvider>");
  return ctx;
}

export function AnimationProvider({
  dusk,
  doorOpen,
  lights,
  children,
}: {
  dusk: boolean;
  doorOpen: boolean;
  lights: boolean;
  children: ReactNode;
}) {
  const ref = useRef<Anim>({ dusk: dusk ? 1 : 0, door: doorOpen ? 1 : 0, lights: lights ? 1 : 0 });
  useFrame((_, dt) => {
    const a = ref.current;
    const d = Math.min(dt, 0.1);
    easing.damp(a, "dusk", dusk ? 1 : 0, 0.8, d);
    easing.damp(a, "door", doorOpen ? 1 : 0, 0.42, d);
    easing.damp(a, "lights", lights ? 1 : 0, 0.25, d);
  }, -10);
  return <AnimContext.Provider value={ref}>{children}</AnimContext.Provider>;
}
