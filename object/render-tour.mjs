// Render the 12-step guided tour of object/figure.html into an MP4 frame sequence.
//
//   node object/render-tour.mjs <outDir> [fps] [workers]
//
// Each tour step is a static hold for the length of its narration, so only the
// camera moves between steps need the depth-order solver — a hold renders one
// frame and writes that buffer to the rest. That turns a ~2900-frame render
// into ~250 solver calls.
import { launch } from "../scripts/browser.mjs";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FPS = Number(process.argv[3] ?? 30);
const WORKERS = Number(process.argv[4] ?? 3);
const TRANSITION = 1.1; // seconds of camera move between steps
const GAP = 0.35; // breath of held frame between steps
mkdirSync(process.argv[2], { recursive: true });

// ---- pull the tour straight out of study.mjs ----
const src = readFileSync(join(HERE, "study.mjs"), "utf8");
const block = src.slice(src.indexOf("export const TOUR = ["), src.indexOf("\n];"));
const NUM = ["yaw", "pitch", "roll", "apart", "fist", "thumb", "spread", "wristY", "wristP"];
const steps = block
  .split(/\n  \{\n/)
  .slice(1)
  .map((e) => {
    const o = {};
    for (const k of NUM) {
      const m = e.match(new RegExp(`\\b${k}:\\s*(-?[\\d.]+)`));
      if (m) o[k] = Number(m[1]);
    }
    for (const k of ["layer", "isolate"]) {
      const m = e.match(new RegExp(`\\b${k}:\\s*(null|"(?:[^"\\\\]|\\\\.)*")`));
      if (m) o[k] = m[1] === "null" ? null : m[1].slice(1, -1);
    }
    const t = e.match(/\btitle:\s*"((?:[^"\\]|\\.)*)"/);
    if (t) o.title = t[1];
    const b = e.match(/\bbody:\s*"((?:[^"\\]|\\.)*)"/);
    if (b) o.body = b[1];
    return o;
  });
if (steps.length !== 12) throw new Error(`expected 12 tour steps, parsed ${steps.length}`);

// ---- narration lengths, read off the WAV headers ----
const dur = (p) => {
  const b = readFileSync(p);
  const ch = b.readUInt16LE(22);
  const sr = b.readUInt32LE(24);
  const bits = b.readUInt16LE(34);
  return (b.readUInt32LE(40) || b.length - 44) / (sr * ch * (bits / 8));
};
const audio = (i) => join(HERE, "..", "audio", `tour-${String(i).padStart(2, "0")}.wav`);
const durs = steps.map((_, i) => dur(audio(i)));

// ---- lay the edit out as absolute frame segments ----
const BASE = { yaw: 0, pitch: 0, roll: -95, apart: 0, fist: 0, thumb: 0, spread: 0, wristY: 0, wristP: 0, layer: null, isolate: null };
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const stateOf = (s) => ({ ...BASE, ...s });

const segments = [];
let cursor = 0;
const push = (seg, n) => {
  seg.n = Math.max(1, Math.round(n));
  seg.start = cursor;
  cursor += seg.n;
  seg.end = cursor;
  segments.push(seg);
};
for (let i = 0; i < steps.length; i++) {
  if (i > 0) push({ kind: "move", from: stateOf(steps[i - 1]), to: stateOf(steps[i]), i }, TRANSITION * FPS);
  push({ kind: "hold", state: stateOf(steps[i]), i }, (durs[i] + GAP) * FPS);
}
const TOTAL = cursor;
console.log(`${steps.length} steps · ${TOTAL} frames · ${(TOTAL / FPS).toFixed(1)}s · ${TRANSITION}s moves`);

const CAPTION = (i, phase) => `
  const s=document.querySelector('.iso-stage');
  let o=document.getElementById('tour-cap');
  if(!o){o=document.createElement('div');o.id='tour-cap';
    o.style.cssText='position:absolute;left:0;right:0;bottom:0;padding:14px 22px 16px;background:linear-gradient(transparent,rgba(0,0,0,.72) 38%);color:#fff;pointer-events:none;text-align:center';
    s.appendChild(o);}
  o.innerHTML='<div style="font:600 11px/1 ui-monospace;letter-spacing:.22em;opacity:.75;text-transform:uppercase">Step ${i + 1} / ${steps.length} · ${phase}</div>'
    +'<div style="font:600 21px/1.25 system-ui;margin-top:5px">${steps[i].title}</div>'
    +'<div style="font:400 14px/1.45 system-ui;opacity:.85;margin-top:3px">${steps[i].body}</div>';`;

const run = async (w, a, b) => {
  const browser = await launch();
  const page = await browser.newPage();
  await page.goto(pathToFileURL(join(HERE, "figure.html")).href);
  await page.waitForFunction(() => window.__anatomy);
  const size = await page.evaluate(() => window.SIZE);
  await page.setViewport({ width: size.W, height: size.H, deviceScaleFactor: 2 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => { const t = document.getElementById("tip"); if (t) t.hidden = true; });
  const root = await page.$(".iso-stage");
  const segOf = (n) => segments.find((s) => n >= s.start && n < s.end);
  let cache = null;
  let cacheSeg = null;
  for (let n = a; n < b; n++) {
    const seg = segOf(n);
    const file = join(process.argv[2], `f_${String(n).padStart(5, "0")}.png`);
    if (seg.kind === "move") {
      const st = { ...seg.to };
      for (const k of NUM) st[k] = lerp(seg.from[k], seg.to[k], smooth((n - seg.start) / seg.n));
      await page.evaluate((s) => window.__anatomy.set(s), st);
      await page.evaluate(CAPTION(seg.i, "coming up"), seg.i);
      await root.screenshot({ path: file, type: "png" });
      cache = null;
      cacheSeg = null;
    } else {
      if (cacheSeg !== seg) {
        await page.evaluate((s) => window.__anatomy.set(s), seg.state);
        await page.evaluate(CAPTION(seg.i, "now showing"), seg.i);
        cache = await root.screenshot({ type: "png" });
        cacheSeg = seg;
      }
      writeFileSync(file, cache);
    }
  }
  await browser.close();
  console.log(`worker ${w}: frames ${a}..${b - 1}`);
};

await Promise.all([...Array(WORKERS).keys()].map((w) => run(w, Math.floor((TOTAL * w) / WORKERS), Math.floor((TOTAL * (w + 1)) / WORKERS))));
console.log(`rendered ${TOTAL} frames into ${process.argv[2]}`);
process.exit(0);
