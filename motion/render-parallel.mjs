// Render motion.html to a sequence of PNG frames, parallelised across workers.
//   node motion/render-parallel.mjs <outDir> <fromSec> <toSec> [fps] [workers]
// Frames are named f_NNNNN.png by absolute frame index, so a split render can be
// concatenated straight into ffmpeg.
import { launch } from "../scripts/browser.mjs";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const outDir = process.argv[2];
const from = Number(process.argv[3] ?? 0);
const to = Number(process.argv[4] ?? 10);
const fps = Number(process.argv[5] ?? 30);
const workers = Number(process.argv[6] ?? 3);
mkdirSync(outDir, { recursive: true });

const n0 = Math.round(from * fps);
const n1 = Math.round(to * fps);
const chunk = Math.ceil((n1 - n0) / workers);

const run = async (w) => {
  const browser = await launch();
  const page = await browser.newPage();
  await page.goto(pathToFileURL(join(HERE, "motion.html")).href);
  await page.waitForFunction(() => window.ready);
  const size = await page.evaluate(() => window.SIZE);
  await page.setViewport({ width: size.W, height: size.H, deviceScaleFactor: 2 });
  await page.evaluate(() => document.fonts.ready);
  const root = await page.$(".mo");
  const a = n0 + w * chunk;
  const b = Math.min(n1, a + chunk);
  for (let n = a; n < b; n++) {
    await page.evaluate((t) => window.frame(t), n / fps);
    await root.screenshot({ path: join(outDir, `f_${String(n).padStart(5, "0")}.png`), type: "png" });
  }
  await browser.close();
  console.log(`worker ${w}: frames ${a}..${b - 1} (${b - a})`);
};

const t0 = Date.now();
await Promise.all([...Array(workers).keys()].map(run));
console.log(`rendered ${n1 - n0} frames into ${outDir} in ${((Date.now() - t0) / 1e3).toFixed(0)}s`);
process.exit(0);
