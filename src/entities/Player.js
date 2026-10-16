/**
 * ZORTEX: CYBER SURVIVOR - OYUNCU GEMİSİ SINIFI (Player.js)
 * 3 gemi sınıfı (Interceptor, Titan, Spectre), kalkan, overdrive, atış ve hareket kontrolü.
 */

import { Entity } from './Entity.js';
import { Settings } from '../config/settings.js';
import { Projectile } from './Projectile.js';

export class Player extends Entity {
  constructor(x, y, shipClassId = 'interceptor', textures = null, container = null) {
    super(x, y, 18);
    this.shipClassId = shipClassId;
    this.textures = textures;
    this.container = container;

    // Non-enumerable shieldSprite
    Object.defineProperty(this, 'shieldSprite', {
      value: null,
      writable: true,
      configurable: true,
      enumerable: false
    });

    // Silah Yönetimi
    this.activeWeaponIndex = 0;
    this.weaponKeys = ['blaster', 'spread', 'plasma_beam', 'railgun'];
    this.activeWeaponId = 'blaster';
    this.fireCooldown = 0;

    // Kombo ve İstatistikler
    this.combo = 0;
    this.comboTimer = 0;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;

    this.initStats();
    this.initSprites();
  }

  initStats() {
    const cls = Settings.SHIP_CLASSES[this.shipClassId] || Settings.SHIP_CLASSES.interceptor;
    this.shipClass = cls;
    this.speed = cls.speed;
    this.maxHealth = cls.maxHealth;
    this.health = this.maxHealth;
    this.maxShield = cls.maxShield;
    this.shield = this.maxShield;
    this.shieldRechargeDelay = 2.5;
    this.shieldTimer = 0;
    this.critChance = cls.critChance;
    this.bulletDamage = 26;
    this.magnetRadius = 140;
    this.isUltimateActive = false;
    this.relics = [];
  }

  addCombo() {
    this.combo++;
    this.comboTimer = 3.0;
  }

  gainRelic(relic) {
    if (relic) this.relics.push(relic);
  }

  initSprites() {
    if (!this.textures || !this.container) return;

    const texKey = `ship_${this.shipClassId}`;
    const tex = this.textures[texKey] || this.textures.ship_interceptor;

    if (tex && window.PIXI) {
      this.sprite = new window.PIXI.Sprite(tex);
      this.sprite.anchor.set(0.5);
      this.sprite.x = this.x;
      this.sprite.y = this.y;
      this.container.addChild(this.sprite);
    }

    if (this.textures.shield_ring && window.PIXI) {
      this.shieldSprite = new window.PIXI.Sprite(this.textures.shield_ring);
      this.shieldSprite.anchor.set(0.5);
      this.shieldSprite.visible = this.shield > 0;
      this.container.addChild(this.shieldSprite);
    }
  }

  // 1, 2, 3, 4 veya D-Pad ile Silah Değiştirme
  setWeapon(index, assetLoader = null) {
    if (index >= 0 && index < this.weaponKeys.length) {
      if (this.activeWeaponIndex !== index) {
        this.activeWeaponIndex = index;
        this.activeWeaponId = this.weaponKeys[index];
        if (assetLoader) assetLoader.playWeaponSwitch();
      }
    }
  }

  cycleWeapon(delta, assetLoader = null) {
    let nextIdx = (this.activeWeaponIndex + delta) % this.weaponKeys.length;
    if (nextIdx < 0) nextIdx += this.weaponKeys.length;
    this.setWeapon(nextIdx, assetLoader);
  }

