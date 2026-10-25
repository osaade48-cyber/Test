"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { FLOOR_HEIGHT as FL, GROUND, WALL as T } from "@/lib/dimensions";
import { Box, rectHole } from "../helpers";
import type { PartProps } from "./types";

/** Extruded wall panel from a shape; disposes its geometry when the shape changes. */
function Panel({
  shape,
  material,
  position,
  rotation,
  name,
}: {
  shape: THREE.Shape;
  material: THREE.Material;
  position: [number, number, number];
  rotation?: [number, number, number];
  name: string;
}) {
  const geometry = useMemo(() => new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false }), [shape]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh name={name} geometry={geometry} material={material} position={position} rotation={rotation} castShadow receiveShadow />;
}

export function windowRect(dims: PartProps["dims"]) {
  const wz = Math.min(0.6, dims.D * 0.55);
  return { wz, wc: -0.02, wy: dims.H * 0.48, wh: 0.17 };
}

/** Plinth under the raised floor, recessed so the home appears to float. */
export function Plinth({ dims, mats }: PartProps) {
  const h = FL - GROUND;
  return <Box name="Plinth" size={[dims.W - 0.08, h, dims.D - 0.08]} position={[0, GROUND + h / 2, 0]} material={mats.plinth} />;
}

export function Walls({ dims, mats, config }: PartProps) {
  const { W, D, H, R, s0, slatW, o0, o1, oh, sill, topAt } = dims;
  const ventTop = topAt(s0) - 0.14;
  const { wz, wc, wy, wh } = windowRect(dims);
  const z0 = -D / 2 + T, z1 = D / 2 - T;

  const shapes = useMemo(() => {
    const endWall = (holes: THREE.Path[]) => {
      const s = new THREE.Shape();
      s.moveTo(-W / 2, 0);
      s.lineTo(W / 2, 0);
      s.lineTo(W / 2, H + R);
      s.lineTo(-W / 2, H);
      s.lineTo(-W / 2, 0);
      s.holes.push(...holes);
      return s;
    };
    const sideWall = (h: number, hole: THREE.Path) => {
      const s = new THREE.Shape();
      s.moveTo(z0, 0);
      s.lineTo(z1, 0);
      s.lineTo(z1, h);
      s.lineTo(z0, h);
      s.lineTo(z0, 0);
      s.holes.push(hole);
      return s;
    };
    return {
      front: endWall([rectHole(s0, 0.1, s0 + slatW, ventTop), rectHole(o0, sill, o1, sill + oh)]),
      back: endWall([
        rectHole(-W / 4 - 0.12, H - 0.13, -W / 4 + 0.12, H - 0.08),
        rectHole(W / 4 - 0.12, H - 0.13, W / 4 + 0.12, H - 0.08),
      ]),
      left: sideWall(H, rectHole(wc - wz / 2, wy, wc + wz / 2, wy + wh)),
      right: sideWall(H + R, rectHole(-0.2, H + R - 0.14, 0.2, H + R - 0.09)),
    };
  }, [W, H, R, s0, slatW, ventTop, o0, o1, sill, oh, z0, z1, wc, wz, wy, wh]);

  return (
    <group name="Walls">
      <Panel name="WallFront" shape={shapes.front} material={mats.cladding} position={[0, FL, D / 2 - T]} />
      <Panel name="WallBack" shape={shapes.back} material={mats.cladding} position={[0, FL, -D / 2]} />
      <Panel name="WallLeft" shape={shapes.left} material={mats.cladding} position={[-W / 2 + T, FL, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <Panel name="WallRight" shape={shapes.right} material={mats.cladding} position={[W / 2, FL, 0]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Louvres behind the rear and side vent openings */}
      {[-W / 4, W / 4].map((x) => (
        <group key={x} position={[x, FL + H - 0.105, -D / 2 + T / 2]}>
          <Box size={[0.24, 0.05, 0.004]} position={[0, 0, -0.012]} material={mats.black} castShadow={false} />
          {[-0.014, 0.0, 0.014].map((y) => (
            <Box key={y} size={[0.24, 0.006, 0.03]} position={[0, y, 0]} rotation={[0.6, 0, 0]} material={mats.trim} castShadow={false} />
          ))}
        </group>
      ))}
      <group position={[W / 2 - T / 2, FL + H + R - 0.115, 0]}>
        <Box size={[0.004, 0.05, 0.4]} position={[-0.012, 0, 0]} material={mats.black} castShadow={false} />
        {[-0.014, 0.0, 0.014].map((y) => (
          <Box key={y} size={[0.03, 0.006, 0.4]} position={[0, y, 0]} rotation={[0, 0, -0.6]} material={mats.trim} castShadow={false} />
        ))}
      </group>

      {/* Corner posts, always charcoal */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => {
          const h = sx > 0 ? H + R : H;
          return (
            <Box
              key={`${sx}${sz}`}
              size={[0.045, h, 0.045]}
              position={[sx * (W / 2 - 0.015), FL + h / 2, sz * (D / 2 - 0.015)]}
              material={mats.trim}
            />
          );
        })
      )}

      <SideWindow dims={dims} mats={mats} config={config} />
      {config.look === "bnb" && <Battens dims={dims} mats={mats} config={config} />}
    </group>
  );
}

