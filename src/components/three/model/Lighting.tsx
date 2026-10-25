"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { FLOOR_HEIGHT as FL } from "@/lib/dimensions";
import { useAnim } from "../animation";
import { LED_HEX } from "../materials";
import { deckExtent, planterExtent } from "./Extras";
import type { PartProps } from "./types";

let rectInit = false;

/**
 * Warm light thrown by the LED kit. The number of lights never changes (only their
 * intensity), so toggling options or day/dusk never forces a shader recompile.
 */
export function ModelLights({ dims, mats, config }: PartProps) {
  if (!rectInit) {
    RectAreaLightUniformsLib.init();
    rectInit = true;
  }
  const anim = useAnim();
  const eave = useRef<THREE.RectAreaLight>(null);
  const low = useRef<THREE.PointLight>(null);
  const side = useRef<THREE.PointLight>(null);
  const inside = useRef<THREE.PointLight>(null);

  const { W, D, H, R, deckDepth, o0, o1 } = dims;
  const { dcx } = deckExtent(dims);
  const { px, pw, pz } = planterExtent(dims);
  const hasDeck = config.addons.deck, hasPlanter = config.addons.planter;

  useFrame(() => {
    const { dusk, lights } = anim.current;
    const on = dusk * lights;
    if (eave.current) eave.current.intensity = on * 30;
    if (low.current) low.current.intensity = on * 0.8;
    if (side.current) side.current.intensity = on * (hasPlanter ? 0.9 : 0);
    if (inside.current) inside.current.intensity = lights * (0.05 + dusk * 1.4);
    mats.led.emissiveIntensity = lights * (0.25 + dusk * 5);
    mats.glass.emissiveIntensity = on * 0.5;
  });

  const color = LED_HEX;
  return (
    <group name="LED_Lights">
      {/* LED strip under the front fascia: an area light washes the wall evenly */}
      <rectAreaLight
        ref={eave}
        color={color}
        width={W}
        height={0.06}
        intensity={0}
        position={[0, FL + H + R / 2 + 0.02, D / 2 + 0.2]}
        rotation={[-Math.PI / 2 + 0.4, 0, Math.atan(R / W)]}
      />
      <pointLight
        ref={low}
        color={color}
        position={hasDeck ? [dcx, 0.07, D / 2 + deckDepth + 0.12] : [0, 0.06, D / 2 + 0.12]}
        distance={1.6}
        decay={2}
        intensity={0}
      />
      <pointLight ref={side} color={color} position={[px - pw / 2 - 0.14, 0.08, pz]} distance={1.2} decay={2} intensity={0} />
      <pointLight ref={inside} color={color} position={[(o0 + o1) / 2, FL + H - 0.12, -0.05]} distance={1.4} decay={2} intensity={0} />
      {config.addons.lights && (
        // small downlight puck in the ceiling
        <mesh position={[(o0 + o1) / 2, FL + H - 0.006, -0.05]} material={mats.led}>
          <cylinderGeometry args={[0.035, 0.035, 0.008, 24]} />
        </mesh>
      )}
    </group>
  );
}
