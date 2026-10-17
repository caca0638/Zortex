/**
 * ZORTEX: CYBER SURVIVOR - FX ARCHITECTURE & QUALITY MANAGER
 * window.ZortexFX Core Framework & Layered Bloom Manager
 * Phase 1: Selective Emissive Layer & AdvancedBloomFilter
 */
(function() {
  'use strict';

  class QualityManager {
    constructor() {
      this.tiers = ['low', 'medium', 'high', 'ultra'];
      this.currentTier = 'high';
      this.isAdaptive = true;

      // Settings map per quality tier
      this.configs = {
        low: {
          bloom: false,
          bloomThreshold: 0.25,
          bloomScale: 0.5,
          bloomResolution: 0.25,
          blur: 4,
          quality: 2,
          maxParticles: 150,
          nebulaProcedural: false,
          parallaxLayers: 2,
          filmGrain: false,
          rgbSplit: false,
          shockwave: false
        },
        medium: {
          bloom: true,
          bloomThreshold: 0.15,
          bloomScale: 0.65,
          bloomResolution: 0.35,
          blur: 5,
          quality: 3,
          maxParticles: 250,
          nebulaProcedural: true,
          parallaxLayers: 3,
          filmGrain: false,
          rgbSplit: true,
          shockwave: true
        },
        high: {
          bloom: true,
          bloomThreshold: 0.08,
          bloomScale: 0.80,
          bloomResolution: 0.50,
          blur: 6,
          quality: 4,
          maxParticles: 400,
          nebulaProcedural: true,
          parallaxLayers: 4,
          filmGrain: true,
          rgbSplit: true,
          shockwave: true
        },
        ultra: {
          bloom: true,
          bloomThreshold: 0.02,
          bloomScale: 1.0,
          bloomResolution: 0.65,
          blur: 7,
          quality: 4,
          maxParticles: 600,
          nebulaProcedural: true,
          parallaxLayers: 5,
          filmGrain: true,
          rgbSplit: true,
          shockwave: true
        }
      };

      // Adaptive watchdog
      this.fpsHistory = [];
      this.sampleInterval = 0;
      this.minFpsFloor = 50;

      // Accessibility: Reduce flashing & harsh shockwaves
      this.reduceFlashing = false;
    }

    setTier(tier) {
      if (this.configs[tier]) {
        this.currentTier = tier;
        this.applyTierConfig();
        if (window.gameSettings && window.gameSettings.graphicsQuality !== tier) {
          window.gameSettings.graphicsQuality = tier;
          if (typeof window.saveSettings === 'function') window.saveSettings();
        }
      }
    }

    get config() {
      return this.configs[this.currentTier] || this.configs.high;
    }

    applyTierConfig() {
      if (window.ZortexFX && window.ZortexFX.emit) {
        window.ZortexFX.emit('qualityChanged', this.config);
      }
    }

    updateWatchdog(rawDt, fps) {
      if (!this.isAdaptive) return;
      this.sampleInterval += rawDt;
      if (this.sampleInterval < 1.0) return;
      this.sampleInterval = 0;

      this.fpsHistory.push(fps);
      if (this.fpsHistory.length > 5) this.fpsHistory.shift();

      const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
      if (avgFps < 48 && this.currentTier !== 'low') {
        const curIdx = this.tiers.indexOf(this.currentTier);
        if (curIdx > 0) {
          this.setTier(this.tiers[curIdx - 1]);
          console.log(`[ZortexFX] Adaptive downscale to: ${this.currentTier} (Avg FPS: ${avgFps.toFixed(1)})`);
        }
      } else if (avgFps >= 58 && this.fpsHistory.length >= 5) {
        const curIdx = this.tiers.indexOf(this.currentTier);
        if (curIdx < this.tiers.length - 1 && this.currentTier !== 'ultra') {
          this.setTier(this.tiers[curIdx + 1]);
          console.log(`[ZortexFX] Adaptive upscale to: ${this.currentTier} (Avg FPS: ${avgFps.toFixed(1)})`);
        }
      }
    }
  }

  class FXRegistry {
    constructor() {
      this.effects = new Map();
      this.listeners = new Map();
      this.metrics = {
        enemyCount: 0,
        bulletCount: 0,
        particleCount: 0,
        fps: 0,
        frameTime: 0
      };
    }

    register(name, instance) {
      this.effects.set(name, instance);
    }

    get(name) {
      return this.effects.get(name);
    }

    on(event, callback) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }

    emit(event, data) {
      const list = this.listeners.get(event);
      if (list) {
        for (let cb of list) {
          try { cb(data); } catch (e) { console.warn(`[ZortexFX] Event listener error:`, e); }
        }
      }
    }

    updateMetrics(data) {
      Object.assign(this.metrics, data);
    }
  }

  class BloomManager {
    constructor() {
      this.filter = null;
      this.emissiveLayer = null;
      this.isInitialized = false;
    }

    setup(emissiveLayer, app) {
      if (!emissiveLayer || this.isInitialized) return;
      this.emissiveLayer = emissiveLayer;

      try {
        if (window.PIXI_FILTERS && window.PIXI_FILTERS.AdvancedBloomFilter) {
          const cfg = window.ZortexFX.quality.config;
          this.filter = new window.PIXI_FILTERS.AdvancedBloomFilter({
            threshold: cfg.bloomThreshold,
            bloomScale: cfg.bloomScale,
            blur: cfg.blur || 6,
            quality: cfg.quality || 4
          });

          // Emissive layer moves in worldContainer space; filters handle its bounds automatically
          this.emissiveLayer.filterArea = null;

          if (cfg.bloom) {
            this.filter.resolution = cfg.bloomResolution;
            this.emissiveLayer.filters = [this.filter];
          } else {
            this.emissiveLayer.filters = [];
          }

          this.isInitialized = true;
          console.log('[ZortexFX] AdvancedBloomFilter attached selectively to emissiveLayer.');
        } else {
          console.warn('[ZortexFX] PIXI_FILTERS.AdvancedBloomFilter not found. Falling back to non-filtered emissive rendering.');
        }
      } catch (err) {
        console.error('[ZortexFX] Failed to initialize AdvancedBloomFilter:', err);
      }

      // Listen for quality / config changes
      window.ZortexFX.on('qualityChanged', (cfg) => this.onQualityChanged(cfg));
      window.ZortexFX.on('bloomConfigChanged', (cfg) => this.onBloomConfigChanged(cfg));
    }

    onQualityChanged(cfg) {
      if (!this.filter || !this.emissiveLayer) return;
      try {
        if (cfg.bloom) {
          this.filter.threshold = cfg.bloomThreshold;
          this.filter.bloomScale = cfg.bloomScale;
          this.filter.resolution = cfg.bloomResolution;
          this.emissiveLayer.filters = [this.filter];
        } else {
          this.emissiveLayer.filters = [];
        }
      } catch (e) {
        console.warn('[ZortexFX] Bloom onQualityChanged error:', e);
      }
    }

    onBloomConfigChanged(cfg) {
      if (!this.filter) return;
      try {
        if (typeof cfg.bloomThreshold === 'number') this.filter.threshold = cfg.bloomThreshold;
        if (typeof cfg.bloomScale === 'number') this.filter.bloomScale = cfg.bloomScale;
      } catch (e) {
        console.warn('[ZortexFX] Bloom onBloomConfigChanged error:', e);
      }
    }

    // [FX] FAZ 7: Ses-Görsel Senkronizasyon (Sub-Bass Modülasyonu)
    modulateAudio(pulse, isBoss = false) {
      if (!this.filter) return;
      const cfg = window.ZortexFX ? window.ZortexFX.quality.config : null;
      if (!cfg || !cfg.bloom) return;
      const base = (typeof cfg.bloomScale === 'number') ? cfg.bloomScale : 0.8;
      if (pulse <= 0.01) {
        this.filter.bloomScale = base;
        return;
      }
      // Max modülasyon: ±15% (Boss savaşında ±20%)
      const maxSwing = isBoss ? 0.20 : 0.15;
      const reduceFlashing = window.ZortexFX && window.ZortexFX.quality ? window.ZortexFX.quality.reduceFlashing : false;
      const swing = reduceFlashing ? (maxSwing * 0.3) : maxSwing;
      const delta = (pulse - 0.20) * 1.6;
      const mod = Math.max(1.0 - swing, Math.min(1.0 + swing, 1.0 + delta * swing));
      this.filter.bloomScale = base * mod;
    }
  }

  class NebulaManager {
    constructor() {
      this.sprite = null;
      this.filter = null;
      this.container = null;
      this.time = 0;
      this.intensity = 0.36;
      this.speed = 0.85;
      this.audioPulse = 0.0;
      this.isInitialized = false;

      // [FAZ 2] Biyom-Adaptif Paletler (Dalga 1-3 İstasyon, 4-6 Bulutsu, 7-9 Kara Delik, 10 Boss)
      this.palettes = {
        biome1: { // Dalga 1-3: Terk Edilmiş İstasyon (Derin Lacivert / Camgöbeği)
          a: [0.02, 0.05, 0.18],
          b: [0.01, 0.12, 0.22],
          c: [0.00, 0.16, 0.20]
        },
        biome2: { // Dalga 4-6: Plazma Bulutsusu (Mor / Eflatun / Zümrüt)
          a: [0.10, 0.02, 0.22],
          b: [0.22, 0.03, 0.24],
          c: [0.02, 0.15, 0.12]
        },
        biome3: { // Dalga 7-9: Kara Delik Yörüngesi (Obsidiyen / Kızıl / Amber)
          a: [0.18, 0.03, 0.05],
          b: [0.20, 0.08, 0.01],
          c: [0.08, 0.01, 0.12]
        },
        boss: { // Dalga 10 / Boss Savaşları: Kıyamet Kırmızısı / Altın
          a: [0.28, 0.02, 0.05],
          b: [0.25, 0.10, 0.01],
          c: [0.18, 0.01, 0.02]
        }
      };

      this.currentA = [0.03, 0.06, 0.20];
      this.currentB = [0.15, 0.04, 0.28];
      this.currentC = [0.01, 0.10, 0.22];
    }

    setup(nebulaContainer, app) {
      if (!nebulaContainer || !app || this.isInitialized) return;
      this.container = nebulaContainer;

      try {
        if (typeof PIXI.GlProgram !== 'function' || typeof PIXI.Filter !== 'function') {
          console.warn('[ZortexFX] PIXI GlProgram not available. Skipping procedural nebula.');
          return;
        }

        const vert = `
          in vec2 aPosition;
          out vec2 vTextureCoord;
          uniform vec4 uInputSize;
          uniform vec4 uOutputFrame;
          uniform vec4 uOutputTexture;

          void main(void) {
            vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
            position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
            position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
            gl_Position = vec4(position, 0.0, 1.0);
            vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
          }
        `;

        const frag = `
          precision highp float;
          in vec2 vTextureCoord;
          out vec4 finalColor;

          uniform float uTime;
          uniform vec2 uResolution;
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          uniform vec3 uColorC;
          uniform float uIntensity;

          float hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }

          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
          }

          float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            mat2 rot = mat2(0.877, 0.479, -0.479, 0.877);
            for (int i = 0; i < 4; i++) {
              v += a * noise(p);
              p = rot * p * 2.0 + vec2(10.0);
              a *= 0.5;
            }
            return v;
          }

          void main(void) {
            vec2 p = (vTextureCoord - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 2.2;
            vec2 q = vec2(fbm(p + vec2(0.0, uTime * 0.015)), fbm(p + vec2(5.2, 1.3)));
            vec2 r = vec2(fbm(p + 2.5 * q + vec2(1.7, 9.2) + 0.02 * uTime),
                          fbm(p + 2.5 * q + vec2(8.3, 2.8) + 0.015 * uTime));
            float f = fbm(p + 3.0 * r);

            vec3 col = mix(uColorA, uColorB, clamp(f * f * 2.5, 0.0, 1.0));
            col = mix(col, uColorC, clamp(length(q), 0.0, 1.0));

            // Low luminance floor for entity readability (Prompt requirement: background stays darker than entities)
            float mask = smoothstep(0.12, 0.82, f);
            float alpha = mask * uIntensity;

            finalColor = vec4(col * alpha, alpha);
          }
        `;

        const glProgram = PIXI.GlProgram.from({
          vertex: vert,
          fragment: frag,
          name: 'procedural-nebula'
        });

        const screenW = app.screen.width || 1280;
        const screenH = app.screen.height || 720;

        this.filter = new PIXI.Filter({
          glProgram: glProgram,
          resources: {
            nebulaUniforms: {
              uTime: { value: 0.0, type: 'f32' },
              uResolution: { value: [screenW, screenH], type: 'vec2<f32>' },
              uColorA: { value: this.currentA, type: 'vec3<f32>' },
              uColorB: { value: this.currentB, type: 'vec3<f32>' },
              uColorC: { value: this.currentC, type: 'vec3<f32>' },
              uIntensity: { value: this.intensity, type: 'f32' }
            }
          }
        });

        const cfg = window.ZortexFX.quality.config;
        this.filter.resolution = (cfg && cfg.bloomResolution) ? cfg.bloomResolution : 0.5;

        // Quad sprite covers the viewport plus camera panning margin
        this.sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.sprite.width = screenW + 400;
        this.sprite.height = screenH + 400;
        this.sprite.x = -200;
        this.sprite.y = -200;
        this.sprite.blendMode = 'add';
        this.sprite.filters = [this.filter];

        this.sprite.visible = Boolean(cfg.nebulaProcedural);

        nebulaContainer.addChildAt(this.sprite, 0);
        this.isInitialized = true;
        console.log('[ZortexFX] Procedural fbm Nebula initialized at half-resolution.');
      } catch (err) {
        console.warn('[ZortexFX] Procedural Nebula initialization skipped:', err);
      }

      window.ZortexFX.on('qualityChanged', (cfg) => this.onQualityChanged(cfg));
    }

    onQualityChanged(cfg) {
      if (!this.sprite) return;
      this.sprite.visible = Boolean(cfg.nebulaProcedural);
      if (this.filter && cfg.bloomResolution) {
        this.filter.resolution = cfg.bloomResolution;
      }
    }

    update(dt, currentWave = 1, isBoss = false, curCamX = 0, curCamY = 0) {
      if (!this.filter || !this.isInitialized || !this.sprite.visible) return;

      this.time += dt * this.speed;
      const uniforms = this.filter.resources.nebulaUniforms.uniforms;
      uniforms.uTime = this.time;

      // Subtle parallax offset for Layer 0 (0.03 factor)
      this.sprite.x = -200 + (1.0 - 0.03) * curCamX;
      this.sprite.y = -200 + (1.0 - 0.03) * curCamY;

      // [FAZ 2] Biyom ve Boss Durumuna Göre Hedef Palet Seçimi
      let target = this.palettes.biome1;
      if (isBoss) {
        target = this.palettes.boss;
      } else if (currentWave <= 3) {
        target = this.palettes.biome1;
      } else if (currentWave <= 6) {
        target = this.palettes.biome2;
      } else if (currentWave <= 9) {
        target = this.palettes.biome3;
      } else {
        target = this.palettes.boss;
      }

      // Smooth lerp color transition
      const lerpSpeed = Math.min(1.0, dt * 1.8);
      for (let i = 0; i < 3; i++) {
        this.currentA[i] += (target.a[i] - this.currentA[i]) * lerpSpeed;
        this.currentB[i] += (target.b[i] - this.currentB[i]) * lerpSpeed;
        this.currentC[i] += (target.c[i] - this.currentC[i]) * lerpSpeed;
      }

      uniforms.uColorA = this.currentA;
      uniforms.uColorB = this.currentB;
      uniforms.uColorC = this.currentC;

      // [FX] FAZ 7: Ses-Görsel Modülasyonu (Sub-Bass ile Parlaklık Nabzı)
      let finalIntensity = this.intensity;
      if (typeof this.audioPulse === 'number' && this.audioPulse > 0.01) {
        const maxSwing = isBossActive ? 0.20 : 0.15;
        const reduceFlashing = window.ZortexFX && window.ZortexFX.quality ? window.ZortexFX.quality.reduceFlashing : false;
        const swing = reduceFlashing ? (maxSwing * 0.3) : maxSwing;
        const delta = (this.audioPulse - 0.20) * 1.6;
        const mod = Math.max(1.0 - swing, Math.min(1.0 + swing, 1.0 + delta * swing));
        finalIntensity *= mod;
      }
      uniforms.uIntensity = finalIntensity;
    }
  }

  class TrailFXManager {
    constructor() {
      this.playerRope = null;
      this.playerPoints = [];
      this.playerPointCount = 20;
      this.playerBaseWidth = 16;
      this.playerHistory = [];

      this.bulletRopes = [];
      this.bulletRopeCount = 16;
      this.bulletPointCount = 7;
      this.container = null;
      this.isInitialized = false;
      this.enabled = true;
    }

    setup(container, app) {
      if (!container || !app || this.isInitialized) return;
      this.container = container;

      try {
        if (typeof PIXI.MeshRope !== 'function' || !window.pixiTextures || !window.pixiTextures.trail_ribbon) {
          console.warn('[ZortexFX] MeshRope or trail_ribbon texture unavailable. Skipping MeshRope trails.');
          return;
        }

        // 1. Oyuncu Gemi İzi (MeshRope - Additive Energy Ribbon)
        this.playerPoints = [];
        for (let i = 0; i < this.playerPointCount; i++) {
          this.playerPoints.push(new PIXI.Point(0, 0));
        }

        this.playerRope = new PIXI.MeshRope({
          texture: window.pixiTextures.trail_ribbon,
          points: this.playerPoints,
          width: this.playerBaseWidth
        });
        this.playerRope.blendMode = 'add';
        this.playerRope.alpha = 0;
        this.playerRope.tint = 0x00f3ff;
        this.container.addChild(this.playerRope);

        // 2. Mermi İzi: Çift-katman hantal neon çakışmasını engellemek için MeshRope kaldırıldı (Temiz tek çıkış)
        this.bulletRopes = [];

        this.isInitialized = true;
        console.log('[ZortexFX] MeshRope additive ship trail initialized.');
      } catch (err) {
        console.warn('[ZortexFX] Failed to initialize MeshRope trails:', err);
      }
    }

    update(dt, player, bullets) {
      if (!this.isInitialized || !this.enabled) return;

      // 1. Oyuncu İzi Güncellemesi
      if (player && this.playerRope) {
        const pSpeed = Math.hypot(player.vx || 0, player.vy || 0);
        const isDashing = Boolean(player.isDashing);

        // Arka motor çıkış koordinatı
        const engineDist = 14;
        const tailX = player.x - Math.cos(player.angle) * engineDist;
        const tailY = player.y - Math.sin(player.angle) * engineDist;

        if (this.playerHistory.length === 0) {
          for (let i = 0; i < this.playerPointCount; i++) {
            this.playerHistory.push({ x: tailX, y: tailY });
          }
        } else {
          this.playerHistory.unshift({ x: tailX, y: tailY });
          if (this.playerHistory.length > this.playerPointCount) {
            this.playerHistory.pop();
          }
        }

        for (let i = 0; i < this.playerPointCount; i++) {
          const h = this.playerHistory[i];
          this.playerPoints[i].set(h.x, h.y);
        }

        const targetWidth = isDashing ? 32 : (14 + Math.min(12, pSpeed * 1.8));
        if (this.playerRope.geometry) {
          this.playerRope.geometry._width = targetWidth;
          this.playerRope.geometry.updateVertices();
        }

        const targetAlpha = isDashing ? 0.95 : (pSpeed > 0.5 ? 0.75 : 0.25);
        this.playerRope.alpha += (targetAlpha - this.playerRope.alpha) * Math.min(1.0, dt * 10);
        const shipCol = (player.shipClass && player.shipClass.color) ? (typeof hexToPixiColor === 'function' ? hexToPixiColor(player.shipClass.color) : 0x00f3ff) : 0x00f3ff;
        this.playerRope.tint = isDashing ? 0xffaa00 : shipCol;
      }

      // 2. Yüksek Hızlı Mermi İzleri: Temiz tek lazer çıkışı korundu (Çift-katman neon çakışması önlendi)
    }
  }

  class ExplosionFXManager {
    constructor() {
      this.container = null;
      this.lightSpots = [];
      this.maxLightSpots = 24;
      this.isInitialized = false;
    }

    setup(container, app) {
      if (!container || !app || this.isInitialized) return;
      this.container = container;

      try {
        this.lightSpots = [];
        for (let i = 0; i < this.maxLightSpots; i++) {
          let sp = null;
          if (window.pixiTextures && window.pixiTextures.light_scorch) {
            sp = new PIXI.Sprite(window.pixiTextures.light_scorch);
            sp.anchor.set(0.5);
            sp.visible = false;
            sp.blendMode = 'add';
            this.container.addChild(sp);
          }
          this.lightSpots.push({
            sprite: sp,
            x: 0,
            y: 0,
            life: 0,
            maxLife: 1,
            baseScale: 1,
            color: 0xffffff,
            active: false
          });
        }

        this.isInitialized = true;
        console.log('[ZortexFX] 3-Tier Zero-GC Explosion Manager initialized.');
      } catch (err) {
        console.warn('[ZortexFX] Failed to initialize ExplosionFXManager:', err);
      }
    }

    trigger(x, y, color = '#ff3b30', tier = 1) {
      const c = (typeof hexToPixiColor === 'function') ? hexToPixiColor(color) : 0xff3b30;

      // 1. PARLAK FLASH (Flash Core) & 2. GENİŞLEYEN ŞOK HALKASI (Shockwave)
      if (typeof window.addShockwave === 'function') {
        if (tier === 3) {
          // Boss: 3 Kademeli Rezonans Halkaları + Devasa Plazma Flash
          window.addShockwave(x, y, 0xffffff, 160, 0.35, 6.0);
          window.addShockwave(x, y, c, 260, 0.55, 5.0);
          window.addShockwave(x, y, 0x00f3ff, 360, 0.70, 4.0);
        } else if (tier === 2) {
          // Elite: Çift Şok Halkası
          window.addShockwave(x, y, 0xffffff, 90, 0.22, 4.0);
          window.addShockwave(x, y, c, 180, 0.45, 3.5);
        } else {
          // Normal: Hızlı Kompakt Şok Halkası
          window.addShockwave(x, y, c, 85, 0.28, 2.8);
        }
      }

      // 3. KIVILCIMLAR (Sparks) & 4. KISA ÖMÜRLÜ DUMAN (Smoke) & Enkaz (Debris)
      if (typeof window.particles !== 'undefined' && window.particles) {
        const scale = (tier === 3 ? 2.6 : (tier === 2 ? 1.6 : 1.0));
        if (typeof window.particles.emitExplosionBurst === 'function') {
          window.particles.emitExplosionBurst(x, y, color, scale);
        }
      }

      // 5. HAFİF IŞIK LEKESİ (Light Scorch Flare)
      this.spawnLightSpot(x, y, c, tier);
    }

    spawnLightSpot(x, y, color, tier = 1) {
      for (let i = 0; i < this.lightSpots.length; i++) {
        const spot = this.lightSpots[i];
        if (!spot.active) {
          spot.active = true;
          spot.x = x;
          spot.y = y;
          spot.color = color;
          const duration = (tier === 3 ? 1.4 : (tier === 2 ? 0.7 : 0.35));
          const baseSc = (tier === 3 ? 4.5 : (tier === 2 ? 2.6 : 1.4));
          spot.life = duration;
          spot.maxLife = duration;
          spot.baseScale = baseSc;

          if (spot.sprite) {
            spot.sprite.visible = true;
            spot.sprite.x = x;
            spot.sprite.y = y;
            spot.sprite.tint = color;
            spot.sprite.scale.set(baseSc, baseSc);
            spot.sprite.alpha = 0.85;
          }
          break;
        }
      }
    }

    update(dt) {
      for (let i = 0; i < this.lightSpots.length; i++) {
        const spot = this.lightSpots[i];
        if (!spot.active) continue;
        spot.life -= dt;
        if (spot.life <= 0) {
          spot.active = false;
          if (spot.sprite) spot.sprite.visible = false;
        } else if (spot.sprite) {
          const ratio = spot.life / spot.maxLife;
          spot.sprite.alpha = ratio * 0.75;
          const curSc = spot.baseScale * (1.0 + 0.15 * (1 - ratio));
          spot.sprite.scale.set(curSc, curSc);
        }
      }
    }
  }

  class PostProcessFXManager {
    constructor() {
      this.app = null;
      this.worldContainer = null;
      this.unifiedFilter = null;
      this.rgbSplitFilter = null;
      this.activeShockwaves = [];
      this.shockwavePool = [];

      this.time = 0;
      this.enabled = true;

      // Filter settings based on quality tier
      this.uGrainStrength = 0.03;
      this.uVignetteStrength = 0.35;
      this.uContrast = 1.08;
      this.uSaturation = 1.10;

      // Chromatic aberration (damage) state
      this.rgbSplitTimer = 0;
      this.rgbSplitDuration = 0.20;
      this.rgbSplitIntensity = 0;

      this.isInitialized = false;
    }

    setup(worldContainer, app) {
      if (!worldContainer || !app || this.isInitialized) return;
      this.worldContainer = worldContainer;
      this.app = app;

      // 1. Create Unified PostFilter (GlProgram + Filter)
      this.initUnifiedFilter();

      // 2. Instantiate RGBSplitFilter
      if (window.PIXI_FILTERS && window.PIXI_FILTERS.RGBSplitFilter) {
        try {
          this.rgbSplitFilter = new window.PIXI_FILTERS.RGBSplitFilter({
            red: { x: 0, y: 0 },
            green: { x: 0, y: 0 },
            blue: { x: 0, y: 0 }
          });
        } catch (e) {
          console.warn('[ZortexFX] RGBSplitFilter init error:', e);
        }
      }

      this.isInitialized = true;
      this.onQualityChanged(window.ZortexFX ? window.ZortexFX.quality.config : null);
      this.syncFilters();

      if (window.ZortexFX) {
        window.ZortexFX.on('qualityChanged', (cfg) => this.onQualityChanged(cfg));
      }
      this.prewarm(app);
      console.log('[ZortexFX] PostProcessFXManager (Unified Filter + Transients) initialized.');
    }

    prewarm(app) {
      if (!app || !app.renderer) return;
      try {
        const scratchContainer = new PIXI.Container();
        const scratchSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        scratchSprite.width = 4;
        scratchSprite.height = 4;
        scratchContainer.addChild(scratchSprite);

        const warmupFilters = [];
        if (this.unifiedFilter) warmupFilters.push(this.unifiedFilter);
        if (this.rgbSplitFilter) warmupFilters.push(this.rgbSplitFilter);
        const SwClass = (window.PIXI_FILTERS && window.PIXI_FILTERS.ShockwaveFilter) || (typeof PIXI.filters !== 'undefined' && PIXI.filters.ShockwaveFilter);
        if (SwClass) {
          try {
            while (this.shockwavePool.length < 2) {
              const swWarm = new SwClass({
                center: [0, 0],
                radius: 10,
                wavelength: 90,
                amplitude: 20,
                speed: 500
              });
              this.shockwavePool.push(swWarm);
              warmupFilters.push(swWarm);
            }
          } catch (e) {}
        }
        scratchContainer.filters = warmupFilters;
        const scratchRT = PIXI.RenderTexture.create({ width: 4, height: 4 });
        app.renderer.render({ container: scratchContainer, target: scratchRT });
        scratchContainer.filters = null;
        scratchRT.destroy(true);
        scratchContainer.destroy(true);
      } catch (err) {
        // Safe fallback - zero crash
      }
    }

    initUnifiedFilter() {
      try {
        if (typeof PIXI.GlProgram !== 'function' || typeof PIXI.Filter !== 'function') {
          return;
        }

        const vert = `
          in vec2 aPosition;
          out vec2 vTextureCoord;
          uniform vec4 uInputSize;
          uniform vec4 uOutputFrame;
          uniform vec4 uOutputTexture;

          void main(void) {
            vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
            position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
            position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
            gl_Position = vec4(position, 0.0, 1.0);
            vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
          }
        `;

        const frag = `
          precision highp float;
          in vec2 vTextureCoord;
          out vec4 finalColor;

          uniform sampler2D uTexture;
          uniform float uTime;
          uniform float uGrainStrength;
          uniform float uVignetteStrength;
          uniform float uContrast;
          uniform float uSaturation;

          float rand(vec2 co) {
            return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
          }

          void main(void) {
            vec4 color = texture(uTexture, vTextureCoord);

            // 1. Color Grading
            color.rgb = (color.rgb - 0.5) * uContrast + 0.5;
            float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
            color.rgb = mix(vec3(luma), color.rgb, uSaturation);

            // 2. Film Grain
            if (uGrainStrength > 0.001) {
              float noise = (rand(vTextureCoord * 2.5 + fract(uTime)) - 0.5) * uGrainStrength;
              color.rgb += noise;
            }

            // 3. Subtle Vignette
            if (uVignetteStrength > 0.001) {
              vec2 uv = (vTextureCoord - 0.5) * 2.0;
              float dist = dot(uv, uv);
              float vig = clamp(1.0 - dist * (uVignetteStrength * 0.45), 0.0, 1.0);
              color.rgb *= vig;
            }

            finalColor = color;
          }
        `;

        const glProgram = PIXI.GlProgram.from({
          vertex: vert,
          fragment: frag,
          name: 'unified-postprocess'
        });

        this.unifiedFilter = new PIXI.Filter({
          glProgram: glProgram,
          resources: {
            postUniforms: {
              uTime: { value: 0.0, type: 'f32' },
              uGrainStrength: { value: this.uGrainStrength, type: 'f32' },
              uVignetteStrength: { value: this.uVignetteStrength, type: 'f32' },
              uContrast: { value: this.uContrast, type: 'f32' },
              uSaturation: { value: this.uSaturation, type: 'f32' }
            }
          }
        });
      } catch (err) {
        console.warn('[ZortexFX] Unified PostFilter creation error:', err);
        this.unifiedFilter = null;
      }
    }

    onQualityChanged(cfg) {
      const q = window.ZortexFX ? window.ZortexFX.quality.currentTier : 'high';
      if (q === 'low') {
        this.uGrainStrength = 0.0;
        this.uVignetteStrength = 0.0;
        this.uContrast = 1.0;
        this.uSaturation = 1.0;
      } else if (q === 'medium') {
        this.uGrainStrength = 0.0;
        this.uVignetteStrength = 0.28;
        this.uContrast = 1.05;
        this.uSaturation = 1.06;
      } else if (q === 'high') {
        this.uGrainStrength = 0.03;
        this.uVignetteStrength = 0.35;
        this.uContrast = 1.08;
        this.uSaturation = 1.10;
      } else if (q === 'ultra') {
        this.uGrainStrength = 0.035;
        this.uVignetteStrength = 0.40;
        this.uContrast = 1.10;
        this.uSaturation = 1.12;
      }

      this.updateUniforms();
      this.syncFilters();
    }

    updateUniforms() {
      if (!this.unifiedFilter) return;
      try {
        const u = this.unifiedFilter.resources.postUniforms.uniforms;
        u.uTime = this.time;
        u.uGrainStrength = this.uGrainStrength;
        u.uVignetteStrength = this.uVignetteStrength;
        u.uContrast = this.uContrast;
        u.uSaturation = this.uSaturation;
      } catch (e) {}
    }

    syncFilters() {
      if (!this.worldContainer) return;
      const q = window.ZortexFX ? window.ZortexFX.quality.currentTier : 'high';
      const filters = [];

      // 1. Unified post filter (unless low or disabled)
      if (this.unifiedFilter && q !== 'low' && this.enabled) {
        filters.push(this.unifiedFilter);
      }

      // 2. Transient: RGBSplitFilter
      if (this.rgbSplitTimer > 0 && this.rgbSplitFilter) {
        filters.push(this.rgbSplitFilter);
      }

      // 3. Transient: Active ShockwaveFilters
      for (let i = 0; i < this.activeShockwaves.length; i++) {
        if (this.activeShockwaves[i].filter) {
          filters.push(this.activeShockwaves[i].filter);
        }
      }

      this.worldContainer.filters = filters.length > 0 ? filters : null;
    }

    triggerDamageAberration(intensity = 1.0) {
      if (!this.rgbSplitFilter) return;
      const reduce = Boolean(
        (window.gameSettings && window.gameSettings.reduceFlashing) ||
        (window.ZortexFX && window.ZortexFX.quality && window.ZortexFX.quality.reduceFlashing)
      );

      const finalInt = reduce ? (intensity * 0.25) : intensity;
      if (finalInt < 0.05) return;

      this.rgbSplitDuration = 0.20; // 200ms
      this.rgbSplitTimer = this.rgbSplitDuration;
      this.rgbSplitIntensity = Math.min(10.0, 5.5 * finalInt);

      this.rgbSplitFilter.redX = -this.rgbSplitIntensity;
      this.rgbSplitFilter.blueX = this.rgbSplitIntensity;

      this.syncFilters();
    }

    triggerShockwave(worldX, worldY, maxRadius = 300, duration = 0.55) {
      const SwClass = (window.PIXI_FILTERS && window.PIXI_FILTERS.ShockwaveFilter) || (typeof PIXI.filters !== 'undefined' && PIXI.filters.ShockwaveFilter);
      if (!SwClass) return;
      const q = window.ZortexFX ? window.ZortexFX.quality.currentTier : 'high';
      if (q === 'low') return;

      const reduce = Boolean(
        (window.gameSettings && window.gameSettings.reduceFlashing) ||
        (window.ZortexFX && window.ZortexFX.quality && window.ZortexFX.quality.reduceFlashing)
      );

      // Max 2 simultaneous shockwaves to prevent fill-rate bottleneck
      if (this.activeShockwaves.length >= 2) {
        const recycled = this.activeShockwaves.shift();
        if (recycled && recycled.filter && this.shockwavePool.length < 2) {
          this.shockwavePool.push(recycled.filter);
        }
      }

      try {
        let sw = this.shockwavePool.pop();
        if (!sw) {
          sw = new SwClass({
            center: [worldX, worldY],
            radius: 10,
            wavelength: 90,
            amplitude: reduce ? 8 : 28,
            speed: maxRadius / duration
          });
        } else {
          sw.center = [worldX, worldY];
          sw.radius = 10;
          sw.wavelength = 90;
          sw.amplitude = reduce ? 8 : 28;
          sw.speed = maxRadius / duration;
          sw.time = 0;
        }

        this.activeShockwaves.push({
          filter: sw,
          worldX: worldX,
          worldY: worldY,
          duration: duration,
          time: 0
        });

        this.syncFilters();
      } catch (e) {
        console.warn('[ZortexFX] Failed to trigger shockwave filter:', e);
      }
    }

    update(dt, camX = 0, camY = 0, zoom = 1.0, shakeX = 0, shakeY = 0) {
      let filtersChanged = false;

      // 1. Update Unified Filter
      if (this.unifiedFilter && this.enabled) {
        this.time += dt;
        try {
          this.unifiedFilter.resources.postUniforms.uniforms.uTime = this.time;
        } catch (e) {}
      }

      // 2. Update RGBSplitFilter
      if (this.rgbSplitTimer > 0) {
        this.rgbSplitTimer -= dt;
        if (this.rgbSplitTimer <= 0) {
          this.rgbSplitTimer = 0;
          if (this.rgbSplitFilter) {
            this.rgbSplitFilter.redX = 0;
            this.rgbSplitFilter.blueX = 0;
          }
          filtersChanged = true;
        } else if (this.rgbSplitFilter) {
          const progress = this.rgbSplitTimer / this.rgbSplitDuration;
          const currentOff = this.rgbSplitIntensity * (progress * progress);
          this.rgbSplitFilter.redX = -currentOff;
          this.rgbSplitFilter.blueX = currentOff;
        }
      }

      // 3. Update Shockwaves
      if (this.activeShockwaves.length > 0) {
        const screenW = (this.app && this.app.screen) ? this.app.screen.width : 1280;
        const screenH = (this.app && this.app.screen) ? this.app.screen.height : 720;
        const focusX = screenW * 0.5;
        const focusY = screenH * 0.5;

        for (let i = this.activeShockwaves.length - 1; i >= 0; i--) {
          const sw = this.activeShockwaves[i];
          sw.time += dt;

          if (sw.time >= sw.duration) {
            if (sw.filter && this.shockwavePool.length < 2) {
              this.shockwavePool.push(sw.filter);
            }
            this.activeShockwaves.splice(i, 1);
            filtersChanged = true;
          } else {
            // Transform world coordinate to screen coordinate considering camera and zoom
            const screenX = (sw.worldX * zoom) + (shakeX - camX) + (1.0 - zoom) * focusX;
            const screenY = (sw.worldY * zoom) + (shakeY - camY) + (1.0 - zoom) * focusY;
            sw.filter.center = [screenX, screenY];
            sw.filter.time = sw.time;
          }
        }
      }

      if (filtersChanged) {
        this.syncFilters();
      }
    }
  }

  // [FX] FAZ 6: Sahte Dinamik Işık Yönetimi (Fake Dynamic Point Light Pool)
  class LightFXManager {
    constructor() {
      this.container = null;
      this.app = null;
      this.enabled = true;
      this.maxLights = 32;
      this.pool = [];
      this.activeLights = [];
      this.baseIntensity = 1.0;
      this.isInitialized = false;
    }

    setup(container, app) {
      if (!container || !app) return;
      this.container = container;
      this.app = app;
      this.initPool();

      if (window.ZortexFX && !this.isInitialized) {
        window.ZortexFX.on('qualityChanged', (cfg) => {
          const tier = window.ZortexFX.quality ? window.ZortexFX.quality.currentTier : 'high';
          this.onQualityChanged(tier);
        });
      }
      this.isInitialized = true;
    }

    initPool() {
      if (!this.container || typeof PIXI === 'undefined') return;
      if (this.pool && this.pool.length > 0) return;
      const tex = (window.pixiTextures && window.pixiTextures.radial_point_light)
        ? window.pixiTextures.radial_point_light
        : ((window.pixiTextures && window.pixiTextures.light_scorch) ? window.pixiTextures.light_scorch : null);

      if (!tex) return;

      this.pool = [];
      this.activeLights = [];
      for (let i = 0; i < this.maxLights; i++) {
        const sp = new PIXI.Sprite(tex);
        sp.anchor.set(0.5);
        sp.visible = false;
        sp.blendMode = 'add';
        this.container.addChild(sp);
        this.pool.push({
          sprite: sp,
          active: false,
          x: 0,
          y: 0,
          baseScale: 1.0,
          intensity: 1.0,
          life: 0,
          maxLife: 1.0,
          attachTo: null
        });
      }
      console.log('[ZortexFX] LightFXManager pool initialized with 32 lights.');
    }

    onQualityChanged(tier) {
      if (tier === 'low') {
        this.enabled = false;
        this.clear();
      } else if (tier === 'medium') {
        this.enabled = true;
        this.baseIntensity = 0.8;
      } else if (tier === 'high') {
        this.enabled = true;
        this.baseIntensity = 1.0;
      } else if (tier === 'ultra') {
        this.enabled = true;
        this.baseIntensity = 1.25;
      }
    }

    addLight(x, y, color = 0x00f3ff, radius = 120, duration = 0.5, intensity = 1.0, attachTo = null) {
      if (!this.enabled) return null;
      if (this.pool.length === 0) {
        this.initPool();
        if (this.pool.length === 0) return null;
      }

      const c = (typeof hexToPixiColor === 'function') ? hexToPixiColor(color) : color;

      let light = null;
      for (let i = 0; i < this.pool.length; i++) {
        if (!this.pool[i].active) {
          light = this.pool[i];
          break;
        }
      }
      if (!light && this.activeLights.length > 0) {
        light = this.activeLights[0];
      }
      if (!light) return null;

      light.active = true;
      light.x = x;
      light.y = y;
      light.sprite.x = x;
      light.sprite.y = y;
      light.sprite.tint = c;

      const scale = radius / 64.0;
      light.baseScale = scale;
      light.sprite.scale.set(scale, scale);

      light.intensity = intensity * this.baseIntensity;
      light.sprite.alpha = light.intensity;
      light.life = duration;
      light.maxLife = Math.max(0.01, duration);
      light.attachTo = attachTo;
      light.sprite.visible = true;

      if (!this.activeLights.includes(light)) {
        this.activeLights.push(light);
      }
      return light;
    }

    update(dt) {
      if (!this.enabled && this.activeLights.length === 0) return;

      for (let i = this.activeLights.length - 1; i >= 0; i--) {
        const l = this.activeLights[i];
        if (l.attachTo) {
          if (l.attachTo.isDead || l.attachTo.dead) {
            l.attachTo = null;
          } else {
            l.x = l.attachTo.x;
            l.y = l.attachTo.y;
          }
        }

        l.life -= dt;
        if (l.life <= 0) {
          l.active = false;
          l.sprite.visible = false;
          l.attachTo = null;
          this.activeLights.splice(i, 1);
        } else {
          l.sprite.x = l.x;
          l.sprite.y = l.y;
          const progress = Math.max(0, l.life / l.maxLife);
          l.sprite.alpha = l.intensity * (progress * progress);
          const expand = l.baseScale * (1.0 + (1.0 - progress) * 0.28);
          l.sprite.scale.set(expand, expand);
        }
      }
    }

    clear() {
      for (let i = 0; i < this.pool.length; i++) {
        this.pool[i].active = false;
        this.pool[i].sprite.visible = false;
        this.pool[i].attachTo = null;
      }
      this.activeLights = [];
    }
  }

  // [FX] FAZ 6: Çekirdek ve Kalkan Rim-Glow Filtre Yöneticisi
  class RimGlowManager {
    constructor() {
      this.container = null;
      this.app = null;
      this.filter = null;
      this.enabled = true;
      this.uGlowColor = [0.0, 0.95, 1.0];
      this.uGlowIntensity = 1.35;
      this.time = 0.0;
      this.isInitialized = false;
    }

    setup(container, app) {
      if (!container || !app) return;
      if (this.container && this.container !== container) {
        if (this.container.filters) this.container.filters = null;
      }
      this.container = container;
      this.app = app;
      if (!this.filter) {
        this.initFilter();
      } else if (this.enabled) {
        this.container.filters = [this.filter];
      }
      this.isInitialized = true;

      if (!this._qualitySubscribed && window.ZortexFX) {
        this._qualitySubscribed = true;
        window.ZortexFX.on('qualityChanged', (cfg) => {
          const tier = window.ZortexFX.quality ? window.ZortexFX.quality.currentTier : 'high';
          this.onQualityChanged(tier);
        });
      }
    }

    initFilter() {
      try {
        if (typeof PIXI.GlProgram !== 'function' || typeof PIXI.Filter !== 'function') return;

        const vert = `
          in vec2 aPosition;
          out vec2 vTextureCoord;
          uniform vec4 uInputSize;
          uniform vec4 uOutputFrame;
          uniform vec4 uOutputTexture;

          vec4 filterVertexPosition(void) {
            vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
            position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
            position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
            return vec4(position, 0.0, 1.0);
          }

          vec2 filterTextureCoord(void) {
            return aPosition * (uOutputFrame.zw * uInputSize.zw);
          }

          void main(void) {
            gl_Position = filterVertexPosition();
            vTextureCoord = filterTextureCoord();
          }
        `;

        const frag = `
          in vec2 vTextureCoord;
          out vec4 finalColor;
          uniform sampler2D uTexture;
          uniform vec3 uGlowColor;
          uniform float uGlowIntensity;
          uniform float uTime;

          void main(void) {
            vec4 baseColor = texture(uTexture, vTextureCoord);
            
            vec2 px = vec2(0.016, 0.016);
            float a0 = texture(uTexture, vTextureCoord + vec2(-px.x, 0.0)).a;
            float a1 = texture(uTexture, vTextureCoord + vec2( px.x, 0.0)).a;
            float a2 = texture(uTexture, vTextureCoord + vec2(0.0, -px.y)).a;
            float a3 = texture(uTexture, vTextureCoord + vec2(0.0,  px.y)).a;
            
            float edge = clamp(abs(a0 - a1) + abs(a2 - a3), 0.0, 1.0);
            float pulse = 0.86 + 0.14 * sin(uTime * 4.2);
            vec3 glow = uGlowColor * (edge * uGlowIntensity * pulse);
            
            finalColor = vec4(baseColor.rgb + glow, max(baseColor.a, edge * uGlowIntensity * 0.75));
          }
        `;

        const glProgram = PIXI.GlProgram.from({
          vertex: vert,
          fragment: frag,
          name: 'rim-glow-filter'
        });

        this.uniformGroup = new PIXI.UniformGroup({
          uGlowColor: { value: new Float32Array(this.uGlowColor), type: 'vec3<f32>' },
          uGlowIntensity: { value: this.uGlowIntensity, type: 'f32' },
          uTime: { value: 0.0, type: 'f32' }
        });

        this.filter = new PIXI.Filter({
          glProgram: glProgram,
          resources: {
            rimUniforms: this.uniformGroup
          }
        });
        this.filter.padding = 12;

        if (this.container && this.enabled) {
          this.container.filters = [this.filter];
        }
        console.log('[ZortexFX] RimGlowFilter initialized with UniformGroup.');
      } catch (err) {
        console.warn('[ZortexFX] RimGlowFilter creation error:', err);
        this.filter = null;
      }
    }

    onQualityChanged(tier) {
      if (tier === 'low' || tier === 'medium') {
        this.setEnabled(false);
      } else {
        this.setEnabled(true);
      }
    }

    setEnabled(val) {
      this.enabled = Boolean(val);
      if (this.container) {
        if (this.enabled && this.filter) {
          this.container.filters = [this.filter];
        } else {
          this.container.filters = null;
        }
      }
    }

    update(dt, player) {
      if (!this.filter || !this.enabled || !this.uniformGroup) return;
      this.time += dt;
      try {
        const u = this.uniformGroup.uniforms;
        if (u) {
          u.uTime = this.time;
          if (player && player.shield > 0) {
            if (player.shieldImpactTimer > 0) {
              u.uGlowColor[0] = 1.0; u.uGlowColor[1] = 0.9; u.uGlowColor[2] = 0.4;
              u.uGlowIntensity = this.uGlowIntensity * 1.8;
            } else {
              u.uGlowColor[0] = 0.0; u.uGlowColor[1] = 0.95; u.uGlowColor[2] = 1.0;
              u.uGlowIntensity = this.uGlowIntensity;
            }
          } else {
            u.uGlowColor[0] = 0.2; u.uGlowColor[1] = 0.5; u.uGlowColor[2] = 0.9;
            u.uGlowIntensity = this.uGlowIntensity * 0.7;
          }
          this.uniformGroup.update();
        }
      } catch (e) {}
    }
  }

  // [FX] FAZ 9: Gatling Lazer Hiper Plazma Işını ve Havuzlanmış TilingSprite Yöneticisi
  class GatlingBeamFXManager {
    constructor() {
      this.container = null;
      this.app = null;
      this.enabled = true;
      this.pool = [];
      this.maxBeams = 8;
      this.beamTexture = null;
      this.coreTexture = null;
      this.tipTexture = null;
      this.muzzleRingTexture = null;
      this.barrelTexture = null;
      this.spoolUpTimer = 0.0;
      this.heat = 0.0;
      this.time = 0.0;
      this.barrelOverlaySprite = null;
      // Ulti renk geçişi: 0 = neon mavi (0x00f3ff), 1 = neon sarı (0xffe600), 0.1 sn lerp
      this.ultiTransition = 0.0;
      this.currentColor = 0x00f3ff;
      this.currentColorHex = '#00f3ff';
      this._lastHexColor = -1;
    }

    setup(container, app) {
      if (!container || !app) return;
      this.app = app;
      if (!this.container) {
        this.container = new PIXI.Container();
        this.container.label = 'gatlingBeamsContainer';
        container.addChild(this.container);
      }
      this.initTextures();
      this.initPool();
    }

    initTextures() {
      if (this.beamTexture) return;
      try {
        // 1. Ana İyon Işın Gövdesi Dokusu (Saf Beyaz/Gri Gradyan ile Her Renkle Tint Edilebilir)
        const cBeam = document.createElement('canvas');
        cBeam.width = 128;
        cBeam.height = 32;
        const ctxB = cBeam.getContext('2d');
        const gB = ctxB.createLinearGradient(0, 0, 0, 32);
        gB.addColorStop(0.00, 'rgba(255, 255, 255, 0.0)');
        gB.addColorStop(0.20, 'rgba(255, 255, 255, 0.28)');
        gB.addColorStop(0.38, 'rgba(255, 255, 255, 0.75)');
        gB.addColorStop(0.46, 'rgba(255, 255, 255, 0.98)');
        gB.addColorStop(0.50, 'rgba(255, 255, 255, 1.00)');
        gB.addColorStop(0.54, 'rgba(255, 255, 255, 0.98)');
        gB.addColorStop(0.62, 'rgba(255, 255, 255, 0.75)');
        gB.addColorStop(0.80, 'rgba(255, 255, 255, 0.28)');
        gB.addColorStop(1.00, 'rgba(255, 255, 255, 0.0)');
        ctxB.fillStyle = gB;
        ctxB.fillRect(0, 0, 128, 32);

        // Akışkan enerji dalgası modülasyonu (Boylamasına titreşim deseni)
        const imgData = ctxB.getImageData(0, 0, 128, 32);
        const data = imgData.data;
        for (let x = 0; x < 128; x++) {
          const wave = 0.82 + 0.18 * Math.sin((x / 128) * Math.PI * 4);
          for (let y = 0; y < 32; y++) {
            const idx = (y * 128 + x) * 4;
            data[idx + 3] = Math.min(255, Math.round(data[idx + 3] * wave));
          }
        }
        ctxB.putImageData(imgData, 0, 0);
        this.beamTexture = PIXI.Texture.from(cBeam);

        // 2. Razor Core (Süpersonik Beyaz Çekirdek Dokusu)
        const cCore = document.createElement('canvas');
        cCore.width = 64;
        cCore.height = 12;
        const ctxC = cCore.getContext('2d');
        const gC = ctxC.createLinearGradient(0, 0, 0, 12);
        gC.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
        gC.addColorStop(0.35, 'rgba(255, 255, 255, 0.88)');
        gC.addColorStop(0.5, 'rgba(255, 255, 255, 1.0)');
        gC.addColorStop(0.65, 'rgba(255, 255, 255, 0.88)');
        gC.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
        ctxC.fillStyle = gC;
        ctxC.fillRect(0, 0, 64, 12);
        this.coreTexture = PIXI.Texture.from(cCore);

        // 3. Işın Ucu Yumuşak Sonlandırma / Solma Dokusu (Beam Tip Cap)
        const cTip = document.createElement('canvas');
        cTip.width = 48;
        cTip.height = 32;
        const ctxT = cTip.getContext('2d');
        const gT = ctxT.createRadialGradient(8, 16, 2, 24, 16, 24);
        gT.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
        gT.addColorStop(0.4, 'rgba(255, 255, 255, 0.7)');
        gT.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
        ctxT.fillStyle = gT;
        ctxT.fillRect(0, 0, 48, 32);
        this.tipTexture = PIXI.Texture.from(cTip);

        // 4. Namlu Dönen Manyetik Odaklama Halkası (Muzzle Compression Ring)
        const cRing = document.createElement('canvas');
        cRing.width = 32;
        cRing.height = 32;
        const ctxR = cRing.getContext('2d');
        ctxR.strokeStyle = '#ffffff';
        ctxR.lineWidth = 2.5;
        ctxR.beginPath();
        ctxR.arc(16, 16, 12, 0, Math.PI * 1.6);
        ctxR.stroke();
        ctxR.fillStyle = '#ffffff';
        ctxR.beginPath();
        ctxR.arc(16, 16, 3.5, 0, Math.PI * 2);
        ctxR.fill();
        this.muzzleRingTexture = PIXI.Texture.from(cRing);

        // 5. Gemi Emissive Gatling Namlu Katmanı (Evolved Ship Gatling Barrel Overlay)
        const cBar = document.createElement('canvas');
        cBar.width = 24;
        cBar.height = 20;
        const ctxBar = cBar.getContext('2d');
        ctxBar.fillStyle = '#1e293b';
        ctxBar.fillRect(6, 4, 14, 4);
        ctxBar.fillRect(6, 12, 14, 4);
        ctxBar.fillStyle = '#00f3ff';
        ctxBar.fillRect(16, 4, 6, 4);
        ctxBar.fillRect(16, 12, 6, 4);
        ctxBar.fillStyle = '#ffffff';
        ctxBar.fillRect(19, 5, 3, 2);
        ctxBar.fillRect(19, 13, 3, 2);
        this.barrelTexture = PIXI.Texture.from(cBar);
      } catch (err) {
        console.warn('[ZortexFX] GatlingBeamFXManager initTextures error:', err);
      }
    }

    initPool() {
      if (!this.container || !this.beamTexture) return;
      this.pool = [];
      for (let i = 0; i < this.maxBeams; i++) {
        // Dış / ana plazma ışın gövdesi (TilingSprite ile sonsuz akan enerji)
        const beamSprite = new PIXI.TilingSprite({
          texture: this.beamTexture,
          width: 1400,
          height: 18
        });
        beamSprite.anchor.set(0.0, 0.5);
        beamSprite.blendMode = 'add';
        beamSprite.visible = false;
        this.container.addChild(beamSprite);

        // İç süpersonik beyaz çekirdek (Razor Core)
        const coreSprite = new PIXI.TilingSprite({
          texture: this.coreTexture,
          width: 1400,
          height: 4.5
        });
        coreSprite.anchor.set(0.0, 0.5);
        coreSprite.blendMode = 'add';
        coreSprite.visible = false;
        this.container.addChild(coreSprite);

        // Işın ucu sonlandırma
        const tipSprite = new PIXI.Sprite(this.tipTexture);
        tipSprite.anchor.set(0.5, 0.5);
        tipSprite.blendMode = 'add';
        tipSprite.visible = false;
        this.container.addChild(tipSprite);

        // Namlu odaklama halkası
        const ringSprite = new PIXI.Sprite(this.muzzleRingTexture);
        ringSprite.anchor.set(0.5, 0.5);
        ringSprite.blendMode = 'add';
        ringSprite.visible = false;
        this.container.addChild(ringSprite);

        this.pool.push({
          beamSprite,
          coreSprite,
          tipSprite,
          ringSprite,
          active: false
        });
      }
    }

    setupBarrelOverlay(shipContainer) {
      if (!shipContainer || !this.barrelTexture || this.barrelOverlaySprite) return;
      try {
        const sp = new PIXI.Sprite(this.barrelTexture);
        sp.anchor.set(0.2, 0.5);
        sp.visible = false;
        sp.blendMode = 'add';
        shipContainer.addChild(sp);
        this.barrelOverlaySprite = sp;
      } catch (e) {}
    }

    update(dt, player, enemies) {
      if (!this.enabled || !player) return;
      this.time += dt;

      const hasGatling = Boolean(player.hasGatlingLaser);
      const isFiring = Boolean(hasGatling && player.isGatlingActive);

      // Ulti renk geçişi (0.1 sn yumuşak lerp): neon mavi <-> neon sarı
      const targetUlt = player.isUltimateActive ? 1.0 : 0.0;
      if (this.ultiTransition < targetUlt) {
        this.ultiTransition = Math.min(targetUlt, this.ultiTransition + dt * 10.0);
      } else if (this.ultiTransition > targetUlt) {
        this.ultiTransition = Math.max(targetUlt, this.ultiTransition - dt * 10.0);
      }
      const uK = this.ultiTransition;
      const curR = (255 * uK + 0.5) | 0;
      const curG = (243 - 13 * uK + 0.5) | 0;
      const curB = (255 * (1.0 - uK) + 0.5) | 0;
      this.currentColor = (curR << 16) | (curG << 8) | curB;
      if (this.currentColor !== this._lastHexColor) {
        this._lastHexColor = this.currentColor;
        this.currentColorHex = '#' + (0x1000000 | this.currentColor).toString(16).slice(1);
      }

      // Namlu overlay güncellemesi
      if (this.barrelOverlaySprite) {
        this.barrelOverlaySprite.visible = hasGatling;
        if (hasGatling) {
          let noseOffset = 18;
          if (player.shipClassId === 'titan') noseOffset = 22;
          else if (player.shipClassId === 'spectre') noseOffset = 16;
          this.barrelOverlaySprite.x = player.x + Math.cos(player.angle) * noseOffset;
          this.barrelOverlaySprite.y = player.y + Math.sin(player.angle) * noseOffset;
          this.barrelOverlaySprite.rotation = player.angle;
          this.barrelOverlaySprite.tint = this.currentColor;
          this.barrelOverlaySprite.alpha = isFiring ? 1.0 : 0.65;
        }
      }

      // Spool-up & decay mantığı (0.25s ramp / 0.12s decay)
      if (isFiring) {
        this.spoolUpTimer = Math.min(0.25, this.spoolUpTimer + dt);
        this.heat = Math.min(1.0, this.heat + dt * 0.40);
      } else {
        this.spoolUpTimer = Math.max(0.0, this.spoolUpTimer - dt * 3.5);
        this.heat = Math.max(0.0, this.heat - dt * 0.80);
      }

      if (this.spoolUpTimer <= 0.001) {
        for (let i = 0; i < this.pool.length; i++) {
          const item = this.pool[i];
          if (item.active) {
            item.active = false;
            item.beamSprite.visible = false;
            item.coreSprite.visible = false;
            item.tipSprite.visible = false;
            item.ringSprite.visible = false;
          }
        }
        return;
      }

      const spoolProgress = this.spoolUpTimer / 0.25;
      const spoolScale = 0.30 + 0.70 * (1.0 - Math.pow(1.0 - spoolProgress, 2));
      const jitter = 1.0 + 0.045 * Math.sin(this.time * 48) + 0.02 * Math.cos(this.time * 82);

      // Tek renk: normalde neon mavi, ultide neon sarı (0.1 sn lerp ile)
      const mainColor = this.currentColor;

      const beams = (player.gatlingBeams && player.gatlingBeams.length > 0)
        ? player.gatlingBeams
        : [{ startX: player.gatlingStartX, startY: player.gatlingStartY, endX: player.gatlingEndX, endY: player.gatlingEndY, angle: player.angle }];

      const beamCount = beams.length;
      // Çoklu ışın ölçeklemesi: 1/sqrt(n)
      const multiFactor = 1.0 / Math.sqrt(Math.max(1, beamCount));
      const densityAlpha = (window.ZortexFX && typeof window.ZortexFX.getDensityAlpha === 'function')
        ? window.ZortexFX.getDensityAlpha(enemies ? enemies.length : 0) : 1.0;

      // Temel yükseklik: orijinalin ~%60'ı (24-28px -> ~15px)
      const baseBeamHeight = 15.0 * multiFactor * spoolScale * jitter;
      const baseCoreHeight = 3.6 * multiFactor * spoolScale;
      const beamAlpha = 0.95 * multiFactor * densityAlpha;

      for (let i = 0; i < this.pool.length; i++) {
        const item = this.pool[i];
        if (i < beamCount) {
          const b = beams[i];
          if (b.startX === undefined || isNaN(b.startX)) continue;

          item.active = true;
          const dx = b.endX - b.startX;
          const dy = b.endY - b.startY;
          const len = Math.hypot(dx, dy) || 1400;
          const ang = (b.angle !== undefined) ? b.angle : Math.atan2(dy, dx);

          // Tüm ışınlar tek, senkron renkte (alt-lazer ton ayrımı yok)
          const beamTint = mainColor;

          // 1. Ana plazma ışın gövdesi
          item.beamSprite.visible = true;
          item.beamSprite.position.set(b.startX, b.startY);
          item.beamSprite.rotation = ang;
          item.beamSprite.width = len;
          item.beamSprite.height = baseBeamHeight;
          item.beamSprite.tint = beamTint;
          item.beamSprite.alpha = beamAlpha;
          item.beamSprite.tilePosition.x -= dt * 1400;

          // 2. Razor Core (İç süpersonik beyaz çekirdek)
          item.coreSprite.visible = true;
          item.coreSprite.position.set(b.startX, b.startY);
          item.coreSprite.rotation = ang;
          item.coreSprite.width = len;
          item.coreSprite.height = baseCoreHeight;
          item.coreSprite.alpha = 1.0 * densityAlpha;
          item.coreSprite.tilePosition.x -= dt * 1800;

          // 3. Işın ucu yumuşak solma (Beam Tip)
          item.tipSprite.visible = true;
          item.tipSprite.position.set(b.endX, b.endY);
          item.tipSprite.rotation = ang;
          item.tipSprite.tint = beamTint;
          const tipScale = (baseBeamHeight / 24.0);
          item.tipSprite.scale.set(tipScale, tipScale);
          item.tipSprite.alpha = beamAlpha * 0.85;

          // 4. Namlu odaklama halkası
          item.ringSprite.visible = true;
          item.ringSprite.position.set(b.startX, b.startY);
          item.ringSprite.rotation += dt * 14.0;
          const ringScale = (1.4 - 0.4 * spoolProgress) * (0.8 + 0.2 * multiFactor);
          item.ringSprite.scale.set(ringScale, ringScale);
          item.ringSprite.tint = beamTint;
          item.ringSprite.alpha = 0.9 * spoolProgress;

          // 5. Namlu yumuşak ışık darbesi
          if (window.ZortexFX && window.ZortexFX.lights && Math.random() < 0.25) {
            window.ZortexFX.lights.addLight(b.startX, b.startY, beamTint, 75 * spoolScale, 0.08, 0.85);
          }

          // 6. Işın boyunca uçuşan plazma parçacıkları
          if (Math.random() < 0.18 && typeof particles !== 'undefined') {
            const frac = Math.random() * 0.8 + 0.1;
            const px = b.startX + dx * frac + (Math.random() - 0.5) * 6;
            const py = b.startY + dy * frac + (Math.random() - 0.5) * 6;
            particles.emit(px, py, this.currentColorHex, 1, 1.8, 1.8, 0.18);
          }
        } else {
          item.active = false;
          item.beamSprite.visible = false;
          item.coreSprite.visible = false;
          item.tipSprite.visible = false;
          item.ringSprite.visible = false;
        }
      }
    }
  }

  // [FX] FAZ 9: Silah Evrimi Sinematik Yöneticisi (4 Efsanevi Evrim Ortak Sistemi)
  class WeaponEvolutionCinematicManager {
    constructor() {
      this.bannerEl = null;
      this.titleEl = null;
      this.subEl = null;
      this.iconEl = null;
      this.flashEl = null;
      this.hideTimer = null;
    }

    initDOM() {
      if (this.bannerEl) return;
      this.bannerEl = document.getElementById('weaponEvolutionBanner');
      this.titleEl = document.getElementById('evoBannerName');
      this.subEl = document.getElementById('evoBannerSub');
      this.iconEl = document.getElementById('evoBannerIcon');
      this.flashEl = document.getElementById('screenFlashOverlay');
    }

    trigger(evolutionId, player) {
      this.initDOM();
      const p = player || window.player;
      const px = p ? p.x : (window.innerWidth / 2);
      const py = p ? p.y : (window.innerHeight / 2);

      const evoData = {
        gatling_laser: {
          name: 'GATLING LAZER',
          sub: 'SİLAH EVRİMİ: KESİNTİSİZ HİPER DELİCİ PLAZMA IŞINI',
          icon: '🔱',
          colorHex: '#ffe600',
          colorPixi: 0xffe600,
          particleColor: '#ffe600'
        },
        glacier_lance: {
          name: 'BUZUL MIZRAĞI',
          sub: 'SİLAH EVRİMİ: KRİYO DELİCİ DONDURAN BUZ KRİSTALLERİ',
          icon: '🧊',
          colorHex: '#00f3ff',
          colorPixi: 0x00f3ff,
          particleColor: '#00f3ff'
        },
        thunder_tempest: {
          name: 'FIRTINA GİRDABI',
          sub: 'SİLAH EVRİMİ: KESİNTİSİZ ZİNCİRLEME ŞOK BOŞALIMI',
          icon: '🌪️',
          colorHex: '#ff00ea',
          colorPixi: 0xff00ea,
          particleColor: '#ff00ea'
        },
        supernova_core: {
          name: 'SÜPERNOVA ÇEKİRDEĞİ',
          sub: 'SİLAH EVRİMİ: KOZMİK ALEV VE PLAZMA PATLAMASI',
          icon: '☀️',
          colorHex: '#ff7700',
          colorPixi: 0xff7700,
          particleColor: '#ff7700'
        }
      };

      const data = evoData[evolutionId] || evoData.gatling_laser;

      // 1. Kısa hit-stop (0.12 sn oyun dondurması)
      if (typeof window.hitStopTimer !== 'undefined') {
        window.hitStopTimer = 0.12;
      }

      // 2. Ekran flaşı (reduceFlashing ayarına tam saygılı)
      const reduce = Boolean(
        (typeof gameSettings !== 'undefined' && gameSettings.reduceFlashing) ||
        (window.ZortexFX && window.ZortexFX.quality && window.ZortexFX.quality.reduceFlashing)
      );

      if (this.flashEl) {
        this.flashEl.style.backgroundColor = data.colorHex;
        this.flashEl.style.transition = 'none';
        this.flashEl.style.opacity = reduce ? '0.12' : '0.62';
        setTimeout(() => {
          this.flashEl.style.transition = 'opacity 0.45s ease-out';
          this.flashEl.style.opacity = '0';
        }, 50);
      }

      // 3. Geminin etrafında genişleyen şok halkası
      if (typeof addShockwave === 'function') {
        addShockwave(px, py, data.colorPixi, 450, 0.70, 6.0);
        addShockwave(px, py, 0xffffff, 250, 0.45, 3.5);
      }
      if (window.ZortexFX && typeof window.ZortexFX.triggerShockwave === 'function') {
        window.ZortexFX.triggerShockwave(px, py, 450, 0.70);
      }

      // 4. Enerji toplanıp patlayan efekt (Convergence & Radial Burst)
      if (typeof particles !== 'undefined') {
        for (let i = 0; i < 20; i++) {
          const ang = (i / 20) * Math.PI * 2;
          const dist = 75;
          particles.emit(px + Math.cos(ang) * dist, py + Math.sin(ang) * dist, data.particleColor, 1, -3.5, 3, 0.35);
        }
        particles.emit(px, py, data.particleColor, 45, 8.5, 4.5, 1.2);
        particles.emit(px, py, '#ffffff', 25, 6.0, 3.5, 0.8);
      }

      // Büyük ışık patlaması (LightFXManager)
      if (window.ZortexFX && window.ZortexFX.lights) {
        window.ZortexFX.lights.addLight(px, py, data.colorPixi, 320, 0.75, 1.8);
      }

      // Ses & Sarsıntı
      if (typeof audio !== 'undefined' && audio.playRelicFound) {
        audio.playRelicFound();
      }
      if (typeof triggerRumble === 'function') {
        triggerRumble('heavy');
      }
      if (typeof screenShake !== 'undefined') {
        window.screenShake = 16;
      }

      // 5. Ekran ortasında siberpunk "SİLAH EVRİMİ" banner'ı
      if (this.bannerEl) {
        if (this.titleEl) this.titleEl.textContent = data.name;
        if (this.subEl) this.subEl.textContent = data.sub;
        if (this.iconEl) this.iconEl.textContent = data.icon;
        this.bannerEl.style.borderColor = data.colorHex;
        this.bannerEl.style.boxShadow = `0 0 35px ${data.colorHex}66, inset 0 0 25px ${data.colorHex}33`;
        this.bannerEl.classList.remove('hidden');
        this.bannerEl.classList.remove('evo-banner-fadeout');
        this.bannerEl.classList.add('evo-banner-active');

        if (this.hideTimer) clearTimeout(this.hideTimer);
        this.hideTimer = setTimeout(() => {
          this.bannerEl.classList.add('evo-banner-fadeout');
          setTimeout(() => {
            this.bannerEl.classList.remove('evo-banner-active', 'evo-banner-fadeout');
            this.bannerEl.classList.add('hidden');
          }, 500);
        }, 2200);
      }
    }
  }

  class DebugPanel {
    constructor() {
      this.pane = null;
      this.isVisible = false;
      this.domStats = null;
      this.hudVisible = false;
      this.frameTimes = [];
      this.maxHistory = 600;
      this.spikes20 = 0;
      this.spikes33 = 0;
      this.totalFrames = 0;
      this.longTasks = [];
      this.lastFrameTime = performance.now();
      this.initLongTaskObserver();
    }

    initLongTaskObserver() {
      try {
        if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes && PerformanceObserver.supportedEntryTypes.includes('longtask')) {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              this.longTasks.push({
                duration: Math.round(entry.duration * 10) / 10,
                startTime: Math.round(entry.startTime),
                name: entry.name
              });
              if (this.longTasks.length > 50) this.longTasks.shift();
            }
          });
          observer.observe({ entryTypes: ['longtask'] });
        }
      } catch (e) {}
    }

    recordFrame(rawDt) {
      const now = performance.now();
      const deltaMs = (rawDt && rawDt > 0.001) ? (rawDt * 1000) : (now - this.lastFrameTime);
      this.lastFrameTime = now;
      this.totalFrames++;
      if (deltaMs > 20) this.spikes20++;
      if (deltaMs > 33.33) this.spikes33++;
      this.frameTimes.push(deltaMs);
      if (this.frameTimes.length > this.maxHistory) this.frameTimes.shift();
    }

    getHistogram() {
      if (!this.frameTimes.length) return { median: 0, p95: 0, p99: 0, spikes20: 0, spikes33: 0, totalFrames: 0, longTasksCount: 0 };
      const sorted = [...this.frameTimes].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length * 0.5)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];
      return {
        median: Math.round(median * 10) / 10,
        p95: Math.round(p95 * 10) / 10,
        p99: Math.round(p99 * 10) / 10,
        spikes20: this.spikes20,
        spikes33: this.spikes33,
        totalFrames: this.totalFrames,
        longTasksCount: this.longTasks.length,
        recentLongTasks: this.longTasks.slice(-5)
      };
    }

    init() {
      this.createDomHUD();

      window.addEventListener('keydown', (e) => {
        if (e.key === 'F2') {
          e.preventDefault();
          this.toggleTweakpane();
        } else if (e.key === 'F4' || e.code === 'F4') {
          e.preventDefault();
          this.toggleDomHUD();
        }
      });
      window.__frameStats = () => this.getHistogram();
      window.__toggleFpsHud = (force) => this.toggleDomHUD(force);
    }

    createDomHUD() {
      let stats = document.getElementById('zortex-fx-stats');
      if (!stats) {
        stats = document.createElement('div');
        stats.id = 'zortex-fx-stats';
        let savedState = false;
        try {
          savedState = localStorage.getItem('zortex_show_fps_hud') === 'true';
        } catch (_) {}
        this.hudVisible = savedState;

        stats.style.cssText = [
          'position: fixed',
          'bottom: 12px',
          'right: 16px',
          'font-family: Consolas, monospace',
          'font-size: 11px',
          'color: #00f3ff',
          'background: rgba(4, 7, 18, 0.88)',
          'padding: 5px 10px',
          'border: 1px solid rgba(0, 243, 255, 0.35)',
          'border-radius: 6px',
          'box-shadow: 0 0 12px rgba(0, 243, 255, 0.2)',
          'z-index: 99999',
          'pointer-events: auto',
          'cursor: pointer',
          'user-select: none',
          'text-shadow: 0 0 4px #00f3ff',
          'transition: bottom 0.2s ease, opacity 0.2s ease',
          `display: ${this.hudVisible ? 'block' : 'none'}`
        ].join(';');
        stats.title = 'Zortex FX & FPS HUD (F4 ile aç/kapat, tıkla kapat)';
        stats.innerText = 'FX: INIT | E: 0 | B: 0 | P: 0';
        stats.addEventListener('click', () => this.toggleDomHUD(false));
        document.body.appendChild(stats);
      }
      this.domStats = stats;
    }

    toggleDomHUD(forceState) {
      this.hudVisible = (typeof forceState === 'boolean') ? forceState : !this.hudVisible;
      if (this.domStats) {
        this.domStats.style.display = this.hudVisible ? 'block' : 'none';
      }
      try {
        localStorage.setItem('zortex_show_fps_hud', this.hudVisible ? 'true' : 'false');
      } catch (_) {}
      if (typeof window.textManager !== 'undefined' && window.textManager && window.textManager.add && window.gameState === 'PLAYING') {
        window.textManager.add(`⚡ FX/FPS HUD: ${this.hudVisible ? 'AÇIK' : 'KAPALI'} (F4)`, window.W / 2, window.H / 3, '#00f3ff', 16, 1.2);
      }
      return this.hudVisible;
    }

    updateDomHUD(metrics, quality) {
      if (!this.hudVisible || !this.domStats) return;
      const rso = document.getElementById('runSetupOverlay');
      if (rso && !rso.classList.contains('hidden')) {
        this.domStats.style.bottom = '78px';
      } else {
        this.domStats.style.bottom = '12px';
      }
      const hist = this.getHistogram();
      this.domStats.innerText = `[${quality.toUpperCase()}] E: ${metrics.enemyCount} | B: ${metrics.bulletCount} | P: ${metrics.particleCount} | ${metrics.fps} FPS | ms: ${hist.median}/${hist.p95}/${hist.p99} | >20ms: ${hist.spikes20} | >33ms: ${hist.spikes33}`;
    }

    toggleTweakpane() {
      if (!window.Tweakpane || !window.Tweakpane.Pane) {
        console.warn('[ZortexFX] Tweakpane library not loaded.');
        return;
      }

      if (!this.pane) {
        try {
          this.pane = new window.Tweakpane.Pane({ title: '⚡ ZORTEX FX TUNER (F2)', expanded: true });
          const qFolder = this.pane.addFolder({ title: 'Grafik & Kalite', expanded: true });
          
          const params = {
            tier: window.ZortexFX.quality.currentTier,
            adaptive: window.ZortexFX.quality.isAdaptive,
            showFpsHud: this.hudVisible,
            bloom: window.ZortexFX.quality.config.bloom,
            bloomThreshold: window.ZortexFX.quality.config.bloomThreshold,
            bloomScale: window.ZortexFX.quality.config.bloomScale,
            maxParticles: window.ZortexFX.quality.config.maxParticles
          };

          qFolder.addBinding(params, 'tier', {
            options: { Low: 'low', Medium: 'medium', High: 'high', Ultra: 'ultra' }
          }).on('change', (ev) => {
            window.ZortexFX.quality.setTier(ev.value);
          });

          qFolder.addBinding(params, 'adaptive').on('change', (ev) => {
            window.ZortexFX.quality.isAdaptive = ev.value;
          });

          qFolder.addBinding(params, 'showFpsHud', { label: 'Telemetri HUD (F4)' }).on('change', (ev) => {
            this.toggleDomHUD(ev.value);
          });

          const bloomFolder = this.pane.addFolder({ title: 'Bloom Parametreleri', expanded: true });
          bloomFolder.addBinding(params, 'bloomScale', { min: 0.1, max: 2.0, step: 0.05 }).on('change', (ev) => {
            window.ZortexFX.quality.config.bloomScale = ev.value;
            window.ZortexFX.emit('bloomConfigChanged', window.ZortexFX.quality.config);
          });
          bloomFolder.addBinding(params, 'bloomThreshold', { min: 0.0, max: 0.8, step: 0.02 }).on('change', (ev) => {
            window.ZortexFX.quality.config.bloomThreshold = ev.value;
            window.ZortexFX.emit('bloomConfigChanged', window.ZortexFX.quality.config);
          });

          // [FX] FAZ 2: Canlı Nebula Tweakpane Kontrolleri
          const nebFolder = this.pane.addFolder({ title: 'Nebula Parametreleri (FAZ 2)', expanded: true });
          const nebParams = {
            procedural: window.ZortexFX.quality.config.nebulaProcedural,
            intensity: window.ZortexFX.nebula ? window.ZortexFX.nebula.intensity : 0.36,
            speed: window.ZortexFX.nebula ? window.ZortexFX.nebula.speed : 0.85
          };
          nebFolder.addBinding(nebParams, 'procedural').on('change', (ev) => {
            window.ZortexFX.quality.config.nebulaProcedural = ev.value;
            if (window.ZortexFX.nebula && window.ZortexFX.nebula.sprite) {
              window.ZortexFX.nebula.sprite.visible = ev.value;
            }
          });
          nebFolder.addBinding(nebParams, 'intensity', { min: 0.05, max: 1.0, step: 0.05 }).on('change', (ev) => {
            if (window.ZortexFX.nebula) window.ZortexFX.nebula.intensity = ev.value;
          });
          nebFolder.addBinding(nebParams, 'speed', { min: 0.1, max: 3.0, step: 0.1 }).on('change', (ev) => {
            if (window.ZortexFX.nebula) window.ZortexFX.nebula.speed = ev.value;
          });

          // [FX] FAZ 3: Canlı İzler & Patlamalar Tweakpane Kontrolleri
          const fx3Folder = this.pane.addFolder({ title: 'İzler & Patlamalar (FAZ 3)', expanded: true });
          const fx3Params = {
            trailsEnabled: window.ZortexFX.trails ? window.ZortexFX.trails.enabled : true,
            maxParticles: window.ZortexFX.quality.config.maxParticles
          };
          fx3Folder.addBinding(fx3Params, 'trailsEnabled').on('change', (ev) => {
            if (window.ZortexFX.trails) window.ZortexFX.trails.enabled = ev.value;
          });
          fx3Folder.addBinding(fx3Params, 'maxParticles', { min: 50, max: 800, step: 25 }).on('change', (ev) => {
            window.ZortexFX.quality.config.maxParticles = ev.value;
            if (window.particles) window.particles.maxLimit = ev.value;
          });

          // [FX] FAZ 4: Post-Process & Juice Tweakpane Kontrolleri
          const fx4Folder = this.pane.addFolder({ title: 'Post-Process & Juice (FAZ 4)', expanded: true });
          const fx4Params = {
            grain: window.ZortexFX.postProcess ? window.ZortexFX.postProcess.uGrainStrength : 0.03,
            vignette: window.ZortexFX.postProcess ? window.ZortexFX.postProcess.uVignetteStrength : 0.35,
            contrast: window.ZortexFX.postProcess ? window.ZortexFX.postProcess.uContrast : 1.08,
            saturation: window.ZortexFX.postProcess ? window.ZortexFX.postProcess.uSaturation : 1.10,
            reduceFlashing: window.ZortexFX.quality.reduceFlashing
          };
          fx4Folder.addBinding(fx4Params, 'grain', { min: 0.0, max: 0.08, step: 0.005 }).on('change', (ev) => {
            if (window.ZortexFX.postProcess) {
              window.ZortexFX.postProcess.uGrainStrength = ev.value;
              window.ZortexFX.postProcess.updateUniforms();
            }
          });
          fx4Folder.addBinding(fx4Params, 'vignette', { min: 0.0, max: 0.8, step: 0.02 }).on('change', (ev) => {
            if (window.ZortexFX.postProcess) {
              window.ZortexFX.postProcess.uVignetteStrength = ev.value;
              window.ZortexFX.postProcess.updateUniforms();
            }
          });
          fx4Folder.addBinding(fx4Params, 'contrast', { min: 0.9, max: 1.3, step: 0.01 }).on('change', (ev) => {
            if (window.ZortexFX.postProcess) {
              window.ZortexFX.postProcess.uContrast = ev.value;
              window.ZortexFX.postProcess.updateUniforms();
            }
          });
          fx4Folder.addBinding(fx4Params, 'saturation', { min: 0.9, max: 1.3, step: 0.01 }).on('change', (ev) => {
            if (window.ZortexFX.postProcess) {
              window.ZortexFX.postProcess.uSaturation = ev.value;
              window.ZortexFX.postProcess.updateUniforms();
            }
          });
          fx4Folder.addBinding(fx4Params, 'reduceFlashing').on('change', (ev) => {
            window.ZortexFX.quality.reduceFlashing = ev.value;
            if (window.gameSettings) window.gameSettings.reduceFlashing = ev.value;
          });
          fx4Folder.addButton({ title: '💥 Test Kromatik Hasar (RGB)' }).on('click', () => {
            window.ZortexFX.triggerDamageAberration(1.2);
          });
          fx4Folder.addButton({ title: '🌊 Test Şok Dalgası' }).on('click', () => {
            const px = window.player ? window.player.x : 640;
            const py = window.player ? window.player.y : 360;
            window.ZortexFX.triggerShockwave(px, py, 380, 0.6);
          });

          // [FX] FAZ 6: Işık & Derinlik Canlı Tweakpane Kontrolleri
          const fx6Folder = this.pane.addFolder({ title: 'Işık & Derinlik (FAZ 6)', expanded: true });
          const fx6Params = {
            lightsEnabled: window.ZortexFX.lights ? window.ZortexFX.lights.enabled : true,
            rimGlowEnabled: window.ZortexFX.rimGlow ? window.ZortexFX.rimGlow.enabled : true,
            lightIntensity: window.ZortexFX.lights ? window.ZortexFX.lights.baseIntensity : 1.0,
            rimIntensity: window.ZortexFX.rimGlow ? window.ZortexFX.rimGlow.uGlowIntensity : 1.35
          };
          fx6Folder.addBinding(fx6Params, 'lightsEnabled').on('change', (ev) => {
            if (window.ZortexFX.lights) window.ZortexFX.lights.enabled = ev.value;
          });
          fx6Folder.addBinding(fx6Params, 'rimGlowEnabled').on('change', (ev) => {
            if (window.ZortexFX.rimGlow) window.ZortexFX.rimGlow.setEnabled(ev.value);
          });
          fx6Folder.addBinding(fx6Params, 'lightIntensity', { min: 0.1, max: 2.5, step: 0.1 }).on('change', (ev) => {
            if (window.ZortexFX.lights) window.ZortexFX.lights.baseIntensity = ev.value;
          });
          fx6Folder.addBinding(fx6Params, 'rimIntensity', { min: 0.2, max: 3.0, step: 0.1 }).on('change', (ev) => {
            if (window.ZortexFX.rimGlow) window.ZortexFX.rimGlow.uGlowIntensity = ev.value;
          });
          fx6Folder.addButton({ title: '💡 Test Noktasal Işık Patlaması' }).on('click', () => {
            const px = window.player ? window.player.x : 640;
            const py = window.player ? window.player.y : 360;
            window.ZortexFX.addLight(px, py, 0x00f3ff, 260, 0.75, 1.2);
          });

          // [FX] FAZ 7: Ses-Görsel Senkron (Audio-Visual Sync)
          const fx7Folder = this.pane.addFolder({ title: 'Ses-Görsel Senkron (FAZ 7)', expanded: true });
          const fx7Params = {
            audioSyncEnabled: window.ZortexFX.audioSyncEnabled,
            bassSensitivity: window.ZortexFX.bassSensitivity
          };
          fx7Folder.addBinding(fx7Params, 'audioSyncEnabled').on('change', (ev) => {
            window.ZortexFX.audioSyncEnabled = ev.value;
          });
          fx7Folder.addBinding(fx7Params, 'bassSensitivity', { min: 0.2, max: 2.5, step: 0.1 }).on('change', (ev) => {
            window.ZortexFX.bassSensitivity = ev.value;
          });

          this.pane.element.parentElement.style.zIndex = '99999';
          this.isVisible = true;
        } catch (e) {
          console.error('[ZortexFX] Failed to initialize Tweakpane:', e);
        }
      } else {
        this.isVisible = !this.isVisible;
        this.pane.element.style.display = this.isVisible ? 'block' : 'none';
      }
    }
  }

  // Global FX Entry Point
  const fxInstance = new FXRegistry();
  fxInstance.quality = new QualityManager();
  fxInstance.bloom = new BloomManager();
  fxInstance.nebula = new NebulaManager();
  fxInstance.trails = new TrailFXManager();
  fxInstance.explosions = new ExplosionFXManager();
  fxInstance.postProcess = new PostProcessFXManager();
  fxInstance.lights = new LightFXManager();
  fxInstance.rimGlow = new RimGlowManager();
  fxInstance.gatlingBeams = new GatlingBeamFXManager();
  fxInstance.evolutionCinematic = new WeaponEvolutionCinematicManager();
  fxInstance.debug = new DebugPanel();
  fxInstance.audioSyncEnabled = true;
  fxInstance.bassSensitivity = 1.0;

  // Lifecycle Hooks called from index.html
  fxInstance.init = function() {
    try {
      this.debug.init();
      console.log('[ZortexFX] Core Engine Initialized.');
    } catch (err) {
      console.error('[ZortexFX] Init Error:', err);
    }
  };

  fxInstance.setupLayers = function(emissiveLayer, app) {
    try {
      this.bloom.setup(emissiveLayer, app);
    } catch (err) {
      console.error('[ZortexFX] setupLayers Error:', err);
    }
  };

  fxInstance.setupNebula = function(nebulaContainer, app) {
    try {
      this.nebula.setup(nebulaContainer, app);
    } catch (err) {
      console.error('[ZortexFX] setupNebula Error:', err);
    }
  };

  fxInstance.setupTrails = function(container, app) {
    try {
      this.trails.setup(container, app);
    } catch (err) {
      console.error('[ZortexFX] setupTrails Error:', err);
    }
  };

  fxInstance.setupExplosions = function(container, app) {
    try {
      this.explosions.setup(container, app);
    } catch (err) {
      console.error('[ZortexFX] setupExplosions Error:', err);
    }
  };

  fxInstance.setupPostProcess = function(worldContainer, app) {
    try {
      this.postProcess.setup(worldContainer, app);
    } catch (err) {
      console.error('[ZortexFX] setupPostProcess Error:', err);
    }
  };

  fxInstance.setupLights = function(container, app) {
    try {
      this.lights.setup(container, app);
    } catch (err) {
      console.error('[ZortexFX] setupLights Error:', err);
    }
  };

  fxInstance.setupRimGlow = function(container, app) {
    try {
      this.rimGlow.setup(container, app);
    } catch (err) {
      console.error('[ZortexFX] setupRimGlow Error:', err);
    }
  };

  fxInstance.setupGatlingBeams = function(container, app) {
    try {
      this.gatlingBeams.setup(container, app);
    } catch (err) {
      console.error('[ZortexFX] setupGatlingBeams Error:', err);
    }
  };

  fxInstance.setupBarrelOverlay = function(shipContainer, app) {
    try {
      this.gatlingBeams.setupBarrelOverlay(shipContainer);
    } catch (err) {
      console.error('[ZortexFX] setupBarrelOverlay Error:', err);
    }
  };

  fxInstance.triggerEvolutionCinematic = function(evolutionId, player) {
    try {
      this.evolutionCinematic.trigger(evolutionId, player);
    } catch (err) {
      console.error('[ZortexFX] triggerEvolutionCinematic Error:', err);
    }
  };

  fxInstance.addLight = function(x, y, color, radius, duration, intensity, attachTo) {
    try {
      return this.lights.addLight(x, y, color, radius, duration, intensity, attachTo);
    } catch (err) {
      return null;
    }
  };

  fxInstance.triggerExplosion = function(x, y, color, tier) {
    try {
      this.explosions.trigger(x, y, color, tier);
      if (this.lights) {
        if (tier === 3) {
          this.lights.addLight(x, y, color, 380, 1.25, 1.0);
        } else if (tier === 2) {
          this.lights.addLight(x, y, color, 240, 0.60, 0.85);
        } else {
          this.lights.addLight(x, y, color, 140, 0.35, 0.65);
        }
      }
    } catch (err) {
      // Safe fallback
    }
  };

  fxInstance.triggerDamageAberration = function(intensity) {
    try {
      this.postProcess.triggerDamageAberration(intensity);
    } catch (err) {
      // Safe fallback
    }
  };

  fxInstance.triggerRGBSplit = function(amount, duration) {
    try {
      this.postProcess.triggerDamageAberration(amount ? amount / 6.0 : 1.0);
    } catch (err) {
      // Safe fallback
    }
  };

  fxInstance.triggerShockwave = function(x, y, maxRadius, duration) {
    try {
      this.postProcess.triggerShockwave(x, y, maxRadius, duration);
    } catch (err) {
      // Safe fallback
    }
  };

  fxInstance.updateNebula = function(dt, wave, isBoss, curCamX, curCamY) {
    try {
      this.nebula.update(dt, wave, isBoss, curCamX, curCamY);
    } catch (err) {
      // Never crash the render loop
    }
  };

  fxInstance.update = function(rawDt, metrics, player, bullets, camX = 0, camY = 0, zoom = 1.0, shakeX = 0, shakeY = 0) {
    try {
      this.updateMetrics(metrics);
      this.quality.updateWatchdog(rawDt, metrics.fps);
      this.debug.recordFrame(rawDt);
      this.debug.updateDomHUD(metrics, this.quality.currentTier);
      if (this.trails) this.trails.update(rawDt, player || window.player, bullets || window.bullets);
      if (this.explosions) this.explosions.update(rawDt);
      if (this.postProcess) this.postProcess.update(rawDt, camX, camY, zoom, shakeX, shakeY);
      if (this.lights) this.lights.update(rawDt);
      if (this.rimGlow) this.rimGlow.update(rawDt, player || window.player);
      // NOT: gatlingBeams.update() burada çağrılmaz; gameLoop içinde player.update(dt) sonrasında
      // çağrılır. Aksi halde ışın gemi dönüşünün 1 kare gerisinde kalır.

      // [FX] FAZ 7: Ses-Görsel Senkronizasyon (Sub-Bass Modülasyonu)
      const rawPulse = (window.audio && typeof window.audio.getBassEnergy === 'function') ? window.audio.getBassEnergy() : 0.0;
      const audioPulse = this.audioSyncEnabled ? (rawPulse * this.bassSensitivity) : 0.0;
      const isBoss = Boolean(typeof isBossWave !== 'undefined' && isBossWave);
      if (this.bloom && typeof this.bloom.modulateAudio === 'function') {
        this.bloom.modulateAudio(audioPulse, isBoss);
      }
      if (this.nebula) {
        this.nebula.audioPulse = audioPulse;
      }
    } catch (err) {
      // Never crash the game loop
    }
  };

  fxInstance.getDensityAlpha = function(enemyCount = 0) {
    if (enemyCount < 20) return 1.0;
    return Math.max(0.42, 1.0 - (enemyCount - 20) * 0.0075);
  };

  window.ZortexFX = fxInstance;
})();