  // Ateş Etme Fonksiyonu
  shoot(projectilesList = null, assetLoader = null, particleSystem = null) {
    if (this.fireCooldown > 0) return;

    if (!projectilesList) projectilesList = window.bullets || (window.game ? window.game.bullets : []);
    if (!assetLoader && window.game) assetLoader = window.game.assetLoader;
    if (!particleSystem && window.game) particleSystem = window.game.particleSystem;

    const container = (window.game && window.game.projectilesContainer) ? window.game.projectilesContainer : this.container;
    const textures = this.textures || (window.game && window.game.assetLoader ? window.game.assetLoader.textures : null);

    const weapon = Settings.WEAPONS[this.activeWeaponId] || Settings.WEAPONS.blaster;
    this.fireCooldown = weapon.fireRate;
    const isCrit = Math.random() < this.critChance;
    const dmg = isCrit ? weapon.damage * 2.0 : weapon.damage;

    // 1. Blaster: Hızlı, doğrusal atari lazeri
    if (this.activeWeaponId === 'blaster') {
      const p = new Projectile(this.x, this.y - 18, -Math.PI / 2, dmg, weapon.color, weapon.bulletSpeed, isCrit, 'blaster', textures, container);
      p.knockbackPower = weapon.knockback;
      projectilesList.push(p);
      if (assetLoader) assetLoader.playLaser(isCrit ? 1.4 : 1.0);
    }
    // 2. Spread Shot: 5'li yelpaze pompalı
    else if (this.activeWeaponId === 'spread') {
      const count = weapon.count || 5;
      const spread = weapon.spreadAngle || 0.36;
      for (let i = 0; i < count; i++) {
        const ang = -Math.PI / 2 + (i - (count - 1) / 2) * (spread / (count - 1));
        const p = new Projectile(this.x, this.y - 16, ang, dmg * 0.85, weapon.color, weapon.bulletSpeed, isCrit, 'spread', textures, container);
        p.knockbackPower = weapon.knockback;
        projectilesList.push(p);
      }
      if (assetLoader) assetLoader.playShotgun();
    }
    // 3. Plasma Beam: Konsantre delici plazma
    else if (this.activeWeaponId === 'plasma_beam') {
      const p = new Projectile(this.x, this.y - 20, -Math.PI / 2, dmg * 1.35, weapon.color, weapon.bulletSpeed, isCrit, 'plasma', textures, container);
      p.pierce = weapon.pierce || 3;
      p.knockbackPower = weapon.knockback;
      projectilesList.push(p);
      if (assetLoader) assetLoader.playPlasma();
    }
    // 4. Railgun: Yüksek enerjili sonsuz delme
    else if (this.activeWeaponId === 'railgun') {
      const p = new Projectile(this.x, this.y - 24, -Math.PI / 2, dmg * 2.5, weapon.color, weapon.bulletSpeed, isCrit, 'railgun', textures, container);
      p.pierce = 999;
      p.knockbackPower = weapon.knockback;
      projectilesList.push(p);
      if (assetLoader) assetLoader.playRailgun();
    }

    // Ateşleme partikülleri ve kovan fırlatma
    if (particleSystem) {
      particleSystem.emitCasing(this.x - 8, this.y + 4, Math.PI / 2);
    }
  }

