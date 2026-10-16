# ZORTEX: CYBER SURVIVOR - GAMEPLAY SYSTEMS & BALANCE

> **TOKEN OPTIMIZATION POLICY**: Consult this file when modifying weapons, enemy AI, wave progression, damage formulas, or relics. Avoid loading rendering or shader code into the context window.

---

## 1. WEAPON ARCHITECTURE & EVOLUTIONS

Player weapons derive from `WeaponBase` and are managed by `WeaponManager`. Active weapon slot selection is bound to keys `[1 - 4]`.

| Base Weapon | Class Name | Attack Profile | Base Stats / Formula |
| :--- | :--- | :--- | :--- |
| **Blaster** | `BlasterWeapon` | Rapid single-target laser bolts | CD: 0.18s, Dmg: 18, Speed: 950 px/s, Count: 1 (+projectiles) |
| **Spread Shot** | `SpreadShotWeapon` | Multi-projectile shotgun spread | CD: 0.55s, Dmg: 14/pellet, Arc: 35 deg, Count: 5 |
| **Plasma Beam** | `PlasmaBeamWeapon` | Continuous penetrating linear beam | Tick: 0.08s, Dmg: 8/tick, Piercing: 100%, Width: 18px |
| **Railgun** | `RailgunWeapon` | High-damage piercing kinetic bolt | CD: 1.20s, Dmg: 110, Speed: 1800 px/s, Penetration: 6 targets |

### The 4 Weapon Evolutions (Synergy Unlocks)
Evolutions trigger when a weapon reaches Level 8 and its synergistic passive upgrade is acquired. Triggers `WeaponEvolutionCinematicManager` (0.12s hit-stop, screen flash, shockwave, HUD banner).

| Evolution Key | Source Weapon | Synergy Requirement | Theme Color | Mechanical Enhancement |
| :--- | :--- | :--- | :--- | :--- |
| **`gatling_laser`** | `BlasterWeapon` | Multi-Shot / Overdrive | Cyan / Gold (`0x00f3ff` / `0xffe600`) | High-RPM twin continuous beam, dynamic spool-up, `1/sqrt(n)` scaling. |
| **`glacier_lance`** | `PlasmaBeamWeapon` | Frost Core / Cryo Plating | Ice Blue (`0x38bdf8`) | Penetrating freeze ray, 45% enemy slow, shatter explosions on kill. |
| **`thunder_tempest`** | `RailgunWeapon` | Overcharge Capacitor | Electric Purple (`0xa855f7`) | Railgun hits trigger branching chain lightning to 4 nearby enemies. |
| **`supernova_core`** | `SpreadShotWeapon` | Thermal Dispersion Unit | Solar Amber (`0xf97316`) | Pellets become micro-supernovas detonating on impact with AOE burn. |

---

## 2. ENEMY CLASSES & AI BEHAVIOR

All enemies derive from `EnemyBase` and register per-frame into `SpatialGrid` for $O(1)$ proximity queries.

| Enemy Type | Class Name | Base HP | Speed | Movement & Behavior Pattern | Special Mechanics |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Scout** | `Enemy` | 35 | 165 px/s | Direct player chase with shortest-arc angle turning (`maxTurnSpeed = 8.0 * dt`). | Drops standard XP gem. |
| **Swarm Drone** | `SwarmDroneEnemy` | 14 | 220 px/s | Flocking behavior in clusters of 6-12. Low HP, high numbers. | Vulnerable to AOE and piercing. |
| **Kamikaze** | `KamikazeEnemy` | 40 | 280 px/s | Accelerating charge; beeps and flashes red within 120px, then self-destructs. | AOE explosion damages player and nearby foes. |
| **Phantom** | `PhantomEnemy` | 75 | 140 px/s | Erratic zig-zag movement. On hit (%35 chance): **120ms slide** with purple afterimage. | Cooldown: 0.6s. Eliminates teleport strobe jitter. |
| **Aegis Heavy** | `AegisHeavyEnemy` | 240 | 85 px/s | Slow tank unit. Frontal 120-degree directional energy shield absorbs damage. | Flanking or high-penetration required. |
| **Boss** | `BossEnemy` | 3200+ | 70 px/s | Multi-stage boss. Revolving laser turrets, radial bullet curtains, summon waves. | Defeat triggers large shockwave, relic, and wave clear. |

---

## 3. COMBAT & DAMAGE TICK FORMULAS

### A. Damage Calculation
```js
// Base Damage Output
const effectiveDamage = (weaponBaseDamage + player.bonusDamage) * 
                        (player.isOverdrive ? 1.5 : 1.0) * 
                        (player.critRoll() ? player.critMultiplier : 1.0);

// Enemy Damage Processing
enemy.hp -= effectiveDamage;
enemy.flashTimer = 0.08; // Flash red
TextManager.add(enemy.x, enemy.y, Math.round(effectiveDamage), isCrit);
```

### B. Gatling Laser Damage Tick (Sync)
- **Tick Interval**: `0.08s` (12.5 ticks/second).
- **Proximity**: Tested via `distToSegment(enemy.x, enemy.y, beamStartX, beamStartY, beamEndX, beamEndY)`.
- **FX Sync**: Every successful tick spawns pooled sparks (`particles.emit`) and micro point light bursts (`ZortexFX.lights`).

---

## 4. WAVE PROGRESSION & SPAWN CURVES
Managed by `WaveManager` (`index.html: ~L9578 - L9691`):
- **Wave Duration**: 60 seconds per wave.
- **Spawn Interval**: Decreases from `1.2s` (Wave 1) to `0.18s` (Wave 6+).
- **Elite Spawns**: Chance scales: $P(\text{elite}) = \min(0.05 + (\text{wave} \times 0.025), 0.35)$. Elites carry 3x HP, 1.3x size, and drop rare scrap.
- **Boss Waves**: Wave 5 and Wave 10 trigger dedicated boss encounters with locked arena borders.
