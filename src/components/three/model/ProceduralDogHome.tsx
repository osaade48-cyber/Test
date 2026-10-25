"use client";

import { useMemo } from "react";
import { dimensions } from "@/lib/dimensions";
import { useDogHomeMaterials } from "../materials";
import { Walls, Plinth } from "./Walls";
import { VentSlats, OpeningFrame, SlidingDoor } from "./Front";
import { Roof } from "./Roof";
import { Interior, Bed } from "./Interior";
import { Deck, Planter } from "./Extras";
import { ModelLights } from "./Lighting";
import type { DogHomeModelProps } from "./types";

/**
 * The dog home built in code from the concept model's dimensions. Each part is its
 * own component (and named group), mirroring the node names expected from a .glb.
 */
export function ProceduralDogHome({ config }: DogHomeModelProps) {
  const dims = useMemo(() => dimensions(config.size), [config.size]);
  const mats = useDogHomeMaterials(config);
  const p = { config, dims, mats };
  return (
    <group name="DogHome">
      <Plinth {...p} />
      <Walls {...p} />
      <Interior {...p} />
      <VentSlats {...p} />
      <OpeningFrame {...p} />
      <SlidingDoor {...p} />
      <Roof {...p} />
      {config.addons.bed && <Bed {...p} />}
      {config.addons.deck && <Deck {...p} />}
      {config.addons.planter && <Planter {...p} />}
      <ModelLights {...p} />
    </group>
  );
}
