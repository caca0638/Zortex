/**
 * ZORTEX: CYBER SURVIVOR - MERMİ VE LAZER YÖNETİMİ (Projectile.js)
 * Tüm mermi tiplerinin (Blaster, Spread, Plasma, Railgun, Düşman Mermisi) ortak yönetim sınıfı.
 * 2.5D Derinlik İllüzyonu: Yukarı doğru ilerledikçe küçülerek uzaklaşma hissi verir.
 */

import { Entity } from './Entity.js';
import { Settings } from '../config/settings.js';

export class Projectile extends Entity {
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
