export const FILM = {
  fig: "Fig 1",
  title: "22-DOF robot hand",
  radius: 140,
  label:
    "A tendon-driven 22-degree-of-freedom humanoid robot hand on a forearm actuator module, turning: the four drive fingers and the opposed thumb curl on coupled tendon ratios, the wrist pitches and yaws, a macro on a tactile fingertip and on the wrist cable transition, then the hand comes apart into its cuff, drive pack, cable guide, wrist rings, palm, four fingers and thumb and snaps back together.",
  bounds: [
    [-95, 75],
    [-40, 30],
    [0, 380],
  ],
};

export const FIGURE = {
  title: "Robot hand · anatomy",
  start: { yaw: 0, pitch: 0, roll: -95 },
  label:
    "A 22-DOF tendon-driven humanoid robot hand, built from {parts} solid parts in {assemblies} assemblies: a forearm actuator module with a ring of motor units and lead screws, a guide funnel that flattens the 15 cable runs into a vertical stack at the wrist axes centre, a two-axis wrist (pitch ring, anodised yaw ring, brass differential discs), a palm with a dorsal control board and a compliant sensor pad, and five digits — four three-jointed fingers with rolling knuckle rollers, tendon pulleys and knuckle guards, and an opposed thumb. Every joint is a real hinge. Hover any part to identify it, click to isolate it, and use the panel to tour the hand, filter its layers and look up its parts.",
  keys: [
    { mark: "raised", label: "Structure: cuff, flanges, wrist rings, palm core, phalanx links" },
    { mark: "lit", label: "Drive: motor units, lead screws, 3 tendons per finger, pulleys" },
    { mark: "edge", label: "Sense: tactile fingertips, palmar sensor pad, control board" },
  ],
  caption:
    "{parts} convex parts, re-projected and re-shaded every frame and painted in an order solved from separating planes. The forearm module is a hollow cuff, so it opens in layers: fingertips and distal links lead, the links fan apart along each finger, knuckle rollers and guards come off sideways, the cable guide lifts with the wrist, the palm cover and sensor pad open front and back, and the drive pack drops straight out of the cuff. The real architecture it explains: 22 DOF (4 per finger plus 2 at the wrist), 25 actuators in the forearm, three cables per finger crossing a constant-length transition at the wrist centre, rolling joints and a compliant tactile skin.",
};

export const FEATURE_DEFAULTS = { fist: 0, spread: 0, thumb: 0, wristY: 0, wristP: 0 };

export const FEATURE_KEYS = [
  { key: "f", channel: "fist", name: "fist", unit: "%", values: [0, 1], ease: 0.3, verb: "closes the four fingers", pct: true },
  { key: "s", channel: "spread", name: "spread", unit: "%", values: [0, 1], ease: 0.3, verb: "spreads the fingers", pct: true },
  { key: "t", channel: "thumb", name: "thumb", unit: "%", values: [0, 1], ease: 0.3, verb: "opposes the thumb", pct: true },
  { key: "y", channel: "wristY", name: "wrist yaw", unit: "°", step: 15, ease: 0.25, verb: "yaws the wrist" },
  { key: "p", channel: "wristP", name: "wrist pitch", unit: "°", step: 15, ease: 0.25, verb: "pitches the wrist" },
];

const clamp01 = (x) => Math.max(0, Math.min(1, x));

const FINGERS = [
  { id: "i", kx: 20, spread: 24 },
  { id: "m", kx: 0, spread: 6 },
  { id: "r", kx: -20, spread: -10 },
  { id: "l", kx: -40, spread: -26 },
];

export function featureValues(s, values) {
  const out = { ...values };
  const fist = clamp01(s.fist);
  const spread = clamp01(s.spread);
  const thumb = clamp01(s.thumb);
  const curl = fist * fist * (3 - 2 * fist);
  const opp = thumb * thumb * (3 - 2 * thumb);
  for (const f of FINGERS) {
    out[`${f.id}.mcp`] = -78 * curl;
    out[`${f.id}.pip`] = -84 * curl;
    out[`${f.id}.dip`] = -40 * curl;
    out[`${f.id}.spread`] = f.spread * spread;
  }
  // Thumb sweeps across the palm and locks over the fingers when making a fist or opposing
  out["t.o1"] = Math.max(-39, -34 * opp - 38 * curl);
  out["t.o2"] = Math.max(-38, -30 * opp - 32 * curl);
  out["t.mcp"] = Math.max(-48, -20 * opp - 42 * curl);
  out["t.ip"] = Math.max(-58, -24 * opp - 48 * curl);
  out["wrist.yaw"] = s.wristY;
  out["wrist.pitch"] = s.wristP;
  return out;
}

export function featureTravel(a, b) {
  const arm = (deg) => (Math.abs(deg) * Math.PI * 96) / 180;
  return Math.max(
    arm((b.fist - a.fist) * 88),
    arm((b.spread - a.spread) * 26),
    arm((b.thumb - a.thumb) * 72),
    arm(b.wristY - a.wristY),
    arm(b.wristP - a.wristP),
  );
}
