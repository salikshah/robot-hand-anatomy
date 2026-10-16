import * as G from "../kit/lathe.mjs";
const TAU = Math.PI * 2;
const unit = G.unit3;
const add = G.add3;
const mul = G.mul3;
const sub = G.sub3;
const dot = G.dot3;
const cross = G.cross3;
const len = G.len3;
const AX = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
const NZ = [0, 0, -1];
const NY = [0, -1, 0];
const AY = [0, 1, 0];
const D2R = Math.PI / 180;
const fr = (o, a, u) => {
  const A = unit(a);
  const U = unit(sub(u, mul(A, dot(u, A))));
  return { o, a: A, u: U, v: cross(A, U) };
};
const UP = { o: [0, 0, 0], a: [0, 0, 1], u: [1, 0, 0] };
const FONT = "Helvetica, Arial, sans-serif";
const ring = (r, steps = 64) =>
  Array.from({ length: steps }, (_, j) => {
    const a = (TAU * j) / steps;
    return `${j ? "L" : "M"}${(r * Math.cos(a)).toFixed(3)} ${(r * Math.sin(a)).toFixed(3)}`;
  }).join("") + "Z";
const line = (d, tone = "lo") => `<path class="iso-line" data-tone="${tone}" d="${d}"/>`;
const text = (x, y, s, size, { tone = "mid", anchor = "middle" } = {}) =>
  `<text class="iso-face-text" data-tone="${tone}" font-size="${size}" text-anchor="${anchor}" style="font-family:${FONT.replace(/"/g, "'")};letter-spacing:.1em" transform="translate(${x.toFixed(2)} ${y.toFixed(2)})">${s}</text>`;
