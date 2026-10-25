"use client";

import { RoundedBox } from "@react-three/drei";
import { FLOOR_HEIGHT as FL, WALL as T } from "@/lib/dimensions";
import { Box } from "../helpers";
import type { PartProps } from "./types";

/**
 * Inside lining (birch ply or painted white), wipe-clean floor and the 50 mm
 * upturn at the walls. Rendered as the inner faces of one box.
 */
export function Interior({ dims, mats, config }: PartProps) {
  const { W, D, H } = dims;
  const iw = W - 2 * T - 0.004, id = D - 2 * T - 0.004;
  const wall = config.lining === "ply" ? mats.liningPly : mats.liningWhite;
  const floor = config.floor === "vinyl" ? mats.floorVinyl : mats.floorRubber;
  const cove = config.floor === "vinyl" ? mats.coveVinyl : mats.coveRubber;
  return (
    <group name="Interior">
      <Box
        name="Lining"
        size={[iw, H - 0.004, id]}
        position={[0, FL + H / 2, 0]}
        // +x, −x, ceiling, floor, +z, −z
        material={[wall, wall, wall, floor, wall, wall]}
        tile={1}
        castShadow={false}
      />
      <Box size={[iw, 0.05, 0.006]} position={[0, FL + 0.025, -id / 2 + 0.004]} material={cove} castShadow={false} />
      <Box size={[0.006, 0.05, id]} position={[-iw / 2 + 0.004, FL + 0.025, 0]} material={cove} castShadow={false} />
      <Box size={[0.006, 0.05, id]} position={[iw / 2 - 0.004, FL + 0.025, 0]} material={cove} castShadow={false} />
    </group>
  );
}

/** Premium washable bed: a made-to-fit cushion with a bolster on three sides. */
export function Bed({ dims, mats }: PartProps) {
  const { o0, o1, ow } = dims;
  const iw = dims.W - 2 * T, id = dims.D - 2 * T;
  const bw = Math.min(ow * 1.25, iw * 0.66);
  const bd = id * 0.78;
  const bx = (o0 + o1) / 2 - 0.02;
  const bz = -0.02;
  return (
    <group name="Bed" position={[bx, FL, bz]}>
      <RoundedBox args={[bw, 0.07, bd]} radius={0.03} smoothness={4} position={[0, 0.04, 0]} material={mats.bed} castShadow receiveShadow />
      <RoundedBox args={[bw, 0.12, 0.09]} radius={0.04} smoothness={4} position={[0, 0.09, -bd / 2 + 0.045]} material={mats.bed} castShadow receiveShadow />
      <RoundedBox args={[0.09, 0.12, bd - 0.06]} radius={0.04} smoothness={4} position={[-bw / 2 + 0.045, 0.09, 0.03]} material={mats.bed} castShadow receiveShadow />
      <RoundedBox args={[0.09, 0.12, bd - 0.06]} radius={0.04} smoothness={4} position={[bw / 2 - 0.045, 0.09, 0.03]} material={mats.bed} castShadow receiveShadow />
      <Box size={[bw - 0.02, 0.004, 0.004]} position={[0, 0.0055, bd / 2 - 0.002]} material={mats.bedPiping} castShadow={false} />
    </group>
  );
}
