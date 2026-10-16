/**
 * ============================================================================
 * ZORTEX: CYBER SURVIVOR - ENEMY & BOSS REGISTRY ENGINE
 * Module: js/gameplay/enemy_registry.js
 * Architecture: 144Hz Tactical Enemy Archetypes & Multi-Part Boss Systems
 * ============================================================================
 */
(function() {
  'use strict';

  class EnemyRegistry {
    constructor() {
      this.app = null;
      this.tetherGraphics = null;
      this.enabled = true;
      this.classesInitialized = false;
      this.activeBoss = null;
      this.bossSubsystems = [];
    }

    setup(app, entitiesLayer) {
      if (!app) return;
      this.app = app;

      // 1. Kalkan Bağlantı Çizimleri (Tether Graphics - Varlık katmanının en altında)
      if (!this.tetherGraphics && entitiesLayer) {
        this.tetherGraphics = new PIXI.Graphics();
        this.tetherGraphics.label = 'zortexEnemyTethers';
        // Düşmanların hemen altında görünmesi için katmanın başına ekle
        entitiesLayer.addChildAt(this.tetherGraphics, 0);
      }

      // 2. Prosedürel Dokuları Üret
      this.initTextures(app);

      // 3. Sınıf tanımlarını hazırla
      this.initClasses();
    }

    initTextures(app) {
      const targetApp = app || this.app || window.pixiApp;
      if (!targetApp || !targetApp.renderer) return;
      try {
        if (!window.pixiTextures) window.pixiTextures = {};
        if (window.pixiTextures.enemy_sniper) return; // Zaten yüklü

        // A) SNIPER ORBITAL DRONE (Keskin İğne Avcı Gövdesi - #ff0055)
        const gs = new PIXI.Graphics();
        gs.lineStyle(2.0, 0x020208, 0.95);
        gs.beginFill(0x1a0510, 0.95);
        gs.moveTo(18, 0); // Sivri uzun burun
        gs.lineTo(-12, -11);
        gs.lineTo(-6, 0);
        gs.lineTo(-12, 11);
        gs.closePath();
        gs.endFill();

        // İç neon kırmızı plazma kanatları
        gs.lineStyle(1.4, 0xff0055, 0.95);
        gs.beginFill(0xff0033, 0.85);
        gs.moveTo(12, 0);
        gs.lineTo(-8, -7);
        gs.lineTo(-4, 0);
        gs.lineTo(-8, 7);
        gs.closePath();
        gs.endFill();

        // Merkez keskin nişancı optik sensörü (Süpersonik beyaz-kırmızı akkor)
        gs.lineStyle(0);
        gs.beginFill(0xffffff, 1.0);
        gs.drawCircle(4, 0, 2.2);
        gs.endFill();
        window.pixiTextures.enemy_sniper = targetApp.renderer.generateTexture({ target: gs, resolution: 2 });

        // B) SHIELD LINKER ENEMY (Altıgen Savunma Jeneratörü - #00f3ff)
        const gl = new PIXI.Graphics();
        gl.lineStyle(2.2, 0x020208, 0.95);
        gl.beginFill(0x061826, 0.95);
        gl.drawCircle(0, 0, 16);
        gl.endFill();

        // Dönen altıgen reaktör plakaları
        gl.lineStyle(1.8, 0x00f3ff, 0.9);
        gl.beginFill(0x0284c7, 0.45);
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const px = Math.cos(a) * 13;
          const py = Math.sin(a) * 13;
          if (i === 0) gl.moveTo(px, py);
          else gl.lineTo(px, py);
        }
        gl.closePath();
        gl.endFill();

        // İç iyonik enerji çekirdeği
        gl.lineStyle(0);
        gl.beginFill(0x38bdf8, 1.0);
        gl.drawCircle(0, 0, 6.0);
        gl.endFill();
        gl.beginFill(0xffffff, 1.0);
        gl.drawCircle(0, 0, 2.8);
        gl.endFill();
        window.pixiTextures.enemy_shield_linker = targetApp.renderer.generateTexture({ target: gl, resolution: 2 });

        // C) CLUSTER CARRIER (Ağır Kovan Ana Gemi - #a855f7 & #f59e0b)
        const gc = new PIXI.Graphics();
        gc.lineStyle(2.4, 0x020208, 0.95);
        gc.beginFill(0x180b2a, 0.95);
        // Geniş zırhlı gövde
        gc.moveTo(24, 0);
        gc.lineTo(6, -18);
        gc.lineTo(-20, -14);
        gc.lineTo(-14, 0);
        gc.lineTo(-20, 14);
        gc.lineTo(6, 18);
        gc.closePath();
        gc.endFill();

        // Sarı hangarlar / kovan kapakları
        gc.lineStyle(1.6, 0xf59e0b, 0.9);
        gc.beginFill(0xd97706, 0.5);
        gc.drawRect(-8, -12, 12, 6);
        gc.drawRect(-8, 6, 12, 6);
        gc.endFill();

        // Mor biyo-mekanik enerji omurgası
        gc.moveTo(14, 0);
        gc.lineTo(-8, 0);
        gc.stroke({ width: 1.8, color: 0xc084fc, alpha: 0.9 });
        window.pixiTextures.enemy_carrier = targetApp.renderer.generateTexture({ target: gc, resolution: 2 });

        // D) VOID SIPHON (XP ve Hurda Çeken Enerji Hortumu - #ec4899 & #8b5cf6)
        const gv = new PIXI.Graphics();
        gv.lineStyle(2.0, 0x050110, 0.95);
        gv.beginFill(0x20072b, 0.95);
        gv.drawCircle(0, 0, 14);
        gv.endFill();

        // Manyetik halkalar
        gv.lineStyle(1.8, 0xec4899, 0.9);
        gv.drawCircle(0, 0, 10);
        gv.lineStyle(1.2, 0xa855f7, 0.8);
        gv.drawCircle(0, 0, 6);
        // Merkez karanlık kuyu
        gv.lineStyle(0);
        gv.beginFill(0xffffff, 0.95);
        gv.drawCircle(0, 0, 2.5);
        gv.endFill();
        window.pixiTextures.enemy_siphon = targetApp.renderer.generateTexture({ target: gv, resolution: 2 });

        // E) BOSS TURRET PART (Ayrılabilir Plazma Tareti - #ef4444)
        const gt = new PIXI.Graphics();
        gt.lineStyle(2.0, 0x0a0505, 0.95);
        gt.beginFill(0x2a0c0c, 0.95);
        gt.drawCircle(0, 0, 12);
        gt.endFill();

        // Çift namlu
        gt.lineStyle(2.2, 0xff0033, 0.95);
        gt.moveTo(0, -4);
        gt.lineTo(14, -4);
        gt.moveTo(0, 4);
        gt.lineTo(14, 4);
        // Akkor göbek
        gt.lineStyle(0);
        gt.beginFill(0xffffff, 1.0);
        gt.drawCircle(0, 0, 3.5);
        gt.endFill();
        window.pixiTextures.enemy_boss_turret = targetApp.renderer.generateTexture({ target: gt, resolution: 2 });

      } catch (err) {
        console.warn('[ZortexEnemies] Texture init warning:', err);
      }
    }

    /**
     * Polimorfik Düşman Sınıflarını Güvenle Türetir
     */
    initClasses() {
      if (this.classesInitialized && window.SniperEnemy && window.ShieldLinkerEnemy && window.CarrierEnemy && window.VoidSiphonEnemy) {
        return;
      }
      const BaseEnemy = window.Enemy || window.EnemyBase;
      if (!BaseEnemy) return;

      /* ======================================================================
         1. SNIPER ORBITAL DRONE CLASS
         ====================================================================== */
      class SniperEnemy extends BaseEnemy {
        constructor(x, y) {
          super(x, y, 'sniper');
          const curWave = (typeof wave !== 'undefined' ? wave : 1);
          this.radius = 14;
          this.maxHp = 45 + curWave * 10;
          this.hp = this.maxHp;
          this.speed = 2.4;
          this.color = '#ff0055';
          this.xpValue = 8;
          this.damage = 32;
          this.mass = 1.1;

          this.aimTimer = 1.35;
          this.hasAimed = false;
          this.repositionTimer = 0.0;
          this.strafeDir = Math.random() < 0.5 ? 1 : -1;
        }

        behavior(dt) {
          const p = window.player;
          if (!p || p.hp <= 0) return;
          const dtNorm = dt * 60;

          const dx = p.x - this.x;
          const dy = p.y - this.y;
          const dist = Math.hypot(dx, dy) || 1;
          const targetAngle = Math.atan2(dy, dx);

          // Nişan alma yönünü oyuncuya doğru sönümlü çevir
          let diff = (targetAngle - this.angle) % (Math.PI * 2);
          if (diff > Math.PI) diff -= Math.PI * 2;
          if (diff < -Math.PI) diff += Math.PI * 2;
          this.angle += diff * Math.min(1.0, dt * 5.0);

          // Taktiksel Mesafe Koruma: 380px - 600px mesafede uçuş
          if (dist < 380) {
            this.x -= Math.cos(targetAngle) * (this.speed * 1.3) * dtNorm;
            this.y -= Math.sin(targetAngle) * (this.speed * 1.3) * dtNorm;
          } else if (dist > 620) {
            this.x += Math.cos(targetAngle) * (this.speed * 0.9) * dtNorm;
            this.y += Math.sin(targetAngle) * (this.speed * 0.9) * dtNorm;
          } else {
            const perp = targetAngle + (Math.PI / 2) * this.strafeDir;
            this.x += Math.cos(perp) * (this.speed * 0.8) * dtNorm;
            this.y += Math.sin(perp) * (this.speed * 0.8) * dtNorm;
          }

          // Nişan Lazerini Başlat (Telegraph)
          this.aimTimer -= dt;
          if (this.aimTimer <= 1.35 && !this.hasAimed && window.ZortexThreats) {
            this.hasAimed = true;
            window.ZortexThreats.addTelegraph(this, this.angle, 1.35, 1400, 0xff0044);
          }

          // Ateşleme Anı
          if (this.aimTimer <= 0) {
            this.hasAimed = false;
            this.aimTimer = 2.8 + Math.random() * 0.8;
            this.strafeDir *= -1;

            if (typeof window.EnemyBullet === 'function' && window.enemyBullets) {
              window.enemyBullets.push(new window.EnemyBullet(this.x, this.y, this.angle, 15.5, 32, '#ff0033'));
            }

            if (window.audio && typeof window.audio.playLaser === 'function') {
              window.audio.playLaser(1.4, this.x, this.y);
            }

            if (typeof particles !== 'undefined' && particles && typeof particles.emit === 'function') {
              particles.emit(this.x + Math.cos(this.angle) * 14, this.y + Math.sin(this.angle) * 14, '#ff0055', 5, 3.2, 2.0, 0.22);
            }
          }
        }
      }

      /* ======================================================================
         2. SHIELD LINKER ENEMY CLASS
         ====================================================================== */
      class ShieldLinkerEnemy extends BaseEnemy {
        constructor(x, y) {
          super(x, y, 'shield_linker');
          const curWave = (typeof wave !== 'undefined' ? wave : 1);
          this.radius = 18;
          this.maxHp = 130 + curWave * 22;
          this.hp = this.maxHp;
          this.speed = 1.7;
          this.color = '#00f3ff';
          this.xpValue = 10;
          this.damage = 18;
          this.mass = 2.2;

          this.isShieldLinker = true;
          this.linkedAllies = [];
        }

        behavior(dt) {
          const p = window.player;
          if (!p || p.hp <= 0) return;
          const dtNorm = dt * 60;

          const dx = p.x - this.x;
          const dy = p.y - this.y;
          const dist = Math.hypot(dx, dy) || 1;
          const targetAngle = Math.atan2(dy, dx);
          this.angle += dt * 1.5;

          if (dist < 300) {
            this.x -= Math.cos(targetAngle) * (this.speed * 1.2) * dtNorm;
            this.y -= Math.sin(targetAngle) * (this.speed * 1.2) * dtNorm;
          } else if (dist > 460) {
            this.x += Math.cos(targetAngle) * (this.speed * 0.8) * dtNorm;
            this.y += Math.sin(targetAngle) * (this.speed * 0.8) * dtNorm;
          }
        }

        updateLinks(dt, allEnemies, gfx, timeSec) {
          if (this.dead || this.hp <= 0) return;

          this.linkedAllies = this.linkedAllies.filter(a => a && !a.dead && a.hp > 0);

          if (this.linkedAllies.length < 2) {
            for (let i = 0; i < allEnemies.length; i++) {
              const cand = allEnemies[i];
              if (!cand || cand.dead || cand.hp <= 0 || cand === this || cand.isShieldLinker || cand.type === 'boss') continue;
              if (this.linkedAllies.includes(cand)) continue;

              const d = Math.hypot(cand.x - this.x, cand.y - this.y);
              if (d < 360) {
                this.linkedAllies.push(cand);
                cand.isShieldLinked = true;
                cand.linkedBy = this;
                if (this.linkedAllies.length >= 2) break;
              }
            }
          }

          if (gfx && this.linkedAllies.length > 0) {
            const pulse = Math.sin(timeSec * 8.0) * 0.2 + 0.8;

            for (let i = 0; i < this.linkedAllies.length; i++) {
              const ally = this.linkedAllies[i];
              const d = Math.hypot(ally.x - this.x, ally.y - this.y);
              if (d > 420 || ally.dead) {
                ally.isShieldLinked = false;
                ally.linkedBy = null;
                this.linkedAllies.splice(i, 1);
                i--;
                continue;
              }

              // Neon mavi kalkan bağı
              gfx.lineStyle(3.0 * pulse, 0x0284c7, 0.45 * pulse);
              gfx.moveTo(this.x, this.y);
              gfx.lineTo(ally.x, ally.y);

              gfx.lineStyle(1.4, 0x00f3ff, 0.85 * pulse);
              gfx.moveTo(this.x, this.y);
              gfx.lineTo(ally.x, ally.y);

              // Dönen altıgen kalkan halesi
              gfx.lineStyle(1.8, 0x00f3ff, 0.75 * pulse);
              gfx.beginFill(0x38bdf8, 0.18 * pulse);
              const r = (ally.radius || 15) + 8 + Math.sin(timeSec * 10) * 2;
              for (let s = 0; s < 6; s++) {
                const a = (s * Math.PI) / 3 + timeSec * 2;
                const px = ally.x + Math.cos(a) * r;
                const py = ally.y + Math.sin(a) * r;
                if (s === 0) gfx.moveTo(px, py);
                else gfx.lineTo(px, py);
              }
              gfx.closePath();
              gfx.endFill();
            }
          }
        }

        die() {
          for (let i = 0; i < this.linkedAllies.length; i++) {
            const ally = this.linkedAllies[i];
            if (ally && !ally.dead) {
              ally.isShieldLinked = false;
              ally.linkedBy = null;
              if (typeof particles !== 'undefined' && particles && typeof particles.emit === 'function') {
                particles.emit(ally.x, ally.y, '#00f3ff', 8, 3.5, 2.5, 0.3);
              }
            }
          }
          this.linkedAllies = [];

          if (typeof window.addShockwave === 'function') {
            window.addShockwave(this.x, this.y, 160, 0.35);
          }
          super.die();
        }
      }

      /* ======================================================================
         3. CLUSTER CARRIER (Ağır Kovan Ana Gemi)
         ====================================================================== */
      class CarrierEnemy extends BaseEnemy {
        constructor(x, y) {
          super(x, y, 'carrier');
          const curWave = (typeof wave !== 'undefined' ? wave : 1);
          this.radius = 26;
          this.maxHp = 220 + curWave * 35;
          this.hp = this.maxHp;
          this.speed = 1.4;
          this.color = '#c084fc';
          this.xpValue = 15;
          this.damage = 25;
          this.mass = 4.2;

          this.spawnTimer = 4.0;
          this.halfHpBurstDone = false;
        }

        behavior(dt) {
          const p = window.player;
          if (!p || p.hp <= 0) return;
          const dtNorm = dt * 60;

          // Oyuncuya doğru ağır süzülüş
          this.x += Math.cos(this.angle) * this.speed * dtNorm;
          this.y += Math.sin(this.angle) * this.speed * dtNorm;

          // Periyodik Mini-Drone Fırlatma
          this.spawnTimer -= dt;
          if (this.spawnTimer <= 0) {
            this.spawnTimer = 5.5 + Math.random() * 1.5;
            this.releaseDrones(2);
          }

          // %50 Can Eşiğinde Acil Dron Dalgası
          if (this.hp <= this.maxHp * 0.5 && !this.halfHpBurstDone) {
            this.halfHpBurstDone = true;
            this.releaseDrones(3);
            if (window.audio && typeof window.audio.playZap === 'function') window.audio.playZap(this.x, this.y);
          }
        }

        releaseDrones(count = 2) {
          if (typeof window.SwarmDroneEnemy !== 'function' || !window.enemies) return;
          for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const sx = this.x + Math.cos(angle) * 30;
            const sy = this.y + Math.sin(angle) * 30;
            const drone = new window.SwarmDroneEnemy(sx, sy);
            window.enemies.push(drone);
            if (typeof particles !== 'undefined' && particles && typeof particles.emit === 'function') {
              particles.emit(sx, sy, '#f59e0b', 4, 2.5, 2.0, 0.2);
            }
          }
        }

        die() {
          // Ölürken son çare 4 drone saçar
          this.releaseDrones(4);
          if (typeof window.addShockwave === 'function') {
            window.addShockwave(this.x, this.y, 180, 0.4);
          }
          super.die();
        }
      }

      /* ======================================================================
         4. VOID SIPHON (XP & Hurda Çeken Manyetik Düşman)
         ====================================================================== */
      class VoidSiphonEnemy extends BaseEnemy {
        constructor(x, y) {
          super(x, y, 'siphon');
          const curWave = (typeof wave !== 'undefined' ? wave : 1);
          this.radius = 16;
          this.maxHp = 90 + curWave * 16;
          this.hp = this.maxHp;
          this.speed = 2.0;
          this.color = '#ec4899';
          this.xpValue = 8;
          this.damage = 16;
          this.mass = 1.3;

          this.absorbedXp = 0;
          this.absorbedCount = 0;
        }

        behavior(dt) {
          const p = window.player;
          if (!p || p.hp <= 0) return;
          const dtNorm = dt * 60;

          // Sakin dönüş
          this.angle += dt * 2.2;
          this.x += Math.cos(this.angle) * (this.speed * 0.6) * dtNorm;
          this.y += Math.sin(this.angle) * (this.speed * 0.6) * dtNorm;

          // Etraftaki XP Taşlarını Kendine Çek
          const gemList = window.gems || window.xpGems;
          if (gemList && gemList.length > 0) {
            const pullRadius = 260;
            for (let i = gemList.length - 1; i >= 0; i--) {
              const gem = gemList[i];
              if (!gem) continue;
              const dx = this.x - gem.x;
              const dy = this.y - gem.y;
              const dist2 = dx * dx + dy * dy;

              if (dist2 < pullRadius * pullRadius) {
                const dist = Math.sqrt(dist2) || 1;
                // Siphona doğru kuvvetli çekim
                gem.x += (dx / dist) * 7.5 * dtNorm;
                gem.y += (dy / dist) * 7.5 * dtNorm;

                // Yutma eşiği
                if (dist < this.radius + 8) {
                  this.absorbedXp += (gem.value || 10);
                  this.absorbedCount++;
                  if (gem.destroy) gem.destroy();
                  else if (gem.sprite && gem.sprite.parent) {
                    gem.sprite.parent.removeChild(gem.sprite);
                  }
                  gemList.splice(i, 1);

                  // Görsel büyüme ve süzülme
                  if (this.sprite) {
                    this.sprite.scale.set(Math.min(1.4, 1.0 + this.absorbedCount * 0.03));
                  }
                  if (typeof particles !== 'undefined' && particles && typeof particles.emit === 'function') {
                    particles.emit(this.x, this.y, '#ec4899', 3, 2.0, 1.5, 0.15);
                  }
                }
              }
            }
          }
        }

        die() {
          // Öldüğünde emdiği tüm XP'yi %50 BONUS ile havai fişek gibi saçar!
          const bonusXp = Math.round(this.absorbedXp * 1.5);
          const gemList = window.gems || window.xpGems;
          if (bonusXp > 0 && typeof window.XpGem === 'function' && gemList) {
            const gemCount = Math.min(18, Math.max(3, Math.floor(bonusXp / 15)));
            const valPerGem = Math.max(5, Math.floor(bonusXp / gemCount));
            for (let i = 0; i < gemCount; i++) {
              const ang = (i / gemCount) * Math.PI * 2;
              const r = 25 + Math.random() * 35;
              const gem = new window.XpGem(this.x + Math.cos(ang) * r, this.y + Math.sin(ang) * r, valPerGem);
              gemList.push(gem);
            }
            if (window.textManager && typeof window.textManager.add === 'function') {
              window.textManager.add(`+${bonusXp} SİFON BONUSU! ✨`, this.x, this.y - 28, '#ec4899', 16, 1.2);
            }
          }
          super.die();
        }
      }

      /* ======================================================================
         5. BOSS DESTRUCTIBLE TURRET PART
         ====================================================================== */
      class BossTurretPart extends BaseEnemy {
        constructor(boss, offsetX, offsetY, label = 'Taret') {
          super(boss.x + offsetX, boss.y + offsetY, 'boss_turret');
          this.boss = boss;
          this.offsetX = offsetX;
          this.offsetY = offsetY;
          this.label = label;
          this.radius = 16;
          this.maxHp = Math.round(boss.maxHp * 0.22); // Boss'un %22 canına sahip
          this.hp = this.maxHp;
          this.xpValue = 12;
          this.damage = 18;
          this.mass = 999;
          this.shootTimer = 2.0 + Math.random();
        }

        behavior(dt) {
          if (!this.boss || this.boss.dead || this.boss.hp <= 0) {
            this.hp = 0;
            this.die();
            return;
          }

          // Boss'un açısına göre göreceli konumu dönüştür
          const cosA = Math.cos(this.boss.angle);
          const sinA = Math.sin(this.boss.angle);
          this.x = this.boss.x + (this.offsetX * cosA - this.offsetY * sinA);
          this.y = this.boss.y + (this.offsetX * sinA + this.offsetY * cosA);

          const p = window.player;
          if (p && p.hp > 0) {
            this.angle = Math.atan2(p.y - this.y, p.x - this.x);
          }

          // Bağımsız Taret Ateşi
          this.shootTimer -= dt;
          if (this.shootTimer <= 0) {
            this.shootTimer = 2.6 + Math.random() * 0.6;
            if (typeof window.EnemyBullet === 'function' && window.enemyBullets) {
              window.enemyBullets.push(new window.EnemyBullet(this.x, this.y, this.angle, 6.2, 18, '#ff0055'));
              if (window.audio && typeof window.audio.playLaser === 'function') window.audio.playLaser(0.8, this.x, this.y);
            }
          }
        }

        die() {
          // Taret kırıldığında devasa patlama ve Boss'a doğrudan şok hasarı!
          if (this.boss && !this.boss.dead) {
            const shockDmg = Math.round(this.boss.maxHp * 0.10);
            this.boss.hp = Math.max(1, this.boss.hp - shockDmg);
            if (window.textManager && typeof window.textManager.add === 'function') {
              window.textManager.add(`💥 ${this.label.toUpperCase()} İMHA EDİLDİ! (-${shockDmg})`, this.x, this.y - 25, '#ffe600', 16, 1.8);
            }
            if (typeof window.triggerHitStop === 'function') window.triggerHitStop(0.12);
            if (typeof window.triggerTrauma === 'function') window.triggerTrauma(0.18);
            if (typeof window.screenShake !== 'undefined') window.screenShake = 0;
            if (typeof window.addShockwave === 'function') window.addShockwave(this.x, this.y, 220, 0.4);
          }
          super.die();
        }
      }

      // Global Expose
      window.SniperEnemy = SniperEnemy;
      window.ShieldLinkerEnemy = ShieldLinkerEnemy;
      window.CarrierEnemy = CarrierEnemy;
      window.VoidSiphonEnemy = VoidSiphonEnemy;
      window.BossTurretPart = BossTurretPart;
      this.classesInitialized = true;
    }

    /**
     * Dalga Motoruna Taktiksel Özel Sürüler Entegre Eder
     */
    trySpawnSpecialWave(curWave, enemiesList, W, H) {
      this.initClasses();
      const rng = (typeof gameRng === 'function') ? gameRng : Math.random;
      const roll = rng();

      const getSpawn = (buf = 40) => {
        if (typeof window.getSpawnPointOffscreen === 'function') {
          return window.getSpawnPointOffscreen(buf);
        }
        const edge = Math.floor(rng() * 4);
        return {
          x: edge % 2 === 0 ? (edge === 0 ? -buf : W + buf) : rng() * W,
          y: edge % 2 === 1 ? (edge === 1 ? -buf : H + buf) : rng() * H
        };
      };

      // 1. Dalga 2+: Sniper Devriyesi (1-2 adet)
      if (curWave >= 2 && roll < 0.22 && window.SniperEnemy) {
        const pt = getSpawn(35);
        let x = pt.x, y = pt.y;
        enemiesList.push(new window.SniperEnemy(x, y));
        if (curWave >= 4 && rng() < 0.5) {
          enemiesList.push(new window.SniperEnemy(x + (rng() * 60 - 30), y + (rng() * 60 - 30)));
        }
        return true;
      }

      // 2. Dalga 3+: Shield Linker Kalkan Filosu (1 Linker + 1 Heavy + 2 Swarm)
      if (curWave >= 3 && roll < 0.44 && window.ShieldLinkerEnemy) {
        const pt = getSpawn(45);
        let x = pt.x, y = pt.y;
        const linker = new window.ShieldLinkerEnemy(x, y);
        enemiesList.push(linker);
        if (typeof window.AegisHeavyEnemy === 'function') {
          enemiesList.push(new window.AegisHeavyEnemy(x + 35, y + 25));
        }
        if (typeof window.SwarmDroneEnemy === 'function') {
          enemiesList.push(new window.SwarmDroneEnemy(x - 30, y - 25));
          enemiesList.push(new window.SwarmDroneEnemy(x + 20, y - 35));
        }
        return true;
      }

      // 3. Dalga 4+: Carrier Ana Gemisi (1 Carrier + 1 Sniper)
      if (curWave >= 4 && roll < 0.62 && window.CarrierEnemy) {
        const pt = getSpawn(50);
        let x = pt.x, y = pt.y;
        enemiesList.push(new window.CarrierEnemy(x, y));
        if (window.SniperEnemy) enemiesList.push(new window.SniperEnemy(x - 40, y + 30));
        return true;
      }

      // 4. Dalga 3+: Void Siphon Hırsız Devriyesi (1 Siphon)
      if (curWave >= 3 && roll < 0.78 && window.VoidSiphonEnemy) {
        const pt = getSpawn(35);
        let x = pt.x, y = pt.y;
        enemiesList.push(new window.VoidSiphonEnemy(x, y));
        return true;
      }

      return false;
    }

    /**
     * Boss Doğumunda Çok Parçalı Alt Sistemleri Kurar ve Sinematiği Başlatır
     */
    onBossSpawn(boss) {
      if (!boss) return;
      this.initClasses();
      this.activeBoss = boss;
      this.bossSubsystems = [];

      // Boss Giriş Sinematiği
      this.triggerBossIntro('OMEGA DREADNOUGHT');

      // Parçalanabilir Boss Alt Sistemleri Ekle
      if (window.BossTurretPart && window.enemies) {
        const leftTurret = new window.BossTurretPart(boss, -36, -18, 'Sol Plazma Tareti');
        const rightTurret = new window.BossTurretPart(boss, 36, -18, 'Sağ Plazma Tareti');
        this.bossSubsystems.push(leftTurret, rightTurret);
        window.enemies.push(leftTurret, rightTurret);
      }
    }

    /**
     * Boss Giriş Sinematiği (Screen Dim, Cam Zoom Punch, Banner)
     */
    triggerBossIntro(bossName = 'OMEGA DREADNOUGHT') {
      try {
        if (typeof window.triggerHitStop === 'function') window.triggerHitStop(0.22);
        if (typeof window.triggerCameraZoom === 'function') window.triggerCameraZoom(0.08);
        if (typeof window.screenShake !== 'undefined') window.screenShake = Math.max(window.screenShake || 0, 24);
        if (window.audio && typeof window.audio.playExplosion === 'function') window.audio.playExplosion(2.4);

        if (window.textManager && typeof window.textManager.add === 'function') {
          const W = window.W || 1280;
          const H = window.H || 720;
          window.textManager.add(`── ⚠️ KRİTİK TEHDİT TESPİT EDİLDİ ⚠️ ──`, W / 2, H / 2 - 100, '#ff0055', 22, 3.8);
          window.textManager.add(`[ ${bossName} ]`, W / 2, H / 2 - 60, '#ffe600', 38, 4.2);
          window.textManager.add(`SEKTÖR ABLUKA PROTOKOLÜ DEVREDE`, W / 2, H / 2 - 25, '#00f3ff', 15, 3.2);
        }
      } catch (err) {
        console.warn('[ZortexEnemies] triggerBossIntro error:', err);
      }
    }

    reset() {
      this.activeBoss = null;
      this.bossSubsystems = [];
      if (this.tetherGraphics) {
        this.tetherGraphics.clear();
      }
    }

    update(dt, player, enemies) {
      if (!this.enabled || !enemies) return;

      // Kalkan Bağlantı Çizgilerini Temizle ve Canlı Güncelle
      if (this.tetherGraphics) {
        this.tetherGraphics.clear();
      }

      const linkers = [];
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e && !e.dead && e.isShieldLinker) {
          linkers.push(e);
        }
      }

      // Her Linker için bağlı müttefikleri tara ve kalkan bağlarını çiz
      const timeSec = performance.now() / 1000;
      for (let l = 0; l < linkers.length; l++) {
        const linker = linkers[l];
        linker.updateLinks(dt, enemies, this.tetherGraphics, timeSec);
      }
    }
  }

  window.ZortexEnemies = new EnemyRegistry();

})();