const rrectPts = (x0, y0, x1, y1, r, steps = 5) => {
  const pts = [];
  const corner = (cx, cy, a0) => {
    for (let j = 0; j <= steps; j++) {
      const a = a0 + (j / steps) * (Math.PI / 2);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  corner(x1 - r, y0 + r, -Math.PI / 2);
  corner(x1 - r, y1 - r, 0);
  corner(x0 + r, y1 - r, Math.PI / 2);
  corner(x0 + r, y0 + r, Math.PI);
  return pts;
};
const panelPts = (r0, r1, a0, a1) => {
  const A = (a) => a * D2R;
  return [
    [r1 * Math.cos(A(a0)), r1 * Math.sin(A(a0))],
    [r1 * Math.cos(A(a1)), r1 * Math.sin(A(a1))],
    [r0 * Math.cos(A(a1)), r0 * Math.sin(A(a1))],
    [r0 * Math.cos(A(a0)), r0 * Math.sin(A(a0))],
  ];
};
const ring2d = (n, radius, phase = 0) =>
  Array.from({ length: n }, (_, k) => {
    const t = phase * D2R + (TAU * k) / n;
    return [radius * Math.cos(t), radius * Math.sin(t)];
  });

const RL = 7.5;
const GAP = 0.7;
const JT = RL + GAP / 2;
const K = 254;
const L1 = 38;
const L2 = 25;
const L3 = 19;
const RT = 6.5;
const JTR = RT + GAP / 2;
// each knuckle is a barrel coaxial with its hinge axis, so the joint turns in place
// instead of a dome rim sweeping through the parent. The barrel bridges parent and child
// with a ~0.05 lip, which is what the support check reads as a bearing.
const J1 = K + L1 + JT;
const J2 = K + L1 + L2 + 3 * JT;
const B = [46, -2, 222];
const D1T = unit([0.12, 0, 1]);
const W1 = unit([D1T[2], 0, -D1T[0]]);
const JT1 = add(B, mul(D1T, 28 + JTR));
const JT2 = add(B, mul(D1T, 28 + 32 + 3 * JTR));
const FINGERS = [
  { id: "i", kx: 20, phi: 24, spread: 24 },
  { id: "m", kx: 0, phi: 6, spread: 6 },
  { id: "r", kx: -20, phi: -8, spread: -10 },
  { id: "l", kx: -40, phi: -22, spread: -26 },
];

export function buildObject(T, { layer }) {
  const parts = {};
  const groups = {};
  const explode = [];
  const anchors = {};
  const features = [];
  const L = layer;
  const root = T.group("root", { free: { origin: [0, 0, 190] } });
  groups.root = root;
  const assembly = (name, dir, travel, delay = 0, parent = root) => {
    const g = T.group(name, { parent, slide: { direction: unit(dir), travel } });
    groups[name] = g;
    explode.push({ name, travel, delay });
    return g;
  };
  const hinge = (name, parent, point, axis, range) => {
    const g = T.group(name, { parent, hinge: { point, axis, range } });
    groups[name] = g;
    return g;
  };
  const put = (p) => (parts[p.name] = p);
  const round = (name, group, F, s0, s1, r, o = {}) =>
    put(
      T.round({
        name,
        group,
        layer: L,
        F,
        s0,
        s1,
        r,
        ends: o.ends,
        tone: o.tone ?? "hi",
        crease: o.crease ?? "faint",
        material: o.material,
        lit: o.lit,
        details: o.details,
      }),
    );
  const prism = (name, group, poly, s0, s1, o = {}) =>
    put(
      T.prism({
        name,
        group,
        layer: L,
        F: UP,
        polygon: poly,
        s0,
        s1,
        bevel: o.bevel ?? 0,
        tone: o.tone ?? "hi",
        crease: o.crease ?? "faint",
        material: o.material,
        lit: o.lit,
        details: o.details,
      }),
    );
  const box = (name, group, x0, x1, y0, y1, z0, z1, o = {}) =>
    prism(name, group, o.r ? rrectPts(x0, y0, x1, y1, o.r, o.steps ?? 5) : [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], z0, z1, o);
  const ball = (name, group, c, r, o = {}) =>
    put(
      T.ball({
        name,
        group,
        layer: L,
        c,
        r,
        flats: o.flats,
        tone: o.tone ?? "hi",
        crease: o.crease ?? "faint",
        material: o.material,
        lit: o.lit,
        details: o.details,
      }),
    );
  const plane = (p, o, u, v, svg, normal, fade = [0.04, 0.3]) => T.plane({ part: p, o, u, v, svg, normal, fade });

  const cuff = assembly("cuff", NZ, 122, 0.42);
  for (let k = 0; k < 12; k++) {
    prism(`cuff.wall.${k}`, cuff, panelPts(33, 40, k * 30, (k + 1) * 30), 12, 96, {
      material: "steel",
      crease: "faint",
      details: { seams: [24, 84] },
    });
  }
  // the elbow end of the cuff is a ring, not a disc: the drive pack drops straight out through it
  for (let k = 0; k < 12; k++)
    prism(`cuff.flange.b.${k}`, cuff, panelPts(33, 42, k * 30, (k + 1) * 30), 4, 12, {
      material: "gunmetal",
      details: { seams: [5.5, 10.5] },
    });
  for (let k = 0; k < 12; k++)
    prism(`cuff.flange.t.${k}`, cuff, panelPts(20, 42, k * 30, (k + 1) * 30), 96, 104, {
      material: "gunmetal",
      details: { seams: [100] },
    });
  for (let k = 0; k < 8; k++)
    prism(`cuff.ring.${k}`, cuff, panelPts(20, 28, k * 45, (k + 1) * 45), 104, 112, {
      material: "steel",
      details: { seams: [108] },
    });
  for (const side of [-1, 1]) {
    const s = side > 0 ? "+" : "-";
    box(`cuff.arm.${s}`, cuff, Math.min(side * 22, side * 27), Math.max(side * 22, side * 27), -6, 6, 112, 128.5, {
      material: "gunmetal",
      bevel: 0.4,
      details: { seams: [122] },
    });
    round(`cuff.cap.${s}`, cuff, fr([side * 33, 0, 124], [side, 0, 0], AX.z), 0, 3, 6.5, {
      material: "brass",
      details: { dots: [{ at: [3, 0, 0], normal: [side, 0, 0], size: 0.4 }], rings: [{ at: [3, 0, 0], normal: [side, 0, 0], r: 1.8, tone: "lo" }] },
    });
  }

  const pack = assembly("pack", NZ, 170, 0.34);
  // the mounting plate is the same dodecagon as the cuff bore, so it bears on the cuff walls and
  // still slides straight out through the base ring
  prism("pack.plate", pack, ring2d(12, 33), 12, 18, {
    material: "gunmetal",
    details: { seams: [15], bolts: [{ s: 18, r: 26, count: 16, size: 0.9, tone: "lo" }] },
  });
  // twenty-five motors: fifteen in the outer ring (one tendon each) and nine inside, plus one on the axis.
  // The outer ring sits at 24° a motor, which is the angle each tendon leaves on, so no two runs cross.
  const MOTORS = [...ring2d(15, 26.6), ...ring2d(9, 15.5, 20), [0, 0]];
  for (let k = 0; k < MOTORS.length; k++) {
    const [mx, my] = MOTORS[k];
    const g = assembly(`motor.${k}`, NZ, 170, 0.34);
    const F = fr([mx, my, 0], AX.z, AX.x);
    round(`motor.${k}.can`, g, F, 18, 44, 4, {
      material: "copper",
      details: { seams: [20, 42], ribs: { s0: 19.5, s1: 42.5, count: 18, fade: [0.08, 0.5], tone: "lo" } },
    });
    round(`motor.${k}.head`, g, F, 44, 48, [4, 2.2], { material: "gunmetal", details: { seams: [45.5] } });
  }
  for (let k = 0; k < 4; k++) {
    const a = 90 * k * D2R;
    const sx = 8 * Math.cos(a);
    const sy = 8 * Math.sin(a);
    const g = assembly(`screw.${k}`, NZ, 170, 0.34);
    round(`screw.${k}.rod`, g, fr([sx, sy, 0], AX.z, AX.x), 18, 62, 2.2, {
      material: "brass",
      details: { seams: [22], ribs: { s0: 22, s1: 60, count: 44, twist: 0.6, fade: [0.1, 0.6], tone: "lo" } },
    });
  }

  // one tendon per outer motor: it leaves its own output face and runs straight up on that motor's
  // own radius, so fifteen runs never cross each other.
  const CABLES = MOTORS.slice(0, 15).map(([mx, my], k) => ({ k, mx, my, end: k * 24 }));
  for (const c of CABLES) {
    const hue = ["red", "green", "blue"][c.k % 3];
    const e = [Math.cos(c.end * D2R), Math.sin(c.end * D2R)];
    const route = [
      [c.mx, c.my, 48],
      [c.mx, c.my, 62],
      [19 * e[0], 19 * e[1], 84],
      [9 * e[0], 9 * e[1], 103],
      [9 * e[0], 9 * e[1], 112],
    ];
    const g = assembly(`bundle.${c.k}`, NZ, 170, 0.34);
    T.tube({ name: `bundle.${c.k}`, group: g, layer: L, route, r: 0.9, chunk: 46, turn: 360, spacing: 1.5, hue, material: "rubber", tone: "hi", free: [false, true] });
  }
  // the cable guide: one collar panel per tendon, each tendon landing on its own panel's underside.
  // The collar's outer face reaches the cuff's cable ring below it, which is what carries it.
  // the collar rides up with the wrist, so the tendon runs are left hanging from the drive pack
  const guide = assembly("guide", AX.z, 60, 0.2);
  for (let k = 0; k < 15; k++)
    prism(`guide.panel.${k}`, guide, panelPts(6, 22, k * 24 - 12, k * 24 + 12), 112, 129, {
      material: "gunmetal",
      bevel: 0.2,
      details: { seams: [124.5] },
    });

  const wlift = assembly("wlift", AX.z, 60, 0.2);
  const pitch = hinge("wrist.pitch", wlift, [0, 0, 124], AX.x, [-45, 45]);
  for (const side of [-1, 1]) {
    const s = side > 0 ? "+" : "-";
    round(`wrist.trunnion.${s}`, pitch, fr([side * 27, 0, 124], [side, 0, 0], AX.z), 0, 6, 8.5, {
      material: "steel",
      details: { seams: [3] },
    });
    box(`wrist.yoke.${s}`, pitch, Math.min(side * 18, side * 27), Math.max(side * 18, side * 27), -8, 8, 132, 139, {
      material: "gunmetal",
      bevel: 0.4,
      details: { seams: [135.5] },
    });
  }
  for (let k = 0; k < 8; k++)
    prism(`wrist.ring.${k}`, pitch, panelPts(17.5, 24, k * 45, (k + 1) * 45), 139, 146, {
      material: "lavender",
      details: { seams: [142] },
    });
  const yaw = hinge("wrist.yaw", pitch, [0, 0, 124], AX.z, [-50, 50]);
  round("wrist.block", yaw, UP, 134, 146, 12.5, {
    material: "chrome",
    details: { seams: [136, 144], ribs: { s0: 136, s1: 144, count: 33, fade: [0.08, 0.5], tone: "lo" } },
  });

  const palmUp = assembly("palm.up", AX.z, 40, 0.16, yaw);
  const core = prism(
    "palm.core",
    palmUp,
    [
      [-44, -16],
      [28, -16],
      [34, -10],
      [34, 8],
      [28, 14],
      [-44, 14],
      [-50, 8],
      [-50, -10],
    ],
    146,
    244.5,
    { material: "steel", bevel: 0.8, crease: "lo", details: { seams: [150, 240] } },
  );
  {
    let svg = "";
    for (const f of FINGERS) svg += `<path class="iso-line" data-tone="faint" d="${ring(11.4, 48)}" transform="translate(${f.kx} 0)"/>`;
    plane(core, [0, 0, 244.52], [1, 0, 0], [0, 1, 0], svg, AX.z);
  }
  const cover = assembly("palm.cover", NY, 55, 0.14, palmUp);
  prism("palm.cover", cover, rrectPts(-46, -22, 30, -16, 2.5), 152, 240, {
    material: "gunmetal",
    bevel: 0.5,
    details: {
      seams: [158, 234],
      dots: [
        { at: [240, -40, -19], normal: [0, 0, 1], size: 0.5 },
        { at: [240, 24, -19], normal: [0, 0, 1], size: 0.5 },
      ],
      rings: [
        { at: [240, -40, -19], normal: [0, 0, 1], r: 1.4, tone: "lo" },
        { at: [240, 24, -19], normal: [0, 0, 1], r: 1.4, tone: "lo" },
      ],
    },
  });
  const board = assembly("palm.board", NY, 85, 0.1, palmUp);
  prism("palm.board", board, rrectPts(-40, -25, 26, -22, 1), 158, 234, { material: "pcb", bevel: 0.3 });
  const chip = (name, x0, x1, z0, z1, label) => {
    const p = box(`palm.${name}`, board, x0, x1, -27, -25, z0, z1, { material: "gunmetal", bevel: 0.3 });
    if (label) plane(p, [(x0 + x1) / 2, -27.02, (z0 + z1) / 2], [1, 0, 0], [0, 0, 1], text(0, 0, label, 4, { tone: "hi" }), [0, -1, 0]);
  };
  chip("chip.act", -14, 4, 168, 214, "ACT");
  chip("chip.pid", 8, 22, 176, 224, "PID");
  chip("chip.imu", -34, -24, 186, 230, "IMU");
  const pad = assembly("palm.pad", AY, 40, 0.12, palmUp);
  prism("palm.pad.base", pad, rrectPts(-44, 14, 28, 17.4, 1.5), 156, 240, { material: "rubber" });
  prism("palm.pad.sensor", pad, rrectPts(-42, 17.4, 26, 18.2, 0.4), 158, 238, { material: "sensor", lit: true });
  for (const [nx, nz] of [
    [-30, 176],
    [8, 176],
    [-30, 216],
    [8, 216],
  ])
    round(`palm.pad.nub.${nx}.${nz}`, pad, fr([nx, 18.2, nz], [0, 1, 0], AX.x), 0, 1.2, 1.8, { material: "sensor", lit: true });

  for (const f of FINGERS) {
    const digit = assembly(`digit.${f.id}`, [Math.sin(f.phi * D2R), 0, Math.cos(f.phi * D2R)], 40, 0.08, palmUp);
    for (const side of [-1, 1]) {
      const s = side > 0 ? "+" : "-";
      round(`${f.id}.roller.${s}`, digit, fr([f.kx + side * 8.6, 0, K], [side, 0, 0], AX.z), -1.1, 1.1, 9.5, {
        material: "chrome",
        details: {
          dots: [{ at: [1.1, 0, 0], normal: [side, 0, 0], size: 0.45 }],
        },
      });
    }
    // one guard only, on the back of the knuckle: the palm-side quadrant is the phalanx's own
    // 88° swing, so a guard there is swept through the moment the finger closes
    box(`${f.id}.cap`, digit, f.kx - 7.5, f.kx + 7.5, -13.4, -8.6, K - 8, K + 4, { material: "steel", bevel: 0.4, details: { seams: [K - 4] } });

    const spread = hinge(`${f.id}.spread`, digit, [f.kx, 0, K], AX.y, [-30, 30]);
    const s1 = assembly(`${f.id}.s1`, AX.z, 16, 0.05, spread);
    const mcp = hinge(`${f.id}.mcp`, s1, [f.kx, 0, K], AX.x, [-92, 6]);
    const s2 = assembly(`${f.id}.s2`, AX.z, 13, 0.04, mcp);
    const pip = hinge(`${f.id}.pip`, s2, [f.kx, 0, J1], AX.x, [-100, 4]);
    const s3 = assembly(`${f.id}.s3`, AX.z, 10, 0.03, pip);
    const dip = hinge(`${f.id}.dip`, s3, [f.kx, 0, J2], AX.x, [-70, 4]);

    round(`${f.id}.p1`, mcp, fr([f.kx, 0, K], AX.z, AX.x), 0, L1, RL, { material: "gunmetal", ends: ["dome", "flat"], crease: "lo", details: { seams: [1.2, L1 - 1.2] } });
    const C2 = K + L1 + 2 * JT;
    round(`${f.id}.p2`, pip, fr([f.kx, 0, C2], AX.z, AX.x), 0, L2, RL, { material: "gunmetal", ends: ["flat", "flat"], crease: "lo", details: { seams: [1.0, L2 - 1.0] } });
    const C3 = K + L1 + 2 * JT + L2 + 2 * JT;
    const E3 = C3 + L3;
    round(`${f.id}.p3`, dip, fr([f.kx, 0, C3], AX.z, AX.x), 0, L3, RL, { material: "gunmetal", ends: ["flat", "flat"], crease: "lo", details: { seams: [0.9] } });
    round(`${f.id}.tip`, dip, fr([f.kx, 0, E3], AX.z, AX.x), 0, 2, 8.2, { material: "rubber" });
    round(`${f.id}.sensor`, dip, fr([f.kx, 0, E3 + 2], AX.z, AX.x), 0, 4, 5.6, { material: "sensor", lit: true });
    // hinge barrels: coaxial with each axis, so a curl leaves the knuckle perfectly still
    for (const [joint, group] of [[J1, pip], [J2, dip]]) {
      round(`${f.id}.kn.${joint === J1 ? "pip" : "dip"}`, group, fr([f.kx, 0, joint], AX.x, AX.y), -2.6, 2.6, 7.8, {
        material: "chrome",
        details: { rings: [{ at: [2.6, 0, 0], normal: [1, 0, 0], r: 6.6, tone: "lo" }, { at: [-2.6, 0, 0], normal: [-1, 0, 0], r: 6.6, tone: "lo" }] },
      });
    }
    anchors[`tip.${f.id}`] = [f.kx, 0, E3 + 4];
  }

  const digitT = assembly("digit.t", [0.928, 0, 0.371], 40, 0.08, palmUp);
  prism(
    "t.tower",
    digitT,
    [
      [34, -14],
      [52, -14],
      [56, -10],
      [56, 6],
      [52, 10],
      [34, 10],
    ],
    170,
    215.5,
    { material: "gunmetal", bevel: 0.5, details: { seams: [174, 210] } },
  );
  const o1 = hinge("t.o1", digitT, B, AX.y, [-40, 5]);
  // the base is the ball on t.p0 and nothing else: the tower's top face meets that dome, and any
  // boss flanking it is swept through by the thumb's own tilt
  const o2 = hinge("t.o2", o1, B, AX.x, [-40, 5]);
  const s1t = assembly("t.s1", AX.z, 16, 0.05, o2);
  const mcpt = hinge("t.mcp", s1t, JT1, W1, [-50, 5]);
  const s2t = assembly("t.s2", AX.z, 13, 0.04, mcpt);
  const ipt = hinge("t.ip", s2t, JT2, W1, [-60, 5]);
  const C1T = add(B, mul(D1T, 28 + 2 * JTR));
  const E1T = add(C1T, mul(D1T, 32));
  const C2T = add(E1T, mul(D1T, 2 * JTR));
  const E2T = add(C2T, mul(D1T, 24));
  round("t.p0", o2, fr(B, D1T, AX.z), 0, 28, RT, { material: "gunmetal", ends: ["dome", "flat"], crease: "lo", details: { seams: [1.2, 26.8] } });
  round("t.p1", mcpt, fr(C1T, D1T, AX.z), 0, 32, RT, { material: "gunmetal", ends: ["flat", "flat"], crease: "lo", details: { seams: [1.0, 31] } });
  round("t.p2", ipt, fr(C2T, D1T, AX.z), 0, 24, RT, { material: "gunmetal", ends: ["flat", "flat"], crease: "lo", details: { seams: [0.9] } });
  // thumb knuckle barrels, coaxial with the thumb's hinge axes
  for (const [joint, group] of [[JT1, mcpt], [JT2, ipt]]) {
    round(`t.kn.${joint === JT1 ? "mcp" : "ip"}`, group, fr(joint, W1, D1T), -2.4, 2.4, 6.9, { material: "chrome" });
  }
  round("t.tip", ipt, fr(E2T, D1T, AX.z), 0, 2, 7.2, { material: "rubber" });
  round("t.sensor", ipt, fr(add(E2T, mul(D1T, 2)), D1T, AX.z), 0, 4, 5.0, { material: "sensor", lit: true });
  anchors.thumb = add(E2T, mul(D1T, 4));

  const fist = (v) => {
    const o = {};
    for (const f of FINGERS) {
      o[`${f.id}.mcp`] = -76 * v;
      o[`${f.id}.pip`] = -80 * v;
      o[`${f.id}.dip`] = -38 * v;
    }
    return o;
  };
  features.push(fist(1));
  features.push({ "i.spread": 24, "m.spread": 6, "r.spread": -10, "l.spread": -26 });
  features.push({ "t.o1": -34, "t.o2": -30, "t.mcp": -20, "t.ip": -24 });
  features.push({ "t.mcp": -48, "t.ip": -58 });
  features.push({ "wrist.pitch": -42 });
  features.push({ "wrist.pitch": 45 });
  features.push({ "wrist.yaw": 50 });
  features.push({ "wrist.yaw": -50 });
  features.push({ ...fist(1), "t.o1": -30, "t.o2": -26, "t.mcp": -30, "t.ip": -34, "wrist.pitch": -30 });
  features.push({ "i.spread": 24, "l.spread": -26, "wrist.yaw": 40, "wrist.pitch": 20 });

  anchors.wrist = [0, 0, 124];
  anchors.palm = [0, 0, 196];
  anchors.cuff = [0, 0, 30];
  return { parts, groups, explode, root, anchors, features, counts: { motors: 25, tendons: 15, digits: 5, dof: 22 } };
}

export function explodeValues(explode, apart, { stretch = 0.55 } = {}) {
  const out = {};
  for (const { name, travel, delay } of explode) {
    const t = Math.max(0, Math.min(1, (apart - delay * stretch) / (1 - stretch)));
    out[name] = travel * t * t * (3 - 2 * t);
  }
  return out;
}

// ##NEXT##
