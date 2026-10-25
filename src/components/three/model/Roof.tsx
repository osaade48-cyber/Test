"use client";

import { useMemo } from "react";
import { FLOOR_HEIGHT as FL } from "@/lib/dimensions";
import { Box } from "../helpers";
import type { PartProps } from "./types";

/**
 * Skillion roof falling to the left: thick dark timber-look fascia and soffit,
 * charcoal standing-seam top, deep front overhang. LED strips sit in the soffit.
 * Lift-off in real life, so it is one group here too.
 */
export function Roof({ dims, mats, config }: PartProps) {
  const { W, D, H, R, roofThickness: tt, overhangSide: ov, overhangFront: ovf, overhangBack: ovb, pitch: B } = dims;
  const L = (W + 2 * ov) / Math.cos(B);
  const Dz = D + ovf + ovb;
  const zc = (ovf - ovb) / 2;

  const slabMaterials = useMemo(
    // +x, −x, +y, −y, +z, −z
    () => [mats.timber, mats.timber, mats.roof, mats.timber, mats.timber, mats.trim],
    [mats]
  );

  const seams = useMemo(() => {
    const out: number[] = [];
    const n = Math.floor(Dz / 0.2);
    for (let i = 0; i <= n; i++) out.push(-Dz / 2 + 0.06 + (i * (Dz - 0.12)) / n);
    return out;
  }, [Dz]);

  return (
    <group name="Roof" position={[0, FL + H + R / 2 + tt / 2 / Math.cos(B), zc]} rotation={[0, 0, B]}>
      <Box name="RoofSlab" size={[L, tt, Dz]} material={slabMaterials} swap />
      <Box name="RoofTop" size={[L + 0.008, 0.012, Dz + 0.008]} position={[0, tt / 2 + 0.006, 0]} material={mats.roof} />
      {seams.map((z) => (
        <Box key={z} size={[L, 0.007, 0.006]} position={[0, tt / 2 + 0.0155, z]} material={mats.roof} castShadow={false} />
      ))}
      {config.addons.lights && (
        <group name="LED_Roof">
          <Box size={[L - 0.12, 0.008, 0.016]} position={[0, -tt / 2 - 0.004, Dz / 2 - 0.06]} material={mats.led} castShadow={false} />
          <Box size={[0.016, 0.008, Dz - 0.12]} position={[-L / 2 + 0.06, -tt / 2 - 0.004, 0]} material={mats.led} castShadow={false} />
          <Box size={[0.016, 0.008, Dz - 0.12]} position={[L / 2 - 0.06, -tt / 2 - 0.004, 0]} material={mats.led} castShadow={false} />
        </group>
      )}
    </group>
  );
}
