// Renders the site's marketing images from the live 3D model via the /render route.
//
//   npm run dev            (in another terminal)
//   node scripts/render-images.mjs [baseUrl]
//
// Requires Playwright (npm i -D playwright && npx playwright install chromium).
// Re-run after changing the model or materials so imagery always matches the configurator.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const BASE = process.argv[2] || "http://localhost:3000";
const ROOT = join(process.cwd(), "public");

const cfg = (o) =>
  new URLSearchParams({ size: "L", colour: "charcoal", look: "flat", inside: "ply", floor: "vinyl", addons: "deck,lights,planter", ...o }).toString();

const SHOTS = [
  { out: "images/hero-poster.jpg", w: 1920, h: 1080, q: cfg({ name: "ARCHIE", time: "dusk", view: "hero" }) },
  { out: "images/hero-poster-mobile.jpg", w: 780, h: 1688, q: cfg({ name: "ARCHIE", time: "dusk", view: "hero" }) },
  { out: "images/the-home.jpg", w: 2400, h: 1350, q: cfg({ name: "ARCHIE", view: "overview" }) },
  { out: "images/craft.jpg", w: 1600, h: 1600, q: cfg({ name: "ARCHIE", view: "plaque" }) },
  { out: "images/gallery/dusk-front.jpg", w: 1600, h: 1900, q: cfg({ name: "ARCHIE", time: "dusk", view: "front" }) },
  { out: "images/gallery/white-day.jpg", w: 1600, h: 1200, q: cfg({ colour: "white", look: "bnb", name: "BONNIE", view: "overview" }) },
  { out: "images/gallery/interior.jpg", w: 1600, h: 1200, q: cfg({ colour: "neutral", addons: "deck,lights,planter,bed", view: "interior" }) },
  { out: "images/gallery/neutral-left.jpg", w: 1600, h: 1200, q: cfg({ colour: "neutral", view: "left" }) },
  { out: "images/gallery/plaque.jpg", w: 1600, h: 1200, q: cfg({ colour: "neutral", look: "bnb", name: "MILO", view: "plaque", door: "closed" }) },
  { out: "images/gallery/dusk-left.jpg", w: 1600, h: 1200, q: cfg({ colour: "white", name: "BONNIE", time: "dusk", view: "left" }) },
  { out: "app-og.jpg", w: 1200, h: 630, q: cfg({ name: "ARCHIE", time: "dusk", view: "hero" }) },
];

const only = process.env.ONLY;
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const s of SHOTS) {
  if (only && !s.out.includes(only)) continue;
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/render?${s.q}`, { waitUntil: "networkidle", timeout: 180000 });
  await page.waitForSelector("html[data-render-ready]", { timeout: 300000 });
  const file = s.out === "app-og.jpg" ? join(process.cwd(), "src/app/opengraph-image.jpg") : join(ROOT, s.out);
  mkdirSync(dirname(file), { recursive: true });
  await page.screenshot({ path: file, type: "jpeg", quality: 84, timeout: 120000 });
  console.log("rendered", s.out);
  await page.close();
}
await browser.close();
