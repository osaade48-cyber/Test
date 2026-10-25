"use client";

import { useMemo } from "react";
import { FLOOR_HEIGHT as FL, GROUND } from "@/lib/dimensions";
import { Box } from "../helpers";
import { GrassTufts } from "./Plants";
import type { PartProps } from "./types";

export function deckExtent(dims: PartProps["dims"]) {
  const dl = -dims.W / 2 + 0.02, dr = dims.W / 2 + 0.18;
  return { dl, dr, deckW: dr - dl, dcx: (dl + dr) / 2 };
}

export function planterExtent(dims: PartProps["dims"]) {
  const pw = dims.planterWidth, pl = dims.D + 0.12, ph = dims.planterHeight;
  return { pw, pl, ph, px: -dims.W / 2 - pw / 2 - 0.04, pz: 0.04 };
}

/** Composite timber-look deck across the front, with an LED strip under the nosing. */
export function Deck({ dims, mats, config }: PartProps) {
  const { D, deckDepth: deckD } = dims;
  const { deckW, dcx } = deckExtent(dims);
  const skirtH = FL - 0.03 - GROUND;
  const boards = 4, bw = 0.13, gap = 0.008;
  return (
    <group name="Deck">
      <Box size={[deckW, skirtH, deckD]} position={[dcx, GROUND + skirtH / 2, D / 2 + deckD / 2]} material={mats.plinth} />
      {/* fascia board on the front and right edges */}
      <Box size={[deckW, skirtH, 0.018]} position={[dcx, GROUND + skirtH / 2, D / 2 + deckD - 0.009]} material={mats.deck} />
      <Box size={[0.018, skirtH, deckD]} position={[dcx + deckW / 2 - 0.009, GROUND + skirtH / 2, D / 2 + deckD / 2]} material={mats.deck} swap />
      {Array.from({ length: boards }, (_, i) => (
        <Box
          key={i}
          size={[deckW, 0.026, bw]}
          position={[dcx, FL - 0.016, D / 2 + 0.07 + i * (bw + gap)]}
          material={mats.deck}
        />
      ))}
      {config.addons.lights && (
        <Box size={[deckW - 0.04, 0.01, 0.01]} position={[dcx, FL - 0.036, D / 2 + deckD - 0.02]} material={mats.led} castShadow={false} />
      )}
    </group>
  );
}

/** Long planter box along the left side, in the panel colour, planted with ornamental grasses. */
export function Planter({ dims, mats, config }: PartProps) {
  const { pw, pl, ph, px, pz } = planterExtent(dims);
  const tufts = useMemo(() => {
    const n = Math.max(4, Math.round(pl / 0.16));
    return Array.from({ length: n }, (_, i): [number, number, number, number] => [
      px + (i % 2 ? 0.05 : -0.05),
      GROUND + ph - 0.02,
      pz - pl / 2 + 0.1 + (i * (pl - 0.2)) / (n - 1),
      0.32 + ((i * 37) % 5) * 0.03,
    ]);
  }, [pl, ph, px, pz]);
  return (
    <group name="Planter">
      <Box size={[pw, ph, pl]} position={[px, GROUND + ph / 2, pz]} material={mats.cladding} />
      <Box size={[pw + 0.012, 0.02, pl + 0.012]} position={[px, GROUND + ph - 0.01, pz]} material={mats.trim} />
      <Box size={[pw - 0.04, 0.02, pl - 0.04]} position={[px, GROUND + ph - 0.012, pz]} material={mats.soil} castShadow={false} />
      <GrassTufts tufts={tufts} seed={11} />
      {config.addons.lights && (
        <Box size={[0.01, 0.01, pl - 0.06]} position={[px - pw / 2 - 0.006, GROUND + 0.03, pz]} material={mats.led} castShadow={false} />
      )}
    </group>
  );
}
