"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, N8AO, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode, type BloomEffect, type VignetteEffect } from "postprocessing";
import { useAnim } from "./animation";

/**
 * Post-processing: ambient occlusion (desktop), bloom for the dusk LEDs, neutral
 * tone mapping for accurate Colorbond colours, and a soft vignette at dusk.
 */
export function Effects({ ao }: { ao: boolean }) {
  const anim = useAnim();
  const bloom = useRef<BloomEffect>(null);
  const vignette = useRef<VignetteEffect>(null);

  useFrame(() => {
    const d = anim.current.dusk;
    if (bloom.current) {
      // In daylight nothing should bloom; at dusk only the LEDs exceed the threshold.
      bloom.current.luminanceMaterial.threshold = 6 - d * 5.1;
      bloom.current.intensity = 0.2 + d * 0.9;
    }
    if (vignette.current) vignette.current.darkness = 0.18 + d * 0.42;
  });

  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <>{ao && <N8AO halfRes aoRadius={0.28} intensity={0.8} distanceFalloff={0.6} quality="medium" />}</>
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={6} luminanceSmoothing={0.25} intensity={0.2} radius={0.7} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <Vignette ref={vignette} offset={0.3} darkness={0.18} />
    </EffectComposer>
  );
}
