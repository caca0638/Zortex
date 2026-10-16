/**
 * ==============================================================
 * ZORTEX AAA CAMERA & TRAUMA SYSTEM (VISUAL JUICE 2.0)
 * ==============================================================
 * 
 * - Non-linear Quadratic Trauma (T^2) Curve
 * - Rotational & Dual-Frequency Harmonic Camera Shake
 * - Directional Kinetic Kickback with Spring-Damper Physics
 * - Dynamic Speed & Dash FOV Zoom (Hypersonic Velocity Sense)
 * - Zero-Drift Pivot Matrix Transform on PixiJS GPU Stage
 */

(function (window) {
  'use strict';

  class CameraTraumaSystem {
    constructor() {
      // Trauma Parametreleri (Görsel Rahatlık İçin Yumuşatılmış & Kısılmış)
      this.trauma = 0;              // [0.0 - 0.65] Aralığı
      this.decayRate = 2.8;         // Saniyede hızlı ve tok sönümlenme hızı
      this.maxOffset = 8.5;         // Maksimum piksel ötelemesi (X/Y) - Aşırı sarsıntıyı önleyen nazik sınır
      this.maxAngle = 0.010;        // Maksimum rotasyon açısı (~0.5 derece) - Baş dönmesini sıfırlar

      // Yönlü Kinetik Geri Tepme (Kinetic Kickback)
      this.kickX = 0;
      this.kickY = 0;
      this.kickSpring = 24.0;       // Yay geri çekme kuvveti
      this.kickDamping = 0.65;      // Hızlı toparlanma sönümleme katsayısı

      // Dinamik FOV & Zoom Sistemi
      this.zoom = 1.0;              // Mevcut kamera ölçeği
      this.targetZoom = 1.0;        // Hedeflenen kamera ölçeği
      this.zoomPunch = 0;           // Anlık darbe yakınlaştırması
      this.zoomPunchSpeed = 9.0;    // Zoom yumuşatma hızı

      // Çıktı Matrisi
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeRot = 0;

      // [DUAL-ZONE] Çift Bölgeli Sonsuz Dünya Takip Parametreleri
      this.worldX = 0;              // Kameranın dünyadaki mutlak X konumu
      this.worldY = 0;              // Kameranın dünyadaki mutlak Y konumu
      this.initialized = false;
      this.deadzoneRadius = 35;     // İç ölü alan (Huzurlu bölge: 0.45x yumuşak mikrotakip)
      this.catchupRadius = 110;     // Dış yakalama sınırı (1.15x dinamik takip)
      this.deadzoneLerpMult = 0.45; // Ölü alan içindeki sönümlenmiş takip katsayısı
      this.maxAimPeek = 28;         // Nişan yönünde hafif sınırlı bakış (Gemi daima ekran merkezinde kalır)

      // Geriye dönük uyumluluk
      this.camX = 0;
      this.camY = 0;

      // Deterministik Harmonik Tohum
      this.seed = Math.random() * 1000.0;
    }

    /**
     * Travma ekler (Non-linear quadratic sarsıntı üretir - Kısılmış & Yumuşatılmış)
     * @param {number} amount Eklenen travma miktarı (0.0 - 1.0)
     * @param {number} [dirAngle=null] Darbe veya geri tepme açısı (Radyan)
     * @param {number} [kickForce=0] Yönlü kinetik itme kuvveti
     */
    addTrauma(amount, dirAngle = null, kickForce = 0) {
      const mult = (typeof window.gameSettings !== 'undefined' && typeof window.gameSettings.screenShake === 'number')
        ? window.gameSettings.screenShake
        : 1.0;

      if (mult <= 0) return;

      // Aşırı sarsıntıyı engellemek için %55 genel filtre katsayısı
      const scaledAmount = amount * 0.45;
      this.trauma = Math.min(0.65, this.trauma + scaledAmount * mult);

      // Yönlü Geri Tepme: Darbe yönünün TERSİNE kamerayı nazikçe iter (Hafifletilmiş Kick)
      if (dirAngle !== null && kickForce > 0) {
        this.kickX -= Math.cos(dirAngle) * (kickForce * 0.35) * mult;
        this.kickY -= Math.sin(dirAngle) * (kickForce * 0.35) * mult;
      }
    }

    /**
     * Ani mikro-yakınlaştırma darbesi (Zoom Punch)
     * @param {number} amount Yakınlaşma miktarı (Örn: 0.04 - 0.08)
     */
    punchZoom(amount) {
      const mult = (typeof window.gameSettings !== 'undefined' && typeof window.gameSettings.screenShake === 'number')
        ? window.gameSettings.screenShake
        : 1.0;
      if (mult <= 0) return;
      this.zoomPunch = Math.min(0.04, this.zoomPunch + amount * 0.35 * mult);
    }

    /**
     * 144Hz Delta Time Uyumlu Güncelleme
     * @param {number} dt Delta time (saniye)
     * @param {Object} player Oyuncu nesnesi
     * @param {boolean} isDashing Dash durumu
     */
    update(dt, player, isDashing = false) {
      const dtClamped = Math.max(0.001, Math.min(0.05, dt));

      // 1. Travma Sönümlenmesi (Doğrusal sönümlenir, ancak karesel etki üretir)
      if (this.trauma > 0) {
        this.trauma = Math.max(0, this.trauma - this.decayRate * dtClamped);
      }

      // Karesel Şiddet Eğrisi (Non-Linear Quadratic Curve - Vlambeer / Nuclear Throne Standardı)
      const shakeIntensity = this.trauma * this.trauma;

      // 2. Harmonik Çift-Frekanslı Salınım (Doğal & Organik Titreşim)
      const t = performance.now() * 0.001;
      const fX = 38.5, fY = 46.2, fR = 31.8;
      this.shakeX = this.maxOffset * shakeIntensity * Math.sin(t * fX + this.seed) + this.kickX;
      this.shakeY = this.maxOffset * shakeIntensity * Math.cos(t * fY + this.seed * 1.6) + this.kickY;
      this.shakeRot = this.maxAngle * shakeIntensity * Math.sin(t * fR + this.seed * 2.3);

      // Kinetik Geri Tepme Yay Sönümlemesi
      const dtNorm = dtClamped * 60;
      this.kickX *= Math.pow(this.kickDamping, dtNorm);
      this.kickY *= Math.pow(this.kickDamping, dtNorm);
      if (Math.abs(this.kickX) < 0.05) this.kickX = 0;
      if (Math.abs(this.kickY) < 0.05) this.kickY = 0;

      // 3. Dinamik Hız & Dash FOV Zoom'u (Hypersonic Genişleme)
      let desiredZoom = 1.0;
      if (isDashing) {
        desiredZoom = 0.945; // Dash sırasında geriye çekilerek geniş savaş alanı sunar
      } else if (player && (player.isUltimateActive || player.overdriveActive)) {
        desiredZoom = 0.965; // Overdrive sırasında hafif genişleme
      } else if (player) {
        const pSpeed = Math.hypot(player.vx || 0, player.vy || 0);
        if (pSpeed > 4.2) {
          desiredZoom = 0.978;
        }
      }

      // Zoom Punch Sönümlemesi
      if (this.zoomPunch > 0.001) {
        this.zoomPunch *= Math.pow(0.82, dtNorm);
      } else {
        this.zoomPunch = 0;
      }

      this.targetZoom = desiredZoom + this.zoomPunch;
      this.zoom += (this.targetZoom - this.zoom) * Math.min(1.0, dtClamped * this.zoomPunchSpeed);

      // 4. Çift Bölgeli (Dual-Zone) Dinamik Kamera Takibi
      if (player) {
        if (!this.initialized) {
          this.worldX = player.x;
          this.worldY = player.y;
          this.initialized = true;
        }

        // Ana odak çıpası: Oyuncu gemisi + Sınırlı mikro nişan bakışı
        const peekDist = isDashing ? 60 : this.maxAimPeek;
        const aimAngle = (typeof player.angle === 'number') ? player.angle : 0;
        const targetX = player.x + Math.cos(aimAngle) * peekDist;
        const targetY = player.y + Math.sin(aimAngle) * peekDist;

        const dx = targetX - this.worldX;
        const dy = targetY - this.worldY;
        const dist = Math.hypot(dx, dy);

        // Kademeli Sönümleme Katsayısı (Dual-Zone Spring-Damper)
        let speedMult = this.deadzoneLerpMult; // Ölü alanda 0.45x yumuşak takip
        if (dist > this.deadzoneRadius) {
          if (dist >= this.catchupRadius) {
            speedMult = 1.15 + Math.min(1.5, (dist - this.catchupRadius) / 50.0);
          } else {
            // Yumuşak karesel geçiş (Smoothstep ramp)
            const ratio = (dist - this.deadzoneRadius) / (this.catchupRadius - this.deadzoneRadius);
            speedMult = this.deadzoneLerpMult + (1.15 - this.deadzoneLerpMult) * (ratio * ratio);
          }
        }

        if (isDashing) {
          speedMult = Math.max(speedMult, 1.6);
        }

        const baseRate = isDashing ? 18.0 : 13.5;
        const effectiveRate = baseRate * speedMult;
        const step = Math.min(1.0, dtClamped * effectiveRate);

        this.worldX += dx * step;
        this.worldY += dy * step;
      }

      this.camX = this.worldX;
      this.camY = this.worldY;
    }

    /**
     * PixiJS GPU Sahne Konteynerine (worldContainer) Dönüşüm Uygular
     * @param {PIXI.Container} worldContainer GPU ana konteyneri
     * @param {Object} player Oyuncu nesnesi
     * @param {number} W Ekran genişliği
     * @param {number} H Ekran yüksekliği
     */
    applyTo(worldContainer, player, W, H) {
      if (!worldContainer) return;

      // Kamera dünyadaki (worldX, worldY) merkezini ekranın ortasına (W/2, H/2) oturtur
      worldContainer.pivot.set(this.worldX, this.worldY);
      worldContainer.scale.set(this.zoom);
      worldContainer.rotation = this.shakeRot;
      worldContainer.position.set(
        (W * 0.5) + this.shakeX,
        (H * 0.5) + this.shakeY
      );
    }

    /**
     * Sıfırla
     */
    reset() {
      this.trauma = 0;
      this.kickX = 0;
      this.kickY = 0;
      this.zoom = 1.0;
      this.targetZoom = 1.0;
      this.zoomPunch = 0;
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeRot = 0;
      this.worldX = 0;
      this.worldY = 0;
      this.camX = 0;
      this.camY = 0;
      this.initialized = false;
    }
  }

  // Global Singleton Kurulumu
  const cameraInstance = new CameraTraumaSystem();
  window.ZortexCamera = cameraInstance;

  console.log('[ZortexCamera] AAA Trauma Screen Shake & Dynamic FOV System initialized.');
})(window);
