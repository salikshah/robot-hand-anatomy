# Show HN: 22-DOF Tendon-Driven Humanoid Robot Hand in Pure In-Browser SVG

**Title:** Show HN: 22-DOF Tendon-Driven Robot Hand in Pure In-Browser SVG (No WebGL)  
**URL:** https://github.com/salik/robot-hand-anatomy (or link to live deployed GitHub pages)

---

### Body:

Hi HN — Salik here. Today I'm open-sourcing a project built as an educational proof-of-concept for robotics builders, students, and graphics programmers: an interactive, 22-degree-of-freedom tendon-driven humanoid robot hand running in real-time right inside your browser—using pure SVG, with zero WebGL, zero Three.js, and zero GPU canvas dependencies.

### Why build this?
Humanoid robotics architectures (such as the Tesla Optimus Gen 3 patent disclosures, CMU LEAP Hand, and Sanctuary AI) have converged on forearm-actuated, tendon-driven hands with rolling contact joints. However, exploring these mechanisms typically requires heavy CAD suites or GPU simulators (Isaac Sim, MuJoCo) that demand dedicated workstations.

I wanted to see what was possible on an everyday personal computer using lightweight web standards: a zero-install, 100% offline interactive laboratory where anyone can inspect every mechanical solid, actuate coupled joints, and disassemble the hand along physical vectors.

### The Rendering Pipeline: Pure SVG via Separating Planes
To build this, I wanted to try out and build upon the pure SVG isometric mechanical technique pioneered by Ryan (@wheresryan22) in his Anatomy repository (wheresryan22/anatomy).

Rather than writing to a pixel buffer or WebGL depth buffer, each frame:
1. All 221 convex solids (motor cans, lead screws, gimbal rings, pulleys, phalanx links, compliant tactile skin) are transformed along kinematic joint angles and explode vectors.
2. The global painter's order is resolved analytically by finding linear separating planes between convex polyhedra.
3. Faces are shaded into 4 discrete tones and rendered as vector SVG `<path>` elements.

This yields resolution-independent, razor-sharp technical figures that zoom infinitely without raster blur or depth-sorting artifacts.

### Kinematics Implemented:
- **Coupled PIP/DIP Flexion:** Middle and distal phalanges curl at anatomically realistic coupled ratios ($0.65\times$ PIP).
- **Opposition Sweep:** Thumb saddle joint sweeps $38^\circ$ across the palm and folds tightly across the fingers during a fist, or sweeps to oppose any fingertip.
- **Finger Spread:** $26^\circ$ true abduction/adduction across the MCP knuckles.
- **2-Axis Wrist Gimbal:** Pitch and yaw rings allow full articulation while a central cable funnel keeps tendon path lengths invariant (preventing cable slack).
- **Exploded View:** Drag the explode slider from 0% to 100% to watch all 71 sub-assemblies disperse along non-colliding explosion trajectories.

### Running it locally:
```bash
git clone https://github.com/salik/robot-hand-anatomy.git
cd robot-hand-anatomy
npm install
npm run figure
# Open object/figure.html in any browser
```

The repo includes a 2-minute recorded demo walk-through, dark/light mode builds, full kinematic equations, and technical diagrams.

I'd love your thoughts on the separating-planes depth solver performance, tendon routing geometry, and how this could be extended for other open robotic mechanisms.

- GitHub: https://github.com/salik/robot-hand-anatomy
- Feedback / DMs: [@salik on X](https://x.com/salik)
