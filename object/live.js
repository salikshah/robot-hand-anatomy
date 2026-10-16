const DATA = __DATA__;
__HELPERS__;
__FILM__;
__STUDY__;

const stage = document.querySelector(".iso-stage");
const readout = document.querySelector("[data-readout]");
const tip = document.getElementById("tip");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const THEME0 = __THEME__;
const AUDIO_FILES = __AUDIO__;
const START = FIGURE.start ?? { yaw: 0, pitch: 0, roll: -135 };
const target = { yaw: START.yaw, pitch: START.pitch, roll: START.roll ?? 0, apart: 0, layer: null, isolate: null, finger: null, highlight: null, ...FEATURE_DEFAULTS };
const drawn = { ...target };
const EASES = { yaw: 0.22, pitch: 0.22, roll: 0.22, apart: 0.32 };
for (const f of FEATURE_KEYS) EASES[f.channel] = f.ease ?? 0.25;
let touring = false;
let guided = false;
let playing = false;
let tourStep = 0;
let tourClock = 0;
let frame = 0;
let last = 0;
let visible = false;
let drag = null;
let moved = 0;
let hovering = false;
let stateDirty = true;
const ctl = TURN.mount(stage, DATA.turn, { onHold: () => hold() });
window.TURN = TURN;

const tourBtn = document.getElementById("tourBtn");
const tourBody = document.getElementById("tourBody");
const tourStepEl = document.getElementById("tourStep");
const playBtn = document.getElementById("tourPlay");

// drawn.layer is the comma-separated set of HIDDEN categories (structure/drive/sense).
const META = STUDY.metaOf;
const PARTS = [...stage.querySelectorAll("[data-name]")].map((el) => {
  const name = el.dataset.name;
  const m = META(name);
  el.dataset.cat = m.cat;
  el.dataset.system = m.system;
  return { el, name, ...m };
});
const byName = new Map(PARTS.map((p) => [p.name, p]));
const GROUPS = ["structure", "drive", "sense"];

function hold() {
  touring = false;
  playing = false;
  guided = false;
  tourBtn.textContent = "Start tour";
}

const follow = (from, to, dt, seconds) => to + (from - to) * Math.exp(-dt / seconds);
const svgs = [...stage.querySelectorAll("svg")];
const live = svgs[svgs.length - 1];
const halo = svgs[0].querySelector(".iso-halo");
const VB = svgs[0].getAttribute("viewBox").split(" ").map(Number);
const view = { zoom: 1.4, cx: VB[2] / 2, cy: VB[3] / 2, y1: VB[3] * 0.7, w: VB[2] * 0.4 };

function frameView(dt) {
  const b = live.getBBox();
  if (!b.width) return false;
  const goal = {
    zoom: Math.min(30, (VB[2] * 0.8) / b.width, (VB[3] * 0.78) / b.height),
    cx: b.x + b.width / 2,
    cy: b.y + b.height / 2,
    y1: b.y + b.height,
    w: b.width,
  };
  let settling = false;
  for (const key in goal) {
    view[key] = dt ? follow(view[key], goal[key], dt, 0.24) : goal[key];
    if (Math.abs(view[key] - goal[key]) > (key === "zoom" ? 0.01 : 0.25)) settling = true;
  }
  const w = VB[2] / view.zoom;
  const h = VB[3] / view.zoom;
  const vb = `${(view.cx - w / 2).toFixed(2)} ${(view.cy - h / 2).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`;
  for (const svg of svgs) svg.setAttribute("viewBox", vb);
  halo.setAttribute("cx", view.cx.toFixed(2));
  halo.setAttribute("cy", (view.y1 + 10 / view.zoom + 6).toFixed(2));
  halo.setAttribute("rx", (view.w * 0.34).toFixed(2));
  halo.setAttribute("ry", (view.w * 0.034 + 2).toFixed(2));
  return settling;
}

