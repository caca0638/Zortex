/**
 * ============================================================================
 * ZORTEX: CYBER SURVIVOR - DYNAMIC AUDIO STEMS & GAME MODES ENGINE (FAZ 4)
 * Module: js/gameplay/gamemode_audio_system.js
 * Architecture: 4-Layer Dynamic Synth Stems, Campaign/Endless Modes, Cyber Heat
 * ============================================================================
 */
(function() {
  'use strict';

  /* ==========================================================================
     1. DINAMIK KATMANLI MÜZİK SİSTEMİ (4 Dynamic Synth Stems)
     ========================================================================== */
  class DynamicMusicEngine {
    constructor() {
      this.audio = null;
      this.intensity = 0.0;       // 0.0 (Ambient) -> 1.0 (Battle) -> 2.0 (Intense) -> 3.0 (Boss)
      this.targetIntensity = 0.0;
      this.stemVolumes = {
        ambient: 1.0,
        battleArp: 0.0,
        hiHats: 0.0,
        bossOverdrive: 0.0
      };
      this.stems = this.stemVolumes;
      this.enabled = true;
      // Arpej Notaları (Cyberpunk E-Minör Pentatonik / Doğan Uzay Dizisi)
      this.arpNotes = [64, 67, 71, 74, 76, 74, 71, 67]; // E4, G4, B4, D5, E5, D5, B4, G4
      this.bossChordNotes = [40, 47, 52, 55];             // E2, B2, E3, G3 (Ağır Power Chord)
    }

    setup(audioEngine) {
      if (!audioEngine) return;
      this.audio = audioEngine;
      this.hookAudioEngine();
    }

    hookAudioEngine() {
      if (!this.audio) return;
      const self = this;
      const originalScheduleBeat = this.audio.scheduleBeat.bind(this.audio);

      // AudioEngine'in scheduleBeat metodunu genişleterek 4 dinamik katmanı ekler
      this.audio.scheduleBeat = function(step, time) {
        // Orijinal temel vuruşlar (Kick / Snare / Standart bas)
        originalScheduleBeat(step, time);

        if (this.muted || !this.ctx) return;

        // STEM 2: BATTLE SYNTH-ARP (Yoğunluk >= 1.0)
        if (self.stemVolumes.battleArp > 0.05) {
          const arpIndex = step % self.arpNotes.length;
          const midi = self.arpNotes[arpIndex];
          const osc = this.ctx.createOscillator();
          const filter = this.ctx.createBiquadFilter();
          const gain = this.ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.value = this.midiToFreq(midi);

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1400 + Math.sin(step * 0.8) * 600, time);
          filter.Q.value = 3.5;

          const vol = 0.09 * self.stemVolumes.battleArp;
          gain.gain.setValueAtTime(vol, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.musicGain);

          osc.start(time);
          osc.stop(time + 0.09);
        }

        // STEM 3: HI-HATS & CYBER PERCUSSION (Yoğunluk >= 1.8)
        if (self.stemVolumes.hiHats > 0.05) {
          if (this.noiseBuffer) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(7500, time);

            const gain = this.ctx.createGain();
            const isAccent = (step % 2 === 0);
            const vol = (isAccent ? 0.08 : 0.04) * self.stemVolumes.hiHats;
            gain.gain.setValueAtTime(vol, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            noise.start(time);
            noise.stop(time + 0.05);
          }
        }

        // STEM 4: BOSS OVERDRIVE SYNTH BRASS (Yoğunluk >= 2.6)
        if (self.stemVolumes.bossOverdrive > 0.05 && (step === 0 || step === 8)) {
          for (let b = 0; b < 2; b++) {
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            const detune = (b === 0 ? -9 : 9);
            osc.frequency.value = this.midiToFreq(40);
            osc.detune.setValueAtTime(detune, time);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2400, time);
            filter.frequency.exponentialRampToValueAtTime(450, time + 0.35);

            const vol = 0.16 * self.stemVolumes.bossOverdrive;
            gain.gain.setValueAtTime(vol, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc.start(time);
            osc.stop(time + 0.39);
          }
        }
      };
    }

    /**
     * Oyun durumuna göre dinamik müzik yoğunluğunu her kare günceller
     */
    update(dt, enemyCount = 0, isBoss = false, isHazard = false) {
      if (isBoss) {
        this.targetIntensity = 3.0; // Boss Fight
      } else if (isHazard || enemyCount >= 32) {
        this.targetIntensity = 2.0; // Yüksek Tehdit / Fırtına
      } else if (enemyCount >= 10) {
        this.targetIntensity = 1.0; // Standart Çatışma
      } else {
        this.targetIntensity = 0.0; // Sakin Derin Uzay
      }

      // Yumuşak geçiş (Lerp)
      const lerpSpeed = 1.5 * dt;
      this.intensity += (this.targetIntensity - this.intensity) * Math.min(1.0, lerpSpeed);

      // Katman ses düzeylerini hesapla
      this.stemVolumes.ambient = 1.0;
      this.stemVolumes.battleArp = Math.max(0, Math.min(1, this.intensity));
      this.stemVolumes.hiHats = Math.max(0, Math.min(1, this.intensity - 1.0));
      this.stemVolumes.bossOverdrive = Math.max(0, Math.min(1, this.intensity - 2.0));

      // Tempo hafifçe hızlanır (124 BPM -> 138 BPM)
      if (this.audio) {
        const baseTempo = this.audio.baseTempo || 124;
        this.audio.tempo = baseTempo + Math.round(this.intensity * 4.5);
      }
    }

    /**
     * Seviye Atlama Kartları Açılırken Çalınan Parıltılı Çan Fanfarı
     */
    playCardFanfare() {
      if (!this.audio || !this.audio.ctx || this.audio.muted) return;
      const ctx = this.audio.ctx;
      const now = ctx.currentTime;
      const notes = [60, 64, 67, 71, 72, 76]; // C4, E4, G4, B4, C5, E5
      notes.forEach((midi, idx) => {
        const noteTime = now + idx * 0.045;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(this.audio.midiToFreq(midi), noteTime);

        gain.gain.setValueAtTime(0.18, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

        osc.connect(gain);
        gain.connect(this.audio.sfxGain || ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.36);
      });
    }

    /**
     * Sefer Zaferi (Run Victory) Triumphant Fanfarı
     */
    playVictoryFanfare() {
      if (!this.audio || !this.audio.ctx || this.audio.muted) return;
      const ctx = this.audio.ctx;
      const now = ctx.currentTime;
      // Muazzam C Majör Fanfarı
      const chords = [
        { midi: [48, 55, 60, 64], delay: 0.0, dur: 0.4 },  // C3
        { midi: [53, 57, 60, 65], delay: 0.45, dur: 0.4 }, // F3
        { midi: [55, 59, 62, 67], delay: 0.90, dur: 0.5 }, // G3
        { midi: [60, 64, 67, 72], delay: 1.45, dur: 1.5 }  // C4 (Uzun Triumphant Final)
      ];

      chords.forEach(ch => {
        ch.midi.forEach(m => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + ch.delay;

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(this.audio.midiToFreq(m), t);

          gain.gain.setValueAtTime(0.14, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + ch.dur);

          osc.connect(gain);
          gain.connect(this.audio.sfxGain || ctx.destination);

          osc.start(t);
          osc.stop(t + ch.dur + 0.05);
        });
      });
    }
  }

  /* ==========================================================================
     2. OYUN MODLARI & SİBER TEHLİKE KADEMELERİ (Game Modes & Cyber Heat)
     ========================================================================== */
  const HEAT_LEVELS = [
    {
      level: 0,
      name: 'STANDART DÜZEY',
      badge: 'NORMAL',
      color: '#00f3ff',
      hpMult: 1.0,
      spdMult: 1.0,
      bulletSpdMult: 1.0,
      scrapMult: 1.0,
      desc: 'Standart hayatta kalma tecrübesi.'
    },
    {
      level: 1,
      name: 'TEHLİKE KADEMESİ I: AŞIRI YÜKLEME',
      badge: 'HEAT I (+25%)',
      color: '#eab308',
      hpMult: 1.25,
      spdMult: 1.15,
      bulletSpdMult: 1.10,
      scrapMult: 1.30,
      desc: 'Düşman Canı +%25, Hızı +%15 | +%30 Hurda Bonusu'
    },
    {
      level: 2,
      name: 'TEHLİKE KADEMESİ II: ÇİFT ÇEKİRDEK',
      badge: 'HEAT II (+50%)',
      color: '#f97316',
      hpMult: 1.50,
      spdMult: 1.25,
      bulletSpdMult: 1.20,
      scrapMult: 1.60,
      desc: 'Düşman Canı +%50, Çift Elit/Boss | +%60 Hurda Bonusu'
    },
    {
      level: 3,
      name: 'TEHLİKE KADEMESİ III: HİPER KIYAMET',
      badge: 'HEAT III (+80%)',
      color: '#ef4444',
      hpMult: 1.80,
      spdMult: 1.35,
      bulletSpdMult: 1.30,
      scrapMult: 2.00,
      desc: 'Düşman Canı +%80, Hızlı Mermiler | +%100 Çift Hurda & Efsanevi Şans'
    },
    {
      level: 4,
      name: 'TEHLİKE KADEMESİ IV: KABUS PROTOKOLÜ',
      badge: 'HEAT IV (KABUS)',
      color: '#a855f7',
      hpMult: 2.10,
      spdMult: 1.45,
      bulletSpdMult: 1.40,
      scrapMult: 3.00,
      desc: 'Düşman Canı +%110, Hızı +%45, Mermiler +%40, Çifte Biyom Mini-Bossları! (Hurda ×3)'
    }
  ];

  const MODULAR_PACTS = [
    { id: 'fast_swarm', name: 'Hızlı Sürü', desc: 'Düşman hızı +%15', points: 1, icon: '⚡' },
    { id: 'armored_army', name: 'Zırhlı Ordu', desc: 'Düşman canı +%25', points: 1, icon: '🛡️' },
    { id: 'less_chests', name: 'Az Sandık', desc: 'Sandık düşme şansı -%30', points: 1, icon: '📦' },
    { id: 'thick_shield', name: 'Kalın Kalkan', desc: 'Düşman kalkanlı doğar (%20 şans)', points: 2, icon: '🔰' },
    { id: 'drought', name: 'Susuz Kalış', desc: 'Can yenileme kapalı', points: 2, icon: '💧' },
    { id: 'double_elite', name: 'Çift Elit', desc: 'Elit düşman sayısı 2 kat', points: 2, icon: '⭐' },
    { id: 'single_chance', name: 'Tek Hak', desc: 'Yenile/Yasakla/Atla yok', points: 2, icon: '🚫' },
    { id: 'phantom_boss', name: 'Hayalet Boss', desc: 'Boss uyarı çizgisi yarı süre', points: 3, icon: '👻' }
  ];

  class GameModeManager {
    constructor() {
      this.mode = 'campaign'; // 'campaign' (10 Wave Sefer Zaferi) veya 'endless' (Sonsuz Rekor)
      this.currentHeatIndex = 0;
      this.activePacts = {};
      this.finalWaveCampaign = 10;
      this.hasTriggeredVictory = false;
    }

    get currentHeat() {
      return HEAT_LEVELS[this.currentHeatIndex];
    }

    getTotalHeatPoints() {
      let pts = this.currentHeatIndex * 2;
      for (const p of MODULAR_PACTS) {
        if (this.activePacts[p.id]) pts += p.points;
      }
      return pts;
    }

    togglePact(pactId) {
      this.activePacts[pactId] = !this.activePacts[pactId];
      this.syncUI();
      if (window.audio && typeof window.audio.playPickup === 'function') {
        window.audio.playPickup();
      }
      this.openHeatPactsModal();
    }

    cycleHeat() {
      this.currentHeatIndex = (this.currentHeatIndex + 1) % HEAT_LEVELS.length;
      this.syncUI();
      if (window.audio && typeof window.audio.playPickup === 'function') {
        window.audio.playPickup();
      }
      return this.currentHeat;
    }

    setHeat(level) {
      if (typeof level === 'number' && level >= 0 && level < HEAT_LEVELS.length) {
        this.currentHeatIndex = level;
        this.syncUI();
        if (window.audio && typeof window.audio.playPickup === 'function') {
          window.audio.playPickup();
        }
      }
      return this.currentHeat;
    }

    openHeatPactsModal() {
      let modal = document.getElementById('heatPactsOverlay');
      const i18n = window.ZortexI18n;
      const getT = (k, fb) => (i18n ? i18n.t(k, fb) : fb);

      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'heatPactsOverlay';
        modal.className = 'overlay hidden';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="neon-box" style="max-width: 720px; max-height: 85vh; overflow-y: auto; text-align: center; border-color: #f97316;">
          <h1 class="title" style="font-size: 24px; color: #f97316; margin: 0 0 4px 0; text-shadow: 0 0 15px rgba(249,115,22,0.6);">
            ${getT('heat_modal_title', '🔥 SİBER TEHLİKE VE CEZA PAKTLARI (PACT OF PUNISHMENT)')}
          </h1>
          <div class="subtitle" style="margin-bottom: 14px; font-size: 12px; color: #94a3b8;">
            ${getT('heat_modal_subtitle', 'Riskini modüler olarak seç, düşmanları güçlendir, ek hurda çarpanı kazan!')}
          </div>
          <div id="heatModalCards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; margin-bottom: 14px;"></div>
          
          <h2 style="font-size: 15px; color: #38bdf8; margin: 12px 0 8px 0; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
            ${getT('heat_modal_modular', '⚙️ MODÜLER CEZA PAKTLARI (BÖLÜM 11.1)')}
          </h2>
          <div id="modularPactsGrid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin-bottom: 16px;"></div>

          <div id="totalHeatDisplay" style="font-size: 14px; font-weight: bold; color: #ffe600; margin-bottom: 16px;"></div>

          <button class="retro-btn start-btn" onclick="document.getElementById('heatPactsOverlay').classList.add('hidden');" style="padding: 10px 32px; font-size: 15px;">
            ${getT('heat_modal_confirm', '✓ ONAYLA & KAPAT')}
          </button>
        </div>
      `;

      const container = document.getElementById('heatModalCards');
      if (container) {
        let html = '';
        HEAT_LEVELS.forEach((h, idx) => {
          const isSelected = idx === this.currentHeatIndex;
          const badgeText = getT('heat_badge_' + idx, h.badge);
          const descText = getT('heat_desc_' + idx, h.desc);
          const selText = isSelected ? getT('pact_selected', '● SEÇİLDİ') : getT('pact_select', 'SEÇ');
          const heatIcon = idx === 0 ? '🛡️' : (idx === 1 ? '⚡' : (idx === 2 ? '🔥' : (idx === 3 ? '🔴' : '💀👑')));
          html += `
            <div class="heat-card ${isSelected ? 'selected' : ''}" 
                 onclick="window.ZortexGameModes.setHeat(${idx}); window.ZortexGameModes.openHeatPactsModal();"
                 style="background: rgba(10, 16, 32, 0.85); border: 2px solid ${isSelected ? h.color : 'rgba(255,255,255,0.15)'}; border-radius: 8px; padding: 10px 6px; cursor: pointer; transition: all 0.2s; box-shadow: ${isSelected ? '0 0 16px ' + h.color : 'none'};">
              <div style="font-size: 20px; margin-bottom: 2px;">${heatIcon}</div>
              <div style="font-size: 12px; font-weight: 900; color: ${h.color}; margin-bottom: 2px;">${badgeText}</div>
              <div style="font-size: 9px; color: #cbd5e1; line-height: 1.2;">${descText}</div>
              <div style="margin-top: 6px; font-size: 9px; font-weight: bold; color: ${isSelected ? '#00f3ff' : '#64748b'};">${selText}</div>
            </div>
          `;
        });
        container.innerHTML = html;
      }

      const pactsContainer = document.getElementById('modularPactsGrid');
      if (pactsContainer) {
        let pactsHtml = '';
        MODULAR_PACTS.forEach(p => {
          const isActive = !!this.activePacts[p.id];
          const pName = getT('pact_name_' + p.id, p.name);
          const pDesc = getT('pact_desc_' + p.id, p.desc);
          const statusText = isActive ? getT('pact_active', '✓ AKTİF') : getT('pact_enable', '+ ETKİNLEŞTİR');
          pactsHtml += `
            <div onclick="window.ZortexGameModes.togglePact('${p.id}');"
                 style="background: ${isActive ? 'rgba(239, 68, 68, 0.22)' : 'rgba(15, 23, 42, 0.75)'}; border: 1.5px solid ${isActive ? '#ef4444' : 'rgba(255,255,255,0.15)'}; border-radius: 6px; padding: 8px; text-align: left; cursor: pointer; transition: all 0.15s;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 12px; font-weight: bold; color: ${isActive ? '#ff6b6b' : '#f1f5f9'};">${p.icon} ${pName}</span>
                <span style="font-size: 10px; background: rgba(0,0,0,0.5); padding: 1px 5px; border-radius: 4px; color: #ffe600;">+${p.points} Heat</span>
              </div>
              <div style="font-size: 9px; color: #94a3b8; line-height: 1.2;">${pDesc}</div>
              <div style="margin-top: 6px; font-size: 9px; font-weight: bold; color: ${isActive ? '#ef4444' : '#64748b'};">${statusText}</div>
            </div>
          `;
        });
        pactsContainer.innerHTML = pactsHtml;
      }

      const totalDisplay = document.getElementById('totalHeatDisplay');
      if (totalDisplay) {
        const totalPts = this.getTotalHeatPoints();
        const scrapBonus = Math.round((this.getScrapMultiplier() - 1.0) * 100);
        const ptsLabel = getT('total_heat_pts', 'TOPLAM HEAT PUANI:');
        const bonusLabel = getT('scrap_bonus', 'HURDA BONUSU:');
        totalDisplay.innerHTML = `${ptsLabel} <span style="color:#ef4444; font-size:16px;">${totalPts}</span> • ${bonusLabel} <span style="color:#00ff66;">+%${scrapBonus}</span>`;
      }

      modal.classList.remove('hidden');
    }

    toggleMode() {
      const modes = ['campaign', 'endless', 'daily'];
      const nextIdx = (modes.indexOf(this.mode) + 1) % modes.length;
      this.mode = modes[nextIdx];
      this.syncUI();
      if (window.audio && typeof window.audio.playPickup === 'function') {
        window.audio.playPickup();
      }
      return this.mode;
    }

    syncUI() {
      const i18n = window.ZortexI18n;
      const getT = (k, fb) => (i18n ? i18n.t(k, fb) : fb);

      const modeBtn = document.getElementById('gameModeBtn');
      if (modeBtn) {
        const target = modeBtn.querySelector('.btn-label') || modeBtn;
        if (this.mode === 'campaign') {
          target.innerHTML = getT('mode_campaign_btn', 'MOD: <b>SEFER</b>');
        } else if (this.mode === 'endless') {
          target.innerHTML = getT('mode_endless_btn', 'MOD: <b>SONSUZ</b>');
        } else if (this.mode === 'daily') {
          const dateStr = window.ZortexDailyRun ? window.ZortexDailyRun.getTodaySeed() : '';
          const dailyPrefix = getT('mode_daily_prefix', 'MOD: <b>GÜNLÜK</b>');
          target.innerHTML = `${dailyPrefix} (#${dateStr})`;
        }
      }

      const heatBtn = document.getElementById('heatLevelBtn');
      if (heatBtn) {
        const h = this.currentHeat;
        heatBtn.style.borderColor = h.color;
        heatBtn.style.color = h.color;
        const heatLbl = getT('heat_label', 'TEHLİKE:');
        const badgeText = getT('heat_badge_' + h.level, h.badge);
        const target = heatBtn.querySelector('.btn-label') || heatBtn;
        target.innerHTML = `${heatLbl} <b>${badgeText}</b>`;
      }

      // HUD Rozetleri
      const hudBadge = document.getElementById('hudModeHeatBadge');
      if (hudBadge) {
        let modeText = getT('mode_hud_campaign', 'SEFER');
        if (this.mode === 'endless') modeText = getT('mode_hud_endless', 'SONSUZ');
        else if (this.mode === 'daily') modeText = getT('mode_hud_daily', 'GÜNLÜK');
        const badgeText = getT('heat_badge_' + this.currentHeat.level, this.currentHeat.badge);
        hudBadge.textContent = `[ ${modeText} • ${badgeText} ]`;
        hudBadge.style.color = this.currentHeat.color;
      }
    }

    /**
     * Düşman Canı ve Hızını Seçilen Heat Kademesine ve Sonsuz Mod Ölçeğine Göre Ölçekler
     */
    applyHeatToEnemy(enemy) {
      if (!enemy) return;
      const h = this.currentHeat;
      let hpMult = h.hpMult;
      let spdMult = h.spdMult;

      if (this.activePacts && this.activePacts.armored_army) hpMult *= 1.25;
      if (this.activePacts && this.activePacts.fast_swarm) spdMult *= 1.15;
      if (this.activePacts && this.activePacts.thick_shield && Math.random() < 0.20) {
        enemy.shield = (enemy.shield || 0) + 120;
      }

      // [FAZ 5] Bölüm 11.2: Sonsuz Mod Ölçekleme (Dalga 10'dan sonra her dalga can +%12)
      if (window.wave && window.wave > 10) {
        const endlessHp = Math.pow(1.12, window.wave - 10);
        hpMult *= endlessHp;
      }

      enemy.maxHp = Math.round(enemy.maxHp * hpMult);
      enemy.hp = enemy.maxHp;
      enemy.speed = enemy.speed * spdMult;
    }

    /**
     * Hurda ve Ödüllere Heat Bonus Çarpanı Ekler
     */
    getScrapMultiplier() {
      const pactBonus = (typeof this.getTotalHeatPoints === 'function') ? (this.getTotalHeatPoints() * 0.10) : 0;
      return this.currentHeat.scrapMult + pactBonus;
    }

    /**
     * Dalga 10 Final Boss'u Öldüğünde Sefer Zaferini Tetikler
     */
    checkRunVictory(wave, bossDead = true) {
      if (this.mode !== 'campaign' || this.hasTriggeredVictory) return false;
      if (wave >= this.finalWaveCampaign && bossDead) {
        this.triggerVictory();
        return true;
      }
      return false;
    }

    triggerVictory() {
      this.hasTriggeredVictory = true;
      window.gameState = 'VICTORY';

      if (window.ZortexDynamicAudio) {
        window.ZortexDynamicAudio.playVictoryFanfare();
      }

      // 500 Zafer Hurda Bonusu
      const victoryBonusScrap = Math.round(500 * this.getScrapMultiplier());
      if (typeof window.runScrap !== 'undefined') {
        window.runScrap += victoryBonusScrap;
      }
      if (typeof window.bankRunScrap === 'function') {
        window.bankRunScrap();
      }

      // Kutlama Patlamaları & Şok Dalgaları
      const W = window.W || 1280;
      const H = window.H || 720;
      if (typeof window.addShockwave === 'function') {
        window.addShockwave(W / 2, H / 2, 0xffe600, 420, 0.75, 6.0);
        window.addShockwave(W / 2 - 200, H / 2, 0x00f3ff, 280, 0.60, 4.0);
        window.addShockwave(W / 2 + 200, H / 2, 0xff00ea, 280, 0.60, 4.0);
      }
      if (typeof particles !== 'undefined' && particles.emit) {
        particles.emit(W / 2, H / 2, '#ffe600', 80, 8.0, 5.0, 1.5);
        particles.emit(W / 2, H / 2, '#00f3ff', 80, 8.0, 5.0, 1.5);
      }

      // Arayüzü Göster
      const overlay = document.getElementById('victoryOverlay');
      if (overlay) {
        document.getElementById('vicTime').textContent = document.getElementById('statTime') ? document.getElementById('statTime').textContent : '10:00';
        document.getElementById('vicKills').textContent = window.kills || 0;
        document.getElementById('vicScore').textContent = window.score || 0;
        document.getElementById('vicBonusScrap').textContent = `+${victoryBonusScrap}`;
        document.getElementById('vicTotalScrap').textContent = (window.meta ? window.meta.scrap : 0);
        if (typeof window.renderWeaponDamageBreakdown === 'function') {
          window.renderWeaponDamageBreakdown('vicWeaponDamageBar', 'vicWeaponDamageLegend');
        }
        overlay.classList.remove('hidden');
      }

      const wBar = document.getElementById('weaponHudBar');
      if (wBar) wBar.classList.add('hidden');
    }

    continueEndless() {
      const overlay = document.getElementById('victoryOverlay');
      if (overlay) overlay.classList.add('hidden');
      this.mode = 'endless';
      this.syncUI();
      window.gameState = 'PLAYING';
      const wBar = document.getElementById('weaponHudBar');
      if (wBar) wBar.classList.remove('hidden');
      if (window.textManager && typeof window.textManager.add === 'function') {
        const W = window.W || 1280;
        const H = window.H || 720;
        window.textManager.add('♾️ SONSUZ MOD ETKİN: DERİN UZAYA DEVAM EDİLİYOR!', W / 2, H / 3, '#00f3ff', 24, 3.0);
      }
    }

    continueAsEndless() {
      return this.continueEndless();
    }
  }

  // Singleton Instance İhracı
  window.ZortexDynamicAudio = new DynamicMusicEngine();
  window.ZortexGameModes = new GameModeManager();
  window.HEAT_LEVELS = HEAT_LEVELS;

})();
