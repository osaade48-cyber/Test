"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { TEXTURES } from "@/config/model";
import { COLOURS, type Config } from "@/lib/configurator";

export const ROOF_HEX = "#353638"; // Colorbond Monument-like charcoal
export const TRIM_HEX = "#262728";
export const LED_HEX = "#ffb56b";

export type DogHomeMaterials = ReturnType<typeof useDogHomeMaterials>;

function prepare(t: THREE.Texture, srgb: boolean, anisotropy = 8) {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = anisotropy;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}

/** Copy of a texture with grain rotated 90° (shares the image, no extra download). */
function rotated(t: THREE.Texture) {
  const c = t.clone();
  c.center.set(0.5, 0.5);
  c.rotation = Math.PI / 2;
  c.needsUpdate = true;
  return c;
}

/**
 * Physically based materials for the dog home. Created once per scene and updated
 * in place when options change, so switching colours never recompiles shaders.
 */
export function useDogHomeMaterials(config: Config) {
  const tex = useTexture(TEXTURES as unknown as Record<keyof typeof TEXTURES, string>);

  const mats = useMemo(() => {
    prepare(tex.timber, true);
    prepare(tex.timberNormal, false);
    prepare(tex.timberRoughness, false);
    prepare(tex.birch, true);
    prepare(tex.vinyl, true);
    prepare(tex.rubber, true);
    prepare(tex.rubberNormal, false);
    prepare(tex.claddingNormal, false);
    prepare(tex.soil, true);

    tex.claddingNormal.repeat.set(3, 3);

    // Colorbond: painted steel. A light clearcoat catches the HDRI reflections.
    const cladding = new THREE.MeshPhysicalMaterial({
      color: COLOURS[config.colour].hex,
      roughness: 0.48,
      metalness: 0.05,
      clearcoat: 0.35,
      clearcoatRoughness: 0.32,
      normalMap: tex.claddingNormal,
      normalScale: new THREE.Vector2(0.12, 0.12),
      envMapIntensity: 1,
    });
    const trim = new THREE.MeshPhysicalMaterial({
      color: TRIM_HEX,
      roughness: 0.5,
      metalness: 0.1,
      clearcoat: 0.2,
      clearcoatRoughness: 0.4,
    });
    const roof = new THREE.MeshPhysicalMaterial({
      color: ROOF_HEX,
      roughness: 0.55,
      metalness: 0.1,
      clearcoat: 0.08,
      clearcoatRoughness: 0.5,
      envMapIntensity: 0.7,
      normalMap: tex.claddingNormal,
      normalScale: new THREE.Vector2(0.1, 0.1),
    });

    // Timber-look aluminium (wood-grain powder coat): satin, subtle relief.
    const timberProps = (r: boolean): THREE.MeshPhysicalMaterialParameters => ({
      map: r ? rotated(tex.timber) : tex.timber,
      normalMap: r ? rotated(tex.timberNormal) : tex.timberNormal,
      roughnessMap: r ? rotated(tex.timberRoughness) : tex.timberRoughness,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: 0.85,
      metalness: 0.05,
      clearcoat: 0.15,
      clearcoatRoughness: 0.5,
    });
    /** Grain runs vertically on vertical parts (slats); rotated variant for horizontal boards. */
    const timber = new THREE.MeshPhysicalMaterial(timberProps(false));
    const timberH = new THREE.MeshPhysicalMaterial(timberProps(true));
    const deck = new THREE.MeshPhysicalMaterial({ ...timberProps(true), roughness: 0.95, clearcoat: 0, envMapIntensity: 0.6 });
    deck.color.set("#d8d0c8");

    const black = new THREE.MeshStandardMaterial({ color: "#151616", roughness: 0.6, metalness: 0.2 });
    const plinth = new THREE.MeshStandardMaterial({ color: "#1d1e1e", roughness: 0.8 });

    const glass = new THREE.MeshPhysicalMaterial({
      color: "#1b2126",
      roughness: 0.04,
      metalness: 0,
      transparent: true,
      opacity: 0.42,
      envMapIntensity: 2.2,
      emissive: new THREE.Color(LED_HEX),
      emissiveIntensity: 0,
      depthWrite: false,
    });

    // LED diffuser strips. Emissive intensity is animated with day/dusk; toneMapped
    // off so the strips exceed 1.0 and bloom softly.
    const led = new THREE.MeshStandardMaterial({
      color: "#e9e4dc",
      emissive: new THREE.Color(LED_HEX),
      emissiveIntensity: 0,
      roughness: 0.3,
      toneMapped: false,
    });

    const liningPly = new THREE.MeshStandardMaterial({ map: tex.birch, roughness: 0.75, side: THREE.BackSide });
    const liningWhite = new THREE.MeshStandardMaterial({ color: "#efede8", roughness: 0.85, side: THREE.BackSide });
    const floorVinyl = new THREE.MeshStandardMaterial({ map: tex.vinyl, roughness: 0.45, side: THREE.BackSide });
    const floorRubber = new THREE.MeshStandardMaterial({
      map: tex.rubber,
      normalMap: tex.rubberNormal,
      roughness: 0.92,
      side: THREE.BackSide,
    });
    const coveVinyl = new THREE.MeshStandardMaterial({ color: "#8a6648", roughness: 0.5 });
    const coveRubber = new THREE.MeshStandardMaterial({ color: "#2c2e2e", roughness: 0.9 });

    const soil = new THREE.MeshStandardMaterial({ map: tex.soil, roughness: 1 });
    const bed = new THREE.MeshStandardMaterial({ color: "#cfc6b6", roughness: 1 });
    const bedPiping = new THREE.MeshStandardMaterial({ color: "#a39887", roughness: 1 });

    return {
      cladding, trim, roof, timber, timberH, deck, black, plinth, glass, led,
      liningPly, liningWhite, floorVinyl, floorRubber, coveVinyl, coveRubber,
      soil, bed, bedPiping,
    };
    // Materials are created once; option changes are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex]);

  useEffect(() => {
    mats.cladding.color.set(COLOURS[config.colour].hex);
    // Pale colours need a touch more roughness to avoid looking plasticky.
    mats.cladding.roughness = config.colour === "charcoal" ? 0.45 : 0.52;
  }, [config.colour, mats]);

  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  return mats;
}
