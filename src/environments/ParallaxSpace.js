/**
 * ZORTEX: CYBER SURVIVOR - PARALLAKS UZAY MOTORU (ParallaxSpace.js)
 * PIXI.TilingSprite mimarisiyle 3 katmanlı (Derin Nebula, Uzak Yıldızlar, Yakın Yıldız Tozu)
 * oyuncu hızına ve yönüne duyarlı sonsuz kayan 2.5D derin uzay arka planı.
 */

import { Settings } from '../config/settings.js';

export class ParallaxSpace {
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
