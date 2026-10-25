# Swapping in a professionally made 3D model (.glb)

The configurator renders whichever model `src/config/model.ts` points to. The procedural model in `src/components/three/model/` is built in code. A `.glb` from a 3D artist can replace it without touching the configurator, pricing, lighting, camera or enquiry flow.

## 1. Brief for the 3D artist

- **Units and axes:** metres, Y-up. **Front faces +Z.** The **left side (−X) is the low side** of the skillion roof.
- **Origin:** on the ground plane, centred under the home's footprint.
- **Dimensions:** match `src/lib/dimensions.ts`, or the tables on `/the-home`. Inside dimensions are Medium 1.30 × 0.85 × 0.80 m and Large 1.70 × 1.00 × 0.92 m, with 50 mm walls and the floor 150 mm above ground.
- **One file per size:** `public/models/dog-home-medium.glb` and `public/models/dog-home-large.glb`.
- **Everything in one file:** all options (deck, planter, bed, battens, LED strips) are included and switched on or off by name.
- **Door:** modelled **closed**. It slides along **+X** to open. Set a custom property `door_travel` (in metres) on the `Door` node. The default is 0.75 m.
- **Budget:** under ~150k triangles in total. Use Draco or Meshopt compression (e.g. `gltf-transform optimize`) and keep textures at 2k or less.
- **Materials:** any materials work. The parts listed below are re-materialled by the configurator so that colours and finishes stay in sync with the options. Bake ambient occlusion into a second UV set if you like.

## 2. Node naming

Names are matched by prefix and are case-insensitive. `Cladding_Front`, `Cladding_Left` and so on all count as `Cladding`.

| Prefix      | Behaviour                                                        |
| ----------- | ---------------------------------------------------------------- |
| `Cladding`  | Panel colour (White / Neutral / Charcoal)                        |
| `Battens`   | Panel colour; **visible only for Board & batten**                |
| `Trim`      | Charcoal trim and frames                                         |
| `Roof`      | Charcoal roof top                                                |
| `Timber`    | Dark timber-look (fascia, soffit, slats, door boards)            |
| `Glass`     | Window glass                                                     |
| `Lining`    | Inside walls (Birch ply / Painted white)                         |
| `Floor`     | Floor (Timber-look vinyl / Non-slip rubber)                      |
| `LED`       | LED strips; **visible only with the LED kit**; glow animates at dusk |
| `Deck`      | Deck platform; visible only when selected                        |
| `Planter`   | Planter box and plants; visible only when selected               |
| `Bed`       | Premium bed; visible only when selected                          |
| `Door`      | The sliding door group (exact name). Animates open and closed    |
| `Plaque`    | Name plaque. Keeps its own material                              |

The plaque text is drawn live on the procedural model only. To keep it on a `.glb`, give the plaque face its own UVs (0–1 across the face). The canvas texture from `Front.tsx` (`usePlaqueTexture`) can then be applied in `GlbDogHome.tsx`.

## 3. Switch it on

```ts
// src/config/model.ts
export const MODEL = {
  source: "glb",
  glb: { M: "/models/dog-home-medium.glb", L: "/models/dog-home-large.glb" },
};
```

The garden, lighting, LED light fixtures, camera framings and day/dusk transitions keep working. LED light positions come from `src/lib/dimensions.ts`, so keep the model to those dimensions.
