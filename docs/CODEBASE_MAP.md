# ZORTEX: CYBER SURVIVOR - DYNAMIC CODEBASE MAP

> **AUTO-GENERATED**: Run `node scripts/update_codebase_map.mjs` after code changes.
> **TOKEN OPTIMIZATION RULE**: Never load the entire file into context. Use the exact line ranges below with `view_file` (e.g. `StartLine=9844, EndLine=11637`).

*Last Generated:* `2026-10-16T19:53:53.060Z` | *index.html Lines:* **18.991** | *zortex_fx.js Lines:* **2.367**

---

## 1. `index.html` Subsystems Overview

| Subsystem | Exact Line Range | Span | Purpose & Responsibilities |
| :--- | :--- | :--- | :--- |
| **HTML Shell, CSS Styling & HUD Dock** | `1 - 3.359` | 3359 l | DOM markup, CRT filters, chamfered HUD slots, styles. |
| **Audio Engine & Retro SFX** | `3.360 - 4.374` | 1015 l | Web Audio synthesizer, retro procedural laser & explosion sounds. |
| **Pixi Procedural Textures** | `4.375 - 5.536` | 1162 l | 2x resolution canvas textures for player ships & enemies. |
| **Scene Containers & Layer Hierarchy** | `5.537 - 5.821` | 285 l | 5-layer setup (background, entities, player, emissive, text). |
| **Viewport & Screen Scaling** | `5.822 - 6.097` | 276 l | Responsive canvas sizing and DPR limits. |
| **Gamepad, Input & Rumble Haptics** | `6.098 - 6.646` | 549 l | Gamepad polling, vibration effects, keyboard/mouse hooks. |
| **Hit-Stop & Screen Shake** | `6.647 - 6.890` | 244 l | Zero-jank micro freezes for heavy impacts and evolutions. |
| **Spatial Grid Partitioning** | `6.891 - 7.489` | 599 l | 2D spatial hash grid for high-speed collision lookups. |
| **Settings & Graphics Presets** | `7.490 - 7.621` | 132 l | Graphics tiers, reduceFlashing, audio and bloom toggles. |
| **Profiles & Meta Save System** | `7.622 - 8.025` | 404 l | localStorage & save_data.json persistence, scrap banking. |
| **Achievements & Badges** | `8.026 - 8.390` | 365 l | Unlock criteria, toast alerts, reward tracking. |
| **Tech Tree & Progression Upgrades** | `8.391 - 8.967` | 577 l | Meta upgrade nodes, stat multipliers, scrap costs. |
| **Starfield & Parallax Layers** | `8.968 - 9.278` | 311 l | Multi-layer 2.5D stars and warp hyperspace streaks. |
| **Particle System (Pooled)** | `9.279 - 9.677` | 399 l | Zero-GC smoke, spark, burst, and ring emitter pools. |
| **Damage Floating Text (BitmapFont)** | `9.678 - 9.843` | 166 l | Pooled damage numbers with dark contrast outline. |
| **Player Ship Architecture** | `9.844 - 11.637` | 1794 l | Ship body layer, shield corona, dash mechanics, weapons. |
| **Projectiles & Bullet Pooling** | `11.638 - 11.915` | 278 l | High-speed bullets, penetration, hit detection. |
| **Weapons & Evolution Logic** | `11.916 - 12.545` | 630 l | Weapon slots, cooldown timers, levelup evolutions. |
| **Enemy Hierarchy & AI States** | `12.546 - 13.971` | 1426 l | Enemy types (Scout, Swarm, Phantom, Aegis, Boss) & behaviors. |
| **Wave Spawner & Progression** | `13.972 - 14.198` | 227 l | Wave progression, spawn timer pacing, boss phases. |
| **Pickups, XP Gems & Black Holes** | `14.199 - 14.620` | 422 l | Gems, scrap, magnet physics, gravitational vortex. |
| **Turrets, Area Hazards & Decoys** | `14.621 - 15.668` | 1048 l | Environmental hazards, laser turrets, hack zones. |
| **HUD Rendering & Indicators** | `15.669 - 15.872` | 204 l | Real-time HP/Shield bars, combo meters, weapon slots. |
| **Main Game Loop (144Hz Physics)** | `15.873 - 17.339` | 1467 l | Delta timing, spatial queries, collision & render dispatch. |
| **Game State & Session Management** | `17.340 - 17.816` | 477 l | Run starts, game over flow, card selection, pause. |
| **Hangar, Tech Tree & Meta Menus** | `17.817 - 18.991` | 1175 l | Hangar ship selector, tech tree view, settings menu. |

---

## 2. `index.html` Class Hierarchy (41 Classes)

