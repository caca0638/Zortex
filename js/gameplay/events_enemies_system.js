/* ==============================================================
   ZORTEX: CYBER SURVIVOR — FAZ 2 İÇERİK: ZAMANLI OLAYLAR & YENİ DÜŞMANLAR
   Tasarım Belgesi Bölüm 8, 9, 10 & 13.1 Standartlarına Tam Uyumlu
   6 Olay, 4 Yeni Düşman Arketipi & 3 Bölüm Mini-Boss Sistemi
   ============================================================== */

(() => {
  'use strict';

  /* ==============================================================
     1. YENİ DÜŞMAN ARKETİPLERİ (Bölüm 8)
     ============================================================== */

  // A) ONARICI DRON (Healer Drone - Yakındaki düşmanlara saniyede %5 can basar)
  class HealerDroneEnemy {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 16;
      this.type = 'healer';
      const curWave = (typeof wave !== 'undefined' ? wave : 1);
      const waveScaleHp = Math.pow(1.18, Math.max(0, curWave - 1));
      const waveScaleDmg = Math.pow(1.06, Math.max(0, curWave - 1));
      this.maxHp = Math.round(65 * waveScaleHp);
      this.hp = this.maxHp;
      this.speed = 1.9;
      this.color = '#10b981'; // Yeşil şifa rengi
      this.xpValue = 8;
      this.damage = Math.round(15 * waveScaleDmg);
      this.dead = false;
      this.flash = 0;
      this.healTimer = 0;
      this.angle = 0;
      if (window.ZortexGameModes && typeof window.ZortexGameModes.applyHeatToEnemy === 'function') {
        window.ZortexGameModes.applyHeatToEnemy(this);
      }
    }

    update(dt) {
      if (this.dead) return;
      if (this.flash > 0) this.flash -= dt;
      const p = window.player;
      if (!p || p.hp <= 0) return;

      // Oyuncudan 250-400px mesafede durup yaralı dostlarını takip eder
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      this.angle = Math.atan2(dy, dx);

      if (dist < 260) {
        this.x -= Math.cos(this.angle) * this.speed * dt * 60;
        this.y -= Math.sin(this.angle) * this.speed * dt * 60;
      } else if (dist > 450) {
        this.x += Math.cos(this.angle) * (this.speed * 0.8) * dt * 60;
        this.y += Math.sin(this.angle) * (this.speed * 0.8) * dt * 60;
      }

      // Her 1 saniyede bir 300px menzildeki en yaralı düşmanı onarır
      this.healTimer += dt;
      if (this.healTimer >= 1.0) {
        this.healTimer = 0;
        const enemiesList = window.enemies || [];
        for (let i = 0; i < enemiesList.length; i++) {
          const e = enemiesList[i];
          if (e && !e.dead && e !== this && e.hp < e.maxHp) {
            const ed = Math.hypot(e.x - this.x, e.y - this.y);
            if (ed < 320) {
              const healAmt = Math.round(e.maxHp * 0.08);
              e.hp = Math.min(e.maxHp, e.hp + healAmt);
              if (typeof particles !== 'undefined') {
                particles.emit(e.x, e.y, '#10b981', 8, 3, 2, 0.4);
              }
              break;
            }
          }
        }
      }
    }

    hit(dmg, isCrit = false, knockbackImpulse = 0, shotAngle = null, weaponType = null) {
      this.hp -= dmg;
      this.flash = 0.12;
      if (knockbackImpulse > 0 && shotAngle !== null) {
        this.x += Math.cos(shotAngle) * (knockbackImpulse * 0.6);
        this.y += Math.sin(shotAngle) * (knockbackImpulse * 0.6);
      }
      if (this.hp <= 0) {
        this.die();
        return true;
      }
      return false;
    }

    destroy() {
      this.dead = true;
    }

    die() {
      if (this.dead) return;
      this.dead = true;
      if (window.ZortexFX && typeof window.ZortexFX.triggerExplosion === 'function') window.ZortexFX.triggerExplosion(this.x, this.y, '#10b981', 1);
      if (typeof audio !== 'undefined' && audio.playExplosion) audio.playExplosion(0.7, this.x, this.y);
      if (typeof particles !== 'undefined') particles.emit(this.x, this.y, '#10b981', 25, 5, 3, 0.8);
      if (typeof spawnXpGem === 'function') spawnXpGem(this.x, this.y, this.xpValue);
    }

    drawPixi(g) {
      if (!g || this.dead) return;
      const t = performance.now() * 0.001;
      const fillCol = (this.flash > 0) ? 0xffffff : 0x10b981;
      const pulse = 1.0 + 0.08 * Math.sin(t * 5.0);
      const r = this.radius * pulse;

      // 1. Zümrüt Yeşili Zırhlı Altıgen (Hexagonal Hull)
      g.beginFill(fillCol, 0.85);
      const sides = 6;
      for (let i = 0; i < sides; i++) {
        const a = (i * Math.PI * 2) / sides;
        const px = this.x + Math.cos(a) * r;
        const py = this.y + Math.sin(a) * r;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.endFill();
      g.stroke({ width: 2.2, color: 0x6ee7b7, alpha: 0.95 });

      // 2. 3 Adet Dönen Koruma Uydusu (Orbiting Nano-Satellites)
      for (let s = 0; s < 3; s++) {
        const satAngle = t * 2.8 + (s * Math.PI * 2) / 3;
        const satDist = r + 7;
        const sx = this.x + Math.cos(satAngle) * satDist;
        const sy = this.y + Math.sin(satAngle) * satDist;
        g.beginFill(0x34d399, 0.95);
        g.drawCircle(sx, sy, 3.2);
        g.endFill();
        g.stroke({ width: 1.0, color: 0xffffff, alpha: 0.8 });
      }

      // 3. Merkez Tıbbi Artı İşareti (Healing Cross Core)
      g.moveTo(this.x - 5, this.y); g.lineTo(this.x + 5, this.y);
      g.moveTo(this.x, this.y - 5); g.lineTo(this.x, this.y + 5);
      g.stroke({ width: 2.5, color: 0xffffff, alpha: 0.95 });
    }
  }

  // B) MAYIN ATICI DRON (Mine Dropper Enemy)
  class MineDropperEnemy {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 18;
      this.type = 'mine_dropper';
      const curWave = (typeof wave !== 'undefined' ? wave : 1);
      const waveScaleHp = Math.pow(1.18, Math.max(0, curWave - 1));
      const waveScaleDmg = Math.pow(1.06, Math.max(0, curWave - 1));
      this.maxHp = Math.round(90 * waveScaleHp);
      this.hp = this.maxHp;
      this.speed = 1.6;
      this.color = '#f97316'; // Turuncu mayıncı rengi
      this.xpValue = 8;
      this.damage = Math.round(22 * waveScaleDmg);
      this.dead = false;
      this.flash = 0;
      this.dropTimer = 0;
      this.angle = Math.random() * Math.PI * 2;
      if (window.ZortexGameModes && typeof window.ZortexGameModes.applyHeatToEnemy === 'function') {
        window.ZortexGameModes.applyHeatToEnemy(this);
      }
    }

    update(dt) {
      if (this.dead) return;
      if (this.flash > 0) this.flash -= dt;
      const p = window.player;
      if (p) {
        this.angle = Math.atan2(p.y - this.y, p.x - this.x);
      }
      this.x += Math.cos(this.angle) * this.speed * dt * 60;
      this.y += Math.sin(this.angle) * this.speed * dt * 60;

      // Her 2 saniyede bir arkasında kırmızı siber tehlike mayını bırakır
      this.dropTimer += dt;
      if (this.dropTimer >= 2.2) {
        this.dropTimer = 0;
        if (typeof window.EnemyMine === 'function' && window.enemyMines) {
          window.enemyMines.push(new window.EnemyMine(this.x, this.y));
        } else if (typeof particles !== 'undefined') {
          particles.emit(this.x, this.y, '#f97316', 10, 4, 2, 0.5);
        }
      }
    }

    hit(dmg, isCrit = false, knockbackImpulse = 0, shotAngle = null, weaponType = null) {
      this.hp -= dmg;
      this.flash = 0.12;
      if (knockbackImpulse > 0 && shotAngle !== null) {
        this.x += Math.cos(shotAngle) * (knockbackImpulse * 0.6);
        this.y += Math.sin(shotAngle) * (knockbackImpulse * 0.6);
      }
      if (this.hp <= 0) {
        this.die();
        return true;
      }
      return false;
    }

    destroy() {
      this.dead = true;
    }

    die() {
      if (this.dead) return;
      this.dead = true;
      if (window.ZortexFX && typeof window.ZortexFX.triggerExplosion === 'function') window.ZortexFX.triggerExplosion(this.x, this.y, '#f59e0b', 1);
      if (typeof audio !== 'undefined' && audio.playExplosion) audio.playExplosion(0.8, this.x, this.y);
      if (typeof particles !== 'undefined') particles.emit(this.x, this.y, '#f97316', 30, 6, 4, 0.9);
      if (typeof spawnXpGem === 'function') spawnXpGem(this.x, this.y, this.xpValue);
    }

    drawPixi(g) {
      if (!g || this.dead) return;
      const t = performance.now() * 0.001;
      const fillCol = (this.flash > 0) ? 0xffffff : 0xf97316;
      const r = this.radius;

      // 1. Ağır Trapezoid Zırh Gövdesi (Heavy Cyber Armored Octagon)
      g.beginFill(fillCol, 0.90);
      const sides = 8;
      for (let i = 0; i < sides; i++) {
        const a = (i * Math.PI * 2) / sides + 0.39;
        const rad = (i % 2 === 0) ? r : r * 0.82;
        const px = this.x + Math.cos(a) * rad;
        const py = this.y + Math.sin(a) * rad;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.endFill();
      g.stroke({ width: 2.4, color: 0xffe600, alpha: 0.95 });

      // 2. Mayın Haznesi & Uyarı Çizgileri (Hazard Caution Stripes)
      g.moveTo(this.x - 7, this.y - 5); g.lineTo(this.x + 7, this.y + 5);
      g.moveTo(this.x - 7, this.y + 5); g.lineTo(this.x + 7, this.y - 5);
      g.stroke({ width: 1.8, color: 0x000000, alpha: 0.85 });

      // 3. Arka Mayın Fırlatıcı Çekirdeği (Pulsing Mine Dispenser)
      const pulse = 0.8 + 0.3 * Math.sin(t * 7.0);
      g.beginFill(0xffaa00, 0.95 * pulse);
      g.drawCircle(this.x, this.y, 4.5);
      g.endFill();
      g.lineStyle(0);
    }
  }

  // C) BÖLÜNEN KÜRE (Splitter Orb Enemy - Ölünce 2 mini küreye ayrılır)
  class SplitterEnemy {
    constructor(x, y, isMini = false) {
      this.x = x;
      this.y = y;
      this.isMini = isMini;
      this.radius = isMini ? 11 : 20;
      this.type = 'splitter';
      const curWave = (typeof wave !== 'undefined' ? wave : 1);
      const waveScaleHp = Math.pow(1.18, Math.max(0, curWave - 1));
      const waveScaleDmg = Math.pow(1.06, Math.max(0, curWave - 1));
      this.maxHp = isMini ? Math.round(30 * waveScaleHp) : Math.round(80 * waveScaleHp);
      this.hp = this.maxHp;
      this.speed = isMini ? 2.6 : 1.8;
      this.color = '#a855f7';
      this.xpValue = isMini ? 2 : 6;
      this.damage = isMini ? Math.round(14 * waveScaleDmg) : Math.round(24 * waveScaleDmg);
      this.dead = false;
      this.flash = 0;
      this.angle = 0;
      if (window.ZortexGameModes && typeof window.ZortexGameModes.applyHeatToEnemy === 'function') {
        window.ZortexGameModes.applyHeatToEnemy(this);
      }
    }

    update(dt) {
      if (this.dead) return;
      if (this.flash > 0) this.flash -= dt;
      const p = window.player;
      if (p) {
        this.angle = Math.atan2(p.y - this.y, p.x - this.x);
        this.x += Math.cos(this.angle) * this.speed * dt * 60;
        this.y += Math.sin(this.angle) * this.speed * dt * 60;
      }
    }

    hit(dmg, isCrit = false, knockbackImpulse = 0, shotAngle = null, weaponType = null) {
      this.hp -= dmg;
      this.flash = 0.12;
      if (knockbackImpulse > 0 && shotAngle !== null) {
        this.x += Math.cos(shotAngle) * (knockbackImpulse * 0.6);
        this.y += Math.sin(shotAngle) * (knockbackImpulse * 0.6);
      }
      if (this.hp <= 0) {
        this.die();
        return true;
      }
      return false;
    }

    destroy() {
      this.dead = true;
    }

    die() {
      if (this.dead) return;
      this.dead = true;
      if (typeof audio !== 'undefined' && audio.playExplosion) audio.playExplosion(this.isMini ? 0.5 : 0.8, this.x, this.y);
      if (typeof particles !== 'undefined') particles.emit(this.x, this.y, '#a855f7', 20, 5, 3, 0.8);
      if (typeof spawnXpGem === 'function') spawnXpGem(this.x, this.y, this.xpValue);

      // Ana küre öldüğünde 2 mini küre doğurur
      if (!this.isMini && Array.isArray(window.enemies)) {
        window.enemies.push(new SplitterEnemy(this.x - 15, this.y, true));
        window.enemies.push(new SplitterEnemy(this.x + 15, this.y, true));
      }
    }

    drawPixi(g) {
      if (!g || this.dead) return;
      const t = performance.now() * 0.001;
      const fillCol = (this.flash > 0) ? 0xffffff : 0x7e22ce;
      const r = this.radius;

      // 1. Çatlaklı Jeot Plazma Kabuğu (Faceted Shard Polygon)
      g.beginFill(fillCol, 0.88);
      const pts = 7;
      for (let i = 0; i < pts; i++) {
        const a = (i * Math.PI * 2) / pts + (this.spin || 0);
        const rad = (i % 2 === 0) ? r : r * 0.85;
        const px = this.x + Math.cos(a) * rad;
        const py = this.y + Math.sin(a) * rad;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.endFill();
      g.stroke({ width: 2.2, color: 0xd946ef, alpha: 0.95 });

      // 2. Enerji Çatlakları (Fissure Lines)
      g.moveTo(this.x, this.y); g.lineTo(this.x + Math.cos(t * 3.0) * (r * 0.75), this.y + Math.sin(t * 3.0) * (r * 0.75));
      g.moveTo(this.x, this.y); g.lineTo(this.x + Math.cos(t * 3.0 + 2.2) * (r * 0.7), this.y + Math.sin(t * 3.0 + 2.2) * (r * 0.7));
      g.stroke({ width: 1.6, color: 0xffffff, alpha: 0.85 });

      // 3. Rezonans Plazma Çekirdeği
      g.beginFill(0xf0abfc, 0.95);
      g.drawCircle(this.x, this.y, r * 0.35);
      g.endFill();
      g.lineStyle(0);
    }
  }

  // D) ALTIN DRON (Gold Drone - Hızlı kaçan ödül dronu)
  class GoldDroneEnemy {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 16;
      this.type = 'gold_drone';
      this.maxHp = 60;
      this.hp = this.maxHp;
      this.speed = 3.6; // Çok hızlı kaçar
      this.color = '#ffe600';
      this.xpValue = 20;
      this.damage = 5;
      this.dead = false;
      this.flash = 0;
      this.lifeTimer = 14.0; // 14 saniye hayatta kalır
      this.angle = 0;
      if (window.ZortexGameModes && typeof window.ZortexGameModes.applyHeatToEnemy === 'function') {
        window.ZortexGameModes.applyHeatToEnemy(this);
      }
    }

    update(dt) {
      if (this.dead) return;
      if (this.flash > 0) this.flash -= dt;
      this.lifeTimer -= dt;
      if (this.lifeTimer <= 0) {
        this.dead = true;
        return;
      }

      const p = window.player;
      if (p) {
        // Oyuncudan kaçar
        this.angle = Math.atan2(this.y - p.y, this.x - p.x);
        this.x += Math.cos(this.angle) * this.speed * dt * 60;
        this.y += Math.sin(this.angle) * this.speed * dt * 60;
      }
    }

    hit(dmg, isCrit = false, knockbackImpulse = 0, shotAngle = null, weaponType = null) {
      this.hp -= dmg;
      this.flash = 0.12;
      if (knockbackImpulse > 0 && shotAngle !== null) {
        this.x += Math.cos(shotAngle) * (knockbackImpulse * 0.6);
        this.y += Math.sin(shotAngle) * (knockbackImpulse * 0.6);
      }
      if (this.hp <= 0) {
        this.die();
        return true;
      }
      return false;
    }

    destroy() {
      this.dead = true;
    }

    die() {
      if (this.dead) return;
      this.dead = true;
      if (typeof audio !== 'undefined' && audio.playPickup) audio.playPickup();
      if (typeof particles !== 'undefined') particles.emit(this.x, this.y, '#ffe600', 40, 7, 5, 1.2);
      if (typeof textManager !== 'undefined') textManager.add('⭐ ALTIN DRON İMHA EDİLDİ! +250 HURDA ⭐', this.x, this.y - 30, '#ffe600', 20, 2.0);

      // Yalnızca ekstra hurda ver (sandık pop-up'ı çıkarmaz)
      if (typeof runScrap !== 'undefined') {
        runScrap += 250;
        window.runScrap = runScrap;
      } else if (typeof scrap !== 'undefined') {
        scrap += 250;
        window.scrap = scrap;
      }
    }

    drawPixi(g) {
      if (!g || this.dead) return;
      const t = performance.now() * 0.001;
      const fillCol = (this.flash > 0) ? 0xffffff : 0xfbbf24;
      const r = this.radius;
      const a = this.angle || (t * 2.0);

      // 1. Aerodinamik Altın Ok Gövdesi (Golden Arrowhead Interceptor)
      const cosA = Math.cos(a), sinA = Math.sin(a);
      const noseX = this.x + cosA * (r * 1.35);
      const noseY = this.y + sinA * (r * 1.35);
      const lWingX = this.x + Math.cos(a + 2.5) * (r * 1.1);
      const lWingY = this.y + Math.sin(a + 2.5) * (r * 1.1);
      const rWingX = this.x + Math.cos(a - 2.5) * (r * 1.1);
      const rWingY = this.y + Math.sin(a - 2.5) * (r * 1.1);
      const tailX = this.x - cosA * (r * 0.6);
      const tailY = this.y - sinA * (r * 0.6);

      g.beginFill(fillCol, 0.95);
      g.moveTo(noseX, noseY);
      g.lineTo(lWingX, lWingY);
      g.lineTo(tailX, tailY);
      g.lineTo(rWingX, rWingY);
      g.closePath();
      g.endFill();
      g.stroke({ width: 2.4, color: 0xffffff, alpha: 1.0 });

      // 2. Altın Çekirdek & Mücevher Parıltısı
      g.beginFill(0xffffff, 0.95);
      g.drawCircle(this.x, this.y, r * 0.32);
      g.endFill();

      // 3. İyon İtici Parıltısı
      g.moveTo(tailX, tailY);
      g.lineTo(tailX - cosA * 8, tailY - sinA * 8);
      g.stroke({ width: 2.0, color: 0xfef08a, alpha: 0.85 });
    }
  }

  // E) KESKİN NİŞANCI DRON (Sniper Drone - Bölüm 8)
  class SniperDroneEnemy {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 17;
      this.type = 'sniper';
      const curWave = (typeof wave !== 'undefined' ? wave : 1);
      const waveScaleHp = Math.pow(1.18, Math.max(0, curWave - 1));
      const waveScaleDmg = Math.pow(1.06, Math.max(0, curWave - 1));
      this.maxHp = Math.round(70 * waveScaleHp);
      this.hp = this.maxHp;
      this.speed = 2.0;
      this.color = '#ec4899';
      this.xpValue = 8;
      this.damage = Math.round(35 * waveScaleDmg);
      this.dead = false;
      this.flash = 0;
      this.aimTimer = 0;
      this.cooldown = 2.5;
      this.angle = 0;
      if (window.ZortexGameModes && typeof window.ZortexGameModes.applyHeatToEnemy === 'function') {
        window.ZortexGameModes.applyHeatToEnemy(this);
      }
    }

    update(dt) {
      if (this.dead) return;
      if (this.flash > 0) this.flash -= dt;
      const p = window.player;
      if (!p || p.hp <= 0) return;

      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      this.angle = Math.atan2(dy, dx);

      if (dist < 380) {
        this.x -= Math.cos(this.angle) * this.speed * dt * 60;
        this.y -= Math.sin(this.angle) * this.speed * dt * 60;
      } else if (dist > 520) {
        this.x += Math.cos(this.angle) * this.speed * dt * 60;
        this.y += Math.sin(this.angle) * this.speed * dt * 60;
      }

      this.cooldown -= dt;
      if (this.cooldown <= 0.8) {
        this.aimTimer += dt;
        if (this.cooldown <= 0) {
          this.cooldown = 3.0;
          this.aimTimer = 0;
          if (typeof window.spawnEnemyBullet === 'function') {
            window.spawnEnemyBullet(this.x, this.y, this.angle, 12, this.damage);
          }
          if (typeof audio !== 'undefined' && audio.playLaser) audio.playLaser();
          if (typeof particles !== 'undefined') particles.emit(this.x, this.y, '#ec4899', 12, 5, 3, 0.4);
        }
      }
    }

    hit(dmg, isCrit = false, knockbackImpulse = 0, shotAngle = null, weaponType = null) {
      this.hp -= dmg;
      this.flash = 0.12;
      if (knockbackImpulse > 0 && shotAngle !== null) {
        this.x += Math.cos(shotAngle) * (knockbackImpulse * 0.6);
        this.y += Math.sin(shotAngle) * (knockbackImpulse * 0.6);
      }
      if (this.hp <= 0) {
        this.die();
        return true;
      }
      return false;
    }

    destroy() {
      this.dead = true;
    }

    die() {
      if (this.dead) return;
      this.dead = true;
      if (typeof audio !== 'undefined' && audio.playExplosion) audio.playExplosion(0.8, this.x, this.y);
      if (typeof particles !== 'undefined') particles.emit(this.x, this.y, '#ec4899', 25, 5, 3, 0.8);
      if (typeof spawnXpGem === 'function') spawnXpGem(this.x, this.y, this.xpValue);
    }

    drawPixi(g) {
      if (!g || this.dead) return;
      const t = performance.now() * 0.001;
      const fillCol = (this.flash > 0) ? 0xffffff : 0xbe185d;
      const r = this.radius;
      const a = this.angle || 0;
      const cosA = Math.cos(a), sinA = Math.sin(a);

      // 1. İnce-Uzun Sivri Fuselage (Needle Sniper Fuselage)
      const tipX = this.x + cosA * (r * 1.55);
      const tipY = this.y + sinA * (r * 1.55);
      const lWingX = this.x + Math.cos(a + 2.35) * (r * 0.95);
      const lWingY = this.y + Math.sin(a + 2.35) * (r * 0.95);
      const rWingX = this.x + Math.cos(a - 2.35) * (r * 0.95);
      const rWingY = this.y + Math.sin(a - 2.35) * (r * 0.95);
      const tailX = this.x - cosA * (r * 0.9);
      const tailY = this.y - sinA * (r * 0.9);

      g.beginFill(fillCol, 0.92);
      g.moveTo(tipX, tipY);
      g.lineTo(lWingX, lWingY);
      g.lineTo(tailX, tailY);
      g.lineTo(rWingX, rWingY);
      g.closePath();
      g.endFill();
      g.stroke({ width: 2.2, color: 0xf43f5e, alpha: 0.95 });

      // 2. Manyetik Namlu Rayı (Magnetic Rail Fin)
      g.lineStyle(2.0, 0xffffff, 0.9);
      g.moveTo(this.x, this.y);
      g.lineTo(tipX, tipY);

      // 3. Optik Hedefleme Vizörü (Sniper Scope Eye)
      g.beginFill(0xff0055, 0.95);
      g.drawCircle(this.x + cosA * 4, this.y + sinA * 4, 3.2);
      g.endFill();

      // 4. Telegraph Nişan Çizgisi (Laser Sight with Crosshair Bracket)
      if (this.cooldown <= 0.8 && window.player) {
        const k = this.aimTimer / 0.8;
        const targetX = this.x + cosA * 460;
        const targetY = this.y + sinA * 460;
        g.moveTo(tipX, tipY);
        g.lineTo(targetX, targetY);
        g.circle(targetX, targetY, 4 + (1 - k) * 8);
        g.stroke({ width: 1.5 + k * 1.8, color: 0xff0055, alpha: 0.45 + k * 0.55 });
      }
    }
  }

  // F) KALKAN JENERATÖRÜ (Shield Generator - Bölüm 8)
  class ShieldGeneratorEnemy {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 22;
      this.type = 'shield_gen';
      const curWave = (typeof wave !== 'undefined' ? wave : 1);
      const waveScaleHp = Math.pow(1.18, Math.max(0, curWave - 1));
      const waveScaleDmg = Math.pow(1.06, Math.max(0, curWave - 1));
      this.maxHp = Math.round(140 * waveScaleHp);
      this.hp = this.maxHp;
      this.speed = 1.4;
      this.color = '#06b6d4';
      this.xpValue = 10;
      this.damage = Math.round(18 * waveScaleDmg);
      this.dead = false;
      this.flash = 0;
      this.shieldPulse = 0;
      if (window.ZortexGameModes && typeof window.ZortexGameModes.applyHeatToEnemy === 'function') {
        window.ZortexGameModes.applyHeatToEnemy(this);
      }
    }

    update(dt) {
      if (this.dead) return;
      if (this.flash > 0) this.flash -= dt;
      const p = window.player;
      if (p) {
        const a = Math.atan2(p.y - this.y, p.x - this.x);
        this.x += Math.cos(a) * (this.speed * 0.6) * dt * 60;
        this.y += Math.sin(a) * (this.speed * 0.6) * dt * 60;
      }
      this.shieldPulse += dt * 3.5;

      const enemiesList = window.enemies || [];
      for (let i = 0; i < enemiesList.length; i++) {
        const e = enemiesList[i];
        if (e && !e.dead && e !== this && Math.hypot(e.x - this.x, e.y - this.y) < 180) {
          e.shieldedByGenerator = true;
        }
      }
    }

    hit(dmg, isCrit = false, knockbackImpulse = 0, shotAngle = null, weaponType = null) {
      this.hp -= dmg;
      this.flash = 0.12;
      if (knockbackImpulse > 0 && shotAngle !== null) {
        this.x += Math.cos(shotAngle) * (knockbackImpulse * 0.6);
        this.y += Math.sin(shotAngle) * (knockbackImpulse * 0.6);
      }
      if (this.hp <= 0) {
        this.die();
        return true;
      }
      return false;
    }

    destroy() {
      this.dead = true;
    }

    die() {
      if (this.dead) return;
      this.dead = true;
      if (window.ZortexFX && typeof window.ZortexFX.triggerExplosion === 'function') window.ZortexFX.triggerExplosion(this.x, this.y, '#a855f7', 2);
      if (typeof audio !== 'undefined' && audio.playExplosion) audio.playExplosion(1.0, this.x, this.y);
      if (typeof particles !== 'undefined') particles.emit(this.x, this.y, '#06b6d4', 35, 6, 4, 1.0);
      if (typeof spawnXpGem === 'function') spawnXpGem(this.x, this.y, this.xpValue);
      if (typeof addShockwave === 'function') addShockwave(this.x, this.y, 0x06b6d4, 180, 0.4, 4.0);
    }

    drawPixi(g) {
      if (!g || this.dead) return;
      const t = performance.now() * 0.001;
      const fillCol = (this.flash > 0) ? 0xffffff : 0x0284c7;
      const r = this.radius;

      // 1. Ağır Elmas/Bariyer Şasisi (Diamond Fortress Hull)
      g.beginFill(fillCol, 0.92);
      g.moveTo(this.x, this.y - r * 1.25);
      g.lineTo(this.x + r * 1.15, this.y);
      g.lineTo(this.x, this.y + r * 1.25);
      g.lineTo(this.x - r * 1.15, this.y);
      g.closePath();
      g.endFill();
      g.stroke({ width: 2.6, color: 0x38bdf8, alpha: 0.95 });

      // 2. 3 Adet Kalkan Jeneratör Pilonu (Projector Pylons)
      for (let p = 0; p < 3; p++) {
        const pa = t * 2.2 + (p * Math.PI * 2) / 3;
        const px = this.x + Math.cos(pa) * (r * 0.88);
        const py = this.y + Math.sin(pa) * (r * 0.88);
        g.beginFill(0x00f3ff, 0.95);
        g.drawCircle(px, py, 3.5);
        g.endFill();
      }

      // 3. Merkez Overshield Reaktörü & Halka
      const pulse = 1.0 + 0.1 * Math.sin(t * 6.0);
      g.circle(this.x, this.y, r * 0.45 * pulse);
      g.stroke({ width: 2.0, color: 0x00f3ff, alpha: 0.85 });

      // 4. Kalkan Kubbesi Çemberi (Ince taktiksel sınır çizgisi, doldurma YOK)
      const rAura = 180 + Math.sin(this.shieldPulse) * 6;
      g.circle(this.x, this.y, rAura);
      g.stroke({ width: 1.8, color: 0x06b6d4, alpha: 0.40 });
    }
  }

  // G) ÇEKİRDEK YUTUCU (Core Eater Enemy - Yerdeki kristalleri yutar, ölünce hepsini saçar)
  class CoreEaterEnemy {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.baseRadius = 18;
      this.radius = 18;
      this.type = 'core_eater';
      const curWave = (typeof wave !== 'undefined' ? wave : 1);
      const waveScaleHp = Math.pow(1.18, Math.max(0, curWave - 1));
      const waveScaleDmg = Math.pow(1.06, Math.max(0, curWave - 1));
      this.maxHp = Math.round(95 * waveScaleHp);
      this.hp = this.maxHp;
      this.speed = 2.2;
      this.color = '#c026d3';
      this.xpValue = 10;
      this.damage = Math.round(20 * waveScaleDmg);
      this.dead = false;
      this.flash = 0;
      this.eatenCount = 0;
      this.eatenXpTotal = 0;
      this.angle = 0;
      this.mouthPulse = 0;
      if (window.ZortexGameModes && typeof window.ZortexGameModes.applyHeatToEnemy === 'function') {
        window.ZortexGameModes.applyHeatToEnemy(this);
      }
    }

    update(dt) {
      if (this.dead) return;
      if (this.flash > 0) this.flash -= dt;
      this.mouthPulse += dt * 5.0;

      let targetGem = null;
      let minDist = 400;
      const gems = window.xpGems || [];
      for (let i = 0; i < gems.length; i++) {
        const g = gems[i];
        if (g && !g.dead && !g.collected) {
          const d = Math.hypot(g.x - this.x, g.y - this.y);
          if (d < minDist) {
            minDist = d;
            targetGem = g;
          }
        }
      }

      const target = targetGem || window.player;
      if (target) {
        this.angle = Math.atan2(target.y - this.y, target.x - this.x);
        this.x += Math.cos(this.angle) * this.speed * dt * 60;
        this.y += Math.sin(this.angle) * this.speed * dt * 60;
      }

      if (targetGem && minDist < (this.radius + (targetGem.radius || 8))) {
        targetGem.dead = true;
        this.eatenCount++;
        this.eatenXpTotal += (targetGem.value || 10);
        this.radius = Math.min(32, this.baseRadius + this.eatenCount * 1.5);
        if (typeof particles !== 'undefined') {
          particles.emit(this.x, this.y, '#e879f9', 8, 3, 2, 0.4);
        }
      }
    }

    hit(dmg, isCrit = false, knockbackImpulse = 0, shotAngle = null, weaponType = null) {
      this.hp -= dmg;
      this.flash = 0.12;
      if (knockbackImpulse > 0 && shotAngle !== null) {
        this.x += Math.cos(shotAngle) * (knockbackImpulse * 0.6);
        this.y += Math.sin(shotAngle) * (knockbackImpulse * 0.6);
      }
      if (this.hp <= 0) {
        this.die();
        return true;
      }
      return false;
    }

    destroy() {
      this.dead = true;
    }

    die() {
      if (this.dead) return;
      this.dead = true;
      if (window.ZortexFX && typeof window.ZortexFX.triggerExplosion === 'function') window.ZortexFX.triggerExplosion(this.x, this.y, '#c026d3', 2);
      if (typeof audio !== 'undefined' && audio.playExplosion) audio.playExplosion(0.9, this.x, this.y);
      if (typeof particles !== 'undefined') particles.emit(this.x, this.y, '#c026d3', 35, 6, 4, 1.0);

      const returnGems = Math.max(1, this.eatenCount + 2);
      const totalBonusXp = this.xpValue + Math.round(this.eatenXpTotal * 1.25);
      const gemVal = Math.max(10, Math.round(totalBonusXp / returnGems));
      for (let i = 0; i < returnGems; i++) {
        const a = (i * Math.PI * 2) / returnGems;
        const dist = 30 + Math.random() * 25;
        if (typeof spawnXpGem === 'function') {
          spawnXpGem(this.x + Math.cos(a) * dist, this.y + Math.sin(a) * dist, gemVal);
        }
      }
      if (typeof textManager !== 'undefined' && this.eatenCount > 0) {
        textManager.add(`💎 YUTULAN KRİSTALLER KURTARILDI! (+${this.eatenCount})`, this.x, this.y - 25, '#e879f9', 16, 2.0);
      }
    }

    drawPixi(g) {
      if (!g || this.dead) return;
      const t = performance.now() * 0.001;
      const fillCol = (this.flash > 0) ? 0xffffff : 0x86198f;
      const r = this.radius;
      const a = (t * 2.0);
      const cosA = Math.cos(a), sinA = Math.sin(a);

      // 1. Siber Avcı Gövdesi (Predator Carapace)
      const p1X = this.x + cosA * (r * 1.25);
      const p1Y = this.y + sinA * (r * 1.25);
      const p2X = this.x + Math.cos(a + 2.4) * r;
      const p2Y = this.y + Math.sin(a + 2.4) * r;
      const p3X = this.x - cosA * (r * 0.8);
      const p3Y = this.y - sinA * (r * 0.8);
      const p4X = this.x + Math.cos(a - 2.4) * r;
      const p4Y = this.y + Math.sin(a - 2.4) * r;

      g.beginFill(fillCol, 0.92);
      g.moveTo(p1X, p1Y);
      g.lineTo(p2X, p2Y);
      g.lineTo(p3X, p3Y);
      g.lineTo(p4X, p4Y);
      g.closePath();
      g.endFill();
      g.stroke({ width: 2.4, color: 0xe879f9, alpha: 0.95 });

      // 2. Mekanik Kıskaç Çeneler (Mandible Pincers)
      const jawAngle = 0.28 + 0.18 * Math.sin(t * 8.0);
      g.lineStyle(2.6, 0xf0abfc, 0.95);
      g.moveTo(p1X, p1Y); g.lineTo(p1X + Math.cos(a + jawAngle) * 9, p1Y + Math.sin(a + jawAngle) * 9);
      g.moveTo(p1X, p1Y); g.lineTo(p1X + Math.cos(a - jawAngle) * 9, p1Y + Math.sin(a - jawAngle) * 9);
      g.lineStyle(0);

      // 3. Karnındaki Yutulan Kristal Saydam Haznesi
      const gemAlpha = Math.min(1.0, 0.35 + (this.eatenCount || 0) * 0.15);
      g.beginFill(0x00f3ff, gemAlpha);
      g.drawCircle(this.x - cosA * 3, this.y - sinA * 3, Math.min(r * 0.6, 4 + (this.eatenCount || 0) * 1.2));
      g.endFill();
    }
  }

  // H) SÜRÜ KRALİÇESİ (Swarm Queen Enemy & SwarmDroneChild Escortları)
  class SwarmDroneChild {
    constructor(queen, angleOffset, orbitDist) {
      this.queen = queen;
      this.angleOffset = angleOffset;
      this.orbitDist = orbitDist;
      this.x = queen.x;
      this.y = queen.y;
      this.radius = 8;
      this.dead = false;
      this.flash = 0;
      this.maxHp = 18;
      this.hp = this.maxHp;
      this.speed = 2.5;
      if (window.ZortexGameModes && typeof window.ZortexGameModes.applyHeatToEnemy === 'function') {
        window.ZortexGameModes.applyHeatToEnemy(this);
      }
    }

    update(dt) {
      if (this.dead) return;
      if (this.flash > 0) this.flash -= dt;
      if (!this.queen || this.queen.dead) {
        this.dead = true;
        if (typeof particles !== 'undefined') particles.emit(this.x, this.y, '#facc15', 6, 2, 2, 0.3);
        return;
      }
      this.angleOffset += dt * 3.2;
      this.x = this.queen.x + Math.cos(this.angleOffset) * this.orbitDist;
      this.y = this.queen.y + Math.sin(this.angleOffset) * this.orbitDist;

      const p = window.player;
      if (p && !p.dead && Math.hypot(p.x - this.x, p.y - this.y) < (p.radius || 18) + this.radius) {
        p.takeDamage(8, 'Sürü Yavrusu');
        this.dead = true;
      }
    }

    hit(dmg, isCrit = false, knockbackImpulse = 0, shotAngle = null, weaponType = null) {
      this.hp -= dmg;
      this.flash = 0.12;
      if (knockbackImpulse > 0 && shotAngle !== null) {
        this.x += Math.cos(shotAngle) * (knockbackImpulse * 0.6);
        this.y += Math.sin(shotAngle) * (knockbackImpulse * 0.6);
      }
      if (this.hp <= 0) {
        this.die();
        return true;
      }
      return false;
    }

    destroy() {
      this.dead = true;
    }

    drawPixi(g) {
      if (!g || this.dead) return;
      const fillCol = (this.flash > 0) ? 0xffffff : 0xd97706;
      const a = this.angleOffset || 0;
      const r = this.radius || 8;
      // Mini drone üçgen / ok ucu
      g.beginFill(fillCol, 0.9);
      g.moveTo(this.x + Math.cos(a) * (r * 1.3), this.y + Math.sin(a) * (r * 1.3));
      g.lineTo(this.x + Math.cos(a + 2.4) * r, this.y + Math.sin(a + 2.4) * r);
      g.lineTo(this.x + Math.cos(a - 2.4) * r, this.y + Math.sin(a - 2.4) * r);
      g.closePath();
      g.endFill();
      g.stroke({ width: 1.4, color: 0xfef08a, alpha: 0.95 });
    }
  }

  class SwarmQueenEnemy {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 28;
      this.type = 'swarm_queen';
      const curWave = (typeof wave !== 'undefined' ? wave : 1);
      const waveScaleHp = Math.pow(1.18, Math.max(0, curWave - 1));
      const waveScaleDmg = Math.pow(1.06, Math.max(0, curWave - 1));
      this.maxHp = Math.round(180 * waveScaleHp);
      this.hp = this.maxHp;
      this.speed = 1.3;
      this.color = '#eab308';
      this.xpValue = 16;
      this.damage = Math.round(25 * waveScaleDmg);
      this.dead = false;
      this.flash = 0;
      this.angle = 0;
      this.escorts = [];

      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI * 2) / 16;
        const dist = 45 + (i % 2) * 15;
        this.escorts.push(new SwarmDroneChild(this, a, dist));
      }
      if (window.ZortexGameModes && typeof window.ZortexGameModes.applyHeatToEnemy === 'function') {
        window.ZortexGameModes.applyHeatToEnemy(this);
      }
    }

    update(dt) {
      if (this.dead) return;
      if (this.flash > 0) this.flash -= dt;
      const p = window.player;
      if (p) {
        this.angle = Math.atan2(p.y - this.y, p.x - this.x);
        this.x += Math.cos(this.angle) * this.speed * dt * 60;
        this.y += Math.sin(this.angle) * this.speed * dt * 60;
      }

      for (let i = this.escorts.length - 1; i >= 0; i--) {
        const esc = this.escorts[i];
        esc.update(dt);
        if (esc.dead) {
          if (typeof window.swapAndPop === 'function') window.swapAndPop(this.escorts, i);
          else this.escorts.splice(i, 1);
        }
      }
    }

    hit(dmg, isCrit = false, knockbackImpulse = 0, shotAngle = null, weaponType = null) {
      this.hp -= dmg;
      this.flash = 0.12;
      if (knockbackImpulse > 0 && shotAngle !== null) {
        this.x += Math.cos(shotAngle) * (knockbackImpulse * 0.6);
        this.y += Math.sin(shotAngle) * (knockbackImpulse * 0.6);
      }
      if (this.hp <= 0) {
        this.die();
        return true;
      }
      return false;
    }

    destroy() {
      this.dead = true;
    }

    die() {
      if (this.dead) return;
      this.dead = true;
      if (window.ZortexFX && typeof window.ZortexFX.triggerExplosion === 'function') window.ZortexFX.triggerExplosion(this.x, this.y, '#3b82f6', 2);
      if (typeof audio !== 'undefined' && audio.playExplosion) audio.playExplosion(1.2, this.x, this.y);
      if (typeof particles !== 'undefined') particles.emit(this.x, this.y, '#eab308', 45, 8, 5, 1.2);
      if (typeof addShockwave === 'function') addShockwave(this.x, this.y, 0xeab308, 140, 0.35, 3.5);
      if (typeof spawnXpGem === 'function') spawnXpGem(this.x, this.y, this.xpValue);

      for (let i = 0; i < this.escorts.length; i++) {
        this.escorts[i].dead = true;
      }
      this.escorts = [];
    }

    drawPixi(g) {
      if (!g || this.dead) return;
      for (let i = 0; i < this.escorts.length; i++) {
        this.escorts[i].drawPixi(g);
      }

      const t = performance.now() * 0.001;
      const fillCol = (this.flash > 0) ? 0xffffff : 0xb45309;
      const r = this.radius;

      // 1. Kraliyet Ana Gemisi Taç Zırhı (Royal Crown Flagship)
      g.beginFill(fillCol, 0.95);
      const crown = [
        [r * 1.35, 0], [r * 0.7, r * 0.85], [r * 0.2, r * 1.15], [-r * 0.85, r * 0.75],
        [-r * 1.15, 0], [-r * 0.85, -r * 0.75], [r * 0.2, -r * 1.15], [r * 0.7, -r * 0.85]
      ];
      for (let i = 0; i < crown.length; i++) {
        const [lx, ly] = crown[i];
        const px = this.x + lx;
        const py = this.y + ly;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.endFill();
      g.stroke({ width: 2.8, color: 0xfde047, alpha: 1.0 });

      // 2. Kovan Çekirdeği (Pulsing Hive Core)
      const corePulse = 1.0 + 0.15 * Math.sin(t * 5.0);
      g.beginFill(0xffe600, 0.95);
      g.drawCircle(this.x, this.y, r * 0.40 * corePulse);
      g.endFill();
    }
  }

  // I) BÜYÜK HAYALET (Big Phantom Enemy - Kamuflajlı tehlike)
  class BigPhantomEnemy {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 26;
      this.type = 'big_phantom';
      const curWave = (typeof wave !== 'undefined' ? wave : 1);
      const waveScaleHp = Math.pow(1.18, Math.max(0, curWave - 1));
      const waveScaleDmg = Math.pow(1.06, Math.max(0, curWave - 1));
      this.maxHp = Math.round(150 * waveScaleHp);
      this.hp = this.maxHp;
      this.speed = 2.0;
      this.color = '#818cf8';
      this.xpValue = 12;
      this.damage = Math.round(30 * waveScaleDmg);
      this.dead = false;
      this.flash = 0;
      this.visibilityTimer = 0;
      this.isVisible = false;
      this.alpha = 0.2;
      if (window.ZortexGameModes && typeof window.ZortexGameModes.applyHeatToEnemy === 'function') {
        window.ZortexGameModes.applyHeatToEnemy(this);
      }
    }

    update(dt) {
      if (this.dead) return;
      if (this.flash > 0) this.flash -= dt;
      this.visibilityTimer += dt;

      if (this.visibilityTimer >= 3.5) {
        this.visibilityTimer = 0;
      }
      this.isVisible = (this.visibilityTimer > 2.5);
      this.alpha = this.isVisible ? 0.95 : 0.22;

      const p = window.player;
      if (p) {
        const curSpeed = this.isVisible ? this.speed * 1.8 : this.speed * 0.9;
        const angle = Math.atan2(p.y - this.y, p.x - this.x);
        this.x += Math.cos(angle) * curSpeed * dt * 60;
        this.y += Math.sin(angle) * curSpeed * dt * 60;

        if (this.isVisible && Math.hypot(p.x - this.x, p.y - this.y) < 160) {
          if (typeof addShockwave === 'function') addShockwave(this.x, this.y, 0x818cf8, 160, 0.2, 2.0);
        }
      }
    }

    hit(dmg, isCrit = false, knockbackImpulse = 0, shotAngle = null, weaponType = null) {
      this.hp -= dmg;
      this.flash = 0.12;
      if (knockbackImpulse > 0 && shotAngle !== null) {
        this.x += Math.cos(shotAngle) * (knockbackImpulse * 0.6);
        this.y += Math.sin(shotAngle) * (knockbackImpulse * 0.6);
      }
      if (this.hp <= 0) {
        this.die();
        return true;
      }
      return false;
    }

    destroy() {
      this.dead = true;
    }

    die() {
      if (this.dead) return;
      this.dead = true;
      if (window.ZortexFX && typeof window.ZortexFX.triggerExplosion === 'function') window.ZortexFX.triggerExplosion(this.x, this.y, '#818cf8', 2);
      if (typeof audio !== 'undefined' && audio.playExplosion) audio.playExplosion(1.0, this.x, this.y);
      if (typeof particles !== 'undefined') particles.emit(this.x, this.y, '#818cf8', 35, 7, 4, 1.0);
      if (typeof spawnXpGem === 'function') spawnXpGem(this.x, this.y, this.xpValue);
    }

    drawPixi(g) {
      if (!g || this.dead) return;
      const t = performance.now() * 0.001;
      const r = this.radius;
      const cloakAlpha = Math.max(0.2, Math.min(1.0, (this.alpha || 0.6) * (0.6 + 0.4 * Math.sin(t * 3.5))));
      const fillCol = (this.flash > 0) ? 0xffffff : 0x4338ca;

      // 1. Açılı Gizli Gövde (Faceted F-117 Stealth Hull)
      g.beginFill(fillCol, cloakAlpha);
      g.moveTo(this.x, this.y - r * 1.3);
      g.lineTo(this.x + r * 1.1, this.y + r * 0.7);
      g.lineTo(this.x, this.y + r * 0.3);
      g.lineTo(this.x - r * 1.1, this.y + r * 0.7);
      g.closePath();
      g.endFill();
      g.stroke({ width: 2.2, color: 0x818cf8, alpha: Math.min(1.0, cloakAlpha + 0.25) });

      // 2. Holografik Tarama Çizgileri (Holo Scanlines)
      g.moveTo(this.x - r * 0.75, this.y - r * 0.25); g.lineTo(this.x + r * 0.75, this.y - r * 0.25);
      g.moveTo(this.x - r * 0.55, this.y + r * 0.15); g.lineTo(this.x + r * 0.55, this.y + r * 0.15);
      g.stroke({ width: 1.4, color: 0x00f3ff, alpha: cloakAlpha * 0.8 });
    }
  }

  // J) YANKI DÜŞMAN (Echo Enemy - Oyuncunun silahını kopyalayıp ateşler)
  class EchoEnemy {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 20;
      this.type = 'echo';
      const curWave = (typeof wave !== 'undefined' ? wave : 1);
      const waveScaleHp = Math.pow(1.18, Math.max(0, curWave - 1));
      const waveScaleDmg = Math.pow(1.06, Math.max(0, curWave - 1));
      this.maxHp = Math.round(110 * waveScaleHp);
      this.hp = this.maxHp;
      this.speed = 1.7;
      this.color = '#e0e7ff';
      this.xpValue = 12;
      this.damage = Math.round(22 * waveScaleDmg);
      this.dead = false;
      this.flash = 0;
      this.fireTimer = 0;
      this.angle = 0;
      if (window.ZortexGameModes && typeof window.ZortexGameModes.applyHeatToEnemy === 'function') {
        window.ZortexGameModes.applyHeatToEnemy(this);
      }
    }

    update(dt) {
      if (this.dead) return;
      if (this.flash > 0) this.flash -= dt;
      const p = window.player;
      if (!p || p.hp <= 0) return;

      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      this.angle = Math.atan2(dy, dx);

      if (dist < 280) {
        this.x -= Math.cos(this.angle) * this.speed * dt * 60;
        this.y -= Math.sin(this.angle) * this.speed * dt * 60;
      } else if (dist > 420) {
        this.x += Math.cos(this.angle) * this.speed * dt * 60;
        this.y += Math.sin(this.angle) * this.speed * dt * 60;
      }

      this.fireTimer += dt;
      if (this.fireTimer >= 2.4) {
        this.fireTimer = 0;
        const activeWeapon = (window.weaponManager ? window.weaponManager.activeWeaponId : 'blaster');
        if (typeof window.spawnEnemyBullet === 'function') {
          if (activeWeapon === 'spread') {
            for (let s = -1; s <= 1; s++) {
              window.spawnEnemyBullet(this.x, this.y, this.angle + s * 0.25, 9, this.damage);
            }
          } else if (activeWeapon === 'railgun') {
            window.spawnEnemyBullet(this.x, this.y, this.angle, 15, Math.round(this.damage * 1.5));
          } else {
            window.spawnEnemyBullet(this.x, this.y, this.angle, 11, this.damage);
          }
        }
        if (typeof audio !== 'undefined' && audio.playLaser) audio.playLaser();
      }
    }

    hit(dmg, isCrit = false, knockbackImpulse = 0, shotAngle = null, weaponType = null) {
      this.hp -= dmg;
      this.flash = 0.12;
      if (knockbackImpulse > 0 && shotAngle !== null) {
        this.x += Math.cos(shotAngle) * (knockbackImpulse * 0.6);
        this.y += Math.sin(shotAngle) * (knockbackImpulse * 0.6);
      }
      if (this.hp <= 0) {
        this.die();
        return true;
      }
      return false;
    }

    destroy() {
      this.dead = true;
    }

    die() {
      if (this.dead) return;
      this.dead = true;
      if (window.ZortexFX && typeof window.ZortexFX.triggerExplosion === 'function') window.ZortexFX.triggerExplosion(this.x, this.y, '#e0e7ff', 2);
      if (typeof audio !== 'undefined' && audio.playExplosion) audio.playExplosion(0.8, this.x, this.y);
      if (typeof particles !== 'undefined') particles.emit(this.x, this.y, '#e0e7ff', 30, 6, 4, 0.9);
      if (typeof spawnXpGem === 'function') spawnXpGem(this.x, this.y, this.xpValue);
    }

    drawPixi(g) {
      if (!g || this.dead) return;
      const t = performance.now() * 0.001;
      const r = this.radius;
      const a = this.angle || (t * 2.0);
      const cosA = Math.cos(a), sinA = Math.sin(a);

      // 1. Oyuncunun Negatif/Spektral Siber İkizi (Negative Ship Twin)
      const fillCol = (this.flash > 0) ? 0xffffff : 0x1e1b4b;
      const noseX = this.x + cosA * (r * 1.35);
      const noseY = this.y + sinA * (r * 1.35);
      const lWingX = this.x + Math.cos(a + 2.5) * r;
      const lWingY = this.y + Math.sin(a + 2.5) * r;
      const rWingX = this.x + Math.cos(a - 2.5) * r;
      const rWingY = this.y + Math.sin(a - 2.5) * r;

      // Kromatik gölge (Chromatic offset ghost)
      g.moveTo(noseX - 2, noseY - 2); g.lineTo(lWingX - 2, lWingY - 2); g.lineTo(rWingX - 2, rWingY - 2); g.closePath();
      g.stroke({ width: 1.6, color: 0xff0055, alpha: 0.6 });

      g.beginFill(fillCol, 0.9);
      g.moveTo(noseX, noseY); g.lineTo(lWingX, lWingY); g.lineTo(rWingX, rWingY); g.closePath();
      g.endFill();
      g.stroke({ width: 2.2, color: 0x38bdf8, alpha: 0.95 });

      // Spektral çekirdek
      g.beginFill(0x00f3ff, 0.95);
      g.drawCircle(this.x, this.y, 3.5);
      g.endFill();
    }
  }

  // K) IŞINLAYICI SUİKASTÇI (Blink Stalker Enemy - 1.0s telegraph uyarılı pusu)
  class BlinkStalkerEnemy {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 17;
      this.type = 'blink_stalker';
      const curWave = (typeof wave !== 'undefined' ? wave : 1);
      const waveScaleHp = Math.pow(1.18, Math.max(0, curWave - 1));
      const waveScaleDmg = Math.pow(1.06, Math.max(0, curWave - 1));
      this.maxHp = Math.round(85 * waveScaleHp);
      this.hp = this.maxHp;
      this.speed = 2.0;
      this.color = '#f43f5e';
      this.xpValue = 12;
      this.damage = Math.round(35 * waveScaleDmg);
      this.dead = false;
      this.flash = 0;
      this.state = 'stalk';
      this.stateTimer = 0;
      this.dashDx = 0;
      this.dashDy = 0;
      this.angle = 0;
      if (window.ZortexGameModes && typeof window.ZortexGameModes.applyHeatToEnemy === 'function') {
        window.ZortexGameModes.applyHeatToEnemy(this);
      }
    }

    update(dt) {
      if (this.dead) return;
      if (this.flash > 0) this.flash -= dt;
      const p = window.player;
      if (!p || p.hp <= 0) return;

      this.stateTimer += dt;

      if (this.state === 'stalk') {
        const dx = p.x - this.x;
        const dy = p.y - this.y;
        this.angle = Math.atan2(dy, dx);
        this.x += Math.cos(this.angle) * this.speed * dt * 60;
        this.y += Math.sin(this.angle) * this.speed * dt * 60;

        if (this.stateTimer >= 3.0) {
          this.state = 'telegraph';
          this.stateTimer = 0;
          const behindAngle = p.angle + Math.PI + (Math.random() - 0.5) * 0.5;
          this.x = p.x + Math.cos(behindAngle) * 190;
          this.y = p.y + Math.sin(behindAngle) * 190;
          this.angle = Math.atan2(p.y - this.y, p.x - this.x);
          if (typeof particles !== 'undefined') {
            particles.emit(this.x, this.y, '#f43f5e', 18, 5, 3, 0.5);
          }
          if (typeof audio !== 'undefined' && audio.playTick) audio.playTick(0.6);
        }
      } else if (this.state === 'telegraph') {
        this.angle = Math.atan2(p.y - this.y, p.x - this.x);
        if (this.stateTimer >= 1.0) {
          this.state = 'dash';
          this.stateTimer = 0;
          this.dashDx = Math.cos(this.angle) * 10.0;
          this.dashDy = Math.sin(this.angle) * 10.0;
          if (typeof audio !== 'undefined' && audio.playLaser) audio.playLaser();
        }
      } else if (this.state === 'dash') {
        this.x += this.dashDx * dt * 60;
        this.y += this.dashDy * dt * 60;

        if (Math.hypot(p.x - this.x, p.y - this.y) < (p.radius || 18) + this.radius) {
          p.takeDamage(this.damage, 'Blink Stalker');
        }

        if (this.stateTimer >= 0.35) {
          this.state = 'stalk';
          this.stateTimer = 0;
        }
      }
    }

    hit(dmg, isCrit = false, knockbackImpulse = 0, shotAngle = null, weaponType = null) {
      this.hp -= dmg;
      this.flash = 0.12;
      if (knockbackImpulse > 0 && shotAngle !== null) {
        this.x += Math.cos(shotAngle) * (knockbackImpulse * 0.6);
        this.y += Math.sin(shotAngle) * (knockbackImpulse * 0.6);
      }
      if (this.hp <= 0) {
        this.die();
        return true;
      }
      return false;
    }

    destroy() {
      this.dead = true;
    }

    die() {
      if (this.dead) return;
      this.dead = true;
      if (window.ZortexFX && typeof window.ZortexFX.triggerExplosion === 'function') window.ZortexFX.triggerExplosion(this.x, this.y, '#f43f5e', 2);
      if (typeof audio !== 'undefined' && audio.playExplosion) audio.playExplosion(0.8, this.x, this.y);
      if (typeof particles !== 'undefined') particles.emit(this.x, this.y, '#f43f5e', 25, 6, 4, 0.8);
      if (typeof spawnXpGem === 'function') spawnXpGem(this.x, this.y, this.xpValue);
    }

    drawPixi(g) {
      if (!g || this.dead) return;
      const t = performance.now() * 0.001;
      const r = this.radius;
      const a = this.angle || 0;
      const fillCol = (this.flash > 0) ? 0xffffff : 0x9f1239;
      const cosA = Math.cos(a), sinA = Math.sin(a);

      // 1. Siber Suikastçı Mantis Tırpan Gövdesi (Scythe Assassin)
      const tipX = this.x + cosA * (r * 1.4);
      const tipY = this.y + sinA * (r * 1.4);
      const lBladeX = this.x + Math.cos(a + 2.2) * (r * 1.25);
      const lBladeY = this.y + Math.sin(a + 2.2) * (r * 1.25);
      const rBladeX = this.x + Math.cos(a - 2.2) * (r * 1.25);
      const rBladeY = this.y + Math.sin(a - 2.2) * (r * 1.25);

      g.beginFill(fillCol, 0.95);
      g.moveTo(tipX, tipY);
      g.lineTo(lBladeX, lBladeY);
      g.lineTo(this.x - cosA * (r * 0.5), this.y - sinA * (r * 0.5));
      g.lineTo(rBladeX, rBladeY);
      g.closePath();
      g.endFill();
      g.stroke({ width: 2.2, color: 0xff0055, alpha: 1.0 });

      // 2. Tırpan Kanat Uçları (Glowing Razor Scythes)
      g.moveTo(tipX, tipY); g.lineTo(lBladeX, lBladeY);
      g.moveTo(tipX, tipY); g.lineTo(rBladeX, rBladeY);
      g.stroke({ width: 2.6, color: 0xff0055, alpha: 0.9 });

      // 3. Işınlanma Öncesi Titreme (Glitch Warning Telemetry)
      if (this.state === 'telegraph') {
        g.moveTo(this.x, this.y);
        g.lineTo(this.x + Math.cos(this.angle) * 240, this.y + Math.sin(this.angle) * 240);
        g.circle(this.x + Math.cos(this.angle) * 240, this.y + Math.sin(this.angle) * 240, 8 + Math.sin(t * 25) * 3);
        g.stroke({ width: 2.0, color: 0xff0055, alpha: 0.8 });
      }
    }
  }


  /* ==============================================================
     2. 6 ZAMANLI OLAY SİSTEMİ (TIMED EVENTS SYSTEM - Bölüm 9)
     ============================================================== */

  class TimedEventsManager {
    constructor() {
      this.eventTimer = 0;
      this.nextEventThreshold = 75.0; // İlk olay ~75-90. saniyede
      this.activeEvent = null; // Aktif olay objesi
      this.activeMeteors = [];
    }

    reset() {
      this.eventTimer = 0;
      this.nextEventThreshold = 75.0;
      this.activeEvent = null;
      this.activeMeteors = [];
    }

    update(dt) {
      if (typeof gameState === 'undefined' || gameState !== 'PLAYING') return;

      this.eventTimer += dt;

      // Olay Tetikleme Kontrolü
      if (!this.activeEvent && this.eventTimer >= this.nextEventThreshold) {
        this.triggerRandomEvent();
        this.eventTimer = 0;
        const rng = (typeof gameRng === 'function') ? gameRng : Math.random;
        this.nextEventThreshold = 65.0 + rng() * 25.0; // Her 65-90 sn
      }

      // Aktif Olay Güncellemesi
      if (this.activeEvent) {
        this.activeEvent.timeLeft -= dt;
        this.activeEvent.update(dt);
        if (this.activeEvent.timeLeft <= 0) {
          this.endEvent();
        }
      }

      // Meteor Yağmuru Güncellemesi
      if (this.activeMeteors.length > 0) {
        for (let i = this.activeMeteors.length - 1; i >= 0; i--) {
          const m = this.activeMeteors[i];
          m.timer -= dt;
          if (m.timer <= 0) {
            // Meteor Çarptı!
            if (typeof audio !== 'undefined' && audio.playExplosion) audio.playExplosion(1.3, m.x, m.y);
            if (typeof particles !== 'undefined') particles.emit(m.x, m.y, '#ff4400', 40, 8, 5, 1.4);
            if (typeof addShockwave === 'function') addShockwave(m.x, m.y, 0xff4400, 140, 0.35, 4.0);

            // Düşman ve oyuncuya alan hasarı
            const p = window.player;
            if (p && Math.hypot(p.x - m.x, p.y - m.y) < 90) {
              p.takeDamage(35);
            }
            if (Array.isArray(window.enemies)) {
              for (const e of window.enemies) {
                if (e && !e.dead && Math.hypot(e.x - m.x, e.y - m.y) < 120) {
                  e.hit(180, true);
                }
              }
            }
            if (typeof window.swapAndPop === 'function') window.swapAndPop(this.activeMeteors, i);
            else this.activeMeteors.splice(i, 1);
          }
        }
      }
    }

    triggerRandomEvent() {
      const rng = (typeof gameRng === 'function') ? gameRng : Math.random;
      const eventTypes = ['meteor_shower', 'swarm_wall', 'containment_ring', 'gold_drone', 'cyber_storm', 'bonus_room'];
      const chosenType = eventTypes[Math.floor(rng() * eventTypes.length)];
      this.startEvent(chosenType);
    }

    startEvent(type) {
      if (typeof audio !== 'undefined' && audio.playWaveAlert) audio.playWaveAlert();
      const p = window.player;
      const W = window.W || 1280;
      const H = window.H || 720;
      const rng = (typeof gameRng === 'function') ? gameRng : Math.random;

      switch (type) {
        case 'meteor_shower':
          this.activeEvent = {
            type,
            name: '☄️ METEOR YAĞMURU!',
            timeLeft: 15.0,
            spawnTimer: 0,
            update: (dt) => {
              this.activeEvent.spawnTimer += dt;
              if (this.activeEvent.spawnTimer >= 0.8) {
                this.activeEvent.spawnTimer = 0;
                this.activeMeteors.push({
                  x: (p ? p.x : W / 2) + (rng() * 600 - 300),
                  y: (p ? p.y : H / 2) + (rng() * 600 - 300),
                  timer: 1.1,
                  radius: 70
                });
              }
            }
          };
          break;

        case 'swarm_wall':
          this.activeEvent = {
            type,
            name: '🌊 SÜRÜ DUVARI YAKLAŞIYOR!',
            timeLeft: 16.0,
            spawnTimer: 0,
            update: (dt) => {
              this.activeEvent.spawnTimer += dt;
              if (this.activeEvent.spawnTimer >= 1.2 && Array.isArray(window.enemies)) {
                this.activeEvent.spawnTimer = 0;
                // Ekran kenarından 15 hızlı scout düşman dizisi
                for (let k = 0; k < 12; k++) {
                  const ey = (k / 12) * H;
                  if (Math.abs(ey - (p ? p.y : H / 2)) > 90) { // Koridor boşluğu
                    if (window.Enemy) window.enemies.push(new window.Enemy(-40, ey, 'scout'));
                  }
                }
              }
            }
          };
          break;

        case 'containment_ring':
          this.activeEvent = {
            type,
            name: '⭕ ÇEVRELEME HALKASI!',
            timeLeft: 18.0,
            update: () => {}
          };
          // Oyuncunun etrafında 24 düşmanlık çember (1 boşluklu kapı)
          if (p && Array.isArray(window.enemies) && window.Enemy) {
            const count = 22;
            const r = 380;
            for (let i = 0; i < count; i++) {
              if (i === 5 || i === 6) continue; // Kaçış kapısı
              const a = (i * Math.PI * 2) / count;
              window.enemies.push(new window.Enemy(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, 'scout'));
            }
          }
          break;

        case 'gold_drone':
          this.activeEvent = {
            type,
            name: '👑 ALTIN DRON TESPİT EDİLDİ!',
            timeLeft: 14.0,
            update: () => {}
          };
          if (Array.isArray(window.enemies)) {
            window.enemies.push(new GoldDroneEnemy((p ? p.x : W / 2) + 200, (p ? p.y : H / 2) + 200));
          }
          break;

        case 'cyber_storm':
          this.activeEvent = {
            type,
            name: '⚡ SİBER FIRTINA (+%50 XP)!',
            timeLeft: 22.0,
            update: () => {}
          };
          break;

        case 'bonus_room':
          this.activeEvent = {
            type,
            name: '💎 KRİSTAL YAĞMURU & HURDA BONUSU!',
            timeLeft: 12.0,
            update: () => {}
          };
          // Kristal XP yağmuru ve zemin hurdası
          if (p) {
            if (typeof spawnXpGem === 'function') {
              for (let i = 0; i < 25; i++) {
                spawnXpGem(p.x + (Math.random() * 260 - 130), p.y + (Math.random() * 260 - 130), 10);
              }
            }
            if (typeof runScrap !== 'undefined') {
              runScrap += 150;
              window.runScrap = runScrap;
            }
          }
          break;
      }

      if (typeof window.showEventNotification === 'function' && this.activeEvent) {
        window.showEventNotification('🌟 ÖZEL KOZMİK OLAY', this.activeEvent.name, 'GÖREVİ TAMAMLAYIN VE ÖDÜLÜ KAZANIN', '#ffe600', 3.5);
      }
    }

    endEvent() {
      if (this.activeEvent && typeof window.showEventNotification === 'function') {
        window.showEventNotification('✨ OLAY BİTTİ', 'KOZMİK OLAY TAMAMLANDI', 'SEKTÖR NORMALE DÖNDÜ', '#00f3ff', 2.5);
      }
      this.activeEvent = null;
    }

    drawPixi(g) {
      if (!g) return;
      // Meteor İkaz Gölgeleri
      for (let i = 0; i < this.activeMeteors.length; i++) {
        const m = this.activeMeteors[i];
        const pulse = 1 - (m.timer / 1.1);
        g.beginFill(0xff3300, 0.25 * pulse);
        g.drawCircle(m.x, m.y, m.radius * pulse);
        g.endFill();
        g.stroke({ width: 2.2, color: 0xff4400, alpha: 0.85 * pulse });
      }
    }
  }

  // 3. GLOBAL ERİŞİM VE İLK İNİSİYALİZASYON
  const timedEventsManager = new TimedEventsManager();
  window.TimedEventsManager = TimedEventsManager;
  window.timedEventsManager = timedEventsManager;
  window.HealerDroneEnemy = HealerDroneEnemy;
  window.MineDropperEnemy = MineDropperEnemy;
  window.MineLayerEnemy = MineDropperEnemy;
  window.SplitterEnemy = SplitterEnemy;
  window.GoldDroneEnemy = GoldDroneEnemy;
  window.SniperDroneEnemy = SniperDroneEnemy;
  window.ShieldGeneratorEnemy = ShieldGeneratorEnemy;
  window.ShieldGenEnemy = ShieldGeneratorEnemy;
  window.SwarmDroneChild = SwarmDroneChild;
  window.CoreEaterEnemy = CoreEaterEnemy;
  window.SwarmQueenEnemy = SwarmQueenEnemy;
  window.BigPhantomEnemy = BigPhantomEnemy;
  window.EchoEnemy = EchoEnemy;
  window.BlinkStalkerEnemy = BlinkStalkerEnemy;

})();
