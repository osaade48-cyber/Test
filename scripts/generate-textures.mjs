// Generates the tileable PBR textures used by the 3D dog home into public/textures.
//
//   npm run textures
//
// Every texture is procedural, so there are no licensing questions. To use photographic
// textures instead (e.g. from ambientCG or Poly Haven, both CC0), drop JPGs into
// public/textures using the same filenames and skip this script.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public", "textures");
mkdirSync(OUT, { recursive: true });

/* ---------- deterministic random + tileable noise ---------- */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(1337);
const PERM = new Uint8Array(512);
{
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
}
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;
function grad(h, x, y) {
  switch (h & 7) {
    case 0: return x + y;
    case 1: return -x + y;
    case 2: return x - y;
    case 3: return -x - y;
    case 4: return x;
    case 5: return -x;
    case 6: return y;
    default: return -y;
  }
}
// Periodic gradient noise: wraps every px / py lattice cells so textures tile.
function pnoise(x, y, px, py) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const x0 = ((xi % px) + px) % px, x1 = (x0 + 1) % px;
  const y0 = ((yi % py) + py) % py, y1 = (y0 + 1) % py;
  const u = fade(xf), v = fade(yf);
  const aa = PERM[PERM[x0] + y0], ab = PERM[PERM[x0] + y1];
  const ba = PERM[PERM[x1] + y0], bb = PERM[PERM[x1] + y1];
  return lerp(
    lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
    lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
    v
  );
}
// Fractal noise over a unit tile. fx, fy = base cells across the tile.
function fbm(u, v, fx, fy, oct = 5, gain = 0.5) {
  let s = 0, a = 0.5, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) {
    s += a * pnoise(u * fx * f, v * fy * f, fx * f, fy * f);
    norm += a;
    a *= gain;
    f *= 2;
  }
  return s / norm; // ~ -0.7..0.7
}
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/* ---------- writers ---------- */
async function write(name, size, fn, quality = 86) {
  const buf = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const c = fn(x / size, y / size, x, y);
      const i = (y * size + x) * 3;
      buf[i] = clamp(c[0], 0, 255);
      buf[i + 1] = clamp(c[1], 0, 255);
      buf[i + 2] = clamp(c[2], 0, 255);
    }
  }
  await sharp(buf, { raw: { width: size, height: size, channels: 3 } })
    .jpeg({ quality, mozjpeg: true })
    .toFile(join(OUT, name));
  console.log("  wrote", name);
}
// Height field -> tangent-space normal map (OpenGL convention, +Y up).
async function writeNormal(name, size, height, strength) {
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) h[y * size + x] = height(x / size, y / size, x, y);
  const at = (x, y) => h[((y + size) % size) * size + ((x + size) % size)];
  await write(name, size, (_u, _v, x, y) => {
    const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
    const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
    const nx = -dx, ny = dy, nz = 1;
    const l = Math.hypot(nx, ny, nz);
    return [(nx / l * 0.5 + 0.5) * 255, (ny / l * 0.5 + 0.5) * 255, (nz / l * 0.5 + 0.5) * 255];
  }, 90);
}

/* ---------- timber (grain runs along V) ---------- */
// One dark timber-look shade: wood-grain powder coat on aluminium battens.
function timberGrain(u, v, fine = 1) {
  // Mostly straight, quarter-sawn grain with only a gentle drift.
  const warp = fbm(u, v, 2, 1, 3) * 0.5;
  const rings = Math.sin((u * 34 * fine + warp * 3 + fbm(u, v, 8, 1, 3) * 0.35) * Math.PI);
  const streak = fbm(u, v, 64 * fine, 1, 5, 0.6);
  const pores = fbm(u, v, 220 * fine, 3, 2);
  return { rings, streak, pores };
}
async function timber() {
  const dark = hex("#2b211b"), mid = hex("#45362c"), light = hex("#62503f");
  await write("timber_color.jpg", 1024, (u, v) => {
    const { rings, streak, pores } = timberGrain(u, v);
    let t = 0.5 + rings * 0.1 + streak * 0.7 + pores * 0.18;
    t = clamp(t);
    return t < 0.5 ? mix(dark, mid, t * 2) : mix(mid, light, (t - 0.5) * 2);
  });
  await write("timber_roughness.jpg", 512, (u, v) => {
    const { rings, streak } = timberGrain(u, v);
    const r = 0.5 + rings * 0.05 + streak * 0.12;
    return [r * 255, r * 255, r * 255];
  });
  await writeNormal("timber_normal.jpg", 1024, (u, v) => {
    const { rings, streak, pores } = timberGrain(u, v);
    return rings * 0.25 + streak * 0.6 + pores * 0.5;
  }, 2.2);
}

