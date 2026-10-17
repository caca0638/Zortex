/**
 * ============================================================================
 * ZORTEX: CYBER SURVIVOR — AUDIO BROKER (DİNAMİK SES BANKASI ÇEKİRDEĞİ)
 * File: js/audio/audio_broker.js
 * 
 * Mimari Özellikler:
 *  1. Harici Foley Yükleme (WAV / MP3 / OGG Asenkron Fetch & AudioBuffer Decode)
 *  2. Stüdyo Standardı DynamicsCompressor (Master Brickwall Limiter & Category Bus)
 *  3. Organik Çalma Varyasyonu (Pitch & Gain %2 - %5 Randomization)
 *  4. 3D Uzamsal Ses (Stereo Panning & Mesafe Zayıflaması)
 *  5. Polifoni & Voice Stealing (Aşırı ses yığılmasını önleyen ses sınırı)
 *  6. Hibrit Yedekleme (Foley yüklenene kadar procedural synth köprüsü)
 * ============================================================================
 */
(function() {
  'use strict';

  class AudioBroker {
    constructor() {
      this.ctx = null;
      this.isInitialized = false;

      // Kayıtlı ses yapılandırmaları ve yüklenmiş tamponlar (AudioBuffers)
      this.soundConfigs = new Map(); // id -> config
      this.buffers = new Map();      // id -> AudioBuffer (ilk veya tekil buffer)
      this.samplePools = new Map();  // id -> Array of AudioBuffer (çoklu varyasyon havuzu)
      this.lastPlayedIndex = new Map(); // id -> number (son çalınan varyasyon indeksi)
      this.loadingPromises = new Map(); // id -> Promise
      this.urlBufferCache = new Map();  // url -> Promise<AudioBuffer> (URL bazlı evrensel önbellek)

      // Aktif ses oynatıcıları (Voices)
      this.activeVoices = new Set();
      this.voicesBySoundId = new Map(); // id -> Set of voice handles

      // Mastering ve Bus Düğümleri
      this.masterCompressor = null;
      this.masterGain = null;
      this.categoryBuses = new Map(); // 'sfx', 'music', 'ambient', 'ui' -> GainNode

      // İstatistik ve Metrikler
      this.stats = {
        totalPlayed: 0,
        activeVoiceCount: 0,
        loadedBuffersCount: 0,
        fallbacksTriggered: 0
      };

      // Prosedürel Ses Yedekleme Kancası (Fallback Handler)
      this.fallbackHandler = null;

      // Kullanıcı Ayarları (Dengelenmiş & Aşırılıktan Uzak Seviyeler)
      this.masterVolume = 0.85;
      this.sfxVolume = 0.70;
      this.musicVolume = 0.75;
      this.muted = false;
    }

    /**
     * Ses kimliğinin (id) AudioBroker tamponlarında hazır olup olmadığını kontrol eder
     */
    hasSound(id) {
      if (!id) return false;
      const pool = this.samplePools.get(id);
      if (pool && pool.length > 0) return true;
      return this.buffers.has(id);
    }

    /**
     * Web Audio API Context ve Mastering Zincirini Başlatır
     * @param {AudioContext} [existingCtx] Mevcut context varsa devralır
     */
    init(existingCtx = null) {
      if (this.isInitialized && this.ctx && this.ctx.state !== 'closed') return;

      if (existingCtx) {
        this.ctx = existingCtx;
      } else if (typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }

      if (!this.ctx) {
        console.warn('[AudioBroker] Web Audio API bu tarayıcıda desteklenmiyor.');
        return;
      }

      const now = this.ctx.currentTime;

      // 1. MASTER BRICKWALL DYNAMICS COMPRESSOR (Ses patlamalarını ve çamurlaşmayı önler)
      this.masterCompressor = this.ctx.createDynamicsCompressor();
      this.masterCompressor.threshold.setValueAtTime(-8.0, now); // -8 dB tepe sınırı
      this.masterCompressor.knee.setValueAtTime(8.0, now);       // 8 dB yumuşak dirsek
      this.masterCompressor.ratio.setValueAtTime(14.0, now);     // 14:1 sert sınırlama
      this.masterCompressor.attack.setValueAtTime(0.003, now);   // 3 ms anlık tepe yakalama
      this.masterCompressor.release.setValueAtTime(0.12, now);   // 120 ms sönümlenme

      // 2. MASTER GAIN
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0.0 : this.masterVolume, now);

      // Mastering Zinciri Bağlantısı: [Compressor] -> [MasterGain] -> [Destination]
      this.masterCompressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // 3. KATEGORİ BUS'LARI (SFX, Müzik, Ambiyans, UI)
      const categories = ['sfx', 'music', 'ambient', 'ui'];
      categories.forEach(cat => {
        const bus = this.ctx.createGain();
        let busVol = this.sfxVolume;
        if (cat === 'music') busVol = this.musicVolume;
        else if (cat === 'ui') busVol = 0.55;
        else if (cat === 'ambient') busVol = 0.60;
        bus.gain.setValueAtTime(busVol, now);
        bus.connect(this.masterCompressor);
        this.categoryBuses.set(cat, bus);
      });

      this.isInitialized = true;
      console.log('[AudioBroker] AAA Audio Broker ve Mastering Zinciri başarıyla kuruldu.');
    }

    /**
     * Tarayıcı autoplay kısıtlamalarını aşmak için etkileşim anında AudioContext'i uyandırır
     */
    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    /**
     * Foley sesini yapılandırır (URL veya çoklu varyasyon dizisi, polifoni limiti, jitter)
     * @param {string} id Ses tanıtıcısı (örn: 'laser_blaster', 'explosion_crunch')
     * @param {Object} config Yapılandırma parametreleri
     */
    register(id, config = {}) {
      const defaultConfig = {
        src: null,                 // Tekil dosya yolu
        sources: null,             // Çoklu varyasyon havuzu (Array of string)
        category: 'sfx',           // 'sfx' | 'music' | 'ambient' | 'ui'
        maxConcurrent: 6,          // Aynı anda çalabilecek azami ses kopyası
        baseVolume: 1.0,           // Temel ses seviyesi
        pitchJitter: 0.035,        // %3.5 varsayılan frekans rastgeleliği
        gainJitter: 0.030,         // %3.0 varsayılan şiddet rastgeleliği
        loop: false,
        spatial: true,             // 3D panning aktif mi?
        cooldownMs: 25             // Aynı sesin kare başı üst üste tetiklenme filtresi
      };

      const finalConfig = Object.assign({}, defaultConfig, config);
      this.soundConfigs.set(id, finalConfig);

      if (!this.voicesBySoundId.has(id)) {
        this.voicesBySoundId.set(id, new Set());
      }
      if (!this.samplePools.has(id)) {
        this.samplePools.set(id, []);
      }

      if (Array.isArray(finalConfig.sources) && finalConfig.sources.length > 0) {
        return this.loadSamplePool(id, finalConfig.sources);
      } else if (finalConfig.src && typeof finalConfig.src === 'string') {
        return this.loadSound(id, finalConfig.src);
      }
      return Promise.resolve(null);
    }

    /**
     * URL'den tekil ses dosyasını çözer, evrensel önbellekte saklar (Zero-Duplicate)
     * @param {string} url Ses dosyasının web/yerel yolu
     * @returns {Promise<AudioBuffer>}
     */
    async fetchAndDecode(url) {
      if (this.urlBufferCache.has(url)) {
        return this.urlBufferCache.get(url);
      }
      this.init();

      const promise = (async () => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} - ${response.statusText}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
          return audioBuffer;
        } catch (err) {
          console.warn(`[AudioBroker] '${url}' çözülemedi:`, err.message);
          return null;
        }
      })();

      this.urlBufferCache.set(url, promise);
      return promise;
    }

    /**
     * Dışarıdan tekil ses dosyasını asenkron olarak indirir ve çözer
     */
    async loadSound(id, url) {
      if (this.buffers.has(id)) return this.buffers.get(id);
      const audioBuffer = await this.fetchAndDecode(url);
      if (audioBuffer) {
        this.buffers.set(id, audioBuffer);
        const pool = this.samplePools.get(id) || [];
        if (!pool.includes(audioBuffer)) pool.push(audioBuffer);
        this.samplePools.set(id, pool);
        this.stats.loadedBuffersCount = this.urlBufferCache.size;
      }
      return audioBuffer;
    }

    /**
     * Çoklu varyasyon havuzunu (AudioBuffer[]) paralel olarak yükler
     */
    async loadSamplePool(id, urls) {
      if (!Array.isArray(urls) || urls.length === 0) return [];
      const pool = this.samplePools.get(id) || [];
      const promises = urls.map(url => this.fetchAndDecode(url));
      const loadedBuffers = await Promise.all(promises);

      loadedBuffers.forEach(b => {
        if (b && !pool.includes(b)) pool.push(b);
      });

      this.samplePools.set(id, pool);
      if (pool.length > 0) {
        this.buffers.set(id, pool[0]);
      }
      this.stats.loadedBuffersCount = this.urlBufferCache.size;
      return pool;
    }

    /**
     * Çoklu ses dosyası listesini toplu yükler
     */
    async loadManifest(manifest, onProgress = null) {
      if (!Array.isArray(manifest) || manifest.length === 0) return;
      let loaded = 0;
      const total = manifest.length;

      const promises = manifest.map(async item => {
        await this.register(item.id, item);
        loaded++;
        if (typeof onProgress === 'function') {
          onProgress(loaded, total);
        }
      });

      await Promise.all(promises);
      console.log(`[AudioBroker] AAA Foley ses bankası yüklendi: ${loaded}/${total} paket (${this.urlBufferCache.size} toplam ses örneği).`);
    }

    /**
     * Zortex için Yüksek Kalite CC0 AAA Foley Paketlerini Önceden Yükler
     */
    preloadDefaultGameAudio() {
      const defaultManifest = [
        // 1. Standart Blaster Lazerleri (5 Farklı varyasyon - Kısılmış & Kulak Yormayan)
        {
          id: 'laser_blaster',
          sources: [
            'assets/audio/sci-fi-sounds/Audio/laserSmall_000.ogg',
            'assets/audio/sci-fi-sounds/Audio/laserSmall_001.ogg',
            'assets/audio/sci-fi-sounds/Audio/laserSmall_002.ogg',
            'assets/audio/sci-fi-sounds/Audio/laserSmall_003.ogg',
            'assets/audio/sci-fi-sounds/Audio/laserSmall_004.ogg'
          ],
          category: 'sfx',
          maxConcurrent: 10,
          pitchJitter: 0.045,
          gainJitter: 0.03,
          baseVolume: 0.35
        },
        // 2. Plazma Işını / Spread (5 Ağır plazma atımı varyasyonu)
        {
          id: 'laser_plasma',
          sources: [
            'assets/audio/sci-fi-sounds/Audio/laserLarge_000.ogg',
            'assets/audio/sci-fi-sounds/Audio/laserLarge_001.ogg',
            'assets/audio/sci-fi-sounds/Audio/laserLarge_002.ogg',
            'assets/audio/sci-fi-sounds/Audio/laserLarge_003.ogg',
            'assets/audio/sci-fi-sounds/Audio/laserLarge_004.ogg'
          ],
          category: 'sfx',
          maxConcurrent: 8,
          pitchJitter: 0.035,
          gainJitter: 0.03,
          baseVolume: 0.35
        },
        // 3. Railgun / Elektromanyetik Şok (5 Retro hiper-lazer varyasyonu)
        {
          id: 'laser_railgun',
          sources: [
            'assets/audio/sci-fi-sounds/Audio/laserRetro_000.ogg',
            'assets/audio/sci-fi-sounds/Audio/laserRetro_001.ogg',
            'assets/audio/sci-fi-sounds/Audio/laserRetro_002.ogg',
            'assets/audio/sci-fi-sounds/Audio/laserRetro_003.ogg',
            'assets/audio/sci-fi-sounds/Audio/laserRetro_004.ogg'
          ],
          category: 'sfx',
          maxConcurrent: 6,
          pitchJitter: 0.03,
          gainJitter: 0.02,
          baseVolume: 0.45
        },
        // 4. Parçalanma Patlamaları (Uzay Vakumu & Plazma Sönümlenmesi - Tok, güçlü ve dengeli gövde titreşimi)
        {
          id: 'explosion_crunch',
          sources: [
            'assets/audio/sci-fi-sounds/Audio/lowFrequency_explosion_000.ogg',
            'assets/audio/sci-fi-sounds/Audio/lowFrequency_explosion_001.ogg'
          ],
          category: 'sfx',
          maxConcurrent: 6,
          pitch: 0.78,
          pitchJitter: 0.045,
          gainJitter: 0.04,
          baseVolume: 0.55,
          filterFreq: 220 // Derin gövde ve plazma titreşimi
        },
        // 5. Ağır Boss / Dreadnought Patlamaları (Sismik Uzay Şok Dalgası & Sub-Bass Rezonansı)
        {
          id: 'explosion_boss',
          sources: [
            'assets/audio/sci-fi-sounds/Audio/lowFrequency_explosion_000.ogg',
            'assets/audio/sci-fi-sounds/Audio/lowFrequency_explosion_001.ogg'
          ],
          category: 'sfx',
          maxConcurrent: 4,
          pitch: 0.58,
          pitchJitter: 0.03,
          gainJitter: 0.03,
          baseVolume: 0.65,
          filterFreq: 160 // Derin uzay sismik dalgası: Sub-bass rezonansı
        },
        // 6. Kalkan Darbe Sesi (5 Güç alanı varyasyonu)
        {
          id: 'shield_hit',
          sources: [
            'assets/audio/sci-fi-sounds/Audio/forceField_000.ogg',
            'assets/audio/sci-fi-sounds/Audio/forceField_001.ogg',
            'assets/audio/sci-fi-sounds/Audio/forceField_002.ogg',
            'assets/audio/sci-fi-sounds/Audio/forceField_003.ogg',
            'assets/audio/sci-fi-sounds/Audio/forceField_004.ogg'
          ],
          category: 'sfx',
          maxConcurrent: 6,
          pitchJitter: 0.03,
          gainJitter: 0.02,
          baseVolume: 0.32
        },
        // 7. Kalkan Kırılma Cam Şangırtısı (5 Ağır Cam Çatlama Darbesi - Normalize Edilmiş)
        {
          id: 'shield_break',
          sources: [
            'assets/audio/impact-sounds/Audio/impactGlass_heavy_000.ogg',
            'assets/audio/impact-sounds/Audio/impactGlass_heavy_001.ogg',
            'assets/audio/impact-sounds/Audio/impactGlass_heavy_002.ogg',
            'assets/audio/impact-sounds/Audio/impactGlass_heavy_003.ogg',
            'assets/audio/impact-sounds/Audio/impactGlass_heavy_004.ogg'
          ],
          category: 'sfx',
          maxConcurrent: 4,
          pitchJitter: 0.025,
          baseVolume: 0.45
        },
        // 8. Gövde Metalik Darbe Sesi (5 Metal Plaka Darbesi - Tok ve Yumuşak)
        {
          id: 'impact_metal',
          sources: [
            'assets/audio/sci-fi-sounds/Audio/impactMetal_000.ogg',
            'assets/audio/sci-fi-sounds/Audio/impactMetal_001.ogg',
            'assets/audio/sci-fi-sounds/Audio/impactMetal_002.ogg',
            'assets/audio/sci-fi-sounds/Audio/impactMetal_003.ogg',
            'assets/audio/sci-fi-sounds/Audio/impactMetal_004.ogg'
          ],
          category: 'sfx',
          maxConcurrent: 10,
          pitchJitter: 0.05,
          gainJitter: 0.04,
          baseVolume: 0.32
        },
        // 9. Taktiksel Kart Hover / Odaklanma Tıkı (Hafif ve Zarif)
        {
          id: 'ui_card_hover',
          sources: [
            'assets/audio/interface-sounds/Audio/tick_001.ogg',
            'assets/audio/interface-sounds/Audio/tick_002.ogg',
            'assets/audio/interface-sounds/Audio/tick_004.ogg'
          ],
          category: 'ui',
          maxConcurrent: 4,
          pitchJitter: 0.03,
          baseVolume: 0.25
        },
        // 10. Kart Seçme / Manyetik Kilitlenme (Dengelenmiş Tok Kilit)
        {
          id: 'ui_card_select',
          sources: [
            'assets/audio/interface-sounds/Audio/select_001.ogg',
            'assets/audio/interface-sounds/Audio/select_002.ogg',
            'assets/audio/interface-sounds/Audio/select_003.ogg',
            'assets/audio/interface-sounds/Audio/select_004.ogg'
          ],
          category: 'ui',
          maxConcurrent: 4,
          pitchJitter: 0.025,
          baseVolume: 0.42
        },
        // 11. Retro Mekanik Silah Değiştirme / Mandallama
        {
          id: 'ui_weapon_switch',
          sources: [
            'assets/audio/interface-sounds/Audio/switch_001.ogg',
            'assets/audio/interface-sounds/Audio/switch_002.ogg',
            'assets/audio/interface-sounds/Audio/switch_003.ogg',
            'assets/audio/interface-sounds/Audio/switch_004.ogg'
          ],
          category: 'ui',
          maxConcurrent: 4,
          pitchJitter: 0.03,
          baseVolume: 0.38
        },
        // 12. Düşük Can Glitch Paraziti & Alarm
        {
          id: 'ui_glitch',
          sources: [
            'assets/audio/interface-sounds/Audio/glitch_001.ogg',
            'assets/audio/interface-sounds/Audio/glitch_002.ogg',
            'assets/audio/interface-sounds/Audio/glitch_003.ogg',
            'assets/audio/interface-sounds/Audio/glitch_004.ogg'
          ],
          category: 'ui',
          maxConcurrent: 3,
          pitchJitter: 0.04,
          baseVolume: 0.32
        },
        // 13. UI Onay Akoru
        {
          id: 'ui_confirm',
          sources: [
            'assets/audio/interface-sounds/Audio/confirmation_001.ogg',
            'assets/audio/interface-sounds/Audio/confirmation_002.ogg'
          ],
          category: 'ui',
          maxConcurrent: 2,
          pitchJitter: 0.02,
          baseVolume: 0.42
        },
        // 14. İtici / Dash Patlaması (Dengelenmiş Aerodinamik Hava Çıkışı)
        {
          id: 'thruster_dash',
          sources: [
            'assets/audio/sci-fi-sounds/Audio/thrusterFire_000.ogg',
            'assets/audio/sci-fi-sounds/Audio/thrusterFire_001.ogg',
            'assets/audio/sci-fi-sounds/Audio/thrusterFire_002.ogg'
          ],
          category: 'sfx',
          maxConcurrent: 3,
          pitchJitter: 0.03,
          baseVolume: 0.42
        },
        // 15. Kalkan Tamamen Doldu / Kilitlendi
        {
          id: 'shield_online',
          src: 'assets/audio/interface-sounds/Audio/maximize_001.ogg',
          category: 'sfx',
          maxConcurrent: 2,
          pitchJitter: 0.02,
          baseVolume: 0.38
        }
      ];

      return this.loadManifest(defaultManifest);
    }

    /**
     * Sesi Organik Rastgelelik, Çoklu Varyasyon ve Uzamsal Dağılımla Oynatır
     * @param {string} id Ses ID'si
     * @param {Object} [options] 
     * @returns {Object|null} Voice kontrol nesnesi (stop, setVolume vb.)
     */
    play(id, options = {}) {
      this.resume();
      if (!this.ctx || this.muted) return null;

      const config = this.soundConfigs.get(id) || {
        category: 'sfx',
        maxConcurrent: 6,
        baseVolume: 1.0,
        pitchJitter: 0.035,
        gainJitter: 0.030,
        loop: false,
        spatial: true
      };

      // VARYASYON HAVUZUNDAN TEKRAR ETMEYEN SEÇİM (Shuffle Bag / Round-Robin)
      let buffer = null;
      const pool = this.samplePools.get(id);
      if (pool && pool.length > 0) {
        if (pool.length === 1) {
          buffer = pool[0];
        } else {
          const lastIdx = this.lastPlayedIndex.get(id) ?? -1;
          let nextIdx;
          do {
            nextIdx = Math.floor(Math.random() * pool.length);
          } while (nextIdx === lastIdx && pool.length > 1);
          this.lastPlayedIndex.set(id, nextIdx);
          buffer = pool[nextIdx];
        }
      } else {
        buffer = this.buffers.get(id);
      }

      // HARİCİ FOLEY YÜKLENMEMİŞSE: Prosedürel ses motoruna (Fallback) devret
      if (!buffer) {
        if (typeof this.fallbackHandler === 'function') {
          this.stats.fallbacksTriggered++;
          return this.fallbackHandler(id, options);
        }
        return null;
      }

      // POLİFONİ KONTROLÜ & VOICE STEALING (Aynı sesin ekranı boğmasını engelle)
      const currentSoundVoices = this.voicesBySoundId.get(id) || new Set();
      if (currentSoundVoices.size >= config.maxConcurrent) {
        // En eski sesi bul ve hızlıca söndürerek yer aç
        const oldestVoice = currentSoundVoices.values().next().value;
        if (oldestVoice && typeof oldestVoice.stop === 'function') {
          oldestVoice.stop(0.04);
        }
      }

      const now = this.ctx.currentTime;

      // 1. PITCH (FREKANS) RANDOMIZATION (Makineli tüfek yapaylığını kıran %2 - %5 jitter)
      const pitchJitterRate = (options.pitchJitter !== undefined) ? options.pitchJitter : config.pitchJitter;
      const jitterFactorPitch = 1.0 + (Math.random() - 0.5) * 2.0 * pitchJitterRate;
      const basePlaybackRate = (options.pitch || 1.0) * jitterFactorPitch;

      // 2. GAIN (ŞİDDET) RANDOMIZATION (%2 - %5 şiddet varyasyonu)
      const gainJitterRate = (options.gainJitter !== undefined) ? options.gainJitter : config.gainJitter;
      const jitterFactorGain = 1.0 + (Math.random() - 0.5) * 2.0 * gainJitterRate;
      const targetVolume = (options.volume !== undefined ? options.volume : 1.0) * config.baseVolume * jitterFactorGain;

      // 3. SES KAYNAĞI VE KAZANÇ DÜĞÜMÜ OLUŞTURMA
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.setValueAtTime(Math.max(0.2, Math.min(3.0, basePlaybackRate)), now);
      source.loop = Boolean(options.loop !== undefined ? options.loop : config.loop);

      const voiceGain = this.ctx.createGain();
      voiceGain.gain.setValueAtTime(Math.max(0.001, targetVolume), now);

      // 4. UZAMSAL SES (3D STEREO PANNING & MESAFE ZAYIFLAMASI)
      let pannerNode = null;
      if (config.spatial && options.x !== undefined && typeof this.ctx.createStereoPanner === 'function') {
        const screenW = window.innerWidth || 1280;
        const screenH = window.innerHeight || 720;
        const playerX = (window.player && typeof window.player.x === 'number') ? window.player.x : (screenW / 2);
        const playerY = (window.player && typeof window.player.y === 'number') ? window.player.y : (screenH / 2);

        // Ekrandaki X konumuna göre sol (-1.0) ile sağ (+1.0) arası stereo pan
        const relX = (options.x - playerX) / ((screenW || 1280) * 0.5);
        let panValue = Math.max(-0.95, Math.min(0.95, relX));
        if (!Number.isFinite(panValue)) panValue = 0;

        pannerNode = this.ctx.createStereoPanner();
        pannerNode.pan.setValueAtTime(panValue, Number.isFinite(now) ? now : 0);

        // Mesafe zayıflaması (Distance Roll-off)
        if (options.y !== undefined) {
          const dist = Math.hypot(options.x - playerX, options.y - playerY);
          const maxAudibleDist = Math.max(screenW, screenH) * 0.85;
          let distFactor = Math.max(0.35, Math.min(1.0, 1.0 - (dist / (maxAudibleDist || 1000)) * 0.55));
          if (!Number.isFinite(distFactor)) distFactor = 1.0;
          voiceGain.gain.setValueAtTime(voiceGain.gain.value * distFactor, Number.isFinite(now) ? now : 0);
        }
      }

      // 5. YÖNLENDİRME (ROUTING): [Source] -> [Lowpass Filter?] -> [VoiceGain] -> [Panner?] -> [CategoryBus]
      const targetBus = this.categoryBuses.get(config.category) || this.categoryBuses.get('sfx');
      const filterFreq = (options.filterFreq !== undefined) ? options.filterFreq : config.filterFreq;

      if (filterFreq && typeof this.ctx.createBiquadFilter === 'function') {
        const filterNode = this.ctx.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(filterFreq, now);
        filterNode.Q.setValueAtTime(1.1, now);
        source.connect(filterNode);
        filterNode.connect(voiceGain);
      } else {
        source.connect(voiceGain);
      }

      if (pannerNode) {
        voiceGain.connect(pannerNode);
        pannerNode.connect(targetBus);
      } else {
        voiceGain.connect(targetBus);
      }

      // Voice Handle nesnesi
      const voiceHandle = {
        id,
        source,
        gainNode: voiceGain,
        pannerNode,
        startTime: now,
        stop: (fadeTime = 0.05) => {
          try {
            const stopNow = this.ctx.currentTime;
            voiceGain.gain.cancelScheduledValues(stopNow);
            voiceGain.gain.setValueAtTime(voiceGain.gain.value, stopNow);
            voiceGain.gain.linearRampToValueAtTime(0.0001, stopNow + fadeTime);
            source.stop(stopNow + fadeTime);
          } catch (e) {}
        }
      };

      // Temizleme ve Yaşam Döngüsü Takibi
      this.activeVoices.add(voiceHandle);
      currentSoundVoices.add(voiceHandle);
      this.stats.totalPlayed++;
      this.stats.activeVoiceCount = this.activeVoices.size;

      source.onended = () => {
        this.activeVoices.delete(voiceHandle);
        currentSoundVoices.delete(voiceHandle);
        this.stats.activeVoiceCount = this.activeVoices.size;
        try {
          source.disconnect();
          voiceGain.disconnect();
          if (pannerNode) pannerNode.disconnect();
        } catch (e) {}
        if (typeof options.onEnded === 'function') {
          options.onEnded();
        }
      };

      source.start(now);
      return voiceHandle;
    }

    /**
     * Belirli bir ses kimliğinin tüm aktif çalınışlarını durdurur
     */
    stopSound(id, fadeTime = 0.08) {
      const set = this.voicesBySoundId.get(id);
      if (set) {
        set.forEach(voice => voice.stop(fadeTime));
      }
    }

    /**
     * Tüm aktif sesleri anında veya yumuşak sönümlenmeyle keser
     */
    stopAll(fadeTime = 0.1) {
      this.activeVoices.forEach(voice => voice.stop(fadeTime));
      this.activeVoices.clear();
      this.voicesBySoundId.forEach(set => set.clear());
      this.stats.activeVoiceCount = 0;
    }

    /**
     * Genel ses seviyesini ayarlar (0.0 - 1.0)
     */
    setMasterVolume(val) {
      this.masterVolume = Math.max(0, Math.min(1, val));
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
      }
    }

    /**
     * SFX ses seviyesini ayarlar
     */
    setSFXVolume(val) {
      this.sfxVolume = Math.max(0, Math.min(1, val));
      const bus = this.categoryBuses.get('sfx');
      if (bus && this.ctx) {
        bus.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
      }
    }

    /**
     * Mute durumunu değiştirir
     */
    setMuted(isMuted) {
      this.muted = Boolean(isMuted);
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
      }
    }

    /**
     * Ses Motoru Metrikleri ve Durum Raporu
     */
    getStats() {
      return {
        totalPlayed: this.stats.totalPlayed,
        activeVoices: this.activeVoices.size,
        loadedBuffers: this.buffers.size,
        fallbacksTriggered: this.stats.fallbacksTriggered,
        contextState: this.ctx ? this.ctx.state : 'uninitialized'
      };
    }
  }

  // Singleton oluştur ve dışa aktar
  const audioBroker = new AudioBroker();
  window.ZortexAudioBroker = audioBroker;

})();
