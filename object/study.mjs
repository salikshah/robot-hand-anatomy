export const FINGER_NAME = { i: "index", m: "middle", r: "ring", l: "little" };

const catOf = (name) => {
  if (/^(motor|screw|bundle|guide)\./.test(name)) return "drive";
  if (/(sensor|palm\.pad|palm\.board|chip\.)/.test(name)) return "sense";
  return "structure";
};

const systemOf = (name) => {
  if (/^cuff\./.test(name)) return "Forearm shell";
  if (/^(motor|screw|pack|bundle|guide)\./.test(name)) return "Actuator module";
  if (/^wrist\./.test(name)) return "Wrist";
  if (/^palm\./.test(name)) return "Palm";
  if (/^t\./.test(name)) return "Thumb";
  return "Fingers";
};

const RULES = [
  [/^cuff\.wall\.(\d+)$/, (n) => `Cuff panel ${+n + 1}`, "Forearm shell — twelve panels around the actuator pack."],
  [/^cuff\.flange\.b\./, (n) => `Cuff base flange ${+n + 1}`, "Rings the elbow end of the cuff; the drive pack drops through it."],
  [/^cuff\.flange\.t\.(\d+)$/, (n) => `Cuff top flange ${+n + 1}`, "Top plate of the cuff, with the opening the tendons pass through."],
  [/^cuff\.ring\.(\d+)$/, (n) => `Cable collar ${+n + 1}`, "Raises the tendon opening clear of the wrist."],
  [/^cuff\.arm\.([+-])$/, (s) => `Wrist trunnion mount ${s === "+" ? "right" : "left"}`, "Holds the wrist pitch pins."],
  [/^cuff\.cap\.([+-])$/, (s) => `Trunnion cap ${s === "+" ? "right" : "left"}`, "Caps the wrist pitch pin."],
  [/^pack\.plate$/, () => "Actuator chassis", "Plate the twenty-five motor units bolt to."],
  [/^motor\.(\d+)\.can$/, (n) => `Motor ${+n + 1} stator`, "One of twenty-five forearm actuators."],
  [/^motor\.(\d+)\.head$/, (n) => `Motor ${+n + 1} output`, "Tendon drum on the actuator output shaft."],
  [/^screw\.(\d+)\.rod$/, (n) => `Lead screw ${+n + 1}`, "Converts motor torque into tendon pull."],
  [/^bundle\.(\d+)/, (n) => `Tendon ${+n + 1}`, "Routes one actuator up to the wrist transition."],
  [/^guide\./, () => "Tendon guide", "Clamps the tendon stack at the wrist centre."],
  [/^wrist\.trunnion\./, () => "Wrist pitch trunnion", "The pitch axis pin."],
  [/^wrist\.yoke\./, () => "Wrist pitch yoke", "Carries the yaw hub above the pitch axis."],
  [/^wrist\.ring\./, () => "Yaw ring segment", "The yaw bearing ring."],
  [/^wrist\.block$/, () => "Yaw hub", "The wrist's second axis — yaw."],
  [/^palm\.core$/, () => "Palm core", "Structural spine of the hand."],
  [/^palm\.cover$/, () => "Dorsal cover", "Back plate over the control board."],
  [/^palm\.board$/, () => "Control board", "Drives the actuators and reads the tactile skin."],
  [/^palm\.chip\.(\w+)$/, (n) => `Control board — ${n.toUpperCase()}`, "On the dorsal control board."],
  [/^palm\.pad\.base$/, () => "Sensor pad base", "Compliant backing for the palmar sensor array."],
  [/^palm\.pad\.sensor$/, () => "Palm sensor array", "Tactile skin across the palm."],
  [/^palm\.pad\.nub\./, () => "Sensor nub", "One taxel of the palmar array."],
  [/^([imrl])\.roller\./, (f) => `Knuckle roller — ${FINGER_NAME[f]}`, "Rolling contact at the finger base."],
  [/^([imrl])\.cap$/, (f) => `Knuckle guard — ${FINGER_NAME[f]}`, "Back-side guard over the knuckle."],
  [/^([imrl])\.p1$/, (f) => `Proximal phalanx — ${FINGER_NAME[f]}`, "First finger segment."],
  [/^([imrl])\.p2$/, (f) => `Middle phalanx — ${FINGER_NAME[f]}`, "Second finger segment, coupled to the distal joint."],
  [/^([imrl])\.p3$/, (f) => `Distal phalanx — ${FINGER_NAME[f]}`, "Last finger segment."],
  [/^([imrl])\.kn\.pip$/, (f) => `PIP knuckle — ${FINGER_NAME[f]}`, "Hinge barrel the middle phalanx turns in."],
  [/^([imrl])\.kn\.dip$/, (f) => `DIP knuckle — ${FINGER_NAME[f]}`, "Hinge barrel the distal phalanx turns in."],
  [/^([imrl])\.tip$/, (f) => `Fingertip pad — ${FINGER_NAME[f]}`, "Compliant pad under the tactile sensor."],
  [/^([imrl])\.sensor$/, (f) => `Tactile fingertip — ${FINGER_NAME[f]}`, "Force sensor on the fingertip."],
  [/^t\.tower$/, () => "Thumb base tower", "Anchors the opposed thumb."],
  [/^t\.p0$/, () => "Thumb metacarpal", "Base segment of the thumb."],
  [/^t\.p1$/, () => "Thumb proximal phalanx", "Middle segment of the thumb."],
  [/^t\.p2$/, () => "Thumb distal phalanx", "Tip segment of the thumb."],
  [/^t\.kn\.mcp$/, () => "Thumb MCP knuckle", "Hinge barrel the thumb's middle segment turns in."],
  [/^t\.kn\.ip$/, () => "Thumb IP knuckle", "Hinge barrel the thumb's tip segment turns in."],
  [/^t\.tip$/, () => "Thumb tip pad", "Compliant pad under the thumb sensor."],
  [/^t\.sensor$/, () => "Tactile thumb tip", "Force sensor on the thumb tip."],
];

