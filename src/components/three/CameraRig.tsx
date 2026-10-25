"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { SizeKey } from "@/lib/configurator";
import { dimensions, FLOOR_HEIGHT } from "@/lib/dimensions";

export type Focus = "overview" | "front" | "left" | "interior" | "plaque" | "hero";

type Preset = { az: number; el: number; dist: number; width: number; target: [number, number, number] };

export const FOV = 30;

/** Camera framing for each focus. Angles in degrees; az 0 = straight on, + = from the right. */
function preset(focus: Focus, size: SizeKey, doorOpen: boolean): Preset {
  const d = dimensions(size);
  const k = size === "M" ? 0.86 : 1;
  switch (focus) {
    case "front":
      return { az: 8, el: 9, dist: 5.2 * k, width: 2.7 * k, target: [0.05, 0.5 * k, 0.35] };
    case "left":
      return { az: -52, el: 17, dist: 5.4 * k, width: 2.6 * k, target: [-0.35 * k, 0.5 * k, 0.1] };
    case "interior":
      return { az: 6, el: 15, dist: 2.6 * k, width: 1.25 * k, target: [(d.o0 + d.o1) / 2, FLOOR_HEIGHT + d.H * 0.38, 0] };
    case "plaque": {
      const dw = d.ow + 0.04;
      const x = doorOpen ? d.o1 + 0.04 + dw / 2 : (d.o0 + d.o1) / 2;
      const y = FLOOR_HEIGHT + d.sill + (d.oh + 0.03) * 0.74;
      return { az: 12, el: 6, dist: 2.1, width: 0.9, target: [x + 0.03, y, d.D / 2] };
    }
    case "hero":
      return { az: 28, el: 9, dist: 5.4 * k, width: 3.0 * k, target: [-0.1, 0.58 * k, 0.25] };
    default:
      return { az: 34, el: 15, dist: 6.0 * k, width: 3.1 * k, target: [-0.15, 0.52 * k, 0.2] };
  }
}

/** Distance needed so the preset's width fits the viewport at this aspect ratio. */
function fitDistance(p: Preset, aspect: number) {
  const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  return Math.max(p.dist, p.width / (2 * t * aspect));
}

function toSpherical(p: Preset, aspect: number) {
  return {
    radius: fitDistance(p, aspect),
    phi: THREE.MathUtils.degToRad(90 - p.el),
    theta: THREE.MathUtils.degToRad(p.az),
  };
}

type Props = {
  focus: Focus;
  /** Increment to re-run a transition to the same focus (e.g. after any option change). */
  focusKey: number;
  size: SizeKey;
  doorOpen: boolean;
  mode: "hero" | "configurator" | "still";
  /** Hero: shift the subject up the frame (portrait phones with text below). */
  heroLift?: number;
};

/**
 * Smooth, architectural camera moves. In the configurator it eases to a framing
 * whenever options change, and yields immediately when the visitor starts dragging.
 * In the hero it sweeps slowly back and forth across the front.
 */
export function CameraRig({ focus, focusKey, size, doorOpen, mode, heroLift = 0 }: Props) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  // The canvas can measure 0×0 for a frame while the layout settles; never frame against that.
  const measured = width > 1 && height > 1;
  const aspect = measured ? THREE.MathUtils.clamp(width / height, 0.3, 4) : 1;
  const goal = useRef<{ radius: number; phi: number; theta: number; target: THREE.Vector3 } | null>(null);
  const userMoved = useRef(false);
  const first = useRef(true);
  const sph = useMemo(() => new THREE.Spherical(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const offset = useMemo(() => new THREE.Vector3(), []);

  // New goal whenever focus or options change.
  useEffect(() => {
    if (mode === "hero") return;
    const p = preset(focus, size, doorOpen);
    if (focus === "hero" && aspect < 0.9) p.target[1] -= 0.38; // matches the live hero framing on phones
    goal.current = { ...toSpherical(p, aspect), target: new THREE.Vector3(...p.target) };
    userMoved.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, focusKey, size, mode]);

  // Re-fit on resize, unless the visitor has taken over the camera.
  useEffect(() => {
    if (mode === "hero" || userMoved.current || !measured) return;
    const p = preset(focus, size, doorOpen);
    if (focus === "hero" && aspect < 0.9) p.target[1] -= 0.38; // matches the live hero framing on phones
    goal.current = { ...toSpherical(p, aspect), target: new THREE.Vector3(...p.target) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect]);

  useEffect(() => {
    if (!controls) return;
    const stop = () => {
      goal.current = null;
      userMoved.current = true;
    };
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controls]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (mode === "hero") {
      const p = preset("hero", size, doorOpen);
      const s = toSpherical(p, aspect);
      const t = state.clock.elapsedTime;
      // Slow sweep: ±38° around the front-right, ~60 s per cycle.
      s.theta = THREE.MathUtils.degToRad(p.az + Math.sin(t * ((2 * Math.PI) / 60)) * 38);
      // Portrait phones: lift the home into the upper part of the frame, above the headline.
      const lift = heroLift + (aspect < 0.9 ? 0.38 : 0);
      target.set(p.target[0], p.target[1] - lift, p.target[2]);
      camera.position.setFromSpherical(sph.set(s.radius, s.phi, s.theta)).add(target);
      camera.lookAt(target);
      return;
    }

    const g = goal.current;
    if (!g || !measured) return;
    if (!Number.isFinite(camera.position.x + camera.position.y + camera.position.z)) first.current = true;
    const tgt = controls ? controls.target : target;
    if (first.current) {
      // Jump straight to the first framing, no animation on load.
      tgt.copy(g.target);
      camera.position.setFromSpherical(sph.set(g.radius, g.phi, g.theta)).add(tgt);
      camera.lookAt(tgt);
      controls?.update();
      first.current = false;
      if (mode === "still") goal.current = null;
      return;
    }
    offset.copy(camera.position).sub(tgt);
    sph.setFromVector3(offset);
    easing.damp3(tgt, g.target, 0.55, dt);
    easing.dampAngle(sph, "theta", g.theta, 0.6, dt);
    easing.damp(sph, "phi", g.phi, 0.6, dt);
    easing.damp(sph, "radius", g.radius, 0.6, dt);
    camera.position.setFromSpherical(sph).add(tgt);
    camera.lookAt(tgt);
    controls?.update();
    const done =
      Math.abs(sph.radius - g.radius) < 0.005 &&
      Math.abs(sph.phi - g.phi) < 0.002 &&
      Math.abs(Math.atan2(Math.sin(sph.theta - g.theta), Math.cos(sph.theta - g.theta))) < 0.002 &&
      tgt.distanceTo(g.target) < 0.003;
    if (done) goal.current = null;
  });

  return null;
}
