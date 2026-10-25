import type { Config } from "@/lib/configurator";
import type { Dims } from "@/lib/dimensions";
import type { DogHomeMaterials } from "../materials";

/** Props shared by every part of the procedural model. */
export type PartProps = {
  config: Config;
  dims: Dims;
  mats: DogHomeMaterials;
};

/**
 * The contract any dog home model implements (procedural or .glb).
 * Door position, dusk and LED glow are read from the shared animation context.
 */
export type DogHomeModelProps = {
  config: Config;
};
