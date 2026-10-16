/**
 * ============================================================================
 * ZORTEX: CYBER SURVIVOR - GÜNLÜK KOŞU VE TOHUMLU RASTGELE SAYI MOTORU (PRNG)
 * Mimari: Bölüm 11.2 - Günlük Koşu (Daily Run) ve Seeded RNG Sistemi
 * Mulberry32 Deterministik Üreteç (Zero-GC, 144Hz)
 * ============================================================================
 */
(function() {
  'use strict';

  function mulberry32(seed) {
    let s = (seed >>> 0);
    return function() {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Varsayılan / normal modda gameRng Math.random'a eşittir
  let activeRng = Math.random;

  function gameRng() {
    const val = activeRng();
    if (typeof window.__onGameRng === 'function') {
      window.__onGameRng(val);
    }
    return val;
  }
  window.gameRng = gameRng;

  class DailyRunManager {
    constructor() {
      this.isDailyRunActive = false;
      this.currentSeed = 0;
      this.dateKey = '';
      this.seededRng = null;
    }

    /**
     * Bugünün UTC tarihinden benzersiz sayısal tohum üretir (örn: 20261011)
     */
    getTodaySeed() {
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, '0');
      const day = String(now.getUTCDate()).padStart(2, '0');
      this.dateKey = `${year}${month}${day}`;
      
      // Hash string to 32-bit integer
      let hash = 0;
      for (let i = 0; i < this.dateKey.length; i++) {
        hash = ((hash << 5) - hash) + this.dateKey.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash) || 20261011;
    }

    startDailyRun(customSeed = null) {
      if (customSeed !== null && customSeed !== undefined) {
        this.currentSeed = customSeed >>> 0;
      } else if (!this.currentSeed || !this.isDailyRunActive) {
        this.currentSeed = this.getTodaySeed();
      }
      this.seededRng = mulberry32(this.currentSeed);
      this.isDailyRunActive = true;

      // Oynanış rastgeleliğini (gameRng) tohumlu üretece bağla. Math.random asla değiştirilmez!
      activeRng = this.seededRng;

      if (window.textManager) {
        const W = window.W || 1280;
        const H = window.H || 720;
        window.textManager.add(`📅 GÜNLÜK PROTOKOL: TOHUM #${this.dateKey || this.currentSeed}`, W / 2, H / 3, '#00f3ff', 22, 3.5);
      }
    }

    stopDailyRun() {
      if (this.isDailyRunActive) {
        this.isDailyRunActive = false;
        this.seededRng = null;
        this.currentSeed = 0;
        activeRng = Math.random;
      }
    }

    isDailyCompletedToday() {
      const key = `zortex_daily_done_${this.dateKey || this.getTodaySeed()}`;
      return localStorage.getItem(key) === '1';
    }

    recordDailyCompletion(score = 0) {
      const key = `zortex_daily_done_${this.dateKey || this.getTodaySeed()}`;
      localStorage.setItem(key, '1');
      const bestScoreKey = `zortex_daily_score_${this.dateKey}`;
      const prev = parseInt(localStorage.getItem(bestScoreKey) || '0', 10);
      if (score > prev) {
        localStorage.setItem(bestScoreKey, String(score));
      }
    }
  }

  window.ZortexDailyRun = new DailyRunManager();
  window.mulberry32 = mulberry32;

})();
