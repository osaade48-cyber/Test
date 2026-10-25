"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { FLOOR_HEIGHT as FL, WALL as T } from "@/lib/dimensions";
import { Box } from "../helpers";
import { useAnim } from "../animation";
import type { PartProps } from "./types";

/** Dark timber-look slatted vent panel, left of the opening (airflow). */
export function VentSlats({ dims, mats }: PartProps) {
  const { D, s0, slatW, topAt } = dims;
  const ventTop = topAt(s0) - 0.14;
  const fz = D / 2;
  const slats: number[] = [];
  for (let x = s0 + 0.012; x <= s0 + slatW - 0.03; x += 0.058) slats.push(x + 0.017);
  const bh = ventTop - 0.02;
  return (
    <group name="Slats">
      {/* insect screen behind the slats */}
      <Box size={[slatW, ventTop - 0.1, 0.003]} position={[s0 + slatW / 2, FL + 0.1 + (ventTop - 0.1) / 2, fz - T + 0.004]} material={mats.black} castShadow={false} />
      {slats.map((x) => (
        <Box key={x} size={[0.034, bh, 0.03]} position={[x, FL + 0.06 + bh / 2, fz + 0.016]} material={mats.timber} />
      ))}
      <Box size={[slatW + 0.05, 0.04, 0.045]} position={[s0 + slatW / 2, FL + ventTop + 0.02, fz + 0.012]} material={mats.trim} />
      <Box size={[slatW + 0.05, 0.04, 0.045]} position={[s0 + slatW / 2, FL + 0.08, fz + 0.012]} material={mats.trim} />
    </group>
  );
}

/** Black frame around the large front opening. */
export function OpeningFrame({ dims, mats }: PartProps) {
  const { D, o0, o1, ow, oh, sill } = dims;
  const fz = D / 2 + 0.012;
  return (
    <group name="OpeningFrame">
      <Box size={[0.045, oh + 0.045, 0.05]} position={[o0 - 0.0225, FL + sill + (oh + 0.045) / 2, fz]} material={mats.trim} />
      <Box size={[0.045, oh + 0.045, 0.05]} position={[o1 + 0.0225, FL + sill + (oh + 0.045) / 2, fz]} material={mats.trim} />
      <Box size={[ow + 0.09, 0.045, 0.05]} position={[(o0 + o1) / 2, FL + sill + oh + 0.0225, fz]} material={mats.trim} />
      <Box size={[ow + 0.09, 0.03, 0.06]} position={[(o0 + o1) / 2, FL + sill - 0.015, fz - 0.002]} material={mats.trim} />
      {/* reveal: lines the wall thickness inside the opening */}
      <Box size={[ow, 0.004, T]} position={[(o0 + o1) / 2, FL + sill + oh - 0.002, D / 2 - T / 2]} material={mats.black} castShadow={false} />
    </group>
  );
}

/* ---------- name plaque ---------- */

function plaqueFont(): string {
  if (typeof window === "undefined") return "Georgia, serif";
  // next/font exposes the resolved family list on this variable.
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-cormorant").trim();
  return v ? `${v}, Georgia, serif` : "Georgia, serif";
}

function drawPlaque(canvas: HTMLCanvasElement, text: string) {
  const x = canvas.getContext("2d")!;
  const { width: w, height: h } = canvas;
  // Satin bronze base with fine brushed lines
  const g = x.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#9a8059");
  g.addColorStop(0.5, "#b89c70");
  g.addColorStop(1, "#8d7451");
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    x.fillStyle = Math.random() < 0.5 ? "rgba(255,240,210,0.05)" : "rgba(40,28,10,0.05)";
    x.fillRect(Math.random() * w, Math.random() * h, 40 + Math.random() * 160, 1);
  }
  if (!text) return;
  const family = plaqueFont();
  let size = 150;
  const spacing = () => size * 0.22;
  const measure = () => {
    x.font = `500 ${size}px ${family}`;
    let t = 0;
    for (const ch of text) t += x.measureText(ch).width + spacing();
    return t - spacing();
  };
  while (measure() > w * 0.84 && size > 40) size -= 6;
  const total = measure();
  x.textBaseline = "middle";
  const draw = (dx: number, dy: number, color: string) => {
    x.fillStyle = color;
    let cx = (w - total) / 2;
    for (const ch of text) {
      x.fillText(ch, cx + dx, h / 2 + size * 0.04 + dy);
      cx += x.measureText(ch).width + spacing();
    }
  };
  // Engraving: light lower edge, dark cut
  draw(0, 2, "rgba(255,236,200,0.55)");
  draw(0, 0, "#2a2014");
}

