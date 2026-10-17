# ZORTEX: CYBER SURVIVOR - DYNAMIC CODEBASE MAP

> **AUTO-GENERATED**: Run `node scripts/update_codebase_map.mjs` after code changes.
> **TOKEN OPTIMIZATION RULE**: Never load the entire file into context. Use the exact line ranges below with `view_file` (e.g. `StartLine=9842, EndLine=11635`).

*Last Generated:* `2026-10-17T00:23:22.010Z` | *index.html Lines:* **19.122** | *zortex_fx.js Lines:* **2.437**

---

## 1. `index.html` Subsystems Overview

| Subsystem | Exact Line Range | Span | Purpose & Responsibilities |
| :--- | :--- | :--- | :--- |
| **HTML Shell, CSS Styling & HUD Dock** | `1 - 3.423` | 3423 l | DOM markup, CRT filters, chamfered HUD slots, styles. |
| **Audio Engine & Retro SFX** | `3.424 - 4.438` | 1015 l | Web Audio synthesizer, retro procedural laser & explosion sounds. |
| **Pixi Procedural Textures** | `4.439 - 5.530` | 1092 l | 2x resolution canvas textures for player ships & enemies. |
| **Scene Containers & Layer Hierarchy** | `5.531 - 5.813` | 283 l | 5-layer setup (background, entities, player, emissive, text). |
| **Viewport & Screen Scaling** | `5.814 - 6.107` | 294 l | Responsive canvas sizing and DPR limits. |
| **Gamepad, Input & Rumble Haptics** | `6.108 - 6.661` | 554 l | Gamepad polling, vibration effects, keyboard/mouse hooks. |
| **Hit-Stop & Screen Shake** | `6.662 - 6.905` | 244 l | Zero-jank micro freezes for heavy impacts and evolutions. |
| **Spatial Grid Partitioning** | `6.906 - 7.511` | 606 l | 2D spatial hash grid for high-speed collision lookups. |
| **Settings & Graphics Presets** | `7.512 - 7.643` | 132 l | Graphics tiers, reduceFlashing, audio and bloom toggles. |
| **Profiles & Meta Save System** | `7.644 - 8.047` | 404 l | localStorage & save_data.json persistence, scrap banking. |
| **Achievements & Badges** | `8.048 - 8.412` | 365 l | Unlock criteria, toast alerts, reward tracking. |
| **Tech Tree & Progression Upgrades** | `8.413 - 8.989` | 577 l | Meta upgrade nodes, stat multipliers, scrap costs. |
| **Starfield & Parallax Layers** | `8.990 - 9.253` | 264 l | Multi-layer 2.5D stars and warp hyperspace streaks. |
| **Particle System (Pooled)** | `9.254 - 9.675` | 422 l | Zero-GC smoke, spark, burst, and ring emitter pools. |
| **Damage Floating Text (BitmapFont)** | `9.676 - 9.841` | 166 l | Pooled damage numbers with dark contrast outline. |
| **Player Ship Architecture** | `9.842 - 11.635` | 1794 l | Ship body layer, shield corona, dash mechanics, weapons. |
| **Projectiles & Bullet Pooling** | `11.636 - 11.913` | 278 l | High-speed bullets, penetration, hit detection. |
| **Weapons & Evolution Logic** | `11.914 - 12.543` | 630 l | Weapon slots, cooldown timers, levelup evolutions. |
| **Enemy Hierarchy & AI States** | `12.544 - 13.967` | 1424 l | Enemy types (Scout, Swarm, Phantom, Aegis, Boss) & behaviors. |
| **Wave Spawner & Progression** | `13.968 - 14.194` | 227 l | Wave progression, spawn timer pacing, boss phases. |
| **Pickups, XP Gems & Black Holes** | `14.195 - 14.616` | 422 l | Gems, scrap, magnet physics, gravitational vortex. |
| **Turrets, Area Hazards & Decoys** | `14.617 - 15.664` | 1048 l | Environmental hazards, laser turrets, hack zones. |
| **HUD Rendering & Indicators** | `15.665 - 15.868` | 204 l | Real-time HP/Shield bars, combo meters, weapon slots. |
| **Main Game Loop (144Hz Physics)** | `15.869 - 17.385` | 1517 l | Delta timing, spatial queries, collision & render dispatch. |
| **Game State & Session Management** | `17.386 - 17.862` | 477 l | Run starts, game over flow, card selection, pause. |
| **Hangar, Tech Tree & Meta Menus** | `17.863 - 19.122` | 1260 l | Hangar ship selector, tech tree view, settings menu. |

