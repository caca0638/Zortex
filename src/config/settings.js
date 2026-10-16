/**
 * ZORTEX: CYBER SURVIVOR - GLOBAL AYARLAR VE YAPILANDIRMA (settings.js)
 * Modüler mimari ve 2.5D retro arcade uzay perspektifi parametreleri
 */

export const Settings = {
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
