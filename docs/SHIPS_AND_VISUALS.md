# ZORTEX: CYBER SURVIVOR - SHIPS & VISUAL ASSETS SPECIFICATION

> **TOKEN OPTIMIZATION POLICY**: Whenever designing, updating, or redesigning player ships, shields, or enemy sprites, refer directly to this specification. Do NOT load `index.html` into context to understand drawing formulas.

---

## 1. PROCEDURAL 2X VECTOR SHIP STANDARD

All ships in ZORTEX are drawn procedurally using `PIXI.Graphics` and baked into high-density textures via `app.renderer.generateTexture({ target: g, resolution: 2 })`.

### Coordinate & Geometry Rules
- **Orientation**: Default heading points strictly along the **positive X-axis** (`0` radians = facing right).
- **Origin `(0, 0)`**: Must be the physical pivot/center of mass of the ship.
- **Bounding Box**: Maximum span is `[-35, +35]` on X and `[-32, +32]` on Y.
- **Collision Radius**: Player collision hitbox is fixed at `radius = 18`. Changing visual scale does **NOT** alter the collision hitbox.
- **Texture Generation**: Always specify `resolution: 2` to preserve razor-sharp vector contours under scaling, rotation, and high-DPI displays.

---

## 2. THE 5-LAYER HIERARCHICAL DRAWING FORMULA

Every ship must follow this 5-layer pipeline to ensure 100% silhouette readability against intense blooms, neon lasers, and starfield backgrounds:

```
[Layer 5] Kokpit / Kanopi & Specular Yansıma (Emissive glass, pure white reflection slit)
[Layer 4] İtici Nozzle Yuvaları & Akkor İtici Çekirdekleri (Twin/quad engines + white heat core)
[Layer 3] 3D Metalik Pah & Speküler Işık Hatları (1.6 - 2.2px specular rim highlights)
[Layer 2] Gövde & Zırh Plakaları (Vibrant primary hull plating with accent lineStyle)
[Layer 1] Koyu Dış Hat / Karbon Şasi (Dark carbon base: 0x020617 / 2.8px black outline)
```

### Layer Details:
1. **Layer 1 - Dark Carbon Base & Outline (Kontrast Şasisi)**:
   - Base fill: `0x020617` (near black deep carbon).
   - Line style: `lineStyle(2.8, 0x000000, 1.0)`.
   - Purpose: Separates the ship from bright backgrounds, nebulas, and explosions.
2. **Layer 2 - Vibrant Hull Plating (Metalik Zırh)**:
   - Primary class color theme (e.g. Cobalt `0x091b2e` + Cyan `0x00f3ff`).
   - Line style: `lineStyle(2.0, primaryColor, 1.0)`.
3. **Layer 3 - Specular Rim Highlights (3D Pah Çizgileri)**:
   - High-contrast highlight lines: `lineStyle(2.0, 0xe0f2fe, 0.95)`.
   - Accent bevels along the leading wing edges and fuselage spine.
4. **Layer 4 - Thruster Ports & Exhaust Cores (İtici Nozulları)**:
   - Rectangles placed along the rear `[-20 to -24]` edge.
   - Outer glow color + inner white hot spot (`0xffffff`).
   - Serves as the emitter origin for `TrailFXManager` GPU particle ribbons.
5. **Layer 5 - Cockpit Canopy (Kanopi Camı)**:
   - Diamond or sleek hexagonal polygon on the forward fuselage.
   - Bright emissive fill + directional white specular glare slit (`lineStyle(1.6, 0xffffff, 1.0)`).

---

## 3. SHIP ROSTER & CLASS SPECIFICATIONS

| Ship ID | Class Name | Combat Role | Primary Color | Canopy Color | Speed Mod | HP Mod | Shield Mod | Crit Mod | Passive Ability |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `interceptor` | **INTERCEPTOR** | Seri Avcı (Supersonic) | `#00f3ff` (Cyan) | `#ff007f` (Pink) | `1.25x` | `0.80x` (80 HP) | `1.0x` (50 Shld) | `+15%` | `bullet_deflect` (Mermi saptırma) |
| `titan` | **TITAN** | Ağır Kruvazör (Dreadnought)| `#ffb300` (Gold) | `#00f3ff` (Cyan) | `0.85x` | `1.60x` (160 HP)| `1.5x` (75 Shld) | `0%` | `shield_emp` (Kalkan EMP patlaması) |
| `spectre` | **SPECTRE** | Siber Hacker (Stealth) | `#bd00ff` (Void Purple)| `#00ffcc` (Mint) | `1.05x` | `1.00x` (100 HP)| `1.1x` (55 Shld) | `+5%` | `drone_hacker` (Düşman hackleme) |

