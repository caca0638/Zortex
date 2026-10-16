/**
 * ============================================================================
 * ZORTEX: CYBER SURVIVOR - AAA CYBER AUDIO CORE ENGINE
 * File: js/audio/cyber_audio_engine.js
 * 
 * Architecture:
 *  1. Studio Mastering Chain (Master DynamicsCompressor limiter, Glue Bus)
 *  2. Algorithmic Synthetic Space Reverb (ConvolverNode with Stereo Impulse)
 *  3. Dynamic Music Ducking (Sidechain-style gain dipping during massive SFX)
 *  4. 3D Spatial Audio & Panning (StereoPannerNode & Distance Attenuation)
 *  5. Layered Sound Design (Sub-bass punch, transient click, detune jitter)
 *  6. Extensible Sound & Weapon/Skill/Enemy Registry (audio.registerSound / playSpatial)
 *  7. EVA Cybernetic Ship AI Voice (window.speechSynthesis with tactical cyber pitch)
 *  8. Web Gamepad Haptics (DualSense / Xbox vibrationActuator profiles)
 *  9. Acoustic Environmental Presets (Deep Space, Hangar, Critical Muffle)
 * ============================================================================
 */
(function() {
  'use strict';

  class CyberAudioEngine {
    constructor() {
      this.audio = null;          // Reference to game's AudioEngine
      this.ctx = null;
      this.isInitialized = false;

      // Studio Mastering Nodes
      this.masterCompressor = null;
      this.convolver = null;
      this.reverbGain = null;
      this.duckingGain = null;
      this.duckingTimer = null;

      // Anti-Spam Rate Limiters per sound
      this.rateLimits = new Map();

      // Sound Registry for modular weapons, enemies, skills
      this.registry = new Map();

      // Gamepad Haptics
      this.rumbleEnabled = true;

      // Current Acoustic Preset
      this.currentPreset = 'deep_space';

      // Cancel any ongoing browser speech synthesis
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
    }

    /**
     * Hooks and upgrades the game's core AudioEngine
     */
    setup(audioEngine) {
      if (!audioEngine) return;
      this.audio = audioEngine;
      window.ZortexCyberAudio = this;
      audioEngine.cyber = this;

      // Hook audio.init to build the mastering chain once AudioContext exists
      const originalInit = audioEngine.init.bind(audioEngine);
      const self = this;

      audioEngine.init = function() {
        originalInit();
        if (this.ctx && !self.isInitialized) {
          self.ctx = this.ctx;
          self.buildMasteringChain();
          self.enhanceAudioEngineMethods();
          self.registerDefaultSFX();
          self.isInitialized = true;
        }
      };

      // Expose convenience direct calls on audio instance
      audioEngine.playSpatial = (sfxId, x, y, opts) => self.playSpatial(sfxId, x, y, opts);
      audioEngine.playLayeredSFX = (id, opts) => self.play(id, opts);
      audioEngine.play = (id, opts) => self.play(id, opts);
      audioEngine.registerSound = (id, def) => self.registerSound(id, def);
      audioEngine.speakEVA = (key, custom) => self.speakEVA(key, custom);
      audioEngine.triggerHaptic = (profile, str) => self.triggerHaptic(profile, str);
      audioEngine.triggerDucking = (amt, dur) => self.triggerDucking(amt, dur);
      audioEngine.setAcousticPreset = (preset) => self.setAcousticPreset(preset);

      // If AudioEngine was already initialized prior to setup
      if (audioEngine.ctx && !this.isInitialized) {
        this.ctx = audioEngine.ctx;
        this.buildMasteringChain();
        this.enhanceAudioEngineMethods();
        this.registerDefaultSFX();
        this.isInitialized = true;
      }
    }

    /**
     * 1. Stüdyo Mastering Zinciri & Reverb Bus Kurulumu
     */
    buildMasteringChain() {
      if (!this.ctx) return;
      const ctx = this.ctx;

      try {
        // A. Dynamic Music Ducking Gain Node (musicGain -> duckingGain -> masterFilter)
        this.duckingGain = ctx.createGain();
        this.duckingGain.gain.value = 1.0;

        if (this.audio.musicGain && this.audio.masterFilter) {
          try { this.audio.musicGain.disconnect(); } catch (e) {}
          this.audio.musicGain.connect(this.duckingGain);
          this.duckingGain.connect(this.audio.masterFilter);
        }

        // B. Algoritmik Stereo Uzay Reverb (ConvolverNode)
        const impulse = this.createSyntheticImpulse(1.2, 2.5);
        this.convolver = ctx.createConvolver();
        this.convolver.buffer = impulse;

        this.reverbGain = ctx.createGain();
        this.reverbGain.gain.value = 0.14; // İdeal siber uzay derinliği

        this.convolver.connect(this.reverbGain);
        if (this.audio.masterFilter) {
          this.reverbGain.connect(this.audio.masterFilter);
        }

        // C. Master DynamicsCompressor (Glue Limiter)
        // Kulak tırmalamayan, stüdyo miksajı standardında (-8dB, 12:1 ratio)
        this.masterCompressor = ctx.createDynamicsCompressor();
        this.masterCompressor.threshold.setValueAtTime(-8.0, ctx.currentTime);
        this.masterCompressor.knee.setValueAtTime(12.0, ctx.currentTime);
        this.masterCompressor.ratio.setValueAtTime(12.0, ctx.currentTime);
        this.masterCompressor.attack.setValueAtTime(0.003, ctx.currentTime);
        this.masterCompressor.release.setValueAtTime(0.25, ctx.currentTime);

        // Eski bağlantıyı koparıp kompresörü araya sok: masterFilter -> masterCompressor -> analyser -> destination
        if (this.audio.masterFilter && this.audio.analyser) {
          try { this.audio.masterFilter.disconnect(); } catch (e) {}
          this.audio.masterFilter.connect(this.masterCompressor);
          this.masterCompressor.connect(this.audio.analyser);
        } else if (this.audio.masterFilter) {
          try { this.audio.masterFilter.disconnect(); } catch (e) {}
          this.audio.masterFilter.connect(this.masterCompressor);
          this.masterCompressor.connect(ctx.destination);
        }
      } catch (err) {
        console.warn('[ZortexCyberAudio] Mastering zinciri uyarısı:', err);
      }
    }

    /**
     * Algoritmik Sentetik Stereo Impulse Response (Uzay Yankısı)
     */
    createSyntheticImpulse(durationSec = 1.2, decay = 2.5) {
      if (!this.ctx) return null;
      const rate = this.ctx.sampleRate;
      const length = Math.floor(rate * durationSec);
      const impulse = this.ctx.createBuffer(2, length, rate);
      const left = impulse.getChannelData(0);
      const right = impulse.getChannelData(1);

      for (let i = 0; i < length; i++) {
        const t = i / length;
        // Eksponansiyel sönümlenme ve hafif stereo faz farkı
        const factor = Math.pow(1 - t, decay);
        left[i] = (Math.random() * 2 - 1) * factor;
        right[i] = (Math.random() * 2 - 1) * factor * 0.95;
      }
      return impulse;
    }

    /**
     * Dinamik Müzik Ducking (Sidechain) Tetikleyicisi
     */
    triggerDucking(amount = 0.45, durationSec = 0.35) {
      if (!this.ctx || !this.duckingGain || this.audio.muted) return;
      const now = this.ctx.currentTime;
      try {
        this.duckingGain.gain.cancelScheduledValues(now);
        this.duckingGain.gain.setValueAtTime(this.duckingGain.gain.value, now);
        this.duckingGain.gain.linearRampToValueAtTime(Math.max(0.05, amount), now + 0.04);
        this.duckingGain.gain.exponentialRampToValueAtTime(1.0, now + durationSec);
      } catch (e) {}
    }

    /**
     * 3D Konumsal Ses (Stereo Pan ve Mesafe Zayıflaması)
     */
    createSpatialRoute(x, y) {
      if (!this.ctx) return { dest: this.audio ? this.audio.sfxGain : null, pan: 0, vol: 1 };
      const ctx = this.ctx;
      const W = window.innerWidth || 1280;
      const H = window.innerHeight || 720;
      const p = window.player || { x: W / 2, y: H / 2 };

      let panValue = 0;
      let distVol = 1.0;

      if (typeof x === 'number' && typeof y === 'number') {
        const dx = x - p.x;
        const dy = y - p.y;
        panValue = Math.max(-0.95, Math.min(0.95, dx / (W * 0.55)));
        const dist = Math.hypot(dx, dy);
        const maxDist = Math.max(W, H) * 0.9;
        distVol = Math.max(0.35, Math.min(1.0, 1.0 - (dist / maxDist) * 0.55));
      }

      // StereoPannerNode oluştur
      let panner = null;
      if (typeof ctx.createStereoPanner === 'function') {
        try {
          panner = ctx.createStereoPanner();
          panner.pan.setValueAtTime(panValue, ctx.currentTime);
        } catch (e) {
          panner = null;
        }
      }

      const localGain = ctx.createGain();
      localGain.gain.value = distVol;

      if (panner) {
        panner.connect(localGain);
      }

      // Çıkış bağlantıları: sfxGain + subtle reverb
      if (this.audio && this.audio.sfxGain) {
        localGain.connect(this.audio.sfxGain);
      }
      if (this.convolver && this.reverbGain) {
        // Hafif mesafe bazlı reverb gönderimi
        const reverbSend = ctx.createGain();
        reverbSend.gain.value = 0.22;
        localGain.connect(reverbSend);
        reverbSend.connect(this.convolver);
      }

      return {
        input: panner ? panner : localGain,
        pan: panValue,
        vol: distVol
      };
    }

    /**
     * Gamepad Haptik Titreşimi (DualSense / Xbox / Standard Gamepad)
     */
    triggerHaptic(profile = 'shot', strength = 1.0) {
      if (typeof window === 'undefined' || !window.navigator || !window.navigator.getGamepads) return;
      const settings = window.gameSettings || {};
      if (settings.rumbleEnabled === false || !this.rumbleEnabled) return;

      const gamepads = window.navigator.getGamepads();
      if (!gamepads) return;

      const profiles = {
        shot:       { duration: 32,  weak: 0.20, strong: 0.05 },
        hit:        { duration: 80,  weak: 0.45, strong: 0.60 },
        explosion:  { duration: 170, weak: 0.35, strong: 0.85 },
        heavy_exp:  { duration: 250, weak: 0.50, strong: 1.00 },
        ultimate:   { duration: 340, weak: 0.85, strong: 1.00 },
        heartbeat:  { duration: 60,  weak: 0.10, strong: 0.45 },
        level_up:   { duration: 110, weak: 0.55, strong: 0.35 }
      };

      const cfg = profiles[profile] || profiles.shot;
      const s = Math.max(0.1, Math.min(1.5, strength));

      for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i];
        if (gp && gp.vibrationActuator && typeof gp.vibrationActuator.playEffect === 'function') {
          try {
            gp.vibrationActuator.playEffect('dual-rumble', {
              startDelay: 0,
              duration: cfg.duration,
              weakMagnitude: Math.min(1.0, cfg.weak * s),
              strongMagnitude: Math.min(1.0, cfg.strong * s)
            }).catch(() => {});
          } catch (e) {}
        }
      }
    }

    /**
     * Konuşma sesi devredışı bırakıldı (Gereksiz yapay sesleri engellemek için no-op)
     */
    speakEVA(phraseKey, customText = '') {
      // Devredışı - Konuşma sesi tamamen kaldırılmıştır
    }

    /**
     * Akustik Ortam Önayarları
     */
    setAcousticPreset(preset = 'deep_space') {
      this.currentPreset = preset;
      if (!this.audio || !this.ctx || !this.audio.masterFilter) return;

      const now = this.ctx.currentTime;
      switch (preset) {
        case 'hangar':
          this.audio.masterFilter.frequency.setTargetAtTime(14000, now, 0.2);
          if (this.reverbGain) this.reverbGain.gain.setTargetAtTime(0.32, now, 0.2);
          break;
        case 'critical_muffle':
          this.audio.masterFilter.frequency.setTargetAtTime(480, now, 0.15);
          if (this.reverbGain) this.reverbGain.gain.setTargetAtTime(0.28, now, 0.15);
          break;
        case 'pause':
          this.audio.masterFilter.frequency.setTargetAtTime(800, now, 0.12);
          if (this.reverbGain) this.reverbGain.gain.setTargetAtTime(0.20, now, 0.12);
          break;
        case 'deep_space':
        default:
          this.audio.masterFilter.frequency.setTargetAtTime(22000, now, 0.2);
          if (this.reverbGain) this.reverbGain.gain.setTargetAtTime(0.14, now, 0.2);
          break;
      }
    }

    /**
     * 2. Mevcut AudioEngine Yöntemlerini Katmanlı & Mekânsal Mimaride Genişletme
     */
    enhanceAudioEngineMethods() {
      const audio = this.audio;
      const self = this;

      // --- KATMANLI PATLAMA (Uzay Vakumu Akustiği: Gövde Rezonansı & Plazma Sönümlenmesi) ---
      const origExplosion = audio.playExplosion.bind(audio);
      audio.playExplosion = function(intensity = 1, x, y) {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        if (now - this.lastSfxTimes.explosion < 0.038) return;
        this.lastSfxTimes.explosion = now;

        // EĞER AUDİOBROKER FOLEY MEVCUTSA: Uzay akustiği ses bankasına devret
        if (window.ZortexAudioBroker && window.ZortexAudioBroker.hasSound('explosion_crunch')) {
          origExplosion(intensity, x, y);
          if (intensity >= 2.2) {
            self.triggerDucking(0.18, 0.3);
            self.triggerHaptic('heavy_exp', intensity);
          } else {
            self.triggerHaptic('explosion', intensity);
          }
          return;
        }

        const route = self.createSpatialRoute(x, y);
        const dest = route.input;

        // Katman 1: Sub-bass 54Hz -> 22Hz Gövde Titreşimi (Yumuşak Kokpit Rezonansı)
        try {
          const subOsc = this.ctx.createOscillator();
          const subGain = this.ctx.createGain();
          subOsc.type = 'sine';
          const startF = 54 * Math.min(1.2, intensity);
          subOsc.frequency.setValueAtTime(startF, now);
          subOsc.frequency.exponentialRampToValueAtTime(22, now + 0.22);
          const subVol = 0.22 * Math.min(1.2, intensity);
          subGain.gain.setValueAtTime(0.001, now);
          subGain.gain.linearRampToValueAtTime(subVol, now + 0.005);
          subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
          subOsc.connect(subGain);
          subGain.connect(dest);
          subOsc.start(now);
          subOsc.stop(now + 0.25);
        } catch (e) {}

        // Katman 2: Vakumda Boğuk Plazma Dağılması (150Hz -> 25Hz Muffled Space Dissipation)
        try {
          const noise = this.ctx.createBufferSource();
          noise.buffer = this.noiseBuffer || self.createSyntheticImpulse(0.3, 2.0);
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(Math.min(160, 130 * intensity), now);
          filter.frequency.exponentialRampToValueAtTime(25, now + 0.25);

          const noiseGain = this.ctx.createGain();
          noiseGain.gain.setValueAtTime(0.001, now);
          noiseGain.gain.linearRampToValueAtTime(0.09 * intensity, now + 0.006);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

          noise.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(dest);
          noise.start(now);
          noise.stop(now + 0.27);
        } catch (e) {}

        // Katman 3: Kuantum İyon Sönümü (Yumuşak Ethereal Plazma Glissando, Sıfır Karasal Çıtırtı)
        try {
          const ionOsc = this.ctx.createOscillator();
          const ionGain = this.ctx.createGain();
          ionOsc.type = 'triangle';
          ionOsc.frequency.setValueAtTime(130 + (Math.random() - 0.5) * 20, now);
          ionOsc.frequency.exponentialRampToValueAtTime(32, now + 0.16);
          ionGain.gain.setValueAtTime(0.001, now);
          ionGain.gain.linearRampToValueAtTime(0.04 * intensity, now + 0.004);
          ionGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          ionOsc.connect(ionGain);
          ionGain.connect(dest);
          ionOsc.start(now);
          ionOsc.stop(now + 0.19);
        } catch (e) {}

        // Dinamik Ducking & Haptik (Yalnızca devasa boss imhalarında yumuşak geçiş)
        if (intensity >= 2.2) {
          self.triggerDucking(0.18, 0.3);
          self.triggerHaptic('heavy_exp', intensity);
        } else {
          self.triggerHaptic('explosion', intensity);
        }
      };

      // --- KATMANLI LAZER (AudioBroker Foley + Detune Jitter + Transient Click) ---
      const origLaser = audio.playLaser.bind(audio);
      audio.playLaser = function(pitch = 1, x, y) {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        if (now - this.lastSfxTimes.laser < 0.028) return;
        this.lastSfxTimes.laser = now;

        // EĞER AUDİOBROKER FOLEY MEVCUTSA: Gerçek ses bankasına devret + haptik ekle
        if (window.ZortexAudioBroker && window.ZortexAudioBroker.hasSound('laser_blaster')) {
          origLaser(pitch, x, y);
          self.triggerHaptic('shot', 0.8);
          return;
        }

        const route = self.createSpatialRoute(x, y);
        const dest = route.input;

        // Robotik tekdüzeliği kıran Mikro-Detune Jitter
        const jitter = 1 + (Math.random() - 0.5) * 0.08;
        const finalPitch = pitch * jitter;

        // Katman 1: Ana Lazer Sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(840 * finalPitch, now);
        osc.frequency.exponentialRampToValueAtTime(130 * finalPitch, now + 0.11);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3200, now);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.12);

        // Katman 2: Transiyent Click (4 kHz 6ms)
        try {
          const click = this.ctx.createOscillator();
          const clickGain = this.ctx.createGain();
          click.type = 'triangle';
          click.frequency.setValueAtTime(3600 * finalPitch, now);
          clickGain.gain.setValueAtTime(0.18, now);
          clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
          click.connect(clickGain);
          clickGain.connect(dest);
          click.start(now);
          click.stop(now + 0.018);
        } catch (e) {}

        self.triggerHaptic('shot', 0.8);
      };

      // --- KATMANLI RAILGUN (AudioBroker Foley + Hipersonik Elektromanyetik Şok) ---
      const origRailgunFire = (typeof audio.playRailgunFire === 'function') ? audio.playRailgunFire.bind(audio) : null;
      audio.playRailgunFire = function(x, y) {
        if (!this.ctx || this.muted) return;
        if (window.ZortexAudioBroker && window.ZortexAudioBroker.hasSound('laser_railgun') && origRailgunFire) {
          origRailgunFire(x, y);
          self.triggerHaptic('ultimate', 1.0);
          return;
        }

        const now = this.ctx.currentTime;
        const route = self.createSpatialRoute(x, y);
        const dest = route.input;

        // Katman: Yüksek Enerjili Hipersonik Elektromanyetik Işın (Sıfır Karasal Patlama)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1500, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.30);
        gain.gain.setValueAtTime(0.20, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.33);

        self.triggerHaptic('ultimate', 1.0);
      };

      // --- GÜÇLENDİRİLMİŞ KALKAN KIRILMASI ---
      const origShieldBreak = audio.playShieldBreak.bind(audio);
      audio.playShieldBreak = function(x, y) {
        origShieldBreak(x, y);
        self.triggerHaptic('hit', 1.3);
        self.triggerDucking(0.5, 0.35);
      };

      // --- GÜÇLENDİRİLMİŞ OVERDRIVE / ULTIMATE ---
      const origUltimate = audio.playUltimate.bind(audio);
      audio.playUltimate = function() {
        origUltimate();
        self.triggerDucking(0.2, 0.7);
        self.triggerHaptic('ultimate', 1.4);
      };

      // --- GÜÇLENDİRİLMİŞ BOSS FAZ GEÇİŞİ ---
      const origBossPhase = audio.playBossPhase.bind(audio);
      audio.playBossPhase = function() {
        origBossPhase();
        self.triggerDucking(0.15, 0.9);
        self.triggerHaptic('heavy_exp', 1.5);
      };

      // --- DÜŞÜK CAN BOĞULMASI & KALP ATIŞI HAPTİĞİ ---
      const origLowHealthMuffle = audio.setLowHealthMuffle.bind(audio);
      audio.setLowHealthMuffle = function(isLow) {
        origLowHealthMuffle(isLow);
        if (isLow) {
          self.setAcousticPreset('critical_muffle');
        } else {
          if (self.currentPreset === 'critical_muffle') {
            self.setAcousticPreset('deep_space');
          }
        }
      };

      const origHeartbeat = audio.playHeartbeat.bind(audio);
      audio.playHeartbeat = function() {
        origHeartbeat();
        self.triggerHaptic('heartbeat', 0.9);
      };
    }

    /**
     * 3. Genişletilebilir Ses Kayıt & Tetikleme Sistemi (Sound Registry)
     * Yeni düşmanlar, silahlar ve skiller için tek elden modüler kayıt
     */
    registerSound(id, config) {
      if (!id || typeof config !== 'object') return;
      this.registry.set(id, {
        category: config.category || 'sfx',
        maxRate: config.maxRate || 25,
        handler: config.handler || null
      });
    }

    /**
     * Kayıtlı sesi çal (Genel Dispatcher)
     */
    play(id, opts = {}) {
      if (!this.ctx || (this.audio && this.audio.muted)) return;
      const def = this.registry.get(id);
      if (!def || typeof def.handler !== 'function') return;

      const now = this.ctx.currentTime;
      const lastTime = this.rateLimits.get(id) || 0;
      const minInterval = 1.0 / def.maxRate;
      if (now - lastTime < minInterval) return;
      this.rateLimits.set(id, now);

      const route = this.createSpatialRoute(opts.x, opts.y);
      try {
        def.handler(this.ctx, route.input, this.convolver, opts);
      } catch (err) {
        console.warn(`[ZortexCyberAudio] '${id}' çalınırken hata:`, err);
      }
    }

    /**
     * 3D Konumsal Sesi Koordinatlarla Çal
     */
    playSpatial(id, x, y, opts = {}) {
      const mergedOpts = Object.assign({}, opts, { x, y });
      // Eğer doğrudan AudioEngine'de yerleşik bir metod ise
      if (this.audio && typeof this.audio[id] === 'function') {
        this.audio[id](mergedOpts.pitch || mergedOpts.intensity || 1, x, y);
      } else {
        this.play(id, mergedOpts);
      }
    }

    /**
     * Gelecek Silahlar, Düşmanlar ve Beceriler İçin Hazır AAA Ses Bankası
     */
    registerDefaultSFX() {
      // 1. GATLING LAZER BARRAGE (Hızlı, tok mekanik tarama)
      this.registerSound('gatling_laser_barrage', {
        category: 'weapon',
        maxRate: 35,
        handler: (ctx, dest, reverb, { pitch = 1.3 }) => {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const detune = (Math.random() - 0.5) * 70;
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(620 * pitch, now);
          osc.frequency.exponentialRampToValueAtTime(140 * pitch, now + 0.055);
          osc.detune.setValueAtTime(detune, now);
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(now);
          osc.stop(now + 0.065);
          this.triggerHaptic('shot', 0.6);
        }
      });

      // 2. GLACIER LANCE CRYO BEAM (Dondurucu Buz Çatırtısı & Lazer)
      this.registerSound('glacier_lance_fire', {
        category: 'weapon',
        maxRate: 12,
        handler: (ctx, dest, reverb, { pitch = 1 }) => {
          const now = ctx.currentTime;
          // Buz kristali tınısı (Sine + Shimmer)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1400 * pitch, now);
          osc.frequency.exponentialRampToValueAtTime(320 * pitch, now + 0.18);
          gain.gain.setValueAtTime(0.32, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(now);
          osc.stop(now + 0.21);
          this.triggerHaptic('shot', 0.9);
        }
      });

      // 3. THUNDER TEMPEST (Şimşek / Ark Boşalımı)
      this.registerSound('thunder_tempest_strike', {
        category: 'weapon',
        maxRate: 15,
        handler: (ctx, dest, reverb, { intensity = 1 }) => {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1900 + Math.random() * 500, now);
          osc.frequency.exponentialRampToValueAtTime(120, now + 0.14);
          gain.gain.setValueAtTime(0.28 * intensity, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(now);
          osc.stop(now + 0.16);
          this.triggerHaptic('hit', 1.0);
        }
      });

      // 4. SUPERNOVA BURST (Kozmik Patlama)
      this.registerSound('supernova_burst', {
        category: 'weapon',
        maxRate: 5,
        handler: (ctx, dest, reverb, { intensity = 1.6 }) => {
          this.audio.playExplosion(intensity);
          this.triggerDucking(0.2, 0.6);
          this.triggerHaptic('heavy_exp', 1.3);
        }
      });

      // 5. YENİ DÜŞMAN: DRONE ATEŞİ
      this.registerSound('enemy_drone_shoot', {
        category: 'enemy',
        maxRate: 20,
        handler: (ctx, dest, reverb, { pitch = 0.9 }) => {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(480 * pitch, now);
          osc.frequency.exponentialRampToValueAtTime(110 * pitch, now + 0.08);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(now);
          osc.stop(now + 0.09);
        }
      });

      // 6. YENİ DÜŞMAN: PHANTOM TELEPORT / SIZMA
      this.registerSound('enemy_phantom_teleport', {
        category: 'enemy',
        maxRate: 6,
        handler: (ctx, dest, reverb) => {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(900, now);
          osc.frequency.linearRampToValueAtTime(180, now + 0.15);
          gain.gain.setValueAtTime(0.24, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(now);
          osc.stop(now + 0.17);
        }
      });

      // 7. YENİ SKILL: KUANTUM BARİYERİ
      this.registerSound('skill_quantum_barrier', {
        category: 'skill',
        maxRate: 5,
        handler: (ctx, dest, reverb) => {
          const now = ctx.currentTime;
          [340, 510, 680].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.03);
            gain.gain.setValueAtTime(0.22, now + i * 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.2);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(now + i * 0.03);
            osc.stop(now + i * 0.03 + 0.22);
          });
          this.triggerHaptic('hit', 0.8);
        }
      });
    }
  }

  // Singleton oluştur ve pencereye ekle
  const cyberAudioInstance = new CyberAudioEngine();
  window.ZortexCyberAudio = cyberAudioInstance;

})();
