// Render a static diagram of each study sub-assembly, straight off the live page.
//
//   node object/study-shots.mjs
//
// Writes object/diagrams/<id>.png — one per entry in DIAGRAMS below. Each shot
// hides every part whose data-name does not match the sub-assembly, re-frames the
// camera on what is left, and captures the stage at 2x.
import { launch } from "../scripts/browser.mjs";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "diagrams");
mkdirSync(OUT, { recursive: true });

// a sub-assembly is just a name prefix — the parts are already named for it
const DIAGRAMS = [
  { id: "drive", label: "Forearm drive module", re: /^(motor|cuff|pack|bundle)\./ },
  { id: "wrist", label: "Wrist cable transition", re: /^(wrist|guide)\./ },
  { id: "finger", label: "Index finger", re: /^i\./ },
  { id: "thumb", label: "Thumb", re: /^t\./ },
  { id: "palm", label: "Palm", re: /^palm\./ },
];

const browser = await launch();
const page = await browser.newPage();
await page.setViewport({ width: 640, height: 427, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(join(HERE, "figure.html")).href);
await page.waitForFunction(() => window.__anatomy);
await page.evaluate(() => document.fonts.ready);

for (const d of DIAGRAMS) {
  await page.evaluate((src) => {
    const re = new RegExp(src);
    for (const el of document.querySelectorAll(".iso-stage [data-cat]"))
      el.style.display = re.test(el.dataset.name) ? "" : "none";
    window.__anatomy.paint(0);
  }, d.re.source);
  await new Promise((r) => setTimeout(r, 120));
  const file = join(OUT, `${d.id}.png`);
  await (await page.$(".iso-stage")).screenshot({ path: file, type: "png" });
  console.log(`out: ${file} — ${d.label}`);
}
await browser.close();
process.exit(0);
