"use client";

import { useMemo, type ReactNode } from "react";
import * as THREE from "three";

/**
 * BoxGeometry with world-scaled UVs, so a shared tiling texture (timber grain,
 * pavers) keeps the same real-world scale on every part instead of stretching.
 * `tile` is the texture's real-world size in metres; `swap` rotates the grain 90°.
 */
export function makeBox(w: number, h: number, d: number, tile = 0.5, swap = false) {
  const g = new THREE.BoxGeometry(w, h, d);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const nor = g.attributes.normal as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i));
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    let u: number, v: number;
    if (nx > 0.5) [u, v] = [z, y];
    else if (ny > 0.5) [u, v] = [x, z];
    else [u, v] = [x, y];
    if (swap) [u, v] = [v, u];
    uv.setXY(i, u / tile, v / tile);
  }
  uv.needsUpdate = true;
  return g;
}

type BoxProps = {
  size: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  material: THREE.Material | THREE.Material[];
  tile?: number;
  /** Rotate texture grain 90° (e.g. horizontal boards). */
  swap?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  name?: string;
  children?: ReactNode;
};

/** A box mesh with world-scaled UVs. Geometry is memoised on its size. */
export function Box({ size, position, rotation, material, tile = 0.5, swap = false, castShadow = true, receiveShadow = true, name, children }: BoxProps) {
  const [w, h, d] = size;
  const geometry = useMemo(() => makeBox(w, h, d, tile, swap), [w, h, d, tile, swap]);
  return (
    <mesh
      name={name}
      geometry={geometry}
      material={material}
      position={position}
      rotation={rotation}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      {children}
    </mesh>
  );
}

/** Rectangular hole path for THREE.Shape (shape-space coordinates). */
export function rectHole(x0: number, y0: number, x1: number, y1: number) {
  const p = new THREE.Path();
  p.moveTo(x0, y0);
  p.lineTo(x0, y1);
  p.lineTo(x1, y1);
  p.lineTo(x1, y0);
  p.lineTo(x0, y0);
  return p;
}

/** Small deterministic PRNG so procedural details (plants, pavers) don't jump between renders. */
export function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}
