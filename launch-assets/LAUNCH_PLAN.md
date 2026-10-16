# Launch Concept & Content Repo Plan — 22-DOF Robot Hand

**Repository:** `robot-hand-anatomy`  
**Author:** Salik Shah ([@salik](https://x.com/salik))  
**Media Assets to Attach:**
1. **Master Video (2:06):** `D:\Projects\Public\Robot Hand\robot hand _ video.mp4`
2. **Hero Screenshot:** Provided by user (or high-res frame from video)

---

## 1. Executive Thesis & The Narrative Wedge

### The Core Premise: Proof of Concept on Your Personal Computer
Humanoid robotics is undergoing an explosion of interest, but the underlying mechanical dexterity remains shrouded in mystery:
- Heavy CAD software requires expensive workstation licenses.
- Modern robotics simulators (Isaac Sim, MuJoCo) demand dedicated high-end GPUs.
- Research papers on tendon routing and rolling joints hide their kinematics behind paywalls.

**The Revelation:**
You don't need a cloud cluster, a $5,000 GPU, or proprietary CAD to understand, simulate, and inspect a cutting-edge 22-DOF tendon-driven humanoid robot hand. **Everything can run 100% offline, in real-time, right inside your web browser on pure client-side math.**

### Built For Builders & Learners
This project is an open interactive learning laboratory. Anyone can clone the repository, run `npm run figure`, and immediately:
- Orbit around 221 convex solids modeled in millimeter accuracy.
- Drag the explode slider to inspect internal drive packs, lead screws, and tendon funnel routing.
- Actuate coupled fist flexion, finger spread, thumb opposition, and 2-axis wrist gimbals.
- Inspect how separating-planes geometry eliminates the need for WebGL or GPU rendering engines.

### Provenance & Attribution: The Anatomy Technique
This project was built to test, extend, and celebrate the pure SVG isometric mechanical engine inspired by **[wheresryan22/anatomy](https://github.com/wheresryan22/anatomy)**. By adopting Ryan's separating-planes topological depth sorting, we prove that clean mathematical foundations can render complex 200+ part mechanisms with vector crispness and zero visual artifacts.

---

## 2. Multi-Channel Distribution Matrix

| Channel | Format | Primary Objective | Key Call to Action |
|---|---|---|---|
| **X / Twitter** | Viral Hook Tweet + 6-Tweet Thread | Reach robotics engineers, creative coders, AI builders | Star on GitHub & try the local build |
| **Hacker News** | Show HN text post + GitHub URL | Technical peer review, discussion of separating planes vs WebGL | Feedback on solver & kinematic ratios |
| **LinkedIn** | High-signal founder / builder article | Educating mechanical & software engineers on modern humanoid packaging | Link to GitHub repo & discussion |
| **Reddit** | r/robotics, r/webdev, r/programming | Practical showcase of tendon-driven humanoid hand engineering in pure SVG | Discussion on rolling joints & tendon routing |

---

## 3. Video Timestamp Breakdown (For Social Context)

When posting the video `robot hand _ video.mp4`, reference these exact timestamps:

- **0:00 – 0:08:** Rest posture in default isometric view.
- **0:08 – 0:15:** **100% Exploded View.** All 221 convex solids fan out along non-colliding disassembly trajectories. The 25-motor pack drops from the cuff, wrist rings separate, and finger segments disperse.
- **0:17 – 0:34:** **3D Spatial Orbit.** Revealing the dorsal PCB control board and the anterior compliant tactile sensor pad.
- **0:35 – 0:44:** **Coupled Fist Flexion.** The 4 fingers curl along realistic DIP/PIP coupled ratios while the thumb base sweeps $38^\circ$ and closes tightly across the curled fingers.
- **0:45 – 0:55:** **Thumb Opposition & Wrist Articulation.** Saddle joint opposition meets any fingertip; 2-axis wrist gimbal pitches and yaws without changing tendon lengths.
- **0:57 – 1:20:** **Simultaneous Articulation & Pitch.** Moving joints under arbitrary camera rotations with real-time vector re-shading.
- **1:23 – 2:06:** **Lay Flat & Interactive Reset.** Exploring alternate projection planes and returning to baseline.

---

## 4. Repo Launch Readiness Checklist

- [x] **Thumb Kinematics Fixed:** Thumb sweeps across palm and locks over curled fingers during fist.
- [x] **Spread Channel Normalized:** $0 \dots 100\%$ slider maps cleanly to $26^\circ$ MCP abduction without jitter.
- [x] **Dual Theme Compilation:** Both `figure.html` (dark) and `figure-light.html` (light) compiled and verified.
- [x] **Kinematic Audit Passed:** All collision, grounding, and clearance checks pass cleanly.
- [x] **Root README:** Complete documentation with architecture table, installation instructions, keyboard shortcuts, and mathematical theory.
- [x] **Launch Thread Drafted:** Single-tweet hook + 6-part thread with character count verification.
- [x] **Show HN Drafted:** Technical deep dive ready for submission.
