/**
 * ZORTEX: CYBER SURVIVOR - PARÇACIK VE EFEKT SİSTEMİ (ParticleSystem.js)
 * PIXI.ParticleContainer tabanlı, 10.000 parçacıklı, sıfır-GC havuzlama (Pooling) mimarisi.
 * Tek bir GPU Draw Call ile tüm patlama, lazer izi ve kovan efektlerini işler.
 */

import { Settings } from '../config/settings.js';

export class ParticleSystem {
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
