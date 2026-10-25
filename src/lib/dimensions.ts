import { SIZES, type SizeKey } from "./configurator";

/**
 * Geometry derived from the inside dimensions, matching the original concept model.
 * Units are metres. Axes: x = width (left is −x), y = up, z = depth (front is +z).
 * Used by the 3D model and by the specification tables, so both always agree.
 */
export const WALL = 0.05; // insulated wall / roof panel thickness
export const FLOOR_HEIGHT = 0.15; // raised floor: top of floor above ground
export const GROUND = 0.015; // top of the paver pad

export type Dims = ReturnType<typeof dimensions>;

export function dimensions(size: SizeKey) {
  const s = SIZES[size];
  const W = s.W + 2 * WALL; // external width
  const D = s.D + 2 * WALL; // external depth
  const H = s.H; // wall height at the low (left) side, above floor
  const R = W * 0.12; // skillion rise from left to right
  const margin = 0.07;
  const gap = 0.05;
  const slatW = 0.16 * W; // slatted vent panel width
  const ow = (W - 2 * margin - slatW - gap) / 2; // front opening width
  const oh = H * 0.8; // front opening height
  const s0 = -W / 2 + margin; // vent panel left edge
  const o0 = s0 + slatW + gap; // opening left edge
  const o1 = o0 + ow; // opening right edge
  const sill = 0.05;

  // Roof
  const roofThickness = 0.11;
  const overhangSide = 0.1;
  const overhangFront = 0.32;
  const overhangBack = 0.08;
  const pitch = Math.atan(R / W);

  // Optional extras
  const deckDepth = 0.55;
  const planterWidth = 0.34;
  const planterHeight = 0.46;

  const overallHeight = FLOOR_HEIGHT + H + R + 0.13;

  return {
    ...s,
    W, D, H, R, slatW, ow, oh, s0, o0, o1, sill,
    roofThickness, overhangSide, overhangFront, overhangBack, pitch,
    deckDepth, planterWidth, planterHeight,
    overallHeight,
    /** Wall top height (above floor) at a given x. Left is low, right is high. */
    topAt: (x: number) => H + R * ((x + W / 2) / W),
  };
}

const mm = (v: number) => Math.round(v * 100) * 10;
export const fmtMM = (v: number) => `${mm(v).toLocaleString("en-AU")} mm`;

/** Specification rows shared by The Home page and the configurator. */
export function specRows(size: SizeKey): [string, string][] {
  const g = dimensions(size);
  const s = SIZES[size];
  return [
    ["Suits", s.dogs],
    ["Inside (W × D × H)", `${mm(s.W)} × ${mm(s.D)} × ${mm(s.H)} mm`],
    ["Footprint (W × D)", `${mm(g.W)} × ${mm(g.D)} mm`],
    ["Roof footprint", `${mm(g.W + 2 * g.overhangSide)} × ${mm(g.D + g.overhangFront + g.overhangBack)} mm`],
    ["Overall height", fmtMM(g.overallHeight)],
    ["Wall height, left / right", `${mm(FLOOR_HEIGHT + g.H)} / ${mm(FLOOR_HEIGHT + g.H + g.R)} mm`],
    ["Front opening", `${mm(g.ow)} × ${mm(g.oh)} mm`],
    ["Floor height", `${mm(FLOOR_HEIGHT)} mm above ground`],
    ["With deck, depth", fmtMM(g.D + g.deckDepth)],
    ["With planter, width", fmtMM(g.W + g.planterWidth + 0.04)],
  ];
}