function applyState() {
  stage.dataset.hide = (drawn.layer ?? "").replace(/,/g, " ");
  stage.dataset.isolate = drawn.isolate ?? "";
  stage.dataset.finger = drawn.finger ?? "";
  const finger = drawn.finger;
  for (const p of PARTS) {
    // a whole digit lights up: its own parts only, nothing else, so study is genuinely focused
    const on = finger ? fingerOf(p.name) === finger : p.name === drawn.isolate;
    p.el.classList.toggle("iso-on", on);
    p.el.classList.toggle("hl", p.name === drawn.highlight);
  }
}

function paint(dt = 0) {
  ctl.set({ root: { R: orient(drawn.yaw, drawn.pitch, drawn.roll) }, ...featureValues(drawn, explodeValues(drawn.apart)) });
  // hide/isolate first: the camera frames what is actually on screen, not what is about to be hidden
  if (stateDirty) {
    applyState();
    stateDirty = false;
  }
  const settling = frameView(still.matches ? 0 : dt);
  const state =
    drawn.apart > 0.02
      ? `apart ${Math.round(drawn.apart * 100)}% · ${DATA.parts} parts`
      : FEATURE_KEYS.map((f) => `${f.name.replace("wrist ", "")} ${Math.round(drawn[f.channel] * (f.pct ? 100 : 1))}${f.unit ?? ""}`).join(" · ") || `${DATA.parts} parts`;
  const text = `${state} · ${(((drawn.yaw % 360) + 360) % 360).toFixed(0)}°`;
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuetext", text);
  return settling;
}

function tick(now) {
  const dt = Math.min(0.05, last ? (now - last) / 1e3 : 0.016);
  last = now;
  if (guided && playing) {
    tourClock += dt;
    if (tourClock > 7) {
      tourClock = 0;
      gotoStep(tourStep + 1);
    }
  } else if (touring) {
    tourClock += dt;
    target.yaw = START.yaw + tourClock * 14;
    target.pitch = START.pitch + 8 * Math.sin(tourClock * 0.4);
    const lap = (tourClock % 26) / 26;
    target.apart = lap > 0.42 && lap < 0.64 ? 1 : 0;
    for (const f of FEATURE_KEYS) if (f.tour && f.values) target[f.channel] = lap > f.tour[0] && lap < f.tour[1] ? f.values[1] : f.values[0];
  }
  for (const key in target) if (typeof target[key] === "number") drawn[key] = follow(drawn[key], target[key], dt, (key === "yaw" || key === "pitch") && drag ? 0.06 : EASES[key]);
  const settling = paint(dt);
  const moving = settling || touring || drag || Object.keys(target).some((k) => typeof target[k] === "number" && Math.abs(drawn[k] - target[k]) > 0.01);
  frame = visible && moving ? requestAnimationFrame(tick) : 0;
  if (!frame) last = 0;
}

function run() {
  if (!frame && visible) frame = requestAnimationFrame(tick);
}

new IntersectionObserver((entries) => {
  visible = entries[0].isIntersecting;
  run();
}).observe(stage);

const hideTip = () => {
  tip.hidden = true;
  for (const p of PARTS) p.el.classList.remove("hov");
};

