/**
 * ZORTEX: CYBER SURVIVOR - DÜŞMAN SINIFLARI HİYERARŞİSİ (Enemy.js)
 * OOP Temelli Düşman Motoru: EnemyBase temel sınıfı ve 5 siberpunk atari alt sınıfı.
 * 2.5D derinlik ölçeklemesi: Ufuktan (Y=0, scale=0.18) oyuncuya (Y=640, scale=1.0) doğru büyür.
 */

import { Entity } from './Entity.js';
import { Settings } from '../config/settings.js';
import { Projectile } from './Projectile.js';

export class EnemyBase extends Entity {
  constructor(x, y, type = 'scout', textures = null, container = null) {
    super(x, y, 16);
    this.type = type;
    this.textures = textures;
    this.container = container;

    this.hp = 30;
    this.maxHp = 30;
    this.speed = 2.4;
    this.damage = 15;
    this.mass = 1.0;
    this.color = '#ff0055';
    this.xpValue = 10;

    // Geri Tepme (Knockback) ve Sürtünme Fiziği
    this.knockbackVx = 0;
    this.knockbackVy = 0;
    this.knockbackDamping = 0.88;

    // Seçkin (Elite) ve Affix Yetenekleri
    this.isElite = false;
    this.affix = null;
    this.aegisShield = 0;
    this.flash = 0;

    // Non-enumerable eliteSprite
    Object.defineProperty(this, 'eliteSprite', {
      value: null,
      writable: true,
      configurable: true,
      enumerable: false
    });

    this.initSprite();
  }

  initSprite() {
    if (!this.textures || !this.container || !window.PIXI) return;

    const texKey = `enemy_${this.type}`;
    const tex = this.textures[texKey] || this.textures.enemy_scout;

    if (tex) {
      this.sprite = new window.PIXI.Sprite(tex);
      this.sprite.anchor.set(0.5);
      this.sprite.x = this.x;
      this.sprite.y = this.y;
      this.container.addChild(this.sprite);
    }

    if (this.isElite && this.textures.elite_ring) {
      this.eliteSprite = new window.PIXI.Sprite(this.textures.elite_ring);
      this.eliteSprite.anchor.set(0.5);
      this.container.addChild(this.eliteSprite);
    }
  }

  applyKnockback(vx, vy, impulse) {
    const factor = impulse / Math.max(0.4, this.mass);
    this.knockbackVx += vx * factor;
    this.knockbackVy += vy * factor;
  }

  updatePhysics(dt) {
    const dtNorm = dt * 60;
    // Darbe geri tepme ivmesi
    if (Math.abs(this.knockbackVx) > 0.05 || Math.abs(this.knockbackVy) > 0.05) {
      this.x += this.knockbackVx * dtNorm;
      this.y += this.knockbackVy * dtNorm;
      const damp = Math.pow(this.knockbackDamping, dtNorm);
      this.knockbackVx *= damp;
      this.knockbackVy *= damp;
      if (Math.abs(this.knockbackVx) < 0.1) this.knockbackVx = 0;
      if (Math.abs(this.knockbackVy) < 0.1) this.knockbackVy = 0;
    } else {
      this.knockbackVx = 0;
      this.knockbackVy = 0;
    }
  }

  behavior(dt, player) {
    // Varsayılan hareket: Oyuncuya doğru ilerle (2.5D derinlikte aşağı doğru süzülüş)
    if (!player) return;
    const dtNorm = dt * 60;
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    this.rotation = angle + Math.PI / 2;
    this.x += Math.cos(angle) * this.speed * dtNorm;
    this.y += Math.sin(angle) * this.speed * dtNorm;
  }

  update(dt, player = null) {
    this.updatePhysics(dt);
    this.behavior(dt, player);

    if (this.flash > 0) this.flash -= dt;

    // 2.5D Derinlik Perspektifi: Y koordinatına göre ölçekleme
    this.applyPerspective(Settings.CANVAS_HEIGHT);

    if (this.sprite) {
      this.sprite.x = this.x;
      this.sprite.y = this.y;
      this.sprite.rotation = this.rotation;
      this.sprite.tint = this.flash > 0 ? 0xffffff : 0xffffff;
    }

    if (this.eliteSprite) {
      this.eliteSprite.x = this.x;
      this.eliteSprite.y = this.y;
      this.eliteSprite.rotation += dt * 3.0;
      this.eliteSprite.scale.set(this.scale);
    }
  }

  hit(damage, isCrit = false, knockbackImpulse = 0, shotAngle = null) {
    if (knockbackImpulse > 0 && shotAngle !== null) {
      const kx = Math.cos(shotAngle);
      const ky = Math.sin(shotAngle);
      this.applyKnockback(kx, ky, knockbackImpulse);
    }

    if (this.aegisShield > 0) {
      this.aegisShield -= damage;
      if (this.aegisShield <= 0) this.aegisShield = 0;
      return false;
    }

    this.hp -= damage;
    this.flash = 0.08;

    if (isCrit && typeof window !== 'undefined' && typeof window.triggerHitStop === 'function') {
      window.triggerHitStop(0.05);
    }

    if (this.hp <= 0) {
      this.die();
      return true; // Öldü
    }
    return false;
  }

