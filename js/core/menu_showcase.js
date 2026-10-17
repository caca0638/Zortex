/**
 * ============================================================================
 * ZORTEX: CYBER SURVIVOR - SEAMLESS CINEMATIC MENU SHOWCASE
 * Module: js/core/menu_showcase.js
 * Architecture:
 *   - Edge-to-edge cinematic deep-space cosmos with procedural celestial planet
 *   - Soft atmospheric nebula glows & multi-depth parallax starfield
 *   - Commanding hero ship showcase with volumetric ion thrusters & telemetry
 *   - 3D-shaded crystal-veined asteroids with realistic shatter & scrap bonus
 *   - Zero UI clutter, zero tutorial badges, seamless left-dock integration
 * ============================================================================
 */
(function() {
  'use strict';

  class MenuShowcaseEngine {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.width = 0;
      this.height = 0;
      this.dpr = 1;

      this.shipClassId = 'interceptor';
      this.time = 0;

      this.mouse = { x: -1000, y: -1000, isHovering: false };
      this.lockedAsteroid = null;

      // Entities
      this.asteroids = [];
      this.explosions = [];
      this.particles = [];
      this.shockwaves = [];
      this.floatingTexts = [];
      this.starDust = [];
      this.thrusterParticles = [];
      this.showcaseProjectiles = [];

      // Sol Menü Buton Hover Durumu (Seçenek 1: Butonlara Duyarlı Canlı Sahne)
      this.hoveredMenuAction = null;
      this.hoverBoostStart = 0;
      this.hoverBoostHangar = 0;
      this.hoverBoostChips = 0;
      this.hoverBoostCodex = 0;

      // Canlı Gemi Etkileşimi & Manevra Durumu (Seçenek 3)
      this.shipCenterX = 0;
      this.shipCenterY = 0;
      this.shipCurrentAngle = -Math.PI / 6;
      this.shipManeuverTimer = 0;
      this.shipManeuverDuration = 0.85;
      this.isHoveringShip = false;
      this.drones = [
        { orbitPhase: 0.0, orbitRadiusX: 92, orbitRadiusY: 34, tilt: -0.28, speed: 1.55, scanTimer: 0 },
        { orbitPhase: Math.PI, orbitRadiusX: 108, orbitRadiusY: 38, tilt: 0.18, speed: -1.25, scanTimer: 1.2 }
      ];

      this.planetX = null;
      this.planetY = null;

      // 3B Sanal İztopu (Virtual Trackball / Google Earth) Yönelim Matrisi & Açısal Momentum
      this.planetRotMat = this.createRotMatrixFromEuler(0.38, 0.0, -0.32);
      this.planetAngVel = [0, 0, 0];
      this.dragStartVec = null;
      this.dragLastPos = null;

      this.planetRingDashOffset = 0.0;
      this.isDraggingPlanet = false;
      this.dragLastMoveTime = 0;

      this.isInitialized = false;
    }

    createRotMatrixFromEuler(pitch, yaw, roll) {
      const cx = Math.cos(pitch), sx = Math.sin(pitch);
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      const cz = Math.cos(roll), sz = Math.sin(roll);

      const m00 = cz * cy - sz * sx * (-sy);
      const m01 = -sz * cx;
      const m02 = cz * sy - sz * sx * cy;

      const m10 = sz * cy + cz * sx * (-sy);
      const m11 = cz * cx;
      const m12 = sz * sy + cz * sx * cy;

      const m20 = -cx * (-sy);
      const m21 = sx;
      const m22 = cx * cy;

      return new Float32Array([
        m00, m10, m20,
        m01, m11, m21,
        m02, m12, m22
      ]);
    }

    orthonormalizeRotMat() {
      const m = this.planetRotMat;
      let c0x = m[0], c0y = m[1], c0z = m[2];
      let l0 = Math.hypot(c0x, c0y, c0z) || 1;
      c0x /= l0; c0y /= l0; c0z /= l0;

      let c1x = m[3], c1y = m[4], c1z = m[5];
      let dot01 = c0x * c1x + c0y * c1y + c0z * c1z;
      c1x -= dot01 * c0x; c1y -= dot01 * c0y; c1z -= dot01 * c0z;
      let l1 = Math.hypot(c1x, c1y, c1z) || 1;
      c1x /= l1; c1y /= l1; c1z /= l1;

      let c2x = c0y * c1z - c0z * c1y;
      let c2y = c0z * c1x - c0x * c1z;
      let c2z = c0x * c1y - c0y * c1x;

      m[0] = c0x; m[1] = c0y; m[2] = c0z;
      m[3] = c1x; m[4] = c1y; m[5] = c1z;
      m[6] = c2x; m[7] = c2y; m[8] = c2z;
    }

    applyAxisAngleRotation(ux, uy, uz, angle) {
      if (Math.abs(angle) < 1e-7) return;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const t = 1.0 - c;

      const d00 = t*ux*ux + c,     d01 = t*ux*uy - s*uz, d02 = t*ux*uz + s*uy;
      const d10 = t*ux*uy + s*uz, d11 = t*uy*uy + c,     d12 = t*uy*uz - s*ux;
      const d20 = t*ux*uz - s*uy, d21 = t*uy*uz + s*ux, d22 = t*uz*uz + c;

      const m = this.planetRotMat;
      const r00 = d00*m[0] + d01*m[1] + d02*m[2];
      const r10 = d10*m[0] + d11*m[1] + d12*m[2];
      const r20 = d20*m[0] + d21*m[1] + d22*m[2];

      const r01 = d00*m[3] + d01*m[4] + d02*m[5];
      const r11 = d10*m[3] + d11*m[4] + d12*m[5];
      const r21 = d20*m[3] + d21*m[4] + d22*m[5];

      const r02 = d00*m[6] + d01*m[7] + d02*m[8];
      const r12 = d10*m[6] + d11*m[7] + d12*m[8];
      const r22 = d20*m[6] + d21*m[7] + d22*m[8];

      m[0] = r00; m[1] = r10; m[2] = r20;
      m[3] = r01; m[4] = r11; m[5] = r21;
      m[6] = r02; m[7] = r12; m[8] = r22;
      this.orthonormalizeRotMat();
    }

    projectToTrackball(x, y, pr) {
      const px = (x - this.planetX) / pr;
      const py = (y - this.planetY) / pr;
      const d2 = px * px + py * py;
      if (d2 <= 1.0) {
        return [px, py, Math.sqrt(1.0 - d2)];
      } else {
        const d = Math.sqrt(d2);
        return [px / d, py / d, 0.0];
      }
    }

    // Geriye dönük uyumluluk erişimcileri
    get planetRotX() { return Math.asin(Math.max(-1, Math.min(1, this.planetRotMat[7]))); }
    set planetRotX(v) { this.planetRotMat = this.createRotMatrixFromEuler(v, this.planetRotY, this.planetRotZ); }
    get planetRotY() { return Math.atan2(this.planetRotMat[6], this.planetRotMat[8]); }
    set planetRotY(v) { this.planetRotMat = this.createRotMatrixFromEuler(this.planetRotX, v, this.planetRotZ); }
    get planetRotZ() { return Math.atan2(-this.planetRotMat[1], this.planetRotMat[4]); }
    set planetRotZ(v) { this.planetRotMat = this.createRotMatrixFromEuler(this.planetRotX, this.planetRotY, v); }
    get planetVelX() { return this.planetAngVel[0]; }
    set planetVelX(v) { this.planetAngVel[0] = v; }
    get planetVelY() { return this.planetAngVel[1]; }
    set planetVelY(v) { this.planetAngVel[1] = v; }
    get planetVelZ() { return this.planetAngVel[2]; }
    set planetVelZ(v) { this.planetAngVel[2] = v; }
    get planetRingTilt() { return this.planetRotZ; }
    set planetRingTilt(v) { this.planetRotZ = v; }
    get planetSpinAngle() { return this.planetRotY; }
    set planetSpinAngle(v) { this.planetRotY = v; }
    get planetSpinVelocity() { return this.planetVelY; }
    set planetSpinVelocity(v) { this.planetVelY = v; }
    get planetRingAngularVelocity() { return this.planetVelZ; }
    set planetRingAngularVelocity(v) { this.planetVelZ = v; }

    init() {
      this.canvas = document.getElementById('menuShowcaseCanvas');
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d', { alpha: false });
      this.dpr = Math.min(2, window.devicePixelRatio || 1);

      this.handleResize();
      window.addEventListener('resize', () => this.handleResize());

      // Pointer interactions
      this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
      this.canvas.addEventListener('pointerleave', () => this.onPointerLeave());
      this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
      window.addEventListener('pointerup', (e) => this.onPointerUp(e));
      window.addEventListener('pointercancel', (e) => this.onPointerUp(e));

      // Star dust initialization
      this.initStarDust();

      // Asteroid population
      this.initAsteroids();

      // True 3D WebGL Planet initialization
      this.initPlanet3DWebGL();

      // Sol menü düğmelerine duyarlı sahne etkileşimleri (Seçenek 1)
      this.bindMenuDockInteractions();

      this.isInitialized = true;
    }

    bindMenuDockInteractions() {
      const buttonMap = [
        { id: 'startBtn', action: 'start' },
        { id: 'neuralMatrixBtn', action: 'chips' },
        { id: 'hangarBtn', action: 'hangar' },
        { id: 'codexBtn', action: 'codex' },
        { id: 'techTreeBtn', action: 'tech' },
        { id: 'achievementsBtn', action: 'achievements' },
        { id: 'heatLevelBtn', action: 'heat' }
      ];

      for (const item of buttonMap) {
        const el = document.getElementById(item.id);
        if (!el || el._showcaseBound) continue;
        el._showcaseBound = true;
        el.addEventListener('pointerenter', () => {
          this.hoveredMenuAction = item.action;
        });
        el.addEventListener('pointerleave', () => {
          if (this.hoveredMenuAction === item.action) {
            this.hoveredMenuAction = null;
          }
        });
        el.addEventListener('focus', () => {
          this.hoveredMenuAction = item.action;
        });
        el.addEventListener('blur', () => {
          if (this.hoveredMenuAction === item.action) {
            this.hoveredMenuAction = null;
          }
        });
      }
    }

    getProgressionContext() {
      const mp = window.ZortexMetaProgression;
      const mpState = (mp && typeof mp.getState === 'function') ? mp.getState() : null;
      const shipClass = (mpState && mpState.selectedShip)
        ? mpState.selectedShip
        : ((typeof selectedShipClass !== 'undefined' && selectedShipClass) ? selectedShipClass : this.shipClassId);

      const shipPalette = {
        interceptor: { primary: '#00f3ff', secondary: '#0077ff', rgb: [0, 243, 255] },
        titan:       { primary: '#ffaa00', secondary: '#ff5500', rgb: [255, 170, 0] },
        spectre:     { primary: '#c084fc', secondary: '#9333ea', rgb: [192, 132, 252] },
        viper:       { primary: '#10b981', secondary: '#059669', rgb: [16, 185, 129] },
        valkyrie:    { primary: '#f43f5e', secondary: '#e11d48', rgb: [244, 63, 94] }
      };

      let shipColor = '#00f3ff';
      if (mp && mp.SHIPS_CATALOG && mp.SHIPS_CATALOG[shipClass] && mp.SHIPS_CATALOG[shipClass].color) {
        shipColor = mp.SHIPS_CATALOG[shipClass].color;
      } else if (typeof SHIP_CLASSES !== 'undefined' && SHIP_CLASSES[shipClass] && SHIP_CLASSES[shipClass].color) {
        shipColor = SHIP_CLASSES[shipClass].color;
      } else if (shipPalette[shipClass]) {
        shipColor = shipPalette[shipClass].primary;
      }

      const pal = shipPalette[shipClass] || { primary: shipColor, secondary: '#0088ff', rgb: [0, 243, 255] };

      // Aktif nöral yongaları oku
      const activeChips = [];
      const branchColors = {
        offense: '#ff0055',
        defense: '#00f3ff',
        utility: '#fbbf24'
      };
      if (mpState && mpState.equippedChips) {
        for (const branch of ['offense', 'defense', 'utility']) {
          const slots = mpState.equippedChips[branch];
          if (Array.isArray(slots)) {
            for (let t = 0; t < slots.length; t++) {
              if (slots[t]) {
                activeChips.push({
                  id: slots[t],
                  branch: branch,
                  tier: t + 1,
                  color: branchColors[branch] || '#00f3ff'
                });
              }
            }
          }
        }
      }

      // Aktif Siber Tehlike (Heat) kademesini oku
      const gm = window.ZortexGameModes;
      const heatObj = (gm && gm.currentHeat) ? gm.currentHeat : { level: 0, color: '#00f3ff', badge: 'NORMAL' };

      return {
        shipClass,
        shipColor: pal.primary,
        shipSecondary: pal.secondary,
        shipRgb: pal.rgb,
        activeChips,
        heatLevel: heatObj.level || 0,
        heatColor: heatObj.color || '#00f3ff'
      };
    }

    isPointOnShip(x, y) {
      const sx = this.shipCenterX || (this.width > 960 ? this.width * 0.66 : this.width * 0.50);
      const sy = this.shipCenterY || (this.height * 0.52);
      if (!sx || !sy) return false;
      const dist = Math.hypot(x - sx, y - sy);
      return dist <= 72;
    }

    triggerShipManeuver() {
      this.ensureAudio();
      this.shipManeuverTimer = this.shipManeuverDuration;
      const prog = this.getProgressionContext();
      const sx = this.shipCenterX || (this.width > 960 ? this.width * 0.66 : this.width * 0.50);
      const sy = this.shipCenterY || (this.height * 0.52);
      const ang = this.shipCurrentAngle || (-Math.PI / 6);

      if (window.audio) {
        if (typeof window.audio.playLaser === 'function') window.audio.playLaser(1.15, sx, sy);
        if (typeof window.audio.playZap === 'function') window.audio.playZap(sx, sy);
      }

      // Afterburner halka şok dalgası
      this.shockwaves.push({
        x: sx - Math.cos(ang) * 32,
        y: sy - Math.sin(ang) * 32,
        radius: 10,
        maxRadius: 95,
        color: prog.shipColor,
        life: 0.42,
        maxLife: 0.42
      });

      // Gemi namlularından 3'lü siber plazma salvosu ateşle
      const spreadAngles = [-0.12, 0, 0.12];
      const noseX = sx + Math.cos(ang) * 44;
      const noseY = sy + Math.sin(ang) * 44;

      for (let i = 0; i < spreadAngles.length; i++) {
        const fireAng = ang + spreadAngles[i];
        const spd = 620 + (i === 1 ? 80 : 0);
        this.showcaseProjectiles.push({
          x: noseX + Math.cos(ang + Math.PI / 2) * (i - 1) * 14,
          y: noseY + Math.sin(ang + Math.PI / 2) * (i - 1) * 14,
          vx: Math.cos(fireAng) * spd,
          vy: Math.sin(fireAng) * spd,
          angle: fireAng,
          color: i === 1 ? '#ffffff' : prog.shipColor,
          glowColor: prog.shipColor,
          life: 1.2,
          maxLife: 1.2
        });
      }

      // Namludan çıkan kıvılcımlar
      for (let i = 0; i < 14; i++) {
        const pAng = ang + (Math.random() - 0.5) * 0.9;
        const pSpd = 90 + Math.random() * 180;
        this.particles.push({
          x: noseX,
          y: noseY,
          vx: Math.cos(pAng) * pSpd,
          vy: Math.sin(pAng) * pSpd,
          color: Math.random() < 0.5 ? '#ffffff' : prog.shipColor,
          size: 2 + Math.random() * 2,
          life: 0.30,
          maxLife: 0.30
        });
      }
    }

    initPlanet3DWebGL() {
      try {
        this.planetCanvas3D = document.createElement('canvas');
        this.planetCanvas3D.width = 512;
        this.planetCanvas3D.height = 512;
        const gl = this.planetCanvas3D.getContext('webgl', {
          alpha: true,
          antialias: true,
          premultipliedAlpha: false
        }) || this.planetCanvas3D.getContext('experimental-webgl');

        if (!gl) {
          this.gl3d = null;
          return;
        }

        const vsSource = `
          attribute vec2 a_pos;
          varying vec2 v_uv;
          void main() {
            v_uv = a_pos;
            gl_Position = vec4(a_pos, 0.0, 1.0);
          }
        `;

        const fsSource = `
          precision mediump float;
          varying vec2 v_uv;
          uniform mat3 u_rotMatrix;
          uniform vec3 u_lightDir;
          uniform float u_time;
          uniform float u_ringDash;

          const float R_SPHERE = 0.34;
          const float R_RING_IN = 0.44;
          const float R_RING_OUT = 0.84;

          vec3 toLocal(vec3 v, mat3 R) {
            return vec3(dot(R[0], v), dot(R[1], v), dot(R[2], v));
          }

          void main() {
            vec2 uv = v_uv;
            mat3 R = u_rotMatrix;

            float d2 = dot(uv, uv);
            bool hitSphere = (d2 <= R_SPHERE * R_SPHERE);
            float zSphere = hitSphere ? sqrt(R_SPHERE * R_SPHERE - d2) : -10.0;

            // Ring Normal in world space
            vec3 nRingWorld = R * vec3(0.0, 1.0, 0.0);
            
            bool hitRing = false;
            float zRing = -10.0;
            vec3 ringColor = vec3(0.0);
            float ringAlpha = 0.0;

            if (abs(nRingWorld.z) > 1e-4) {
              zRing = -(uv.x * nRingWorld.x + uv.y * nRingWorld.y) / nRingWorld.z;
              vec3 pRingWorld = vec3(uv.x, uv.y, zRing);
              vec3 pRingLoc = toLocal(pRingWorld, R);
              float rRing = length(pRingLoc.xz);

              if (rRing >= R_RING_IN && rRing <= R_RING_OUT) {
                float rNorm = (rRing - R_RING_IN) / (R_RING_OUT - R_RING_IN);
                
                // Cassini division gap
                bool isCassini = (rNorm >= 0.48 && rNorm <= 0.52);
                if (!isCassini) {
                  hitRing = true;
                  // Shimmer and bands
                  float band = 0.70 + 0.30 * sin(rNorm * 70.0) + 0.15 * sin(rNorm * 200.0);
                  float angle = atan(pRingLoc.z, pRingLoc.x);
                  float dash = sin(angle * 14.0 - u_ringDash) * 0.10;

                  vec3 cInner = vec3(0.98, 0.72, 0.18);
                  vec3 cMid   = vec3(0.92, 0.36, 0.08);
                  vec3 cOuter = vec3(0.85, 0.18, 0.12);
                  vec3 rCol = mix(cInner, cMid, smoothstep(0.0, 0.5, rNorm));
                  rCol = mix(rCol, cOuter, smoothstep(0.5, 1.0, rNorm));
                  rCol *= (band + dash);

                  // Sunlight on ring
                  float ringLit = abs(dot(nRingWorld, u_lightDir)) * 0.60 + 0.40;

                  // Sphere shadow on ring
                  float tClosest = -dot(pRingWorld, u_lightDir);
                  if (tClosest > 0.0) {
                    vec3 dVec = pRingWorld + tClosest * u_lightDir;
                    if (length(dVec) < R_SPHERE * 1.02) {
                      ringLit *= 0.10; // Dark planetary shadow across rings!
                    }
                  }

                  ringColor = rCol * ringLit;
                  float edgeAlpha = smoothstep(0.0, 0.06, rNorm) * smoothstep(1.0, 0.94, rNorm);
                  ringAlpha = clamp(edgeAlpha * 0.75, 0.0, 1.0);
                }
              }
            }

            // Sphere color & lighting
            vec3 sphereColor = vec3(0.0);
            if (hitSphere) {
              vec3 pSphWorld = vec3(uv.x, uv.y, zSphere);
              vec3 nSphWorld = pSphWorld / R_SPHERE;
              vec3 pSphLoc = toLocal(pSphWorld, R);
              vec3 nSphLoc = pSphLoc / R_SPHERE;

              float lat = clamp(nSphLoc.y, -1.0, 1.0);
              float lon = atan(nSphLoc.x, nSphLoc.z);

              // Atmospheric Bands
              float b1 = sin(lat * 18.0 + sin(lat * 35.0) * 0.35);
              float b2 = cos(lat * 9.0 + 0.6);
              float poleFade = smoothstep(1.0, 0.82, abs(lat));
              float turb = sin(lon * 8.0 + lat * 14.0 + u_time * 0.3) * cos(lon * 4.0 - lat * 16.0) * 0.18 * poleFade;
              float bandVal = clamp((b1 * 0.55 + b2 * 0.35 + turb + 1.0) * 0.5, 0.0, 1.0);

              vec3 cDark  = vec3(0.25, 0.04, 0.04);
              vec3 cMid1  = vec3(0.85, 0.22, 0.06);
              vec3 cMid2  = vec3(0.96, 0.60, 0.08);
              vec3 cLight = vec3(0.99, 0.92, 0.52);

              vec3 surfaceCol = mix(cDark, cMid1, smoothstep(0.0, 0.35, bandVal));
              surfaceCol = mix(surfaceCol, cMid2, smoothstep(0.35, 0.70, bandVal));
              surfaceCol = mix(surfaceCol, cLight, smoothstep(0.70, 1.0, bandVal));

              // The Great Solar Vortex (Red Spot)
              float lat0 = -0.15;
              float lon0 = 0.65;
              float dlon = mod(lon - lon0 + 3.14159, 6.28318) - 3.14159;
              float dlat = lat - lat0;
              float dStorm = sqrt(pow(dlon * 2.8, 2.0) + pow(dlat * 5.2, 2.0));
              if (dStorm < 1.0) {
                float eye = smoothstep(0.35, 0.0, dStorm);
                float rim = smoothstep(1.0, 0.4, dStorm);
                vec3 stormCol = mix(vec3(0.88, 0.11, 0.25), vec3(1.0, 0.92, 0.5), eye);
                surfaceCol = mix(surfaceCol, stormCol, rim * 0.85);
              }

              // Secondary White-Hot Cyclone
              float lat1 = 0.36;
              float lon1 = -2.10;
              float dlon1 = mod(lon - lon1 + 3.14159, 6.28318) - 3.14159;
              float dlat1 = lat - lat1;
              float dStorm1 = sqrt(pow(dlon1 * 3.4, 2.0) + pow(dlat1 * 6.5, 2.0));
              if (dStorm1 < 1.0) {
                float eye1 = smoothstep(0.4, 0.0, dStorm1);
                float rim1 = smoothstep(1.0, 0.3, dStorm1);
                vec3 stormCol1 = mix(vec3(0.95, 0.50, 0.1), vec3(1.0, 1.0, 0.8), eye1);
                surfaceCol = mix(surfaceCol, stormCol1, rim1 * 0.80);
              }

              // 3D Diffuse & Lighting
              float NdotL = dot(nSphWorld, u_lightDir);
              float diff = clamp((NdotL + 0.18) / 1.18, 0.0, 1.0);

              // Ring shadow on sphere
              if (abs(dot(u_lightDir, nRingWorld)) > 1e-4) {
                float tR = -dot(pSphWorld, nRingWorld) / dot(u_lightDir, nRingWorld);
                if (tR > 0.0) {
                  vec3 pHitR = toLocal(pSphWorld + tR * u_lightDir, R);
                  float rHit = length(pHitR.xz);
                  if (rHit >= R_RING_IN && rHit <= R_RING_OUT) {
                    float rN = (rHit - R_RING_IN) / (R_RING_OUT - R_RING_IN);
                    if (!(rN >= 0.48 && rN <= 0.52)) {
                      diff *= 0.18; // Crisp ring shadow on planet!
                    }
                  }
                }
              }

              // Specular Highlight
              vec3 vDir = vec3(0.0, 0.0, 1.0);
              vec3 hDir = normalize(u_lightDir + vDir);
              float spec = pow(clamp(dot(nSphWorld, hDir), 0.0, 1.0), 28.0) * 0.40;

              // Atmospheric Rim / Limb Glow
              float fresnel = pow(1.0 - clamp(nSphWorld.z, 0.0, 1.0), 2.5);
              vec3 rimGlow = vec3(1.0, 0.72, 0.30) * fresnel * (diff * 0.75 + 0.25);

              sphereColor = surfaceCol * (diff * 0.90 + 0.10) + spec + rimGlow;
            }

            // Depth Sorting & Composite
            if (hitSphere && hitRing) {
              if (zRing > zSphere) {
                gl_FragColor = vec4(mix(sphereColor, ringColor, ringAlpha), 1.0);
              } else {
                gl_FragColor = vec4(sphereColor, 1.0);
              }
            } else if (hitSphere) {
              gl_FragColor = vec4(sphereColor, 1.0);
            } else if (hitRing) {
              gl_FragColor = vec4(ringColor, ringAlpha);
            } else {
              // Atmospheric corona glow
              float dist = sqrt(d2);
              if (dist > R_SPHERE && dist < R_SPHERE * 1.45) {
                float haze = exp(-(dist - R_SPHERE) * 16.0) * 0.42;
                gl_FragColor = vec4(vec3(0.98, 0.62, 0.15) * haze, haze);
              } else {
                gl_FragColor = vec4(0.0);
              }
            }
          }
        `;

        const createShader = (type, src) => {
          const s = gl.createShader(type);
          gl.shaderSource(s, src);
          gl.compileShader(s);
          if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
          return s;
        };

        const vs = createShader(gl.VERTEX_SHADER, vsSource);
        const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
        if (!vs || !fs) {
          this.gl3d = null;
          return;
        }

        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
          this.gl3d = null;
          return;
        }

        gl.useProgram(prog);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          -1, -1,  1, -1, -1,  1,
          -1,  1,  1, -1,  1,  1
        ]), gl.STATIC_DRAW);

        const posLoc = gl.getAttribLocation(prog, 'a_pos');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        this.gl3d = gl;
        this.gl3dProg = prog;
        this.uRotMat3D = gl.getUniformLocation(prog, 'u_rotMatrix');
        this.uLightDir3D = gl.getUniformLocation(prog, 'u_lightDir');
        this.uTime3D = gl.getUniformLocation(prog, 'u_time');
        this.uRingDash3D = gl.getUniformLocation(prog, 'u_ringDash');

        const ld = [-0.65, -0.45, 0.60];
        const lLen = Math.hypot(ld[0], ld[1], ld[2]);
        gl.uniform3f(this.uLightDir3D, ld[0] / lLen, ld[1] / lLen, ld[2] / lLen);
      } catch (err) {
        this.gl3d = null;
      }
    }

    handleResize() {
      if (!this.canvas || !this.ctx) return;
      const w = window.innerWidth || 1280;
      const h = window.innerHeight || 720;
      if (w <= 0 || h <= 0) return;

      const wasZero = (this.width <= 0 || this.height <= 0);
      this.width = w;
      this.height = h;

      this.canvas.width = Math.floor(this.width * this.dpr);
      this.canvas.height = Math.floor(this.height * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      if (wasZero) {
        this.planetX = this.width * 0.82;
        this.planetY = this.height * 0.28;
        this.initStarDust();
        this.initAsteroids();
      }
    }

    setShip(shipId) {
      if (shipId) this.shipClassId = shipId;
    }

    initStarDust() {
      this.starDust = [];
      const count = 75;
      for (let i = 0; i < count; i++) {
        this.starDust.push({
          x: Math.random() * (this.width || 1280),
          y: Math.random() * (this.height || 720),
          speed: 12 + Math.random() * 40,
          size: 0.6 + Math.random() * 1.8,
          alpha: 0.15 + Math.random() * 0.75,
          color: Math.random() > 0.45 ? '#00f3ff' : (Math.random() > 0.5 ? '#ffffff' : '#c084fc')
        });
      }
    }

    createAsteroid(spawnOutside = false) {
      const radius = 22 + Math.random() * 26;
      let x = 0, y = 0;

      if (spawnOutside && this.width > 0 && this.height > 0) {
        if (Math.random() < 0.70) {
          x = this.width + radius + Math.random() * 80;
          y = Math.random() * this.height;
        } else {
          x = Math.random() * (this.width + 100);
          y = -radius - Math.random() * 80;
        }
      } else {
        x = Math.random() * (this.width || 1280);
        y = Math.random() * (this.height || 720);
      }

      // Procedural chunky rock geometry
      const numPts = 10 + Math.floor(Math.random() * 4);
      const vertices = [];
      for (let i = 0; i < numPts; i++) {
        const ang = (i / numPts) * Math.PI * 2;
        const dist = radius * (0.75 + Math.random() * 0.35);
        vertices.push({ x: Math.cos(ang) * dist, y: Math.sin(ang) * dist });
      }

      // Craters with shadows
      const numCraters = 2 + Math.floor(Math.random() * 3);
      const craters = [];
      for (let i = 0; i < numCraters; i++) {
        craters.push({
          x: (Math.random() - 0.5) * (radius * 0.75),
          y: (Math.random() - 0.5) * (radius * 0.75),
          r: 3 + Math.random() * (radius * 0.22)
        });
      }

      const isRare = Math.random() < 0.22;

      return {
        x: x,
        y: y,
        vx: -(14 + Math.random() * 26),
        vy: (Math.random() - 0.4) * 16,
        radius: radius,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.5,
        vertices: vertices,
        craters: craters,
        isRare: isRare,
        neonColor: isRare ? '#ff0055' : '#00f3ff',
        baseColorDark: isRare ? '#160a1e' : '#08111e',
        baseColorLight: isRare ? '#381640' : '#1e293b'
      };
    }

    initAsteroids() {
      this.asteroids = [];
      const count = 5;
      for (let i = 0; i < count; i++) {
        this.asteroids.push(this.createAsteroid(false));
      }
    }

    isPointOnPlanet(x, y) {
      if (this.planetX === null || this.planetY === null) return false;
      const pr = Math.min(135, Math.max(85, this.width * 0.115));
      const dx = x - this.planetX;
      const dy = y - this.planetY;
      const dist = Math.hypot(dx, dy);

      // Globe hit
      if (dist <= pr * 1.15) return true;

      // Ring hit (in rotated space with pitch flattening)
      const cosZ = Math.cos(-this.planetRotZ);
      const sinZ = Math.sin(-this.planetRotZ);
      const rx = dx * cosZ - dy * sinZ;
      const ry = dx * sinZ + dy * cosZ;
      const ringFlatten = Math.max(0.06, Math.abs(Math.sin(this.planetRotX)));
      const normR = Math.hypot(rx / (pr * 2.55), ry / Math.max(pr * 0.22, pr * 2.55 * ringFlatten));
      return normR >= 0.70 && normR <= 1.08;
    }

    startPlanetDrag(x, y) {
      this.isDraggingPlanet = true;
      const pr = Math.min(135, Math.max(85, this.width * 0.115));
      this.dragStartVec = this.projectToTrackball(x, y, pr);
      this.dragLastPos = { x, y };
      this.dragLastMoveTime = performance.now();
      this.planetAngVel = [0, 0, 0];

      if (this.canvas) {
        this.canvas.style.cursor = 'grabbing';
      }
    }

    onPointerMove(e) {
      if (!this.canvas) return;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.isHovering = true;

      if (this.isDraggingPlanet && this.planetX !== null && this.planetY !== null) {
        const x = e.clientX;
        const y = e.clientY;
        const pr = Math.min(135, Math.max(85, this.width * 0.115));
        const curVec = this.projectToTrackball(x, y, pr);
        const lastVec = this.dragStartVec || curVec;

        // Vektörel çapraz çarpım: lastVec x curVec Google Earth tarzı mutlak 3B dönüş eksenini verir
        const ax = lastVec[1] * curVec[2] - lastVec[2] * curVec[1];
        const ay = lastVec[2] * curVec[0] - lastVec[0] * curVec[2];
        const az = lastVec[0] * curVec[1] - lastVec[1] * curVec[0];
        const len = Math.hypot(ax, ay, az);

        const now = performance.now();
        const dtMove = Math.max(0.005, (now - (this.dragLastMoveTime || now)) / 1000);
        this.dragLastMoveTime = now;

        if (len > 1e-5) {
          const dot = Math.max(-1, Math.min(1, lastVec[0] * curVec[0] + lastVec[1] * curVec[1] + lastVec[2] * curVec[2]));
          const angle = Math.atan2(len, dot);
          const ux = ax / len, uy = ay / len, uz = az / len;

          this.applyAxisAngleRotation(ux, uy, uz, angle);

          // Bırakıldığında gerçekçi açısal eylemsizlik / momentum
          const speed = angle / dtMove;
          this.planetAngVel[0] = this.planetAngVel[0] * 0.35 + (ux * speed) * 0.65;
          this.planetAngVel[1] = this.planetAngVel[1] * 0.35 + (uy * speed) * 0.65;
          this.planetAngVel[2] = this.planetAngVel[2] * 0.35 + (uz * speed) * 0.65;

          // Halka parçacık kaydırma
          if (this.dragLastPos) {
            this.planetRingDashOffset += (x - this.dragLastPos.x) * 1.5;
          }
        }

        this.dragStartVec = curVec;
        this.dragLastPos = { x, y };
        this.canvas.style.cursor = 'grabbing';
      } else {
        this.isHoveringShip = this.isPointOnShip(this.mouse.x, this.mouse.y);
        if (this.isPointOnPlanet(this.mouse.x, this.mouse.y)) {
          this.canvas.style.cursor = 'grab';
        } else if (this.isHoveringShip) {
          this.canvas.style.cursor = 'pointer';
        } else {
          this.canvas.style.cursor = 'crosshair';
        }
      }
    }

    onPointerUp(e) {
      if (!this.isDraggingPlanet) return;
      this.isDraggingPlanet = false;

      if (this.canvas) {
        this.canvas.style.cursor = this.isPointOnPlanet(this.mouse.x, this.mouse.y) ? 'grab' : 'crosshair';
      }

      const elapsedSinceMove = (performance.now() - (this.dragLastMoveTime || 0)) / 1000;
      if (elapsedSinceMove > 0.35) {
        this.planetAngVel = [0, 0, 0];
      }
    }

    onPointerLeave() {
      this.mouse.isHovering = false;
      this.mouse.x = -1000;
      this.mouse.y = -1000;
      this.lockedAsteroid = null;
      this.isHoveringShip = false;
      if (!this.isDraggingPlanet && this.canvas) {
        this.canvas.style.cursor = 'crosshair';
      }
    }

    ensureAudio() {
      if (typeof window !== 'undefined' && window.audio) {
        try {
          if (!window.audio.ctx && typeof window.audio.init === 'function') {
            window.audio.init();
          }
          if (window.audio.ctx && window.audio.ctx.state === 'suspended') {
            window.audio.ctx.resume().catch(() => {});
          }
        } catch (e) {}
      }
    }

    onPointerDown(e) {
      if (!this.canvas) return;
      if (typeof e.button === 'number' && e.button !== 0) return;
      this.ensureAudio();
      const clickX = e.clientX;
      const clickY = e.clientY;

      // Do not handle clicks that fall inside the left dock panel
      if (this.width > 960 && clickX < 490) return;

      // Gemiye tıklandığında kaçınma manevrası ve ateşleme gösterisi tetikle (Seçenek 3)
      if (this.isPointOnShip(clickX, clickY)) {
        this.triggerShipManeuver();
        return;
      }

      let hitTarget = null;
      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const a = this.asteroids[i];
        const dist = Math.hypot(clickX - a.x, clickY - a.y);
        if (dist <= a.radius + 20) {
          hitTarget = a;
          this.asteroids.splice(i, 1);
          break;
        }
      }

      if (hitTarget) {
        this.shatterAsteroid(hitTarget, clickX, clickY);
        this.asteroids.push(this.createAsteroid(true));
        return;
      }

      // Check if clicked on the celestial planet
      if (this.isPointOnPlanet(clickX, clickY)) {
        this.startPlanetDrag(clickX, clickY);
        return;
      }

      this.spawnLaserSpark(clickX, clickY);
    }

    spawnLaserSpark(x, y) {
      this.ensureAudio();
      if (window.audio && typeof window.audio.playLaser === 'function') {
        window.audio.playLaser(1.4, x, y);
      }
      for (let i = 0; i < 8; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 40 + Math.random() * 80;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          color: '#00f3ff',
          size: 2,
          life: 0.25,
          maxLife: 0.25
        });
      }
    }

    shatterAsteroid(ast, hitX, hitY) {
      this.ensureAudio();
      const ex = (typeof hitX === 'number') ? hitX : ast.x;
      const ey = (typeof hitY === 'number') ? hitY : ast.y;

      if (window.audio && typeof window.audio.playExplosion === 'function') {
        window.audio.playExplosion(1.4, ex, ey);
      }
      if (window.audio && typeof window.audio.playZap === 'function') {
        window.audio.playZap(ex, ey);
      }

      // 1. Ekran Çapında Büyüyen Şok Dalgaları
      this.shockwaves.push({
        x: ex,
        y: ey,
        radius: 12,
        maxRadius: Math.max(70, ast.radius * 3.4),
        color: ast.neonColor || '#00f3ff',
        life: 0.50,
        maxLife: 0.50
      });
      this.shockwaves.push({
        x: ex,
        y: ey,
        radius: 4,
        maxRadius: Math.max(45, ast.radius * 2.2),
        color: '#ffffff',
        life: 0.32,
        maxLife: 0.32
      });

      // 2. Özel Plazma Patlama Küresi (Fireball / Core Flash)
      this.explosions.push({
        x: ex,
        y: ey,
        color: ast.neonColor || '#00f3ff',
        radius: Math.max(26, ast.radius * 1.7),
        maxRadius: Math.max(54, ast.radius * 2.9),
        life: 0.45,
        maxLife: 0.45
      });

      // 3. Çok Yönlü Taş Kırıkları ve Enerji Kıvılcımları
      const shardCount = 28 + Math.floor(Math.random() * 12);
      for (let i = 0; i < shardCount; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 70 + Math.random() * 210;
        this.particles.push({
          x: ex,
          y: ey,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 14,
          color: Math.random() < 0.60 ? (ast.neonColor || '#00f3ff') : (Math.random() < 0.5 ? '#ffffff' : '#f97316'),
          size: 2.5 + Math.random() * (ast.radius * 0.26),
          life: 0.55 + Math.random() * 0.45,
          maxLife: 1.0,
          isShard: Math.random() < 0.55
        });
      }
    }

    update(dt) {
      if (!this.isInitialized) this.init();

      // Skip render if menu is not active
      const menuOverlay = document.getElementById('menuOverlay');
      if (!menuOverlay || menuOverlay.classList.contains('hidden')) return;

      if (!this.canvas || !this.ctx || this.width <= 0 || this.height <= 0) {
        this.handleResize();
        if (this.width <= 0 || this.height <= 0) return;
      }

      this.bindMenuDockInteractions();
      this.time += dt;

      // Sol menü düğmelerine duyarlı yumuşak geçiş katsayıları (Seçenek 1)
      const lerpSpeed = Math.min(1, dt * 6.5);
      const targetStart = (this.hoveredMenuAction === 'start') ? 1 : 0;
      const targetHangar = (this.hoveredMenuAction === 'hangar' || this.isHoveringShip) ? 1 : 0;
      const targetChips = (this.hoveredMenuAction === 'chips' || this.hoveredMenuAction === 'tech') ? 1 : 0;
      const targetCodex = (this.hoveredMenuAction === 'codex' || this.hoveredMenuAction === 'achievements') ? 1 : 0;

      this.hoverBoostStart += (targetStart - this.hoverBoostStart) * lerpSpeed;
      this.hoverBoostHangar += (targetHangar - this.hoverBoostHangar) * lerpSpeed;
      this.hoverBoostChips += (targetChips - this.hoverBoostChips) * lerpSpeed;
      this.hoverBoostCodex += (targetCodex - this.hoverBoostCodex) * lerpSpeed;

      if (this.shipManeuverTimer > 0) {
        this.shipManeuverTimer = Math.max(0, this.shipManeuverTimer - dt);
      }

      // 1. Draw Deep Space Celestial Atmosphere (Seçenek 5: İlerleme & Tehlike Yansıması)
      this.drawDeepCosmos();

      // 2. Draw Parallax Star Dust (Seçenek 1: Sefere Başla Hover Hızlanması)
      this.updateAndDrawStarDust(dt);

      // 3. Draw Celestial Planet & Atmosphere
      this.drawCelestialPlanet(dt);

      // 4. Draw Floating Player Ship, Drones & 3D Energy Ring (Seçenek 1, 3, 5)
      this.drawShowcaseShip(dt);

      // 5. Update & Draw 3D-Shaded Asteroids
      this.updateAndDrawAsteroids(dt);

      // 6. Update & Draw FX Particles, Projectiles & Shockwaves
      this.updateAndDrawFX(dt);

      // 7. Draw Sleek Targeting Reticle
      this.drawCrosshair();
    }

    drawDeepCosmos() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      const prog = this.getProgressionContext();
      const [sr, sg, sb] = prog.shipRgb;

      // Deep void background fill
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      // Seçili Gemi ve Tehlike Seviyesine Göre Dinamik Bulutsu (Seçenek 5)
      const shipX = w > 960 ? w * 0.66 : w * 0.50;
      const shipY = h * 0.52;
      const pulse = 0.85 + 0.15 * Math.sin(this.time * 1.4);
      const boostAlpha = 1 + this.hoverBoostStart * 0.45 + this.hoverBoostChips * 0.35;

      const grad1 = ctx.createRadialGradient(shipX, shipY, 30, shipX, shipY, w * 0.52);
      grad1.addColorStop(0, `rgba(${sr}, ${sg}, ${sb}, ${(0.14 * pulse * boostAlpha).toFixed(3)})`);
      grad1.addColorStop(0.45, 'rgba(18, 25, 68, 0.32)');
      grad1.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, w, h);

      // Siber Tehlike (Heat) veya Aktif Yonga Durumuna Göre İkincil Kozmik Aura
      let auraR = 0, auraG = 243, auraB = 255;
      if (prog.heatLevel >= 3) {
        auraR = 255; auraG = 0; auraB = 85;
      } else if (prog.heatLevel >= 1) {
        auraR = 251; auraG = 191; auraB = 36;
      } else if (this.hoverBoostChips > 0.1) {
        auraR = 192; auraG = 132; auraB = 252;
      }

      const heatBoost = (prog.heatLevel > 0 ? 0.12 + prog.heatLevel * 0.025 : 0.08) + (this.hoveredMenuAction === 'heat' ? 0.08 : 0);
      const grad2 = ctx.createRadialGradient(w * 0.42, h * 0.84, 20, w * 0.42, h * 0.84, w * 0.48);
      grad2.addColorStop(0, `rgba(${auraR}, ${auraG}, ${auraB}, ${heatBoost.toFixed(3)})`);
      grad2.addColorStop(0.6, 'rgba(120, 10, 150, 0.07)');
      grad2.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, w, h);
    }

    drawCelestialPlanet(dt) {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      const pr = Math.min(135, Math.max(85, w * 0.115));
      const deltaT = dt || 0.016;

      // Aşırı yavaş ve kozmik sol yönlü süzülme (drift) - Tutulup döndürülürken sabit kalır
      const driftSpeed = 3.2; // saniyede ~3.2 piksel
      if (this.planetX === null || isNaN(this.planetX)) {
        this.planetX = w * 0.82;
      } else if (!this.isDraggingPlanet) {
        this.planetX -= driftSpeed * deltaT;
      }

      // Sol ekrandan tamamen çıkınca sağ taraftan pürüzsüzce yeniden dahil olma
      if (this.planetX < -pr * 3) {
        this.planetX = w + pr * 3;
      }

      // Çok hafif düşey nefes alma salınımı
      this.planetY = (h * 0.28) + Math.sin(this.time * 0.22) * 5;
      const px = this.planetX;
      const py = this.planetY;

      // 3B Sanal İztopu / Google Earth Açısal Momentum ve Eksenel Dönüş
      if (!this.isDraggingPlanet) {
        const velLen = Math.hypot(this.planetAngVel[0], this.planetAngVel[1], this.planetAngVel[2]);
        if (velLen > 0.008) {
          // Bırakılan momentum yönünde kesintisiz dönüş
          const angle = velLen * deltaT;
          this.applyAxisAngleRotation(
            this.planetAngVel[0] / velLen,
            this.planetAngVel[1] / velLen,
            this.planetAngVel[2] / velLen,
            angle
          );
          this.planetRingDashOffset += velLen * 18 * deltaT;
          const damping = Math.exp(-1.8 * deltaT);
          this.planetAngVel[0] *= damping;
          this.planetAngVel[1] *= damping;
          this.planetAngVel[2] *= damping;
        } else {
          // Sakin durumda gezegenin kendi kutup ekseni (yerel Y ekseni, sütun 1) etrafında doğal dönüşü
          const poleX = this.planetRotMat[3];
          const poleY = this.planetRotMat[4];
          const poleZ = this.planetRotMat[5];
          const idleAngle = 0.20 * deltaT;
          this.applyAxisAngleRotation(poleX, poleY, poleZ, idleAngle);
          this.planetRingDashOffset += 24 * deltaT;
        }
      }

      if (this.gl3d) {
        ctx.save();
        // --- 1. Maviye Zıt Sıcak Korona / Güneş Işıltısı (Ambient Glow) ---
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const coronaPulse = 0.32 + 0.10 * Math.sin(this.time * 1.8);
        const coronaGrad = ctx.createRadialGradient(px, py, pr * 0.75, px, py, pr * 1.6);
        coronaGrad.addColorStop(0, `rgba(245, 158, 11, ${coronaPulse})`);
        coronaGrad.addColorStop(0.5, `rgba(234, 88, 12, ${coronaPulse * 0.45})`);
        coronaGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
        ctx.fillStyle = coronaGrad;
        ctx.beginPath();
        ctx.arc(px, py, pr * 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // --- 2. Gerçek 3B WebGL Gezegen ve Halka Çizimi ---
        const gl = this.gl3d;
        gl.useProgram(this.gl3dProg);
        gl.uniformMatrix3fv(this.uRotMat3D, false, this.planetRotMat);
        gl.uniform1f(this.uTime3D, this.time);
        gl.uniform1f(this.uRingDash3D, this.planetRingDashOffset * 0.05);

        gl.viewport(0, 0, 512, 512);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // WebGL dokusunu ekran merkezine tam ölçekli çiz
        const R_SPHERE = 0.34;
        const drawHalf = pr / R_SPHERE;
        ctx.drawImage(this.planetCanvas3D, px - drawHalf, py - drawHalf, drawHalf * 2, drawHalf * 2);
        ctx.restore();
        return;
      }

      const ringTilt = this.planetRotZ;
      const sinPitch = Math.sin(this.planetRotX);
      const cosPitch = Math.cos(this.planetRotX);
      const ringFlatten = Math.max(0.04, Math.abs(sinPitch));
      const isNorthView = sinPitch >= 0;

      // Halkaların derinlik sıralaması:
      // Kuzeyden bakışta: alt yay (0..PI) önde, üst yay (PI..2PI) arkada
      // Güneyden bakışta: üst yay (PI..2PI) önde, alt yay (0..PI) arkada
      const backStart = isNorthView ? Math.PI : 0;
      const backEnd = isNorthView ? Math.PI * 2 : Math.PI;
      const frontStart = isNorthView ? 0 : Math.PI;
      const frontEnd = isNorthView ? Math.PI : Math.PI * 2;

      ctx.save();

      // --- 1. Maviye Zıt Sıcak Korona / Güneş Işıltısı (Ambient Glow) ---
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const coronaPulse = 0.32 + 0.10 * Math.sin(this.time * 1.8);
      const coronaGrad = ctx.createRadialGradient(px, py, pr * 0.75, px, py, pr * 1.55);
      coronaGrad.addColorStop(0, `rgba(245, 158, 11, ${coronaPulse})`);
      coronaGrad.addColorStop(0.5, `rgba(234, 88, 12, ${coronaPulse * 0.45})`);
      coronaGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(px, py, pr * 1.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // --- 2. Gezegen Halkaları - Arka Yay (Kürenin Arkasında Kalan Kısım) ---
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ringTilt);

      // Dış geniş kehribar-altın halka
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.ellipse(0, 0, pr * 2.25, pr * 2.25 * ringFlatten, 0, backStart, backEnd);
      ctx.stroke();

      // Cassini Bölünmesi (Karanlık yarık)
      ctx.strokeStyle = 'rgba(5, 7, 17, 0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, pr * 2.28, pr * 2.28 * ringFlatten, 0, backStart, backEnd);
      ctx.stroke();

      // İç parlak akkor turuncu halka
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, pr * 2.48, pr * 2.48 * ringFlatten, 0, backStart, backEnd);
      ctx.stroke();

      // Arka halka üzerinde akan mikro ışıltı akımı
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 12]);
      ctx.lineDashOffset = -this.planetRingDashOffset;
      ctx.beginPath();
      ctx.ellipse(0, 0, pr * 2.15, pr * 2.15 * ringFlatten, 0, backStart, backEnd);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // --- 3. Gezegen Gövdesi (Maviye Zıt Sıcak/Akkor Gaz Devi Tonları) ---
      const planetGrad = ctx.createRadialGradient(
        px - pr * 0.38, py - pr * 0.38, pr * 0.08,
        px, py, pr * 1.02
      );
      planetGrad.addColorStop(0, '#fef08a'); // Parlak altın ışık zirvesi
      planetGrad.addColorStop(0.18, '#f59e0b'); // Sıcak kehribar
      planetGrad.addColorStop(0.42, '#d97706'); // Güneş alevi
      planetGrad.addColorStop(0.68, '#991b1b'); // Derin akkor kızıl
      planetGrad.addColorStop(0.88, '#450a0a'); // Volkanik gölge
      planetGrad.addColorStop(1.0, '#0a0203'); // Uzay boşluğu gölge kenarı

      ctx.fillStyle = planetGrad;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();

      // --- 4. Dinamik / Canlı Yüzey Kuşakları & Fırtına (Küreye Kırpılmış & 3D Projeksiyon) ---
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.clip();

      // Atmosferik bantlar ve fırtınalar gezegenin 3 eksenli yönelimiyle döner
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ringTilt);

      // Hareket eden gaz devi atmosferik bantları (Küre üzerinde 3D enlem kuşakları)
      const bands = [
        { yRel: -0.55, h: pr * 0.18, color: 'rgba(251, 146, 60, 0.26)' },
        { yRel: -0.25, h: pr * 0.24, color: 'rgba(220, 38, 38, 0.22)' },
        { yRel: 0.05,  h: pr * 0.30, color: 'rgba(245, 158, 11, 0.28)' },
        { yRel: 0.38,  h: pr * 0.22, color: 'rgba(180, 83, 9, 0.24)' },
        { yRel: 0.65,  h: pr * 0.16, color: 'rgba(254, 215, 170, 0.18)' }
      ];

      for (const b of bands) {
        // Enlem dairesinin küre üzerindeki 3D izdüşümü
        const rCircle = pr * Math.sqrt(Math.max(0.08, 1 - b.yRel * b.yRel));
        const bandCenterY = -pr * b.yRel * cosPitch;
        const bandRx = rCircle * 1.05;
        const bandRy = Math.max(1.5, rCircle * ringFlatten * 0.75);
        const waveShift = Math.sin(this.planetRotY * 2.2 + b.yRel * 3.5) * (pr * 0.04);

        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.ellipse(0, bandCenterY + waveShift, bandRx, bandRy, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Canlı Güneş Girdabı / Büyük Fırtına Lekesi (Tam 3D Küresel İzdüşüm)
      const phi1 = -0.12;
      const lam1 = this.planetRotY;
      const x3_1 = pr * Math.cos(phi1) * Math.sin(lam1);
      const y3_1 = pr * Math.sin(phi1);
      const z3_1 = pr * Math.cos(phi1) * Math.cos(lam1);

      // X ekseni (Pitch) rotasyonu
      const y3_rot1 = y3_1 * cosPitch - z3_1 * sinPitch;
      const z3_rot1 = y3_1 * sinPitch + z3_1 * cosPitch;

      if (z3_rot1 > -pr * 0.15) {
        const stormX = x3_1;
        const stormY = -y3_rot1;
        const foreshorten = Math.max(0.20, Math.min(1.0, (z3_rot1 / pr) + 0.35));
        const stormW = pr * 0.22 * foreshorten;
        const stormH = pr * 0.11 * Math.max(0.35, Math.abs(cosPitch));
        const stormAlpha = Math.min(1.0, (z3_rot1 / pr + 0.15) / 0.45);

        ctx.save();
        ctx.translate(stormX, stormY);
        ctx.fillStyle = `rgba(225, 29, 72, ${0.45 * stormAlpha})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, stormW, stormH, 0.08, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(254, 240, 138, ${0.70 * stormAlpha})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, stormW * 0.45, stormH * 0.45, 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // İkincil Akkor Siklon (Üst enlemde, zıt boylamda 3D fırtına)
      const phi2 = 0.42;
      const lam2 = this.planetRotY + Math.PI * 0.82;
      const x3_2 = pr * Math.cos(phi2) * Math.sin(lam2);
      const y3_2 = pr * Math.sin(phi2);
      const z3_2 = pr * Math.cos(phi2) * Math.cos(lam2);

      const y3_rot2 = y3_2 * cosPitch - z3_2 * sinPitch;
      const z3_rot2 = y3_2 * sinPitch + z3_2 * cosPitch;

      if (z3_rot2 > -pr * 0.15) {
        const storm2X = x3_2;
        const storm2Y = -y3_rot2;
        const foreshorten2 = Math.max(0.20, Math.min(1.0, (z3_rot2 / pr) + 0.35));
        const storm2W = pr * 0.14 * foreshorten2;
        const storm2H = pr * 0.07 * Math.max(0.35, Math.abs(cosPitch));
        const storm2Alpha = Math.min(1.0, (z3_rot2 / pr + 0.15) / 0.40);

        ctx.save();
        ctx.translate(storm2X, storm2Y);
        ctx.fillStyle = `rgba(254, 240, 138, ${0.55 * storm2Alpha})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, storm2W, storm2H, -0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Halka Gövde Gölgesi (Ekvator düzleminde küreye düşen gölge)
      ctx.fillStyle = 'rgba(20, 4, 8, 0.40)';
      ctx.beginPath();
      ctx.ellipse(0, 0, pr * 1.02, Math.max(2, pr * ringFlatten * 0.22), 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // Eksen rotasyonu sonu
      ctx.restore(); // Clip sonu

      // --- 5. Işıltılı Güneş Hilal Kenarı (Sadece Aydınlık Üst-Sol Hilal - Sabit Uzay Işık Kaynağı) ---
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.70)';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(px, py, pr, Math.PI * 0.82, Math.PI * 1.88);
      ctx.stroke();

      // Yumuşak atmosferik dış halo
      const atmGrad = ctx.createRadialGradient(
        px - pr * 0.35, py - pr * 0.35, pr * 0.7,
        px, py, pr * 1.05
      );
      atmGrad.addColorStop(0, 'rgba(245, 158, 11, 0)');
      atmGrad.addColorStop(0.85, 'rgba(251, 146, 60, 0.25)');
      atmGrad.addColorStop(1, 'rgba(254, 215, 170, 0.50)');
      ctx.strokeStyle = atmGrad;
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(px, py, pr, Math.PI * 0.75, Math.PI * 1.95);
      ctx.stroke();
      ctx.restore();

      // --- 6. Gezegen Halkaları - Ön Yay (Kürenin Önünden Geçen Işıltılı Halka) ---
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ringTilt);

      // Dış parlak kehribar-altın yay
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.ellipse(0, 0, pr * 2.25, pr * 2.25 * ringFlatten, 0, frontStart, frontEnd);
      ctx.stroke();

      // Cassini Bölünmesi (Ön halka karanlık aralık)
      ctx.strokeStyle = 'rgba(5, 7, 17, 0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, pr * 2.28, pr * 2.28 * ringFlatten, 0, frontStart, frontEnd);
      ctx.stroke();

      // İç parlak akkor turuncu yay
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.40)';
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, pr * 2.48, pr * 2.48 * ringFlatten, 0, frontStart, frontEnd);
      ctx.stroke();

      // Ön halka üzerinde parıldayan mikro kozmik parçacık akımı
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 12]);
      ctx.lineDashOffset = -this.planetRingDashOffset;
      ctx.beginPath();
      ctx.ellipse(0, 0, pr * 2.15, pr * 2.15 * ringFlatten, 0, frontStart, frontEnd);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();

      ctx.restore();
    }

    updateAndDrawStarDust(dt) {
      const ctx = this.ctx;
      const maneuverBoost = this.shipManeuverTimer > 0 ? Math.sin((this.shipManeuverTimer / this.shipManeuverDuration) * Math.PI) * 2.2 : 0;
      const warpMult = 1.0 + this.hoverBoostStart * 3.4 + maneuverBoost;

      for (const s of this.starDust) {
        s.x -= s.speed * warpMult * dt;
        if (this.hoverBoostStart > 0.05 || maneuverBoost > 0.05) {
          s.y += s.speed * (this.hoverBoostStart * 1.1 + maneuverBoost * 0.7) * dt;
        }
        if (s.x < -20) {
          s.x = this.width + 20;
          s.y = Math.random() * this.height;
        }
        if (s.y > this.height + 20) {
          s.y = -10;
          s.x = Math.random() * this.width;
        }

        const twinkle = s.alpha * (0.65 + 0.35 * Math.sin(this.time * 2.5 + s.x));
        ctx.globalAlpha = Math.min(1, twinkle * (1 + this.hoverBoostStart * 0.35));

        if (warpMult > 1.35) {
          // Warp / Kalkış hazırlığında yıldız izi uzaması (Seçenek 1)
          const streakLen = s.size * (warpMult - 1.0) * 6.5;
          ctx.strokeStyle = s.color;
          ctx.lineWidth = Math.max(1, s.size * 0.9);
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x + streakLen, s.y - streakLen * 0.38);
          ctx.stroke();
        } else {
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;
    }

    drawMaintenanceDrone(ctx, d, sx, sy, shipColor, isActiveScan) {
      const cosT = Math.cos(d.tilt), sinT = Math.sin(d.tilt);
      const ox = Math.cos(d.orbitPhase) * d.orbitRadiusX;
      const oy = Math.sin(d.orbitPhase) * d.orbitRadiusY;
      const dx = sx + (ox * cosT - oy * sinT);
      const dy = sy + (ox * sinT + oy * cosT);
      const depthScale = 0.82 + 0.22 * Math.sin(d.orbitPhase);

      ctx.save();
      // Hangar hover veya aktif gemi etkileşiminde estetik siber tarama demeti
      if (isActiveScan) {
        const beamAlpha = 0.55;
        const beamGrad = ctx.createLinearGradient(dx, dy, sx, sy);
        beamGrad.addColorStop(0, shipColor);
        beamGrad.addColorStop(0.5, 'rgba(0, 243, 255, 0.25)');
        beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.strokeStyle = beamGrad;
        ctx.globalAlpha = beamAlpha;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = shipColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(sx + Math.cos(d.orbitPhase) * 12, sy + Math.sin(d.orbitPhase) * 8);
        ctx.stroke();

        // Gemi gövdesinde yumuşak nanit kaynak/tarama ışıltısı
        ctx.fillStyle = shipColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(sx + Math.cos(d.orbitPhase) * 12, sy + Math.sin(d.orbitPhase) * 8, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Nano-Drone Gövdesi
      ctx.globalAlpha = 0.95;
      ctx.translate(dx, dy);
      ctx.scale(depthScale, depthScale);

      // Drone dış enerji halesi
      ctx.shadowColor = shipColor;
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#0b1528';
      ctx.strokeStyle = shipColor;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(7, -2);
      ctx.lineTo(5, 6);
      ctx.lineTo(-5, 6);
      ctx.lineTo(-7, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Drone çekirdek gözü
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Yan kanatçıklar
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-10, 0); ctx.lineTo(-7, -2);
      ctx.moveTo(10, 0); ctx.lineTo(7, -2);
      ctx.stroke();

      ctx.restore();
    }

    getShip3DMesh(shipClass) {
      if (this._cachedShipMeshes && this._cachedShipMeshes[shipClass]) {
        return this._cachedShipMeshes[shipClass];
      }
      if (!this._cachedShipMeshes) this._cachedShipMeshes = {};

      const isTitan = shipClass === 'titan';
      const isSpectre = shipClass === 'spectre';

      const wScale = isTitan ? 1.18 : (isSpectre ? 1.05 : 1.0);
      const hScale = isTitan ? 1.28 : (isSpectre ? 0.92 : 1.0);
      const lScale = isTitan ? 0.94 : (isSpectre ? 1.08 : 1.0);
      const wingLeadX = isSpectre ? 14 : (isTitan ? -4 : -16);
      const wingTrailX = isSpectre ? -28 : (isTitan ? -38 : -38);
      const wingTipX = isSpectre ? 24 : (isTitan ? 12 : 6);

      const rawVerts = [
        [62 * lScale, 0, 0],                        // 0: Burun ucu
        [28 * lScale, 0, 10 * hScale],              // 1: Ön üst omurga
        [28 * lScale, -13 * wScale, 1],             // 2: Ön sol kesit
        [28 * lScale, 13 * wScale, 1],              // 3: Ön sağ kesit
        [28 * lScale, 0, -9 * hScale],              // 4: Ön alt omurga (karina)
        [6 * lScale, 0, 20 * hScale],               // 5: Kokpit kristal kubbe tepe noktası
        [15 * lScale, -9 * wScale, 9 * hScale],     // 6: Kokpit ön-sol
        [15 * lScale, 9 * wScale, 9 * hScale],      // 7: Kokpit ön-sağ
        [-12 * lScale, -10 * wScale, 10 * hScale],  // 8: Kokpit arka-sol
        [-12 * lScale, 10 * wScale, 10 * hScale],   // 9: Kokpit arka-sağ
        [-24 * lScale, 0, 14 * hScale],             // 10: Arka üst omurga
        [-6 * lScale, -19 * wScale, 2],             // 11: Orta gövde sol omuz
        [-6 * lScale, 19 * wScale, 2],              // 12: Orta gövde sağ omuz
        [-6 * lScale, 0, -14 * hScale],             // 13: Orta alt reaktör omurgası
        [-45 * lScale, 0, 9 * hScale],              // 14: Kuyruk üst sırt
        [-45 * lScale, -16 * wScale, 2],            // 15: Kuyruk sol motor yuvası
        [-45 * lScale, 16 * wScale, 2],             // 16: Kuyruk sağ motor yuvası
        [-45 * lScale, 0, -9 * hScale],             // 17: Kuyruk alt karina
        [wingLeadX, -52 * wScale, 3],               // 18: Sol kanat dış hücum ucu
        [wingTrailX, -46 * wScale, 1],              // 19: Sol kanat dış firar ucu
        [-22, -48 * wScale, -5 * hScale],           // 20: Sol kanat alt kalınlık hacmi
        [wingTipX, -52 * wScale, 1],                // 21: Sol kanat ucu lazer podu
        [wingLeadX, 52 * wScale, 3],                // 22: Sağ kanat dış hücum ucu
        [wingTrailX, 46 * wScale, 1],               // 23: Sağ kanat dış firar ucu
        [-22, 48 * wScale, -5 * hScale],            // 24: Sağ kanat alt kalınlık hacmi
        [wingTipX, 52 * wScale, 1],                 // 25: Sağ kanat ucu lazer podu
        [-34 * lScale, -22 * wScale, 25 * hScale],  // 26: Sol dikey kuyruk yüzgeci tepe
        [-46 * lScale, -20 * wScale, 16 * hScale],  // 27: Sol dikey kuyruk yüzgeci arka
        [-34 * lScale, 22 * wScale, 25 * hScale],   // 28: Sağ dikey kuyruk yüzgeci tepe
        [-46 * lScale, 20 * wScale, 16 * hScale]    // 29: Sağ dikey kuyruk yüzgeci arka
      ];

      const rawFaces = [
        // Ön Burun Konisi (Üst & Alt 3B Yüzeyler)
        [0, 2, 1, 'hull_top'], [0, 1, 3, 'hull_top'],
        [0, 4, 2, 'hull_bottom'], [0, 3, 4, 'hull_bottom'],
        // Kokpit & Ön Güverte
        [1, 2, 6, 'hull_mid'], [1, 6, 5, 'cockpit'],
        [1, 7, 3, 'hull_mid'], [1, 5, 7, 'cockpit'],
        [5, 6, 8, 'cockpit'], [5, 9, 7, 'cockpit'],
        [5, 8, 10, 'cockpit'], [5, 10, 9, 'cockpit'],
        // Gövde Yan Zırh & Alt Reaktör Karinası
        [2, 11, 6, 'hull_mid'], [6, 11, 8, 'hull_accent'],
        [3, 7, 12, 'hull_mid'], [7, 9, 12, 'hull_accent'],
        [2, 4, 13, 'hull_bottom'], [2, 13, 11, 'hull_bottom'],
        [3, 13, 4, 'hull_bottom'], [3, 12, 13, 'hull_bottom'],
        [8, 11, 15, 'hull_mid'], [8, 15, 10, 'hull_top'],
        [9, 10, 16, 'hull_top'], [9, 16, 12, 'hull_mid'],
        // Arka Gövde & Motor Bloğu
        [10, 15, 14, 'hull_top'], [10, 14, 16, 'hull_top'],
        [11, 13, 17, 'hull_bottom'], [11, 17, 15, 'hull_bottom'],
        [12, 17, 13, 'hull_bottom'], [12, 16, 17, 'hull_bottom'],
        [14, 15, 17, 'engine'], [14, 17, 16, 'engine'],
        // Sol 3B Kanat (Üst, Alt ve Kanat Ucu Silah Podu)
        [2, 18, 11, 'wing_top'], [11, 18, 19, 'wing_top'], [11, 19, 15, 'wing_accent'],
        [2, 11, 20, 'wing_bottom'], [2, 20, 18, 'wing_bottom'],
        [11, 15, 20, 'wing_bottom'], [20, 15, 19, 'wing_bottom'],
        [21, 18, 20, 'wing_accent'], [21, 20, 19, 'wing_accent'],
        // Sağ 3B Kanat (Üst, Alt ve Kanat Ucu Silah Podu)
        [3, 12, 22, 'wing_top'], [12, 23, 22, 'wing_top'], [12, 16, 23, 'wing_accent'],
        [3, 24, 12, 'wing_bottom'], [3, 22, 24, 'wing_bottom'],
        [12, 24, 16, 'wing_bottom'], [24, 23, 16, 'wing_bottom'],
        [25, 24, 22, 'wing_accent'], [25, 23, 24, 'wing_accent'],
        // Çift 3B Dikey Kuyruk Stabilizatörleri (Tail Fins)
        [8, 26, 15, 'fin'], [26, 27, 15, 'fin'],
        [9, 16, 28, 'fin'], [28, 16, 29, 'fin']
      ];

      // Her yüzey için yerel dışa dönük 3B birim normal vektörünü önceden hesapla
      const faces = rawFaces.map(f => {
        const v0 = rawVerts[f[0]], v1 = rawVerts[f[1]], v2 = rawVerts[f[2]];
        const ux = v1[0] - v0[0], uy = v1[1] - v0[1], uz = v1[2] - v0[2];
        const vx = v2[0] - v0[0], vy = v2[1] - v0[1], vz = v2[2] - v0[2];
        let nx = uy * vz - uz * vy;
        let ny = uz * vx - ux * vz;
        let nz = ux * vy - uy * vx;
        const len = Math.hypot(nx, ny, nz) || 1;
        nx /= len; ny /= len; nz /= len;

        const cx = (v0[0] + v1[0] + v2[0]) / 3;
        const cy = (v0[1] + v1[1] + v2[1]) / 3;
        const cz = (v0[2] + v1[2] + v2[2]) / 3;
        if (nx * cx + ny * cy + nz * cz < 0) {
          nx = -nx; ny = -ny; nz = -nz;
        }
        return { i0: f[0], i1: f[1], i2: f[2], mat: f[3], nx, ny, nz, isFin: f[3] === 'fin' };
      });

      const nozzles = isTitan
        ? [[-46 * lScale, -13 * wScale, 1], [-48 * lScale, -5 * wScale, 2], [-48 * lScale, 5 * wScale, 2], [-46 * lScale, 13 * wScale, 1]]
        : [[-46 * lScale, -12 * wScale, 1], [-49 * lScale, 0, 2], [-46 * lScale, 12 * wScale, 1]];

      // Neon siber yapısal sırt çizgileri [vA, vB]
      const neonEdges = [
        [0, 1], [1, 5], [5, 10], [10, 14], // Üst omurga hattı
        [0, 2], [2, 18], [21, 19],         // Sol kanat hücum/silah hattı
        [0, 3], [3, 22], [25, 23],         // Sağ kanat hücum/silah hattı
        [8, 26], [26, 27],                 // Sol dikey kuyruk yüzgeci
        [9, 28], [28, 29]                  // Sağ dikey kuyruk yüzgeci
      ];

      const mesh = { verts: rawVerts, faces, nozzles, neonEdges };
      this._cachedShipMeshes[shipClass] = mesh;
      return mesh;
    }

    renderTrue3DShip(ctx, sx, sy, shipClass, primaryColor, shipRgb, shipAngle, localRoll, localPitch, flameBaseLen) {
      const mesh = this.getShip3DMesh(shipClass);
      const [sr, sg, sb] = shipRgb;
      const scale3D = 1.16;

      // 1. Yerel eksende 3B Roll (X ekseni etrafında 360° barrel roll) ve Pitch (Y ekseni)
      const cr = Math.cos(localRoll), sr_ang = Math.sin(localRoll);
      const cp = Math.cos(localPitch), sp = Math.sin(localPitch);
      // 2. Dünya düzleminde 60° yönelim (Yaw = shipAngle)
      const cy = Math.cos(shipAngle), sy_ang = Math.sin(shipAngle);
      // 3. İzometrik 3B kamera eğimi (üstten 30° bakış açısı)
      const camTilt = 0.52;
      const cc = Math.cos(camTilt), sc = Math.sin(camTilt);

      const transformPoint = (pt) => {
        const x0 = pt[0] * scale3D, y0 = pt[1] * scale3D, z0 = pt[2] * scale3D;
        // Local Roll (around X)
        const x1 = x0;
        const y1 = y0 * cr - z0 * sr_ang;
        const z1 = y0 * sr_ang + z0 * cr;
        // Local Pitch (around Y)
        const x2 = x1 * cp + z1 * sp;
        const y2 = y1;
        const z2 = -x1 * sp + z1 * cp;
        // World Yaw (around Z)
        const x3 = x2 * cy - y2 * sy_ang;
        const y3 = x2 * sy_ang + y2 * cy;
        const z3 = z2;
        // Camera Elevation Tilt (around screen X)
        const vx = x3;
        const vy = y3 * cc - z3 * sc;
        const vz = y3 * sc + z3 * cc;
        const persp = 560 / Math.max(220, 560 - vz);
        return { x: sx + vx * persp, y: sy + vy * persp, z: vz, persp };
      };

      const transformDir = (dx, dy, dz) => {
        const x1 = dx;
        const y1 = dy * cr - dz * sr_ang;
        const z1 = dy * sr_ang + dz * cr;
        const x2 = x1 * cp + z1 * sp;
        const y2 = y1;
        const z2 = -x1 * sp + z1 * cp;
        const x3 = x2 * cy - y2 * sy_ang;
        const y3 = x2 * sy_ang + y2 * cy;
        const z3 = z2;
        return {
          x: x3,
          y: y3 * cc - z3 * sc,
          z: y3 * sc + z3 * cc
        };
      };

      const tVerts = mesh.verts.map(transformPoint);

      // 3B İtici Nozüller ve Hacimsel Plazma Alev Konileri
      const aftDir = transformDir(-1, 0, 0);
      const aftScreenLen = Math.hypot(aftDir.x, aftDir.y) || 1;
      const ax = aftDir.x / aftScreenLen, ay = aftDir.y / aftScreenLen;
      const px = -ay, py = ax;

      const drawNozzlePlume = (nPt, idx) => {
        const flen = flameBaseLen * (idx === 1 && mesh.nozzles.length === 3 ? 1.45 : 1.12) * nPt.persp;
        const fwidth = (idx === 1 && mesh.nozzles.length === 3 ? 8.5 : 6.5) * nPt.persp;
        const tipX = nPt.x + aftDir.x * flen;
        const tipY = nPt.y + aftDir.y * flen;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.moveTo(nPt.x + px * fwidth * 0.5, nPt.y + py * fwidth * 0.5);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(nPt.x - px * fwidth * 0.5, nPt.y - py * fwidth * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(nPt.x + px * fwidth * 0.25, nPt.y + py * fwidth * 0.25);
        ctx.lineTo(nPt.x + aftDir.x * flen * 0.58, nPt.y + aftDir.y * flen * 0.58);
        ctx.lineTo(nPt.x - px * fwidth * 0.25, nPt.y - py * fwidth * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };

      const tNozzles = mesh.nozzles.map((n, idx) => ({ pt: transformPoint(n), idx }));
      for (const nz of tNozzles) {
        if (nz.pt.z <= 8) drawNozzlePlume(nz.pt, nz.idx);
      }

      // 3B Yüzeyleri Z-Derinliğine Göre Sırala (Painter's Algorithm)
      const renderList = [];
      for (const f of mesh.faces) {
        const p0 = tVerts[f.i0], p1 = tVerts[f.i1], p2 = tVerts[f.i2];
        const zAvg = (p0.z + p1.z + p2.z) / 3;
        const nView = transformDir(f.nx, f.ny, f.nz);
        renderList.push({ f, p0, p1, p2, zAvg, nView });
      }
      renderList.sort((a, b) => a.zAvg - b.zAvg);

      // 3B Işık Kaynakları: Gezegenin sıcak altın ışığı (sağ-üst) & Siber Nebula Rim ışığı (sol-alt)
      const L1x = 0.52, L1y = -0.58, L1z = 0.62;
      const L2x = -0.58, L2y = 0.42, L2z = 0.69;

      ctx.save();
      ctx.lineJoin = 'round';
      for (const item of renderList) {
        const { f, p0, p1, p2, nView } = item;
        let nx = nView.x, ny = nView.y, nz = nView.z;
        // İnce kuyruk yüzgeçleri çift taraflı ışık alır
        if (f.isFin && nz < 0) {
          nx = -nx; ny = -ny; nz = -nz;
        }

        const diff1 = Math.max(0, nx * L1x + ny * L1y + nz * L1z);
        const diff2 = Math.max(0, nx * L2x + ny * L2y + nz * L2z);
        // Blinn-Phong Specular (H ≈ [0.25, -0.28, 0.92])
        const specDot = Math.max(0, nx * 0.25 + ny * (-0.28) + nz * 0.92);
        const spec = Math.pow(specDot, f.mat === 'cockpit' ? 18 : 12);

        let r = 14, g = 23, b = 42;
        if (f.mat === 'hull_top') {
          r = 18 + diff1 * 48 + diff2 * (sr * 0.22) + spec * 75;
          g = 30 + diff1 * 56 + diff2 * (sg * 0.22) + spec * 85;
          b = 54 + diff1 * 68 + diff2 * (sb * 0.22) + spec * 95;
        } else if (f.mat === 'hull_mid' || f.mat === 'wing_top') {
          r = 12 + diff1 * 38 + diff2 * (sr * 0.28) + spec * 55;
          g = 22 + diff1 * 45 + diff2 * (sg * 0.28) + spec * 65;
          b = 42 + diff1 * 58 + diff2 * (sb * 0.28) + spec * 75;
        } else if (f.mat === 'hull_accent' || f.mat === 'wing_accent' || f.mat === 'fin') {
          r = sr * (0.28 + diff1 * 0.48 + diff2 * 0.35) + spec * 110;
          g = sg * (0.28 + diff1 * 0.48 + diff2 * 0.35) + spec * 110;
          b = sb * (0.28 + diff1 * 0.48 + diff2 * 0.35) + spec * 110;
        } else if (f.mat === 'cockpit') {
          // Kristal siber kanopi (macenta/camgöbeği yansımalı 3B kubbe)
          r = 35 + diff1 * 180 + spec * 210;
          g = 15 + diff1 * 45 + diff2 * 140 + spec * 220;
          b = 65 + diff1 * 110 + diff2 * 180 + spec * 240;
        } else if (f.mat === 'hull_bottom' || f.mat === 'wing_bottom') {
          // Alt zırh plakaları (barrel-roll sırasında net görünen koyu metalik reaktör zırhı)
          r = 9 + diff1 * 28 + diff2 * (sr * 0.18) + spec * 40;
          g = 15 + diff1 * 34 + diff2 * (sg * 0.18) + spec * 45;
          b = 28 + diff1 * 44 + diff2 * (sb * 0.18) + spec * 55;
        } else if (f.mat === 'engine') {
          r = sr * 0.65 + 70;
          g = sg * 0.65 + 70;
          b = sb * 0.65 + 70;
        }

        const colStr = `rgb(${Math.min(255, Math.round(r))}, ${Math.min(255, Math.round(g))}, ${Math.min(255, Math.round(b))})`;
        ctx.fillStyle = colStr;
        ctx.strokeStyle = (f.mat === 'cockpit' || f.mat === 'hull_accent' || f.mat === 'wing_accent')
          ? `rgba(${sr}, ${sg}, ${sb}, 0.55)`
          : colStr;
        ctx.lineWidth = 0.85;

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // 3B Yapısal Neon Sırt ve Kanat Çizgileri
      ctx.strokeStyle = primaryColor;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = this.isHoveringShip ? 14 : 8;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.82;
      for (const edge of mesh.neonEdges) {
        const va = tVerts[edge[0]], vb = tVerts[edge[1]];
        if (va.z + vb.z > -18) {
          ctx.beginPath();
          ctx.moveTo(va.x, va.y);
          ctx.lineTo(vb.x, vb.y);
          ctx.stroke();
        }
      }
      ctx.restore();

      // Kameraya doğru dönen ön nozüller (barrel roll esnasında üstte kalanlar)
      for (const nz of tNozzles) {
        if (nz.pt.z > 8) drawNozzlePlume(nz.pt, nz.idx);
      }
    }

    drawShowcaseShip(dt) {
      const ctx = this.ctx;
      const prog = this.getProgressionContext();
      const shipClass = prog.shipClass;
      const primaryColor = prog.shipColor || '#00f3ff';
      const [sr, sg, sb] = prog.shipRgb;

      // Ship anchor coordinates (balanced in the open space of the right side)
      const cx = this.width > 960 ? this.width * 0.66 : this.width * 0.50;
      const cy = this.height * 0.52;

      // Gerçek 3B Manevra (360° Barrel Roll & Surge) ve Hover Kinematikleri
      let maneuverSurge = 0;
      let maneuverRoll3D = 0;
      let maneuverSpinOffset = 0;
      if (this.shipManeuverTimer > 0) {
        const mProg = 1.0 - (this.shipManeuverTimer / this.shipManeuverDuration);
        maneuverSurge = Math.sin(mProg * Math.PI) * 28;
        // Tam 360 derece (2*PI) gerçek 3B eksenel dönüş (ease-in-out)
        const smoothProg = 0.5 - 0.5 * Math.cos(mProg * Math.PI);
        maneuverRoll3D = smoothProg * Math.PI * 2;
        maneuverSpinOffset = Math.sin(mProg * Math.PI * 2) * 0.08;
      }

      const startSurge = this.hoverBoostStart * 14;
      const floatY = Math.sin(this.time * 1.1) * 7;
      const rollAngle = Math.sin(this.time * 0.8) * 0.04 + maneuverSpinOffset;
      const shipAngle = -Math.PI / 6 + rollAngle; // 60 derece açılı yönelim (derinlik perspektifi)

      // 3B yalpalama (bank/roll) ve yunuslama (pitch) açıları
      const localRoll3D = Math.sin(this.time * 1.15) * 0.24 + maneuverRoll3D;
      const localPitch3D = Math.cos(this.time * 0.85) * 0.08 - this.hoverBoostStart * 0.08;

      const totalSurge = maneuverSurge + startSurge;
      const sx = cx + Math.cos(shipAngle) * totalSurge;
      const sy = cy + floatY + Math.sin(shipAngle) * totalSurge;

      this.shipCenterX = sx;
      this.shipCenterY = sy;
      this.shipCurrentAngle = shipAngle;

      // Drone yörünge güncellemesi
      const droneSpeedMult = 1.0 + this.hoverBoostHangar * 1.4 + (this.shipManeuverTimer > 0 ? 1.5 : 0);
      for (const d of this.drones) {
        d.orbitPhase += d.speed * droneSpeedMult * (dt || 0.016);
      }

      // --- Gelişmiş 3B Enerji & Kalkış Platformu (Seçenek 1, 3 ve 5) ---
      const baseRingY = cy + 92;
      ctx.save();
      ctx.translate(cx, baseRingY);

      // Platformdan gemiye yükselen hafif holografik enerji projeksiyon konisi
      const coneAlpha = 0.07 + this.hoverBoostHangar * 0.10 + this.hoverBoostChips * 0.09 + (this.isHoveringShip ? 0.06 : 0);
      const coneGrad = ctx.createLinearGradient(0, 0, 0, -110);
      coneGrad.addColorStop(0, `rgba(${sr}, ${sg}, ${sb}, ${coneAlpha.toFixed(3)})`);
      coneGrad.addColorStop(1, `rgba(${sr}, ${sg}, ${sb}, 0)`);
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(-115, 0);
      ctx.lineTo(115, 0);
      ctx.lineTo(65, -105);
      ctx.lineTo(-65, -105);
      ctx.closePath();
      ctx.fill();

      ctx.scale(1.0, 0.78);
      ctx.rotate(-0.22);

      const ringPulse = 0.55 + 0.25 * Math.sin(this.time * 2.2);
      const ringBoost = 1.0 + this.hoverBoostHangar * 0.6 + this.hoverBoostStart * 0.5 + (this.isHoveringShip ? 0.45 : 0);

      // Dış Manyetik Platform Çemberi (Hafif neon parıltılı degrade)
      const outerColor = prog.heatLevel > 0 ? prog.heatColor : primaryColor;
      ctx.strokeStyle = outerColor;
      ctx.globalAlpha = Math.min(0.85, 0.22 * ringPulse * ringBoost);
      ctx.lineWidth = 1.6;
      ctx.shadowColor = outerColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 142, 34, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Dönen Siber Kalkan & Manyetik Hızlandırıcı Yayları (Yumuşak degrade uçlu)
      ctx.lineWidth = 2.0;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 10;
      for (let seg = 0; seg < 4; seg++) {
        const a0 = this.time * 0.45 + seg * (Math.PI / 2);
        const arcGrad = ctx.createLinearGradient(
          Math.cos(a0) * 122, Math.sin(a0) * 28,
          Math.cos(a0 + 0.8) * 122, Math.sin(a0 + 0.8) * 28
        );
        arcGrad.addColorStop(0, `rgba(${sr}, ${sg}, ${sb}, 0)`);
        arcGrad.addColorStop(0.5, `rgba(${sr}, ${sg}, ${sb}, ${(0.65 * ringPulse * ringBoost).toFixed(3)})`);
        arcGrad.addColorStop(1, `rgba(${sr}, ${sg}, ${sb}, 0)`);
        ctx.strokeStyle = arcGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 122, 28, 0, a0, a0 + 0.8);
        ctx.stroke();
      }

      // İç Rezonans Halkası (Hafif ve kesintisiz akışkan)
      ctx.shadowBlur = 4;
      ctx.strokeStyle = `rgba(${sr}, ${sg}, ${sb}, ${(0.22 * ringBoost).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 88, 20, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Merkez Enerji Çekirdeği
      ctx.strokeStyle = `rgba(255, 255, 255, ${(0.20 * ringPulse).toFixed(3)})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.ellipse(0, 0, 48, 11, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Aktif Nöral Yonga Modülleri (Seçenek 5: Takılı yongalar veya temel yuvalar)
      const chipsToRender = prog.activeChips.length > 0
        ? prog.activeChips
        : [
            { color: '#ff0055', branch: 'offense', isPlaceholder: true },
            { color: '#00f3ff', branch: 'defense', isPlaceholder: true },
            { color: '#fbbf24', branch: 'utility', isPlaceholder: true }
          ];

      for (let cIdx = 0; cIdx < chipsToRender.length; cIdx++) {
        const chip = chipsToRender[cIdx];
        const cAngle = -this.time * 0.75 + (cIdx / chipsToRender.length) * Math.PI * 2;
        const nx = Math.cos(cAngle) * 122;
        const ny = Math.sin(cAngle) * 28;

        ctx.save();
        ctx.globalAlpha = chip.isPlaceholder ? (0.35 + this.hoverBoostChips * 0.55) : (0.85 + 0.15 * Math.sin(this.time * 4 + cIdx));
        ctx.fillStyle = chip.color;
        ctx.shadowColor = chip.color;
        ctx.shadowBlur = chip.isPlaceholder ? 6 : 12;
        ctx.beginPath();
        ctx.arc(nx, ny, chip.isPlaceholder ? 3.0 : 4.4, 0, Math.PI * 2);
        ctx.fill();

        // Nöral Yonga Matrisi butonuna gelindiğinde merkeze veri hattı bağla (Seçenek 1)
        if (this.hoverBoostChips > 0.05 || !chip.isPlaceholder) {
          ctx.strokeStyle = chip.color;
          ctx.globalAlpha = (chip.isPlaceholder ? 0.35 : 0.45) * (0.35 + this.hoverBoostChips * 0.65);
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(nx * 0.42, ny * 0.42);
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.restore();

      // --- Arka Yörüngedeki Bakım Dronları (Gemi Arkasında Kalanlar - 3B Derinlik) ---
      const activeScan = this.hoverBoostHangar > 0.15 || this.isHoveringShip;
      for (const d of this.drones) {
        if (Math.sin(d.orbitPhase) < 0) {
          this.drawMaintenanceDrone(ctx, d, sx, sy, primaryColor, activeScan);
        }
      }

      // --- Volumetric Thruster Light Glow & Sparks (Egzoz Yönünde) ---
      const thrusterBoost = 1.0 + this.hoverBoostStart * 0.75 + (this.shipManeuverTimer > 0 ? 0.85 : 0);
      const thrusterDist = 48;
      const tx = sx - Math.cos(shipAngle) * thrusterDist;
      const ty = sy - Math.sin(shipAngle) * thrusterDist;

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const glowRadius = 90 * thrusterBoost;
      const glowGrad = ctx.createRadialGradient(tx, ty, 5, tx, ty, glowRadius);
      glowGrad.addColorStop(0, `rgba(${sr}, ${sg}, ${sb}, ${(0.38 * Math.min(1.5, thrusterBoost)).toFixed(3)})`);
      glowGrad.addColorStop(0.5, `rgba(${sr}, ${sg}, ${sb}, 0.14)`);
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(tx, ty, glowRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // --- Thruster Sparks ---
      const sparkChance = Math.min(0.98, 0.72 * thrusterBoost);
      if (Math.random() < sparkChance) {
        const speed = -(135 + Math.random() * 95) * thrusterBoost;
        this.thrusterParticles.push({
          x: tx + (Math.random() - 0.5) * 10,
          y: ty + (Math.random() - 0.5) * 10,
          vx: speed * Math.cos(shipAngle) + (Math.random() - 0.5) * 20,
          vy: speed * Math.sin(shipAngle) + (Math.random() - 0.5) * 20,
          size: (1.5 + Math.random() * 2.5) * (1 + this.hoverBoostStart * 0.3),
          color: Math.random() < 0.75 ? primaryColor : '#ffffff',
          life: 0.28,
          maxLife: 0.28
        });
      }

      for (let i = this.thrusterParticles.length - 1; i >= 0; i--) {
        const tp = this.thrusterParticles[i];
        tp.life -= dt;
        tp.x += tp.vx * dt;
        tp.y += tp.vy * dt;
        if (tp.life <= 0) {
          this.thrusterParticles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = tp.color;
        ctx.globalAlpha = tp.life / tp.maxLife;
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, tp.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      const t = this.time;
      const flicker = 0.85 + 0.15 * Math.sin(t * 35);
      const flameBaseLen = 22 * flicker * thrusterBoost;

      // --- Tamamen 3B Hacimsel Gemi Modeli Çizimi (360° Barrel Roll & Işıklandırma) ---
      this.renderTrue3DShip(ctx, sx, sy, shipClass, primaryColor, [sr, sg, sb], shipAngle, localRoll3D, localPitch3D, flameBaseLen);

      // --- Sol Menü Hover Kalkan / Nöral Matris / Hangar Tarama Efektleri (Seçenek 1) ---
      if (this.hoverBoostHangar > 0.04 || this.hoverBoostChips > 0.04 || this.hoverBoostCodex > 0.04) {
        ctx.save();
        ctx.translate(sx, sy);

        // Hangar Hover: Gemi üzerinde holografik eliptik enerji kalkanı parıltısı
        if (this.hoverBoostHangar > 0.04) {
          const shieldPulse = 0.85 + 0.15 * Math.sin(this.time * 4.0);
          ctx.strokeStyle = primaryColor;
          ctx.globalAlpha = this.hoverBoostHangar * 0.45 * shieldPulse;
          ctx.lineWidth = 1.6;
          ctx.shadowColor = primaryColor;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.ellipse(0, 0, 72, 60, shipAngle, 0, Math.PI * 2);
          ctx.stroke();

          // Dış ince telemetri parantezi
          ctx.lineWidth = 1.0;
          ctx.globalAlpha = this.hoverBoostHangar * 0.35;
          ctx.beginPath();
          ctx.arc(0, 0, 84, shipAngle - 0.5, shipAngle + 0.5);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, 84, shipAngle + Math.PI - 0.5, shipAngle + Math.PI + 0.5);
          ctx.stroke();
        }

        // Nöral Yonga / Yetenek Ağacı Hover: Altıgen Siber Senkronizasyon Dalgası
        if (this.hoverBoostChips > 0.04) {
          const hexRadius = 56 + ((this.time * 38) % 34);
          const hexAlpha = this.hoverBoostChips * (1.0 - ((hexRadius - 56) / 34)) * 0.75;
          ctx.strokeStyle = '#c084fc';
          ctx.globalAlpha = Math.max(0, hexAlpha);
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          for (let hIdx = 0; hIdx < 6; hIdx++) {
            const ha = this.time * 0.9 + (hIdx * Math.PI) / 3;
            const hx = Math.cos(ha) * hexRadius;
            const hy = Math.sin(ha) * hexRadius * 0.82;
            if (hIdx === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();
        }

        // Füzyon Kodeksi / Başarımlar Hover: Plazma Füzyon Küreleri
        if (this.hoverBoostCodex > 0.04) {
          for (let orb = 0; orb < 3; orb++) {
            const oa = this.time * 3.2 + (orb * Math.PI * 2) / 3;
            const ox = Math.cos(oa) * 62;
            const oy = Math.sin(oa) * 48;
            ctx.fillStyle = orb === 0 ? '#ff0055' : (orb === 1 ? '#00f3ff' : '#fbbf24');
            ctx.globalAlpha = this.hoverBoostCodex * 0.85;
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(ox, oy, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
      }

      // --- Ön Yörüngedeki Bakım Dronları (Gemi Önünde Kalanlar - 3B Derinlik) ---
      for (const d of this.drones) {
        if (Math.sin(d.orbitPhase) >= 0) {
          this.drawMaintenanceDrone(ctx, d, sx, sy, primaryColor, activeScan);
        }
      }
    }

    updateAndDrawAsteroids(dt) {
      const ctx = this.ctx;
      this.lockedAsteroid = null;

      for (let i = 0; i < this.asteroids.length; i++) {
        const a = this.asteroids[i];
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.rot += a.rotSpeed * dt;

        // Wrap around boundaries smoothly off-screen
        if (a.x < -a.radius - 40) {
          a.x = this.width + a.radius + 40;
          a.y = Math.random() * this.height;
        } else if (a.x > this.width + a.radius + 50 && a.vx > 0) {
          a.x = -a.radius - 40;
          a.y = Math.random() * this.height;
        }
        if (a.y < -a.radius - 40) a.y = this.height + a.radius + 40;
        if (a.y > this.height + a.radius + 40) a.y = -a.radius - 40;

        // Check hover
        const distToMouse = Math.hypot(this.mouse.x - a.x, this.mouse.y - a.y);
        const isHovered = this.mouse.isHovering && distToMouse <= a.radius + 14;
        if (isHovered && !this.lockedAsteroid) {
          this.lockedAsteroid = a;
        }

        // Draw 3D Shaded Asteroid
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rot);

        // Spherical ambient lighting (lit from top-right planet light, shadowed bottom-left)
        const rockGrad = ctx.createRadialGradient(
          a.radius * 0.35, -a.radius * 0.35, a.radius * 0.1,
          0, 0, a.radius * 1.05
        );
        rockGrad.addColorStop(0, a.baseColorLight);
        rockGrad.addColorStop(0.55, a.baseColorDark);
        rockGrad.addColorStop(1, '#020408');

        ctx.fillStyle = rockGrad;
        ctx.strokeStyle = isHovered ? '#ffffff' : a.neonColor;
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        if (isHovered) {
          ctx.shadowColor = a.neonColor;
          ctx.shadowBlur = 14;
        }

        ctx.beginPath();
        for (let p = 0; p < a.vertices.length; p++) {
          const pt = a.vertices[p];
          if (p === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Craters with shadows
        for (const c of a.craters) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.restore();

        // Minimalist Target Corners if Hovered (No tacky text)
        if (isHovered) {
          ctx.save();
          ctx.translate(a.x, a.y);
          ctx.strokeStyle = a.neonColor;
          ctx.lineWidth = 1.5;
          const boxSize = a.radius + 10;
          const len = 8;

          ctx.beginPath();
          // Top-Left
          ctx.moveTo(-boxSize, -boxSize + len); ctx.lineTo(-boxSize, -boxSize); ctx.lineTo(-boxSize + len, -boxSize);
          // Top-Right
          ctx.moveTo(boxSize - len, -boxSize); ctx.lineTo(boxSize, -boxSize); ctx.lineTo(boxSize, -boxSize + len);
          // Bottom-Right
          ctx.moveTo(boxSize, boxSize - len); ctx.lineTo(boxSize, boxSize); ctx.lineTo(boxSize - len, boxSize);
          // Bottom-Left
          ctx.moveTo(-boxSize + len, boxSize); ctx.lineTo(-boxSize, boxSize); ctx.lineTo(-boxSize, boxSize - len);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    updateAndDrawFX(dt) {
      const ctx = this.ctx;

      // Gemi ateşleme gösterisi mermileri (Seçenek 3)
      for (let i = this.showcaseProjectiles.length - 1; i >= 0; i--) {
        const prj = this.showcaseProjectiles[i];
        prj.life -= dt;
        prj.x += prj.vx * dt;
        prj.y += prj.vy * dt;

        if (prj.life <= 0 || prj.x < -50 || prj.x > this.width + 50 || prj.y < -50 || prj.y > this.height + 50) {
          this.showcaseProjectiles.splice(i, 1);
          continue;
        }

        // Göktaşına isabet kontrolü
        let hitAst = false;
        for (let aIdx = this.asteroids.length - 1; aIdx >= 0; aIdx--) {
          const ast = this.asteroids[aIdx];
          if (Math.hypot(prj.x - ast.x, prj.y - ast.y) <= ast.radius + 8) {
            this.asteroids.splice(aIdx, 1);
            this.shatterAsteroid(ast, prj.x, prj.y);
            this.asteroids.push(this.createAsteroid(true));
            hitAst = true;
            break;
          }
        }
        if (hitAst) {
          this.showcaseProjectiles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(prj.x, prj.y);
        ctx.rotate(prj.angle);
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowColor = prj.glowColor;
        ctx.shadowBlur = 12;
        ctx.fillStyle = prj.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Plazma Ateş Topu ve Çekirdek Patlama Işığı (Explosions)
      for (let i = this.explosions.length - 1; i >= 0; i--) {
        const exp = this.explosions[i];
        exp.life -= dt;
        if (exp.life <= 0) {
          this.explosions.splice(i, 1);
          continue;
        }

        const t = 1 - exp.life / exp.maxLife;
        const r = exp.radius + (exp.maxRadius - exp.radius) * t;
        const alpha = Math.max(0, exp.life / exp.maxLife);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.25, exp.color);
        grad.addColorStop(0.65, 'rgba(255, 120, 0, ' + (alpha * 0.75) + ')');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Shockwaves
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.life -= dt;
        if (sw.life <= 0) {
          this.shockwaves.splice(i, 1);
          continue;
        }
        const progress = 1 - sw.life / sw.maxLife;
        const curRadius = sw.radius + (sw.maxRadius - sw.radius) * progress;
        ctx.save();
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = Math.max(1, 3 * (1 - progress));
        ctx.globalAlpha = sw.life / sw.maxLife;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, curRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Shard & Spark Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94;
        p.vy *= 0.94;
        if (p.isShard) p.rot += p.rotSpeed * dt;

        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        if (p.isShard) {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot || 0);
          ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Floating Texts (+1 🔩 HURDA)
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.life -= dt;
        ft.y -= 35 * dt;
        if (ft.life <= 0) {
          this.floatingTexts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = ft.life / ft.maxLife;
        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 6;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }
    }

    drawCrosshair() {
      if (!this.mouse.isHovering) return;
      if (this.width > 960 && this.mouse.x < 490) return; // Do not draw crosshair over the dock
      const ctx = this.ctx;
      const mx = this.mouse.x;
      const my = this.mouse.y;

      ctx.save();
      ctx.strokeStyle = this.lockedAsteroid ? '#ff0055' : 'rgba(0, 243, 255, 0.70)';
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.arc(mx, my, 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(mx - 13, my); ctx.lineTo(mx - 4, my);
      ctx.moveTo(mx + 4, my); ctx.lineTo(mx + 13, my);
      ctx.moveTo(mx, my - 13); ctx.lineTo(mx, my - 4);
      ctx.moveTo(mx, my + 4); ctx.lineTo(mx, my + 13);
      ctx.stroke();

      ctx.restore();
    }
  }

  window.ZortexMenuShowcase = new MenuShowcaseEngine();
})();
