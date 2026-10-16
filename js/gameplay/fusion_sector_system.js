/**
 * ============================================================================
 * ZORTEX: CYBER SURVIVOR - FUSION WEAPONS & SECTOR BIOMES ENGINE
 * Module: js/gameplay/fusion_sector_system.js
 * Architecture: 144Hz Hybrid Weapon Evolutions, Destructible Asteroids & Sectors
 * ============================================================================
 */
(function() {
  'use strict';

  /* ==========================================================================
     1. SEKTÖR VE BİYOM TANIMLARI
     ========================================================================== */
  const SECTORS = [
    {
      id: 1,
      name: 'TERK EDİLMİŞ İSTASYON',
      subtitle: 'BİYOM 1 (DALGA 1-3) • METAL ENKAZ & SOLUK MAVİ',
      minWave: 1,
      maxWave: 3,
      nebulaHue: 0,
      tint: 0x00f3ff,
      hasAsteroids: false
    },
    {
      id: 2,
      name: 'PLAZMA BULUTSUSU',
      subtitle: 'BİYOM 2 (DALGA 4-6) • MOR VE YEŞİL SİS • ZEHİRLİ BULUTLAR',
      minWave: 4,
      maxWave: 6,
      nebulaHue: 120,
      tint: 0xa855f7,
      hasAsteroids: true
    },
    {
      id: 3,
      name: 'KARA DELİK YÖRÜNGESİ',
      subtitle: 'BİYOM 3 (DALGA 7-9) • KIZIL UFUĞA ÇEKİM • BÜKÜLMÜŞ UZAY',
      minWave: 7,
      maxWave: 9,
      nebulaHue: 280,
      tint: 0xff0055,
      hasAsteroids: true
    }
  ];

  /* ==========================================================================
     2. PARÇALANABİLİR SİBER ASTEROİT (Destructible Asteroid Class)
     ========================================================================== */
  class DestructibleAsteroid {
    constructor(x, y, radius = 24, hp = 100) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.maxHp = hp;
      this.hp = hp;
      this.dead = false;
      this.angle = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.8;
      this.vx = (Math.random() - 0.5) * 0.6;
      this.vy = (Math.random() - 0.5) * 0.6;
      this.color = '#38bdf8';
      this.points = [];

      // Düzensiz çokgen köşeleri (Prosedürel kaya şekli)
      const segments = 8;
      for (let i = 0; i < segments; i++) {
        const a = (i * Math.PI * 2) / segments;
        const rVar = this.radius * (0.8 + Math.random() * 0.4);
        this.points.push({ x: Math.cos(a) * rVar, y: Math.sin(a) * rVar });
      }
    }

    update(dt, W, H) {
      if (this.dead) return;
      const dtNorm = dt * 60;
      this.x += this.vx * dtNorm;
      this.y += this.vy * dtNorm;
      this.angle += this.rotSpeed * dt;

      // Ekran sınırlarından yumuşak sekme
      if (this.x < this.radius) { this.x = this.radius; this.vx *= -1; }
      else if (this.x > W - this.radius) { this.x = W - this.radius; this.vx *= -1; }
      if (this.y < this.radius) { this.y = this.radius; this.vy *= -1; }
      else if (this.y > H - this.radius) { this.y = H - this.radius; this.vy *= -1; }
    }

    hit(damage) {
      if (this.dead) return true;
      this.hp -= damage;
      if (typeof particles !== 'undefined' && particles && typeof particles.emit === 'function') {
        particles.emit(this.x, this.y, '#38bdf8', 3, 2.0, 1.5, 0.2);
      }
      if (this.hp <= 0) {
        this.die();
        return true;
      }
      return false;
    }

    die() {
      this.dead = true;
      if (typeof particles !== 'undefined' && particles && typeof particles.emit === 'function') {
        particles.emit(this.x, this.y, '#38bdf8', 12, 4.0, 2.5, 0.35);
        particles.emit(this.x, this.y, '#f59e0b', 6, 3.0, 2.0, 0.25);
      }
      if (typeof window.addShockwave === 'function') {
        window.addShockwave(this.x, this.y, 110, 0.28);
      }
      if (window.audio && typeof window.audio.playExplosion === 'function') {
        window.audio.playExplosion(0.8);
      }

      // Asteroit kırılınca hurda ve XP saçar
      if (typeof window.spawnXpGem === 'function') {
        window.spawnXpGem(this.x - 8, this.y, 5);
        window.spawnXpGem(this.x + 8, this.y, 5);
      } else {
        const gemList = window.gems || window.xpGems;
        if (gemList && typeof window.XpGem === 'function') {
          gemList.push(new window.XpGem(this.x - 8, this.y, 15));
          gemList.push(new window.XpGem(this.x + 8, this.y, 15));
        }
      }
      const scrapList = window.scraps;
      if (scrapList) {
        if (typeof window.ScrapPickup === 'function') {
          scrapList.push(new window.ScrapPickup(this.x, this.y, 3));
        } else {
          scrapList.push({
            x: this.x,
            y: this.y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            rot: 0,
            rotSpeed: 2,
            life: 18,
            value: Math.floor(2 + Math.random() * 3),
            radius: 6,
            collected: false,
            update: function(dt) {
              const dtNorm = dt * 60;
              this.life -= dt;
              this.x += this.vx * dtNorm;
              this.y += this.vy * dtNorm;
            }
          });
        }
      }
    }

    draw(gfx) {
      if (this.dead || !gfx) return;
      gfx.lineStyle(2.0, 0x0284c7, 0.9);
      gfx.beginFill(0x081e33, 0.75);
      for (let i = 0; i < this.points.length; i++) {
        const pt = this.points[i];
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        const px = this.x + (pt.x * cos - pt.y * sin);
        const py = this.y + (pt.x * sin + pt.y * cos);
        if (i === 0) gfx.moveTo(px, py);
        else gfx.lineTo(px, py);
      }
      gfx.closePath();
      gfx.endFill();

      // İç parıldayan iyon damarı
      gfx.lineStyle(1.4, 0x38bdf8, 0.65);
      gfx.moveTo(this.x - 6, this.y - 4);
      gfx.lineTo(this.x + 8, this.y + 6);

      // Hasar görmüşse mini Siber HP Göstergesi
      if (this.hp < this.maxHp) {
        const barW = 28;
        const barH = 3;
        const pct = Math.max(0, this.hp / this.maxHp);
        gfx.lineStyle(1, 0x0369a1, 0.8);
        gfx.beginFill(0x0f172a, 0.85);
        gfx.drawRect(this.x - barW / 2, this.y - this.radius - 8, barW, barH);
        gfx.endFill();
        gfx.beginFill(0x38bdf8, 0.95);
        gfx.drawRect(this.x - barW / 2, this.y - this.radius - 8, barW * pct, barH);
        gfx.endFill();
      }
    }
  }

  /* ==========================================================================
     3. DINAMIK METEOR FIRTINASI TEHLIKE OLAYI (Meteor Storm Hazard)
     ========================================================================== */
  class MeteorStormEvent {
    constructor() {
      this.active = false;
      this.timer = 0;
      this.duration = 14.0; // 14 saniyelik meteor fırtınası
      this.meteors = [];
      this.nextMeteorTime = 0;
    }

    start(W, H) {
      this.active = true;
      this.timer = this.duration;
      this.meteors = [];
      this.nextMeteorTime = 0.5;

      if (window.textManager && typeof window.textManager.add === 'function') {
        window.textManager.add('── ⚠️ METEOR FIRTINASI UYARISI ⚠️ ──', W / 2, H / 2 - 90, '#f97316', 22, 3.0);
        window.textManager.add('KOZMİK GÖKTAŞI GEÇİŞİ BAŞLADI!', W / 2, H / 2 - 55, '#facc15', 16, 2.5);
      }
      if (typeof window.screenShake !== 'undefined') {
        window.screenShake = Math.max(window.screenShake || 0, 16);
      }
      if (window.audio && typeof window.audio.playExplosion === 'function') {
        window.audio.playExplosion(1.5);
      }
    }

    update(dt, player, enemies, W, H, gfx) {
      if (!this.active) return;
      this.timer -= dt;
      if (this.timer <= 0) {
        this.active = false;
        return;
      }

      this.nextMeteorTime -= dt;
      if (this.nextMeteorTime <= 0) {
        this.nextMeteorTime = 0.45 + Math.random() * 0.35;
        // Yeni bir meteor fırlat (Yukarıdan aşağı çapraz hızla geçer)
        const spawnX = Math.random() * (W + 200) - 100;
        const targetX = spawnX + (Math.random() * 300 - 150);
        const meteor = {
          x: spawnX,
          y: -40,
          vx: (targetX - spawnX) * 0.8,
          vy: 550 + Math.random() * 250, // Yüksek hız (px/s)
          radius: 18 + Math.random() * 12,
          damage: 45,
          active: true
        };
        this.meteors.push(meteor);

        // Tehlike Ön Uyarısı (Telegraph)
        if (window.ZortexThreats && typeof window.ZortexThreats.addTelegraph === 'function') {
          const angle = Math.atan2(meteor.vy, meteor.vx);
          window.ZortexThreats.addTelegraph({ x: spawnX, y: 0 }, angle, 0.45, 1200, 0xf97316);
        }
      }

      // Meteorları güncelle ve çarpışmaları test et
      for (let i = this.meteors.length - 1; i >= 0; i--) {
        const m = this.meteors[i];
        m.x += m.vx * dt;
        m.y += m.vy * dt;

        // Kuyruk partikülü
        if (Math.random() < 0.4 && typeof particles !== 'undefined' && particles.emit) {
          particles.emit(m.x, m.y, '#f97316', 2, 2.0, 1.5, 0.2);
        }

        // Oyuncuyla temas
        if (player && !player.invulnerable && player.health > 0) {
          const pdx = player.x - m.x;
          const pdy = player.y - m.y;
          if (pdx * pdx + pdy * pdy < (player.radius + m.radius) ** 2) {
            player.takeDamage(m.damage);
            m.active = false;
          }
        }

        // Düşmanlarla temas (Düşmanları da ezer!)
        if (enemies) {
          for (let e of enemies) {
            if (!e || e.dead) continue;
            const edx = e.x - m.x;
            const edy = e.y - m.y;
            if (edx * edx + edy * edy < (e.radius + m.radius) ** 2) {
              e.hit(120, true);
              if (typeof particles !== 'undefined' && particles.emit) {
                particles.emit(e.x, e.y, '#facc15', 6, 3, 2);
              }
            }
          }
        }

        // Çizim
        if (gfx && m.active) {
          gfx.lineStyle(2.0, 0xf97316, 0.95);
          gfx.beginFill(0x7c2d12, 0.85);
          gfx.drawCircle(m.x, m.y, m.radius);
          gfx.endFill();
          gfx.beginFill(0xfef08a, 1.0);
          gfx.drawCircle(m.x, m.y, m.radius * 0.4);
          gfx.endFill();
        }

        if (m.y > H + 60 || !m.active) {
          this.meteors.splice(i, 1);
        }
      }
    }
  }

  /* ==========================================================================
     4. ANA FUSION & SECTOR ENGINE CONTROLLER
     ========================================================================== */
  class FusionSectorEngine {
    constructor() {
      this.app = null;
      this.currentSector = SECTORS[0];
      this.asteroids = [];
      this.asteroidGraphics = null;
      this.meteorStorm = new MeteorStormEvent();
      this.sectorEventWaveTriggered = 0;
    }

    setup(app, entitiesLayer) {
      if (!app) return;
      this.app = app;

      if (!this.asteroidGraphics && entitiesLayer) {
        this.asteroidGraphics = new PIXI.Graphics();
        this.asteroidGraphics.label = 'zortexSectorObjects';
        entitiesLayer.addChildAt(this.asteroidGraphics, 1);
      }

      this.registerFusionUpgrades();
    }

    /**
     * Sektör Geçişlerini Dalga Numarasına Göre Kontrol Eder
     */
    checkSectorWarp(curWave, W, H) {
      let targetSector = SECTORS[0];
      if (curWave >= 7) targetSector = SECTORS[2];
      else if (curWave >= 4) targetSector = SECTORS[1];
      else targetSector = SECTORS[0];

      if (targetSector.id !== this.currentSector.id) {
        this.currentSector = targetSector;
        this.triggerSectorWarp(targetSector, W, H);
      }

      // Sektör 3 veya Dalga 4+'te Dinamik Meteor Fırtınası Tehlike Olayı
      if ((curWave === 4 || curWave >= 5) && this.sectorEventWaveTriggered !== curWave) {
        this.sectorEventWaveTriggered = curWave;
        this.meteorStorm.start(W, H);
      }
    }

    triggerSectorWarp(sector, W, H) {
      if (window.textManager && typeof window.textManager.add === 'function') {
        window.textManager.add(`── 🌌 YENİ SEKTÖRE GİRİLDİ: [ ${sector.name} ] ──`, W / 2, 70, sector.tint, 22, 3.5);
        window.textManager.add(sector.subtitle, W / 2, 100, '#ffffff', 14, 3.0);
      }
      if (typeof window.triggerCameraZoom === 'function') window.triggerCameraZoom(0.06);
      if (typeof window.triggerHitStop === 'function') window.triggerHitStop(0.18);
      if (typeof window.screenShake !== 'undefined') window.screenShake = Math.max(window.screenShake || 0, 16);

      // Sektör atmosferik nebula renk tonlaması (AAA Biome Palette)
      if (typeof pixiNebulaContainer !== 'undefined' && pixiNebulaContainer && pixiNebulaContainer.children) {
        pixiNebulaContainer.children.forEach(c => {
          if (c) c.tint = sector.tint;
        });
      }

      // Asteroit Kuşağı veya Enkaz Alanı ise sahneye asteroitler yerleştir
      if (sector.hasAsteroids && this.asteroids.length < 5) {
        const count = 5 - this.asteroids.length;
        for (let i = 0; i < count; i++) {
          const x = 150 + Math.random() * (W - 300);
          const y = 150 + Math.random() * (H - 300);
          this.asteroids.push(new DestructibleAsteroid(x, y, 22 + Math.random() * 8, 110));
        }
      }
    }

    /**
     * Efsanevi Füzyon Yetenek Kartlarını UPGRADES_POOL'a Kaydeder
     */
    registerFusionUpgrades() {
      if (typeof window.UPGRADES_POOL === 'undefined') return;

      const fusions = [
        {
          id: 'fusion_absolute_zero',
          name: 'Mutlak Sıfır (Absolute Zero)',
          desc: 'EFSANEVİ FÜZYON: Gatling Lazer ve Buzul Mızrağı birleşir! Delici süpersonik lazer tüm ekranı dondurur, ölen düşmanlar buz şarapneli saçar!',
          icon: '🧊⚡',
          rarity: 'mythic',
          isEvolution: true,
          isFusion: true,
          owned: () => window.player && window.player.hasAbsoluteZero,
          condition: () => window.player && (window.player.hasGatlingLaser && (window.player.hasGlacierLance || window.player.hasCryoFrost)),
          apply: () => {
            const p = window.player;
            if (!p) return;
            p.hasAbsoluteZero = true;
            p.hasGatlingLaser = true;
            p.hasGlacierLance = true;
            p.bulletDamage = Math.round(p.bulletDamage * 1.5);
            this.triggerFusionCelebration('MUTLAK SIFIR (ABSOLUTE ZERO)', '#00f3ff');
          }
        },
        {
          id: 'fusion_cluster_nova',
          name: 'Klaster Süpernova (Cluster Nova)',
          desc: 'EFSANEVİ FÜZYON: Süpernova Çekirdeği ile Yelpaze Atışı birleşir! Her bomba 3 alt-çekirdeğe ayrılarak zincirleme termonükleer şok dalgaları saçar!',
          icon: '💥🌟',
          rarity: 'mythic',
          isEvolution: true,
          isFusion: true,
          owned: () => window.player && window.player.hasClusterNova,
          condition: () => window.player && (window.player.hasSupernovaCore && (window.player.hasMultiShot || window.player.activeWeaponId === 'spread')),
          apply: () => {
            const p = window.player;
            if (!p) return;
            p.hasClusterNova = true;
            p.hasSupernovaCore = true;
            this.triggerFusionCelebration('KLASTER SÜPERNOVA (CLUSTER NOVA)', '#f59e0b');
          }
        },
        {
          id: 'fusion_void_tempest',
          name: 'Tekillik Fırtınası (Void Tempest)',
          desc: 'EFSANEVİ FÜZYON: Fırtına Girdabı ve Ağır Manyetik Rezonans birleşir! Yıldırım arklarının çarptığı yerlerde mini yerçekimi tekillikleri açılır!',
          icon: '🌪️⚡',
          rarity: 'mythic',
          isEvolution: true,
          isFusion: true,
          owned: () => window.player && window.player.hasVoidTempest,
          condition: () => window.player && (window.player.hasThunderTempest && (window.player.activeWeaponId === 'railgun' || window.player.pierceCount > 0)),
          apply: () => {
            const p = window.player;
            if (!p) return;
            p.hasVoidTempest = true;
            p.hasThunderTempest = true;
            this.triggerFusionCelebration('TEKİLLİK FIRTINASI (VOID TEMPEST)', '#c084fc');
          }
        }
      ];

      for (let f of fusions) {
        if (!window.UPGRADES_POOL.some(u => u.id === f.id)) {
          window.UPGRADES_POOL.push(f);
        }
      }
    }

    triggerFusionCelebration(fusionName, color = '#00f3ff') {
      if (typeof window.triggerHitStop === 'function') window.triggerHitStop(0.28);
      if (typeof window.triggerCameraZoom === 'function') window.triggerCameraZoom(0.09);
      if (typeof window.screenShake !== 'undefined') window.screenShake = Math.max(window.screenShake || 0, 26);
      if (window.audio && typeof window.audio.playExplosion === 'function') window.audio.playExplosion(2.2);

      const p = window.player;
      if (p && typeof window.addShockwave === 'function') {
        window.addShockwave(p.x, p.y, 280, 0.45);
      }

      if (window.textManager && typeof window.textManager.add === 'function') {
        const W = window.W || 1280;
        const H = window.H || 720;
        window.textManager.add('⚡ EFSANEVİ SİLAH FÜZYONU TAMAMLANDI! ⚡', W / 2, H / 2 - 90, color, 24, 3.5);
        window.textManager.add(`[ ${fusionName} ]`, W / 2, H / 2 - 50, '#ffe600', 36, 4.0);
      }
    }

    /**
     * Mermi ile Asteroitler Arasındaki Fiziksel Çarpışmaları Kontrol Eder
     */
    checkBulletAsteroidCollisions(bullets) {
      if (!bullets || this.asteroids.length === 0) return;
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (!b) continue;
        for (let a of this.asteroids) {
          if (a.dead) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist2 = dx * dx + dy * dy;
          const rSum = a.radius + (b.radius || 4);
          if (dist2 < rSum * rSum) {
            a.hit(b.damage || 20);
            if (!b.pierce || b.pierce <= 0) {
              if (b.destroy) b.destroy();
              bullets.splice(i, 1);
              break;
            }
          }
        }
      }
    }

    /**
     * Düşman Mermilerini Asteroitlerin Siper Olarak Engellemesi
     */
    checkEnemyBulletAsteroidCollisions(enemyBullets) {
      if (!enemyBullets || this.asteroids.length === 0) return;
      for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const eb = enemyBullets[i];
        if (!eb) continue;
        for (let a of this.asteroids) {
          if (a.dead) continue;
          const dx = eb.x - a.x;
          const dy = eb.y - a.y;
          const dist2 = dx * dx + dy * dy;
          const rSum = a.radius + (eb.radius || 4);
          if (dist2 < rSum * rSum) {
            a.hit(eb.damage * 0.5);
            if (eb.destroy) eb.destroy();
            enemyBullets.splice(i, 1);
            break;
          }
        }
      }
    }

    /**
     * Oyuncu ile Asteroitler Arasındaki Yumuşak İtişme ve Siper Fiziği
     */
    checkPlayerAsteroidCollision(player) {
      if (!player || this.asteroids.length === 0) return;
      for (let a of this.asteroids) {
        if (a.dead) continue;
        const dx = player.x - a.x;
        const dy = player.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.radius + (player.radius || 16);
        if (dist < minDist) {
          if (dist <= 0.001) {
            player.x += minDist;
          } else {
            const overlap = minDist - dist;
            player.x += (dx / dist) * overlap;
            player.y += (dy / dist) * overlap;
          }
        }
      }
    }

    /**
     * Absolute Zero Özel Shatter Patlaması (Düşman Öldüğünde)
     */
    onEnemyKilled(enemy) {
      const p = window.player;
      if (!p || !p.hasAbsoluteZero || !enemy) return;

      // 8 Yöne Sekonder Buz Şarapneli Fırlat
      const BulletClass = window.Bullet;
      const bList = window.bullets;
      if (BulletClass && bList) {
        for (let s = 0; s < 8; s++) {
          const ang = (s * Math.PI * 2) / 8;
          const shard = new BulletClass(enemy.x, enemy.y, ang, Math.round(p.bulletDamage * 0.45), '#7df9ff', 13.0);
          shard.pierce = 3;
          shard.isCryo = true;
          shard.radius = 5.5;
          bList.push(shard);
        }
      }
      if (typeof particles !== 'undefined' && particles.emit) {
        particles.emit(enemy.x, enemy.y, '#00f3ff', 16, 4.0, 3.0, 0.3);
      }
      if (typeof window.addShockwave === 'function') {
        window.addShockwave(enemy.x, enemy.y, 0x00f3ff, 95, 0.25, 2.8);
      }
    }

    update(dt, player, bullets, enemyBullets, enemies, curWave, W, H) {
      // 1. Sektör Geçişi ve Olay Kontrolü
      this.checkSectorWarp(curWave, W, H);

      // 2. Çizim Tuvalini Temizle
      if (this.asteroidGraphics) {
        this.asteroidGraphics.clear();
      }

      // 3. Asteroitleri Güncelle ve Çiz
      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const ast = this.asteroids[i];
        ast.update(dt, W, H);
        ast.draw(this.asteroidGraphics);
        if (ast.dead) {
          if (typeof window.swapAndPop === 'function') window.swapAndPop(this.asteroids, i);
          else this.asteroids.splice(i, 1);
        }
      }

      // 4. Mermi ve Asteroit Siper Çarpışmaları
      this.checkBulletAsteroidCollisions(bullets);
      this.checkEnemyBulletAsteroidCollisions(enemyBullets);
      this.checkPlayerAsteroidCollision(player);

      // 5. Meteor Fırtınası Olayı
      this.meteorStorm.update(dt, player, enemies, W, H, this.asteroidGraphics);

      // 6. Biyom 3 Çevresel Tehlike: Kara Delik Yörüngesi Kütleçekim Çekimi (Dalga 7-9)
      if (this.currentSector && this.currentSector.id === 3 && player && !player.dead) {
        const cx = W / 2;
        const cy = H / 2;
        const dx = cx - player.x;
        const dy = cy - player.y;
        const dist = Math.hypot(dx, dy) || 1;
        const pullFactor = 16.0 * dt;
        player.x += (dx / dist) * pullFactor;
        player.y += (dy / dist) * pullFactor;
      }

      // 7. Biyom 2 Çevresel Tehlike: Plazma Bulutsusu Zehirli Sis Parçacıkları (Dalga 4-6)
      if (this.currentSector && this.currentSector.id === 2 && player && !player.dead) {
        if (!this.toxicCloudTimer) this.toxicCloudTimer = 0;
        this.toxicCloudTimer += dt;
        if (this.toxicCloudTimer >= 3.5) {
          this.toxicCloudTimer = 0;
          if (window.particles && typeof window.particles.emit === 'function') {
            const rx = 100 + Math.random() * (W - 200);
            const ry = 100 + Math.random() * (H - 200);
            window.particles.emit(rx, ry, '#10b981', 18, 3.5, 3.0, 1.2);
            window.particles.emit(rx, ry, '#a855f7', 14, 4.0, 2.5, 1.2);
          }
        }
      }
    }
  }

  window.ZortexFusions = new FusionSectorEngine();
  window.DestructibleAsteroid = DestructibleAsteroid;

})();
