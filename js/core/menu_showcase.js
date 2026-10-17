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
      this.particles = [];
      this.shockwaves = [];
      this.floatingTexts = [];
      this.starDust = [];
      this.thrusterParticles = [];

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

      this.isInitialized = true;
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
        if (this.isPointOnPlanet(this.mouse.x, this.mouse.y)) {
          this.canvas.style.cursor = 'grab';
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
      if (!this.isDraggingPlanet && this.canvas) {
        this.canvas.style.cursor = 'crosshair';
      }
    }

    onPointerDown(e) {
      if (!this.canvas) return;
      const clickX = e.clientX;
      const clickY = e.clientY;

      // Do not handle clicks that fall inside the left dock panel
      if (this.width > 960 && clickX < 490) return;

      let hitTarget = null;
      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const a = this.asteroids[i];
        const dist = Math.hypot(clickX - a.x, clickY - a.y);
        if (dist <= a.radius + 14) {
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
      if (window.audio && typeof window.audio.playLaser === 'function') {
        window.audio.playLaser(1.4);
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
      if (window.audio && typeof window.audio.playExplosion === 'function') {
        window.audio.playExplosion(0.85);
      }
      if (window.audio && typeof window.audio.playZap === 'function') {
        window.audio.playZap();
      }

      // Expanding Shockwave Ripple
      this.shockwaves.push({
        x: ast.x,
        y: ast.y,
        radius: 8,
        maxRadius: ast.radius * 2.8,
        color: ast.neonColor,
        life: 0.45,
        maxLife: 0.45
      });

      // Rock Shards & Fiery Plasma Sparks
      const shardCount = 24 + Math.floor(Math.random() * 10);
      for (let i = 0; i < shardCount; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 60 + Math.random() * 190;
        this.particles.push({
          x: ast.x,
          y: ast.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 12,
          color: Math.random() < 0.65 ? ast.neonColor : (Math.random() < 0.5 ? '#ffffff' : '#f97316'),
          size: 2 + Math.random() * (ast.radius * 0.24),
          life: 0.5 + Math.random() * 0.4,
          maxLife: 0.9,
          isShard: Math.random() < 0.5
        });
      }

      // Scrap increment & Sleek Floating Text
      const scrapBonus = ast.isRare ? 3 : 1;
      if (typeof meta !== 'undefined' && meta) {
        meta.scrap = (meta.scrap || 0) + scrapBonus;
        if (typeof updateMenuScrapDisplay === 'function') updateMenuScrapDisplay();
        if (typeof saveMeta === 'function') saveMeta();
      }

      this.floatingTexts.push({
        x: ast.x,
        y: ast.y - 12,
        text: `+${scrapBonus} 🔩 HURDA`,
        color: ast.isRare ? '#ff0055' : '#ffe600',
        life: 1.1,
        maxLife: 1.1
      });
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

      this.time += dt;

      // 1. Draw Deep Space Celestial Atmosphere
      this.drawDeepCosmos();

      // 2. Draw Parallax Star Dust
      this.updateAndDrawStarDust(dt);

      // 3. Draw Celestial Planet & Atmosphere
      this.drawCelestialPlanet(dt);

      // 4. Draw Floating Player Ship
      this.drawShowcaseShip(dt);

      // 5. Update & Draw 3D-Shaded Asteroids
      this.updateAndDrawAsteroids(dt);

      // 6. Update & Draw FX Particles & Shockwaves
      this.updateAndDrawFX(dt);

      // 7. Draw Sleek Targeting Reticle
      this.drawCrosshair();
    }

    drawDeepCosmos() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;

      // Deep void background fill
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      // Atmospheric Nebula Clusters (Soft volumetric clouds)
      const grad1 = ctx.createRadialGradient(w * 0.75, h * 0.45, 40, w * 0.75, h * 0.45, w * 0.55);
      grad1.addColorStop(0, 'rgba(15, 23, 62, 0.45)');
      grad1.addColorStop(0.5, 'rgba(30, 15, 60, 0.20)');
      grad1.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, w, h);

      const grad2 = ctx.createRadialGradient(w * 0.40, h * 0.85, 20, w * 0.40, h * 0.85, w * 0.45);
      grad2.addColorStop(0, 'rgba(0, 243, 255, 0.08)');
      grad2.addColorStop(0.6, 'rgba(120, 10, 150, 0.06)');
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
      for (const s of this.starDust) {
        s.x -= s.speed * dt;
        if (s.x < -10) {
          s.x = this.width + 10;
          s.y = Math.random() * this.height;
        }

        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha * (0.65 + 0.35 * Math.sin(this.time * 2.5 + s.x));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    }

    drawShowcaseShip(dt) {
      const ctx = this.ctx;
      const shipClass = (typeof selectedShipClass !== 'undefined' && selectedShipClass) ? selectedShipClass : this.shipClassId;
      const shipStats = (typeof SHIP_CLASSES !== 'undefined' && SHIP_CLASSES[shipClass]) ? SHIP_CLASSES[shipClass] : { name: 'İntihar Avcısı', color: '#00f3ff' };

      // Ship anchor coordinates (balanced in the open space of the right side)
      const cx = this.width > 960 ? this.width * 0.66 : this.width * 0.50;
      const cy = this.height * 0.52;

      // Gentle floating kinematics (slow, majestic oscillation)
      const floatY = Math.sin(this.time * 1.1) * 7;
      const rollAngle = Math.sin(this.time * 0.8) * 0.04;
      const shipAngle = -Math.PI / 6 + rollAngle; // 60 derece açılı yönelim (derinlik perspektifi)

      const sx = cx;
      const sy = cy + floatY;

      // --- Holographic Base Telemetry Ring (3D Perspektif Eğimli) ---
      ctx.save();
      ctx.translate(cx, cy + 95);
      ctx.scale(1.0, 0.78);
      const ringPulse = 0.45 + 0.25 * Math.sin(this.time * 2.2);
      ctx.strokeStyle = `rgba(0, 243, 255, ${ringPulse * 0.45})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 125, 28, -0.22, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 243, 255, 0.18)';
      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -this.time * 18;
      ctx.beginPath();
      ctx.ellipse(0, 0, 90, 20, -0.22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // --- Volumetric Thruster Light Glow & Sparks (Egzoz Yönünde) ---
      const thrusterDist = 46;
      const tx = sx - Math.cos(shipAngle) * thrusterDist;
      const ty = sy - Math.sin(shipAngle) * thrusterDist;

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const glowGrad = ctx.createRadialGradient(tx, ty, 5, tx, ty, 90);
      glowGrad.addColorStop(0, 'rgba(0, 243, 255, 0.35)');
      glowGrad.addColorStop(0.5, 'rgba(0, 153, 255, 0.12)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(tx, ty, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // --- Thruster Sparks ---
      if (Math.random() < 0.70) {
        const speed = -(130 + Math.random() * 90);
        this.thrusterParticles.push({
          x: tx + (Math.random() - 0.5) * 10,
          y: ty + (Math.random() - 0.5) * 10,
          vx: speed * Math.cos(shipAngle) + (Math.random() - 0.5) * 20,
          vy: speed * Math.sin(shipAngle) + (Math.random() - 0.5) * 20,
          size: 1.5 + Math.random() * 2.5,
          color: Math.random() < 0.75 ? shipStats.color || '#00f3ff' : '#ffffff',
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
      const flameBaseLen = 22 * flicker;

      const drawFlame = (fx, fy, flen, fwidth, outerCol, innerCol) => {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = outerCol;
        ctx.beginPath();
        ctx.moveTo(fx, fy - fwidth * 0.5);
        ctx.lineTo(fx - flen, fy);
        ctx.lineTo(fx, fy + fwidth * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = innerCol;
        ctx.beginPath();
        ctx.moveTo(fx, fy - fwidth * 0.25);
        ctx.lineTo(fx - flen * 0.55, fy);
        ctx.lineTo(fx, fy + fwidth * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };

      // --- Retrieve In-Game Ship Texture ---
      let tex = null;
      try {
        if (typeof window.getShipTexture === 'function') {
          tex = window.getShipTexture(shipClass);
        } else if (typeof pixiTextures !== 'undefined' && pixiTextures) {
          tex = pixiTextures['ship_' + shipClass] || pixiTextures.ship_interceptor;
        }
      } catch (e) {}

      let drawnTexture = false;
      if (tex && tex.source && tex.source.resource) {
        const res = tex.source.resource;
        const frame = tex.frame || { x: 0, y: 0, width: res.width, height: res.height };
        const fw = frame.width || res.width;
        const fh = frame.height || res.height;
        if (fw > 0 && fh > 0) {
          // Thruster flames behind the sprite
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(shipAngle);
          ctx.scale(1.0, 0.88); // 3D derinlik
          drawFlame(-48, -10, flameBaseLen * 1.1, 6.5, shipStats.color || '#00f3ff', '#ffffff');
          drawFlame(-52, 0, flameBaseLen * 1.4, 8, '#00f3ff', '#ffffff');
          drawFlame(-48, 10, flameBaseLen * 1.1, 6.5, shipStats.color || '#00f3ff', '#ffffff');
          ctx.restore();

          // Render sprite (60 derece açılı ve 3B derinlikli gölge & perspektif)
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(shipAngle + Math.PI / 2);
          ctx.scale(1.0, 0.88); // 3D derinlik perspektifi
          ctx.shadowColor = 'rgba(0, 0, 0, 0.50)';
          ctx.shadowBlur = 18;
          ctx.shadowOffsetY = 14;
          const drawW = 120;
          const drawH = drawW * (fh / fw);
          ctx.drawImage(res, frame.x, frame.y, fw, fh, -drawW / 2, -drawH / 2, drawW, drawH);
          ctx.restore();
          drawnTexture = true;
        }
      }

      // --- Fallback to Vector Geometry if texture is not ready ---
      if (!drawnTexture) {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(shipAngle);
        ctx.scale(2.2, 1.95); // 3D derinlik perspektifi

        if (shipClass === 'titan') {
          drawFlame(-16, -11, flameBaseLen * 0.85, 6, '#ff5500', '#ffe600');
          drawFlame(-18, -4, flameBaseLen * 1.1, 7, '#ff7700', '#ffffff');
          drawFlame(-18, 4, flameBaseLen * 1.1, 7, '#ff7700', '#ffffff');
          drawFlame(-16, 11, flameBaseLen * 0.85, 6, '#ff5500', '#ffe600');

          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#ffb300';
          ctx.lineWidth = 2.2;
          ctx.shadowColor = '#ffb300';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(22, 0); ctx.lineTo(16, -9); ctx.lineTo(6, -18); ctx.lineTo(-6, -21); ctx.lineTo(-17, -15);
          ctx.lineTo(-14, -8); ctx.lineTo(-19, 0); ctx.lineTo(-14, 8); ctx.lineTo(-17, 15); ctx.lineTo(-6, 21);
          ctx.lineTo(6, 18); ctx.lineTo(16, 9); ctx.closePath();
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = '#ffe600';
          ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
        } else if (shipClass === 'spectre') {
          drawFlame(-13, -6, flameBaseLen * 0.9, 5, '#a855f7', '#00ffcc');
          drawFlame(-15, 0, flameBaseLen * 1.25, 7, '#c084fc', '#ffffff');
          drawFlame(-13, 6, flameBaseLen * 0.9, 5, '#a855f7', '#00ffcc');

          ctx.fillStyle = '#0a0518';
          ctx.strokeStyle = '#bd00ff';
          ctx.lineWidth = 2.2;
          ctx.shadowColor = '#bd00ff';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(27, 0); ctx.lineTo(12, -7); ctx.lineTo(18, -21); ctx.lineTo(8, -17); ctx.lineTo(-5, -12);
          ctx.lineTo(-14, -8); ctx.lineTo(-10, 0); ctx.lineTo(-14, 8); ctx.lineTo(-5, 12); ctx.lineTo(8, 17);
          ctx.lineTo(18, 21); ctx.lineTo(12, 7); ctx.closePath();
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = '#00ffcc';
          ctx.beginPath(); ctx.ellipse(4, 0, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        } else {
          // Interceptor / default
          drawFlame(-15, -6, flameBaseLen * 0.8, 4.5, '#0099ff', '#00f3ff');
          drawFlame(-17, 0, flameBaseLen * 1.3, 8, '#00f3ff', '#ffffff');
          drawFlame(-15, 6, flameBaseLen * 0.8, 4.5, '#0099ff', '#00f3ff');

          ctx.fillStyle = '#060e20';
          ctx.strokeStyle = shipStats.color || '#00f3ff';
          ctx.lineWidth = 2.2;
          ctx.shadowColor = shipStats.color || '#00f3ff';
          ctx.shadowBlur = 12;

          ctx.beginPath();
          ctx.moveTo(27, 0); ctx.lineTo(8, -6); ctx.lineTo(4, -18); ctx.lineTo(-15, -16); ctx.lineTo(-10, -7);
          ctx.lineTo(-17, 0); ctx.lineTo(-10, 7); ctx.lineTo(-15, 16); ctx.lineTo(4, 18); ctx.lineTo(8, 6);
          ctx.closePath();
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = '#ff007f';
          ctx.beginPath(); ctx.ellipse(3, 0, 8, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
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
