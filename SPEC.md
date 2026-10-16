# Spec — 22-DOF tendon-driven humanoid robot hand

Basis: real, current humanoid-hand engineering. The architecture follows the
tendon-driven, forearm-actuated, rolling-joint hand described in the publicly
published "Mechanically Actuated Robotic Hand" patent family (Tesla Optimus
Gen 3 class, WIPO publication April 2026) and the open-source dexterous-hand
tradition (CMU LEAP Hand, Open Bionics). No trademarks are reproduced.

## Real numbers used

| Fact | Value | Source |
|---|---|---|
| Degrees of freedom | 22 per hand (4 per finger × 5 + 2 at the wrist) | patent disclosure |
| Actuators | 25 per forearm module; heavy actuators live in the forearm, cables cross the wrist | patent disclosure |
| Control cables | 3 per finger (1 flexor to the tip curling the upper two segments, 2 controlling abduction/adduction) | patent disclosure |
| Finger segments | 4 per finger, 3 in the thumb; joints roll rather than pivot on a pin | patent disclosure |
| Return springs | fingers default to open | patent disclosure |
| Tactile skin | multi-layer compliant sensor skin on fingers and palm | patent disclosure |
| Wrist | 2 DOF (pitch + yaw) from two motors; cable transition at the wrist axes centre keeps tendon lengths constant | patent disclosure |
| Human hand (reference) | 27 DOF; Gen-3 reaches ~22, about 79 % | IEEE Spectrum analysis |
| Open-source reference builds | LEAP Hand: 16 DOF, ~$2 000, 4 h assembly; V2: 21 DOF / 17 motors, hybrid rigid-soft | RSS 2023 / 2025 papers |

## The model

- Scale: real millimetres. Hand + forearm stub ≈ 335 mm tall, palm ≈ 92 mm
  wide, scaled to a human hand of ~190 mm hand length.
- Built from ~140 convex parts, every part its own solid, painted in an order
  solved each frame.

## Assemblies (the explode)

1. forearm cuff (steel shell, two flanges, vents)
2. drive pack — ring of motor units (can, cap, lead screw), one per cable group
3. cable guide — funnel + flat-to-vertical transition block at the wrist centre
4. wrist — gimbal ring (pitch), anodised ring (yaw), brass differential discs
5. palm — core, dorsal cover, control board (PCB), palmar sensor pad
6. digits — 4 fingers × (proximal, middle, distal links, fingertip + sensor
   dome, knuckle rollers, pulleys, guards, tendon runs, clamps)
7. thumb — base tower, saddle joint, 3 segments, 4 DOF

## The cable system (drawn, not decorative)

- 3 tendons per finger: flexor (tip), ab/adduct pair (MCP).
- Each tendon is a real route: motor pulley → guide funnel → wrist centre
  transition → palm channel → link gland → joint pulley → fingertip anchor.
- Joints carry a pulley disc and a guide shoe; tendons end tangent on the
  pulley rim, so the routing reads at every pose.

## Motion channels (drive the page and the film)

| channel | meaning |
|---|---|
| `fist` | coupled flexion: MCP, PIP, DIP move on the real coupling ratio (DIP ≈ 0.65 × PIP) |
| `spread` | abduction/adduction of the four fingers |
| `thumb` | CMC opposition + thumb flexion |
| `wristY` / `wristP` | the two wrist DOF |

## Verify

- build proves no interlocking pairs at rest, in each explode frame and in each
  pose state;
- `scan-apart.mjs` from five views: no pair passes through another;
- every image is read before it ships.
