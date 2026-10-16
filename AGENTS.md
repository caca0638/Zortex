# ZORTEX: CYBER SURVIVOR - AGENT CONSTITUTION & PROTOCOLS

> **TOKEN OPTIMIZATION POLICY**: Dense, authoritative project context. Prioritize targeted line reading over scanning 19,038 lines of monolithic code. Consult `docs/CODEBASE_MAP.md` before reading `index.html`.

---

## 1. CORE PROJECT SPECIFICATION
- **Engine**: PixiJS v8.x (`pixi.v8.min.js`), WebGL2 / WebGPU-ready architecture.
- **Target Target Refresh Rate**: 144Hz (frame budget: ~6.94 ms, p99 < 8.0 ms, zero spikes >20 ms in active combat).
- **Architecture**: Single-file core game loop (`index.html`, 17.739 satır) + modular FX architecture (`js/fx/zortex_fx.js`, 2.106 satır) + 18 modüler JS sistemi (`js/`) + offline vendor libraries (`vendor/`).
- **Dependencies & Network**: 100% OFFLINE. No CDNs, no external network requests at runtime. All vendors bundled in `vendor/`.

---

## 2. STRICT ENGINEERING CONSTRAINTS (INVIOLABLE)

| Area | Strict Rule | Violation Consequence |
| :--- | :--- | :--- |
| **PixiJS Version** | **v8 API ONLY**. No v7 syntax (`new Filter(vert, frag)`, legacy `PIXI.Text`). Use `GlProgram.from`, modern `Filter`, `MeshRope`, `TilingSprite`. | WebGL shader crash / render target UID collision. |
| **Monolithic Restraint** | **DO NOT rewrite or re-generate `index.html`**. Make surgical edits using targeted replacement tools on precise line blocks. | Context overflow, syntax truncation, corrupted game loop. |
| **FX Separation** | Visual and post-process enhancements live in `js/fx/zortex_fx.js`. Link via minimal `// [FX]` hooks in `index.html`. | Code entanglement, regression bugs. |
| **Save Data Integrity** | Preserve schema of `save_data.json` and `localStorage` profiles (`getActiveProfile()`, `loadMeta()`). | Player progression & upgrade loss. |
| **Hardware & Controls** | Preserve Gamepad API mappings, touch controls, and audio settings (`sfxVolume`, `musicVolume`). | Broken controller support. |
| **Accessibility** | Respect `reduceFlashing` setting across all flashes, bloom boosts, and evolution cinematics. | Seizure / accessibility risk. |
| **Console Cleanliness** | **Zero errors, zero warnings**. Any unhandled promise rejection or WebGL warning fails delivery. | Delivery rejection. |

---

## 3. REPOSITORY ANATOMY & QUICK PATHS

```
c:/Users/user/Desktop/zort/
├── index.html               # Core game: Player, Weapons, Enemies, Game Loop, UI (19.038 satır)
├── js/fx/zortex_fx.js       # FX Engine: PostProcess, Bloom, Nebula, Gatling, Trails, Evolution (2.367 satır)
├── js/                      # 18 modüler alt sistem (audio, core, fx, gameplay)
├── vendor/                  # Offline libraries (tweakpane.min.js, pixi-filters.min.js)
├── pixi.v8.min.js           # PixiJS v8 UMD bundle
├── CHANGELOG_FX.md          # Architectural history (Faz 0 - Faz 9)
├── research/                # Open-source analysis & research logs
│   └── OPEN_SOURCE_NOTES.md # Analyzed repositories & design patterns
├── scripts/                 # Headless browser verification, benchmark & diagnostics suite
│   ├── sim_gate.py          # Kanonik 10-dalga regresyon kapısı (0 hata)
│   ├── gfx_probe.py         # Per-frame GPU Graphics talimatı & doku probe'u
│   ├── bench_b2.py          # 600 kare 144Hz p50/p95 WebGL benchmarkı
│   └── update_codebase_map.mjs # Dinamik harita üreticisi (docs/CODEBASE_MAP.md)
└── docs/                    # Subsystem documentation & semantic index
    ├── CODEBASE_MAP.md      # Auto-generated semantic line map of index.html & zortex_fx.js
    ├── RENDER_PIPELINE.md   # WebGL/Pixi rendering layers, filters, bloom, prewarm specs
    ├── GAMEPLAY_SYSTEMS.md  # Weapons, enemies, wave progression, spatial grid, AI
    ├── STATE_AND_STORAGE.md # Profile schema, save_data.json, meta upgrades, audio/graphics settings
    ├── TESTING_RUNBOOK.md   # Headless Chrome testing, CDP telemetry, 60s benchmark runs
    └── SHIPS_AND_VISUALS.md # Procedural 2x vector ship standard, 5-layer formula, palettes, stats
```

---

## 4. RENDERING & SCENE LAYER CONTRACT
Render stack order in `worldContainer`:
1. `backgroundLayer` (`pixiNebulaContainer`, `pixiStarsContainer`, `pixiHazardsBelow`)
2. `entitiesLayer` (`pixiEnemiesContainer`, `pixiGemsContainer`, trails)
3. `playerLayer` (`pixiPlayerContainer`: `shipBodyLayer` [RimGlow] + `shipShieldLayer` [additive corona])
4. `emissiveLayer` (`pixiBulletTrailsGraphics`, `pixiBulletsContainer`, `pixiParticlesContainer`, `GatlingBeamFXManager` [AdvancedBloom])
5. `overlayTextLayer` (`pixiTextContainer` - BitmapFont damage numbers)

---

## 5. DIAGNOSIS & IMPLEMENTATION WORKFLOW
1. **Always Diagnose First**: Trace `Symptom -> Hypothesis -> Counter/Proof Experiment -> Root Cause`. Never guess.
2. **Targeted Reading**: Look up line numbers in `docs/CODEBASE_MAP.md`. Read only the required 30-100 lines.
3. **Headless Verification**: Run `python scripts/sim_gate.py` (Kanonik regresyon kapısı: 10 dalga, 0 hata). Confirm `errors: []` and `warnings: []`.
4. **Snapshot Discipline**: Before modifying major systems, create a reference snapshot in `.git_snapshot/`.
