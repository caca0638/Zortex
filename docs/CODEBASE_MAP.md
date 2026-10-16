# ZORTEX: CYBER SURVIVOR - DYNAMIC CODEBASE MAP

> **AUTO-GENERATED**: Run `node scripts/update_codebase_map.mjs` after code changes.
> **TOKEN OPTIMIZATION RULE**: Never load the entire file into context. Use the exact line ranges below with `view_file` (e.g. `StartLine=9807, EndLine=11600`).

*Last Generated:* `2026-10-16T21:59:17.853Z` | *index.html Lines:* **18.954** | *zortex_fx.js Lines:* **2.367**

---

## 1. `index.html` Subsystems Overview

| Subsystem | Exact Line Range | Span | Purpose & Responsibilities |
| :--- | :--- | :--- | :--- |
| **HTML Shell, CSS Styling & HUD Dock** | `1 - 3.359` | 3359 l | DOM markup, CRT filters, chamfered HUD slots, styles. |
| **Audio Engine & Retro SFX** | `3.360 - 4.374` | 1015 l | Web Audio synthesizer, retro procedural laser & explosion sounds. |
| **Pixi Procedural Textures** | `4.375 - 5.548` | 1174 l | 2x resolution canvas textures for player ships & enemies. |
| **Scene Containers & Layer Hierarchy** | `5.549 - 5.831` | 283 l | 5-layer setup (background, entities, player, emissive, text). |
| **Viewport & Screen Scaling** | `5.832 - 6.107` | 276 l | Responsive canvas sizing and DPR limits. |
| **Gamepad, Input & Rumble Haptics** | `6.108 - 6.656` | 549 l | Gamepad polling, vibration effects, keyboard/mouse hooks. |
| **Hit-Stop & Screen Shake** | `6.657 - 6.900` | 244 l | Zero-jank micro freezes for heavy impacts and evolutions. |
| **Spatial Grid Partitioning** | `6.901 - 7.499` | 599 l | 2D spatial hash grid for high-speed collision lookups. |
| **Settings & Graphics Presets** | `7.500 - 7.631` | 132 l | Graphics tiers, reduceFlashing, audio and bloom toggles. |
| **Profiles & Meta Save System** | `7.632 - 8.035` | 404 l | localStorage & save_data.json persistence, scrap banking. |
| **Achievements & Badges** | `8.036 - 8.400` | 365 l | Unlock criteria, toast alerts, reward tracking. |
| **Tech Tree & Progression Upgrades** | `8.401 - 8.977` | 577 l | Meta upgrade nodes, stat multipliers, scrap costs. |
| **Starfield & Parallax Layers** | `8.978 - 9.241` | 264 l | Multi-layer 2.5D stars and warp hyperspace streaks. |
| **Particle System (Pooled)** | `9.242 - 9.640` | 399 l | Zero-GC smoke, spark, burst, and ring emitter pools. |
| **Damage Floating Text (BitmapFont)** | `9.641 - 9.806` | 166 l | Pooled damage numbers with dark contrast outline. |
| **Player Ship Architecture** | `9.807 - 11.600` | 1794 l | Ship body layer, shield corona, dash mechanics, weapons. |
| **Projectiles & Bullet Pooling** | `11.601 - 11.878` | 278 l | High-speed bullets, penetration, hit detection. |
| **Weapons & Evolution Logic** | `11.879 - 12.508` | 630 l | Weapon slots, cooldown timers, levelup evolutions. |
| **Enemy Hierarchy & AI States** | `12.509 - 13.934` | 1426 l | Enemy types (Scout, Swarm, Phantom, Aegis, Boss) & behaviors. |
| **Wave Spawner & Progression** | `13.935 - 14.161` | 227 l | Wave progression, spawn timer pacing, boss phases. |
| **Pickups, XP Gems & Black Holes** | `14.162 - 14.583` | 422 l | Gems, scrap, magnet physics, gravitational vortex. |
| **Turrets, Area Hazards & Decoys** | `14.584 - 15.631` | 1048 l | Environmental hazards, laser turrets, hack zones. |
| **HUD Rendering & Indicators** | `15.632 - 15.835` | 204 l | Real-time HP/Shield bars, combo meters, weapon slots. |
| **Main Game Loop (144Hz Physics)** | `15.836 - 17.302` | 1467 l | Delta timing, spatial queries, collision & render dispatch. |
| **Game State & Session Management** | `17.303 - 17.779` | 477 l | Run starts, game over flow, card selection, pause. |
| **Hangar, Tech Tree & Meta Menus** | `17.780 - 18.954` | 1175 l | Hangar ship selector, tech tree view, settings menu. |