  die() {
    this.isDead = true;
    if ((this.type === 'heavy' || this.mass >= 3.0) && typeof window !== 'undefined' && typeof window.triggerHitStop === 'function') {
      window.triggerHitStop(0.05);
    }
    if (this.isElite && this.affix === 'volatile' && typeof window !== 'undefined' && window.enemyBullets) {
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        if (typeof window.EnemyBullet === 'function') {
          window.enemyBullets.push(new window.EnemyBullet(this.x, this.y, ang, 12, '#ff0055', 4.5));
        } else {
          const textures = (window.game && window.game.assetLoader) ? window.game.assetLoader.textures : this.textures;
          const container = (window.game && window.game.projectilesContainer) ? window.game.projectilesContainer : this.container;
          window.enemyBullets.push(new Projectile(this.x, this.y, ang, 12, '#ff0055', 4.5, false, 'enemy', textures, container));
        }
      }
    }
  }

  destroy() {
    super.destroy();
    if (this.eliteSprite) {
      if (this.eliteSprite.parent) this.eliteSprite.parent.removeChild(this.eliteSprite);
      this.eliteSprite.destroy();
      this.eliteSprite = null;
    }
  }

  toJSON() {
    const copy = super.toJSON();
    delete copy.eliteSprite;
    return copy;
  }
}

// 1. Polimorfik Uyumluluk Sınıfı
export class Enemy extends EnemyBase {
  constructor(x, y, type = 'scout', textures = null, container = null) {
    super(x, y, type, textures, container);
    this.initType(type);
  }

  initType(type) {
    if (type === 'fast') {
      this.speed = 3.6;
      this.hp = 20;
      this.maxHp = 20;
      this.mass = 0.8;
      this.color = '#f43f5e';
    } else if (type === 'heavy') {
      this.speed = 1.6;
      this.hp = 140;
      this.maxHp = 140;
      this.mass = 3.6;
      this.color = '#f97316';
    } else {
      this.speed = 2.4;
      this.hp = 35;
      this.maxHp = 35;
      this.mass = 1.0;
      this.color = '#ff0055';
    }
  }
}

// 2. Swarm Drone (Sürü İHA'sı): Küçük, seri ve düşük kütleli
export class SwarmDroneEnemy extends Enemy {
  constructor(x, y, textures = null, container = null) {
    super(x, y, 'swarm', textures, container);
    this.baseRadius = 11;
    this.radius = 11;
    this.hp = 18;
    this.maxHp = 18;
    this.speed = 3.8;
    this.mass = 0.95;
    this.xpValue = 8;
  }
}

// 3. Kamikaze (İntihar Gemisi): Hızlıca oyuncuya pike yapar
export class KamikazeEnemy extends Enemy {
  constructor(x, y, textures = null, container = null) {
    super(x, y, 'kamikaze', textures, container);
    this.baseRadius = 12;
    this.radius = 12;
    this.hp = 25;
    this.maxHp = 25;
    this.speed = 4.4;
    this.mass = 0.70;
    this.detonated = false;
  }

  behavior(dt, player) {
    if (!player) return;
    super.behavior(dt, player);
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    if (dist < 26) {
      this.detonated = true;
      this.isDead = true;
    }
  }
}

// 4. Phantom (Hayalet Sıçrayıcı): Vurulduğunda yana teleport olur
export class PhantomEnemy extends Enemy {
  constructor(x, y, textures = null, container = null) {
    super(x, y, 'phantom', textures, container);
    this.baseRadius = 15;
    this.radius = 15;
    this.hp = 65;
    this.maxHp = 65;
    this.speed = 2.8;
    this.mass = 1.15;
  }

  hit(damage, isCrit = false, knockbackImpulse = 0, shotAngle = null) {
    // Hasar aldığında yana sıçrama şansı (%65)
    if (Math.random() < 0.65) {
      const warpOffset = (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 30);
      this.x = Math.max(50, Math.min(Settings.CANVAS_WIDTH - 50, this.x + warpOffset));
    }
    return super.hit(damage, isCrit, knockbackImpulse, shotAngle);
  }
}

// 5. Aegis Heavy Cruiser (Kalkanlı Ağır Zırhlı)
export class AegisHeavyEnemy extends Enemy {
  constructor(x, y, textures = null, container = null) {
    super(x, y, 'heavy', textures, container);
    this.baseRadius = 24;
    this.radius = 24;
    this.hp = 180;
    this.maxHp = 180;
    this.speed = 1.4;
    this.mass = 3.8;
    this.aegisShield = 60;
  }
}

// 6. Boss (Omega Dreadnought): Faz 1 ve Faz 2 aşamaları
export class BossEnemy extends Enemy {
  constructor(x, y, textures = null, container = null) {
    super(x, y, 'boss', textures, container);
    this.baseRadius = 45;
    this.radius = 45;
    this.hp = 850;
    this.maxHp = 850;
    this.speed = 1.1;
    this.mass = 15.0;
    this.phase = 1;
    this.invulnerableTimer = 0;
  }

  behavior(dt, player) {
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    super.behavior(dt, player);

    // Faz 2 geçiş kontrolü
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.phase = 2;
      this.invulnerableTimer = 1.2;
      this.speed *= 1.4;
    }
  }
}
