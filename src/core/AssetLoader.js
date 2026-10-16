/**
 * ZORTEX: CYBER SURVIVOR - ASSET & PROCEDURAL TEXTURE LOADER (AssetLoader.js)
 * Harici resim dosyalarına bağımlı kalmadan PIXI.Graphics kullanarak
 * tüm gemileri, mermileri, düşmanları ve partikülleri doğrudan GPU VRAM'ine yazar.
 * Ayrıca Web Audio API ses motorunu ve GLSL CRT filtresini yönetir.
 */

export class AssetLoader {
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
