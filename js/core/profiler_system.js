/**
 * ============================================================================
 * ZORTEX: CYBER SURVIVOR — DIAGNOSTIC PROFILER & QUALITY LADDER SYSTEM
 * File: js/core/profiler_system.js
 * 
 * Tasarım Belgesi Bölüm 13 (Sayfa 20-22):
 *  - 13.2 Profil Paneli: F3 ile açılır, kare süresi grafiği, ortalama/p99 ms,
 *        düşman, mermi, parçacık sayısı, draw call sayısı, GC duraklama göstergesi.
 *  - 13.3 Kademeli Kalite Merdiveni (6 Aşama):
 *        1. Hasar sayıları sadeleşir (yalnızca kritik ve elit, maks 40 adet)
 *        2. Parçacık sınırı yarıya iner (400 -> 200)
 *        3. Bloom yarım çözünürlüğe düşer ve gerekirse kapanır
 *        4. Gölgeler ve ışık sprite'ları kapanır
 *        5. Render ölçeği %100 -> %85 -> %70 (UI keskin kalır)
 *        6. Son çare: Arka plan efektleri durur
 *        - FPS toparlandığında 5 sn bekleyip yavaş yavaş geri çıkar.
 *  - 13.4 Kabul Kriterleri (Kapı 0):
 *        1000 düşman + 600 mermi stres testinde 60 FPS ortalama, p99 <= 22 ms.
 * ============================================================================
 */