---

## 2. `index.html` Class Hierarchy (41 Classes)

| Class Name | Inheritance | Exact Range | Lines | Quick Reference |
| :--- | :--- | :--- | :--- | :--- |
| `CameraTraumaSystem` | `-` | `3.212 - 3.354` | 143 | [Line 3212](file:///index.html#L3212) |
| `AudioEngine` | `-` | `3.360 - 4.267` | 908 | [Line 3360](file:///index.html#L3360) |
| `RelicPickup` | `-` | `6.588 - 6.645` | 58 | [Line 6588](file:///index.html#L6588) |
| `SpatialGrid` | `-` | `6.901 - 6.968` | 68 | [Line 6901](file:///index.html#L6901) |
| `Starfield` | `-` | `8.978 - 9.230` | 253 | [Line 8978](file:///index.html#L8978) |
| `ParticleSystem` | `-` | `9.242 - 9.637` | 396 | [Line 9242](file:///index.html#L9242) |
| `TextManager` | `-` | `9.641 - 9.804` | 164 | [Line 9641](file:///index.html#L9641) |
| `Player` | `-` | `9.807 - 11.570` | 1764 | [Line 9807](file:///index.html#L9807) |
| `Bullet` | `-` | `11.601 - 11.825` | 225 | [Line 11601](file:///index.html#L11601) |
| `EnemyBullet` | `extends Bullet` | `11.828 - 11.872` | 45 | [Line 11828](file:///index.html#L11828) |
| `WeaponBase` | `-` | `11.879 - 11.893` | 15 | [Line 11879](file:///index.html#L11879) |
| `BlasterWeapon` | `extends WeaponBase` | `11.896 - 11.957` | 62 | [Line 11896](file:///index.html#L11896) |
| `SpreadShotWeapon` | `extends WeaponBase` | `11.960 - 12.018` | 59 | [Line 11960](file:///index.html#L11960) |
| `PlasmaBeamWeapon` | `extends WeaponBase` | `12.021 - 12.055` | 35 | [Line 12021](file:///index.html#L12021) |
| `RailgunWeapon` | `extends WeaponBase` | `12.058 - 12.112` | 55 | [Line 12058](file:///index.html#L12058) |
| `HomingMissilesWeapon` | `extends WeaponBase` | `12.115 - 12.141` | 27 | [Line 12115](file:///index.html#L12115) |
| `TeslaCoilWeapon` | `extends WeaponBase` | `12.144 - 12.168` | 25 | [Line 12144](file:///index.html#L12144) |
| `OrbitBladesWeapon` | `extends WeaponBase` | `12.171 - 12.196` | 26 | [Line 12171](file:///index.html#L12171) |
| `GravityCannonWeapon` | `extends WeaponBase` | `12.199 - 12.221` | 23 | [Line 12199](file:///index.html#L12199) |
| `MineLayerWeapon` | `extends WeaponBase` | `12.224 - 12.244` | 21 | [Line 12224](file:///index.html#L12224) |
| `OrbitalSatelliteWeapon` | `extends WeaponBase` | `12.247 - 12.269` | 23 | [Line 12247](file:///index.html#L12247) |
| `HologramPrismWeapon` | `extends WeaponBase` | `12.272 - 12.294` | 23 | [Line 12272](file:///index.html#L12272) |
| `ShadowCloneWeapon` | `extends WeaponBase` | `12.297 - 12.316` | 20 | [Line 12297](file:///index.html#L12297) |
| `GatlingVulcanWeapon` | `extends WeaponBase` | `12.319 - 12.339` | 21 | [Line 12319](file:///index.html#L12319) |
| `WeaponManager` | `-` | `12.342 - 12.495` | 154 | [Line 12342](file:///index.html#L12342) |
| `EnemyBase` | `-` | `12.509 - 13.318` | 810 | [Line 12509](file:///index.html#L12509) |
| `Enemy` | `extends EnemyBase` | `13.321 - 13.664` | 344 | [Line 13321](file:///index.html#L13321) |
| `SwarmDroneEnemy` | `extends Enemy` | `13.667 - 13.746` | 80 | [Line 13667](file:///index.html#L13667) |
| `KamikazeEnemy` | `extends Enemy` | `13.749 - 13.775` | 27 | [Line 13749](file:///index.html#L13749) |
| `PhantomEnemy` | `extends Enemy` | `13.778 - 13.827` | 50 | [Line 13778](file:///index.html#L13778) |
| `AegisHeavyEnemy` | `extends Enemy` | `13.830 - 13.835` | 6 | [Line 13830](file:///index.html#L13830) |
| `BossEnemy` | `extends Enemy` | `13.838 - 13.843` | 6 | [Line 13838](file:///index.html#L13838) |
| `WaveManager` | `-` | `13.935 - 14.141` | 207 | [Line 13935](file:///index.html#L13935) |
| `XpGem` | `-` | `14.162 - 14.230` | 69 | [Line 14162](file:///index.html#L14162) |
| `ScrapPickup` | `-` | `14.304 - 14.387` | 84 | [Line 14304](file:///index.html#L14304) |
| `BlackHole` | `-` | `14.398 - 14.563` | 166 | [Line 14398](file:///index.html#L14398) |
| `LaserTurret` | `-` | `14.584 - 14.670` | 87 | [Line 14584](file:///index.html#L14584) |
| `HackZone` | `-` | `14.774 - 14.895` | 122 | [Line 14774](file:///index.html#L14774) |
| `HoloDecoy` | `-` | `14.900 - 14.989` | 90 | [Line 14900](file:///index.html#L14900) |
| `GravityAnchor` | `-` | `14.994 - 15.105` | 112 | [Line 14994](file:///index.html#L14994) |
| `SentryTurret` | `-` | `15.110 - 15.221` | 112 | [Line 15110](file:///index.html#L15110) |

---

## 3. `index.html` Core Engine Functions

| Function | Exact Range | Span | Context |
| :--- | :--- | :--- | :--- |
| `initPixiTextures()` | `4.375 - 5.294` | 920 l | Core Engine |
| `setupPixiContainers()` | `5.549 - 5.783` | 235 l | Core Engine |
| `clearEntityContainers()` | `5.787 - 5.827` | 41 l | Core Engine |
| `resize()` | `5.832 - 5.847` | 16 l | Core Engine |
| `triggerRumble()` | `6.108 - 6.139` | 32 l | Core Engine |
| `updateGamepad()` | `6.433 - 6.551` | 119 l | Core Engine |
| `triggerHitStop()` | `6.657 - 6.660` | 4 l | Core Engine |
| `resetRunStats()` | `6.731 - 6.767` | 37 l | Core Engine |
| `loadSettings()` | `7.500 - 7.513` | 14 l | Core Engine |
| `saveSettings()` | `7.515 - 7.521` | 7 l | Core Engine |
| `applyGraphicsPreset()` | `7.523 - 7.564` | 42 l | Core Engine |
| `loadAllProfiles()` | `7.678 - 7.716` | 39 l | Core Engine |
| `saveAllProfiles()` | `7.718 - 7.740` | 23 l | Core Engine |
| `checkAchievements()` | `8.358 - 8.364` | 7 l | Core Engine |
| `updateDOMHUD()` | `15.632 - 15.806` | 175 l | Core Engine |
| `drawHUD()` | `15.807 - 15.807` | 1 l | Core Engine |
| `gameLoop()` | `15.836 - 17.292` | 1457 l | Core Engine |
| `startGame()` | `17.303 - 17.415` | 113 l | Core Engine |
| `renderHangar()` | `17.780 - 17.893` | 114 l | Core Engine |
| `renderTechTree()` | `18.250 - 18.318` | 69 l | Core Engine |
| `gameOver()` | `18.720 - 18.802` | 83 l | Core Engine |

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
