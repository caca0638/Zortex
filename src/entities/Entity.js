/**
 * ZORTEX: CYBER SURVIVOR - TEMEL VARLIK SINIFI (Entity.js)
 * Tüm hareketli nesneler (Player, Enemy, Projectile, Gem, Scrap) için ortak temel sınıf.
 * 2.5D retro Atari perspektifi, Z derinlik ölçeklemesi ve non-enumerable Sprite yönetimi içerir.
 */

import { Settings } from '../config/settings.js';

export class Entity {
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