(function() {
  'use strict';

  // ============================================================================
  // 1. KADEMELİ KALİTE MERDİVENİ (6 AŞAMA DYNAMIC QUALITY LADDER)
  // ============================================================================
  class QualityLadder {
    constructor() {
      this.activeStep = 0; // 0: Ultra/Normal, 1..6: Kademeli kısma
      this.stepNames = [
        'Aşama 0: Tam Kalite (AAA)',
        'Aşama 1: Hasar Sayıları Sadeleştirildi',
        'Aşama 2: Parçacıklar Yarıya İndirildi',
        'Aşama 3: Bloom Kısıldı / Kapatıldı',
        'Aşama 4: Işıklar ve Gölgeler Devre Dışı',
        'Aşama 5: Render Ölçeği Kısıldı (%85 / %70)',
        'Aşama 6: Arka Plan Efektleri Durduruldu'
      ];

      this.recoveryTimer = 0; // 5 saniye stabilite sayacı
      this.dropCooldown = 0;
      this.enabled = true;
    }

    setStep(step) {
      const prevStep = this.activeStep;
      this.activeStep = Math.max(0, Math.min(6, step));
      if (this.activeStep !== prevStep) {
        this.applySettings();
      }
    }

    stepDown() {
      if (this.activeStep < 6) {
        this.setStep(this.activeStep + 1);
        this.recoveryTimer = 0;
        this.dropCooldown = 1.2;
      }
    }

    stepUp() {
      if (this.activeStep > 0) {
        this.setStep(this.activeStep - 1);
        this.recoveryTimer = 0;
      }
    }

    applySettings() {
      const step = this.activeStep;

      // 1. Aşama: Hasar sayıları sadeleşir
      window.damageNumbersSimplified = (step >= 1);

      // 2. Aşama: Parçacık sınırı yarıya iner
      if (typeof window.particles !== 'undefined' && window.particles) {
        if (step >= 2) {
          window.particles.maxLimit = 200;
          if (window.particles.activeCount > 200) window.particles.activeCount = 200;
        } else {
          window.particles.maxLimit = 400;
        }
      }

      // 3. Aşama: Bloom yarım çözünürlük veya kapalı
      if (window.ZortexFX && window.ZortexFX.quality) {
        const qm = window.ZortexFX.quality;
        if (step >= 3) {
          if (qm.config) {
            qm.config.bloom = false;
            qm.config.bloomResolution = 0.25;
          }
          if (window.ZortexFX.emit) window.ZortexFX.emit('qualityChanged', qm.config);
        } else {
          if (qm.config) {
            qm.config.bloom = true;
            qm.config.bloomResolution = 0.50;
          }
          if (window.ZortexFX.emit) window.ZortexFX.emit('qualityChanged', qm.config);
        }
      }

      // 4. Aşama: Gölgeler ve ışık sprite'ları kapanır
      if (typeof window.pixiShadowsContainer !== 'undefined' && window.pixiShadowsContainer) {
        window.pixiShadowsContainer.visible = (step < 4);
      }
      if (window.ZortexFX && window.ZortexFX.lights) {
        window.ZortexFX.lights.enabled = (step < 4);
      }

      // 5. Aşama: Dinamik render ölçeği %100 -> %85 -> %70
      if (window.pixiApp && window.pixiApp.renderer) {
        let targetRes = 1.0;
        if (step === 5) targetRes = 0.85;
        else if (step >= 6) targetRes = 0.70;

        if (window.pixiApp.renderer.resolution !== targetRes && typeof window.pixiApp.renderer.resolution === 'number') {
          try {
            window.pixiApp.renderer.resolution = targetRes;
            if (typeof window.pixiApp.renderer.resize === 'function') {
              window.pixiApp.renderer.resize(window.innerWidth || 1280, window.innerHeight || 720);
            }
          } catch (_) {}
        }
      }

      // 6. Aşama: Arka plan efektleri durur
      window.pauseProceduralNebula = (step >= 6);

      // Geriye dönük uyumluluk: autoPerformanceMode
      window.autoPerformanceMode = (step > 0);
    }

    update(dt, fpsSmoothed) {
      if (!this.enabled) return;

      if (this.dropCooldown > 0) {
        this.dropCooldown -= dt;
      }

      // FPS < 48 ise kalite merdiveninden bir basamak in (kıs)
      if (fpsSmoothed < 48 && this.dropCooldown <= 0) {
        this.stepDown();
      }
      // FPS >= 58 ise 5 sn bekle ve yavaş yavaş geri çık
      else if (fpsSmoothed >= 58 && this.activeStep > 0) {
        this.recoveryTimer += dt;
        if (this.recoveryTimer >= 5.0) {
          this.stepUp();
        }
      } else {
        this.recoveryTimer = Math.max(0, this.recoveryTimer - dt * 0.5);
      }
    }
  }

  // ============================================================================
  // 2. HARDWARE DRAW CALL İZLEYİCİ (WEBGL HOOK)
  // ============================================================================
  class DrawCallTracker {
    constructor() {
      this.drawCalls = 0;
      this.lastFrameDrawCalls = 0;
      this.hooked = false;
    }

    attach(renderer) {
      if (this.hooked || !renderer) return;
      const gl = renderer.gl || (renderer.context && renderer.context.gl);
      if (!gl || gl.__drawCallTrackerHooked) return;

      gl.__drawCallTrackerHooked = true;
      const self = this;
      const origDrawElements = gl.drawElements;
      const origDrawArrays = gl.drawArrays;

      gl.drawElements = function(...args) {
        self.drawCalls++;
        return origDrawElements.apply(this, args);
      };

      gl.drawArrays = function(...args) {
        self.drawCalls++;
        return origDrawArrays.apply(this, args);
      };

      this.hooked = true;
    }

    beginFrame() {
      this.lastFrameDrawCalls = this.drawCalls;
      this.drawCalls = 0;
    }
  }

  // ============================================================================
  // 3. F3 PROFİLER TEŞHİS PANELİ & BENCHMARK HARNESS
  // ============================================================================
  class ZortexProfiler {
    constructor() {
      this.visible = false;
      this.domContainer = null;
      this.canvas = null;
      this.ctx = null;
      this.textEl = null;

      // 120 karelik kayan pencere
      this.frameTimes = new Float32Array(120);
      this.frameIndex = 0;
      this.lastTime = performance.now();

      // İstatistikler
      this.currentFps = 60;
      this.avgFps = 60;
      this.p99Ms = 16.6;
      this.avgMs = 16.6;
      this.gcSpikes = 0;
      this.gcSpikeWindow = [];

      this.drawTracker = new DrawCallTracker();
      this.ladder = new QualityLadder();

      this.initDom();
      this.setupKeyListeners();
    }

    initDom() {
      if (typeof document === 'undefined') return;

      const container = document.createElement('div');
      container.id = 'zortexProfilerHud';
      container.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 250px;
        background: rgba(4, 7, 16, 0.88);
        border: 1px solid #00f3ff;
        border-radius: 6px;
        box-shadow: 0 0 14px rgba(0, 243, 255, 0.25);
        padding: 8px 10px;
        font-family: 'Consolas', 'Courier New', monospace;
        font-size: 11px;
        line-height: 1.35;
        color: #e2e8f0;
        z-index: 999999;
        pointer-events: none;
        display: none;
        backdrop-filter: blur(4px);
      `;

      const header = document.createElement('div');
      header.style.cssText = `
        color: #00f3ff;
        font-weight: bold;
        font-size: 12px;
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid rgba(0, 243, 255, 0.3);
        padding-bottom: 3px;
      `;
      header.innerHTML = '<span>⚡ ZORTEX PROFILER</span><span style="color:#f59e0b;">F3</span>';
      container.appendChild(header);

      const canvas = document.createElement('canvas');
      canvas.width = 230;
      canvas.height = 55;
      canvas.style.cssText = `
        width: 230px;
        height: 55px;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        display: block;
        margin-bottom: 6px;
      `;
      container.appendChild(canvas);

      const textEl = document.createElement('div');
      textEl.style.cssText = 'white-space: pre-wrap; font-size: 10.5px;';
      container.appendChild(textEl);

      document.body.appendChild(container);
      this.domContainer = container;
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.textEl = textEl;
    }

    setupKeyListeners() {
      if (typeof window === 'undefined') return;
      window.addEventListener('keydown', (e) => {
        if (e.key === 'F3' || e.code === 'F3') {
          e.preventDefault();
          this.toggle();
        }
      });
    }

    toggle() {
      this.visible = !this.visible;
      if (this.domContainer) {
        this.domContainer.style.display = this.visible ? 'block' : 'none';
      }
    }

    update() {
      const now = performance.now();
      const deltaMs = Math.max(0.1, now - this.lastTime);
      this.lastTime = now;

      // Draw call kancasını bağla
      if (!this.drawTracker.hooked && window.pixiApp && window.pixiApp.renderer) {
        this.drawTracker.attach(window.pixiApp.renderer);
      }
      this.drawTracker.beginFrame();

      // Dairesel tampona kare süresini kaydet
      this.frameTimes[this.frameIndex] = deltaMs;
      this.frameIndex = (this.frameIndex + 1) % this.frameTimes.length;

      // GC / Spike tespiti (> 22 ms kareler)
      if (deltaMs > 22.0) {
        this.gcSpikeWindow.push(now);
      }
      // Son 10 saniyedeki sıçramaları koru
      while (this.gcSpikeWindow.length > 0 && (now - this.gcSpikeWindow[0]) > 10000) {
        this.gcSpikeWindow.shift();
      }
      this.gcSpikes = this.gcSpikeWindow.length;

      // Metrikleri hesapla
      let sum = 0;
      let sorted = [];
      for (let i = 0; i < this.frameTimes.length; i++) {
        const val = this.frameTimes[i];
        if (val > 0) {
          sum += val;
          sorted.push(val);
        }
      }
      sorted.sort((a, b) => a - b);

      this.avgMs = sorted.length ? (sum / sorted.length) : 16.6;
      this.avgFps = this.avgMs > 0 ? (1000 / this.avgMs) : 60;
      const p99Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99));
      this.p99Ms = sorted.length ? sorted[p99Index] : 16.6;

      // Kalite merdivenini güncelle
      this.ladder.update(deltaMs * 0.001, this.avgFps);

      // Panel görünürse görsel güncelleme yap
      if (this.visible) {
        this.renderHud(deltaMs);
      }
    }

    renderHud(currentMs) {
      if (!this.ctx || !this.textEl) return;

      // 1. Kare Süresi Grafiğini Çiz
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Kılavuz çizgileri: 16.6ms (60 FPS) ve 22.2ms (45 FPS)
      const maxMs = 35.0; // Tavan skalası
      const y16 = h - (16.6 / maxMs) * h;
      const y22 = h - (22.2 / maxMs) * h;

      ctx.strokeStyle = 'rgba(0, 255, 136, 0.35)';
      ctx.beginPath();
      ctx.moveTo(0, y16);
      ctx.lineTo(w, y16);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 180, 0, 0.35)';
      ctx.beginPath();
      ctx.moveTo(0, y22);
      ctx.lineTo(w, y22);
      ctx.stroke();

      // Barları çiz
      const barCount = this.frameTimes.length;
      const barW = w / barCount;
      const startIndex = this.frameIndex;

      for (let i = 0; i < barCount; i++) {
        const idx = (startIndex + i) % barCount;
        const ms = this.frameTimes[idx];
        if (ms <= 0) continue;

        const barH = Math.min(h, (ms / maxMs) * h);
        const x = i * barW;
        const y = h - barH;

        if (ms <= 16.7) {
          ctx.fillStyle = '#00ff88'; // 60 FPS üstü: Yeşil
        } else if (ms <= 22.2) {
          ctx.fillStyle = '#f59e0b'; // 45-60 FPS: Sarı
        } else {
          ctx.fillStyle = '#ef4444'; // > 22ms Tepe / Spike: Kırmızı
        }
        ctx.fillRect(x, y, Math.max(1, barW - 0.5), barH);
      }

      // 2. Metin Bilgilerini Güncelle
      const enemiesCount = (typeof window.enemies !== 'undefined' && Array.isArray(window.enemies)) ? window.enemies.length : 0;
      const bulletsCount = (typeof window.bullets !== 'undefined' && Array.isArray(window.bullets)) ? window.bullets.length : 0;
      const eBulletsCount = (typeof window.enemyBullets !== 'undefined' && Array.isArray(window.enemyBullets)) ? window.enemyBullets.length : 0;
      const particlesCount = (window.particles && typeof window.particles.activeCount === 'number') ? window.particles.activeCount : 0;
      const drawCalls = this.drawTracker.lastFrameDrawCalls || 0;

      const fpsColor = this.avgFps >= 58 ? '#00ff88' : (this.avgFps >= 45 ? '#f59e0b' : '#ef4444');
      const p99Color = this.p99Ms <= 22.0 ? '#00ff88' : '#ef4444';

      let html = '';
      html += `FPS: <span style="color:${fpsColor};font-weight:bold;">${this.avgFps.toFixed(1)}</span> (Kare: ${currentMs.toFixed(1)}ms)\n`;
      html += `Ort: ${this.avgMs.toFixed(1)}ms | p99: <span style="color:${p99Color};font-weight:bold;">${this.p99Ms.toFixed(1)}ms</span>\n`;
      html += `Düşman: <span style="color:#00f3ff;">${enemiesCount}</span> | Mermi: <span style="color:#00f3ff;">${bulletsCount + eBulletsCount}</span>\n`;
      html += `Parçacık: <span style="color:#f59e0b;">${particlesCount}</span> | Draw Call: <span style="color:#a855f7;">${drawCalls}</span>\n`;
      html += `Kalite: <span style="color:#38bdf8;">${this.ladder.stepNames[this.ladder.activeStep]}</span>\n`;
      html += `GC / Sıçrama (>22ms/10s): <span style="color:${this.gcSpikes > 0 ? '#ef4444' : '#00ff88'}">${this.gcSpikes}</span>`;

      this.textEl.innerHTML = html;
    }

    /**
     * Otomatik Benchmark Test Koşucusu (Headless & Canlı)
     * Bölüm 13.4: 1000 Düşman + 600 Mermi Stres Testi
     */
    async runBenchmark(options = {}) {
      const targetEnemies = options.enemyCount || 1000;
      const targetBullets = options.bulletCount || 600;
      const durationMs = options.durationMs || 5000;

      console.log(`[ZORTEX BENCHMARK] Başlatılıyor: ${targetEnemies} Düşman, ${targetBullets} Mermi, ${durationMs}ms...`);

      // 1. Geçici Test Düşmanları ve Mermilerini Üret
      const spawnedEnemies = [];
      const spawnedBullets = [];

      const W = window.innerWidth || 1280;
      const H = window.innerHeight || 720;

      if (window.enemies && Array.isArray(window.enemies) && typeof window.Enemy !== 'undefined') {
        const toAdd = Math.max(0, targetEnemies - window.enemies.length);
        for (let i = 0; i < toAdd; i++) {
          const x = Math.random() * W;
          const y = Math.random() * H;
          try {
            const e = new window.Enemy(x, y, 'scout', 1);
            e.__benchmarkEntity = true;
            window.enemies.push(e);
            spawnedEnemies.push(e);
          } catch (_) {}
        }
      }

      if (window.bullets && Array.isArray(window.bullets) && typeof window.Bullet !== 'undefined') {
        const toAdd = Math.max(0, targetBullets - window.bullets.length);
        for (let i = 0; i < toAdd; i++) {
          const x = Math.random() * W;
          const y = Math.random() * H;
          try {
            const b = new window.Bullet(x, y, Math.random() * Math.PI * 2, 25, '#00f3ff', 12, false, false);
            b.__benchmarkEntity = true;
            b.life = 9999;
            window.bullets.push(b);
            spawnedBullets.push(b);
          } catch (_) {}
        }
      }

      // 2. Belirtilen süre boyunca kare sürelerini kaydet
      const startTime = performance.now();
      const recordedFrames = [];

      await new Promise(resolve => {
        const collector = () => {
          const now = performance.now();
          recordedFrames.push(now);
          if (now - startTime < durationMs) {
            requestAnimationFrame(collector);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(collector);
      });

      // 3. Geçici Test Varlıklarını Güvenle Temizle
      if (window.enemies) {
        for (let i = 0; i < spawnedEnemies.length; i++) {
          const e = spawnedEnemies[i];
          if (e) {
            e.dead = true;
            if (typeof e.destroy === 'function') e.destroy();
          }
        }
        if (typeof window.compactEnemies === 'function') {
          window.compactEnemies();
        } else {
          window.enemies = window.enemies.filter(e => !e.__benchmarkEntity);
        }
      }

      if (window.bullets) {
        for (let i = 0; i < spawnedBullets.length; i++) {
          const b = spawnedBullets[i];
          if (b && typeof b.destroy === 'function') b.destroy();
        }
        window.bullets = window.bullets.filter(b => !b.__benchmarkEntity);
      }

      // 4. İstatistik Raporu Hesapla
      const intervals = [];
      for (let i = 1; i < recordedFrames.length; i++) {
        intervals.push(recordedFrames[i] - recordedFrames[i - 1]);
      }
      intervals.sort((a, b) => a - b);

      const totalFrames = intervals.length;
      const sumMs = intervals.reduce((a, b) => a + b, 0);
      const avgMs = totalFrames ? (sumMs / totalFrames) : 16.6;
      const avgFps = avgMs > 0 ? (1000 / avgMs) : 60;
      const minFps = intervals.length ? (1000 / intervals[intervals.length - 1]) : 60;
      const maxMs = intervals.length ? intervals[intervals.length - 1] : 16.6;
      const p99Index = Math.min(intervals.length - 1, Math.floor(intervals.length * 0.99));
      const p99Ms = intervals.length ? intervals[p99Index] : 16.6;

      const gcSpikes = intervals.filter(ms => ms > 22.0).length;
      const passedGate0 = (avgFps >= 59.0 && p99Ms <= 22.0);

      const report = {
        targetEnemies,
        targetBullets,
        durationMs,
        totalFrames,
        avgFps: Number(avgFps.toFixed(2)),
        minFps: Number(minFps.toFixed(2)),
        avgFrameTimeMs: Number(avgMs.toFixed(2)),
        maxFrameTimeMs: Number(maxMs.toFixed(2)),
        p99Ms: Number(p99Ms.toFixed(2)),
        gcSpikes,
        qualityLadderStep: this.ladder.activeStep,
        passedGate0
      };

      window.__benchmarkResults = report;
      console.log('[ZORTEX BENCHMARK] Sonuç Raporu:', report);
      return report;
    }
  }

  // Singleton oluştur ve dışa aktar
  const profiler = new ZortexProfiler();
  window.ZortexProfiler = profiler;
  window.ZortexQualityLadder = profiler.ladder;
  window.runBenchmark = (opts) => profiler.runBenchmark(opts);

})();