function usePlaqueTexture(text: string) {
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let alive = true;
    // Load the serif explicitly: the plaque may be drawn before any page text uses it.
    const family = plaqueFont();
    Promise.resolve(document.fonts?.load(`500 100px ${family}`))
      .catch(() => undefined)
      .then(() => alive && setFontsReady(true));
    return () => {
      alive = false;
    };
  }, []);
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 360;
    drawPlaque(c, text);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
    // fontsReady re-draws once the serif has loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, fontsReady]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function Plaque({ text, mats }: { text: string; mats: PartProps["mats"] }) {
  const map = usePlaqueTexture(text);
  const face = useMemo(
    () => new THREE.MeshPhysicalMaterial({ map, metalness: 0.85, roughness: 0.38, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
    [map]
  );
  useEffect(() => () => face.dispose(), [face]);
  // Standard 0..1 UVs here (not world-scaled) so the whole plaque texture maps onto the face.
  return (
    <mesh name="Plaque" material={[mats.trim, mats.trim, mats.trim, mats.trim, face, mats.trim]} receiveShadow>
      <boxGeometry args={[0.25, 0.088, 0.008]} />
    </mesh>
  );
}

/** Dark timber-look sliding door on a top-hung track, with the engraved name plaque. */
export function SlidingDoor({ dims, mats, config }: PartProps) {
  const { W, D, o0, o1, ow, oh, sill } = dims;
  const dw = ow + 0.04, dh = oh + 0.03;
  const closedX = (o0 + o1) / 2;
  const openX = o1 + 0.04 + dw / 2;
  const dz = D / 2 + 0.06;
  const trackL = W / 2 - 0.04 - (o0 - 0.05);
  const door = useRef<THREE.Group>(null);
  const anim = useAnim();

  useFrame(() => {
    if (door.current) door.current.position.x = THREE.MathUtils.lerp(closedX, openX, anim.current.door);
  });

  const boards = 7;
  const bh = dh / boards;

  return (
    <group name="SlidingDoor">
      {/* top track */}
      <Box name="DoorTrack" size={[trackL, 0.035, 0.05]} position={[(o0 - 0.05 + W / 2 - 0.04) / 2, FL + sill + oh + 0.07, dz]} material={mats.trim} />
      <group ref={door} name="Door" position={[openX, FL + sill + dh / 2 - 0.01, dz]}>
        {/* backing panel + horizontal timber boards */}
        <Box size={[dw, dh, 0.02]} position={[0, 0, -0.006]} material={mats.black} />
        {Array.from({ length: boards }, (_, i) => (
          <Box
            key={i}
            size={[dw, bh - 0.005, 0.022]}
            position={[0, -dh / 2 + bh / 2 + i * bh, 0.006]}
            material={mats.timber}
            swap
          />
        ))}
        {/* hangers up to the track */}
        {[-1, 1].map((s) => (
          <Box key={s} size={[0.03, 0.06, 0.012]} position={[s * (dw / 2 - 0.07), dh / 2 + 0.035, 0.0]} material={mats.trim} />
        ))}
        {/* slim recessed pull */}
        <Box size={[0.016, 0.18, 0.02]} position={[-dw / 2 + 0.05, -dh * 0.02, 0.022]} material={mats.black} />
        <group position={[0.03, dh * 0.24, 0.022]}>
          <Plaque text={config.plaque} mats={mats} />
        </group>
      </group>
    </group>
  );
}
