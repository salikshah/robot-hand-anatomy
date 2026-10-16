# Robot Hand

An interactive 3D model and kinematics engine of a 22-degree-of-freedom tendon-driven humanoid robot hand. Runs entirely in your browser using pure client-side SVG—no WebGL, no Three.js, and no GPU shaders required.

https://github.com/user-attachments/assets/e8c9d938-6f8a-406f-b137-f317ff4f0942

---

## What is this?

This repository contains an open-source interactive mechanical study of a dexterous humanoid robot hand:

- **22 degrees of freedom:** 4 active joints per finger across all 5 digits, plus a 2-axis wrist gimbal (pitch and yaw).
- **Tendon kinematics:** Coupled flexion where curling the fingers pulls the PIP and DIP joints in fixed proportion, while the thumb base sweeps and folds across the palm.
- **Exploded assembly:** Drag a single slider to disassemble 221 convex solid parts along non-colliding mechanical axes.
- **Pure SVG rendering:** Instead of a WebGL canvas, depth order is calculated dynamically using a separating-planes topological sort between convex polyhedra, rendering clean vector paths directly into the DOM.

The rendering approach is built on the separating-planes technique pioneered by [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy). It is designed as an educational tool for builders, students, and engineers exploring spatial mathematics, mechanism design, and lightweight web visualization on a personal computer.

---

## How to use this repo

### 1. Installation

Requires [Node.js](https://nodejs.org/) (version 18 or newer).

```bash
# Clone the repository
git clone https://github.com/salikshah/robot-hand-anatomy.git
cd robot-hand-anatomy

# Install dependencies
npm install

# Compile the standalone HTML pages
npm run figure
```

### 2. Running the Interactive Model

Open either compiled HTML file directly in any desktop browser (Chrome, Safari, Firefox, Edge). No local server is required:

- **Dark Mode:** Open `object/figure.html`
- **Light Mode:** Open `object/figure-light.html`

On Windows:
```bash
start object/figure.html
```

On macOS:
```bash
open object/figure.html
```

On Linux:
```bash
xdg-open object/figure.html
```

### 3. Controls

#### Mouse / Touch
- **Click & Drag:** Orbit camera yaw and pitch.
- **Sliders:**
  - `Explode`: Disassemble the hand from 0% (assembled) to 100% (fully separated).
  - `Fist`: Curl fingers and sweep the thumb into a tight closed grip.
  - `Spread`: Fan the four fingers laterally ($26^\circ$ range).
  - `Thumb`: Actuate thumb saddle opposition to meet each fingertip.
  - `Wrist Pitch / Yaw`: Articulate the 2-axis gimbal.

#### Keyboard Shortcuts
When the figure has focus:

| Key | Action |
|---|---|
| `Space` or `A` | Toggle Exploded view |
| `F` | Toggle Fist curl |
| `S` | Toggle Finger spread |
| `T` | Toggle Thumb opposition |
| `P` | Step Wrist pitch |
| `Y` | Step Wrist yaw |
| `←` / `→` | Orbit yaw left / right |
| `↑` / `↓` | Orbit pitch up / down |
| `Esc` | Reset camera and pose to default |

#### Panes & Inspector
The interface is split into three independent panels:
- **Left (Figure):** The interactive SVG robot hand.
- **Middle (Study Notes):** Guided 12-step technical tour, mechanism breakdowns, and engineering notes.
- **Right (Controls & Parts):** Sliders, layer filters (Structure, Drive Train, Sense), digit isolation toggles, and a searchable index of all 221 parts.

---

## Screenshots

<p align="center">
  <img src="Robothand%20thumb.png" alt="Robot Hand Blueprint Poster" width="380" />
</p>

<p align="center">
  <img src="Screenshots/night.png" alt="Dark Mode Interface" width="49%" />
  <img src="Screenshots/day.png" alt="Light Mode Interface" width="49%" />
</p>

---

## Mechanical Architecture

| Parameter | Specification | Description |
|---|---|---|
| **Degrees of Freedom** | 22 DOF | 4 DOF per digit (MCP roll, MCP pitch, PIP, DIP) × 5 digits + 2 DOF wrist |
| **Actuators** | 25 motor units | Concentric motor cylinders housed in the forearm cuff |
| **Tendon Distribution** | 3 cables / finger | 1 central flexor + 2 lateral antagonist cables for abduction/adduction |
| **Wrist Mechanism** | 2-axis gimbal | Pitch and yaw rings with centralized cable guides to maintain constant tendon length |
| **Joint Design** | Rolling contact | Curved contact surfaces replicating biological phalanx motion |
| **Part Count** | 221 convex solids | All brackets, links, rollers, motor cans, and pads modeled independently |
| **Sub-Assemblies** | 71 assemblies | Discrete mechanical sub-groups that separate along realistic vectors |

---

## How the Rendering Engine Works

This project contains no WebGL, no canvas contexts, and no GPU shaders. Every frame is rendered as pure SVG:

1. **Transform:** Joint angles, wrist pitch/yaw, and explode offsets are applied hierarchically down a kinematic transform tree.
2. **Project:** 3D vertices are projected onto an isometric camera plane.
3. **Sort via Separating Planes:** Rather than using a depth buffer, each pair of convex polyhedra is separated by a pre-computed or dynamically tested linear plane. This produces a directed acyclic graph (DAG) of occlusion relationships, which is topologically sorted to determine exact painter's order.
4. **Shade:** Polygon faces are evaluated against a directional light vector, binned into four discrete tones, and emitted as standard `<path>` elements.

This yields resolution-independent vector graphics that scale cleanly to any display density.

---

## Project Structure

```
├── kit/                 # Core engine
│   ├── iso-kit.mjs      # Isometric projection and SVG generation
│   ├── turn.mjs         # Kinematic joint transform tree
│   └── audit.mjs        # Clearance, collision, and support assertions
├── object/              # Robot hand model & interface
│   ├── geometry.mjs     # 221 convex solid definitions, hinges, and assemblies
│   ├── film.mjs         # Joint kinematics equations and slider mappings
│   ├── study.mjs        # Tour text, part names, and mechanical specifications
│   ├── live.js          # Browser runtime (input handling, sliders, orbit)
│   ├── build.mjs        # Build script compiling dark and light HTML pages
│   ├── figure.html      # Compiled dark mode application
│   └── figure-light.html # Compiled light mode application
├── launch-assets/       # Documentation and launch distribution assets
├── Screenshots/         # Interface captures and poster assets
├── robot hand _ video.mp4 # Full 2-minute demo recording
├── SPEC.md              # Engineering notes and kinematics reference
└── package.json
```

---

## Credits & License

- **Creator:** Salik Shah ([@salik](https://x.com/salik))
- **Engine Pedigree:** Pure SVG separating-planes rendering engine inspired by Ryan Tan's [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy).
- **Release Video:** Also available for direct download under [Releases v1.0.0](https://github.com/salikshah/robot-hand-anatomy/releases/tag/v1.0.0).
- **License:** [MIT](LICENSE)