/** Horizontal window with a black frame on the left side wall. */
function SideWindow({ dims, mats }: PartProps) {
  const { W } = dims;
  const { wz, wc, wy, wh } = windowRect(dims);
  const wx = -W / 2 - 0.012;
  const f = 0.035;
  return (
    <group name="Window">
      <Box size={[0.008, wh, wz]} position={[-W / 2 + T * 0.5, FL + wy + wh / 2, wc]} material={mats.glass} castShadow={false} receiveShadow={false} />
      <Box size={[0.03, f, wz + 2 * f]} position={[wx, FL + wy - f / 2, wc]} material={mats.black} />
      <Box size={[0.03, f, wz + 2 * f]} position={[wx, FL + wy + wh + f / 2, wc]} material={mats.black} />
      <Box size={[0.03, wh, f]} position={[wx, FL + wy + wh / 2, wc - wz / 2 - f / 2]} material={mats.black} />
      <Box size={[0.03, wh, f]} position={[wx, FL + wy + wh / 2, wc + wz / 2 + f / 2]} material={mats.black} />
      {/* reveal lining inside the window opening */}
      <Box size={[T, 0.004, wz]} position={[-W / 2 + T / 2, FL + wy + 0.002, wc]} material={mats.black} castShadow={false} />
    </group>
  );
}

/** Board & batten: slim vertical battens in the panel colour on the side and rear walls. */
function Battens({ dims, mats }: PartProps) {
  const { W, D, H, R, topAt } = dims;
  const { wz, wc, wy, wh } = windowRect(dims);
  const pitch = 0.14, bw = 0.026, bd = 0.012;
  const items: { size: [number, number, number]; position: [number, number, number] }[] = [];

  // Side walls (battens spaced along z)
  const n = Math.floor((D - 0.12) / pitch);
  const start = -((n - 1) * pitch) / 2;
  for (let i = 0; i < n; i++) {
    const z = start + i * pitch;
    // Left: skip across the window, split into below/above pieces
    const lx = -W / 2 - bd / 2;
    if (Math.abs(z - wc) < wz / 2 + 0.03) {
      const lo = wy - 0.04;
      items.push({ size: [bd, lo, bw], position: [lx, FL + lo / 2, z] });
      const hi0 = wy + wh + 0.04, hi = H - 0.03 - hi0;
      if (hi > 0.02) items.push({ size: [bd, hi, bw], position: [lx, FL + hi0 + hi / 2, z] });
    } else {
      items.push({ size: [bd, H - 0.03, bw], position: [lx, FL + (H - 0.03) / 2, z] });
    }
    // Right: stop below the side vent if it overlaps
    const rh = Math.abs(z) < 0.23 ? H + R - 0.17 : H + R - 0.03;
    items.push({ size: [bd, rh, bw], position: [W / 2 + bd / 2, FL + rh / 2, z] });
  }
  // Rear wall (battens spaced along x, following the skillion)
  const m = Math.floor((W - 0.12) / pitch);
  const sx = -((m - 1) * pitch) / 2;
  for (let i = 0; i < m; i++) {
    const x = sx + i * pitch;
    const nearVent = Math.abs(Math.abs(x) - W / 4) < 0.15;
    const h = nearVent ? H - 0.16 : topAt(x) - 0.03;
    items.push({ size: [bw, h, bd], position: [x, FL + h / 2, -D / 2 - bd / 2] });
  }
  return (
    <group name="Battens">
      {items.map((b, i) => (
        <Box key={i} size={b.size} position={b.position} material={mats.cladding} />
      ))}
    </group>
  );
}