stage.addEventListener("pointerenter", (e) => {
  if (e.pointerType === "touch") return;
  hovering = true;
  hold();
});
stage.addEventListener("pointerleave", () => {
  hovering = false;
  hideTip();
  run();
});
stage.addEventListener("pointermove", (e) => {
  if (drag) return;
  const el = e.target.closest ? e.target.closest("[data-name]") : null;
  for (const p of PARTS) p.el.classList.toggle("hov", !!el && p.name === el.dataset.name);
  if (!el) return hideTip();
  const p = byName.get(el.dataset.name);
  if (!p) return hideTip();
  tip.innerHTML = `<b>${p.label}</b>${p.note ? `<span>${p.note}</span>` : ""}`;
  tip.hidden = false;
  const r = stage.getBoundingClientRect();
  tip.style.left = `${Math.min(e.clientX - r.left + 16, r.width - 250)}px`;
  tip.style.top = `${Math.max(e.clientY - r.top - 10, 6)}px`;
});
stage.addEventListener("pointerdown", (e) => {
  hold();
  drag = { x: e.clientX, y: e.clientY, yaw: target.yaw, pitch: target.pitch };
  moved = 0;
  stage.setPointerCapture(e.pointerId);
  run();
});
stage.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const w = stage.getBoundingClientRect().width;
  moved = Math.max(moved, Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y));
  target.yaw = drag.yaw + ((e.clientX - drag.x) / w) * 300;
  target.pitch = Math.max(-88, Math.min(88, drag.pitch - ((e.clientY - drag.y) / w) * 200));
  run();
});
const end = () => {
  drag = null;
  run();
};
stage.addEventListener("pointerup", end);
stage.addEventListener("pointercancel", end);
stage.addEventListener("click", (e) => {
  if (moved > 4) return;
  const el = e.target.closest ? e.target.closest("[data-name]") : null;
  if (!el) return;
  target.isolate = target.isolate === el.dataset.name ? null : el.dataset.name;
  target.finger = null;
  target.layer = null;
  syncLayerBoxes();
  syncFingerBtns();
  stateDirty = true;
  hold();
  run();
});
stage.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  const feature = FEATURE_KEYS.find((f) => f.key === key);
  if (key === "arrowleft") target.yaw -= 15;
  else if (key === "arrowright") target.yaw += 15;
  else if (key === "arrowup") target.pitch = Math.min(88, target.pitch + 10);
  else if (key === "arrowdown") target.pitch = Math.max(-88, target.pitch - 10);
  else if (key === "a" || key === " ") target.apart = target.apart ? 0 : 1;
  else if (key === "escape") resetView();
  else if (feature && feature.step) target[feature.channel] += feature.step;
  else if (feature && feature.values) target[feature.channel] = target[feature.channel] === feature.values[1] ? feature.values[0] : feature.values[1];
  else return;
  e.preventDefault();
  syncControls();
  hold();
  run();
});

function gotoStep(i, instant = false) {
  tourStep = ((i % TOUR.length) + TOUR.length) % TOUR.length;
  const s = TOUR[tourStep];
  target.yaw = s.yaw ?? 0;
  target.pitch = s.pitch ?? 0;
  target.roll = s.roll ?? -135;
  target.apart = s.apart ?? 0;
  for (const f of FEATURE_KEYS) target[f.channel] = s[f.channel] ?? 0;
  target.layer = s.layer ?? null;
  target.isolate = s.isolate ?? null;
  target.highlight = s.highlight ?? null;
  if (instant) Object.assign(drawn, target);
  tourStepEl.textContent = `${tourStep + 1} / ${TOUR.length}`;
  tourBody.textContent = `${s.title} — ${s.body}`;
  syncLayerBoxes();
  syncFingerBtns();
  syncControls();
  speak(tourStep);
  stateDirty = true;
  run();
}

