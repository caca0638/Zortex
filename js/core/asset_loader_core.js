/**
 * ============================================================================
 * ZORTEX: CYBER SURVIVOR — ASSET LOADER CORE (GÖRSEL VE ATLAS MOTORU)
 * File: js/core/asset_loader_core.js
 * 
 * Mimari Özellikler:
 *  1. PixiJS v8 Uyumlu Texture Atlas (PNG + JSON Spritesheet) Desteği
 *  2. El Çizimi Grid Sprite Sheet Dilimleyici (Frame Slicer)
 *  3. Akıllı Önbellek & O(1) Doku Erişimi (Texture Cache & Frame Query)
 *  4. Çökme Korumalı Dinamik Placeholder (Fallback Texture Generator)
 *  5. WebGL Shader & Post-Processing Kancaları (Displacement Map & Bloom Hooks)
 * ============================================================================
 */
(function() {
  'use strict';

  class AssetLoaderCore {
    constructor() {
      this.isInitialized = false;

      // Kayıtlı texture ve atlas havuzları
      this.textures = new Map();     // frameId -> PIXI.Texture
      this.atlases = new Map();      // atlasId -> PIXI.Spritesheet
      this.rawAssets = new Map();    // assetId -> any loaded asset

      // Post-Processing & Shader Kancaları Takip Listesi
      this.activeShaders = new Set(); // { container, filter, updateFn }

      // Dinamik Fallback Dokuları
      this.fallbackTexture = null;

      // Yükleme Durumu
      this.loadingProgress = 0;
      this.isLoading = false;
    }

    /**
     * PixiJS v8 Assets Altyapısını ve Fallback Dokusunu Hazırlar
     */
    async init() {
      if (this.isInitialized) return;

      // Fallback (Yedek) Doku Üretimi: Eğer çizim dosyası eksikse oyun ASLA çökmez
      this.fallbackTexture = this.createFallbackTexture();

      // WebGL Displacement Map Doku Üretimi: Şok dalgaları ve uzamsal bükülmeler
      this.displacementTexture = this.createDisplacementTexture();
      if (this.displacementTexture) {
        this.textures.set('displacement_default', this.displacementTexture);
        this.textures.set('displacement_shockwave', this.displacementTexture);
      }

      // Pixi v8 PIXI.Assets başlatma
      if (typeof PIXI !== 'undefined' && PIXI.Assets) {
        try {
          await PIXI.Assets.init();
        } catch (e) {
          // Assets zaten başlatılmış olabilir
        }
      }

      this.isInitialized = true;
      console.log('[AssetLoaderCore] PixiJS v8 Asset Loader Core başarıyla başlatıldı.');
    }

    /**
     * WebGL Normal/Displacement Şok Dalgası Dokusu Üretir (256x256 Radyal Kırılma Deseni)
     * @private
     */
    createDisplacementTexture() {
      if (typeof document === 'undefined' || typeof PIXI === 'undefined') return null;
      try {
        const size = 256;
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const ctx = c.getContext('2d');
        if (!ctx) return null;

        ctx.fillStyle = 'rgb(128, 128, 128)';
        ctx.fillRect(0, 0, size, size);

        const cx = size / 2, cy = size / 2;
        const imgData = ctx.getImageData(0, 0, size, size);
        const d = imgData.data;

        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const normDist = dist / (size * 0.48);
            if (normDist <= 1.0) {
              const angle = Math.atan2(dy, dx);
              // Sinüsoidal radyal dalga halkası
              const wave = Math.sin(normDist * Math.PI * 4.0) * Math.sin(normDist * Math.PI);
              const dispX = Math.cos(angle) * wave * 80;
              const dispY = Math.sin(angle) * wave * 80;
              const idx = (y * size + x) * 4;
              d[idx] = Math.max(0, Math.min(255, 128 + dispX));     // Kırmızı kanal (X ofseti)
              d[idx + 1] = Math.max(0, Math.min(255, 128 + dispY)); // Yeşil kanal (Y ofseti)
              d[idx + 2] = 128;
              d[idx + 3] = 255;
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
        return PIXI.Texture.from(c);
      } catch (e) {
        return null;
      }
    }

    /**
     * GPU / Canvas tabanlı 64x64 neon siber placeholder dokusu üretir
     * @private
     */
    createFallbackTexture() {
      if (typeof document === 'undefined' || typeof PIXI === 'undefined') return null;
      try {
        const c = document.createElement('canvas');
        c.width = 64;
        c.height = 64;
        const ctx = c.getContext('2d');
        if (!ctx) return PIXI.Texture.WHITE;

        // Dış çerçeve ve ızgara
        ctx.fillStyle = '#050a18';
        ctx.fillRect(0, 0, 64, 64);
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, 60, 60);

        // Çapraz neon uyarı çizgisi
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(4, 4);
        ctx.lineTo(60, 60);
        ctx.moveTo(60, 4);
        ctx.lineTo(4, 60);
        ctx.stroke();

        return PIXI.Texture.from(c);
      } catch (e) {
        return (typeof PIXI !== 'undefined' && PIXI.Texture) ? PIXI.Texture.WHITE : null;
      }
    }

    /**
     * Standart Texture Atlas Yükler (PNG + JSON veya XML Spritesheet)
     * TexturePacker, Aseprite JSON Array/Hash ve Kenney/Starling XML formatlarını destekler.
     * @param {string} id Atlas kimliği (örn: 'space_shooter', 'alien_fleet')
     * @param {string|Object} jsonUrl JSON/XML metadata dosya yolu veya veri nesnesi
     * @param {string} [imageUrl] Görsel dosya yolu (metadata içinde belirtilenden farklıysa)
     * @returns {Promise<PIXI.Spritesheet>}
     */
    async loadAtlas(id, jsonUrl, imageUrl = null) {
      await this.init();
      if (typeof PIXI === 'undefined') return null;

      try {
        let sheetData = null;
        let detectedImg = null;

        if (typeof jsonUrl === 'string') {
          const resp = await fetch(jsonUrl);
          const rawText = await resp.text();

          // XML formatı kontrolü (Kenney / Sparrow / Starling)
          if (jsonUrl.endsWith('.xml') || rawText.trim().startsWith('<TextureAtlas')) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(rawText, 'text/xml');
            const root = xmlDoc.querySelector('TextureAtlas');
            if (root) {
              detectedImg = root.getAttribute('imagePath') || 'sprites.png';
              const frames = {};
              const subs = xmlDoc.querySelectorAll('SubTexture');
              subs.forEach(sub => {
                const name = sub.getAttribute('name');
                const x = parseInt(sub.getAttribute('x'), 10);
                const y = parseInt(sub.getAttribute('y'), 10);
                const w = parseInt(sub.getAttribute('width'), 10);
                const h = parseInt(sub.getAttribute('height'), 10);
                frames[name] = {
                  frame: { x, y, w, h },
                  rotated: false,
                  trimmed: false,
                  spriteSourceSize: { x: 0, y: 0, w, h },
                  sourceSize: { w, h }
                };
              });
              sheetData = {
                frames,
                meta: {
                  image: detectedImg,
                  format: 'RGBA8888',
                  size: { w: 2048, h: 2048 },
                  scale: '1'
                }
              };
            } else {
              throw new Error('Geçersiz TextureAtlas XML yapısı');
            }
          } else {
            // Standart JSON formatı
            sheetData = JSON.parse(rawText);
          }
        } else {
          sheetData = jsonUrl;
        }

        // Ana görsel dosya yolunu belirle ve göreceli yolu çözümle
        let imgPath = imageUrl || (sheetData.meta && sheetData.meta.image) || detectedImg;
        if (!imgPath) {
          throw new Error('Atlas görsel yolu (image) bulunamadı.');
        }

        if (!imageUrl && typeof jsonUrl === 'string' && imgPath && !imgPath.startsWith('http') && !imgPath.startsWith('/')) {
          const lastSlash = jsonUrl.lastIndexOf('/');
          if (lastSlash !== -1) {
            imgPath = jsonUrl.substring(0, lastSlash + 1) + imgPath;
          }
        }

        // Ana görsel dokusunu yükle
        const baseTexture = await PIXI.Assets.load(imgPath);

        // PixiJS v8 Spritesheet oluştur ve parse et
        const spritesheet = new PIXI.Spritesheet(baseTexture, sheetData);
        await spritesheet.parse();

        this.atlases.set(id, spritesheet);

        // Atlas içindeki tüm kareleri hızlı O(1) önbelleğe kaydet (hem uzantılı hem uzantısız)
        let frameCount = 0;
        for (const frameName in spritesheet.textures) {
          const tex = spritesheet.textures[frameName];
          tex.__isAtlasSprite = true;
          this.textures.set(frameName, tex);
          frameCount++;

          const baseName = frameName.replace(/\.[^/.]+$/, '');
          if (baseName !== frameName) {
            this.textures.set(baseName, tex);
          }
        }

        console.log(`[AssetLoaderCore] '${id}' atlası yüklendi. ${frameCount} kare kullanıma hazır.`);
        return spritesheet;
      } catch (err) {
        console.warn(`[AssetLoaderCore] '${id}' atlası yüklenirken hata:`, err.message);
        return null;
      }
    }

    /**
     * El Çizimi Grid Sprite Sheet'leri (Hücreli PNG) Otomatik Dilimler
     * Örnek: 8 karelik 64x64 patlama veya yürüyüş animasyonu tek PNG olarak geldiğinde
     * @param {string} id Sheet kimliği
     * @param {string} imageUrl Görsel dosya yolu
     * @param {number} frameWidth Her karenin piksel genişliği
     * @param {number} frameHeight Her karenin piksel yüksekliği
     * @param {number} [totalFrames] Toplam kare sayısı (varsayılan: tüm satır ve sütunlar)
     * @returns {Promise<PIXI.Texture[]>}
     */
    async loadGridSheet(id, imageUrl, frameWidth, frameHeight, totalFrames = null) {
      await this.init();
      if (typeof PIXI === 'undefined') return [];

      try {
        const baseTexture = await PIXI.Assets.load(imageUrl);
        const sourceWidth = baseTexture.width;
        const sourceHeight = baseTexture.height;

        const cols = Math.floor(sourceWidth / frameWidth);
        const rows = Math.floor(sourceHeight / frameHeight);
        const maxFrames = totalFrames || (cols * rows);

        const frameTextures = [];
        let count = 0;

        for (let r = 0; r < rows && count < maxFrames; r++) {
          for (let c = 0; c < cols && count < maxFrames; c++) {
            const rect = new PIXI.Rectangle(c * frameWidth, r * frameHeight, frameWidth, frameHeight);
            const frameTex = new PIXI.Texture({
              source: baseTexture.source || baseTexture,
              frame: rect
            });

            frameTex.__isAtlasSprite = true;
            const frameId = `${id}_${count}`;
            this.textures.set(frameId, frameTex);
            frameTextures.push(frameTex);
            count++;
          }
        }

        console.log(`[AssetLoaderCore] '${id}' grid sheet başarıyla ${frameTextures.length} kareye dilimlendi.`);
        return frameTextures;
      } catch (err) {
        console.warn(`[AssetLoaderCore] Grid sheet '${id}' yüklenemedi:`, err.message);
        return [];
      }
    }

    /**
     * Tekil Görsel Yükler (PNG / WebP / SVG)
     * @param {string} id Doku kimliği
     * @param {string} url Dosya yolu
     */
    async loadTexture(id, url) {
      await this.init();
      if (typeof PIXI === 'undefined') return null;

      try {
        const tex = await PIXI.Assets.load(url);
        tex.__isAtlasSprite = true;
        this.textures.set(id, tex);
        return tex;
      } catch (e) {
        console.warn(`[AssetLoaderCore] '${id}' (${url}) dokusu yüklenemedi:`, e.message);
        return this.fallbackTexture;
      }
    }

    /**
     * İsmi veya ID'si verilen dokuyu O(1) hızında döndürür
     * Bulunamazsa fallback placeholder döner; oyun ASLA çökmez.
     * @param {string} id Doku veya frame kimliği
     * @returns {PIXI.Texture}
     */
    getTexture(id) {
      if (this.textures.has(id)) {
        return this.textures.get(id);
      }
      return this.fallbackTexture || (typeof PIXI !== 'undefined' ? PIXI.Texture.WHITE : null);
    }

    /**
     * İsmi verilen önekle başlayan sıralı animasyon dokularını dizi olarak döndürür
     * Örnek: getTextures('explosion') -> [explosion_0, explosion_1, explosion_2, ...]
     * @param {string} prefix 
     * @returns {PIXI.Texture[]}
     */
    getTextures(prefix) {
      const result = [];
      let index = 0;
      while (true) {
        const candidateId = `${prefix}_${index}`;
        if (this.textures.has(candidateId)) {
          result.push(this.textures.get(candidateId));
          index++;
        } else {
          break;
        }
      }
      return result;
    }

    /**
     * Dokunun yüklenip yüklenmediğini kontrol eder
     */
    hasTexture(id) {
      return this.textures.has(id);
    }

    /**
     * getTexture ile eşanlamlı frame sorgu arayüzü
     */
    getFrame(id) {
      return this.getTexture(id);
    }

    /**
     * Zortex AAA 2D Görsel Varlıklarını ve Atlaslarını Önceden Yükler
     */
    async preloadDefaultGameAssets() {
      await this.init();
      if (typeof PIXI === 'undefined') return 0;

      this.isLoading = true;
      console.log('[AssetLoaderCore] AAA 2D Sprite Atlasları ve Doku Paketleri yükleniyor...');

      const tasks = [];

      // 1. Space Shooter 2 Ana Doku Atlası (556 frame: Gemiler, İstasyonlar, Roketler, Efektler)
      tasks.push(
        this.loadAtlas('space_shooter_ext', 'assets/sprites/space-shooter-extension/Spritesheet/spaceShooter2_spritesheet.json')
      );

      // 2. Simple Space Atlası (96 frame: Düşmanlar A-E, Gemiler A-C, Meteorlar, Lazer efektleri)
      tasks.push(
        this.loadAtlas('simple_space', 'assets/sprites/simple-space/Spritesheet/simpleSpace_sheet.json')
      );

      // 3. HD Şeffaf Partikül Dokuları (Alev, Duman, Işık, Namlu Parıltısı, Kıvılcım, Yıldız)
      const particleNames = ['fire_01', 'flame_01', 'flare_01', 'light_01', 'muzzle_01', 'smoke_01', 'spark_01', 'star_01'];
      for (const p of particleNames) {
        tasks.push(
          this.loadTexture(`particle_${p}`, `assets/sprites/particle-pack/PNG (Transparent)/${p}.png`)
        );
      }

      // 4. Özel Cyber Fleet Gemileri (Vibrant AAA Cyberpunk Retextured Fleet)
      const cyberShips = [
        'cyber_ship_interceptor', 'cyber_ship_titan', 'cyber_ship_spectre',
        'cyber_enemy_scout', 'cyber_enemy_fast', 'cyber_enemy_shooter',
        'cyber_enemy_heavy', 'cyber_enemy_kamikaze', 'cyber_enemy_boss'
      ];
      for (const cs of cyberShips) {
        tasks.push(
          this.loadTexture(cs, `assets/sprites/cyber_fleet/${cs}.png`)
        );
      }

      try {
        await Promise.allSettled(tasks);
        this.isLoading = false;
        console.log(`[AssetLoaderCore] Tüm varsayılan atlaslar hazır. Toplam önbellekteki doku: ${this.textures.size}`);
        return this.textures.size;
      } catch (err) {
        this.isLoading = false;
        console.warn('[AssetLoaderCore] Atlas ön yüklemesinde bazı uyarılar oluştu:', err);
        return this.textures.size;
      }
    }

    /* ==============================================================
       SHADER VE POST-PROCESSING KANCALARI (DISPLACEMENT & BLOOM HOOKS)
       ============================================================== */

    /**
     * Hedef Container'a WebGL Displacement Map (Uzamsal Dalga/Bükülme) Bağlar
     * Patlamalar, karadelikler ve mermi şok dalgaları için kullanılır.
     * @param {PIXI.Container} container Filtre uygulanacak görsel katman
     * @param {string|PIXI.Texture} mapAsset Displacement dokusu veya URL'si
     * @param {Object} [options] { scaleX, scaleY, speedX, speedY }
     * @returns {Promise<{filter: PIXI.DisplacementFilter, sprite: PIXI.Sprite, update: Function}>}
     */
    async attachDisplacement(container, mapAsset, options = {}) {
      if (typeof PIXI === 'undefined' || !container) return null;

      try {
        let dispTexture = null;
        if (typeof mapAsset === 'string') {
          dispTexture = await PIXI.Assets.load(mapAsset);
        } else if (mapAsset instanceof PIXI.Texture) {
          dispTexture = mapAsset;
        } else {
          dispTexture = this.getTexture('displacement_default');
        }

        dispTexture.source.addressMode = 'repeat'; // Sonsuz kayma için döşeme modu

        const dispSprite = new PIXI.Sprite(dispTexture);
        const dispFilter = new PIXI.DisplacementFilter(dispSprite);

        const scaleX = options.scaleX !== undefined ? options.scaleX : 25;
        const scaleY = options.scaleY !== undefined ? options.scaleY : 25;
        dispFilter.scale.set(scaleX, scaleY);

        const currentFilters = container.filters ? (Array.isArray(container.filters) ? container.filters : [container.filters]) : [];
        container.filters = [...currentFilters, dispFilter];

        const speedX = options.speedX !== undefined ? options.speedX : 1.2;
        const speedY = options.speedY !== undefined ? options.speedY : 0.8;

        const updateFn = (dt) => {
          dispSprite.x += speedX * (dt * 60);
          dispSprite.y += speedY * (dt * 60);
        };

        const hook = {
          container,
          filter: dispFilter,
          sprite: dispSprite,
          update: updateFn
        };

        this.activeShaders.add(hook);
        return hook;
      } catch (err) {
        console.warn('[AssetLoaderCore] Displacement filter kancası bağlanamadı:', err.message);
        return null;
      }
    }

    /**
     * Hedef Container'a WebGL Bloom / Parlama Filtresi Bağlar
     * @param {PIXI.Container} container 
     * @param {Object} [options] { strength, quality, blur }
     */
    attachBloom(container, options = {}) {
      if (typeof PIXI === 'undefined' || !container) return null;
      try {
        // PixiFilters v8 kütüphanesi yüklüyse BloomFilter veya BlurFilter kullan
        let filter = null;
        if (PIXI.filters && PIXI.filters.BloomFilter) {
          filter = new PIXI.filters.BloomFilter(options.strength || 1.4);
        } else if (PIXI.BlurFilter) {
          filter = new PIXI.BlurFilter({
            strength: options.blur || 4,
            quality: options.quality || 3
          });
        }

        if (filter) {
          const currentFilters = container.filters ? (Array.isArray(container.filters) ? container.filters : [container.filters]) : [];
          container.filters = [...currentFilters, filter];
        }
        return filter;
      } catch (err) {
        console.warn('[AssetLoaderCore] Bloom filtresi bağlanamadı:', err.message);
        return null;
      }
    }

    /**
     * WebGL Displacement Şok Dalgası Tetikler (Patlamalar, Karadelikler, Kritik Vuruşlar)
     * Ekran uzayında radyal kırılma ve mercek bükülmesi oluşturur.
     * @param {number} x Ekran X koordinatı
     * @param {number} y Ekran Y koordinatı
     * @param {number} [maxRadius=180] Maksimum şok dalgası piksel yarıçapı
     * @param {number} [strength=35] Bükülme şiddeti
     * @param {number} [duration=0.45] Süre (saniye)
     * @param {PIXI.Container} [targetContainer] Uygulanacak konteyner (varsayılan: worldContainer veya emissiveLayer)
     * @returns {Object|null}
     */
    triggerShockwave(x, y, maxRadius = 180, strength = 35, duration = 0.45, targetContainer = null) {
      if (typeof PIXI === 'undefined') return null;
      const container = targetContainer || window.worldContainer || window.pixiEntitiesLayer || (typeof worldContainer !== 'undefined' ? worldContainer : null);
      if (!container) return null;

      const dispTex = this.displacementTexture || this.getTexture('displacement_default');
      if (!dispTex) return null;

      try {
        const dispSprite = new PIXI.Sprite(dispTex);
        dispSprite.anchor.set(0.5);
        dispSprite.x = x;
        dispSprite.y = y;
        dispSprite.scale.set(0.1);

        // PixiJS v8'de DisplacementFilter sprite'ının render hiyerarşisinde olması gerekir
        if (window.pixiApp && window.pixiApp.stage) {
          window.pixiApp.stage.addChild(dispSprite);
        } else if (container.parent) {
          container.parent.addChild(dispSprite);
        }

        const dispFilter = new PIXI.DisplacementFilter(dispSprite);
        dispFilter.scale.set(strength);

        const currentFilters = container.filters ? (Array.isArray(container.filters) ? container.filters : [container.filters]) : [];
        container.filters = [...currentFilters, dispFilter];

        let elapsed = 0;
        const targetScale = maxRadius / 64.0;

        const hook = {
          update: (dt) => {
            elapsed += dt;
            const progress = Math.min(1.0, elapsed / duration);
            // Ease-out quad interpolasyonu
            const ease = 1.0 - Math.pow(1.0 - progress, 2);
            dispSprite.scale.set(0.1 + (targetScale - 0.1) * ease);
            const currentStrength = strength * (1.0 - progress);
            dispFilter.scale.set(currentStrength, currentStrength);

            if (progress >= 1.0) {
              // Bellek sızıntısını ve GC yükünü sıfırlamak için temizle
              this.activeShaders.delete(hook);
              if (container.filters) {
                container.filters = container.filters.filter(f => f !== dispFilter);
              }
              if (dispSprite.parent) {
                dispSprite.parent.removeChild(dispSprite);
              }
              dispSprite.destroy({ texture: false });
            }
          }
        };

        this.activeShaders.add(hook);
        return hook;
      } catch (err) {
        console.warn('[AssetLoaderCore] triggerShockwave hatası:', err.message);
        return null;
      }
    }

    /**
     * Tüm aktif shader kancalarını kare başı günceller (144Hz Delta Time Uyumlu)
     * @param {number} dt Delta Time
     */
    updateShaders(dt) {
      if (this.activeShaders.size === 0) return;
      this.activeShaders.forEach(hook => {
        if (typeof hook.update === 'function') {
          hook.update(dt);
        }
      });
    }

    /**
     * Bir filtre kancasını kaldırır
     */
    removeDisplacement(hook) {
      if (!hook || !this.activeShaders.has(hook)) return;
      this.activeShaders.delete(hook);
      if (hook.container && hook.container.filters) {
        hook.container.filters = hook.container.filters.filter(f => f !== hook.filter);
      }
    }
  }

  // Singleton oluştur ve dışa aktar
  const assetLoader = new AssetLoaderCore();
  window.ZortexAssetLoader = assetLoader;

})();
