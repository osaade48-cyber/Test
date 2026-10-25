// Prepares the reflection HDRI used by the 3D scene.
//
//   node scripts/prepare-hdri.mjs scripts/source/rooitou_park_1k.hdr public/hdri/garden_soft_1k.hdr
//
// The source (Poly Haven "Rooitou Park", CC0) has a very bright low sun and a strongly green
// lawn. Both tint the Colorbond panels. This clamps the sun (the scene's own directional light
// provides sunlight and shadows) and neutralises the ground towards warm grey, keeping the
// real sky and tree reflections.
// Source: https://polyhaven.com/a/rooitou_park (1k .hdr).
import { readFileSync, writeFileSync } from "node:fs";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { FloatType } from "three";

const [src, dst] = process.argv.slice(2);
const buf = readFileSync(src);
const loader = new HDRLoader();
loader.setDataType(FloatType);
const { width: w, height: h, data } = loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

const MAX = 6;
for (let y = 0; y < h; y++) {
  const ground = y > h * 0.5 ? Math.min(1, (y - h * 0.5) / (h * 0.06)) : 0;
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    let r = data[i], g = data[i + 1], b = data[i + 2];
    const peak = Math.max(r, g, b);
    if (peak > MAX) {
      const k = MAX / peak;
      r *= k; g *= k; b *= k;
    }
    if (ground === 0) {
      // soften the blue of the sky a little so reflections stay neutral
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r += (l - r) * 0.9; g += (l - g) * 0.9; b += (l - b) * 0.9;
    } else {
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const t = 0.8 * ground;
      r = r + (l * 1.04 - r) * t;
      g = g + (l * 1.0 - g) * t;
      b = b + (l * 0.93 - b) * t;
    }
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
}

// ---- Radiance RGBE writer with run-length encoding ----
function rgbe(r, g, b) {
  const v = Math.max(r, g, b);
  if (v < 1e-32) return [0, 0, 0, 0];
  const e = Math.ceil(Math.log2(v));
  const s = 256 / Math.pow(2, e);
  return [Math.min(255, Math.floor(r * s)), Math.min(255, Math.floor(g * s)), Math.min(255, Math.floor(b * s)), e + 128];
}
function rleChannel(bytes, out) {
  let i = 0;
  while (i < bytes.length) {
    let run = 1;
    while (i + run < bytes.length && bytes[i + run] === bytes[i] && run < 127) run++;
    if (run >= 4) {
      out.push(128 + run, bytes[i]);
      i += run;
    } else {
      const start = i;
      let n = 0;
      while (i < bytes.length && n < 128) {
        let r2 = 1;
        while (i + r2 < bytes.length && bytes[i + r2] === bytes[i] && r2 < 4) r2++;
        if (r2 >= 4) break;
        i++; n++;
      }
      out.push(n, ...bytes.slice(start, start + n));
    }
  }
}
const out = [...Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${h} +X ${w}\n`, "ascii")];
const ch = [new Array(w), new Array(w), new Array(w), new Array(w)];
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const p = rgbe(data[i], data[i + 1], data[i + 2]);
    for (let c = 0; c < 4; c++) ch[c][x] = p[c];
  }
  out.push(2, 2, (w >> 8) & 0xff, w & 0xff);
  for (let c = 0; c < 4; c++) rleChannel(ch[c], out);
}
writeFileSync(dst, Buffer.from(out));
console.log(`wrote ${dst} (${(out.length / 1024).toFixed(0)} KB)`);
