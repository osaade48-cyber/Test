"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { MODEL } from "@/config/model";
import { dimensions } from "@/lib/dimensions";
import { useAnim } from "../animation";
import { useDogHomeMaterials } from "../materials";
import { ModelLights } from "./Lighting";
import type { DogHomeModelProps } from "./types";

/**
 * Adapter for a professionally made .glb model. See docs/3D-MODEL.md.
 *
 * Node names drive behaviour (case-insensitive prefix match):
 *   Cladding*  → panel colour material       Trim*    → charcoal trim
 *   Roof*      → charcoal roof top            Timber*  → dark timber-look
 *   Glass*     → window glass                 LED*     → LED strips (shown with the lighting kit)
 *   Lining*    → inside wall material         Floor*   → floor material
 *   Battens*   → shown only for Board & batten
 *   Deck*, Planter*, Bed*  → shown only when that add-on is selected
 *   Door       → slides along +x by `door_travel` (custom property, metres) or 0.75 m
 *   Plaque     → keeps its own material (text is not applied to GLB plaques yet)
 */
export function GlbDogHome({ config }: DogHomeModelProps) {
  const { scene } = useGLTF(MODEL.glb[config.size]);
  const mats = useDogHomeMaterials(config);
  const dims = useMemo(() => dimensions(config.size), [config.size]);
  const anim = useAnim();
  const model = useMemo(() => scene.clone(true), [scene]);

  const door = useMemo(() => {
    let d: THREE.Object3D | undefined;
    model.traverse((o) => {
      if (!d && /^door$/i.test(o.name)) d = o;
    });
    return d ? { node: d, x0: d.position.x, travel: Number(d.userData?.door_travel) || 0.75 } : null;
  }, [model]);

  useEffect(() => {
    const has = (o: THREE.Object3D, prefix: string) => o.name.toLowerCase().startsWith(prefix);
    model.traverse((o) => {
      if (has(o, "deck")) o.visible = config.addons.deck;
      if (has(o, "planter")) o.visible = config.addons.planter;
      if (has(o, "bed")) o.visible = config.addons.bed;
      if (has(o, "led")) o.visible = config.addons.lights;
      if (has(o, "battens")) o.visible = config.look === "bnb";
      if (!(o as THREE.Mesh).isMesh) return;
      const m = o as THREE.Mesh;
      m.castShadow = m.receiveShadow = true;
      const n = o.name.toLowerCase();
      if (n.startsWith("cladding") || n.startsWith("battens")) m.material = mats.cladding;
      else if (n.startsWith("trim")) m.material = mats.trim;
      else if (n.startsWith("roof")) m.material = mats.roof;
      else if (n.startsWith("timber")) m.material = mats.timber;
      else if (n.startsWith("glass")) m.material = mats.glass;
      else if (n.startsWith("led")) m.material = mats.led;
      else if (n.startsWith("lining")) m.material = config.lining === "ply" ? mats.liningPly : mats.liningWhite;
      else if (n.startsWith("floor")) m.material = config.floor === "vinyl" ? mats.floorVinyl : mats.floorRubber;
    });
  }, [model, mats, config]);

  useFrame(() => {
    if (door) door.node.position.x = door.x0 + door.travel * anim.current.door;
  });

  return (
    <group name="DogHome">
      <primitive object={model} />
      <ModelLights config={config} dims={dims} mats={mats} />
    </group>
  );
}