// theme, voice and digit study — the three things a portfolio reviewer will look for first
const themeBtn = document.getElementById("themeBtn");
const audioBtn = document.getElementById("audioBtn");
let voiceOn = false;
let voice = null;
const ICON_SUN = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"></circle><g><line x1="12" y1="2.5" x2="12" y2="5"></line><line x1="12" y1="19" x2="12" y2="21.5"></line><line x1="2.5" y1="12" x2="5" y2="12"></line><line x1="19" y1="12" x2="21.5" y2="12"></line><line x1="5.2" y1="5.2" x2="7" y2="7"></line><line x1="17" y1="17" x2="18.8" y2="18.8"></line><line x1="5.2" y1="18.8" x2="7" y2="17"></line><line x1="17" y1="7" x2="18.8" y2="5.2"></line></g></svg>';
const ICON_MOON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path></svg>';
function syncThemeBtn() {
  const light = document.body.dataset.theme === "light";
  themeBtn.innerHTML = light ? ICON_MOON : ICON_SUN;
  themeBtn.setAttribute("aria-pressed", String(light));
}
themeBtn.addEventListener("click", () => {
  document.body.dataset.theme = document.body.dataset.theme === "light" ? "dark" : "light";
  syncThemeBtn();
  hold();
});
function speak(i) {
  if (!voiceOn) return;
  const src = AUDIO_FILES?.[i];
  if (!src) return;
  if (voice) voice.pause();
  voice = new Audio(src);
  voice.play().catch(() => {});
}
audioBtn.addEventListener("click", () => {
  voiceOn = !voiceOn;
  audioBtn.setAttribute("aria-pressed", String(voiceOn));
  audioBtn.textContent = voiceOn ? "Voice on" : "Voice off";
  if (!voiceOn) {
    if (voice) voice.pause();
    voice = null;
  } else speak(tourStep);
  hold();
});
const fingerBtns = [...document.querySelectorAll("[data-finger]")];
function syncFingerBtns() {
  for (const b of fingerBtns) b.setAttribute("aria-pressed", String((drawn.finger ?? "") === b.dataset.finger));
}
for (const b of fingerBtns)
  b.addEventListener("click", () => {
    const f = b.dataset.finger;
    target.finger = (drawn.finger ?? "") === f ? null : f;
    if (target.finger) target.isolate = null;
    syncFingerBtns();
    stateDirty = true;
    hold();
    run();
  });
// accordion — one section open at a time so the panel fits the screen
for (const h of document.querySelectorAll(".acc-h"))
  h.addEventListener("click", () => {
    const acc = h.closest(".acc");
    const was = acc.classList.contains("open");
    for (const a of document.querySelectorAll(".acc")) a.classList.remove("open");
    if (!was) acc.classList.add("open");
    hold();
  });
// a study-notes TOC entry opens that section before it jumps
for (const a of document.querySelectorAll(".toc a"))
  a.addEventListener("click", () => {
    const notes = document.querySelector(".acc:has(.toc)");
    if (notes && !notes.classList.contains("open")) notes.classList.add("open");
  });
syncThemeBtn();
syncFingerBtns();

tourBtn.addEventListener("click", () => {
  guided = !guided;
  playing = false;
  playBtn.textContent = "Play";
  tourBtn.textContent = guided ? "Stop tour" : "Start tour";
  if (guided) gotoStep(0);
  run();
});
playBtn.addEventListener("click", () => {
  if (!guided) {
    guided = true;
    tourBtn.textContent = "Stop tour";
    gotoStep(0);
  }
  playing = !playing;
  playBtn.textContent = playing ? "Pause" : "Play";
  run();
});
document.getElementById("tourPrev").addEventListener("click", () => {
  guided = true;
  playing = false;
  playBtn.textContent = "Play";
  tourBtn.textContent = "Stop tour";
  gotoStep(tourStep - 1);
});
document.getElementById("tourNext").addEventListener("click", () => {
  guided = true;
  playing = false;
  playBtn.textContent = "Play";
  tourBtn.textContent = "Stop tour";
  gotoStep(tourStep + 1);
});

const layerBoxes = [...document.querySelectorAll("[data-layer]")];
function syncLayerBoxes() {
  const hidden = (drawn.layer ?? "").split(",").filter(Boolean);
  for (const cb of layerBoxes) cb.checked = !hidden.includes(cb.dataset.layer);
}
for (const cb of layerBoxes)
  cb.addEventListener("change", () => {
    const hidden = layerBoxes.filter((c) => !c.checked).map((c) => c.dataset.layer);
    target.layer = hidden.length ? hidden.join(",") : null;
    stateDirty = true;
    hold();
    run();
  });

