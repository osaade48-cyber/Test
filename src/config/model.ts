/**
 * 3D model source.
 *
 * "procedural" builds the dog home in code from the dimensions in src/lib/dimensions.ts.
 * To use a professionally made model, export one .glb per size into public/models,
 * follow the node naming guide in docs/3D-MODEL.md, and switch `source` to "glb".
 * The configurator, pricing, lighting and camera all keep working unchanged.
 */
export const MODEL = {
  source: "procedural" as "procedural" | "glb",
  glb: {
    M: "/models/dog-home-medium.glb",
    L: "/models/dog-home-large.glb",
  },
};

/** HDRI for realistic reflections: Poly Haven "Rooitou Park" (CC0), softened by scripts/prepare-hdri.mjs. */
export const ENVIRONMENT_HDRI = "/hdri/garden_soft_1k.hdr";

/**
 * Surface textures. Replace any file in public/textures with a photographic
 * texture of the same name (e.g. ambientCG / Poly Haven, CC0) to upgrade realism.
 */
export const TEXTURES = {
  timber: "/textures/timber_color.jpg",
  timberNormal: "/textures/timber_normal.jpg",
  timberRoughness: "/textures/timber_roughness.jpg",
  birch: "/textures/birch_color.jpg",
  vinyl: "/textures/vinyl_color.jpg",
  rubber: "/textures/rubber_color.jpg",
  rubberNormal: "/textures/rubber_normal.jpg",
  grass: "/textures/grass_color.jpg",
  paver: "/textures/paver_color.jpg",
  paverNormal: "/textures/paver_normal.jpg",
  soil: "/textures/soil_color.jpg",
  claddingNormal: "/textures/cladding_normal.jpg",
} as const;
