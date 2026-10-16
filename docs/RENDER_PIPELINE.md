# ZORTEX: CYBER SURVIVOR - RENDER PIPELINE & SHADER ARCHITECTURE

> **TOKEN OPTIMIZATION POLICY**: Consult this file whenever modifying graphics, shaders, layers, filters, or visual effects. Avoid loading gameplay loop or AI code into the context window.

---

## 1. SCENE CONTAINER HIERARCHY (Z-ORDER)

All gameplay rendering is routed through `worldContainer` inside `pixiApp.stage`. Z-ordering is strictly deterministic:

```
pixiApp.stage
└── worldContainer (Camera transform: x, y, scale, rotation)
    ├── [1] backgroundLayer
    │   ├── pixiNebulaContainer     (GlProgram procedural FBM shader, res: 0.5)
    │   ├── pixiStarsContainer      (5-layer parallax Starfield sprites)
    │   ├── pixiShadowsContainer    (Soft drop shadows beneath entities)
    │   └── pixiHazardsBelow        (Floor indicators, warning telegraphs)
    ├── [2] entitiesLayer
    │   ├── pixiFluidRibbonGraphics (Entity ribbons/trails)
    │   ├── pixiGemsContainer       (XP gems)
    │   ├── pixiScrapsContainer     (Scrap pickups)
    │   ├── pixiRelicsContainer     (Active relic pickups)
    │   └── pixiEnemiesContainer    (Enemy sprites)
    ├── [3] playerLayer
    │   └── pixiPlayerContainer
    │       ├── shipBodyLayer       <-- TARGET: RimGlowFilter attached ONLY here
    │       │   └── shipSprite      (2x procedural vector texture)
    │       └── shipShieldLayer     <-- ISOLATED: Additive blend, corona bubble/ring
    ├── [4] emissiveLayer           <-- TARGET: AdvancedBloomFilter attached ONLY here
    │   ├── pixiBulletTrailsGraphics
    │   ├── pixiBulletsContainer    (Player projectile sprites)
    │   ├── pixiEnemyBulletsContainer
    │   ├── pixiParticlesContainer  (Explosion sparks, smoke, energy rings)
    │   └── GatlingBeamFXManager    (TilingSprite beam container, blendMode: 'add')
    └── [5] overlayTextLayer
        └── pixiTextContainer       (BitmapFont damage numbers, critical labels)
```

---

## 2. FILTER PIPELINE & TARGETS

| Filter Class | Attachment Point | Key Uniforms / Config | Critical Behavior & Rules |
| :--- | :--- | :--- | :--- |
| **`AdvancedBloomFilter`** | `emissiveLayer` | `threshold: 0.45`, `bloomScale: 1.3`, `blur: 6` | **NEVER attach to worldContainer**. Only glowing projectiles, particles, and beams bleed light. Background and HUD remain 100% crisp. |
| **`RimGlowFilter`** | `shipBodyLayer` | `uAlphaCutoff: 0.55`, `uThickness: 2.8`, `uGlowColor: vec3`, `uGlowPower: 1.8` | **NEVER attach to shield sprite**. Samples alpha contour of the ship body exclusively to prevent solid cyan disc artifacts. |
| **`UnifiedPostFilter`** | `worldContainer` | `uGrainStrength: 0.04`, `uVignettePower: 1.6`, `uGradeContrast: 1.08` | Single-pass fullscreen post-processing combining film grain, vignette, and color grading. Low overhead. |
| **`RGBSplitFilter`** | `worldContainer` | `red: [-dx, dy]`, `green: [0, 0]`, `blue: [dx, -dy]` | Active during player damage hit ticks (`damageTimer > 0`). Fast exponential falloff. |
| **`ShockwaveFilter`** | `worldContainer` | `center: [x, y]`, `wavelength: 120`, `brightness: 1.4`, `radius: r` | Triggered on boss kills, large explosions, and weapon evolution moments. |

---

## 3. SHADER PRE-WARM & JANK ELIMINATION
- **Mechanism**: `PostProcessFXManager.prewarm(app)` runs during initial engine boot.
- **Implementation**: Renders a 4x4 offscreen scratch texture through `unifiedFilter`, `rgbSplitFilter`, and `shockwaveFilter`.
- **Purpose**: Pre-compiles WebGL GPU shader programs and allocates Framebuffer Objects (FBO) before player input begins. Eliminates 200+ ms long-task compilation spikes on the first hit/dash.

---

## 4. HARDWARE ACCELERATION & ZERO-GC RULES

### A. Beam Systems (`GatlingBeamFXManager`)
- **Primitive**: `PIXI.TilingSprite` (pooled, 8 instances max).
- **Textures**: Procedural white/grayscale base textures with vertical alpha falloff (`beamTexture`, `coreTexture`).
- **WebGL Tinting**: Pure white textures allow dynamic runtime coloring via `sprite.tint` (cyan `0x00f3ff`, white-hot `0xffffff`, gold `0xffe600`).
- **UV Animation**: `tilePosition.x += speed * dt` delivers flowing energy motion without regenerating vertex buffers.
- **Scaling Rule**: Multiple concurrent beams scale width and alpha by `1 / Math.sqrt(n)`.

### B. Trails (`TrailFXManager`)
- **Primitive**: `PIXI.MeshRope` (pooled, 20-point ring buffer for player, 7-point buffers for heavy bullets).
- **Texture**: `trail_ribbon` (procedural dual-tapered alpha ribbon).
- **Rule**: Update existing `Float32Array` points in place; never re-allocate point arrays per frame.

### C. Graphics Clear Restraint
- **Forbidden**: Do not use `Graphics.clear()` followed by dozens of `stroke()` / `lineTo()` calls in the hot loop.
- **Allowed**: Graphics objects are reserved for static boundary boxes or low-frequency hazard rings (`pixiHazardsBelow`).

---

## 5. RESOLUTION, CAMERA & PERFORMANCE

```js
// Standard Screen Setup
const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // Cap at 1.5 to protect fillrate
const app = new PIXI.Application();
await app.init({
    canvas: document.getElementById('gameCanvas'),
    resizeTo: window,
    autoDensity: true,
    resolution: dpr,
    antialias: false, // FXAA/post-process handles smoothing
    powerPreference: 'high-performance'
});

// Camera Coordinates
worldContainer.x = (screenWidth / 2) - curCamX + screenShakeX;
worldContainer.y = (screenHeight / 2) - curCamY + screenShakeY;
worldContainer.scale.set(cameraZoomScale); // Zoom punch (1.0 -> 1.05 -> 1.0)
```
