# Robot Hand — UI redesign plan

## What's actually wrong (measured, not guessed)

| # | Issue | Evidence |
|---|---|---|
| 1 | **Panel is 1225 px tall** in a 768–1080 px viewport | `panel.scrollHeight = 1225` at 1440×900. The page itself doesn't overflow, but the panel scrolls internally — you only ever see ~60 % of the controls. This is the "I had to zoom out" problem. |
| 2 | **No top bar** | The kit's plate header only has "Fig 1" / "ROBOT HAND · ANATOMY". No title, no external links, no theme toggle. |
| 3 | **Spread did nothing** | `film.mjs` computed `s.spread / 50` while the slider feeds 0–1 → 0.24° at full. **Fixed.** |
| 4 | **No deeper-study view** | All explanation lives in one caption paragraph; no text+diagram panel. |
| 5 | **Dead space on wide screens** | Stage is 924×616 inside a 1360 px max-width page; at 1920 the figure is small with large margins. |

---

## Proposed layout

```
┌────────────────────────────────────────────────────────────────┐
│  Robot Hand  ·  anatomy          Github   @salik      [☀/🌙]   │  48 px top bar
├────────────────────────────────────┬───────────────────────────┤
│                                    │  Tour                  ▾  │
│                                    │  [Start tour] [Play]      │
│                                    │  ‹  1 / 12  ›             │
│                                    │  Step text…               │
│                                    │  ───────────────────────  │
│            FIGURE (SVG)            │  Pose                  ▾  │
│            fills the space         │  Explode  [──────]  0%    │
│                                    │  Fist   [──]  Spread [──]  │
│                                    │  Thumb  [──]  Wrist [──]   │
│                                    │  [Lay flat]  [Reset]       │
│                                    │  ───────────────────────  │
│                                    │  Layers                ▾  │
│                                    │  [x] Structure  [x] Drive   │
│                                    │  [x] Sense                │
│                                    │  ───────────────────────  │
│                                    │  Digits                ▾  │
│                                    │  [Idx][Mid][Rng][Lit][Th] │
│                                    │  ───────────────────────  │
│                                    │  Parts 221            ▾    │
│                                    │  [ filter parts… ]        │
│                                    │  ▸ Forearm shell          │
│                                    │  ▸ …                      │
│                                    │  ───────────────────────  │
│                                    │  Study notes          ▾    │
│                                    │  text + static diagram    │
└────────────────────────────────────┴───────────────────────────┘
```

**The panel becomes an accordion.** Six sections, each collapsible, one open at a time. That collapses 1225 px of stacked controls into ~300 px of visible content — the panel fits the screen with no internal scroll.

The **Study notes** section is the "deeper study" view: the full explanatory text plus a static diagram (a build-time SVG render of the hand in the flat pose, generated from the same geometry).

---

## SWOT

**Strengths**
- Genuinely novel renderer: 221 convex parts re-projected and re-shaded every frame, painted in a depth order *solved from separating planes*. No WebGL, no Three.js — pure SVG. Real portfolio differentiator.
- Real engineering content: 22 DOF, 25 actuators, tendon routing, constant-length wrist transition. Accurate, not decorative.
- The audit system (clearance / support / loose ends / depth order) is unusual and demonstrable in an interview.
- Guided tour + Kokoro voiceover + layer filters + digit isolation + explode already work.

**Weaknesses**
- Panel doesn't fit a screen (fixed by this redesign).
- No branding, no external links, no theme toggle in the header.
- No deeper-study view.
- Landscape figure (640×427) leaves dead space on wide screens.
- No routing — no shareable per-part URLs.
- **Not a git repo** — no history, no diffs, no rollback.

**Opportunities**
- Tour + narration already exist → the full educational video is one script away (`object/render-tour.mjs`, written, unrun).
- The solver + audit is a strong "how it works" story for interviews and courses.
- Could become a small open-source project (GitHub link in the header).
- The study-notes view can host per-part deep-dives: tendon routing, knuckle geometry, wrist transition.

**Threats**
- The solver costs ~2.5 s/frame — any animation/video feature is expensive and must be budgeted.
- SVG at 221 parts won't scale to much more complex models.
- No visual regression test — UI changes can break the render silently.
- No version control yet.

---

## Next steps, in order

| # | Step | Effort | Depends on |
|---|---|---|---|
| 1 | **Top bar** — title, GitHub link, X: @salik link, day/night icon top-right | small | needs the real GitHub URL |
| 2 | **Panel → accordion** — 6 collapsible sections, one open at a time | medium | — |
| 3 | **Study notes section** — full text + static flat-pose SVG diagram | medium | 2 |
| 4 | **Stage sizing** — fill available space, no dead margins on wide screens | small | 1, 2 |
| 5 | **`git init`** + first commit | trivial | — |
| 6 | **Full tour video** — run `object/render-tour.mjs` | ~15 min render | — |

Steps 1–4 are one coherent change to `object/build.mjs` + `object/live.js` and can be done together.

---

## Open questions

1. **GitHub URL** — what repo should the header link to? (Nothing in the project references one yet.)
2. **X handle** — is `@salik` the right handle, and should it link to `x.com/salik`?
3. **Accordion behaviour** — one section open at a time, or several? (I'd default to one, with Tour open.)
4. **Static diagram** — a flat-pose render of the whole hand, or a specific sub-assembly (wrist transition, a knuckle)?
