import { launch } from "../scripts/browser.mjs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const file = process.argv[2] ?? "object/test-light.html";
const prefix = process.argv[3] ?? "shots/snap";
const FIST = {
  "i.mcp": -84, "m.mcp": -84, "r.mcp": -84, "l.mcp": -84,
  "i.pip": -86, "m.pip": -86, "r.pip": -86, "l.pip": -86,
  "i.dip": -46, "m.dip": -46, "r.dip": -46, "l.dip": -46,
};
const STATES = [
  { yaw: -35, pitch: 15 },
  { yaw: 140, pitch: 20 },
  { yaw: -35, pitch: 15, apart: 1 },
  { yaw: -30, pitch: 18, ...FIST },
  { yaw: -30, pitch: 18, "i.spread": 24, "m.spread": 6, "r.spread": -10, "l.spread": -26 },
  { yaw: -20, pitch: 20, "t.o1": -34, "t.o2": -30, "t.mcp": -20, "t.ip": -24 },
];

const browser = await launch();
const page = await browser.newPage();
await page.setViewport({ width: 700, height: 700, deviceScaleFactor: 1 });
await page.on("console", (m) => console.log("console:", m.text()));
await page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.goto(pathToFileURL(resolve(file)).href);
await page.waitForFunction(() => window.ready);
await page.evaluate(() => {
  document.body.style.margin = "0";
  const st = document.querySelector(".iso-stage");
  st.style.width = "640px";
});
let i = 0;
for (const state of STATES) {
  const stats = await page.evaluate((s) => {
    const r = window.set(s);
    const svgs = [...document.querySelectorAll(".iso-stage svg")];
    const live = svgs[svgs.length - 1];
    const b = live.getBBox();
    if (b.width) {
      const W = 640;
      const H = 640;
      const zoom = Math.min(1.9, (W * 0.86) / b.width, (H * 0.78) / b.height);
      const cx = b.x + b.width / 2;
      const cy = b.y + b.height / 2;
      const vb = `${(cx - W / zoom / 2).toFixed(2)} ${(cy - H / zoom / 2).toFixed(2)} ${(W / zoom).toFixed(2)} ${(H / zoom).toFixed(2)}`;
      for (const svg of svgs) svg.setAttribute("viewBox", vb);
    }
    return r;
  }, state);
  if (stats.forced || stats.unseparated) console.log(JSON.stringify(state), JSON.stringify(stats));
  await new Promise((r) => setTimeout(r, 80));
  const el = await page.$(".iso-stage");
  await el.screenshot({ path: `${prefix}_${i}.png` });
  i++;
}
await browser.close();
console.log(`wrote ${i} shots to ${prefix}_*.png`);
