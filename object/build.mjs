import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import * as A from "../kit/audit.mjs";
import { turnScript } from "../scripts/inline-kit.mjs";
import { scene, PAGE_HELPERS } from "./scene.mjs";
import { FILM, FIGURE, FEATURE_KEYS } from "./film.mjs";
import { TOUR } from "./study.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const W = 640;
const H = 427;
const S = scene({ W, H, radius: FILM.radius, pad: 4 });
// the hand hangs off the forearm cuff, so the cuff base is what the support check grows from
A.auditOrExit(S.R, S.P, { ground: (shape) => shape.name.startsWith("cuff.flange.b") });
const counts = { parts: S.out.report.parts, assemblies: S.obj.explode.length, ...(S.obj.counts ?? {}) };
const fill = (text) => text.replace(/\{(\w+)\}/g, (_, key) => counts[key] ?? `{${key}}`);
const keyList = FEATURE_KEYS.map((f) => f.key.toUpperCase()).join(" ");
const keySpeech = FEATURE_KEYS.map((f) => `${f.key.toUpperCase()} ${f.verb}`).join(", ");
// narration is optional: the page builds fine without it and the voice toggle just stays off
const audioFile = (i) => join(HERE, "..", "audio", `tour-${String(i).padStart(2, "0")}.wav`);
const AUDIO_FILES = Object.fromEntries(
  TOUR.map((_, i) => [i, existsSync(audioFile(i)) ? `../audio/tour-${String(i).padStart(2, "0")}.wav` : null]).filter(([, v]) => v),
);
const css = `${S.out.css}
.study-wrap{display:grid;grid-template-columns:minmax(0,1fr) 308px;align-items:start}
.iso-stage{position:relative;cursor:grab;outline:none;touch-action:none}
.iso-stage:active{cursor:grabbing}
.iso-stage:focus-visible{box-shadow:0 0 0 1px var(--anatomy-mid)}
.iso-face-text[data-tone="lit"]{fill:var(--anatomy-lit)}
.iso-face-text[data-tone="mid"]{fill:var(--anatomy-mid)}
.tip{position:absolute;z-index:5;max-width:250px;padding:8px 10px;background:var(--anatomy-card);border:1px solid var(--anatomy-lo);border-radius:6px;font-size:12px;line-height:1.45;pointer-events:none;box-shadow:var(--anatomy-lift)}
.tip b{display:block;color:var(--anatomy-strong);font-weight:600;letter-spacing:.02em}
.tip span{display:block;color:var(--anatomy-text);margin-top:2px}
.iso-stage [data-cat].hov,.iso-stage [data-cat].hl{filter:drop-shadow(0 0 5px var(--anatomy-lit))}
.iso-stage[data-hide~="structure"] [data-cat="structure"]{display:none}
.iso-stage[data-hide~="drive"] [data-cat="drive"]{display:none}
.iso-stage[data-hide~="sense"] [data-cat="sense"]{display:none}
.iso-stage[data-isolate]:not([data-isolate=""]) [data-cat]{display:none}
.iso-stage[data-isolate]:not([data-isolate=""]) [data-cat].iso-on{display:inline}
.study{display:flex;flex-direction:column;min-width:0}
/* accordion — one section open at a time, so the panel fits the screen */
.acc{border-top:1px solid var(--anatomy-faint)}
.acc:first-child{border-top:0}
.acc-h{display:flex;align-items:center;justify-content:space-between;width:100%;gap:8px;background:none;border:0;color:var(--anatomy-muted);font-family:var(--anatomy-mono);font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:9px 0;cursor:pointer;text-align:left}
.acc-h .chev{transition:transform .18s}
.acc-b{display:none;padding:1px 0 13px}
.acc.open .acc-b{display:block}
.acc.open .chev{transform:rotate(180deg)}
.acc-b .study-block{display:flex;flex-direction:column;gap:8px;min-width:0}
/* top bar */
.topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:2px 2px 10px;flex:none}
.brand{display:flex;align-items:baseline;gap:8px;min-width:0}
.brand-title{font:700 15px/1.2 system-ui;letter-spacing:.01em;color:var(--anatomy-strong)}
.brand-sub{font:600 10px/1 system-ui;color:var(--anatomy-muted);letter-spacing:.16em;text-transform:uppercase}
.toplinks{display:flex;align-items:center;gap:12px;flex:none}
.toplinks a{font:600 11px/1 system-ui;color:var(--anatomy-muted);text-decoration:none;letter-spacing:.04em}
.toplinks a:hover{color:var(--anatomy-strong)}
.iconbtn{display:grid;place-items:center;width:28px;height:28px;padding:0;border:1px solid var(--anatomy-faint);border-radius:8px;background:transparent;color:var(--anatomy-strong);cursor:pointer;font-size:14px;line-height:1}
.iconbtn:hover{border-color:var(--anatomy-mid)}
/* study notes — text + static diagram */
.toc{display:flex;flex-direction:column;gap:1px;margin:0 0 10px}
.toc a{display:block;font:600 11px/1.5 system-ui;color:var(--anatomy-muted);text-decoration:none;padding:2px 0 2px 9px;border-left:2px solid var(--anatomy-faint)}
.toc a:hover{color:var(--anatomy-strong);border-left-color:var(--anatomy-mid)}
.note-h{font:700 12px/1.3 system-ui;margin:13px 0 4px;color:var(--anatomy-strong)}
.note-h:first-child{margin-top:0}
.note-p{font:400 11.5px/1.6 system-ui;color:var(--anatomy-mid);margin:0}
.note-img{display:block;width:100%;height:auto;margin:9px 0 2px;border:1px solid var(--anatomy-faint);border-radius:8px;background:var(--anatomy-card)}
.study-block.grow{flex:1;min-height:0}
.study-h{font-family:var(--anatomy-mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--anatomy-muted)}
.count{color:var(--anatomy-text);font-weight:400;letter-spacing:0;text-transform:none}
.btn{font:inherit;font-size:12px;color:var(--anatomy-text);background:transparent;border:1px solid var(--anatomy-lo);border-radius:5px;padding:5px 10px;cursor:pointer}
.btn:hover{color:var(--anatomy-strong);border-color:var(--anatomy-mid)}
.btn.primary{color:var(--anatomy-strong);border-color:var(--anatomy-mid)}
.btn.icon{width:30px;padding:5px 0}
.tour-row{display:flex;align-items:center;gap:6px}
.tour-step{font-family:var(--anatomy-mono);font-size:11px;color:var(--anatomy-muted);flex:1;text-align:center}
.tour-body{margin:0;font-size:12.5px;line-height:1.55;color:var(--anatomy-text)}
.check{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--anatomy-text);cursor:pointer}
.check input{accent-color:var(--anatomy-mid)}
.sw{width:10px;height:10px;border-radius:2px;display:inline-block}
.sw.structure{background:#8f959b}.sw.drive{background:#c9784f}.sw.sense{background:#a893cf}
.search{font:inherit;font-size:12px;color:var(--anatomy-strong);background:transparent;border:1px solid var(--anatomy-lo);border-radius:5px;padding:5px 8px;width:100%}
.part-list{list-style:none;margin:0;padding:0;overflow:auto;max-height:320px;border-top:1px solid var(--anatomy-faint)}
.part-list .grp{font-family:var(--anatomy-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--anatomy-muted);padding:8px 4px 3px;display:flex;justify-content:space-between}
.part-list .prt{font-size:12px;color:var(--anatomy-text);padding:3px 6px;cursor:pointer;border-radius:4px}
.part-list .prt:hover{background:var(--anatomy-card);color:var(--anatomy-strong)}
.specs{margin:0;display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:12px}
.specs dt{color:var(--anatomy-muted)}
.specs dd{margin:0;color:var(--anatomy-strong);text-align:right}
.range{width:100%;accent-color:var(--anatomy-mid)}
.slider{display:grid;grid-template-columns:78px 1fr;align-items:center;gap:8px;font-size:12px;color:var(--anatomy-text)}
.slider input{width:100%;accent-color:var(--anatomy-mid)}
@media (max-width:900px){.study-wrap{grid-template-columns:1fr}.study{border-top:1px solid var(--anatomy-faint)}}
/* one screen: the page becomes a fixed-height stage with a scrolling panel */
@media (min-width:860px){
  html,body{height:100%}
  .iso-page{width:100%;max-width:1360px;margin:0 auto;height:100dvh;padding:10px 16px;display:flex;flex-direction:column;overflow:hidden}
  .study-wrap{flex:1;min-height:0;grid-template-columns:minmax(0,1fr) 340px;gap:16px}
  .iso-stage{min-height:0}
  .study{min-height:0;overflow-y:auto;padding-right:6px}
}
/* isolate a whole digit: same trick as data-isolate, but matched on the leading token */
.iso-stage[data-finger]:not([data-finger=""]) [data-cat]{display:none}
.iso-stage[data-finger]:not([data-finger=""]) [data-cat].iso-on{display:inline}
.finger-row{display:flex;flex-wrap:wrap;gap:5px}
.finger-row .btn{font-size:11px;padding:4px 7px}
.btn[aria-pressed="true"]{color:var(--anatomy-strong);border-color:var(--anatomy-mid);background:var(--anatomy-card)}`;
const halo = `<ellipse cx="${W / 2}" cy="${H * 0.72}" rx="${W * 0.17}" ry="${H * 0.022}" class="iso-halo" style="filter:blur(8px)"/>`;
const aria = `${FIGURE.title}: drag to turn it, hover a part to identify it, click to isolate it, arrow keys turn it, A takes it apart${keySpeech ? `, ${keySpeech}` : ""}`;
const stage = `<div class="iso-stage iso-turn ar-stage" tabindex="0" role="slider" aria-label="${aria}" aria-valuetext="assembled">${k.figureSvg({ width: W, height: H, label: fill(FIGURE.label), body: halo })}${S.out.layerSvg("live", { width: W, height: H })}<div class="tip" id="tip" hidden></div></div>`;
const topbar = `<header class="topbar">
  <div class="brand"><span class="brand-title">Robot Hand</span><span class="brand-sub">anatomy</span></div>
  <nav class="toplinks">
    <a href="https://github.com/salik/robot-hand-anatomy" target="_blank" rel="noopener">Github</a>
    <a href="https://x.com/salik" target="_blank" rel="noopener">@salik</a>
    <button id="themeBtn" class="iconbtn" aria-label="Toggle day and night" title="Day / night">&#9788;</button>
  </nav>
</header>`;
const panel = `<aside class="study">
  <section class="acc open">
    <button class="acc-h" type="button">Tour <span class="chev">&#9662;</span></button>
    <div class="acc-b">
      <div class="study-block">
        <div class="tour-row">
          <button id="tourBtn" class="btn primary">Start tour</button>
          <button id="tourPlay" class="btn">Play</button>
          <button id="audioBtn" class="btn" aria-pressed="false" title="Narration on/off">Voice off</button>
        </div>
        <div class="tour-row">
          <button id="tourPrev" class="btn icon" aria-label="Previous step">&#8249;</button>
          <span id="tourStep" class="tour-step">1 / ${TOUR.length}</span>
          <button id="tourNext" class="btn icon" aria-label="Next step">&#8250;</button>
        </div>
        <p id="tourBody" class="tour-body">Step through the hand, part by part.</p>
      </div>
    </div>
  </section>
  <section class="acc">
    <button class="acc-h" type="button">Pose <span class="chev">&#9662;</span></button>
    <div class="acc-b">
      <div class="study-block">
        <div class="study-h">Explode <span id="explodeVal" class="count">0%</span></div>
        <input id="explode" class="range" type="range" min="0" max="100" value="0">
      </div>
      <div class="study-block">
        <div class="study-h">Joints</div>
        <label class="slider"><span>Fist</span><input type="range" data-joint="fist" min="0" max="100" value="0"></label>
        <label class="slider"><span>Spread</span><input type="range" data-joint="spread" min="0" max="100" value="0"></label>
        <label class="slider"><span>Thumb</span><input type="range" data-joint="thumb" min="0" max="100" value="0"></label>
        <label class="slider"><span>Wrist yaw</span><input type="range" data-joint="wristY" min="-50" max="50" value="0"></label>
        <label class="slider"><span>Wrist pitch</span><input type="range" data-joint="wristP" min="-45" max="45" value="0"></label>
      </div>
      <div class="study-block">
        <div class="tour-row">
          <button id="flatBtn" class="btn">Lay flat</button>
          <button id="resetBtn" class="btn">Reset</button>
        </div>
      </div>
    </div>
  </section>
  <section class="acc">
    <button class="acc-h" type="button">Layers <span class="chev">&#9662;</span></button>
    <div class="acc-b">
      <div class="study-block">
        <label class="check"><input type="checkbox" data-layer="structure" checked><i class="sw structure"></i>Structure</label>
        <label class="check"><input type="checkbox" data-layer="drive" checked><i class="sw drive"></i>Drive</label>
        <label class="check"><input type="checkbox" data-layer="sense" checked><i class="sw sense"></i>Sense</label>
      </div>
    </div>
  </section>
  <section class="acc">
    <button class="acc-h" type="button">Digits <span class="chev">&#9662;</span></button>
    <div class="acc-b">
      <div class="study-block">
        <div class="finger-row" id="fingerRow">
          <button class="btn" data-finger="i" aria-pressed="false">Index</button>
          <button class="btn" data-finger="m" aria-pressed="false">Middle</button>
          <button class="btn" data-finger="r" aria-pressed="false">Ring</button>
          <button class="btn" data-finger="l" aria-pressed="false">Little</button>
          <button class="btn" data-finger="t" aria-pressed="false">Thumb</button>
        </div>
      </div>
    </div>
  </section>
  <section class="acc">
    <button class="acc-h" type="button">Parts <span class="count">${counts.parts}</span> <span class="chev">&#9662;</span></button>
    <div class="acc-b">
      <div class="study-block grow">
        <input id="partSearch" class="search" type="search" placeholder="Filter parts…">
        <ul id="partList" class="part-list"></ul>
      </div>
      <div class="study-block">
        <div class="study-h">Specs</div>
        <dl id="specs" class="specs"></dl>
      </div>
    </div>
  </section>
  <section class="acc">
    <button class="acc-h" type="button">Study notes <span class="chev">&#9662;</span></button>
    <div class="acc-b">
      <div class="study-block">
        <div class="toc">
          <a href="#note-overview">Overview</a>
          <a href="#note-drive">Actuation</a>
          <a href="#note-wrist">Wrist transition</a>
          <a href="#note-finger">A finger</a>
          <a href="#note-thumb">The thumb</a>
          <a href="#note-palm">The palm</a>
        </div>
        <h3 class="note-h" id="note-overview">Overview</h3>
        <p class="note-p">A 22-degree-of-freedom tendon-driven hand on a 25-actuator forearm module: four fingers, an opposed thumb and a two-axis wrist. Every joint is a real hinge, and every tendon runs from a motor in the cuff to a fingertip.</p>
        <h3 class="note-h" id="note-drive">Actuation</h3>
        <p class="note-p">Twenty-five motor units sit in two rings inside the forearm cuff. Each one winds a single tendon, so the hand carries no motors in the fingers at all.</p>
        <img class="note-img" src="diagrams/drive.png" alt="Forearm drive module" loading="lazy">
        <h3 class="note-h" id="note-wrist">Wrist transition</h3>
        <p class="note-p">The wrist has two axes, pitch and yaw. The tendons cross the rotation centre, so no cable has to stretch or slack as the wrist moves.</p>
        <img class="note-img" src="diagrams/wrist.png" alt="Wrist cable transition" loading="lazy">
        <h3 class="note-h" id="note-finger">A finger</h3>
        <p class="note-p">Each finger is three phalanges on rolling knuckles. The middle and distal joints are coupled, so one tendon curls both and the finger closes as a single smooth curve.</p>
        <img class="note-img" src="diagrams/finger.png" alt="Index finger" loading="lazy">
        <h3 class="note-h" id="note-thumb">The thumb</h3>
        <p class="note-p">The thumb is opposed on a two-axis base — sweep and tilt — then two more joints. Four degrees of freedom, so it can meet any fingertip.</p>
        <img class="note-img" src="diagrams/thumb.png" alt="Thumb" loading="lazy">
        <h3 class="note-h" id="note-palm">The palm</h3>
        <p class="note-p">The palm carries a compliant sensor pad on the front and a control board on the back, both mounted on a structural core.</p>
        <img class="note-img" src="diagrams/palm.png" alt="Palm" loading="lazy">
      </div>
    </div>
  </section>
</aside>`;
const body = k.plateHtml({
  fig: "Fig 1",
  title: "",
  hint: `Drag · hover a part · click to isolate · ${keyList}`,
  readout: "",
  keys: FIGURE.keys,
  caption: fill(FIGURE.caption),
  body: `<style>${css}</style>${topbar}<div class="study-wrap">${stage}${panel}</div>`,
});
const film = readFileSync(join(HERE, "film.mjs"), "utf8").replace(/^export /gm, "");
const study = readFileSync(join(HERE, "study.mjs"), "utf8").replace(/^export /gm, "");
const DATA = { turn: S.out.data, explode: S.obj.explode, basis: S.basis, parts: counts.parts, assemblies: counts.assemblies };
const LIVE = readFileSync(join(HERE, "live.js"), "utf8")
  .replace("__DATA__", JSON.stringify(DATA))
  .replace("__HELPERS__;", PAGE_HELPERS)
  .replace("__FILM__;", film)
  .replace("__STUDY__;", `${study}\nconst STUDY = { metaOf, SPECS, TOUR, fingerOf };`)
  .replace("__THEME__", JSON.stringify(theme))
  .replace("__AUDIO__", JSON.stringify(AUDIO_FILES));
const page = k.pageHtml({ title: FIGURE.title, theme, body, script: turnScript() + LIVE, width: 960 });
const name = `figure${theme === "light" ? "-light" : ""}.html`;
writeFileSync(join(HERE, name), page);
console.log(`wrote ${name} · ${(page.length / 1024).toFixed(0)} KB · ${counts.parts} parts · ${counts.assemblies} assemblies · build ${S.seconds.toFixed(1)} s`);