export function metaOf(name) {
  for (const [re, label, note] of RULES) {
    const m = name.match(re);
    if (m) return { label: label(...m.slice(1)), cat: catOf(name), system: systemOf(name), note };
  }
  return { label: name, cat: catOf(name), system: systemOf(name), note: "" };
}

export const SPECS = [
  ["Degrees of freedom", "22"],
  ["Actuators", "25"],
  ["Tendons", "15 — three per finger"],
  ["Finger joints", "4 per finger"],
  ["Wrist", "pitch + yaw"],
  ["Tactile skin", "5 fingertips + palm"],
  ["Convex parts", "{parts}"],
  ["Assemblies", "{assemblies}"],
];

// one leading token names a whole digit, so "study one finger" can light up exactly that finger
export const FINGER_IDS = ["i", "m", "r", "l", "t"];
export const fingerOf = (name) => {
  const p = name.split(".")[0];
  return FINGER_IDS.includes(p) ? p : null;
};

export const TOUR = [
  {
    title: "The hand",
    body: "A 22-degree-of-freedom tendon-driven hand on a 25-actuator forearm module: four fingers, an opposed thumb, and a two-axis wrist.",
    say: "A twenty-two degree of freedom tendon-driven hand, on a forearm module holding twenty-five actuators. Four fingers, an opposed thumb, and a wrist with two axes.",
    yaw: 0, pitch: 0, roll: -95,
  },
  {
    title: "The actuator module",
    body: "Twenty-five motor units sit in two rings inside the forearm cuff. Each one winds a single tendon.",
    say: "Twenty-five motor units sit in two rings inside the forearm cuff, and each one winds a single tendon.",
    yaw: 0, pitch: 0, roll: -95, layer: "drive",
  },
  {
    title: "Tendon routing",
    body: "Each finger is pulled by three tendons. They run up the forearm and flatten into a vertical stack at the wrist centre, so their length never changes as the wrist moves.",
    say: "Every finger is pulled by three tendons. They run up the forearm and flatten into a vertical stack at the wrist centre, so their length never changes as the wrist moves.",
    yaw: 0, pitch: 0, roll: -95, layer: "drive", apart: 0.45,
  },
  {
    title: "The wrist",
    body: "Two axes: pitch and yaw. The tendons cross the rotation centre, so no cable has to stretch or slack.",
    say: "The wrist has two axes, pitch and yaw. The tendons cross the rotation centre, so no cable has to stretch or go slack.",
    yaw: 0, pitch: 0, roll: -95, layer: "structure", apart: 0.2,
  },
  {
    title: "The palm",
    body: "A compliant sensor pad on the palm and a control board on the back, both on a structural core.",
    say: "The palm carries a compliant sensor pad on the front and a control board on the back, both mounted on a structural core.",
    yaw: 0, pitch: 0, roll: -95, layer: "structure",
  },
  {
    title: "A finger",
    body: "Three phalanges on rolling knuckles. The middle and distal joints are coupled, so one tendon curls both.",
    say: "Each finger is three phalanges on rolling knuckles. The middle and distal joints are coupled, so a single tendon curls both.",
    yaw: 0, pitch: 0, roll: -95, isolate: "i.p2",
  },
  {
    title: "The thumb",
    body: "Opposed on a two-axis base — sweep and tilt — then two more joints. Four degrees of freedom.",
    say: "The thumb is opposed on a two-axis base, sweep and tilt, then two more joints. Four degrees of freedom.",
    yaw: 0, pitch: 0, roll: -95, isolate: "t.p1",
  },
  {
    title: "The fist",
    body: "Coupled PIP and DIP curl: the middle joint drives the fingertip joint at a fixed ratio, so the finger closes as one curve.",
    say: "The middle joint drives the fingertip joint at a fixed ratio, so the whole finger closes as one smooth curve.",
    yaw: 0, pitch: 0, roll: -95, fist: 1,
  },
  {
    title: "Spread",
    body: "Each finger also rotates at its base, so the hand can open flat or grip a wide object.",
    say: "Each finger also rotates at its base, so the hand can open flat or grip a wide object.",
    yaw: 0, pitch: 0, roll: -95, spread: 1,
  },
  {
    title: "Exploded",
    body: "Every part separates along its own axis: fingertips first, then the links fan out, the palm opens front and back, and the drive pack drops out of the cuff.",
    say: "Every part separates along its own axis. Fingertips first, then the links fan out, the palm opens front and back, and the drive pack drops out of the cuff.",
    yaw: 0, pitch: 0, roll: -95, apart: 1,
  },
  {
    title: "Tactile skin",
    body: "Five fingertip sensors and a palmar array give the hand a sense of touch.",
    say: "Five fingertip sensors and a palmar array give the hand a sense of touch.",
    yaw: 0, pitch: 0, roll: -95, layer: "sense",
  },
  {
    title: "The drive train",
    body: "Motors, lead screws and tendons — the parts that make the hand move.",
    say: "Motors, lead screws and tendons, the parts that make the hand move.",
    yaw: 0, pitch: 0, roll: -95, layer: "drive",
  },
];
