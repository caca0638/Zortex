/**
 * ============================================================================
 * ZORTEX: CYBER SURVIVOR - BİOM MİNİ-BOSSLARI VE APEX BOSS MOTORU
 * Mimari: Bölüm 10 - Biyom Mini-Bossları (Kovan Ana Gemisi, Gölge Süvarisi, Reaktör Çekirdeği)
 * 144Hz Zero-GC WebGL 2.0 / PixiJS Optimizasyonlu
 * ============================================================================
 */
(function() {
  'use strict';

  class BiomeBossManager {
    constructor() {
      this.activeBoss = null;
      this.bossSubsystems = [];
      this.hazardGraphics = null;
      this.enabled = true;
      this.classesInitialized = false;
    }

    initGraphics(app) {
      if (!app || !app.stage || this.hazardGraphics) return;
      try {
        this.hazardGraphics = new PIXI.Graphics();
        this.hazardGraphics.zIndex = 45;
        const targetContainer = (typeof window.pixiEnemyBulletsContainer !== 'undefined' && window.pixiEnemyBulletsContainer)
          ? window.pixiEnemyBulletsContainer
          : app.stage;
        targetContainer.addChild(this.hazardGraphics);
      } catch (err) {
        console.warn('[BiomeBossManager] initGraphics warning:', err);
      }
    }

    initClasses() {
      if (this.classesInitialized && window.HatcheryPodPart && window.ShadowDecoyClone) return;
      const BaseEnemy = window.Enemy || window.EnemyBase;
      if (!BaseEnemy) return;

      class HatcheryPodPart extends BaseEnemy {
        constructor(boss, offsetX, offsetY, name = 'Kuluçka Podu') {
          super(boss ? boss.x + offsetX : 0, boss ? boss.y + offsetY : 0, 'hatchery_pod');
          this.boss = boss;
          this.offsetX = offsetX;
          this.offsetY = offsetY;
          this.name = name;
          this.radius = 18;
          this.maxHp = 320;
          this.hp = this.maxHp;
          this.isSubsystem = true;
          this.color = '#38bdf8';
        }

        behavior(dt) {
          if (!this.boss || this.boss.dead || this.boss.hp <= 0) {
            this.hp = 0;
            this.dead = true;
            return;
          }
          this.x = this.boss.x + this.offsetX;
          this.y = this.boss.y + this.offsetY;
        }
      }

      class ShadowDecoyClone extends BaseEnemy {
        constructor(x, y, master) {
          super(x, y, 'shadow_clone');
          this.master = master;
          this.radius = 32;
          this.maxHp = 380;
          this.hp = this.maxHp;
          this.speed = 2.0;
          this.color = 'rgba(192, 132, 252, 0.65)';
          this.isClone = true;
          this.attackTimer = 1.5;
        }

        behavior(dt) {
          const p = window.player;
          if (!p || !this.master || this.master.dead) {
            this.hp = 0;
            this.dead = true;
            return;
          }
          const dtNorm = dt * 60;
          const dx = p.x - this.x;
          const dy = p.y - this.y;
          const angle = Math.atan2(dy, dx);
          this.x += Math.cos(angle) * this.speed * dtNorm;
          this.y += Math.sin(angle) * this.speed * dtNorm;

          this.attackTimer -= dt;
          if (this.attackTimer <= 0) {
            this.attackTimer = 2.0;
            if (window.enemyBullets && window.EnemyBullet) {
              window.enemyBullets.push(new window.EnemyBullet(this.x, this.y, angle, 5.0, 12, '#c084fc'));
            }
          }
        }
      }

      window.HatcheryPodPart = HatcheryPodPart;
      window.ShadowDecoyClone = ShadowDecoyClone;
      this.classesInitialized = true;
    }

    reset() {
      this.activeBoss = null;
      this.bossSubsystems = [];
      if (this.hazardGraphics) {
        this.hazardGraphics.clear();
      }
    }

    /**
     * Dalga bazında özelleşmiş Biyom Mini-Bossunu kurar
     * Wave 3: Kovan Ana Gemisi (Hive Mothership)
     * Wave 6: Gölge Süvarisi (Shadow Cavalier)
     * Wave 9: Reaktör Çekirdeği (Reactor Core)
     * Wave 10+: Omega Dreadnought
     */
    configureBoss(boss, wave = 1) {
      if (!boss) return;
      this.initClasses();
      this.activeBoss = boss;
      this.bossSubsystems = [];

      const app = window.pixiApp;
      if (app) this.initGraphics(app);

      if (wave === 3) {
        this.setupHiveMothership(boss);
      } else if (wave === 6) {
        this.setupShadowCavalier(boss);
      } else if (wave === 9) {
        this.setupReactorCore(boss);
      } else {
        this.setupOmegaDreadnought(boss);
      }

      boss.isBoss = true;
      boss.type = 'boss';
      if (boss.sprite && typeof window.getEnemyTexture === 'function') {
        const tex = window.getEnemyTexture(boss.bossType);
        if (tex) boss.sprite.texture = tex;
      }

      this.triggerBossIntro(boss.bossName || 'OMEGA DREADNOUGHT', boss.bossSubtitle || 'SEKTÖR ABLUKA PROTOKOLÜ');
    }

    /* ------------------------------------------------------------------------
       1. BİYOM 1 MİNİ-BOSS: KOVAN ANA GEMİSİ (HIVE MOTHERSHIP) - DALGA 3
       Sınadığı şey: Hedef Önceliği (Düşman Doğurma & Kovan Yumurtaları)
       ------------------------------------------------------------------------ */
    setupHiveMothership(boss) {
      boss.bossType = 'hive_mothership';
      boss.bossName = 'KOVAN ANA GEMİSİ';
      boss.bossSubtitle = 'BİYOM 1 • SINAV: HEDEF ÖNCELİĞİ';
      boss.color = '#38bdf8';
      boss.radius = 46;
      boss.speed = 1.1;
      boss.maxHp = 1800 + (window.wave || 3) * 450;
      boss.hp = boss.maxHp;
      boss.spawnerTimer = 3.5;
      boss.stingerTimer = 1.2;
      boss.podsDestroyed = 0;

      // 2 Adet Dış Kovan Kuluçka Podu (Hatchery Pods)
      if (window.HatcheryPodPart && window.enemies) {
        const pod1 = new window.HatcheryPodPart(boss, -42, 0, 'Sol Kuluçka Podu');
        const pod2 = new window.HatcheryPodPart(boss, 42, 0, 'Sağ Kuluçka Podu');
        this.bossSubsystems.push(pod1, pod2);
        window.enemies.push(pod1, pod2);
      }

      boss.customBehavior = (dt) => {
        const p = window.player;
        if (!p) return;
        const dtNorm = dt * 60;
        const dx = p.x - boss.x;
        const dy = p.y - boss.y;
        const dist = Math.hypot(dx, dy) || 1;
        const angle = Math.atan2(dy, dx);

        // Mesafe koruma (300px civarında dolaşır)
        if (dist > 340) {
          boss.x += Math.cos(angle) * boss.speed * dtNorm;
          boss.y += Math.sin(angle) * boss.speed * dtNorm;
        } else if (dist < 220) {
          boss.x -= Math.cos(angle) * boss.speed * 0.8 * dtNorm;
          boss.y -= Math.sin(angle) * boss.speed * 0.8 * dtNorm;
        }

        // FAZ 1 & 2: Kovan Doğurucu (Swarm Spawner)
        boss.spawnerTimer -= dt;
        if (boss.spawnerTimer <= 0) {
          boss.spawnerTimer = boss.phase === 3 ? 2.5 : 4.0;
          // 2 adet Swarm Drone veya Larva yumurtası doğur
          if (window.enemies && window.SwarmDroneEnemy) {
            for (let i = -1; i <= 1; i += 2) {
              const sx = boss.x + i * 35;
              const sy = boss.y + 20;
              window.enemies.push(new window.SwarmDroneEnemy(sx, sy));
            }
            if (window.audio && typeof window.audio.playZap === 'function') {
              window.audio.playZap();
            }
          }
        }

        // FAZ 3: Zayıf Çekirdek Açıldı! Seri Homing İğneler Püskürtür
        boss.stingerTimer -= dt;
        if (boss.stingerTimer <= 0) {
          boss.stingerTimer = boss.phase === 3 ? 0.75 : 1.35;
          const bulletList = (typeof window.enemyBullets !== 'undefined' && Array.isArray(window.enemyBullets))
            ? window.enemyBullets : [];
          if (window.EnemyBullet) {
            const spreadCount = boss.phase === 3 ? 5 : 3;
            for (let i = 0; i < spreadCount; i++) {
              const offset = (i - Math.floor(spreadCount / 2)) * 0.22;
              bulletList.push(new window.EnemyBullet(boss.x, boss.y, angle + offset, 5.2, 16, '#00f3ff'));
            }
            if (window.audio && typeof window.audio.playLaser === 'function') {
              window.audio.playLaser(0.6, boss.x, boss.y);
            }
          }
        }
      };
    }

    /* ------------------------------------------------------------------------
       2. BİYOM 2 MİNİ-BOSS: GÖLGE SÜVARİSİ (SHADOW CAVALIER) - DALGA 6
       Sınadığı şey: Hareket ve Dash (Işınlanma & Gölge Klonları)
       ------------------------------------------------------------------------ */
    setupShadowCavalier(boss) {
      boss.bossType = 'shadow_cavalier';
      boss.bossName = 'GÖLGE SÜVARİSİ';
      boss.bossSubtitle = 'BİYOM 2 • SINAV: HAREKET VE DASH';
      boss.color = '#c084fc';
      boss.radius = 42;
      boss.speed = 2.4;
      boss.maxHp = 2600 + (window.wave || 6) * 550;
      boss.hp = boss.maxHp;
      boss.dashTimer = 2.8;
      boss.blinkTimer = 5.2;
      boss.isBlinking = false;
      boss.blinkTelegraph = 0;
      boss.clonesSpawned = false;

      boss.customBehavior = (dt) => {
        const p = window.player;
        if (!p) return;
        const dtNorm = dt * 60;
        const dx = p.x - boss.x;
        const dy = p.y - boss.y;
        const dist = Math.hypot(dx, dy) || 1;
        const angle = Math.atan2(dy, dx);

        // FAZ 3: Klon Üretimi (%35 can altına inince 2 adet gölge klonu yaratır)
        if (boss.phase === 3 && !boss.clonesSpawned) {
          boss.clonesSpawned = true;
          if (window.enemies && window.ShadowDecoyClone) {
            const clone1 = new window.ShadowDecoyClone(boss.x - 60, boss.y - 40, boss);
            const clone2 = new window.ShadowDecoyClone(boss.x + 60, boss.y + 40, boss);
            window.enemies.push(clone1, clone2);
            if (window.textManager) {
              window.textManager.add('⚠️ GÖLGE KLONLARI AYRILDI!', boss.x, boss.y - 50, '#d946ef', 20, 2.2);
            }
          }
        }

        // Işınlanma Telegrafı
        if (boss.isBlinking) {
          boss.blinkTelegraph -= dt;
          if (this.hazardGraphics) {
            this.hazardGraphics.lineStyle(2.5, 0xd946ef, 0.75);
            this.hazardGraphics.moveTo(boss.x, boss.y);
            this.hazardGraphics.lineTo(p.x, p.y);
          }
          if (boss.blinkTelegraph <= 0) {
            boss.isBlinking = false;
            // Oyuncunun arkasına ışınlan
            const behindAngle = p.angle || angle;
            boss.x = p.x - Math.cos(behindAngle) * 140;
            boss.y = p.y - Math.sin(behindAngle) * 140;
            if (window.audio && typeof window.audio.playExplosion === 'function') {
              window.audio.playExplosion(0.9, boss.x, boss.y);
            }
            if (window.screenShake !== 'undefined') window.screenShake = Math.max(window.screenShake, 8);
            // Anlık 3'lü plazma atışı
            const bulletList = window.enemyBullets || [];
            if (window.EnemyBullet) {
              const newAngle = Math.atan2(p.y - boss.y, p.x - boss.x);
              for (let i = -1; i <= 1; i++) {
                bulletList.push(new window.EnemyBullet(boss.x, boss.y, newAngle + i * 0.25, 6.8, 20, '#d946ef'));
              }
            }
          }
          return;
        }

        // Stalking hareketi
        boss.x += Math.cos(angle) * boss.speed * dtNorm;
        boss.y += Math.sin(angle) * boss.speed * dtNorm;

        // Işınlanma Zamanlayıcısı
        boss.blinkTimer -= dt;
        if (boss.blinkTimer <= 0) {
          boss.blinkTimer = boss.phase === 3 ? 3.8 : 5.5;
          boss.isBlinking = true;
          boss.blinkTelegraph = 0.55;
          return;
        }

        // Gölge Dash (Afterimage Dash)
        boss.dashTimer -= dt;
        if (boss.dashTimer <= 0) {
          boss.dashTimer = boss.phase === 3 ? 1.8 : 2.8;
          boss.x += Math.cos(angle) * 110;
          boss.y += Math.sin(angle) * 110;
          if (window.particles && typeof window.particles.emit === 'function') {
            window.particles.emit(boss.x, boss.y, '#c084fc', 8, 12, 4);
          }
          if (window.audio && typeof window.audio.playZap === 'function') {
            window.audio.playZap();
          }
        }
      };
    }

    /* ------------------------------------------------------------------------
       3. BİYOM 3 MİNİ-BOSS: REAKTÖR ÇEKİRDEĞİ (REACTOR CORE) - DALGA 9
       Sınadığı şey: Alan Okuma ve Bullet-Hell (Dönen Lazer Kolları & Aşırı Yük)
       ------------------------------------------------------------------------ */
    setupReactorCore(boss) {
      boss.bossType = 'reactor_core';
      boss.bossName = 'REAKTÖR ÇEKİRDEĞİ';
      boss.bossSubtitle = 'BİYOM 3 • SINAV: ALAN OKUMA & BULLET-HELL';
      boss.color = '#f97316';
      boss.radius = 50;
      boss.speed = 0.65;
      boss.maxHp = 3600 + (window.wave || 9) * 650;
      boss.hp = boss.maxHp;
      boss.rotAngle = 0;
      boss.rotSpeed = 0.85;
      boss.pulseTimer = 2.0;
      boss.overloadTimer = 0; // 5 sn aşırı yük hasar penceresi
      boss.overloadCooldown = 12.0;

      boss.customBehavior = (dt) => {
        const p = window.player;
        if (!p) return;
        const dtNorm = dt * 60;
        const dx = p.x - boss.x;
        const dy = p.y - boss.y;
        const angle = Math.atan2(dy, dx);

        // Yavaş merkez hareketi
        boss.x += Math.cos(angle) * boss.speed * dtNorm;
        boss.y += Math.sin(angle) * boss.speed * dtNorm;

        // Faz 3: AŞIRI YÜK (OVERLOAD) Protokolü (5 sn açık savunmasız hasar penceresi)
        if (boss.overloadTimer > 0) {
          boss.overloadTimer -= dt;
          boss.invulnerableTimer = 0;
          if (this.hazardGraphics) this.hazardGraphics.clear();
          if (window.particles && Math.random() < 0.4) {
            window.particles.emit(boss.x, boss.y, '#ef4444', 3, 6, 2);
          }
          return;
        }

        boss.overloadCooldown -= dt;
        if (boss.overloadCooldown <= 0 && boss.phase >= 2) {
          boss.overloadCooldown = 14.0;
          boss.overloadTimer = 5.0; // 5 saniye açık zayıf nokta!
          if (window.textManager) {
            window.textManager.add('⚡ ÇEKİRDEK AŞIRI YÜK: SAVUNMASIZ PENCERE (5s)! ⚡', boss.x, boss.y - 65, '#ffe600', 22, 3.2);
          }
          if (window.audio && typeof window.audio.playExplosion === 'function') {
            window.audio.playExplosion(1.5, boss.x, boss.y);
          }
          return;
        }

        // Dönen 4 Lazer Kolu (Rotational Hazard Beams)
        const curRotSpeed = boss.phase === 2 ? 1.45 : 0.95;
        boss.rotAngle += dt * curRotSpeed;

        if (this.hazardGraphics) {
          const g = this.hazardGraphics;
          const beamLen = 380;
          g.lineStyle(3, 0xf97316, 0.85);

          for (let i = 0; i < 4; i++) {
            const bAng = boss.rotAngle + (i * Math.PI) / 2;
            const ex = boss.x + Math.cos(bAng) * beamLen;
            const ey = boss.y + Math.sin(bAng) * beamLen;
            g.moveTo(boss.x, boss.y);
            g.lineTo(ex, ey);

            // Oyuncuya lazer teması hasarı (her 0.35 saniyede bir)
            const playerDistToBeam = pointToLineDistance(p.x, p.y, boss.x, boss.y, ex, ey);
            if (playerDistToBeam < (p.radius + 6) && (!boss.lastLaserHit || performance.now() - boss.lastLaserHit > 350)) {
              boss.lastLaserHit = performance.now();
              if (typeof p.takeDamage === 'function') {
                p.takeDamage(18);
              }
              if (window.audio && typeof window.audio.playZap === 'function') {
                window.audio.playZap();
              }
            }
          }
        }

        // Spiral Bullet-Hell Salınımı
        boss.pulseTimer -= dt;
        if (boss.pulseTimer <= 0) {
          boss.pulseTimer = boss.phase >= 2 ? 1.1 : 2.2;
          const bulletList = window.enemyBullets || [];
          if (window.EnemyBullet) {
            const count = boss.phase >= 2 ? 12 : 8;
            for (let i = 0; i < count; i++) {
              const a = (i * Math.PI * 2) / count + boss.rotAngle;
              bulletList.push(new window.EnemyBullet(boss.x, boss.y, a, 4.2, 14, '#ff7700'));
            }
            if (window.audio && typeof window.audio.playLaser === 'function') {
              window.audio.playLaser(0.5, boss.x, boss.y);
            }
          }
        }
      };
    }

    /* ------------------------------------------------------------------------
       4. NİHAİ APEX: OMEGA DREADNOUGHT - DALGA 10
       Sınadığı şey: Tüm Öğrendikleriniz (Ağır Savaş Gemisi & Çoklu Fazlar)
       ------------------------------------------------------------------------ */
    setupOmegaDreadnought(boss) {
      boss.bossType = 'omega_dreadnought';
      boss.bossName = 'OMEGA DREADNOUGHT';
      boss.bossSubtitle = 'FİNAL APEX • SINAV: TÜM ÖĞRENDİKLERİNİZ';
      boss.color = '#ef4444';
      boss.radius = 52;
      boss.speed = 1.25;
      boss.maxHp = 4800 + (window.wave || 10) * 800;
      boss.hp = boss.maxHp;

      if (window.BossTurretPart && window.enemies) {
        const leftTurret = new window.BossTurretPart(boss, -38, -20, 'Sol Plazma Tareti');
        const rightTurret = new window.BossTurretPart(boss, 38, -20, 'Sağ Plazma Tareti');
        this.bossSubsystems.push(leftTurret, rightTurret);
        window.enemies.push(leftTurret, rightTurret);
      }
    }

    triggerBossIntro(bossName, subtitle = 'SEKTÖR ABLUKA PROTOKOLÜ DEVREDE') {
      try {
        // Not: 144Hz kesintisiz akıcılık için yapay hitStop dondurması kaldırılmıştır (0 micro-stutter)
        if (typeof window.triggerCameraZoom === 'function') window.triggerCameraZoom(0.08);
        if (typeof window.screenShake !== 'undefined') window.screenShake = Math.max(window.screenShake || 0, 24);
        if (window.audio && typeof window.audio.playExplosion === 'function') window.audio.playExplosion(2.4);

        if (typeof window.showBossNotification === 'function') {
          window.showBossNotification('⚠️ KRİTİK TEHDİT TESPİT EDİLDİ ⚠️', bossName, subtitle, '#ef4444');
        }
      } catch (err) {
        console.warn('[BiomeBossManager] triggerBossIntro warning:', err);
      }
    }

    update(dt) {
      if (this.hazardGraphics && (!this.activeBoss || this.activeBoss.dead || this.activeBoss.hp <= 0)) {
        this.hazardGraphics.clear();
      }
    }
  }

  function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }

    const dx = px - xx;
    const dy = py - yy;
    return Math.hypot(dx, dy);
  }

  window.BiomeBossManager = new BiomeBossManager();

})();
