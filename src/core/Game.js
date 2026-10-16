/**
 * ZORTEX: CYBER SURVIVOR - ANA OYUN MOTORU (Game.js)
 * PixiJS v8 tabanlı 2.5D retro uzay savaşı çekirdeği.
 * Sahne hiyerarşisi, 144Hz ticker, oyun durumları ve HUD senkronizasyonunu yönetir.
 */

import { Settings } from '../config/settings.js';
import { AssetLoader } from './AssetLoader.js';
import { InputManager } from './InputManager.js';
import { Player } from '../entities/Player.js';
import { Enemy, SwarmDroneEnemy, KamikazeEnemy, PhantomEnemy, AegisHeavyEnemy, BossEnemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';
import { ParallaxSpace } from '../environments/ParallaxSpace.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';

export class Game {
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