/* ---------- birch ply interior lining ---------- */
async function birch() {
  const a = hex("#cdb48c"), b = hex("#e2d0b0");
  await write("birch_color.jpg", 1024, (u, v) => {
    const w = fbm(u, v, 2, 1, 3) * 2.2;
    const rings = Math.sin((u * 10 + w) * Math.PI * 2) * 0.5 + 0.5;
    const s = fbm(u, v, 30, 1, 4);
    return mix(a, b, clamp(0.55 + (rings - 0.5) * 0.25 + s * 0.5));
  });
}

/* ---------- timber-look vinyl floor (6 planks per tile, tile = 1 m) ---------- */
async function vinyl() {
  const a = hex("#8f6b4a"), b = hex("#b38c66");
  const rows = 6;
  const tones = Array.from({ length: rows * 3 }, () => rand() * 0.3 - 0.15);
  const plank = (u, v) => {
    const r = Math.floor(v * rows);
    const off = (r % 3) / 3;
    const uu = (u + off) % 1;
    const k = Math.floor(uu * 2);
    return { r, k, uu, vv: v * rows - r, id: r * 3 + k };
  };
  await write("vinyl_color.jpg", 1024, (u, v) => {
    const p = plank(u, v);
    const g = fbm(u, v + p.id * 0.37, 3, 72, 4, 0.6);
    let t = clamp(0.5 + tones[p.id] + g * 0.6);
    let c = mix(a, b, t);
    const seamV = p.vv < 0.012 || p.vv > 0.988;
    const seamU = (p.uu * 2) % 1 < 0.004;
    if (seamV || seamU) c = mix(c, [60, 42, 28], 0.55);
    return c;
  });
}

/* ---------- non-slip rubber floor (raised coin studs) ---------- */
async function rubber() {
  const studs = 24;
  const stud = (u, v) => {
    const cu = (u * studs) % 1 - 0.5, cv = (v * studs) % 1 - 0.5;
    const d = Math.hypot(cu, cv);
    return d < 0.26 ? 1 : d < 0.32 ? 1 - (d - 0.26) / 0.06 : 0;
  };
  await write("rubber_color.jpg", 512, (u, v) => {
    const n = fbm(u, v, 40, 40, 2) * 10;
    const s = stud(u, v);
    const g = 44 + n + s * 6;
    return [g, g + 2, g + 2];
  });
  await writeNormal("rubber_normal.jpg", 512, (u, v) => stud(u, v) + fbm(u, v, 80, 80, 2) * 0.08, 3.5);
}

/* ---------- lawn (tile = 2 m) ---------- */
async function grass() {
  const a = hex("#45553a"), b = hex("#74805c"), dry = hex("#8f9068");
  await write("grass_color.jpg", 1024, (u, v) => {
    const patch = fbm(u, v, 3, 3, 4);
    const blades = fbm(u, v, 220, 220, 2);
    const fine = fbm(u, v, 90, 160, 3);
    let c = mix(a, b, clamp(0.5 + blades * 1.2 + fine * 0.6));
    c = mix(c, dry, clamp(patch * 0.5));
    return c;
  });
}

/* ---------- pavers: honed concrete (tile = one 600 mm paver) ---------- */
async function paver() {
  const base = hex("#cfc8bb");
  await write("paver_color.jpg", 512, (u, v) => {
    const cloud = fbm(u, v, 4, 4, 5) * 26;
    const speck = fbm(u, v, 120, 120, 2);
    const s = speck > 0.32 ? -28 : speck < -0.34 ? 14 : 0;
    return [base[0] + cloud + s, base[1] + cloud + s, base[2] + cloud * 0.9 + s];
  });
  await writeNormal("paver_normal.jpg", 512, (u, v) => fbm(u, v, 60, 60, 3) * 0.35, 3);
}

/* ---------- planter mulch ---------- */
async function soil() {
  await write("soil_color.jpg", 512, (u, v) => {
    const n = fbm(u, v, 30, 30, 4);
    const chips = fbm(u, v, 90, 50, 2);
    const t = clamp(0.4 + n * 0.8 + (chips > 0.25 ? 0.35 : 0));
    return mix(hex("#1f1610"), hex("#5a4230"), t);
  });
}

/* ---------- Colorbond orange-peel micro texture ---------- */
async function cladding() {
  await writeNormal("cladding_normal.jpg", 512, (u, v) => fbm(u, v, 48, 48, 3), 0.9);
}

console.log("Generating textures into public/textures …");
await timber();
await birch();
await vinyl();
await rubber();
await grass();
await paver();
await soil();
await cladding();
console.log("Done.");
