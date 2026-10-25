"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { seeded } from "../helpers";

/** One tapered, gently curved grass blade (height 1, base at origin). */
function bladeGeometry() {
  const g = new THREE.PlaneGeometry(0.014, 1, 1, 5);
  g.translate(0, 0.5, 0);
  const p = g.attributes.position as THREE.BufferAttribute;
  const colors: number[] = [];
  const base = new THREE.Color("#33472a"), tip = new THREE.Color("#8e9a63");
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    p.setX(i, p.getX(i) * (1 - y * 0.92));
    p.setZ(i, y * y * 0.22);
    const c = base.clone().lerp(tip, y);
    colors.push(c.r, c.g, c.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

const material = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.85 });

/**
 * Ornamental grass tufts (Lomandra-style), drawn as a single instanced mesh.
 * `tufts` are [x, y, z, scale] positions.
 */
export function GrassTufts({ tufts, blades = 34, seed = 7 }: { tufts: [number, number, number, number][]; blades?: number; seed?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(bladeGeometry, []);
  const count = tufts.length * blades;

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const r = seeded(seed);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
    let i = 0;
    for (const [x, y, z, sc] of tufts) {
      for (let b = 0; b < blades; b++) {
        const a = r() * Math.PI * 2;
        const lean = 0.15 + r() * 0.55;
        e.set(0, a, 0, "YXZ");
        e.x = lean;
        q.setFromEuler(e);
        const h = sc * (0.55 + r() * 0.6);
        s.set(1 + r() * 0.6, h, 1);
        p.set(x + (r() - 0.5) * 0.05 * sc, y, z + (r() - 0.5) * 0.05 * sc);
        m.compose(p, q, s);
        mesh.setMatrixAt(i++, m);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [tufts, blades, seed]);

  return <instancedMesh key={count} ref={ref} args={[geometry, material, count]} castShadow receiveShadow />;
}
