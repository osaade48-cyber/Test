"use client";

import { MODEL } from "@/config/model";
import { ProceduralDogHome } from "./model/ProceduralDogHome";
import { GlbDogHome } from "./model/GlbDogHome";
import type { DogHomeModelProps } from "./model/types";

/** Picks the model source configured in src/config/model.ts. */
export function DogHome(props: DogHomeModelProps) {
  return MODEL.source === "glb" ? <GlbDogHome {...props} /> : <ProceduralDogHome {...props} />;
}
