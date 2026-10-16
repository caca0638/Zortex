/**
 * ZORTEX: CYBER SURVIVOR - DALGA VE DÜŞMAN DOĞMA MOTORU (WaveSystem.js)
 * Taktiksel formasyonlar, seçkin düşman affixleri ve Boss aşamaları yönetimi.
 */

import { Settings } from '../config/settings.js';
import {
  Enemy,
  SwarmDroneEnemy,
  KamikazeEnemy,
  PhantomEnemy,
  AegisHeavyEnemy,
  BossEnemy
} from '../entities/Enemy.js';

export class WaveSystem {
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