---

## 2. `index.html` Class Hierarchy (41 Classes)

| Class Name | Inheritance | Exact Range | Lines | Quick Reference |
| :--- | :--- | :--- | :--- | :--- |
| `CameraTraumaSystem` | `-` | `3.276 - 3.418` | 143 | [Line 3276](file:///index.html#L3276) |
| `AudioEngine` | `-` | `3.424 - 4.331` | 908 | [Line 3424](file:///index.html#L3424) |
| `RelicPickup` | `-` | `6.593 - 6.650` | 58 | [Line 6593](file:///index.html#L6593) |
| `SpatialGrid` | `-` | `6.906 - 6.973` | 68 | [Line 6906](file:///index.html#L6906) |
| `Starfield` | `-` | `8.990 - 9.242` | 253 | [Line 8990](file:///index.html#L8990) |
| `ParticleSystem` | `-` | `9.254 - 9.672` | 419 | [Line 9254](file:///index.html#L9254) |
| `TextManager` | `-` | `9.676 - 9.839` | 164 | [Line 9676](file:///index.html#L9676) |
| `Player` | `-` | `9.842 - 11.605` | 1764 | [Line 9842](file:///index.html#L9842) |
| `Bullet` | `-` | `11.636 - 11.860` | 225 | [Line 11636](file:///index.html#L11636) |
| `EnemyBullet` | `extends Bullet` | `11.863 - 11.907` | 45 | [Line 11863](file:///index.html#L11863) |
| `WeaponBase` | `-` | `11.914 - 11.928` | 15 | [Line 11914](file:///index.html#L11914) |
| `BlasterWeapon` | `extends WeaponBase` | `11.931 - 11.992` | 62 | [Line 11931](file:///index.html#L11931) |
| `SpreadShotWeapon` | `extends WeaponBase` | `11.995 - 12.053` | 59 | [Line 11995](file:///index.html#L11995) |
| `PlasmaBeamWeapon` | `extends WeaponBase` | `12.056 - 12.090` | 35 | [Line 12056](file:///index.html#L12056) |
| `RailgunWeapon` | `extends WeaponBase` | `12.093 - 12.147` | 55 | [Line 12093](file:///index.html#L12093) |
| `HomingMissilesWeapon` | `extends WeaponBase` | `12.150 - 12.176` | 27 | [Line 12150](file:///index.html#L12150) |
| `TeslaCoilWeapon` | `extends WeaponBase` | `12.179 - 12.203` | 25 | [Line 12179](file:///index.html#L12179) |
| `OrbitBladesWeapon` | `extends WeaponBase` | `12.206 - 12.231` | 26 | [Line 12206](file:///index.html#L12206) |
| `GravityCannonWeapon` | `extends WeaponBase` | `12.234 - 12.256` | 23 | [Line 12234](file:///index.html#L12234) |
| `MineLayerWeapon` | `extends WeaponBase` | `12.259 - 12.279` | 21 | [Line 12259](file:///index.html#L12259) |
| `OrbitalSatelliteWeapon` | `extends WeaponBase` | `12.282 - 12.304` | 23 | [Line 12282](file:///index.html#L12282) |
| `HologramPrismWeapon` | `extends WeaponBase` | `12.307 - 12.329` | 23 | [Line 12307](file:///index.html#L12307) |
| `ShadowCloneWeapon` | `extends WeaponBase` | `12.332 - 12.351` | 20 | [Line 12332](file:///index.html#L12332) |
| `GatlingVulcanWeapon` | `extends WeaponBase` | `12.354 - 12.374` | 21 | [Line 12354](file:///index.html#L12354) |
| `WeaponManager` | `-` | `12.377 - 12.530` | 154 | [Line 12377](file:///index.html#L12377) |
| `EnemyBase` | `-` | `12.544 - 13.348` | 805 | [Line 12544](file:///index.html#L12544) |
| `Enemy` | `extends EnemyBase` | `13.351 - 13.694` | 344 | [Line 13351](file:///index.html#L13351) |
| `SwarmDroneEnemy` | `extends Enemy` | `13.697 - 13.776` | 80 | [Line 13697](file:///index.html#L13697) |
| `KamikazeEnemy` | `extends Enemy` | `13.779 - 13.805` | 27 | [Line 13779](file:///index.html#L13779) |
| `PhantomEnemy` | `extends Enemy` | `13.808 - 13.857` | 50 | [Line 13808](file:///index.html#L13808) |
| `AegisHeavyEnemy` | `extends Enemy` | `13.860 - 13.865` | 6 | [Line 13860](file:///index.html#L13860) |
| `BossEnemy` | `extends Enemy` | `13.868 - 13.873` | 6 | [Line 13868](file:///index.html#L13868) |
| `WaveManager` | `-` | `13.968 - 14.174` | 207 | [Line 13968](file:///index.html#L13968) |
| `XpGem` | `-` | `14.195 - 14.263` | 69 | [Line 14195](file:///index.html#L14195) |
| `ScrapPickup` | `-` | `14.337 - 14.420` | 84 | [Line 14337](file:///index.html#L14337) |
| `BlackHole` | `-` | `14.431 - 14.596` | 166 | [Line 14431](file:///index.html#L14431) |
| `LaserTurret` | `-` | `14.617 - 14.703` | 87 | [Line 14617](file:///index.html#L14617) |
| `HackZone` | `-` | `14.807 - 14.928` | 122 | [Line 14807](file:///index.html#L14807) |
| `HoloDecoy` | `-` | `14.933 - 15.022` | 90 | [Line 14933](file:///index.html#L14933) |
| `GravityAnchor` | `-` | `15.027 - 15.138` | 112 | [Line 15027](file:///index.html#L15027) |
| `SentryTurret` | `-` | `15.143 - 15.254` | 112 | [Line 15143](file:///index.html#L15143) |

---

## 3. `index.html` Core Engine Functions

| Function | Exact Range | Span | Context |
| :--- | :--- | :--- | :--- |
| `initPixiTextures()` | `4.439 - 5.276` | 838 l | Core Engine |
| `setupPixiContainers()` | `5.531 - 5.765` | 235 l | Core Engine |
| `clearEntityContainers()` | `5.769 - 5.809` | 41 l | Core Engine |
| `resize()` | `5.814 - 5.829` | 16 l | Core Engine |
| `triggerRumble()` | `6.108 - 6.139` | 32 l | Core Engine |
| `updateGamepad()` | `6.438 - 6.556` | 119 l | Core Engine |
| `triggerHitStop()` | `6.662 - 6.665` | 4 l | Core Engine |
| `resetRunStats()` | `6.736 - 6.772` | 37 l | Core Engine |
| `loadSettings()` | `7.512 - 7.525` | 14 l | Core Engine |
| `saveSettings()` | `7.527 - 7.533` | 7 l | Core Engine |
| `applyGraphicsPreset()` | `7.535 - 7.576` | 42 l | Core Engine |
| `loadAllProfiles()` | `7.690 - 7.728` | 39 l | Core Engine |
| `saveAllProfiles()` | `7.730 - 7.752` | 23 l | Core Engine |
| `checkAchievements()` | `8.370 - 8.376` | 7 l | Core Engine |
| `updateDOMHUD()` | `15.665 - 15.839` | 175 l | Core Engine |
| `drawHUD()` | `15.840 - 15.840` | 1 l | Core Engine |
| `gameLoop()` | `15.869 - 17.375` | 1507 l | Core Engine |
| `startGame()` | `17.386 - 17.498` | 113 l | Core Engine |
| `renderHangar()` | `17.863 - 17.976` | 114 l | Core Engine |
| `renderTechTree()` | `18.333 - 18.401` | 69 l | Core Engine |
| `gameOver()` | `18.814 - 18.896` | 83 l | Core Engine |

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
| `PostProcessFXManager` | `711 - 1.093` | 383 l | Unified fullscreen post-process (CRT, RGBSplit, shockwave, vignette). |
| `LightFXManager` | `1.096 - 1.255` | 160 l | 32-sprite pooled radial additive point lights. |
| `RimGlowManager` | `1.258 - 1.418` | 161 l | GlProgram RimGlowFilter applied strictly to shipBodyLayer. |
| `GatlingBeamFXManager` | `1.421 - 1.773` | 353 l | TilingSprite energy beams, spool-up dynamics and heat gradient. |
| `WeaponEvolutionCinematicManager` | `1.776 - 1.916` | 141 l | Weapon evolution hit-stop, shockwave, flash and HUD banner. |
| `DebugPanel` | `1.918 - 2.236` | 319 l | Tweakpane v4 (F2) live runtime shader and layer debugger. |

---
