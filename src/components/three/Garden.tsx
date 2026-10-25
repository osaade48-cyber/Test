"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useTexture, RoundedBox } from "@react-three/drei";
import { TEXTURES } from "@/config/model";
import type { Config } from "@/lib/configurator";
import { dimensions, GROUND } from "@/lib/dimensions";
import { seeded } from "./helpers";
import { GrassTufts } from "./model/Plants";

const PAVER = 0.6;
const JOINT = 0.008;

/**
 * A tasteful garden setting: honed concrete paver pad (our landscaping crew's work),
 * a lawn that fades into the background, a clipped hedge and a few grasses.
 */
export function Garden({ config }: { config: Config }) {
  const tex = useTexture({ grass: TEXTURES.grass, paver: TEXTURES.paver, paverNormal: TEXTURES.paverNormal });

  const { grassMat, paverMat, hedgeMat } = useMemo(() => {
    for (const t of [tex.grass, tex.paver, tex.paverNormal]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
    }
    tex.grass.colorSpace = THREE.SRGBColorSpace;
    tex.paver.colorSpace = THREE.SRGBColorSpace;
    const grassMap = tex.grass.clone();
    grassMap.repeat.set(16, 16);
    grassMap.needsUpdate = true;
    const hedgeMap = tex.grass.clone();
    hedgeMap.repeat.set(3, 1.5);
    hedgeMap.needsUpdate = true;
    return {
      grassMat: new THREE.MeshStandardMaterial({ map: grassMap, roughness: 1, color: "#a7ab96" }),
      paverMat: new THREE.MeshStandardMaterial({
        map: tex.paver,
        normalMap: tex.paverNormal,
        normalScale: new THREE.Vector2(0.4, 0.4),
        roughness: 0.88,
      }),
      hedgeMat: new THREE.MeshStandardMaterial({ map: hedgeMap, color: "#4f5c45", roughness: 1 }),
    };
  }, [tex]);

  // Paver pad sized to the home, deck and planter, snapped to whole pavers.
  const pad = useMemo(() => {
    const d = dimensions(config.size);
    const x0 = -d.W / 2 - d.planterWidth - 0.5, x1 = d.W / 2 + 0.6;
    const z0 = -d.D / 2 - 0.45, z1 = d.D / 2 + d.deckDepth + 0.75;
    const nx = Math.ceil((x1 - x0) / PAVER), nz = Math.ceil((z1 - z0) / PAVER);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    return { nx, nz, cx, cz };
  }, [config.size]);

  const pavers = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = pavers.current;
    if (!mesh) return;
    const r = seeded(21);
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    let i = 0;
    for (let ix = 0; ix < pad.nx; ix++) {
      for (let iz = 0; iz < pad.nz; iz++) {
        const x = pad.cx + (ix - (pad.nx - 1) / 2) * PAVER;
        const z = pad.cz + (iz - (pad.nz - 1) / 2) * PAVER;
        m.makeRotationY((Math.floor(r() * 4) * Math.PI) / 2);
        m.setPosition(x, GROUND - 0.015 + (r() - 0.5) * 0.002, z);
        mesh.setMatrixAt(i, m);
        const v = 0.94 + r() * 0.08;
        mesh.setColorAt(i, c.setRGB(v, v * 0.995, v * 0.985));
        i++;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [pad]);

  const tufts = useMemo((): [number, number, number, number][] => {
    const right = pad.cx + (pad.nx * PAVER) / 2 + 0.35;
    const back = pad.cz - (pad.nz * PAVER) / 2 - 0.35;
    return [
      [right, 0, back + 0.2, 0.55],
      [right + 0.35, 0, back + 0.6, 0.48],
      [right + 0.1, 0, back + 1.1, 0.5],
      [pad.cx - (pad.nx * PAVER) / 2 - 0.4, 0, back + 0.1, 0.52],
      [pad.cx - (pad.nx * PAVER) / 2 - 0.75, 0, back + 0.5, 0.45],
    ];
  }, [pad]);

  const paverCount = pad.nx * pad.nz;
  return (
    <group name="Garden">
      <mesh name="Lawn" rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} material={grassMat} receiveShadow>
        <circleGeometry args={[16, 64]} />
      </mesh>
      <instancedMesh key={paverCount} ref={pavers} args={[undefined, paverMat, paverCount]} receiveShadow castShadow={false}>
        <boxGeometry args={[PAVER - JOINT, 0.03, PAVER - JOINT]} />
      </instancedMesh>
      {/* joint bed: dark line between pavers */}
      <mesh position={[pad.cx, GROUND - 0.017, pad.cz]} receiveShadow>
        <boxGeometry args={[pad.nx * PAVER - JOINT, 0.028, pad.nz * PAVER - JOINT]} />
        <meshStandardMaterial color="#8a857c" roughness={1} />
      </mesh>
      {/* clipped hedge behind */}
      <group position={[0, 0, pad.cz - (pad.nz * PAVER) / 2 - 2.6]}>
        {[-3.3, -2.05, -0.8, 0.45, 1.7, 2.95].map((x, i) => (
          <RoundedBox
            key={x}
            args={[1.28, 0.72 + (i % 2) * 0.04, 0.62]}
            radius={0.24}
            smoothness={3}
            position={[x, 0.36, Math.abs(x) * -0.12]}
            rotation={[0, x * 0.06, 0]}
            material={hedgeMat}
            castShadow
            receiveShadow
          />
        ))}
      </group>
      <GrassTufts tufts={tufts} blades={44} seed={3} />
    </group>
  );
}
