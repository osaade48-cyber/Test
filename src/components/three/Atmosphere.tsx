"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { ENVIRONMENT_HDRI } from "@/config/model";
import { useAnim } from "./animation";

const DAY_BG = new THREE.Color("#ebe7e0");
const DUSK_BG = new THREE.Color("#1a1f27");
const DAY_SUN = new THREE.Color("#fff6ea");
const DUSK_SUN = new THREE.Color("#ff9a62");
const DAY_SKY = new THREE.Color("#f4f1ea");
const DUSK_SKY = new THREE.Color("#6f7fa8");
const DAY_SUN_POS = new THREE.Vector3(-3.2, 5.8, 3.4);
const DUSK_SUN_POS = new THREE.Vector3(-5, 1.4, -2.5);

/**
 * Lighting, HDRI reflections, background and fog. Everything blends smoothly
 * between day and dusk from the shared animation value.
 */
export function Atmosphere({ shadowMapSize = 2048 }: { shadowMapSize?: number }) {
  const scene = useThree((s) => s.scene);
  const anim = useAnim();
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useLayoutEffect(() => {
    scene.background = DAY_BG.clone();
    scene.fog = new THREE.Fog(DAY_BG.clone(), 6, 16);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene]);

  useFrame(() => {
    const d = anim.current.dusk;
    (scene.background as THREE.Color).lerpColors(DAY_BG, DUSK_BG, d);
    (scene.fog as THREE.Fog).color.lerpColors(DAY_BG, DUSK_BG, d);
    scene.environmentIntensity = THREE.MathUtils.lerp(0.72, 0.12, d);
    if (sun.current) {
      sun.current.intensity = THREE.MathUtils.lerp(1.5, 0.35, d);
      sun.current.color.lerpColors(DAY_SUN, DUSK_SUN, d);
      sun.current.position.copy(tmp.lerpVectors(DAY_SUN_POS, DUSK_SUN_POS, d));
    }
    if (hemi.current) {
      hemi.current.intensity = THREE.MathUtils.lerp(0.35, 0.2, d);
      hemi.current.color.lerpColors(DAY_SKY, DUSK_SKY, d);
    }
  });

  return (
    <>
      <Environment files={ENVIRONMENT_HDRI} />
      <hemisphereLight ref={hemi} args={["#f4f1ea", "#5f6b55", 0.35]} />
      <directionalLight
        ref={sun}
        position={DAY_SUN_POS.toArray()}
        intensity={1.5}
        castShadow
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={6}
      >
        <orthographicCamera attach="shadow-camera" args={[-3.4, 3.4, 3.4, -3.4, 0.5, 16]} />
      </directionalLight>
    </>
  );
}
