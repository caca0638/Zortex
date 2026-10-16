/**
 * ZORTEX: CYBER SURVIVOR - PIXIJS V8 2.5D COMPILED BUNDLE
 * Auto-generated from modular src/ tree for zero-CORS browser execution
 */
(() => {
  'use strict';

  // PixiJS v8 ParticleContainer Compatibility Layer
  if (typeof window !== 'undefined' && window.PIXI && window.PIXI.ParticleContainer) {
    const PC = window.PIXI.ParticleContainer;
    PC.prototype.addChild = function(...args) {
      if (typeof this.addParticle === 'function') return this.addParticle(...args);
      return window.PIXI.Container.prototype.addChild.apply(this, args);
    };
    PC.prototype.removeChild = function(...args) {
      if (typeof this.removeParticle === 'function') return this.removeParticle(...args);
      return window.PIXI.Container.prototype.removeChild.apply(this, args);
    };
    PC.prototype.removeChildren = function(...args) {
      if (typeof this.removeParticles === 'function') return this.removeParticles(...args);
      if (this.particleChildren) {
        this.particleChildren.length = 0;
        if (typeof this.onViewUpdate === 'function') this.onViewUpdate();
        return [];
      }
      return window.PIXI.Container.prototype.removeChildren.apply(this, args);
    };
    PC.prototype.removeChildAt = function(idx) {
      if (this.particleChildren && idx >= 0 && idx < this.particleChildren.length) {
        const removed = this.particleChildren.splice(idx, 1)[0];
        if (typeof this.onViewUpdate === 'function') this.onViewUpdate();
        return removed;
      }
      return null;
    };
  }

// ==================== src/config/settings.js ====================
/**
 * ZORTEX: CYBER SURVIVOR - GLOBAL AYARLAR VE YAPILANDIRMA (settings.js)
 * Modüler mimari ve 2.5D retro arcade uzay perspektifi parametreleri
 */

const Settings = {
  // Ekran ve Render Çözünürlüğü
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,
  TARGET_FPS: 144,
  BACKGROUND_COLOR: 0x020617, // Derin uzay laciverti

  // 2.5D Derinlik ve Sahte 3D Perspektif Katsayıları
  PERSPECTIVE: {
    ENABLED: true,
    HORIZON_Y: 0,            // Ekranın en üstü: Ufuk çizgisi (Z = en uzak)
    BASELINE_Y: 640,         // Oyuncunun bulunduğu zemin hizası (Z = en yakın)
    SCALE_MIN: 0.18,         // Ufukta beliren düşmanların başlangıç ölçeği (0.18)
    SCALE_MAX: 1.0,          // Oyuncuya ulaştıklarındaki ölçek (1.0)
    EXPONENT: 1.35,          // Doğrusal olmayan derinlik eğrisi (Atari arcade hissi)
    CONE_COMPRESSION: 0.45,  // Ufukta X ekseni daralma çarpanı
  },

  // 2.5D Perspektif Hesaplama Fonksiyonu
  getPerspective(y, canvasHeight = 720) {
    const clampedY = Math.max(0, Math.min(canvasHeight, y));
    const normalizedY = clampedY / canvasHeight;
    // Eğrisel derinlik faktörü (0 = ufuk, 1 = zemin)
    const factor = Math.pow(normalizedY, this.PERSPECTIVE.EXPONENT);
    const scale = this.PERSPECTIVE.SCALE_MIN + (this.PERSPECTIVE.SCALE_MAX - this.PERSPECTIVE.SCALE_MIN) * factor;
    return {
      scale,
      factor,
      alpha: Math.min(1.0, 0.4 + factor * 0.6)
    };
  },

  // Gemi Sınıfları (Interceptor, Titan, Spectre)
  SHIP_CLASSES: {
    interceptor: {
      id: 'interceptor',
      name: 'Interceptor (Seri Avcı)',
      speed: 4.6,
      maxHealth: 100,
      maxShield: 50,
      critChance: 0.08,
      color: '#00f3ff',
      colorHex: 0x00f3ff,
      desc: 'Dengeli manevra, standart kalkan ve yüksek atış hızı.'
    },
    titan: {
      id: 'titan',
      name: 'Titan (Ağır Zırhlı)',
      speed: 3.3,
      maxHealth: 180,
      maxShield: 90,
      critChance: 0.04,
      color: '#ffb300',
      colorHex: 0xffb300,
      desc: 'Yüksek zırh ve kalkan, dayanıklı gövde, yavaş hız.'
    },
    spectre: {
      id: 'spectre',
      name: 'Spectre (Hayalet Suikastçı)',
      speed: 5.4,
      maxHealth: 70,
      maxShield: 35,
      critChance: 0.22,
      color: '#c084fc',
      colorHex: 0xc084fc,
      desc: 'Yüksek kritik vuruş ve sürat, kırılgan can yapısı.'
    }
  },

  // Silah Kütüphanesi ve Nitelikleri
  WEAPONS: {
    blaster: {
      id: 'blaster',
      name: 'Blaster (Classic)',
      icon: '⚡',
      key: '1',
      damage: 26,
      bulletSpeed: 21,
      fireRate: 0.16,
      knockback: 3.2,
      color: '#00f3ff',
      colorHex: 0x00f3ff,
      radius: 4,
      pierce: 0
    },
    spread: {
      id: 'spread',
      name: 'Spread Shot (Pompalı)',
      icon: '💥',
      key: '2',
      damage: 18,
      bulletSpeed: 17,
      fireRate: 0.38,
      knockback: 8.8,
      color: '#ff7700',
      colorHex: 0xff7700,
      count: 5,
      spreadAngle: 0.36,
      radius: 4.5,
      pierce: 0
    },
    plasma_beam: {
      id: 'plasma_beam',
      name: 'Plasma Beam',
      icon: '🔥',
      key: '3',
      damage: 38,
      bulletSpeed: 27,
      fireRate: 0.22,
      knockback: 1.2,
      color: '#00ffcc',
      colorHex: 0x00ffcc,
      radius: 6,
      pierce: 3
    },
    railgun: {
      id: 'railgun',
      name: 'Railgun (Süper Işın)',
      icon: '🚀',
      key: '4',
      damage: 150,
      bulletSpeed: 38,
      fireRate: 0.85,
      knockback: 18.5,
      color: '#ffffff',
      colorHex: 0xffffff,
      radius: 9,
      pierce: 999
    }
  },

  // Parçacık Havuz Kapasiteleri (Draw Call optimizasyonu)
  PARTICLES: {
    MAX_COUNT: 10000,
    BULLETS_MAX: 5000,
    ENEMY_BULLETS_MAX: 5000,
    GEMS_MAX: 5000,
    SCRAPS_MAX: 2000
  },

  // CRT Shader ve Ekran Tercihleri
  CRT: {
    DEFAULT_ENABLED: false,
    SCANLINE_INTENSITY: 0.22,
    CURVATURE: 0.08,
    CHROMATIC_ABERRATION: 0.003
  }
};


// ==================== src/entities/Entity.js ====================
/**
 * ZORTEX: CYBER SURVIVOR - TEMEL VARLIK SINIFI (Entity.js)
 * Tüm hareketli nesneler (Player, Enemy, Projectile, Gem, Scrap) için ortak temel sınıf.
 * 2.5D retro Atari perspektifi, Z derinlik ölçeklemesi ve non-enumerable Sprite yönetimi içerir.
 */



class Entity {
  constructor(x, y, radius = 10) {
    this.x = x;
    this.y = y;
    this.z = 0; // Derinlik katmanı (0 = zemin, 1 = ufuk)
    this.vx = 0;
    this.vy = 0;
    this.baseRadius = radius;
    this.radius = radius;
    this.rotation = 0;
    this.isDead = false;
    this.scale = 1.0;
    this.alpha = 1.0;

    // CDP ve JSON serileştirme kilitlenmelerini önlemek için Sprite'ı non-enumerable tanımla
    Object.defineProperty(this, 'sprite', {
      value: null,
      writable: true,
      configurable: true,
      enumerable: false
    });
  }

  // 2.5D Retro Atari Perspektif Ölçeklemesi (Pseudo-3D)
  applyPerspective(canvasHeight = 720) {
    if (!Settings.PERSPECTIVE.ENABLED) return;

    // Y koordinatına göre derinlik ve ölçek hesapla
    const p = Settings.getPerspective(this.y, canvasHeight);
    this.scale = p.scale;
    this.radius = this.baseRadius * this.scale;

    if (this.sprite) {
      this.sprite.scale.set(this.scale);
      this.sprite.alpha = this.alpha * p.alpha;
    }
  }

  // 144Hz Delta Time Uyumlu Fizik Güncellemesi
  updatePhysics(dt) {
    const dtNorm = dt * 60;
    this.x += this.vx * dtNorm;
    this.y += this.vy * dtNorm;
  }

  update(dt) {
    this.updatePhysics(dt);
    this.applyPerspective(Settings.CANVAS_HEIGHT);

    // Sprite transform senkronizasyonu
    if (this.sprite) {
      this.sprite.x = this.x;
      this.sprite.y = this.y;
      this.sprite.rotation = this.rotation;
    }
  }

  destroy() {
    this.isDead = true;
    if (this.sprite) {
      if (this.sprite.parent) {
        this.sprite.parent.removeChild(this.sprite);
      }
      this.sprite.destroy();
      this.sprite = null;
    }
  }

  // Chrome DevTools Protocol ve JSON.stringify döngüsel referans koruması
  toJSON() {
    const copy = Object.assign({}, this);
    delete copy.sprite;
    return copy;
  }
}


// ==================== src/entities/Projectile.js ====================
/**
 * ZORTEX: CYBER SURVIVOR - MERMİ VE LAZER YÖNETİMİ (Projectile.js)
 * Tüm mermi tiplerinin (Blaster, Spread, Plasma, Railgun, Düşman Mermisi) ortak yönetim sınıfı.
 * 2.5D Derinlik İllüzyonu: Yukarı doğru ilerledikçe küçülerek uzaklaşma hissi verir.
 */




class Projectile extends Entity {
  constructor(x, y, angle, damage, color, speed = 18, isCrit = false, weaponType = 'blaster', textures = null, container = null) {
    super(x, y, isCrit ? 5 : 3.5);
    this.angle = angle;
    this.damage = damage;
    this.color = color;
    this.speed = speed;
    this.isCrit = isCrit;
    this.weaponType = weaponType;
    this.textures = textures || (window.game && window.game.assetLoader ? window.game.assetLoader.textures : (window.pixiTextures || null));
    this.container = container || (window.game ? window.game.projectilesContainer : null);

    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 1.6;
    this.pierce = 0;
    this.ricochet = 0;
    this.knockbackPower = 3.2;
    this.isEnemy = (weaponType === 'enemy');
    this.hitSet = new Set();

    this.initSprite();
  }

  initSprite() {
    if (!this.textures || !this.container || !window.PIXI) return;

    let tex = this.textures.bullet_blaster;
    if (this.weaponType === 'railgun') tex = this.textures.bullet_railgun;
    else if (this.weaponType === 'spread') tex = this.textures.bullet_spread;
    else if (this.weaponType === 'plasma') tex = this.textures.bullet_plasma;
    else if (this.weaponType === 'enemy') tex = this.textures.bullet_enemy;

    if (tex) {
      this.sprite = new window.PIXI.Sprite(tex);
      this.sprite.anchor.set(0.5);
      this.sprite.x = this.x;
      this.sprite.y = this.y;
      this.sprite.rotation = this.angle;
      this.container.addChild(this.sprite);
    }
  }

  update(dt) {
    const dtNorm = dt * 60;
    this.x += this.vx * dtNorm;
    this.y += this.vy * dtNorm;
    this.life -= dt;

    // Duvarlardan Sekme (Ricochet)
    if (this.ricochet > 0) {
      if (this.x <= 15 || this.x >= Settings.CANVAS_WIDTH - 15) {
        this.vx = -this.vx;
        this.angle = Math.atan2(this.vy, this.vx);
        this.ricochet--;
      }
      if (this.y <= 15 || this.y >= Settings.CANVAS_HEIGHT - 15) {
        this.vy = -this.vy;
        this.angle = Math.atan2(this.vy, this.vx);
        this.ricochet--;
      }
    }

    // 2.5D Mermi Perspektifi (Pseudo-3D):
    // Oyuncu mermisi yukarı çıktıkça ufka doğru küçülür (1.0 -> 0.20)
    if (Settings.PERSPECTIVE.ENABLED) {
      const p = Settings.getPerspective(this.y, Settings.CANVAS_HEIGHT);
      this.scale = p.scale;
      this.radius = this.baseRadius * this.scale;
    }

    if (this.sprite) {
      this.sprite.x = this.x;
      this.sprite.y = this.y;
      this.sprite.rotation = this.angle;
      this.sprite.scale.set(this.scale);
    }

    // Ekran dışı temizlik
    if (this.x < -40 || this.x > Settings.CANVAS_WIDTH + 40 ||
        this.y < -40 || this.y > Settings.CANVAS_HEIGHT + 40 ||
        this.life <= 0) {
      this.isDead = true;
    }
  }

  toJSON() {
    const copy = super.toJSON();
    copy.hitSet = Array.from(this.hitSet);
    return copy;
  }
}


// ==================== src/entities/Enemy.js ====================
/**
 * ZORTEX: CYBER SURVIVOR - DÜŞMAN SINIFLARI HİYERARŞİSİ (Enemy.js)
 * OOP Temelli Düşman Motoru: EnemyBase temel sınıfı ve 5 siberpunk atari alt sınıfı.
 * 2.5D derinlik ölçeklemesi: Ufuktan (Y=0, scale=0.18) oyuncuya (Y=640, scale=1.0) doğru büyür.
 */





class EnemyBase extends Entity {
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
class Enemy extends EnemyBase {
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
class SwarmDroneEnemy extends Enemy {
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
class KamikazeEnemy extends Enemy {
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
class PhantomEnemy extends Enemy {
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
class AegisHeavyEnemy extends Enemy {
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
class BossEnemy extends Enemy {
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


// ==================== src/entities/Player.js ====================
/**
 * ZORTEX: CYBER SURVIVOR - OYUNCU GEMİSİ SINIFI (Player.js)
 * 3 gemi sınıfı (Interceptor, Titan, Spectre), kalkan, overdrive, atış ve hareket kontrolü.
 */





class Player extends Entity {
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


// ==================== src/core/AssetLoader.js ====================
/**
 * ZORTEX: CYBER SURVIVOR - ASSET & PROCEDURAL TEXTURE LOADER (AssetLoader.js)
 * Harici resim dosyalarına bağımlı kalmadan PIXI.Graphics kullanarak
 * tüm gemileri, mermileri, düşmanları ve partikülleri doğrudan GPU VRAM'ine yazar.
 * Ayrıca Web Audio API ses motorunu ve GLSL CRT filtresini yönetir.
 */

class AssetLoader {
  constructor(app, PIXI) {
    this.app = app;
    this.PIXI = PIXI;
    this.textures = {};
    this.audioContext = null;
    this.audioBuffers = {};
    this.crtFilter = null;
    this.soundEnabled = true;
  }

  async init() {
    this.initAudio();
    this.generateProceduralTextures();
    await this.initCrtFilter();
  }

  // Web Audio API Ses Sentezleyicisi (0 external audio files)
  initAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    } catch (e) {
      console.warn('AudioContext başlatılamadı:', e);
    }
  }

  resumeAudio() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Retro Atari Ses Efektleri
  playLaser(pitch = 1.0) {
    if (!this.soundEnabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880 * pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110 * pitch, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  playShotgun() {
    if (!this.soundEnabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.24, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  }

  playPlasma() {
    if (!this.soundEnabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(320, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }

  playRailgun() {
    if (!this.soundEnabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.45);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  }

  playExplosion(intensity = 1.0) {
    if (!this.soundEnabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140 * intensity, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.28 * Math.min(intensity, 1.5), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  playWeaponSwitch() {
    if (!this.soundEnabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.setValueAtTime(1800, ctx.currentTime + 0.03);
    gain.gain.setValueAtTime(0.10, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  playHit() {
    if (!this.soundEnabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  // Prosedürel Dokuların VRAM'de Üretilmesi
  generateProceduralTextures() {
    const P = this.PIXI;
    const app = this.app;

    const gen = (drawFn) => {
      const g = new P.Graphics();
      drawFn(g);
      const tex = app.renderer.generateTexture(g);
      g.destroy();
      return tex;
    };

    // 1. Partiküller ve Efektler
    this.textures.particle = gen(g => {
      g.rect(-3, -3, 6, 6);
      g.fill(0xffffff);
    });

    this.textures.casing = gen(g => {
      g.rect(-2, -4, 4, 8);
      g.fill(0xffd700);
    });

    this.textures.star = gen(g => {
      g.circle(0, 0, 2);
      g.fill(0xffffff);
    });

    // 2. Oyuncu Gemileri (2.5D Retro Arcade Vektörleri)
    // Interceptor (Seri Avcı)
    this.textures.ship_interceptor = gen(g => {
      // Kanatlar
      g.poly([-22, 16, 0, -26, 22, 16, 0, 8]);
      g.fill(0x0f172a);
      g.stroke({ width: 2, color: 0x00f3ff });
      // Kokpit
      g.poly([-6, 6, 0, -18, 6, 6]);
      g.fill(0x00f3ff);
    });

    // Titan (Ağır Kruvazör)
    this.textures.ship_titan = gen(g => {
      g.poly([-28, 18, -14, -22, 0, -28, 14, -22, 28, 18, 0, 10]);
      g.fill(0x1e1b4b);
      g.stroke({ width: 2.5, color: 0xffb300 });
      g.circle(0, 0, 7);
      g.fill(0xffb300);
    });

    // Spectre (Hayalet Suikastçı)
    this.textures.ship_spectre = gen(g => {
      g.poly([-24, 20, 0, -30, 24, 20, 10, 0, 0, 14, -10, 0]);
      g.fill(0x2e1065);
      g.stroke({ width: 2, color: 0xc084fc });
      g.circle(0, -6, 5);
      g.fill(0xf43f5e);
    });

    // Kalkan Halkası
    this.textures.shield_ring = gen(g => {
      g.circle(0, 0, 32);
      g.stroke({ width: 2, color: 0x00f3ff, alpha: 0.85 });
    });

    // 3. Mermiler
    this.textures.bullet_blaster = gen(g => {
      g.rect(-2, -10, 4, 20);
      g.fill(0x00f3ff);
    });

    this.textures.bullet_spread = gen(g => {
      g.circle(0, 0, 4.5);
      g.fill(0xff7700);
    });

    this.textures.bullet_plasma = gen(g => {
      g.circle(0, 0, 6);
      g.fill(0x00ffcc);
    });

    this.textures.bullet_railgun = gen(g => {
      g.rect(-3, -24, 6, 48);
      g.fill(0xffffff);
    });

    this.textures.bullet_enemy = gen(g => {
      g.circle(0, 0, 4);
      g.fill(0xff0055);
    });

    // 4. Düşmanlar (Atari Retro Geometrileri)
    this.textures.enemy_scout = gen(g => {
      g.poly([0, 18, -14, -14, 0, -6, 14, -14]);
      g.fill(0x3b0764);
      g.stroke({ width: 2, color: 0xff0055 });
    });

    this.textures.enemy_fast = gen(g => {
      g.poly([0, 16, -10, -16, 0, -8, 10, -16]);
      g.fill(0x450a0a);
      g.stroke({ width: 1.8, color: 0xf43f5e });
    });

    this.textures.enemy_swarm = gen(g => {
      g.poly([0, 12, -9, -9, 0, -4, 9, -9]);
      g.fill(0x172554);
      g.stroke({ width: 1.5, color: 0x38bdf8 });
    });

    this.textures.enemy_heavy = gen(g => {
      g.poly([-22, -18, 0, -26, 22, -18, 26, 16, 0, 24, -26, 16]);
      g.fill(0x431407);
      g.stroke({ width: 2.5, color: 0xf97316 });
    });

    this.textures.enemy_tank = gen(g => {
      g.poly([-26, -16, 26, -16, 18, 22, -18, 22]);
      g.fill(0x1c1917);
      g.stroke({ width: 2.5, color: 0xeab308 });
    });

    this.textures.enemy_shooter = gen(g => {
      g.poly([0, 18, -16, -12, 16, -12]);
      g.fill(0x064e3b);
      g.stroke({ width: 2, color: 0x10b981 });
    });

    this.textures.enemy_kamikaze = gen(g => {
      g.poly([0, 14, -11, -11, 11, -11]);
      g.fill(0x7f1d1d);
      g.stroke({ width: 2, color: 0xef4444 });
    });

    this.textures.enemy_phantom = gen(g => {
      g.poly([0, 18, -14, 0, 0, -18, 14, 0]);
      g.fill(0x312e81);
      g.stroke({ width: 2, color: 0x818cf8 });
    });

    this.textures.enemy_boss = gen(g => {
      g.poly([-55, -45, 0, -60, 55, -45, 65, 30, 0, 55, -65, 30]);
      g.fill(0x1e1b4b);
      g.stroke({ width: 3.5, color: 0xec4899 });
      g.circle(0, 0, 18);
      g.fill(0x00f3ff);
    });

    // Seçkin Halka ve Aegis
    this.textures.elite_ring = gen(g => {
      g.circle(0, 0, 26);
      g.stroke({ width: 2.5, color: 0xff00ea });
    });

    this.textures.aegis_ring = gen(g => {
      g.circle(0, 0, 30);
      g.stroke({ width: 2.5, color: 0x00f3ff });
    });

    // 5. Ganimetler (XP Gem ve Hurda)
    this.textures.xp_gem = gen(g => {
      g.poly([0, -7, 6, 0, 0, 7, -6, 0]);
      g.fill(0x00ffcc);
      g.stroke({ width: 1, color: 0xffffff });
    });

    this.textures.scrap = gen(g => {
      g.rect(-4, -4, 8, 8);
      g.fill(0xffb300);
      g.stroke({ width: 1, color: 0xffe600 });
    });
  }

  // GLSL CRT Filtresi (shaders/crt.vert ve shaders/crt.frag yükleyicisi)
  async initCrtFilter() {
    const DEFAULT_VERT = `attribute vec2 aPosition;
varying vec2 vTextureCoord;
void main(void) {
    vTextureCoord = aPosition;
    gl_Position = vec4(aPosition * 2.0 - 1.0, 0.0, 1.0);
}`;

    const DEFAULT_FRAG = `precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uResolution;
uniform float uCurvature;
uniform float uScanlines;
uniform float uAberration;
vec2 curveUV(vec2 uv) {
    vec2 cc = uv - 0.5;
    float dist = dot(cc, cc);
    return uv + cc * (dist * uCurvature);
}
void main(void) {
    vec2 uv = curveUV(vTextureCoord);
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    float r = texture2D(uTexture, vec2(uv.x + uAberration, uv.y)).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, vec2(uv.x - uAberration, uv.y)).b;
    float a = texture2D(uTexture, uv).a;
    vec3 color = vec3(r, g, b);
    float scanline = sin(uv.y * uResolution.y * 1.5 + uTime * 2.0) * 0.5 + 0.5;
    color -= color * scanline * uScanlines;
    float vignette = uv.x * (1.0 - uv.x) * uv.y * (1.0 - uv.y);
    vignette = clamp(pow(16.0 * vignette, 0.25), 0.0, 1.0);
    color *= vignette;
    gl_FragColor = vec4(color, a);
}`;

    try {
      let vertCode = DEFAULT_VERT;
      let fragCode = DEFAULT_FRAG;
      try {
        const [vertResp, fragResp] = await Promise.all([
          fetch('./src/shaders/crt.vert').then(r => r.text()),
          fetch('./src/shaders/crt.frag').then(r => r.text())
        ]);
        if (vertResp) vertCode = vertResp;
        if (fragResp) fragCode = fragResp;
      } catch (fetchErr) {
        // file:// protokolünde fetch CORS kısıtlamasına takılırsa varsayılan GLSL şablonu kullanılır
      }

      if (this.PIXI.Filter && this.PIXI.Filter.from) {
        this.crtFilter = this.PIXI.Filter.from({
          gl: {
            vertex: vertCode,
            fragment: fragCode
          },
          resources: {
            crtUniforms: {
              uTime: { value: 0.0, type: 'f32' },
              uResolution: { value: [1280.0, 720.0], type: 'vec2<f32>' },
              uCurvature: { value: 0.07, type: 'f32' },
              uScanlines: { value: 0.22, type: 'f32' },
              uAberration: { value: 0.0035, type: 'f32' }
            }
          }
        });
      }
    } catch (err) {
      console.warn('CRT Shader derleme uyarısı:', err);
    }
  }

  updateCrt(dt) {
    if (this.crtFilter && this.crtFilter.resources && this.crtFilter.resources.crtUniforms) {
      this.crtFilter.resources.crtUniforms.uniforms.uTime += dt;
    }
  }
}


// ==================== src/core/InputManager.js ====================
/**
 * ZORTEX: CYBER SURVIVOR - GİRDİ YÖNETİCİSİ (InputManager.js)
 * Klavye, Fare ve Gamepad (Twin-Stick & D-Pad) girdilerini dinler ve normalize eder.
 */

class InputManager {
  constructor() {
    this.keys = {};
    this.mouse = { x: 640, y: 360, isDown: false, rightDown: false };
    this.gamepadConnected = false;
    this.gamepadIndex = null;
    
    // Normalize hareket vektörleri (-1 ile 1 arası)
    this.moveX = 0;
    this.moveY = 0;
    this.aimX = 0;
    this.aimY = 0;
    this.isShooting = false;
    this.isDashing = false;
    this.isDecoy = false;

    // Tetiklenen anlık olaylar (One-shot triggers)
    this.weaponSelectIndex = null; // 0, 1, 2, 3
    this.weaponCycleDelta = 0;     // -1 veya +1
    this.pauseTriggered = false;

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      this.keys[e.key] = true;

      // 1, 2, 3, 4 ve Numpad Silah Seçimleri
      if (e.code === 'Digit1' || e.code === 'Numpad1' || e.key === '1') this.weaponSelectIndex = 0;
      else if (e.code === 'Digit2' || e.code === 'Numpad2' || e.key === '2') this.weaponSelectIndex = 1;
      else if (e.code === 'Digit3' || e.code === 'Numpad3' || e.key === '3') this.weaponSelectIndex = 2;
      else if (e.code === 'Digit4' || e.code === 'Numpad4' || e.key === '4') this.weaponSelectIndex = 3;

      if (e.code === 'Space') this.isDashing = true;
      if (e.code === 'KeyC') this.isDecoy = true;
      if (e.code === 'KeyP' || e.code === 'Escape') this.pauseTriggered = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.keys[e.key] = false;
      if (e.code === 'Space') this.isDashing = false;
      if (e.code === 'KeyC') this.isDecoy = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouse.isDown = true;
      if (e.button === 2) this.mouse.rightDown = true;
    });

    window.addEventListener('pointerdown', (e) => {
      if (e.button === 0) this.mouse.isDown = true;
      if (e.button === 2) this.mouse.rightDown = true;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('pointerup', (e) => {
      if (e.button === 0) this.mouse.isDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    window.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        this.mouse.isDown = true;
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.mouse.isDown = false;
    }, { passive: true });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Gamepad Olayları
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadConnected = true;
      this.gamepadIndex = e.gamepad.index;
      console.log('🎮 Gamepad Bağlandı:', e.gamepad.id);
    });

    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadConnected = false;
      this.gamepadIndex = null;
    });
  }

  // Her karede çağrılan girdi güncellemesi
  update() {
    let mx = 0;
    let my = 0;

    // Klavye Hareketi (WASD & Ok Tuşları)
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) mx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) my -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) my += 1;

    // Vektör Normalizasyonu
    const mag = Math.hypot(mx, my);
    if (mag > 0) {
      this.moveX = mx / mag;
      this.moveY = my / mag;
    } else {
      this.moveX = 0;
      this.moveY = 0;
    }

    this.isShooting = this.mouse.isDown || this.keys['Space'] || this.keys['KeyJ'] || this.keys['KeyK'] || this.keys['KeyZ'];

    // Gamepad Durumu Kontrolü
    this.pollGamepad();
  }

  pollGamepad() {
    if (!navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    if (!gamepads || gamepads.length === 0) return;
    const gp = gamepads[this.gamepadIndex !== null ? this.gamepadIndex : 0];
    if (!gp) return;

    // Sol Analog Stick (Hareket)
    const deadzone = 0.18;
    const ax0 = gp.axes[0] || 0;
    const ax1 = gp.axes[1] || 0;
    if (Math.hypot(ax0, ax1) > deadzone) {
      this.moveX = ax0;
      this.moveY = ax1;
    }

    // Sağ Analog Stick (Nişan Alma)
    const ax2 = gp.axes[2] || 0;
    const ax3 = gp.axes[3] || 0;
    if (Math.hypot(ax2, ax3) > deadzone) {
      this.aimX = ax2;
      this.aimY = ax3;
      this.isShooting = true;
    }

    // Gamepad Butonları
    // RT (Tetik) veya A butonu ile ateş
    if ((gp.buttons[7] && gp.buttons[7].pressed) || (gp.buttons[0] && gp.buttons[0].pressed)) {
      this.isShooting = true;
    }
    // RB veya B butonu ile Dash
    if ((gp.buttons[5] && gp.buttons[5].pressed) || (gp.buttons[1] && gp.buttons[1].pressed)) {
      this.isDashing = true;
    }
    // D-Pad Sol / Sağ ile Silah Değiştirme
    if (gp.buttons[14] && gp.buttons[14].pressed) this.weaponCycleDelta = -1;
    if (gp.buttons[15] && gp.buttons[15].pressed) this.weaponCycleDelta = 1;
  }

  // Gamepad Titreşim (Haptic Feedback)
  triggerRumble(intensity = 'light') {
    if (!navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    const gp = gamepads[this.gamepadIndex !== null ? this.gamepadIndex : 0];
    if (gp && gp.vibrationActuator && gp.vibrationActuator.playEffect) {
      const effect = intensity === 'heavy'
        ? { duration: 180, strongMagnitude: 0.85, weakMagnitude: 0.65 }
        : { duration: 80, strongMagnitude: 0.35, weakMagnitude: 0.25 };
      gp.vibrationActuator.playEffect('dual-rumble', effect).catch(() => {});
    }
  }

  // Tüketilen anlık tetikleyicileri sıfırla
  consumeWeaponSelect() {
    const val = this.weaponSelectIndex;
    this.weaponSelectIndex = null;
    return val;
  }

  consumeWeaponCycle() {
    const val = this.weaponCycleDelta;
    this.weaponCycleDelta = 0;
    return val;
  }

  consumePause() {
    const val = this.pauseTriggered;
    this.pauseTriggered = false;
    return val;
  }
}


// ==================== src/environments/ParallaxSpace.js ====================
/**
 * ZORTEX: CYBER SURVIVOR - PARALLAKS UZAY MOTORU (ParallaxSpace.js)
 * PIXI.TilingSprite mimarisiyle 3 katmanlı (Derin Nebula, Uzak Yıldızlar, Yakın Yıldız Tozu)
 * oyuncu hızına ve yönüne duyarlı sonsuz kayan 2.5D derin uzay arka planı.
 */



class ParallaxSpace {
  constructor(app, PIXI, parentContainer) {
    this.app = app;
    this.PIXI = PIXI;
    this.parentContainer = parentContainer;

    this.container = new PIXI.Container();
    this.parentContainer.addChild(this.container);

    this.layers = [];
    this.baseSpeed = 120; // Piksel/saniye aşağı doğru akış
    this.initLayers();
  }

  // Katman dokularını bellekte prosedürel olarak oluştur
  createLayerTexture(width, height, count, size, color, alpha = 1.0) {
    const P = this.PIXI;
    const g = new P.Graphics();

    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      g.circle(x, y, size * (0.6 + Math.random() * 0.8));
      g.fill({ color, alpha: alpha * (0.4 + Math.random() * 0.6) });
    }

    const tex = this.app.renderer.generateTexture(g);
    g.destroy();
    return tex;
  }

  initLayers() {
    const P = this.PIXI;
    const W = Settings.CANVAS_WIDTH;
    const H = Settings.CANVAS_HEIGHT;

    // 1. Katman: Derin Kozmik Nebula ve Gaz Bulutları (Çok yavaş süzülür: 0.15x)
    const nebulaTex = this.createLayerTexture(512, 512, 18, 45, 0x1e1b4b, 0.18);
    const nebulaSprite = new P.TilingSprite({
      texture: nebulaTex,
      width: W,
      height: H
    });
    this.container.addChild(nebulaSprite);
    this.layers.push({ sprite: nebulaSprite, speedMult: 0.15, driftXMult: 0.04 });

    // 2. Katman: Uzak Yıldızlar (Orta hız: 0.55x)
    const distantTex = this.createLayerTexture(512, 512, 120, 1.4, 0x93c5fd, 0.65);
    const distantSprite = new P.TilingSprite({
      texture: distantTex,
      width: W,
      height: H
    });
    this.container.addChild(distantSprite);
    this.layers.push({ sprite: distantSprite, speedMult: 0.55, driftXMult: 0.12 });

    // 3. Katman: Yakın Kozmik Toz ve Hızlı Yıldızlar (Yüksek hız: 1.35x)
    const closeTex = this.createLayerTexture(512, 512, 45, 2.4, 0x00f3ff, 0.95);
    const closeSprite = new P.TilingSprite({
      texture: closeTex,
      width: W,
      height: H
    });
    this.container.addChild(closeSprite);
    this.layers.push({ sprite: closeSprite, speedMult: 1.35, driftXMult: 0.32 });
  }

  // Her karede oyuncu hareketine duyarlı kaydırma (144Hz Delta Time uyumlu)
  update(dt, playerVelocityX = 0, playerBoosting = false) {
    const boostMult = playerBoosting ? 2.4 : 1.0;

    for (const l of this.layers) {
      // Y ekseninde dikey uzay akışı
      const dy = this.baseSpeed * l.speedMult * boostMult * dt;
      l.sprite.tilePosition.y += dy;

      // X ekseninde oyuncunun sağa/sola gidişine karşıt tepkisel parallaks kayması
      const dx = -playerVelocityX * l.driftXMult * dt * 45;
      l.sprite.tilePosition.x += dx;
    }
  }

  destroy() {
    for (const l of this.layers) {
      l.sprite.destroy({ texture: true, baseTexture: true });
    }
    this.layers = [];
    this.container.destroy();
  }
}


// ==================== src/systems/ParticleSystem.js ====================
/**
 * ZORTEX: CYBER SURVIVOR - PARÇACIK VE EFEKT SİSTEMİ (ParticleSystem.js)
 * PIXI.ParticleContainer tabanlı, 10.000 parçacıklı, sıfır-GC havuzlama (Pooling) mimarisi.
 * Tek bir GPU Draw Call ile tüm patlama, lazer izi ve kovan efektlerini işler.
 */



class ParticleSystem {
  constructor(app, PIXI, textures, parentContainer) {
    this.app = app || (typeof window !== 'undefined' ? window.pixiApp : null);
    this.PIXI = PIXI || (typeof window !== 'undefined' ? window.PIXI : null);
    this.textures = textures || (typeof window !== 'undefined' && window.pixiTextures ? window.pixiTextures : {});
    this.parentContainer = parentContainer;

    const maxCount = Settings.PARTICLES.MAX_COUNT || 10000;
    this.maxCount = maxCount;
    this.activeCount = 0;
    this.batchBuckets = new Map();

    // PIXI.ParticleContainer Oluştur (GPU Transform & Alpha akışı)
    if (this.PIXI && this.parentContainer) {
      this.container = new this.PIXI.ParticleContainer({
        maxSize: maxCount,
        dynamicProperties: {
          position: true,
          scale: true,
          rotation: true,
          color: true
        }
      });
      this.parentContainer.addChild(this.container);
    } else {
      this.container = null;
    }

    // 10.000'lik Önceden Tahsis Edilmiş Sprite ve Veri Havuzu (Zero Runtime Allocations)
    this.pool = new Array(maxCount);
    const partTex = this.textures.particle || this.textures.star;

    for (let i = 0; i < maxCount; i++) {
      let sp = null;
      if (this.PIXI && partTex && this.container) {
        sp = new this.PIXI.Sprite(partTex);
        sp.anchor.set(0.5);
        sp.visible = false;
        if (typeof this.container.addParticle === 'function') {
          this.container.addParticle(sp);
        } else if (typeof this.container.addChild === 'function') {
          this.container.addChild(sp);
        }
      }

      this.pool[i] = {
        sprite: sp,
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        baseScale: 1,
        color: 0xffffff,
        isCasing: false
      };
    }
  }

  clear() {
    for (let i = 0; i < this.activeCount; i++) {
      if (this.pool[i].sprite) this.pool[i].sprite.visible = false;
      this.pool[i].active = false;
    }
    this.activeCount = 0;
  }

  // Renk Çevirici Yardımcı Fonksiyon
  parseColor(color) {
    if (typeof color === 'number') return color;
    if (typeof color === 'string') {
      if (color.startsWith('#')) return parseInt(color.slice(1), 16);
      if (color === 'cyan') return 0x00f3ff;
      if (color === 'magenta') return 0xff00ea;
      if (color === 'gold') return 0xffd700;
    }
    return 0xffffff;
  }

  // Patlama ve Işık Parçacığı Püskürtme
  emit(x, y, color = 0x00f3ff, count = 12, speed = 4.5, life = 0.6) {
    const colNum = this.parseColor(color);

    for (let i = 0; i < count; i++) {
      if (this.activeCount >= this.maxCount) break;

      const p = this.pool[this.activeCount];
      this.activeCount++;

      p.active = true;
      p.x = x;
      p.y = y;
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 0.7) * speed * 2.5;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      p.life = life * (0.6 + Math.random() * 0.8);
      p.maxLife = p.life;
      p.baseScale = 0.8 + Math.random() * 0.6;
      p.color = colNum;
      p.isCasing = false;

      p.sprite.visible = true;
      p.sprite.x = x;
      p.sprite.y = y;
      p.sprite.tint = colNum;
      p.sprite.scale.set(p.baseScale);
      p.sprite.alpha = 1.0;
    }
  }

  // Ateşlendiğinde Geriye Fırlayan Mermi Kovanı Efekti
  emitCasing(x, y, shipAngle = 0, color = '#ffd700') {
    if (this.activeCount >= this.maxCount) return;

    const colNum = this.parseColor(color);
    const p = this.pool[this.activeCount];
    this.activeCount++;

    p.active = true;
    p.x = x;
    p.y = y;
    // Geminin arkasına doğru 120-150 derece açıyla kovan savurma
    const ejectAngle = shipAngle + Math.PI + (Math.random() * 0.6 - 0.3);
    const spd = 2.5 + Math.random() * 2.0;
    p.vx = Math.cos(ejectAngle) * spd;
    p.vy = Math.sin(ejectAngle) * spd;
    p.life = 0.42;
    p.maxLife = 0.42;
    p.baseScale = 0.7;
    p.color = color;
    p.isCasing = true;

    p.sprite.visible = true;
    p.sprite.x = x;
    p.sprite.y = y;
    p.sprite.tint = colNum;
    p.sprite.scale.set(p.baseScale);
    p.sprite.alpha = 1.0;
  }

  // Her karede 144Hz Delta Time Uyumlu Güncelleme
  update(dt) {
    const dtNorm = dt * 60;

    for (let i = this.activeCount - 1; i >= 0; i--) {
      const p = this.pool[i];
      p.life -= dt;

      if (p.life <= 0) {
        // Ömrü biten parçacığı havuzun sonundaki aktif parçacıkla yer değiştir (O(1) Pop)
        p.active = false;
        p.sprite.visible = false;
        this.activeCount--;

        if (i < this.activeCount) {
          const lastActive = this.pool[this.activeCount];
          // Veri kopyalama
          p.active = true;
          p.x = lastActive.x;
          p.y = lastActive.y;
          p.vx = lastActive.vx;
          p.vy = lastActive.vy;
          p.life = lastActive.life;
          p.maxLife = lastActive.maxLife;
          p.baseScale = lastActive.baseScale;
          p.color = lastActive.color;
          p.isCasing = lastActive.isCasing;

          p.sprite.visible = true;
          p.sprite.x = lastActive.sprite.x;
          p.sprite.y = lastActive.sprite.y;
          p.sprite.tint = lastActive.sprite.tint;
          p.sprite.scale.set(lastActive.sprite.scale.x);
          p.sprite.alpha = lastActive.sprite.alpha;

          lastActive.active = false;
          lastActive.sprite.visible = false;
        }
        continue;
      }

      // Fiziksel hareket ve sürtünme
      p.x += p.vx * dtNorm;
      p.y += p.vy * dtNorm;
      p.vx *= 0.94;
      p.vy *= 0.94;

      const progress = p.life / p.maxLife; // 1 -> 0
      p.sprite.x = p.x;
      p.sprite.y = p.y;
      p.sprite.alpha = Math.max(0, progress);
      p.sprite.scale.set(p.baseScale * progress);
      if (p.isCasing) {
        p.sprite.rotation += dt * 14.0;
      }
    }
  }

  // Renk Bazlı Batch Rendering & Tamsayı Koordinat (Anti-Aliasing Kapalı) ile Maksimum Performans
  draw(ctx, cullLeft = -Infinity, cullRight = Infinity, cullTop = -Infinity, cullBottom = Infinity) {
    if (!ctx || this.activeCount === 0) return;
    if (typeof ctx.save === 'function') ctx.save();

    // Dinamik FPS Bekçisi: Performans modunda lighter harmanlama iptal, sadece source-over
    ctx.globalCompositeOperation = (typeof window !== 'undefined' && window.autoPerformanceMode) ? 'source-over' : 'lighter';

    // Sıfır GC kova temizliği
    for (const bucket of this.batchBuckets.values()) {
      bucket.length = 0;
    }

    // 1. Partikülleri renklere göre grupla & Frustum Culling
    for (let i = 0; i < this.activeCount; i++) {
      const p = this.pool[i];
      if (p.x < cullLeft || p.x > cullRight || p.y < cullTop || p.y > cullBottom) continue;

      let colorKey = typeof p.color === 'string' ? p.color : '#' + p.color.toString(16).padStart(6, '0');
      let bucket = this.batchBuckets.get(colorKey);
      if (!bucket) {
        bucket = [];
        this.batchBuckets.set(colorKey, bucket);
      }
      bucket.push(p);
    }

    // 2. Renk Grubu Başına TEK beginPath() ve rect() ile Batch Çizim
    for (const [color, bucket] of this.batchBuckets.entries()) {
      const count = bucket.length;
      if (count === 0) continue;

      ctx.fillStyle = color;
      if (typeof ctx.beginPath === 'function') ctx.beginPath();
      for (let j = 0; j < count; j++) {
        const p = bucket[j];
        const alphaRatio = p.life / p.maxLife;
        const sz = Math.max(1, ((p.baseScale || 3) * alphaRatio * 1.8) | 0);
        const px = (p.x - (sz >> 1)) | 0;
        const py = (p.y - (sz >> 1)) | 0;
        if (typeof ctx.rect === 'function') ctx.rect(px, py, sz, sz);
      }
      if (typeof ctx.fill === 'function') ctx.fill();
    }

    if (typeof ctx.restore === 'function') ctx.restore();
  }

  destroy() {
    if (this.container) this.container.destroy({ children: true });
    this.pool = [];
    this.activeCount = 0;
  }
}


// ==================== src/systems/CollisionSystem.js ====================
/**
 * ZORTEX: CYBER SURVIVOR - ÇARPIŞMA VE ETKİLEŞİM SİSTEMİ (CollisionSystem.js)
 * 2.5D derinlik ve perspektif yarıçaplarına duyarlı çarpışma algılama motoru.
 */

class CollisionSystem {
  constructor() {
    this.hitstopTimer = 0;
  }

  triggerHitstop(duration = 0.05) {
    this.hitstopTimer = Math.max(this.hitstopTimer, duration);
  }

  update(dt, player, enemiesList, projectilesList, gemsList, scrapsList, particleSystem, assetLoader, onEnemyKilled) {
    // 1. Mermiler ile Düşmanlar Arası Çarpışma
    for (let pIdx = projectilesList.length - 1; pIdx >= 0; pIdx--) {
      const proj = projectilesList[pIdx];
      if (proj.isDead) continue;

      // Oyuncu mermileri sadece düşmanlara çarpar
      if (!proj.isEnemy) {
        for (let eIdx = enemiesList.length - 1; eIdx >= 0; eIdx--) {
          const enemy = enemiesList[eIdx];
          if (enemy.isDead || proj.hitSet.has(enemy)) continue;

          // 2.5D Dairesel Çarpışma Testi
          const dx = enemy.x - proj.x;
          const dy = enemy.y - proj.y;
          const hitRadius = (enemy.radius || 16) + (proj.radius || 4);

          if (dx * dx + dy * dy <= hitRadius * hitRadius) {
            proj.hitSet.add(enemy);

            // Geri tepme darbesi açısı
            const shotAngle = Math.atan2(proj.vy, proj.vx);
            const killed = enemy.hit(proj.damage, proj.isCrit, proj.knockbackPower, shotAngle);

            // Vuruş partikülleri ve sarsıntı
            if (particleSystem) {
              const partCount = proj.isCrit ? 16 : 6;
              particleSystem.emit(proj.x, proj.y, proj.color, partCount, 4, 2.5);
            }

            // Kritik vuruş veya ağır darbede Hitstop (Freeze Frame)
            if (proj.isCrit || enemy.type === 'heavy' || enemy.type === 'boss') {
              this.triggerHitstop(proj.isCrit ? 0.05 : 0.035);
            }

            if (killed) {
              if (onEnemyKilled) onEnemyKilled(enemy);
            }

            // Delme (Pierce) Kontrolü
            if (proj.pierce > 0) {
              proj.pierce--;
            } else {
              proj.isDead = true;
              break;
            }
          }
        }
      }
      // Düşman mermileri sadece oyuncuya çarpar
      else {
        const dx = player.x - proj.x;
        const dy = player.y - proj.y;
        const hitRadius = (player.radius || 18) + (proj.radius || 4);

        if (dx * dx + dy * dy <= hitRadius * hitRadius) {
          player.takeDamage(proj.damage, assetLoader);
          proj.isDead = true;
          if (particleSystem) {
            particleSystem.emit(player.x, player.y, '#ff0055', 12, 5, 2);
          }
        }
      }
    }

    // 2. Düşmanlar ile Oyuncu Gövde Teması (Kamikaze ve Çarpışma)
    for (let eIdx = enemiesList.length - 1; eIdx >= 0; eIdx--) {
      const enemy = enemiesList[eIdx];
      if (enemy.isDead) continue;

      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const hitRadius = (player.radius || 18) + (enemy.radius || 16);

      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        player.takeDamage(enemy.damage, assetLoader);
        enemy.hit(40, false, 12, Math.atan2(dy, dx) + Math.PI);

        if (enemy.detonated || enemy.type === 'kamikaze') {
          enemy.isDead = true;
          if (particleSystem) {
            particleSystem.emit(enemy.x, enemy.y, '#ff0055', 30, 7, 3);
          }
        }
      }
    }

    // 3. Ganimetlerin (XP Kristalleri & Hurda) Toplanması
    for (let gIdx = gemsList.length - 1; gIdx >= 0; gIdx--) {
      const gem = gemsList[gIdx];
      const dist = Math.hypot(player.x - gem.x, player.y - gem.y);
      if (dist < player.radius + gem.radius + 6) {
        gem.isDead = true;
        player.combo++;
        if (particleSystem) {
          particleSystem.emit(gem.x, gem.y, '#00ffcc', 4, 2, 1.5);
        }
      }
    }

    for (let sIdx = scrapsList.length - 1; sIdx >= 0; sIdx--) {
      const scrap = scrapsList[sIdx];
      const dist = Math.hypot(player.x - scrap.x, player.y - scrap.y);
      if (dist < player.radius + scrap.radius + 6) {
        scrap.isDead = true;
        if (particleSystem) {
          particleSystem.emit(scrap.x, scrap.y, '#ffd700', 6, 2, 1.5);
        }
      }
    }
  }
}


// ==================== src/systems/SaveSystem.js ====================
/**
 * ZORTEX: CYBER SURVIVOR - KAYIT VE META-PROGRESSION SİSTEMİ (SaveSystem.js)
 * Persistent JSON tabanlı profil, hangar yükseltmeleri ve başarımlar motoru.
 * Yerel Python /api/save uç noktası ve localStorage çift yönlü senkronizasyonu.
 */

class SaveSystem {
  constructor() {
    this.storageKey = 'zortex_cyber_save_v2';
    this.activeProfileName = 'Ajan Alpha';
    this.profiles = {
      'Ajan Alpha': this.createNewProfile('Ajan Alpha')
    };
    this.load();
  }

  createNewProfile(name) {
    return {
      name,
      createdAt: Date.now(),
      lastPlayed: Date.now(),
      highScore: 0,
      maxWave: 1,
      totalKills: 0,
      scrap: 150,
      hangarUpgrades: {
        speed: 0,
        hp: 0,
        shield: 0,
        crit: 0,
        magnet: 0
      },
      techNodes: [],
      achievements: []
    };
  }

  get activeProfile() {
    if (!this.profiles[this.activeProfileName]) {
      this.profiles[this.activeProfileName] = this.createNewProfile(this.activeProfileName);
    }
    return this.profiles[this.activeProfileName];
  }

  selectProfile(name) {
    if (!this.profiles[name]) {
      this.profiles[name] = this.createNewProfile(name);
    }
    this.activeProfileName = name;
    this.save();
  }

  // Hangar Yükseltmesi Satın Alma
  upgradeHangar(statKey, cost) {
    const p = this.activeProfile;
    if (p.scrap >= cost) {
      p.scrap -= cost;
      p.hangarUpgrades[statKey] = (p.hangarUpgrades[statKey] || 0) + 1;
      this.save();
      return true;
    }
    return false;
  }

  // Kaydetme İşlemi (Python API + localStorage)
  async save() {
    const payload = {
      activeProfileName: this.activeProfileName,
      profiles: this.profiles,
      version: '2.5.0',
      timestamp: Date.now()
    };

    // 1. Tarayıcı Yerel Belleğine Kaydet
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('localStorage save hatası:', e);
    }

    // 2. Python Masaüstü API'sine Atomik POST (/api/save)
    try {
      if (window.location.protocol.startsWith('http')) {
        await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
    } catch (err) {
      // Çevrimdışı modda sessizce devam et
    }
  }

  // Yükleme İşlemi
  async load() {
    // 1. Önce localStorage'dan oku
    try {
      const localData = localStorage.getItem(this.storageKey);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed && parsed.profiles) {
          this.profiles = parsed.profiles;
          if (parsed.activeProfileName) this.activeProfileName = parsed.activeProfileName;
        }
      }
    } catch (e) {
      console.warn('localStorage load hatası:', e);
    }

    // 2. Python Backend'den (/api/save) daha güncel veri varsa birleştir
    try {
      if (window.location.protocol.startsWith('http')) {
        const resp = await fetch('/api/save');
        if (resp.ok) {
          const res = await resp.json();
          if (res.status === 'ok' && res.data && res.data.profiles) {
            this.profiles = res.data.profiles;
            if (res.data.activeProfileName) this.activeProfileName = res.data.activeProfileName;
          }
        }
      }
    } catch (err) {
      // Çevrimdışı modda fallback
    }
  }
}


// ==================== src/systems/WaveSystem.js ====================
/**
 * ZORTEX: CYBER SURVIVOR - DALGA VE DÜŞMAN DOĞMA MOTORU (WaveSystem.js)
 * Taktiksel formasyonlar, seçkin düşman affixleri ve Boss aşamaları yönetimi.
 */




class WaveSystem {
  constructor(textures, container) {
    this.textures = textures;
    this.container = container;
    this.wave = 1;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.isBossActive = false;
    this.enemiesRemainingInWave = 16;
    this.waveCompleted = false;
  }

  reset() {
    this.wave = 1;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.isBossActive = false;
    this.enemiesRemainingInWave = 16;
    this.waveCompleted = false;
  }

  startNextWave() {
    this.wave++;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.waveCompleted = false;
    this.enemiesRemainingInWave = 12 + this.wave * 4;
    console.log(`🚀 Dalga ${this.wave} Başladı! Hedef Düşman: ${this.enemiesRemainingInWave}`);
  }

  // Ufuk çizgisinde (Y = 10..40) 2.5D derinlikte düşman üretimi
  spawnEnemy(type = 'scout', x = null, y = null) {
    const W = Settings.CANVAS_WIDTH;
    const spawnX = (x !== null) ? x : 80 + Math.random() * (W - 160);
    const spawnY = (y !== null) ? y : -20 - Math.random() * 40;

    let enemy = null;
    if (type === 'swarm') {
      enemy = new SwarmDroneEnemy(spawnX, spawnY, this.textures, this.container);
    } else if (type === 'kamikaze') {
      enemy = new KamikazeEnemy(spawnX, spawnY, this.textures, this.container);
    } else if (type === 'phantom') {
      enemy = new PhantomEnemy(spawnX, spawnY, this.textures, this.container);
    } else if (type === 'heavy') {
      enemy = new AegisHeavyEnemy(spawnX, spawnY, this.textures, this.container);
    } else if (type === 'boss') {
      enemy = new BossEnemy(W / 2, -60, this.textures, this.container);
      this.isBossActive = true;
    } else {
      enemy = new Enemy(spawnX, spawnY, type, this.textures, this.container);
    }

    // Seçkin (Elite) Düşman Ataması (Dalga 2'den itibaren %22 ihtimal)
    if (this.wave >= 2 && type !== 'boss' && Math.random() < 0.22) {
      enemy.isElite = true;
      enemy.hp = Math.round(enemy.hp * 2.2);
      enemy.maxHp = enemy.hp;
      const affixes = ['volatile', 'frostbite', 'tempest', 'aegis'];
      enemy.affix = affixes[Math.floor(Math.random() * affixes.length)];
      if (enemy.affix === 'aegis') enemy.aegisShield = 40;
    }

    return enemy;
  }

  // Formasyon Doğma Motoru (V-Formasyonu veya Hat Akını)
  spawnWaveGroup(targetList = null) {
    const enemies = [];
    const W = Settings.CANVAS_WIDTH;
    const currentWave = (typeof window !== 'undefined' && typeof window.wave === 'number') ? window.wave : this.wave;

    // Boss Dalgası (Her 5 dalgada bir)
    if (currentWave % 5 === 0 && !this.isBossActive) {
      enemies.push(this.spawnEnemy('boss'));
    } else {
      const roll = Math.random();
      if (roll < 0.35) {
        // V-Formasyonu Swarm Filosu (5 adet)
        const centerX = 150 + Math.random() * (W - 300);
        for (let i = 0; i < 5; i++) {
          const ox = (i - 2) * 45;
          const oy = -30 - Math.abs(i - 2) * 25;
          enemies.push(this.spawnEnemy('swarm', centerX + ox, oy));
        }
      } else if (roll < 0.65) {
        // Çifte Phantom ve Kamikaze Sızması
        enemies.push(this.spawnEnemy('phantom', W * 0.25, -25));
        enemies.push(this.spawnEnemy('phantom', W * 0.75, -25));
        enemies.push(this.spawnEnemy('kamikaze', W * 0.5, -45));
      } else {
        // Ağır Kruvazör ve Scout Eskortları
        enemies.push(this.spawnEnemy('heavy', W * 0.5, -35));
        enemies.push(this.spawnEnemy('scout', W * 0.4, -60));
        enemies.push(this.spawnEnemy('scout', W * 0.6, -60));
      }
    }

    const list = targetList || (typeof window !== 'undefined' && Array.isArray(window.enemies) ? window.enemies : null);
    if (list) {
      for (const e of enemies) {
        if (!list.includes(e)) list.push(e);
      }
    }

    return enemies;
  }

  update(dt, enemiesList) {
    this.waveTimer += dt;
    this.spawnTimer -= dt;

    // Boss dalgası kontrolü
    if (this.wave % 5 === 0 && !this.isBossActive && enemiesList.length === 0) {
      enemiesList.push(this.spawnEnemy('boss'));
      return;
    }

    // Dalga Tamamlanma Kontrolü
    if (this.enemiesRemainingInWave <= 0 && enemiesList.length === 0) {
      if (!this.waveCompleted) {
        this.waveCompleted = true;
        this.isBossActive = false;
        setTimeout(() => this.startNextWave(), 2500);
      }
      return;
    }

    // Düzenli periyotlarla düşman formasyonu doğur
    if (this.spawnTimer <= 0 && this.enemiesRemainingInWave > 0 && enemiesList.length < 24) {
      const group = this.spawnWaveGroup();
      for (const e of group) {
        enemiesList.push(e);
        this.enemiesRemainingInWave--;
      }
      this.spawnTimer = Math.max(1.4, 3.8 - this.wave * 0.25);
    }
  }
}


// ==================== src/core/Game.js ====================
/**
 * ZORTEX: CYBER SURVIVOR - ANA OYUN MOTORU (Game.js)
 * PixiJS v8 tabanlı 2.5D retro uzay savaşı çekirdeği.
 * Sahne hiyerarşisi, 144Hz ticker, oyun durumları ve HUD senkronizasyonunu yönetir.
 */













class Game {
  constructor() {
    this.PIXI = window.PIXI;
    this.app = null;
    this.gameState = 'PROFILE'; // PROFILE, MENU, PLAYING, PAUSED, UPGRADE, GAMEOVER, HANGAR
    
    // Alt Sistemler
    this.assetLoader = null;
    this.inputManager = null;
    this.parallaxSpace = null;
    this.waveSystem = null;
    this.collisionSystem = null;
    this.saveSystem = null;
    this.particleSystem = null;

    // Varlık Listeleri
    this.player = null;
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.gems = [];
    this.scraps = [];

    // Görsel Efektler ve Game Juice
    this.screenShake = 0;
    this.hitstopTimer = 0;
    this.score = 0;
    this.kills = 0;
    this.fpsSmoothed = 144;
    this.fpsTimer = 0;
    this.frameCount = 0;
  }

  async init(containerElement = null) {
    if (!this.PIXI) {
      throw new Error('PixiJS kütüphanesi yüklenemedi!');
    }

    const container = containerElement || document.getElementById('canvas-container') || document.getElementById('game-container') || document.body;

    // 1. PixiJS v8 Uygulama Başlatma
    this.app = new this.PIXI.Application();
    await this.app.init({
      width: Settings.CANVAS_WIDTH,
      height: Settings.CANVAS_HEIGHT,
      preference: 'webgl',
      background: Settings.BACKGROUND_COLOR,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: false
    });

    // Canvas elementini DOM'a bağla
    this.app.canvas.id = 'pixiCanvas';
    this.app.canvas.style.position = 'absolute';
    this.app.canvas.style.top = '0';
    this.app.canvas.style.left = '0';
    this.app.canvas.style.width = '100%';
    this.app.canvas.style.height = '100%';
    this.app.canvas.style.zIndex = '1';

    // Var olan Canvas 2D gameCanvas'ı gizle
    const existingGameCanvas = document.getElementById('gameCanvas');
    if (existingGameCanvas) {
      existingGameCanvas.style.display = 'none';
    }

    // HUD Canvas'ın altına yerleştir (z-index: 1 < z-index: 2)
    const existingHudCanvas = document.getElementById('hudCanvas');
    if (existingHudCanvas && existingHudCanvas.parentNode === container) {
      existingHudCanvas.width = Settings.CANVAS_WIDTH;
      existingHudCanvas.height = Settings.CANVAS_HEIGHT;
      container.insertBefore(this.app.canvas, existingHudCanvas);
    } else {
      container.appendChild(this.app.canvas);
    }

    // 2. Sahne Konteyner Hiyerarşisi
    this.rootContainer = new this.PIXI.Container();
    this.app.stage.addChild(this.rootContainer);

    this.parallaxContainer = new this.PIXI.Container();
    this.pickupsContainer = new this.PIXI.Container();
    this.actorsContainer = new this.PIXI.Container();
    this.projectilesContainer = new this.PIXI.Container();
    this.particlesContainer = new this.PIXI.Container();

    this.rootContainer.addChild(this.parallaxContainer);
    this.rootContainer.addChild(this.pickupsContainer);
    this.rootContainer.addChild(this.actorsContainer);
    this.rootContainer.addChild(this.projectilesContainer);
    this.rootContainer.addChild(this.particlesContainer);

    // 3. Alt Sistemleri Başlat
    this.assetLoader = new AssetLoader(this.app, this.PIXI);
    await this.assetLoader.init();

    this.inputManager = new InputManager();
    this.saveSystem = new SaveSystem();
    this.parallaxSpace = new ParallaxSpace(this.app, this.PIXI, this.parallaxContainer);
    this.particleSystem = new ParticleSystem(this.app, this.PIXI, this.assetLoader.textures, this.particlesContainer);
    this.waveSystem = new WaveSystem(this.assetLoader.textures, this.actorsContainer);
    this.collisionSystem = new CollisionSystem();

    // 4. CRT Shader Filtresini Sahneye Ekle
    this.rootContainer.filterArea = this.app.screen;
    if (this.assetLoader.crtFilter) {
      this.rootContainer.filters = Settings.CRT.DEFAULT_ENABLED ? [this.assetLoader.crtFilter] : [];
    }

    // 5. Oyuncuyu Başlat
    this.player = new Player(
      Settings.CANVAS_WIDTH / 2,
      Settings.BASELINE_Y || 620,
      'interceptor',
      this.assetLoader.textures,
      this.actorsContainer
    );

    // 6. 144Hz Ticker Bağlantısı (Delta Time)
    this.app.ticker.add((ticker) => {
      const dt = ticker.deltaTime / 60;
      this.update(dt);
    });

    // 7. Geriye Dönük Uyumluluk ve Otomasyon Testleri için Window Bağlantıları
    this.exportGlobals();

    console.log('🚀 ZORTEX PixiJS v8 2.5D Oyun Motoru Başarıyla Kuruldu!');
  }

  // Test suiteleri ve DOM arayüzü ile tam uyumluluk
  exportGlobals() {
    window.game = this;
    window.player = this.player;
    window.bullets = this.bullets;
    window.enemyBullets = this.enemyBullets;
    window.enemies = this.enemies;
    window.gems = this.gems;
    window.scraps = this.scraps;
    window.particles = this.particleSystem;
    window.waveManager = this.waveSystem;

    // WeaponManager entegrasyonu: Mevcut WeaponManager varsa onu koru ve senkronize et
    if (window.weaponManager && typeof window.weaponManager.selectWeaponIndex === 'function') {
      const wm = window.weaponManager;
      const origSelectWeapon = wm.selectWeapon.bind(wm);
      wm.selectWeapon = (id) => {
        origSelectWeapon(id);
        const idx = wm.weaponList ? wm.weaponList.indexOf(id) : ['blaster', 'spread', 'plasma_beam', 'railgun'].indexOf(id);
        if (idx !== -1 && this.player && typeof this.player.setWeapon === 'function') {
          this.player.setWeapon(idx, this.assetLoader);
        }
      };
      if (this.player) {
        this.player.activeWeaponId = wm.activeWeaponId;
        this.player.activeWeaponIndex = wm.activeWeaponIndex;
      }
    } else {
      const weaponList = ['blaster', 'spread', 'plasma_beam', 'railgun'];
      const wm = {
        weaponList,
        weapons: {
          blaster: { id: 'blaster', name: 'Blaster', fire: (p) => { if (typeof screenShake !== 'undefined') try { screenShake = Math.max(screenShake, 1.2); } catch (_) {} window.screenShake = Math.max(window.screenShake || 0, 1.2); } },
          spread: { id: 'spread', name: 'Spread', fire: (p) => { if (typeof screenShake !== 'undefined') try { screenShake = Math.max(screenShake, 5.5); } catch (_) {} window.screenShake = Math.max(window.screenShake || 0, 5.5); } },
          plasma_beam: { id: 'plasma_beam', name: 'Plasma', fire: (p) => { if (typeof screenShake !== 'undefined') try { screenShake = Math.max(screenShake, 1.4); } catch (_) {} window.screenShake = Math.max(window.screenShake || 0, 1.4); } },
          railgun: { id: 'railgun', name: 'Railgun', fire: (p, opt = {}) => {
            const charge = opt.chargeLevel !== undefined ? opt.chargeLevel : 1.0;
            if (typeof screenShake !== 'undefined') try { screenShake = Math.max(screenShake, 15 * charge); } catch (_) {}
            window.screenShake = Math.max(window.screenShake || 0, 15 * charge);
          } }
        },
        get activeWeaponId() { return window.player ? window.player.activeWeaponId : 'blaster'; },
        get activeWeaponIndex() {
          const id = window.player ? window.player.activeWeaponId : 'blaster';
          return Math.max(0, weaponList.indexOf(id));
        },
        selectWeaponIndex: (idx) => {
          if (typeof idx !== 'number' || isNaN(idx)) return;
          const count = weaponList.length;
          const clamped = ((idx % count) + count) % count;
          wm.selectWeapon(weaponList[clamped]);
        },
        selectWeapon: (id) => {
          const idx = weaponList.indexOf(id);
          if (idx !== -1 && window.player) {
            window.player.setWeapon(idx, window.game ? window.game.assetLoader : null);
          }
          if (window.audio && typeof window.audio.playWeaponSwitch === 'function') {
            window.audio.playWeaponSwitch();
          }
          wm.syncHUD();
        },
        cycleWeapon: (delta = 1) => {
          const cur = wm.activeWeaponIndex;
          wm.selectWeaponIndex(cur + delta);
        },
        fire: (player, options = {}) => {
          const cur = wm.weapons[wm.activeWeaponId] || wm.weapons.blaster;
          cur.fire(player, options);
          if (player && typeof player.shoot === 'function') {
            player.shoot(window.bullets, window.game ? window.game.assetLoader : null, window.particles);
          }
        },
        syncHUD: () => {
          if (typeof document === 'undefined') return;
          const curId = wm.activeWeaponId;
          const slots = document.querySelectorAll('.weapon-hud-slot, .hud-weapon-slot');
          slots.forEach(slot => {
            const wId = slot.getAttribute('data-weapon');
            slot.classList.toggle('active', wId === curId);
          });
        }
      };
      window.weaponManager = wm;
    }

    const origStartGame = (typeof window.startGame === 'function' && window.startGame !== this._boundStartGame) ? window.startGame : null;
    this._boundStartGame = () => {
      this.startGame();
      if (origStartGame) origStartGame();
    };
    window.startGame = this._boundStartGame;

    const origSelectProfile = (typeof window.selectProfile === 'function' && window.selectProfile !== this._boundSelectProfile) ? window.selectProfile : null;
    this._boundSelectProfile = (name) => {
      this.selectProfile(name);
      if (origSelectProfile) origSelectProfile(name);
    };
    window.selectProfile = this._boundSelectProfile;

    const origToggleCrt = (typeof window.toggleCrt === 'function' && window.toggleCrt !== this._boundToggleCrt) ? window.toggleCrt : null;
    this._boundToggleCrt = () => {
      const res = this.toggleCrt();
      if (origToggleCrt) origToggleCrt();
      return res;
    };
    window.toggleCrt = this._boundToggleCrt;

    const origTriggerHitStop = (typeof window.triggerHitStop === 'function' && window.triggerHitStop !== this._boundTriggerHitStop) ? window.triggerHitStop : null;
    this._boundTriggerHitStop = (dur = 0.05) => {
      this.triggerHitstop(dur);
      if (origTriggerHitStop) origTriggerHitStop(dur);
      if (typeof hitStopTimer !== 'undefined') {
        try { hitStopTimer = Math.max(hitStopTimer, dur); } catch (_) {}
      }
      window.hitStopTimer = this.hitstopTimer;
    };
    window.triggerHitStop = this._boundTriggerHitStop;

    const origTriggerScreenShake = (typeof window.triggerScreenShake === 'function' && window.triggerScreenShake !== this._boundTriggerScreenShake) ? window.triggerScreenShake : null;
    this._boundTriggerScreenShake = (intensity = 8) => {
      this.triggerScreenShake(intensity);
      if (origTriggerScreenShake) origTriggerScreenShake(intensity);
      if (typeof screenShake !== 'undefined') {
        try { screenShake = Math.max(screenShake, intensity); } catch (_) {}
      }
      window.screenShake = this.screenShake;
    };
    window.triggerScreenShake = this._boundTriggerScreenShake;

    window.gameState = this.gameState;
  }

  selectProfile(name) {
    this.saveSystem.selectProfile(name);
    if (typeof window !== 'undefined') {
      window.activeProfileName = name;
      if (typeof window.allProfiles !== 'undefined' && !window.allProfiles[name] && typeof window.createDefaultProfileData === 'function') {
        window.allProfiles[name] = window.createDefaultProfileData(name);
      }
      if (typeof window.updateActiveProfileUI === 'function') window.updateActiveProfileUI();
    }
    this.gameState = 'MENU';
    window.gameState = 'MENU';
  }

  startGame() {
    if (this.assetLoader) this.assetLoader.resumeAudio();
    this.gameState = 'PLAYING';
    window.gameState = 'PLAYING';
    this.score = 0;
    this.kills = 0;
    this.enemies.length = 0;
    this.bullets.length = 0;
    this.enemyBullets.length = 0;
    this.gems.length = 0;
    this.scraps.length = 0;
    this.waveSystem.reset();

    if (this.player) {
      this.player.initStats();
      this.player.x = Settings.CANVAS_WIDTH / 2;
      this.player.y = Settings.BASELINE_Y || 620;
      this.player.isDead = false;
    }

    // DOM kaplamalarını gizle
    ['profileOverlay', 'menuOverlay', 'gameOverOverlay', 'upgradeOverlay', 'pauseOverlay', 'hangarOverlay', 'techTreeOverlay', 'achievementsOverlay', 'settingsOverlay']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });

    // İlk dalga düşman grubunu hemen sahneye ekle
    const initialGroup = this.waveSystem.spawnWaveGroup(this.enemies);
    for (const e of initialGroup) {
      if (!this.enemies.includes(e)) this.enemies.push(e);
      this.waveSystem.enemiesRemainingInWave--;
    }

    // Silah HUD barını göster
    const wBar = document.getElementById('weaponHudBar');
    if (wBar) wBar.classList.remove('hidden');

    this.updateHUD();
  }

  triggerHitstop(duration = 0.05) {
    this.hitstopTimer = Math.max(this.hitstopTimer, duration);
    if (typeof hitStopTimer !== 'undefined') {
      try { hitStopTimer = Math.max(hitStopTimer, duration); } catch (_) {}
    }
    if (typeof window !== 'undefined') window.hitStopTimer = this.hitstopTimer;
  }

  triggerScreenShake(intensity = 8) {
    this.screenShake = Math.max(this.screenShake, intensity);
    if (typeof screenShake !== 'undefined') {
      try { screenShake = Math.max(screenShake, intensity); } catch (_) {}
    }
    if (typeof window !== 'undefined') window.screenShake = this.screenShake;
  }

  toggleCrt() {
    if (!this.assetLoader.crtFilter) return;
    this.rootContainer.filterArea = this.app.screen;
    const current = this.rootContainer.filters && this.rootContainer.filters.length > 0;
    this.rootContainer.filters = current ? [] : [this.assetLoader.crtFilter];
    return !current;
  }

  // Ana Güncelleme Döngüsü (Her karede)
  update(dt) {
    // FPS Hesaplama
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fpsSmoothed = Math.round((this.frameCount / this.fpsTimer));
      this.frameCount = 0;
      this.fpsTimer = 0;
      window.fpsSmoothed = this.fpsSmoothed;
    }

    // CRT Shader Zamanlayıcısı
    this.assetLoader.updateCrt(dt);

    // Girdi Güncellemesi
    this.inputManager.update();

    // Pause kontrolü
    if (this.inputManager.consumePause()) {
      if (this.gameState === 'PLAYING') this.gameState = 'PAUSED';
      else if (this.gameState === 'PAUSED') this.gameState = 'PLAYING';
      window.gameState = this.gameState;
    }

    if (this.gameState !== 'PLAYING') {
      // Menüde bile parallaks arka planı canlı tutulur
      this.parallaxSpace.update(dt * 0.4, 0, false);
      return;
    }

    // Hitstop / Freeze Frame Kontrolü
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return; // Fizik ve hareketleri anlık dondur, vuruş ağırlığını hissettir
    }

    // 1. Parallaks Uzay Motoru
    this.parallaxSpace.update(dt, this.player.vx, this.player.isDashing);

    // 2. Oyuncu Güncellemesi
    this.player.update(dt, this.inputManager, this.bullets, this.assetLoader, this.particleSystem);

    if (this.player.isDead) {
      this.gameState = 'GAMEOVER';
      window.gameState = 'GAMEOVER';
      this.assetLoader.playExplosion(2.2);
      this.triggerScreenShake(20);
      return;
    }

    // 3. Dalga ve Düşman Doğma Motoru
    this.waveSystem.update(dt, this.enemies);

    // 4. Düşmanların Güncellenmesi
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, this.player);

      if (enemy.isDead) {
        enemy.destroy();
        this.enemies.splice(i, 1);
      }
    }

    // 5. Mermilerin Güncellenmesi
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.update(dt);
      if (b.isDead) {
        b.destroy();
        this.bullets.splice(i, 1);
      }
    }

    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.update(dt);
      if (eb.isDead) {
        eb.destroy();
        this.enemyBullets.splice(i, 1);
      }
    }

    // 6. Çarpışma Sistemi (Mermi-Düşman, Düşman-Oyuncu, Ganimet)
    this.collisionSystem.update(
      dt,
      this.player,
      this.enemies,
      this.bullets,
      this.gems,
      this.scraps,
      this.particleSystem,
      this.assetLoader,
      (killedEnemy) => {
        this.kills++;
        this.score += Math.round(killedEnemy.xpValue * 10 * (1 + this.player.combo * 0.1));
        this.assetLoader.playExplosion(killedEnemy.type === 'boss' ? 2.5 : 1.0);
        this.triggerScreenShake(killedEnemy.type === 'boss' ? 18 : 6);
      }
    );

    // 7. Parçacık Sistemi Güncellemesi
    this.particleSystem.update(dt);

    // 8. Screen Shake (Ekran Sarsıntısı) Damping
    if (this.screenShake > 0) {
      const sx = (Math.random() * 2 - 1) * this.screenShake;
      const sy = (Math.random() * 2 - 1) * this.screenShake;
      this.rootContainer.x = sx;
      this.rootContainer.y = sy;
      this.screenShake *= Math.pow(0.88, dt * 60);
      if (this.screenShake < 0.2) {
        this.screenShake = 0;
        this.rootContainer.x = 0;
        this.rootContainer.y = 0;
      }
    }

    // 9. HUD ve Arayüz Senkronizasyonu
    this.updateHUD();
  }

  // Neon Arayüz Slotları, hudCanvas ve Durum Göstergesi
  updateHUD() {
    // 1. Silah HUD Barı Senkronizasyonu
    const wBar = document.getElementById('weaponHudBar');
    if (wBar) {
      wBar.classList.toggle('hidden', this.gameState !== 'PLAYING');
    }

    const slots = document.querySelectorAll('.weapon-hud-slot, .hud-weapon-slot');
    if (slots.length > 0 && this.player) {
      slots.forEach(slot => {
        const wId = slot.getAttribute('data-weapon');
        slot.classList.toggle('active', wId === this.player.activeWeaponId);
      });
    }

    // 2. hudCanvas Katmanına Retro Arcade HUD Çizimi (HP, Kalkan, Seviye, Skor, Kombo)
    const hudCanvas = document.getElementById('hudCanvas');
    if (hudCanvas) {
      const ctx = hudCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
        if (this.gameState === 'PLAYING') {
          window.score = this.score;
          window.kills = this.kills;
          window.wave = this.waveSystem ? this.waveSystem.wave : 1;
          window.player = this.player;
          window.gameState = this.gameState;

          if (typeof window.drawHUD === 'function') {
            window.drawHUD(ctx);
          }
        }
      }
    }

    // 3. Varsa HTML HUD Elementlerini Güncelle
    const hpBar = document.getElementById('hudHpFill');
    if (hpBar && this.player) {
      const pct = Math.max(0, (this.player.health / this.player.maxHealth) * 100);
      hpBar.style.width = `${pct}%`;
    }

    const shieldBar = document.getElementById('hudShieldFill');
    if (shieldBar && this.player) {
      const pct = Math.max(0, (this.player.shield / this.player.maxShield) * 100);
      shieldBar.style.width = `${pct}%`;
    }

    const scoreElem = document.getElementById('hudScoreText');
    if (scoreElem) scoreElem.innerText = `SKOR: ${this.score}`;

    const fpsElem = document.getElementById('hudFpsText');
    if (fpsElem) fpsElem.innerText = `⚡ ${this.fpsSmoothed} FPS`;
  }
}

// Sayfa yüklendiğinde otomatik başlat
window.addEventListener('DOMContentLoaded', async () => {
  const game = new Game();
  await game.init(document.getElementById('canvas-container') || document.getElementById('game-container') || document.body);
});


  // Expose core classes and instances to window
  if (typeof window !== 'undefined') {
    window.Settings = Settings;
    window.Entity = Entity;
    window.Projectile = Projectile;
    window.Bullet = Projectile;
    window.EnemyBase = EnemyBase;
    window.Enemy = Enemy;
    window.SwarmDroneEnemy = SwarmDroneEnemy;
    window.KamikazeEnemy = KamikazeEnemy;
    window.PhantomEnemy = PhantomEnemy;
    window.AegisHeavyEnemy = AegisHeavyEnemy;
    window.BossEnemy = BossEnemy;
    window.Player = Player;
    window.AssetLoader = AssetLoader;
    window.InputManager = InputManager;
    window.ParallaxSpace = ParallaxSpace;
    window.ParticleSystem = ParticleSystem;
    window.CollisionSystem = CollisionSystem;
    window.SaveSystem = SaveSystem;
    window.WaveSystem = WaveSystem;
    window.Game = Game;
  }
})();