| Class Name | Inheritance | Exact Range | Lines | Quick Reference |
| :--- | :--- | :--- | :--- | :--- |
| `CameraTraumaSystem` | `-` | `3.212 - 3.354` | 143 | [Line 3212](file:///index.html#L3212) |
| `AudioEngine` | `-` | `3.360 - 4.267` | 908 | [Line 3360](file:///index.html#L3360) |
| `RelicPickup` | `-` | `6.578 - 6.635` | 58 | [Line 6578](file:///index.html#L6578) |
| `SpatialGrid` | `-` | `6.891 - 6.958` | 68 | [Line 6891](file:///index.html#L6891) |
| `Starfield` | `-` | `8.968 - 9.267` | 300 | [Line 8968](file:///index.html#L8968) |
| `ParticleSystem` | `-` | `9.279 - 9.674` | 396 | [Line 9279](file:///index.html#L9279) |
| `TextManager` | `-` | `9.678 - 9.841` | 164 | [Line 9678](file:///index.html#L9678) |
| `Player` | `-` | `9.844 - 11.607` | 1764 | [Line 9844](file:///index.html#L9844) |
| `Bullet` | `-` | `11.638 - 11.862` | 225 | [Line 11638](file:///index.html#L11638) |
| `EnemyBullet` | `extends Bullet` | `11.865 - 11.909` | 45 | [Line 11865](file:///index.html#L11865) |
| `WeaponBase` | `-` | `11.916 - 11.930` | 15 | [Line 11916](file:///index.html#L11916) |
| `BlasterWeapon` | `extends WeaponBase` | `11.933 - 11.994` | 62 | [Line 11933](file:///index.html#L11933) |
| `SpreadShotWeapon` | `extends WeaponBase` | `11.997 - 12.055` | 59 | [Line 11997](file:///index.html#L11997) |
| `PlasmaBeamWeapon` | `extends WeaponBase` | `12.058 - 12.092` | 35 | [Line 12058](file:///index.html#L12058) |
| `RailgunWeapon` | `extends WeaponBase` | `12.095 - 12.149` | 55 | [Line 12095](file:///index.html#L12095) |
| `HomingMissilesWeapon` | `extends WeaponBase` | `12.152 - 12.178` | 27 | [Line 12152](file:///index.html#L12152) |
| `TeslaCoilWeapon` | `extends WeaponBase` | `12.181 - 12.205` | 25 | [Line 12181](file:///index.html#L12181) |
| `OrbitBladesWeapon` | `extends WeaponBase` | `12.208 - 12.233` | 26 | [Line 12208](file:///index.html#L12208) |
| `GravityCannonWeapon` | `extends WeaponBase` | `12.236 - 12.258` | 23 | [Line 12236](file:///index.html#L12236) |
| `MineLayerWeapon` | `extends WeaponBase` | `12.261 - 12.281` | 21 | [Line 12261](file:///index.html#L12261) |
| `OrbitalSatelliteWeapon` | `extends WeaponBase` | `12.284 - 12.306` | 23 | [Line 12284](file:///index.html#L12284) |
| `HologramPrismWeapon` | `extends WeaponBase` | `12.309 - 12.331` | 23 | [Line 12309](file:///index.html#L12309) |
| `ShadowCloneWeapon` | `extends WeaponBase` | `12.334 - 12.353` | 20 | [Line 12334](file:///index.html#L12334) |
| `GatlingVulcanWeapon` | `extends WeaponBase` | `12.356 - 12.376` | 21 | [Line 12356](file:///index.html#L12356) |
| `WeaponManager` | `-` | `12.379 - 12.532` | 154 | [Line 12379](file:///index.html#L12379) |
| `EnemyBase` | `-` | `12.546 - 13.355` | 810 | [Line 12546](file:///index.html#L12546) |
| `Enemy` | `extends EnemyBase` | `13.358 - 13.701` | 344 | [Line 13358](file:///index.html#L13358) |
| `SwarmDroneEnemy` | `extends Enemy` | `13.704 - 13.783` | 80 | [Line 13704](file:///index.html#L13704) |
| `KamikazeEnemy` | `extends Enemy` | `13.786 - 13.812` | 27 | [Line 13786](file:///index.html#L13786) |
| `PhantomEnemy` | `extends Enemy` | `13.815 - 13.864` | 50 | [Line 13815](file:///index.html#L13815) |
| `AegisHeavyEnemy` | `extends Enemy` | `13.867 - 13.872` | 6 | [Line 13867](file:///index.html#L13867) |
| `BossEnemy` | `extends Enemy` | `13.875 - 13.880` | 6 | [Line 13875](file:///index.html#L13875) |
| `WaveManager` | `-` | `13.972 - 14.178` | 207 | [Line 13972](file:///index.html#L13972) |
| `XpGem` | `-` | `14.199 - 14.267` | 69 | [Line 14199](file:///index.html#L14199) |
| `ScrapPickup` | `-` | `14.341 - 14.424` | 84 | [Line 14341](file:///index.html#L14341) |
| `BlackHole` | `-` | `14.435 - 14.600` | 166 | [Line 14435](file:///index.html#L14435) |
| `LaserTurret` | `-` | `14.621 - 14.707` | 87 | [Line 14621](file:///index.html#L14621) |
| `HackZone` | `-` | `14.811 - 14.932` | 122 | [Line 14811](file:///index.html#L14811) |
| `HoloDecoy` | `-` | `14.937 - 15.026` | 90 | [Line 14937](file:///index.html#L14937) |
| `GravityAnchor` | `-` | `15.031 - 15.142` | 112 | [Line 15031](file:///index.html#L15031) |
| `SentryTurret` | `-` | `15.147 - 15.258` | 112 | [Line 15147](file:///index.html#L15147) |

---

## 3. `index.html` Core Engine Functions

| Function | Exact Range | Span | Context |
| :--- | :--- | :--- | :--- |
| `initPixiTextures()` | `4.375 - 5.282` | 908 l | Core Engine |
| `setupPixiContainers()` | `5.537 - 5.773` | 237 l | Core Engine |
| `clearEntityContainers()` | `5.777 - 5.817` | 41 l | Core Engine |
| `resize()` | `5.822 - 5.837` | 16 l | Core Engine |
| `triggerRumble()` | `6.098 - 6.129` | 32 l | Core Engine |
| `updateGamepad()` | `6.423 - 6.541` | 119 l | Core Engine |
| `triggerHitStop()` | `6.647 - 6.650` | 4 l | Core Engine |
| `resetRunStats()` | `6.721 - 6.757` | 37 l | Core Engine |
| `loadSettings()` | `7.490 - 7.503` | 14 l | Core Engine |
| `saveSettings()` | `7.505 - 7.511` | 7 l | Core Engine |
| `applyGraphicsPreset()` | `7.513 - 7.554` | 42 l | Core Engine |
| `loadAllProfiles()` | `7.668 - 7.706` | 39 l | Core Engine |
| `saveAllProfiles()` | `7.708 - 7.730` | 23 l | Core Engine |
| `checkAchievements()` | `8.348 - 8.354` | 7 l | Core Engine |
| `updateDOMHUD()` | `15.669 - 15.843` | 175 l | Core Engine |
| `drawHUD()` | `15.844 - 15.844` | 1 l | Core Engine |
| `gameLoop()` | `15.873 - 17.329` | 1457 l | Core Engine |
| `startGame()` | `17.340 - 17.452` | 113 l | Core Engine |
| `renderHangar()` | `17.817 - 17.930` | 114 l | Core Engine |
| `renderTechTree()` | `18.287 - 18.355` | 69 l | Core Engine |
| `gameOver()` | `18.757 - 18.839` | 83 l | Core Engine |

---

## 4. `js/fx/zortex_fx.js` Visual FX Subsystems (12 Modules)

| Module / Manager | Line Range | Lines | Visual Functionality |
| :--- | :--- | :--- | :--- |
| `QualityManager` | `9 - 129` | 121 l | Adaptive performance tier controller (<45 fps downshift, >=58 fps upshift). |
| `FXRegistry` | `131 - 171` | 41 l | Subsystem lifecycle registry, debug toggles and status inspection. |
| `BloomManager` | `173 - 262` | 90 l | Pixi v8 AdvancedBloomFilter bound strictly to pixiEmissiveLayer. |
| `NebulaManager` | `264 - 493` | 230 l | Procedural 4-octave FBM GLSL background nebula shader. |
| `TrailFXManager` | `495 - 590` | 96 l | MeshRope GPU weapon trails and ship propulsion exhaust. |
| `ExplosionFXManager` | `592 - 709` | 118 l | Zero-GC 5-stage explosion pooling (flash, ring, sparks, smoke, light). |
| `PostProcessFXManager` | `711 - 1.065` | 355 l | Unified fullscreen post-process (CRT, RGBSplit, shockwave, vignette). |
| `LightFXManager` | `1.068 - 1.227` | 160 l | 32-sprite pooled radial additive point lights. |
| `RimGlowManager` | `1.230 - 1.390` | 161 l | GlProgram RimGlowFilter applied strictly to shipBodyLayer. |
| `GatlingBeamFXManager` | `1.393 - 1.745` | 353 l | TilingSprite energy beams, spool-up dynamics and heat gradient. |
| `WeaponEvolutionCinematicManager` | `1.748 - 1.888` | 141 l | Weapon evolution hit-stop, shockwave, flash and HUD banner. |
| `DebugPanel` | `1.890 - 2.166` | 277 l | Tweakpane v4 (F2) live runtime shader and layer debugger. |

---
