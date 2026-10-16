/**
 * ============================================================================
 * ZORTEX: CYBER SURVIVOR - THREAT & COMBAT READABILITY ENGINE
 * Module: js/gameplay/threat_system.js
 * Architecture: 144Hz Zero-GC Modular Hazard & Enemy Telegraph System
 * ============================================================================
 */
(function() {
  'use strict';

  class ThreatSystem {
    constructor() {
      this.app = null;
      this.telegraphGraphics = null;
      this.enabled = true;
      this.telegraphs = [];
      this.maxTelegraphs = 32;

      // Havuzlanmış ön uyarı nesneleri (Zero GC)
      for (let i = 0; i < this.maxTelegraphs; i++) {
        this.telegraphs.push({
          active: false,
          source: null,
          startX: 0,
          startY: 0,
          angle: 0,
          length: 1200,
          duration: 0.5,
          maxDuration: 0.5,
          color: 0xff0044,
          onComplete: null
        });
      }
    }

    setup(app, parentContainer) {
      if (!app) return;
      this.app = app;

      // 1. Telegraph Çizim Katmanı (Düşmanların ve mermilerin hemen altında, temiz kontrast)
      if (!this.telegraphGraphics && parentContainer) {
        this.telegraphGraphics = new PIXI.Graphics();
        this.telegraphGraphics.label = 'zortexTelegraphGraphics';
        parentContainer.addChild(this.telegraphGraphics);
      }

      // 2. Yüksek Kontrastlı Düşman Mermisi Dokularını Üret
      this.initHazardTextures(app);
    }

    initHazardTextures(app) {
      if (!app || !app.renderer) return;
      try {
        if (!window.pixiTextures) window.pixiTextures = {};

        // A) Standart Düşman Mermisi (17px): Derin siyah dış kontrast kalkanı + Kor Kırmızı + Ak Çekirdek
        const gStd = new PIXI.Graphics();
        gStd.lineStyle(2.0, 0x020208, 0.95);
        gStd.beginFill(0xff0055, 0.95);
        gStd.drawCircle(0, 0, 7.5);
        gStd.endFill();
        gStd.lineStyle(0);
        gStd.beginFill(0xff6600, 1.0);
        gStd.drawCircle(0, 0, 4.2);
        gStd.endFill();
        gStd.beginFill(0xffffff, 1.0);
        gStd.drawCircle(0, 0, 2.0);
        gStd.endFill();
        window.pixiTextures.bullet_enemy = app.renderer.generateTexture(gStd);

        // B) Ağır Kruvazör Mermisi (25px): Kalın siluet + Molten Amber + Şok Çekirdeği
        const gHvy = new PIXI.Graphics();
        gHvy.lineStyle(2.4, 0x020208, 0.98);
        gHvy.beginFill(0xff7700, 0.95);
        gHvy.drawCircle(0, 0, 11.0);
        gHvy.endFill();
        gHvy.lineStyle(0);
        gHvy.beginFill(0xffcc00, 1.0);
        gHvy.drawCircle(0, 0, 6.0);
        gHvy.endFill();
        gHvy.beginFill(0xffffff, 1.0);
        gHvy.drawCircle(0, 0, 2.8);
        gHvy.endFill();
        window.pixiTextures.bullet_enemy_heavy = app.renderer.generateTexture(gHvy);

        // C) Boss Omega Küresi (34px): Dev siluet + Magenta/Mor Kozmik Plazma + Camgöbeği İyonik Çekirdek
        const gBoss = new PIXI.Graphics();
        gBoss.lineStyle(2.8, 0x020208, 0.98);
        gBoss.beginFill(0xd946ef, 0.92);
        gBoss.drawCircle(0, 0, 15.0);
        gBoss.endFill();
        gBoss.lineStyle(0);
        gBoss.beginFill(0xec4899, 1.0);
        gBoss.drawCircle(0, 0, 8.5);
        gBoss.endFill();
        gBoss.beginFill(0xffffff, 1.0);
        gBoss.drawCircle(0, 0, 4.0);
        gBoss.endFill();
        window.pixiTextures.bullet_enemy_boss = app.renderer.generateTexture(gBoss);

      } catch (err) {
        console.warn('[ZortexThreats] Texture init warning:', err);
      }
    }

    /**
     * Düşman ateş etmeden veya hücum etmeden önce ekranda beliren uyarı lazer hattı / koridoru (Telegraph)
     */
    addTelegraph(source, angle, duration = 0.45, length = 1200, color = 0xff0055, onComplete = null, width = 2) {
      if (!this.enabled) return null;
      for (let i = 0; i < this.telegraphs.length; i++) {
        const t = this.telegraphs[i];
        if (!t.active) {
          t.active = true;
          t.source = source;
          t.startX = source ? source.x : 0;
          t.startY = source ? source.y : 0;
          t.angle = angle;
          t.length = length;
          t.duration = duration;
          t.maxDuration = duration;
          t.color = color;
          t.onComplete = onComplete;
          t.width = width;
          return t;
        }
      }
      return null;
    }

    update(dt, player, enemyBullets, enemies) {
      if (!this.enabled) return;

      // 1. Telegraph Çizimlerinin Güncellenmesi & Render Edilmesi
      if (this.telegraphGraphics) {
        this.telegraphGraphics.clear();

        for (let i = 0; i < this.telegraphs.length; i++) {
          const t = this.telegraphs[i];
          if (!t.active) continue;

          t.duration -= dt;

          // Kaynak düşman yaşıyorsa onunla beraber hareket etsin
          if (t.source && t.source.hp > 0) {
            t.startX = t.source.x;
            t.startY = t.source.y;
            // Eğer kaynak oyuncuya nişan alıyorsa ve geniş koridor değilse açıyı hafifçe lerp ile takip etsin
            if (player && (t.width || 2) <= 6) {
              const targetAng = Math.atan2(player.y - t.startY, player.x - t.startX);
              let diff = (targetAng - t.angle) % (Math.PI * 2);
              if (diff > Math.PI) diff -= Math.PI * 2;
              if (diff < -Math.PI) diff += Math.PI * 2;
              t.angle += diff * Math.min(1.0, dt * 4.5);
            }
          }

          if (t.duration <= 0) {
            t.active = false;
            if (typeof t.onComplete === 'function') {
              try { t.onComplete(t); } catch (e) {}
            }
            continue;
          }

          const progress = 1.0 - (t.duration / t.maxDuration);
          const endX = t.startX + Math.cos(t.angle) * t.length;
          const endY = t.startY + Math.sin(t.angle) * t.length;

          // Son 0.12 saniyede beyaz-sıcak lazer parlaması (Ateş / Hücum anı uyarısı)
          const isCritical = t.duration < 0.12;
          const lineAlpha = isCritical ? 0.95 : (0.25 + 0.55 * progress);
          const lineColor = isCritical ? 0xffffff : t.color;

          if ((t.width || 2) > 6) {
            // GENİŞ TEHLİKE KORİDORU (Boss Ramming / Ağır Işın Koridoru)
            const halfW = (t.width || 20) * 0.5;
            const perpX = -Math.sin(t.angle) * halfW;
            const perpY = Math.cos(t.angle) * halfW;

            // Yarı-saydam dolgu koridoru
            const fillAlpha = isCritical ? 0.40 : (0.08 + 0.18 * progress);
            this.telegraphGraphics.lineStyle(1.6, lineColor, lineAlpha);
            this.telegraphGraphics.beginFill(lineColor, fillAlpha);
            this.telegraphGraphics.moveTo(t.startX + perpX, t.startY + perpY);
            this.telegraphGraphics.lineTo(endX + perpX, endY + perpY);
            this.telegraphGraphics.lineTo(endX - perpX, endY - perpY);
            this.telegraphGraphics.lineTo(t.startX - perpX, t.startY - perpY);
            this.telegraphGraphics.closePath();
            this.telegraphGraphics.endFill();

            // Merkez ince kılavuz hattı
            this.telegraphGraphics.lineStyle(1.4, 0xffffff, lineAlpha * 0.7);
            this.telegraphGraphics.moveTo(t.startX, t.startY);
            this.telegraphGraphics.lineTo(endX, endY);
          } else {
            // HASSAS TEHDİT İĞNESİ (Standart Lazer / Sniper)
            const lineWidth = isCritical ? 3.8 : (1.2 + 1.2 * progress);

            // Dış ince koyu kılavuz gölgesi (Kontrast)
            this.telegraphGraphics.lineStyle(lineWidth + 2.2, 0x020208, lineAlpha * 0.5);
            this.telegraphGraphics.moveTo(t.startX, t.startY);
            this.telegraphGraphics.lineTo(endX, endY);

            // İç parlak tehdit iğnesi
            this.telegraphGraphics.lineStyle(lineWidth, lineColor, lineAlpha);
            this.telegraphGraphics.moveTo(t.startX, t.startY);
            this.telegraphGraphics.lineTo(endX, endY);
          }
        }
      }

      // 2. Graze (Mükemmel Sıyırma) & Tehlike Algılayıcı (Skill-Ceiling)
      const isPlayerAlive = Boolean(player && ((typeof player.health === 'number' && player.health > 0) || (typeof player.hp === 'number' && player.hp > 0)));
      if (isPlayerAlive && enemyBullets && enemyBullets.length > 0) {
        const px = player.x;
        const py = player.y;
        const pRad = player.radius || 18;
        const grazeThreshold = pRad + 16;

        for (let i = 0; i < enemyBullets.length; i++) {
          const eb = enemyBullets[i];
          if (!eb || eb.life <= 0 || eb.hasGrazed) continue;

          const dist = Math.hypot(eb.x - px, eb.y - py);

          // Oyuncunun gövdesine çarpmadı ama hemen yanından teğet geçti
          if (dist > pRad && dist < grazeThreshold) {
            eb.hasGrazed = true;

            // Ödül: Overdrive Ultimate barına ufak +%1.5 enerji
            if (typeof player.gainUltimate === 'function') {
              player.gainUltimate(1.5);
            } else if (typeof player.ultimateCharge === 'number' && player.ultimateCharge < (player.maxUltimate || 100)) {
              player.ultimateCharge = Math.min(player.maxUltimate || 100, player.ultimateCharge + 1.5);
            }

            // Görsel Sıyırma Kıvılcımı (Graze Spark)
            if (typeof particles !== 'undefined' && particles && typeof particles.emit === 'function') {
              particles.emit(eb.x, eb.y, '#ffe600', 3, 2.2, 2.0, 0.16);
            }

            // Hafif dokunsal geri bildirim
            if (typeof triggerRumble === 'function') {
              triggerRumble('light');
            }
          }
        }
      }
    }
  }

  window.ZortexThreats = new ThreatSystem();
})();