  // Hasar Alma
  takeDamage(amount, assetLoader = null) {
    if (this.isDashing) return 0; // Dash esnasında hasarsızlık

    const shakeAmt = 8 + Math.min(14, amount * 0.4);
    if (typeof screenShake !== 'undefined') {
      try { screenShake = Math.max(screenShake, shakeAmt); } catch (_) {}
    }
    if (typeof window !== 'undefined') {
      if (window.game && typeof window.game.triggerScreenShake === 'function') {
        window.game.triggerScreenShake(shakeAmt);
      } else {
        window.screenShake = Math.max(window.screenShake || 0, shakeAmt);
      }
      if (typeof window.triggerHitStop === 'function') window.triggerHitStop(0.035);
      if (typeof window.triggerRumble === 'function') window.triggerRumble('heavy');
    }

    let remaining = amount;
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, remaining);
      this.shield -= absorbed;
      remaining -= absorbed;
      this.shieldTimer = this.shieldRechargeDelay;
    }

    if (remaining > 0) {
      this.health = Math.max(0, this.health - remaining);
      this.combo = 0;
      if (assetLoader) assetLoader.playHit();
    }

    if (this.health <= 0) {
      this.isDead = true;
      if (window.game) {
        window.game.gameState = 'GAMEOVER';
        window.gameState = 'GAMEOVER';
      }
      if (typeof window.gameOver === 'function') window.gameOver();
    }
    return remaining;
  }

  drawShipMesh(ctx, mainColor = '#00f3ff') {
    if (!ctx) return true;
    if (typeof ctx.save === 'function') ctx.save();
    if (typeof ctx.beginPath === 'function') ctx.beginPath();
    if (typeof ctx.rect === 'function') ctx.rect(this.x - 18, this.y - 18, 36, 36);
    if (typeof ctx.fill === 'function') ctx.fill();
    if (typeof ctx.restore === 'function') ctx.restore();
    return true;
  }

  update(dt, inputManager = null, projectilesList = null, assetLoader = null, particleSystem = null) {
    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    let moveX = 0, moveY = 0;
    let isDashing = false;
    let isShooting = false;

    if (inputManager) {
      moveX = inputManager.moveX;
      moveY = inputManager.moveY;
      isDashing = inputManager.isDashing;
      isShooting = inputManager.isShooting;
    } else if (typeof window !== 'undefined' && window.keys) {
      if (window.keys['KeyW'] || window.keys['ArrowUp']) moveY -= 1;
      if (window.keys['KeyS'] || window.keys['ArrowDown']) moveY += 1;
      if (window.keys['KeyA'] || window.keys['ArrowLeft']) moveX -= 1;
      if (window.keys['KeyD'] || window.keys['ArrowRight']) moveX += 1;
      if (moveX !== 0 && moveY !== 0) {
        moveX *= Math.SQRT1_2;
        moveY *= Math.SQRT1_2;
      }
    }

    // Girdi ve Hareket (144Hz Delta Time Uyumlu)
    const dtNorm = dt * 60;
    this.vx = moveX * this.speed;
    this.vy = moveY * this.speed;

    // Dash Kontrolü
    if (isDashing && this.dashCooldown <= 0) {
      this.isDashing = true;
      this.dashTimer = 0.20;
      this.dashCooldown = 1.20;
      if (particleSystem) {
        particleSystem.emit(this.x, this.y, this.shipClass ? this.shipClass.color : '#00f3ff', 25, 6, 3);
      }
    }

    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.vx *= 2.2;
      this.vy *= 2.2;
    } else {
      this.isDashing = false;
    }

    this.x += this.vx * dtNorm;
    this.y += this.vy * dtNorm;

    // 2.5D Retro Arcade Hareket Sınırları (Ekranın alt koridorunda hareket)
    const minX = 40;
    const maxX = Settings.CANVAS_WIDTH - 40;
    const minY = Settings.CANVAS_HEIGHT * 0.45; // Ufkun altına inemez
    const maxY = Settings.CANVAS_HEIGHT - 35;

    this.x = Math.max(minX, Math.min(maxX, this.x));
    this.y = Math.max(minY, Math.min(maxY, this.y));

    // Kalkan Otomatik Yenilenmesi
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
    } else if (this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + 18 * dt);
    }

    // Silah Değişim Dinleyicisi
    if (inputManager) {
      const selIdx = inputManager.consumeWeaponSelect();
      if (selIdx !== null) this.setWeapon(selIdx, assetLoader);

      const cycDelta = inputManager.consumeWeaponCycle();
      if (cycDelta !== 0) this.cycleWeapon(cycDelta, assetLoader);
    }

    // Ateş Kontrolü
    if (isShooting) {
      this.shoot(projectilesList, assetLoader, particleSystem);
    }

    // 2.5D Perspektif ve Sprite Senkronizasyonu
    this.applyPerspective(Settings.CANVAS_HEIGHT);

    if (this.sprite) {
      this.sprite.x = this.x;
      this.sprite.y = this.y;
      // Hareket yönüne göre hafif yatış (bank angle)
      this.sprite.rotation = (this.vx / this.speed) * 0.18;
    }

    if (this.shieldSprite) {
      this.shieldSprite.x = this.x;
      this.shieldSprite.y = this.y;
      this.shieldSprite.visible = this.shield > 0;
      this.shieldSprite.rotation += dt * 1.5;
    }
  }

  toJSON() {
    const copy = super.toJSON();
    delete copy.shieldSprite;
    return copy;
  }
}