const explodeRange = document.getElementById("explode");
const explodeVal = document.getElementById("explodeVal");
explodeRange.addEventListener("input", () => {
  target.apart = Number(explodeRange.value) / 100;
  explodeVal.textContent = `${explodeRange.value}%`;
  hold();
  run();
});
const jointRanges = [...document.querySelectorAll("[data-joint]")];
for (const r of jointRanges)
  r.addEventListener("input", () => {
    target[r.dataset.joint] = Number(r.min) < 0 ? Number(r.value) : Number(r.value) / 100;
    hold();
    run();
  });
function syncControls() {
  const pct = Math.round(target.apart * 100);
  explodeRange.value = pct;
  explodeVal.textContent = `${pct}%`;
  for (const r of jointRanges) r.value = Math.round(target[r.dataset.joint] * (Number(r.min) < 0 ? 1 : 100));
}

document.getElementById("flatBtn").addEventListener("click", () => {
  const flat = Math.abs(target.roll) < 45;
  target.roll = flat ? -95 : 0;
  target.yaw = flat ? 0 : START.yaw;
  target.pitch = flat ? 0 : START.pitch;
  hold();
  run();
});
document.getElementById("resetBtn").addEventListener("click", resetView);
function resetView() {
  guided = false;
  playing = false;
  tourBtn.textContent = "Start tour";
  playBtn.textContent = "Play";
  target.yaw = START.yaw;
  target.pitch = START.pitch;
  target.roll = START.roll ?? 0;
  target.apart = 0;
  target.layer = null;
  target.isolate = null;
  target.finger = null;
  target.highlight = null;
  syncFingerBtns();
  for (const f of FEATURE_KEYS) target[f.channel] = 0;
  syncLayerBoxes();
  syncControls();
  stateDirty = true;
  hold();
  run();
}

const list = document.getElementById("partList");
const filter = document.getElementById("partSearch");
const systems = new Map();
for (const p of PARTS) {
  if (!systems.has(p.system)) systems.set(p.system, []);
  systems.get(p.system).push(p);
}
for (const arr of systems.values()) arr.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
function renderList() {
  const q = filter.value.trim().toLowerCase();
  let html = "";
  for (const [system, items] of systems) {
    const hit = items.filter((p) => !q || p.label.toLowerCase().includes(q) || p.name.includes(q));
    if (!hit.length) continue;
    html += `<li class="grp">${system}<span>${hit.length}</span></li>`;
    for (const p of hit) html += `<li class="prt" data-name="${p.name}">${p.label}</li>`;
  }
  list.innerHTML = html;
}
renderList();
filter.addEventListener("input", renderList);
list.addEventListener("pointerover", (e) => {
  const el = e.target.closest(".prt");
  if (!el) return;
  const p = byName.get(el.dataset.name);
  if (p) p.el.classList.add("hov");
});
list.addEventListener("pointerout", (e) => {
  const el = e.target.closest(".prt");
  if (!el) return;
  const p = byName.get(el.dataset.name);
  if (p) p.el.classList.remove("hov");
});
list.addEventListener("click", (e) => {
  const el = e.target.closest(".prt");
  if (!el) return;
  target.isolate = target.isolate === el.dataset.name ? null : el.dataset.name;
  target.finger = null;
  target.layer = null;
  syncLayerBoxes();
  syncFingerBtns();
  stateDirty = true;
  hold();
  run();
});

const specs = document.getElementById("specs");
const fillCount = (s) => s.replace("{parts}", DATA.parts).replace("{assemblies}", DATA.assemblies);
specs.innerHTML = STUDY.SPECS.map(([k, v]) => `<div><dt>${k}</dt><dd>${fillCount(v)}</dd></div>`).join("");

window.__anatomy = {
  target,
  drawn,
  paint,
  set: (v) => {
    Object.assign(target, v);
    Object.assign(drawn, v);
    touring = false;
    stateDirty = true;
    paint();
  },
  explodeValues,
  orient,
};
syncLayerBoxes();
applyState();
paint();