### Key Code Reference Points:
- Class stats definition: `index.html` ~Line `3,844` (`const SHIP_CLASSES = { ... }`).
- Texture creation: `index.html` ~Line `3,080 - 3,203` inside `initPixiTextures()`.
- Player entity initialization: `index.html` ~Line `6,804 - 6,835` in `Player.reset()`.

---

## 4. SHIELD VISUAL ARCHITECTURE (ANTI-BLINDING FORMULA)

Shields in ZORTEX are rendered on a dedicated `shipShieldLayer` with `blendMode = 'add'`, strictly isolated from `shipBodyLayer`:

1. **`shield_bubble` (Hollow Corona)**:
   - **Critical Rule**: Center region `(0 - 30px)` is **100% EMPTY/TRANSPARENT**.
   - Outer rim `(32 - 42px)` uses soft sine-distributed faint rings (`alpha <= 0.18`).
   - Outer glow edge at `r = 41` with `alpha = 0.35`.
   - Result: Player ship body and silhouette are 100% visible even at maximum 100/100 shield.
2. **`shield_ring` (Hexagonal Energy Field)**:
   - Radius: `40px` with 6 equidistant node emitter circles.
   - Rotates continuously with `rotation += delta * 0.02`.
   - Node hotspots: inner white core (`0xffffff`) surrounded by cyan (`0x00f3ff`).

---

## 5. ENEMY VISUAL TIER HIERARCHY

| Enemy Type | Sprite Texture ID | Silhouette Concept | Primary Color Palette | Scale / Size | Behavior Style |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Scout** | `enemy_scout` | Çift kanatlı avcı | Koyu titan + Nar kırmızısı (`0x9f1239`) | ~44x32px | Hızlı yaklaşım, doğrudan kovalama |
| **Swarm** | `enemy_fast` | Küçük sivri iğne | Neon Sarı / Amber (`0xfacc15`) | ~28x22px | Sürü halinde kanat akınları |
| **Kamikaze** | `enemy_kamikaze` | Yarı saydam bıçak | Akkor Turuncu (`0xf97316`) | ~36x30px | Çarpışma rotası, patlama uyarısı |
| **Phantom** | `enemy_phantom` | Faz kaymalı hayalet | Siber Mor / Magenta (`0xa855f7`) | ~48x40px | Kısa ışınlanma (teleport/flicker) |
| **Shooter** | `enemy_shooter` | Topçu taret şasisi | Elektrik Mavisi (`0x0284c7`) | ~52x44px | Uzak menzil hedefli mermi |
| **Aegis Heavy**| `enemy_heavy` | Ağır zırhlı kalkanlı | Zümrüt Yeşili / Çelik (`0x059669`) | ~68x60px | Yüksek HP, ön cephe siperi |
| **Boss** | `enemy_boss` | Çok kademeli amiral | Koyu Obsidyen + Plazma Kırmızısı | ~140x120px | Dönen lazerler, dalga mermileri |

---

## 6. HOW TO ADD OR REDESIGN A SHIP (RECIPE)

1. **Draw the Vector Texture**: Add procedural drawing in `initPixiTextures()` under `// 5. Oyuncu Gemi Dokuları`. Follow the 5-layer formula.
2. **Bake Texture**: Call `app.renderer.generateTexture({ target: graphicsObj, resolution: 2 })`.
3. **Add to Stats**: Add the entry in `SHIP_CLASSES` with `speedMod`, `hpMod`, `shieldMod`, `critMod`, and `passive`.
4. **Register Getter**: Update `getShipTexture(classId)` to return the new texture.
5. **Update Map**: Run `node scripts/update_codebase_map.mjs` to keep documentation and line numbers 100% synchronized.
