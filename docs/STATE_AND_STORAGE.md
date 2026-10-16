# ZORTEX: CYBER SURVIVOR - STATE, STORAGE & PROFILES

> **TOKEN OPTIMIZATION POLICY**: Consult this file when modifying save data, player profiles, meta upgrades, settings, or localStorage schemas. Avoid loading render pipelines or gameplay collision code into the context window.

---

## 1. STORAGE KEYS & PERSISTENCE ARCHITECTURE

All state persistence is managed via browser `localStorage` with automated migration from legacy single-profile schemas to multi-profile schemas:

| Storage Key | Type | Description & Purpose |
| :--- | :--- | :--- |
| **`zortex_profiles`** | `JSON Object` | Primary multi-profile database containing all player profiles, meta currencies, hangar levels, tech trees, and stats. |
| **`zortex_active_profile`**| `String` | Currently selected profile name (defaults to `'Ajan Alpha'`). |
| **`zortex_settings`** | `JSON Object` | Global game settings: audio volumes, graphics quality tier, CRT toggle, reduceFlashing, gamepad binds. |
| **`zortex_meta`** *(Legacy)*| `JSON Object` | Legacy single-user hangar upgrades and scrap balance (auto-migrated into default profile on load). |
| **`zortex_highscore`** *(Legacy)*| `Number` | Legacy high score (migrated into active profile). |
| **`zortex_ship`** *(Legacy)* | `String` | Legacy selected ship id (migrated into active profile). |

---

## 2. PROFILE DATA SCHEMA

Each profile in `zortex_profiles[profileName]` conforms to the following schema:

```json
{
  "name": "Ajan Alpha",
  "meta": {
    "scrap": 1450,
    "levels": {
      "hull": 3,
      "shield": 2,
      "engine": 4,
      "weaponPower": 2,
      "scrapMagnet": 1
    },
    "achievements": {
      "first_blood": true,
      "wave_5_survivor": true,
      "gatling_evolution": true
    },
    "techTree": {
      "node_laser_focus": 1,
      "node_shield_recharge": 2
    },
    "techPoints": 4,
    "totalTechPointsEarned": 12
  },
  "highScore": 48200,
  "selectedShip": "interceptor",
  "createdAt": 1728421000000,
  "lastPlayed": 1728512000000
}
```

---

## 3. GLOBAL GAME SETTINGS SCHEMA (`zortex_settings`)

```json
{
  "sfxVolume": 0.8,
  "musicVolume": 0.6,
  "graphicsQuality": "high",
  "crtEnabled": false,
  "reduceFlashing": false,
  "gamepadRumble": true,
  "damageNumbers": true,
  "screenShake": 1.0
}
```

### Critical Accessibility Note
- **`reduceFlashing`**: When `true`, all fullscreen flashes (including weapon evolution cinematics, boss death flashes, and low-health strobe) must drop intensity by at least 80% or be replaced with static soft fade transitions.

---

## 4. SHIP CLASSES & CONFIGURATION

The player can select from 3 ship classes (`selectedShip`):

| Ship ID | Class Name | Base Speed | Hit Radius | Base HP / Shield | Weapon Affinity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`interceptor`** | Interceptor | 340 px/s | 18 px | 100 HP / 50 Shield | Balanced; high projectile speed & agility. |
| **`titan`** | Titan Cruiser | 260 px/s | 24 px | 180 HP / 120 Shield | Heavy armor; bonus spread shot pellet count. |
| **`spectre`** | Spectre Infiltrator | 390 px/s | 16 px | 75 HP / 35 Shield | Stealth & speed; high crit rate and longer dash. |
