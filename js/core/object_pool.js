/**
 * ============================================================================
 * ZORTEX: CYBER SURVIVOR — OBJECT POOLING CORE (SIFIR-TAHSİS NESNE HAVUZU)
 * File: js/core/object_pool.js
 * 
 * Mimari Özellikler:
 *  1. Garbage Collection (GC) Koruması (144Hz Kesintisiz 6.94ms Kare Bütçesi)
 *  2. Genel Amaçlı Tipik Nesne Havuzu (Generic ObjectPool<T>)
 *  3. PixiJS v8 Optimize Edilmiş Sahne Havuzu (PixiSpritePool)
 *  4. Sıfır Sahne Ağacı Maliyeti (addChild / removeChild yerine visible toggle)
 *  5. Merkezi Havuz Yöneticisi & GC Tasarruf Metrikleri (PoolManager)
 * ============================================================================
 */
(function() {
  'use strict';

  /**
   * 1. GENEL AMAÇLI SIFIR-TAHSİS NESNE HAVUZU
   */
  class ObjectPool {
    /**
     * @param {Object} options
     * @param {Function} options.factory Yeni nesne üretici fonksiyon
     * @param {Function} [options.reset] Havuzdan alınırken veya dönerken sıfırlayıcı
     * @param {number} [options.initialSize=50] Başlangıçta önceden tahsis edilen miktar
     * @param {number} [options.maxSize=1500] Azami tavan kapasite (bellek sızıntısı önleyici)
     */
    constructor(options = {}) {
      if (typeof options.factory !== 'function') {
        throw new Error('[ObjectPool] factory fonksiyonu zorunludur.');
      }
      this.factory = options.factory;
      this.reset = options.reset || null;
      this.maxSize = options.maxSize || 2000;

      // Serbest ve aktif nesne listeleri
      this.freeList = [];
      this.activeSet = new Set();

      // Performans ve GC Metrikleri
      this.allocationsCount = 0;
      this.recyclesCount = 0;

      // Başlangıç rezervasyonu
      const initSize = options.initialSize || 30;
      this.preallocate(initSize);
    }

    /**
     * Önceden nesne tahsis ederek çalışma anında Garbage Collection'ı önler
     */
    preallocate(count) {
      const target = Math.min(this.maxSize, this.freeList.length + count);
      while (this.freeList.length < target) {
        const item = this.factory();
        item.__poolActive = false;
        this.freeList.push(item);
        this.allocationsCount++;
      }
    }

    /**
     * Havuzdan hazır bir nesne alır veya gerekirse yenisini üretir
     * @param {...any} args reset fonksiyonuna iletilecek argümanlar
     * @returns {any}
     */
    acquire(...args) {
      let item = null;

      if (this.freeList.length > 0) {
        item = this.freeList.pop();
        this.recyclesCount++;
      } else if (this.activeSet.size < this.maxSize) {
        item = this.factory();
        this.allocationsCount++;
      } else {
        // Tavan aşıldıysa en eski aktif nesneyi geri dönüştür
        item = this.activeSet.values().next().value;
        this.activeSet.delete(item);
        this.recyclesCount++;
      }

      item.__poolActive = true;
      this.activeSet.add(item);

      if (typeof this.reset === 'function') {
        this.reset(item, ...args);
      } else if (typeof item.reset === 'function') {
        item.reset(...args);
      }

      return item;
    }

    /**
     * Kullanımı biten nesneyi havuza geri verir
     * @param {any} item
     */
    release(item) {
      if (!item || !item.__poolActive) return;

      item.__poolActive = false;
      this.activeSet.delete(item);

      if (this.freeList.length < this.maxSize) {
        this.freeList.push(item);
      }
    }

    /**
     * Tüm aktif nesneleri havuza geri çeker (Dalga sonu veya yeniden başlatma)
     */
    releaseAll() {
      this.activeSet.forEach(item => {
        item.__poolActive = false;
        if (this.freeList.length < this.maxSize) {
          this.freeList.push(item);
        }
      });
      this.activeSet.clear();
    }

    /**
     * Havuz durumunu raporlar
     */
    getStats() {
      return {
        active: this.activeSet.size,
        free: this.freeList.length,
        totalAllocated: this.allocationsCount,
        recycles: this.recyclesCount
      };
    }
  }

  /**
   * 2. PIXIJS V8 OPTİMİZE EDİLMİŞ SPRITE HAVUZU
   * Sahne ağacına (Scene Tree) ekleme/çıkarma yapmadan yalnızca 'visible'
   * ve doku değiştirerek 144Hz'de sıfır GPU yükü ve sıfır GC ile çalışır.
   */
  class PixiSpritePool {
    /**
     * @param {PIXI.Container} parentContainer Sprite'ların barınacağı görsel katman
     * @param {Object} options
     * @param {PIXI.Texture} [options.defaultTexture] Varsayılan doku
     * @param {number} [options.initialSize=60]
     * @param {number} [options.maxSize=1200]
     */
    constructor(parentContainer, options = {}) {
      this.parentContainer = parentContainer;
      this.defaultTexture = options.defaultTexture || (typeof PIXI !== 'undefined' ? PIXI.Texture.WHITE : null);
      this.maxSize = options.maxSize || 1200;

      this.freeList = [];
      this.activeSet = new Set();

      const initCount = options.initialSize || 40;
      this.preallocate(initCount);
    }

    preallocate(count) {
      if (typeof PIXI === 'undefined' || !this.parentContainer) return;

      const target = Math.min(this.maxSize, this.freeList.length + count);
      while (this.freeList.length < target) {
        const sprite = new PIXI.Sprite(this.defaultTexture);
        sprite.anchor.set(0.5);
        sprite.visible = false;
        sprite.renderable = false; // Görünmezken GPU rasterize yükünü de sıfırla
        sprite.__poolActive = false;

        this.parentContainer.addChild(sprite);
        this.freeList.push(sprite);
      }
    }

    /**
     * Sahneye hazır, görünür bir sprite tahsis eder
     * @param {PIXI.Texture} texture Atanacak doku
     * @param {number} x
     * @param {number} y
     * @param {number} [rotation=0]
     * @param {number} [scale=1.0]
     * @param {number} [tint=0xffffff]
     * @returns {PIXI.Sprite}
     */
    acquire(texture, x, y, rotation = 0, scale = 1.0, tint = 0xffffff) {
      let sprite = null;

      if (this.freeList.length > 0) {
        sprite = this.freeList.pop();
      } else if (this.activeSet.size < this.maxSize && typeof PIXI !== 'undefined') {
        sprite = new PIXI.Sprite(texture || this.defaultTexture);
        sprite.anchor.set(0.5);
        if (this.parentContainer) this.parentContainer.addChild(sprite);
      } else {
        sprite = this.activeSet.values().next().value;
        this.activeSet.delete(sprite);
      }

      if (texture) sprite.texture = texture;
      sprite.x = x;
      sprite.y = y;
      sprite.rotation = rotation;
      sprite.scale.set(scale);
      sprite.tint = tint;
      sprite.alpha = 1.0;
      sprite.visible = true;
      sprite.renderable = true;
      sprite.__poolActive = true;

      this.activeSet.add(sprite);
      return sprite;
    }

    /**
     * Sprite'ı gizleyerek havuza iade eder (GPU ve Sahne Ağacı maliyeti: 0)
     * @param {PIXI.Sprite} sprite
     */
    release(sprite) {
      if (!sprite || !sprite.__poolActive) return;

      sprite.__poolActive = false;
      sprite.visible = false;
      sprite.renderable = false;
      this.activeSet.delete(sprite);

      if (this.freeList.length < this.maxSize) {
        this.freeList.push(sprite);
      }
    }

    /**
     * Tüm aktif sprite'ları gizler ve havuza döndürür
     */
    releaseAll() {
      this.activeSet.forEach(sprite => {
        sprite.__poolActive = false;
        sprite.visible = false;
        sprite.renderable = false;
        if (this.freeList.length < this.maxSize) {
          this.freeList.push(sprite);
        }
      });
      this.activeSet.clear();
    }
  }

  /**
   * 3. MERKEZİ HAVUZ YÖNETİCİSİ (POOL MANAGER)
   * Oyun boyunca tüm mermi, partikül ve düşman havuzlarını koordine eder.
   */
  class PoolManager {
    constructor() {
      this.pools = new Map();         // poolName -> ObjectPool
      this.spritePools = new Map();   // poolName -> PixiSpritePool
    }

    /**
     * Yeni bir nesne havuzu kaydeder
     */
    registerPool(name, factory, reset = null, initialSize = 40, maxSize = 1500) {
      const pool = new ObjectPool({
        factory,
        reset,
        initialSize,
        maxSize
      });
      this.pools.set(name, pool);
      return pool;
    }

    /**
     * Yeni bir Pixi Sprite havuzu kaydeder
     */
    registerSpritePool(name, parentContainer, defaultTexture = null, initialSize = 60, maxSize = 1200) {
      const pool = new PixiSpritePool(parentContainer, {
        defaultTexture,
        initialSize,
        maxSize
      });
      this.spritePools.set(name, pool);
      return pool;
    }

    /**
     * İsmi verilen nesne havuzundan bir öğe çeker
     */
    acquire(poolName, ...args) {
      const pool = this.pools.get(poolName);
      if (!pool) {
        console.warn(`[PoolManager] '${poolName}' havuzu bulunamadı.`);
        return null;
      }
      return pool.acquire(...args);
    }

    /**
     * Öğeyi ilgili havuza iade eder
     */
    release(poolName, item) {
      const pool = this.pools.get(poolName);
      if (pool) {
        pool.release(item);
      }
    }

    /**
     * İsmi verilen sprite havuzundan sprite çeker
     */
    acquireSprite(poolName, texture, x, y, rotation = 0, scale = 1.0, tint = 0xffffff) {
      const pool = this.spritePools.get(poolName);
      if (!pool) {
        console.warn(`[PoolManager] '${poolName}' sprite havuzu bulunamadı.`);
        return null;
      }
      return pool.acquire(texture, x, y, rotation, scale, tint);
    }

    /**
     * Sprite'ı havuza iade eder
     */
    releaseSprite(poolName, sprite) {
      const pool = this.spritePools.get(poolName);
      if (pool) {
        pool.release(sprite);
      }
    }

    /**
     * Tüm havuzları sıfırlar (Oyun yeniden başlarken)
     */
    releaseAll() {
      this.pools.forEach(p => p.releaseAll());
      this.spritePools.forEach(p => p.releaseAll());
    }

    /**
     * Genel GC Tasarruf Metriklerini Döndürür
     */
    getMetrics() {
      let totalActive = 0;
      let totalFree = 0;
      let totalRecycles = 0;

      this.pools.forEach(p => {
        totalActive += p.activeSet.size;
        totalFree += p.freeList.length;
        totalRecycles += p.recyclesCount;
      });

      this.spritePools.forEach(sp => {
        totalActive += sp.activeSet.size;
        totalFree += sp.freeList.length;
      });

      return {
        totalPoolsCount: this.pools.size + this.spritePools.size,
        totalActiveObjects: totalActive,
        totalCachedFreeObjects: totalFree,
        totalRecyclesSavedGC: totalRecycles
      };
    }
  }

  // Singleton oluştur ve dışa aktar
  const poolManager = new PoolManager();
  window.ZortexPoolManager = poolManager;
  window.ObjectPool = ObjectPool;
  window.PixiSpritePool = PixiSpritePool;

})();
