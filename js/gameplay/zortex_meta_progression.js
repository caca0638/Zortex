/**
 * ==============================================================================
 * ZORTEX: META PROGRESSION & RUN SETUP SYSTEM (v2.0)
 * ==============================================================================
 * 20 Minutes Till Dawn mimarisinden ilham alan Roguelite Sefer Hazırlığı:
 * - 10 Eşsiz Savaş Gemisi (Özgün roller, pasifler ve Hurda kilitleri)
 * - 13 Başlangıç Silahı (3 Ücretsiz + 10 Hurda ile açılan özel silah)
 * - 16 Nöral Yonga / Kuantum Matrisi (Rün Sistemi: Taarruz ve Savunma dalları)
 * - Kalıcı Hurda (Scrap) Ekonomisi ve Profil Senkronizasyonu
 * - 144Hz Zero-GC Uyumlu Stat Enjeksiyonu
 * ==============================================================================
 */

(function (window) {
  'use strict';

  // ============================================================================
  // 1. GEMİ KATALOĞU (10 SAVAŞ GEMİSİ)
  // ============================================================================
  const SHIPS_CATALOG = {
    interceptor: {
      id: 'interceptor',
      name: 'INTERCEPTOR',
      role: 'Seri Avcı',
      cost: 0,
      unlockedByDefault: true,
      icon: '⚡',
      color: '#00f3ff',
      canopyColor: '#ff007f',
      hpMod: 0.85,
      shieldMod: 1.0,
      speedMod: 1.25,
      critMod: 0.15,
      passiveName: 'Siber Saptırma',
      passiveDesc: 'Dash atarken yakınındaki düşman mermilerini saptırır. Dash bekleme süresi %15 daha kısadır.',
      stats: { hp: 85, shield: 50, speed: 125, crit: 15 }
    },
    titan: {
      id: 'titan',
      name: 'TITAN DREADNOUGHT',
      role: 'Ağır Zırhlı Tank',
      cost: 350,
      unlockedByDefault: false,
      icon: '🛡️',
      color: '#ffb300',
      canopyColor: '#00f3ff',
      hpMod: 1.60,
      shieldMod: 1.50,
      speedMod: 0.85,
      critMod: 0.0,
      passiveName: 'Aegis Reaktif Şok',
      passiveDesc: 'Kalkan kırıldığında 220px yarıçapa ölümcül EMP şok dalgası yayar. Gelen tüm hasarları 2 puan azaltır.',
      stats: { hp: 160, shield: 100, speed: 85, crit: 5 }
    },
    spectre: {
      id: 'spectre',
      name: 'SPECTRE',
      role: 'Siber Suikastçı',
      cost: 600,
      unlockedByDefault: false,
      icon: '🔮',
      color: '#a855f7',
      canopyColor: '#22c55e',
      hpMod: 0.95,
      shieldMod: 0.90,
      speedMod: 1.15,
      critMod: 0.25,
      passiveName: 'Gölge Darbesi',
      passiveDesc: 'Dash attığında 1.2 saniye tam görünmezlik kazanır. Görünmezlikten çıkışta yapılan ilk vuruş %100 Kritik hasar vurur.',
      stats: { hp: 95, shield: 50, speed: 115, crit: 25 }
    },
    tesla_storm: {
      id: 'tesla_storm',
      name: 'TESLA STORM',
      role: 'Voltaj Fırtınası',
      cost: 900,
      unlockedByDefault: false,
      icon: '🌩️',
      color: '#38bdf8',
      canopyColor: '#ffffff',
      hpMod: 1.0,
      shieldMod: 1.10,
      speedMod: 1.05,
      critMod: 0.10,
      passiveName: 'Statik Boşalım Aurası',
      passiveDesc: 'Her 1.5 saniyede çevresindeki en yakın 3 düşmana otomatik zincirleme elektrik arkı atarak şok hasarı verir.',
      stats: { hp: 100, shield: 60, speed: 105, crit: 15 }
    },
    hive_carrier: {
      id: 'hive_carrier',
      name: 'HIVE CARRIER',
      role: 'Kovan Taşıyıcı',
      cost: 1200,
      unlockedByDefault: false,
      icon: '🛸',
      color: '#10b981',
      canopyColor: '#facc15',
      hpMod: 1.10,
      shieldMod: 1.15,
      speedMod: 0.95,
      critMod: 0.05,
      passiveName: 'Otonom Drone Filosu',
      passiveDesc: 'Sefere 2 adet otomatik ateş eden koruyucu drone ile başlar. Tüm drone ve çağırma hasarları +%30 artar.',
      stats: { hp: 110, shield: 65, speed: 95, crit: 10 }
    },
    cryo_warden: {
      id: 'cryo_warden',
      name: 'CRYO WARDEN',
      role: 'Kriyo Muhafızı',
      cost: 1500,
      unlockedByDefault: false,
      icon: '❄️',
      color: '#67e8f9',
      canopyColor: '#0284c7',
      hpMod: 1.15,
      shieldMod: 1.25,
      speedMod: 0.95,
      critMod: 0.10,
      passiveName: 'Mutlak Sıfır Parçalanması',
      passiveDesc: 'Tüm mermileri hedefleri %20 yavaşlatır. Donmuş hedefler yok edildiğinde çevreye 6 parçalı buz şarapneli saçar.',
      stats: { hp: 115, shield: 75, speed: 95, crit: 15 }
    },
    overclocker: {
      id: 'overclocker',
      name: 'OVERCLOCKER',
      role: 'Aşırı Yükleme',
      cost: 1800,
      unlockedByDefault: false,
      icon: '🔥',
      color: '#ef4444',
      canopyColor: '#f97316',
      hpMod: 0.75,
      shieldMod: 0.80,
      speedMod: 1.20,
      critMod: 0.20,
      passiveName: 'Aşırı Isınma Salvosu',
      passiveDesc: 'Atış hızı +%35 artar. Sürekli ateş ettikçe ısınma barı dolar; zirveye ulaştığında 3 sn sınırsız aşırı salvo sıkar.',
      stats: { hp: 75, shield: 40, speed: 120, crit: 20 }
    },
    pyromancer: {
      id: 'pyromancer',
      name: 'PYROMANCER',
      role: 'Alev Avcısı',
      cost: 2200,
      unlockedByDefault: false,
      icon: '💥',
      color: '#f97316',
      canopyColor: '#fde047',
      hpMod: 1.05,
      shieldMod: 1.0,
      speedMod: 1.10,
      critMod: 0.10,
      passiveName: 'Termal Cehennem İzi',
      passiveDesc: 'Gemi arkasında 2.5 saniye süren alev izi bırakır. Mermileri düşmanları tutuşturarak saniye başına yanma DoT hasarı verir.',
      stats: { hp: 105, shield: 55, speed: 110, crit: 15 }
    },
    scavenger: {
      id: 'scavenger',
      name: 'SCAVENGER',
      role: 'Hurdacı Avcı',
      cost: 2500,
      unlockedByDefault: false,
      icon: '🔩',
      color: '#eab308',
      canopyColor: '#ca8a04',
      hpMod: 1.0,
      shieldMod: 1.0,
      speedMod: 1.15,
      critMod: 0.05,
      passiveName: 'Hurda Girdabı & Manyetizma',
      passiveDesc: 'Hasarı %10 daha azdır ancak düşmanlardan ve dalgalardan 2X HURDA kazanır. Eşya çekim alanı +%45 daha geniştir.',
      stats: { hp: 100, shield: 50, speed: 115, crit: 10 }
    },
    singularity: {
      id: 'singularity',
      name: 'SINGULARITY',
      role: 'Kozmik Tekillik',
      cost: 4000,
      unlockedByDefault: false,
      icon: '🌌',
      color: '#9333ea',
      canopyColor: '#1e1b4b',
      hpMod: 1.10,
      shieldMod: 1.30,
      speedMod: 1.05,
      critMod: 0.20,
      passiveName: 'Kozmik Çekim Girdabı',
      passiveDesc: 'Kritik vuruşlar hedefin üzerinde 1.5 saniye süren mini karadelik açarak çevredeki tüm düşmanları merkeze vakumlar.',
      stats: { hp: 110, shield: 70, speed: 105, crit: 25 }
    }
  };

  // ============================================================================
  // 2. SİLAH KATALOĞU (13 SİLAH - 3 Ücretsiz + 10 Kilitli)
  // ============================================================================
  const WEAPONS_CATALOG = {
    blaster: {
      id: 'blaster',
      name: 'Pulse Blaster',
      category: 'starter',
      cost: 0,
      unlockedByDefault: true,
      icon: '⚡',
      color: '#00f3ff',
      desc: 'Klasik çift namlulu enerji topu. Güvenilir atış hızı, orta menzil ve dengeli hasar.',
      stats: { damage: 65, rate: 80, range: 75, aoe: 20 }
    },
    spread: {
      id: 'spread',
      name: 'Scattergun',
      category: 'starter',
      cost: 0,
      unlockedByDefault: true,
      icon: '💥',
      color: '#ff0055',
      desc: 'Geniş konik alana yayılan 5 parçalı saçma. Yakın mesafede ölümcül sürpriz hasarı.',
      stats: { damage: 85, rate: 45, range: 50, aoe: 60 }
    },
    plasma_beam: {
      id: 'plasma_beam',
      name: 'Plazma Küresi',
      category: 'starter',
      cost: 0,
      unlockedByDefault: true,
      icon: '🔥',
      color: '#ffaa00',
      desc: 'Çarptığı yerde patlayarak 85px yarıçapa yoğun termonükleer alan hasarı bırakan plazma küresi.',
      stats: { damage: 75, rate: 60, range: 70, aoe: 85 }
    },
    railgun: {
      id: 'railgun',
      name: 'Ağır Railgun',
      category: 'arsenal',
      cost: 300,
      unlockedByDefault: false,
      icon: '🚀',
      color: '#9d00ff',
      desc: 'Tüm engelleri ve düşman sıralarını delip geçen yüksek hızlı manyetik iyon ışını.',
      stats: { damage: 100, rate: 35, range: 100, aoe: 40 }
    },
    homing_missiles: {
      id: 'homing_missiles',
      name: 'Güdümlü Mikro Füzeler',
      category: 'arsenal',
      cost: 500,
      unlockedByDefault: false,
      icon: '🎯',
      color: '#38bdf8',
      desc: 'Spiral çizerek uçan ve menzildeki en tehlikeli hedeflere otomatik kilitlenen mikro füzeler.',
      stats: { damage: 70, rate: 55, range: 90, aoe: 50 }
    },
    tesla_coil: {
      id: 'tesla_coil',
      name: 'Tesla Şimşek Bobini',
      category: 'arsenal',
      cost: 750,
      unlockedByDefault: false,
      icon: '🌩️',
      color: '#60a5fa',
      desc: 'İlk hedefe vurduktan sonra yakındaki 3 düşmana zincirleme atlayan elektro-şok arkları.',
      stats: { damage: 60, rate: 70, range: 65, aoe: 75 }
    },
    orbit_blades: {
      id: 'orbit_blades',
      name: 'Yörünge Bıçakları',
      category: 'arsenal',
      cost: 900,
      unlockedByDefault: false,
      icon: '⚔️',
      color: '#00ffcc',
      desc: 'Gemi etrafında yüksek hızla dönerek yaklaşan her temaslı düşmanı biçen enerji testereleri.',
      stats: { damage: 75, rate: 90, range: 35, aoe: 70 }
    },
    gravity_cannon: {
      id: 'gravity_cannon',
      name: 'Kozmik Tekillik Topu',
      category: 'arsenal',
      cost: 1200,
      unlockedByDefault: false,
      icon: '🌌',
      color: '#c084fc',
      desc: 'Patladığı noktada düşmanları içine hapseden ve ezen 2 saniyelik yerçekimi girdabı açar.',
      stats: { damage: 85, rate: 40, range: 80, aoe: 95 }
    },
    mine_layer: {
      id: 'mine_layer',
      name: 'Siber Mayın Dağıtıcı',
      category: 'arsenal',
      cost: 1500,
      unlockedByDefault: false,
      icon: '💣',
      color: '#f43f5e',
      desc: 'Arkasında siber mayınlar bırakır; yaklaşan düşmanlar temas ettiğinde zincirleme infilak eder.',
      stats: { damage: 95, rate: 50, range: 45, aoe: 85 }
    },
    orbital_satellite: {
      id: 'orbital_satellite',
      name: 'Savunma Uydusu',
      category: 'arsenal',
      cost: 1800,
      unlockedByDefault: false,
      icon: '🛰️',
      color: '#34d399',
      desc: 'Gemiyi koruyan, düşman mermilerini yutan ve bağımsız plazma salvo ateşi açan ağır uydu.',
      stats: { damage: 65, rate: 65, range: 60, aoe: 50 }
    },
    hologram_prism: {
      id: 'hologram_prism',
      name: 'Holo-Lazer Prizması',
      category: 'arsenal',
      cost: 2200,
      unlockedByDefault: false,
      icon: '💎',
      color: '#2dd4bf',
      desc: 'Gemi önünde konumlanan prizma, sıktığınız tüm mermileri 3 farklı açıya kırarak çoğaltır.',
      stats: { damage: 80, rate: 60, range: 85, aoe: 65 }
    },
    shadow_clone: {
      id: 'shadow_clone',
      name: 'Gölge Savaşçı Klonu',
      category: 'arsenal',
      cost: 2500,
      unlockedByDefault: false,
      icon: '👥',
      color: '#e879f9',
      desc: 'Geminizin hareketlerini takip eden ve sizinle aynı anda aynı hedefe ateş açan kuantum klon.',
      stats: { damage: 90, rate: 75, range: 80, aoe: 55 }
    },
    gatling_vulcan: {
      id: 'gatling_vulcan',
      name: 'Döner Namlulu Gatling',
      category: 'arsenal',
      cost: 3000,
      unlockedByDefault: false,
      icon: '🌪️',
      color: '#fbbf24',
      desc: 'Ateş ettikçe dakikada 900 mermiye kadar hızlanan, durdurulamaz kinetik kurşun yağmuru.',
      stats: { damage: 95, rate: 100, range: 75, aoe: 30 }
    }
  };

  // ============================================================================
  // 3. NÖRAL YONGA MATRİSİ (RÜN SİSTEMİ - 2 Dal x 4 Kademe = 16 Yonga)
  // ============================================================================
  const CHIPS_CATALOG = {
    // --- TAARRUZ DALI (Kırmızı / Saldırı) ---
    off_t1_speed: {
      id: 'off_t1_speed',
      branch: 'offense',
      tier: 1,
      name: 'Akım Hızlandırıcı',
      cost: 150,
      icon: '⚡',
      color: '#ef4444',
      desc: '+%12 Mermi Hızı ve +%6 Temel Silah Hasarı.',
      apply: (p) => { p.bulletSpeedMultiplier = (p.bulletSpeedMultiplier || 1.0) * 1.12; p.damageMultiplier = (p.damageMultiplier || 1.0) * 1.06; }
    },
    off_t1_rate: {
      id: 'off_t1_rate',
      branch: 'offense',
      tier: 1,
      name: 'Siber Tetikleyici',
      cost: 150,
      icon: '🎯',
      color: '#ef4444',
      desc: '+%10 Genel Atış Hızı.',
      apply: (p) => { p.fireRateMultiplier = (p.fireRateMultiplier || 1.0) * 0.90; }
    },
    off_t2_crit: {
      id: 'off_t2_crit',
      branch: 'offense',
      tier: 2,
      name: 'Kritik Odaklayıcı',
      cost: 300,
      icon: '👁️',
      color: '#f87171',
      desc: '+%12 Kritik Vuruş Şansı ve +%25 Kritik Hasar Çarpanı.',
      apply: (p) => { p.critChance = (p.critChance || 0.05) + 0.12; p.critDamage = (p.critDamage || 1.5) + 0.25; }
    },
    off_t2_pierce: {
      id: 'off_t2_pierce',
      branch: 'offense',
      tier: 2,
      name: 'Zırh Delici Çekirdek',
      cost: 300,
      icon: '🗡️',
      color: '#f87171',
      desc: '+1 Mermi Delip Geçme (Pierce) ve zırhlı düşmanlara +%15 Hasar.',
      apply: (p) => { p.pierceCount = (p.pierceCount || 0) + 1; p.armorShred = true; }
    },
    off_t3_elem: {
      id: 'off_t3_elem',
      branch: 'offense',
      tier: 3,
      name: 'Elementel Rezonans',
      cost: 600,
      icon: '🔮',
      color: '#dc2626',
      desc: 'Alev, Buz ve Şok durum efektlerinin süresi ve hasarı +%35 artar.',
      apply: (p) => { p.elementalBonus = 1.35; }
    },
    off_t3_momentum: {
      id: 'off_t3_momentum',
      branch: 'offense',
      tier: 3,
      name: 'Momentum Reaktörü',
      cost: 600,
      icon: '🚀',
      color: '#dc2626',
      desc: 'Gemi hareket halindeyken hızına oranla +%20\'ye varan Hasar Bonusu.',
      apply: (p) => { p.hasMomentumBuff = true; }
    },
    off_t4_execute: {
      id: 'off_t4_execute',
      branch: 'offense',
      tier: 4,
      name: 'İnfazcı Matrisi',
      cost: 1200,
      icon: '☠️',
      color: '#b91c1c',
      desc: 'Canı %30\'un altına inmiş tüm düşmanlara 2X HASAR verir.',
      apply: (p) => { p.hasExecuteBonus = true; }
    },
    off_t4_overvolt: {
      id: 'off_t4_overvolt',
      branch: 'offense',
      tier: 4,
      name: 'Aşırı Voltaj İğnesi',
      cost: 1200,
      icon: '⚡',
      color: '#b91c1c',
      desc: 'Kritik vuruşlar hedefin etrafındaki 90px alana şok patlaması saçar.',
      apply: (p) => { p.hasCritOvervolt = true; }
    },

    // --- SAVUNMA & SİSTEM DALI (Mavi / Savunma & Fayda) ---
    def_t1_shield: {
      id: 'def_t1_shield',
      branch: 'defense',
      tier: 1,
      name: 'Nano Kompozit Zırh',
      cost: 150,
      icon: '🛡️',
      color: '#38bdf8',
      desc: '+20 Maksimum Kalkan ve alınan tüm hasarları 1 puan azaltır.',
      apply: (p) => { p.maxShield = (p.maxShield || 50) + 20; p.shield = p.maxShield; p.flatDamageReduction = (p.flatDamageReduction || 0) + 1; }
    },
    def_t1_vitality: {
      id: 'def_t1_vitality',
      branch: 'defense',
      tier: 1,
      name: 'Biyo-Hücresel Doku',
      cost: 150,
      icon: '❤️',
      color: '#38bdf8',
      desc: '+25 Maksimum Can Kapasitesi.',
      apply: (p) => { p.maxHealth = (p.maxHealth || 100) + 25; p.health = Math.min(p.maxHealth, p.health + 25); }
    },
    def_t2_dash: {
      id: 'def_t2_dash',
      branch: 'defense',
      tier: 2,
      name: 'İtici Soğutucu',
      cost: 300,
      icon: '💨',
      color: '#60a5fa',
      desc: 'Dash (Siber Kaçış) bekleme süresi %20 daha hızlı dolar.',
      apply: (p) => { p.dashCooldownMultiplier = (p.dashCooldownMultiplier || 1.0) * 0.80; }
    },
    def_t2_reflex: {
      id: 'def_t2_reflex',
      branch: 'defense',
      tier: 2,
      name: 'Acil Durum İticisi',
      cost: 300,
      icon: '⚡',
      color: '#60a5fa',
      desc: 'Hasar alındığında 1.5 saniye boyunca +%50 Hareket Hızı artışı kazanılır.',
      apply: (p) => { p.hasEmergencyThruster = true; }
    },
    def_t3_magnet: {
      id: 'def_t3_magnet',
      branch: 'defense',
      tier: 3,
      name: 'Kuantum Manyetik Halka',
      cost: 600,
      icon: '🧲',
      color: '#0284c7',
      desc: 'Hurda ve XP kristalleri çekim yarıçapı +%45 daha genişler.',
      apply: (p) => { p.pickupRadiusMultiplier = (p.pickupRadiusMultiplier || 1.0) * 1.45; }
    },
    def_t3_recycler: {
      id: 'def_t3_recycler',
      branch: 'defense',
      tier: 3,
      name: 'Geri Dönüşüm İşlemcisi',
      cost: 600,
      icon: '♻️',
      color: '#0284c7',
      desc: 'Her dalga başarıyla tamamlandığında +%25 Ekstra Hurda bonusu kazandırır.',
      apply: (p) => { p.waveBonusScrapMultiplier = (p.waveBonusScrapMultiplier || 1.0) * 1.25; }
    },
    def_t4_lifevest: {
      id: 'def_t4_lifevest',
      branch: 'defense',
      tier: 4,
      name: 'Kuantum Can Yeleği',
      cost: 1200,
      icon: '👼',
      color: '#1d4ed8',
      desc: 'Ölümcül darbe alındığında ölmek yerine 2.5 sn hasar almazlık ve %25 Can yeniler (Koşu başına 1 hak).',
      apply: (p) => { p.hasQuantumLifevest = true; p.lifevestUsed = false; }
    },
    def_t4_aegis: {
      id: 'def_t4_aegis',
      branch: 'defense',
      tier: 4,
      name: 'Aegis EMP Boşalımı',
      cost: 1200,
      icon: '🛡️',
      color: '#1d4ed8',
      desc: 'Kalkan kırıldığı anda ekrandaki tüm düşman mermilerini anında siler ve düşmanları 1.5 sn sersemletir.',
      apply: (p) => { p.hasAegisEmp = true; }
    }
  };

  // ============================================================================
  // 4. VERİ YÖNETİMİ & KALICILIK (LOCAL STORAGE SENKRONİZASYONU)
  // ============================================================================
  const STORAGE_KEY = 'zortex_meta_progression_v2';

  function getDefaultProgressionData() {
    return {
      unlockedShips: ['interceptor'],
      selectedShip: 'interceptor',
      unlockedWeapons: ['blaster', 'spread', 'plasma_beam'],
      selectedWeapon: 'blaster',
      unlockedChips: [],
      equippedChips: {
        offense: { 1: null, 2: null, 3: null, 4: null },
        defense: { 1: null, 2: null, 3: null, 4: null }
      }
    };
  }

  function loadProgression() {
    let data = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) {
      data = null;
    }

    if (!data || typeof data !== 'object') {
      data = getDefaultProgressionData();
    }

    // Default güvenceleri
    if (!Array.isArray(data.unlockedShips) || !data.unlockedShips.includes('interceptor')) {
      data.unlockedShips = ['interceptor'];
    }
    if (!SHIPS_CATALOG[data.selectedShip] || !data.unlockedShips.includes(data.selectedShip)) {
      data.selectedShip = 'interceptor';
    }

    if (!Array.isArray(data.unlockedWeapons)) {
      data.unlockedWeapons = ['blaster', 'spread', 'plasma_beam'];
    }
    // İlk 3 silah her zaman açık olmalı
    ['blaster', 'spread', 'plasma_beam'].forEach(w => {
      if (!data.unlockedWeapons.includes(w)) data.unlockedWeapons.push(w);
    });

    if (!WEAPONS_CATALOG[data.selectedWeapon] || !data.unlockedWeapons.includes(data.selectedWeapon)) {
      data.selectedWeapon = 'blaster';
    }

    if (!Array.isArray(data.unlockedChips)) {
      data.unlockedChips = [];
    }
    if (!data.equippedChips || typeof data.equippedChips !== 'object') {
      data.equippedChips = {
        offense: { 1: null, 2: null, 3: null, 4: null },
        defense: { 1: null, 2: null, 3: null, 4: null }
      };
    }
    return data;
  }

  function saveProgression(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[ZortexMetaProgression] Save failed:', e);
    }
  }

  let state = loadProgression();

  // Aktif profildeki Hurda miktarına erişim
  function getScrap() {
    if (typeof window.meta !== 'undefined' && window.meta && typeof window.meta.scrap === 'number') {
      return window.meta.scrap;
    }
    try {
      const p = JSON.parse(localStorage.getItem('zortex_meta') || '{}');
      return Number(p.scrap) || 0;
    } catch (e) {
      return 0;
    }
  }

  function modifyScrap(delta) {
    let cur = getScrap();
    let n = Math.max(0, cur + delta);
    if (typeof window.meta !== 'undefined' && window.meta) {
      window.meta.scrap = n;
      if (typeof window.saveMeta === 'function') window.saveMeta();
    }
    try {
      const p = JSON.parse(localStorage.getItem('zortex_meta') || '{}');
      p.scrap = n;
      localStorage.setItem('zortex_meta', JSON.stringify(p));
    } catch (e) {}

    // Ekranlardaki Hurda sayaçlarını güncelle
    updateAllScrapDisplays(n);
    return n;
  }

  function updateAllScrapDisplays(amt) {
    const ids = ['menuScrap', 'hangarScrap', 'runSetupScrapValue'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = amt.toLocaleString();
    });
  }

  // ============================================================================
  // 5. ARAYÜZ (RUN SETUP MODAL & CSS ENJEKSİYONU)
  // ============================================================================
  let currentTab = 'ships'; // 'ships' | 'weapons' | 'chips'
  let inspectingShipId = state.selectedShip;
  let inspectingWeaponId = state.selectedWeapon;

  function injectStyles() {
    if (document.getElementById('zortex-meta-styles')) return;
    const style = document.createElement('style');
    style.id = 'zortex-meta-styles';
    style.textContent = `
      /* === ZORTEX RUN SETUP OVERLAY === */
      #runSetupOverlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: radial-gradient(circle at center, rgba(3, 8, 22, 0.96) 0%, rgba(1, 4, 12, 0.99) 100%);
        backdrop-filter: blur(16px);
        display: flex;
        flex-direction: column;
        color: #e2e8f0;
        font-family: 'Rajdhani', 'Segoe UI', sans-serif;
        user-select: none;
        overflow: hidden;
      }
      #runSetupOverlay.hidden {
        display: none !important;
      }

      /* Üst Başlık & Sekmeler */
      .rso-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 18px 32px;
        background: rgba(2, 6, 18, 0.85);
        border-bottom: 1px solid rgba(0, 243, 255, 0.25);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      }
      .rso-title-group {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .rso-title {
        font-size: 24px;
        font-weight: 900;
        letter-spacing: 2.5px;
        color: #fff;
        text-shadow: 0 0 12px rgba(0, 243, 255, 0.8);
      }
      .rso-scrap-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 179, 0, 0.12);
        border: 1px solid rgba(255, 179, 0, 0.5);
        border-radius: 20px;
        padding: 5px 14px;
        font-size: 14px;
        font-weight: 800;
        color: #ffb300;
        box-shadow: 0 0 10px rgba(255, 179, 0, 0.2);
      }

      /* Sekme Düğmeleri */
      .rso-tabs {
        display: flex;
        gap: 8px;
        background: rgba(0, 0, 0, 0.4);
        padding: 4px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .rso-tab-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        padding: 8px 18px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 1px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .rso-tab-btn:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.05);
      }
      .rso-tab-btn.active {
        color: #00f3ff;
        background: rgba(0, 243, 255, 0.15);
        box-shadow: 0 0 12px rgba(0, 243, 255, 0.3);
      }

      /* Ana İçerik Gövdesi */
      .rso-body {
        flex: 1;
        display: flex;
        overflow: hidden;
        padding: 24px 32px;
        gap: 24px;
      }

      /* Sol Liste / Grid Bölgesi */
      .rso-left-pane {
        flex: 1.35;
        overflow-y: auto;
        padding-right: 12px;
      }
      .rso-left-pane::-webkit-scrollbar {
        width: 6px;
      }
      .rso-left-pane::-webkit-scrollbar-thumb {
        background: rgba(0, 243, 255, 0.3);
        border-radius: 4px;
      }

      .rso-grid-2col {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 14px;
      }

      /* Kart Tasarımı */
      .rso-card {
        background: rgba(10, 18, 36, 0.7);
        border: 1px solid rgba(0, 243, 255, 0.2);
        border-radius: 10px;
        padding: 14px;
        cursor: pointer;
        transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
        gap: 8px;
        position: relative;
        overflow: hidden;
      }
      .rso-card:hover {
        border-color: #00f3ff;
        transform: translateY(-2px);
        background: rgba(15, 28, 55, 0.85);
        box-shadow: 0 4px 18px rgba(0, 243, 255, 0.25);
      }
      .rso-card.selected {
        border-color: #00f3ff;
        border-width: 2px;
        background: rgba(0, 243, 255, 0.12);
        box-shadow: 0 0 20px rgba(0, 243, 255, 0.35);
      }
      .rso-card.locked {
        opacity: 0.82;
        border-color: rgba(255, 255, 255, 0.12);
      }
      .rso-card.inspecting {
        outline: 2px solid #ffe600;
      }

      .rso-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .rso-card-title {
        font-size: 16px;
        font-weight: 800;
        letter-spacing: 1px;
        color: #fff;
      }
      .rso-card-badge {
        font-size: 11px;
        font-weight: 800;
        padding: 2px 8px;
        border-radius: 6px;
        text-transform: uppercase;
      }
      .rso-badge-active {
        background: #00f3ff;
        color: #000;
      }
      .rso-badge-unlocked {
        background: rgba(34, 197, 94, 0.2);
        color: #4ade80;
        border: 1px solid #22c55e;
      }
      .rso-badge-cost {
        background: rgba(255, 179, 0, 0.18);
        color: #ffb300;
        border: 1px solid #ffb300;
      }

      .rso-card-role {
        font-size: 12px;
        color: #94a3b8;
        font-weight: 600;
      }
      .rso-card-desc {
        font-size: 12px;
        color: #cbd5e1;
        line-height: 1.4;
      }

      /* Sağ Önizleme / Detay Bölgesi */
      .rso-right-pane {
        flex: 0.95;
        background: rgba(6, 12, 28, 0.85);
        border: 1px solid rgba(0, 243, 255, 0.3);
        border-radius: 14px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-shadow: inset 0 0 30px rgba(0, 243, 255, 0.08);
      }

      .rso-preview-hero {
        text-align: center;
        padding: 20px 0 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .rso-preview-icon {
        font-size: 56px;
        margin-bottom: 8px;
        filter: drop-shadow(0 0 16px rgba(0, 243, 255, 0.6));
      }
      .rso-preview-name {
        font-size: 24px;
        font-weight: 900;
        letter-spacing: 2px;
        color: #fff;
      }
      .rso-preview-sub {
        font-size: 13px;
        color: #00f3ff;
        font-weight: 700;
        letter-spacing: 1px;
        margin-top: 4px;
      }

      .rso-stat-bar-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 18px 0;
      }
      .rso-stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        font-weight: 700;
      }
      .rso-stat-track {
        flex: 1;
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        margin: 0 14px;
        overflow: hidden;
      }
      .rso-stat-fill {
        height: 100%;
        background: linear-gradient(90deg, #00f3ff, #ff00ea);
        border-radius: 3px;
      }

      .rso-passive-box {
        background: rgba(0, 243, 255, 0.05);
        border: 1px solid rgba(0, 243, 255, 0.2);
        border-radius: 8px;
        padding: 12px 14px;
        margin-top: 10px;
      }
      .rso-passive-title {
        font-size: 12px;
        font-weight: 800;
        color: #00f3ff;
        letter-spacing: 1px;
        margin-bottom: 4px;
      }
      .rso-passive-body {
        font-size: 13px;
        color: #e2e8f0;
        line-height: 1.45;
      }

      .rso-action-area {
        padding-top: 18px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      .rso-btn-buy {
        width: 100%;
        padding: 14px;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        border: none;
        border-radius: 8px;
        color: #fff;
        font-size: 15px;
        font-weight: 900;
        letter-spacing: 1.5px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 15px rgba(245, 158, 11, 0.35);
      }
      .rso-btn-buy:hover:not(:disabled) {
        filter: brightness(1.15);
        transform: translateY(-2px);
      }
      .rso-btn-buy:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        filter: grayscale(0.6);
      }

      .rso-btn-select {
        width: 100%;
        padding: 14px;
        background: linear-gradient(135deg, #00f3ff, #0099ff);
        border: none;
        border-radius: 8px;
        color: #000;
        font-size: 15px;
        font-weight: 900;
        letter-spacing: 1.5px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 15px rgba(0, 243, 255, 0.35);
      }
      .rso-btn-select:hover {
        filter: brightness(1.2);
        transform: translateY(-2px);
      }
      .rso-btn-selected-already {
        width: 100%;
        padding: 14px;
        background: rgba(34, 197, 94, 0.15);
        border: 1px solid #22c55e;
        border-radius: 8px;
        color: #4ade80;
        font-size: 15px;
        font-weight: 900;
        letter-spacing: 1.5px;
        text-align: center;
      }

      /* Alt Çubuk (Navigation & Launch) */
      .rso-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 32px;
        background: rgba(2, 6, 18, 0.95);
        border-top: 1px solid rgba(0, 243, 255, 0.25);
      }
      .rso-btn-back {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #94a3b8;
        padding: 10px 22px;
        border-radius: 8px;
        font-weight: 800;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .rso-btn-back:hover {
        border-color: #fff;
        color: #fff;
      }

      .rso-summary-pills {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .rso-pill {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 700;
      }
      .rso-pill span {
        color: #00f3ff;
      }

      .rso-btn-launch {
        background: linear-gradient(135deg, #ff0055, #ff00aa);
        border: none;
        color: #fff;
        padding: 14px 38px;
        border-radius: 8px;
        font-size: 17px;
        font-weight: 900;
        letter-spacing: 2px;
        cursor: pointer;
        transition: all 0.22s ease;
        box-shadow: 0 0 25px rgba(255, 0, 85, 0.6);
        animation: rsoPulse 2s infinite alternate;
      }
      .rso-btn-launch:hover {
        transform: scale(1.04);
        box-shadow: 0 0 35px rgba(255, 0, 85, 0.9);
      }
      @keyframes rsoPulse {
        0% { box-shadow: 0 0 15px rgba(255, 0, 85, 0.4); }
        100% { box-shadow: 0 0 30px rgba(255, 0, 85, 0.8); }
      }

      /* === NÖRAL YONGA MATRİSİ ÖZEL DÜZENİ === */
      .rso-chips-container {
        display: flex;
        gap: 24px;
        width: 100%;
        height: 100%;
      }
      .rso-chip-col {
        flex: 1;
        background: rgba(8, 14, 30, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow-y: auto;
      }
      .rso-chip-col-header {
        font-size: 15px;
        font-weight: 900;
        letter-spacing: 1.5px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .rso-col-offense { border-color: rgba(239, 68, 68, 0.35); }
      .rso-col-defense { border-color: rgba(56, 189, 248, 0.35); }
      .rso-chip-tier-box {
        background: rgba(0, 0, 0, 0.35);
        border: 1px dashed rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .rso-tier-label {
        font-size: 11px;
        font-weight: 800;
        color: #94a3b8;
        letter-spacing: 1px;
      }
      .rso-chip-item {
        background: rgba(15, 23, 42, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 10px;
        cursor: pointer;
        transition: all 0.18s ease;
      }
      .rso-chip-item:hover {
        background: rgba(30, 41, 59, 0.9);
      }
      .rso-chip-item.equipped {
        border-color: #00f3ff;
        background: rgba(0, 243, 255, 0.1);
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================================================
  // 6. MODAL DOM OLUŞTURMA & ENTEGRASYON
  // ============================================================================
  function createRunSetupOverlay() {
    let overlay = document.getElementById('runSetupOverlay');
    if (!overlay) {
      injectStyles();
      overlay = document.createElement('div');
      overlay.id = 'runSetupOverlay';
      overlay.className = 'hidden';
      overlay.innerHTML = `
        <!-- Üst Başlık & Sekmeler -->
        <div class="rso-header">
          <div class="rso-title-group">
            <div class="rso-title">🚀 SEFER HAZIRLIĞI</div>
            <div class="rso-scrap-badge">
              <span>🔩</span>
              <span id="runSetupScrapValue">0</span> HURDA
            </div>
          </div>

          <div class="rso-tabs">
            <button class="rso-tab-btn active" data-tab="ships">🛸 1. GEMİ SEÇİMİ</button>
            <button class="rso-tab-btn" data-tab="weapons">🔫 2. BAŞLANGIÇ SİLAHI</button>
            <button class="rso-tab-btn" data-tab="chips">🧬 3. NÖRAL YONGA MATRİSİ</button>
          </div>
        </div>

        <!-- Gövde -->
        <div class="rso-body" id="runSetupBody">
          <!-- Dinamik Render -->
        </div>

        <!-- Alt Gezinme & Başlat -->
        <div class="rso-footer">
          <button class="rso-btn-back" id="runSetupBackBtn">◀ ANA MENÜ</button>

          <div class="rso-summary-pills">
            <div class="rso-pill">Gemi: <span id="rsoSumShip">INTERCEPTOR</span></div>
            <div class="rso-pill">Silah: <span id="rsoSumWeapon">Pulse Blaster</span></div>
            <div class="rso-pill">Yongalar: <span id="rsoSumChips">0/8</span></div>
          </div>

          <button class="rso-btn-launch" id="runSetupLaunchBtn">🚀 SEFERİ BAŞLAT</button>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    if (overlay.__wired) return overlay;
    overlay.__wired = true;

    // Event Listener Bağlantıları
    overlay.querySelectorAll('.rso-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        switchTab(tab);
      });
    });

    const backBtn = document.getElementById('runSetupBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        closeRunSetup();
      });
    }

    const launchBtn = document.getElementById('runSetupLaunchBtn');
    if (launchBtn) {
      launchBtn.addEventListener('click', () => {
        launchRun();
      });
    }

    return overlay;
  }

  function switchTab(tab) {
    currentTab = tab;
    const overlay = document.getElementById('runSetupOverlay');
    if (!overlay) return;

    overlay.querySelectorAll('.rso-tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });

    renderCurrentTab();
  }

  function updateFooterNavigation() {
    const backBtn = document.getElementById('runSetupBackBtn');
    let navBtn = document.getElementById('rsoFooterNavBtn');
    const launchBtn = document.getElementById('runSetupLaunchBtn');

    if (!navBtn && launchBtn && launchBtn.parentNode) {
      navBtn = document.createElement('button');
      navBtn.id = 'rsoFooterNavBtn';
      navBtn.className = 'rso-btn-select';
      navBtn.style.marginRight = '8px';
      launchBtn.parentNode.insertBefore(navBtn, launchBtn);
    }

    if (currentTab === 'ships') {
      if (backBtn) {
        backBtn.textContent = '◀ ANA MENÜ';
        backBtn.onclick = () => closeRunSetup();
      }
      if (navBtn) {
        navBtn.style.display = 'inline-block';
        navBtn.style.background = 'linear-gradient(135deg, #00f3ff, #38bdf8)';
        navBtn.style.color = '#000';
        navBtn.style.fontWeight = 'bold';
        navBtn.style.boxShadow = '0 0 15px rgba(0, 243, 255, 0.45)';
        navBtn.textContent = 'SİLAH SEÇİMİNE İLERLE ➔';
        navBtn.onclick = () => switchTab('weapons');
      }
      if (launchBtn) {
        launchBtn.textContent = '🚀 HEMEN BAŞLAT [ENTER]';
        launchBtn.style.fontSize = '12px';
        launchBtn.style.padding = '8px 14px';
        launchBtn.style.opacity = '0.85';
      }
    } else if (currentTab === 'weapons') {
      if (backBtn) {
        backBtn.textContent = '◀ 1. GEMİLER';
        backBtn.onclick = () => switchTab('ships');
      }
      if (navBtn) {
        navBtn.style.display = 'inline-block';
        navBtn.style.background = 'linear-gradient(135deg, #c084fc, #ec4899)';
        navBtn.style.color = '#fff';
        navBtn.style.fontWeight = 'bold';
        navBtn.style.boxShadow = '0 0 15px rgba(192, 132, 252, 0.45)';
        navBtn.textContent = 'NÖRAL MATRİSE İLERLE ➔';
        navBtn.onclick = () => switchTab('chips');
      }
      if (launchBtn) {
        launchBtn.textContent = '🚀 SEFERİ BAŞLAT [ENTER]';
        launchBtn.style.fontSize = '14px';
        launchBtn.style.padding = '10px 20px';
        launchBtn.style.opacity = '1.0';
      }
    } else if (currentTab === 'chips') {
      if (backBtn) {
        backBtn.textContent = '◀ 2. SİLAHLAR';
        backBtn.onclick = () => switchTab('weapons');
      }
      if (navBtn) {
        navBtn.style.display = 'none';
      }
      if (launchBtn) {
        launchBtn.textContent = '🚀 SEFERİ BAŞLAT (ENTER)';
        launchBtn.style.fontSize = '16px';
        launchBtn.style.padding = '12px 28px';
        launchBtn.style.background = 'linear-gradient(135deg, #00f3ff, #ff00ea)';
        launchBtn.style.boxShadow = '0 0 25px rgba(0, 243, 255, 0.6)';
        launchBtn.style.opacity = '1.0';
      }
    }
  }

  function renderCurrentTab() {
    const body = document.getElementById('runSetupBody');
    if (!body) return;

    updateAllScrapDisplays(getScrap());
    updateFooterSummary();
    updateFooterNavigation();

    if (currentTab === 'ships') {
      renderShipsTab(body);
    } else if (currentTab === 'weapons') {
      renderWeaponsTab(body);
    } else if (currentTab === 'chips') {
      renderChipsTab(body);
    }
  }

  // ============================================================================
  // 7. SEKME 1: GEMİ SEÇİMİ (10 SAVAŞ GEMİSİ)
  // ============================================================================
  function renderShipsTab(container) {
    const inspecting = SHIPS_CATALOG[inspectingShipId] || SHIPS_CATALOG.interceptor;
    const isUnlocked = state.unlockedShips.includes(inspecting.id);
    const isSelected = state.selectedShip === inspecting.id;
    const scrap = getScrap();
    const canAfford = scrap >= inspecting.cost;

    container.innerHTML = `
      <div class="rso-left-pane">
        <div class="rso-grid-2col">
          ${Object.values(SHIPS_CATALOG).map(ship => {
            const unlocked = state.unlockedShips.includes(ship.id);
            const active = state.selectedShip === ship.id;
            const isInsp = inspectingShipId === ship.id;
            return `
              <div class="rso-card ${active ? 'selected' : ''} ${!unlocked ? 'locked' : ''} ${isInsp ? 'inspecting' : ''}" data-ship-id="${ship.id}">
                <div class="rso-card-header">
                  <div class="rso-card-title">${ship.icon} ${ship.name}</div>
                  ${active ? '<div class="rso-card-badge rso-badge-active">SEÇİLDİ</div>' : 
                    (unlocked ? '<div class="rso-card-badge rso-badge-unlocked">AÇIK</div>' : 
                    `<div class="rso-card-badge rso-badge-cost">🔒 ${ship.cost} HURDA</div>`)}
                </div>
                <div class="rso-card-role" style="color: ${ship.color};">${ship.role.toUpperCase()}</div>
                <div class="rso-card-desc">${ship.passiveDesc}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="rso-right-pane">
        <div>
          <div class="rso-preview-hero">
            <div class="rso-preview-icon" style="color: ${inspecting.color};">${inspecting.icon}</div>
            <div class="rso-preview-name">${inspecting.name}</div>
            <div class="rso-preview-sub" style="color: ${inspecting.color};">SINIF: ${inspecting.role.toUpperCase()}</div>
          </div>

          <div class="rso-stat-bar-group">
            <div class="rso-stat-row">
              <span>CAN (HP)</span>
              <div class="rso-stat-track"><div class="rso-stat-fill" style="width: ${Math.min(100, (inspecting.stats.hp / 160) * 100)}%;"></div></div>
              <span>${inspecting.stats.hp}</span>
            </div>
            <div class="rso-stat-row">
              <span>KALKAN</span>
              <div class="rso-stat-track"><div class="rso-stat-fill" style="width: ${Math.min(100, (inspecting.stats.shield / 100) * 100)}%;"></div></div>
              <span>${inspecting.stats.shield}</span>
            </div>
            <div class="rso-stat-row">
              <span>ÇEVİKLİK (HIZ)</span>
              <div class="rso-stat-track"><div class="rso-stat-fill" style="width: ${Math.min(100, (inspecting.stats.speed / 130) * 100)}%;"></div></div>
              <span>%${inspecting.stats.speed}</span>
            </div>
            <div class="rso-stat-row">
              <span>KRİTİK ŞANSI</span>
              <div class="rso-stat-track"><div class="rso-stat-fill" style="width: ${Math.min(100, (inspecting.stats.crit / 30) * 100)}%;"></div></div>
              <span>%${inspecting.stats.crit}</span>
            </div>
          </div>

          <div class="rso-passive-box">
            <div class="rso-passive-title">⚡ ÖZEL PASİF: ${inspecting.passiveName.toUpperCase()}</div>
            <div class="rso-passive-body">${inspecting.passiveDesc}</div>
          </div>
        </div>

        <div class="rso-action-area">
          ${isSelected ? `
            <div style="display: flex; gap: 10px; width: 100%;">
              <div class="rso-btn-selected-already" style="flex: 1;">✔ AKTİF SAVAŞ GEMİSİ</div>
              <button class="rso-btn-select" id="rsoGoToWeaponsBtn" style="flex: 1; background: linear-gradient(135deg, #00f3ff, #38bdf8); color: #000; font-weight: bold; box-shadow: 0 0 15px rgba(0, 243, 255, 0.45);">
                SİLAH SEÇİMİNE İLERLE ➔
              </button>
            </div>
          ` : (isUnlocked ? `
            <div style="display: flex; gap: 10px; width: 100%;">
              <button class="rso-btn-select" id="rsoSelectShipBtn" style="flex: 1;">BU GEMİYİ SEÇ</button>
              <button class="rso-btn-select" id="rsoSelectAndGoBtn" style="flex: 1; background: linear-gradient(135deg, #00f3ff, #38bdf8); color: #000; font-weight: bold;">
                SEÇ & SİLAHA GEÇ ➔
              </button>
            </div>
          ` : `
            <button class="rso-btn-buy" id="rsoBuyShipBtn" ${!canAfford ? 'disabled' : ''}>
              🔒 ${inspecting.cost} HURDA İLE KİLİDİ AÇ ${!canAfford ? '(YETERSİZ HURDA)' : ''}
            </button>
          `)}
        </div>
      </div>
    `;

    // Tıklamalar
    container.querySelectorAll('[data-ship-id]').forEach(el => {
      el.addEventListener('click', () => {
        inspectingShipId = el.getAttribute('data-ship-id');
        renderShipsTab(container);
      });
    });

    const selectBtn = document.getElementById('rsoSelectShipBtn');
    if (selectBtn) {
      selectBtn.addEventListener('click', () => {
        state.selectedShip = inspecting.id;
        saveProgression(state);
        if (window.audio && window.audio.playConfirm) window.audio.playConfirm();
        renderShipsTab(container);
        updateFooterSummary();
      });
    }

    const goToWBtn = document.getElementById('rsoGoToWeaponsBtn');
    if (goToWBtn) {
      goToWBtn.addEventListener('click', () => {
        switchTab('weapons');
      });
    }

    const selectAndGoBtn = document.getElementById('rsoSelectAndGoBtn');
    if (selectAndGoBtn) {
      selectAndGoBtn.addEventListener('click', () => {
        state.selectedShip = inspecting.id;
        saveProgression(state);
        if (window.audio && window.audio.playConfirm) window.audio.playConfirm();
        switchTab('weapons');
      });
    }

    const buyBtn = document.getElementById('rsoBuyShipBtn');
    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        if (modifyScrap(-inspecting.cost) >= 0) {
          state.unlockedShips.push(inspecting.id);
          state.selectedShip = inspecting.id;
          saveProgression(state);
          if (window.audio && window.audio.playUpgrade) window.audio.playUpgrade();
          renderShipsTab(container);
          updateFooterSummary();
        }
      });
    }
  }

  // ============================================================================
  // 8. SEKME 2: BAŞLANGIÇ SİLAHI (13 SİLAH)
  // ============================================================================
  function renderWeaponsTab(container) {
    const inspecting = WEAPONS_CATALOG[inspectingWeaponId] || WEAPONS_CATALOG.blaster;
    const isUnlocked = state.unlockedWeapons.includes(inspecting.id);
    const isSelected = state.selectedWeapon === inspecting.id;
    const scrap = getScrap();
    const canAfford = scrap >= inspecting.cost;

    container.innerHTML = `
      <div class="rso-left-pane">
        <div class="rso-grid-2col">
          ${Object.values(WEAPONS_CATALOG).map(w => {
            const unlocked = state.unlockedWeapons.includes(w.id);
            const active = state.selectedWeapon === w.id;
            const isInsp = inspectingWeaponId === w.id;
            return `
              <div class="rso-card ${active ? 'selected' : ''} ${!unlocked ? 'locked' : ''} ${isInsp ? 'inspecting' : ''}" data-weapon-id="${w.id}">
                <div class="rso-card-header">
                  <div class="rso-card-title">${w.icon} ${w.name}</div>
                  ${active ? '<div class="rso-card-badge rso-badge-active">SEÇİLDİ</div>' : 
                    (unlocked ? '<div class="rso-card-badge rso-badge-unlocked">AÇIK</div>' : 
                    `<div class="rso-card-badge rso-badge-cost">🔒 ${w.cost} HURDA</div>`)}
                </div>
                <div class="rso-card-role" style="color: ${w.color};">${w.category === 'starter' ? 'BAŞLANGIÇ SİLAHI (ÜCRETSİZ)' : 'ÖZEL CEPHANELİK'}</div>
                <div class="rso-card-desc">${w.desc}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="rso-right-pane">
        <div>
          <div class="rso-preview-hero">
            <div class="rso-preview-icon" style="color: ${inspecting.color};">${inspecting.icon}</div>
            <div class="rso-preview-name">${inspecting.name}</div>
            <div class="rso-preview-sub" style="color: ${inspecting.color};">${inspecting.category === 'starter' ? 'ÜCRETSİZ BAŞLANGIÇ SİLAHI' : 'AĞIR CEPHANELİK'}</div>
          </div>

          <div class="rso-stat-bar-group">
            <div class="rso-stat-row">
              <span>HASAR GÜCÜ</span>
              <div class="rso-stat-track"><div class="rso-stat-fill" style="width: ${inspecting.stats.damage}%;"></div></div>
              <span>${inspecting.stats.damage}</span>
            </div>
            <div class="rso-stat-row">
              <span>ATIŞ HIZI</span>
              <div class="rso-stat-track"><div class="rso-stat-fill" style="width: ${inspecting.stats.rate}%;"></div></div>
              <span>${inspecting.stats.rate}</span>
            </div>
            <div class="rso-stat-row">
              <span>ETKİLİ MENZİL</span>
              <div class="rso-stat-track"><div class="rso-stat-fill" style="width: ${inspecting.stats.range}%;"></div></div>
              <span>${inspecting.stats.range}</span>
            </div>
            <div class="rso-stat-row">
              <span>ALAN ETKİSİ (AOE)</span>
              <div class="rso-stat-track"><div class="rso-stat-fill" style="width: ${inspecting.stats.aoe}%;"></div></div>
              <span>${inspecting.stats.aoe}</span>
            </div>
          </div>

          <div class="rso-passive-box">
            <div class="rso-passive-title">🎯 SİLAH BALİSTİĞİ & TAKTİK</div>
            <div class="rso-passive-body">${inspecting.desc}</div>
          </div>
        </div>

        <div class="rso-action-area">
          ${isSelected ? `
            <div style="display: flex; gap: 10px; width: 100%;">
              <div class="rso-btn-selected-already" style="flex: 1;">✔ BAŞLANGIÇ SİLAHI AYARLANDI</div>
              <button class="rso-btn-select" id="rsoGoToChipsBtn" style="flex: 1; background: linear-gradient(135deg, #c084fc, #ec4899); color: #fff; font-weight: bold; box-shadow: 0 0 15px rgba(192, 132, 252, 0.45);">
                NÖRAL MATRİSE GEÇ ➔
              </button>
            </div>
          ` : (isUnlocked ? `
            <div style="display: flex; gap: 10px; width: 100%;">
              <button class="rso-btn-select" id="rsoSelectWeaponBtn" style="flex: 1;">BU SİLAHLA BAŞLA</button>
              <button class="rso-btn-select" id="rsoSelectWAndGoBtn" style="flex: 1; background: linear-gradient(135deg, #c084fc, #ec4899); color: #fff; font-weight: bold;">
                SEÇ & NÖRALE GEÇ ➔
              </button>
            </div>
          ` : `
            <button class="rso-btn-buy" id="rsoBuyWeaponBtn" ${!canAfford ? 'disabled' : ''}>
              🔒 ${inspecting.cost} HURDA İLE SATIN AL ${!canAfford ? '(YETERSİZ HURDA)' : ''}
            </button>
          `)}
        </div>
      </div>
    `;

    container.querySelectorAll('[data-weapon-id]').forEach(el => {
      el.addEventListener('click', () => {
        inspectingWeaponId = el.getAttribute('data-weapon-id');
        renderWeaponsTab(container);
      });
    });

    const selectBtn = document.getElementById('rsoSelectWeaponBtn');
    if (selectBtn) {
      selectBtn.addEventListener('click', () => {
        state.selectedWeapon = inspecting.id;
        saveProgression(state);
        if (window.audio && window.audio.playConfirm) window.audio.playConfirm();
        renderWeaponsTab(container);
        updateFooterSummary();
      });
    }

    const goToChipsBtn = document.getElementById('rsoGoToChipsBtn');
    if (goToChipsBtn) {
      goToChipsBtn.addEventListener('click', () => {
        switchTab('chips');
      });
    }

    const selectWAndGoBtn = document.getElementById('rsoSelectWAndGoBtn');
    if (selectWAndGoBtn) {
      selectWAndGoBtn.addEventListener('click', () => {
        state.selectedWeapon = inspecting.id;
        saveProgression(state);
        if (window.audio && window.audio.playConfirm) window.audio.playConfirm();
        switchTab('chips');
      });
    }

    const buyBtn = document.getElementById('rsoBuyWeaponBtn');
    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        if (modifyScrap(-inspecting.cost) >= 0) {
          state.unlockedWeapons.push(inspecting.id);
          state.selectedWeapon = inspecting.id;
          saveProgression(state);
          if (window.audio && window.audio.playUpgrade) window.audio.playUpgrade();
          renderWeaponsTab(container);
          updateFooterSummary();
        }
      });
    }
  }

  // ============================================================================
  // 9. SEKME 3: NÖRAL YONGA MATRİSİ (RÜN SİSTEMİ)
  // ============================================================================
  function renderChipsTab(container) {
    const scrap = getScrap();

    function renderBranchColumn(branchTitle, branchKey, colClass) {
      let tiersHtml = '';
      for (let t = 1; t <= 4; t++) {
        const chipsInTier = Object.values(CHIPS_CATALOG).filter(c => c.branch === branchKey && c.tier === t);
        const equippedId = state.equippedChips[branchKey][t];

        tiersHtml += `
          <div class="rso-chip-tier-box">
            <div class="rso-tier-label">KADEME ${t} SOKETİ ${equippedId ? '• [DOLDURULDU]' : '• [BOŞ]'}</div>
            <div style="display: flex; gap: 8px;">
              ${chipsInTier.map(chip => {
                const isUnlocked = state.unlockedChips.includes(chip.id);
                const isEquipped = equippedId === chip.id;
                const canAfford = scrap >= chip.cost;

                return `
                  <div class="rso-chip-item ${isEquipped ? 'equipped' : ''}" style="flex: 1;" data-chip-id="${chip.id}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                      <span style="font-weight: 800; font-size: 13px; color: ${chip.color};">${chip.icon} ${chip.name}</span>
                      ${isEquipped ? '<span style="font-size: 10px; background: #00f3ff; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: 800;">TAKILI</span>' :
                        (isUnlocked ? '<span style="font-size: 10px; color: #4ade80;">AÇIK</span>' :
                        `<span style="font-size: 10px; color: #ffb300;">🔒 ${chip.cost}</span>`)}
                    </div>
                    <div style="font-size: 11px; color: #cbd5e1; line-height: 1.35;">${chip.desc}</div>
                    <div style="margin-top: 6px;">
                      ${isEquipped ? `
                        <button class="btn btn-secondary btn-small rso-chip-action-btn" data-action="unequip" data-chip="${chip.id}" style="width: 100%; font-size: 10px; padding: 3px;">ÇIKAR</button>
                      ` : (isUnlocked ? `
                        <button class="btn btn-small rso-chip-action-btn" data-action="equip" data-chip="${chip.id}" style="width: 100%; font-size: 10px; padding: 3px;">BU KADEMEYE TAK</button>
                      ` : `
                        <button class="btn btn-secondary btn-small rso-chip-action-btn" data-action="buy" data-chip="${chip.id}" ${!canAfford ? 'disabled' : ''} style="width: 100%; font-size: 10px; padding: 3px; border-color: #ffb300; color: #ffb300;">
                          SATIN AL (${chip.cost})
                        </button>
                      `)}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }

      return `
        <div class="rso-chip-col ${colClass}">
          <div class="rso-chip-col-header">
            <span>${branchTitle}</span>
            <span style="font-size: 12px; opacity: 0.8;">4 KADEME</span>
          </div>
          ${tiersHtml}
        </div>
      `;
    }

    container.innerHTML = `
      <div class="rso-chips-container">
        ${renderBranchColumn('🔴 TAARRUZ YONGALARI (SALDIRI MATRİSİ)', 'offense', 'rso-col-offense')}
        ${renderBranchColumn('🔵 SAVUNMA & SİSTEM YONGALARI (TAKTİK MATRİS)', 'defense', 'rso-col-defense')}
      </div>
    `;

    // Buton Eylemleri
    container.querySelectorAll('.rso-chip-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const act = btn.getAttribute('data-action');
        const cid = btn.getAttribute('data-chip');
        const chip = CHIPS_CATALOG[cid];
        if (!chip) return;

        if (act === 'buy') {
          if (modifyScrap(-chip.cost) >= 0) {
            state.unlockedChips.push(chip.id);
            state.equippedChips[chip.branch][chip.tier] = chip.id;
            saveProgression(state);
            if (window.audio && window.audio.playUpgrade) window.audio.playUpgrade();
            renderChipsTab(container);
            updateFooterSummary();
          }
        } else if (act === 'equip') {
          state.equippedChips[chip.branch][chip.tier] = chip.id;
          saveProgression(state);
          if (window.audio && window.audio.playPickup) window.audio.playPickup();
          renderChipsTab(container);
          updateFooterSummary();
        } else if (act === 'unequip') {
          state.equippedChips[chip.branch][chip.tier] = null;
          saveProgression(state);
          if (window.audio && window.audio.playConfirm) window.audio.playConfirm();
          renderChipsTab(container);
          updateFooterSummary();
        }
      });
    });
  }

  function updateFooterSummary() {
    const sumShip = document.getElementById('rsoSumShip');
    const sumWeapon = document.getElementById('rsoSumWeapon');
    const sumChips = document.getElementById('rsoSumChips');

    const ship = SHIPS_CATALOG[state.selectedShip] || SHIPS_CATALOG.interceptor;
    const weapon = WEAPONS_CATALOG[state.selectedWeapon] || WEAPONS_CATALOG.blaster;

    if (sumShip) sumShip.textContent = ship.name;
    if (sumWeapon) sumWeapon.textContent = weapon.name;

    let count = 0;
    ['offense', 'defense'].forEach(b => {
      for (let t = 1; t <= 4; t++) {
        if (state.equippedChips[b][t]) count++;
      }
    });
    if (sumChips) sumChips.textContent = `${count}/8`;
  }

  // ============================================================================
  // 10. AÇMA, KAPATMA VE OYUNA BAŞLAMA AKIŞI
  // ============================================================================
  function cycleTab(dir = 1) {
    const tabs = ['ships', 'weapons', 'chips'];
    const idx = tabs.indexOf(currentTab || 'ships');
    const nextIdx = (idx + dir + tabs.length) % tabs.length;
    switchTab(tabs[nextIdx]);
    if (window.audio && typeof window.audio.playFocusTick === 'function') window.audio.playFocusTick();
  }

  function openRunSetup(targetTab = 'ships') {
    state = loadProgression();
    inspectingShipId = state.selectedShip;
    inspectingWeaponId = state.selectedWeapon;

    const overlay = createRunSetupOverlay();
    overlay.classList.remove('hidden');

    // Ana menü kutusunu arkada gizle/dondur
    const menu = document.getElementById('menuOverlay');
    if (menu) menu.classList.add('hidden');

    window.gameState = 'RUN_SETUP';
    if (typeof window.GamepadUI !== 'undefined' && window.GamepadUI && typeof window.GamepadUI.clearFocus === 'function') {
      window.GamepadUI.focusIndex = 0;
      window.GamepadUI.clearFocus();
    }

    switchTab(targetTab || 'ships');
    if (window.audio && window.audio.playConfirm) window.audio.playConfirm();
  }

  function closeRunSetup() {
    const overlay = document.getElementById('runSetupOverlay');
    if (overlay) overlay.classList.add('hidden');

    window.gameState = 'MENU';
    const menu = document.getElementById('menuOverlay');
    if (menu) {
      menu.classList.remove('hidden');
    }
    if (window.audio && window.audio.playCancel) window.audio.playCancel();
  }

  function launchRun() {
    const overlay = document.getElementById('runSetupOverlay');
    if (overlay) overlay.classList.add('hidden');

    // 1) Gemi sınıfını senkronize et
    window.selectedShipClass = state.selectedShip;
    localStorage.setItem('zortex_ship', state.selectedShip);

    // 2) Aktif profili güncelle
    if (typeof window.getActiveProfile === 'function' && typeof window.saveAllProfiles === 'function') {
      const prof = window.getActiveProfile();
      if (prof) {
        prof.selectedShip = state.selectedShip;
        window.saveAllProfiles();
      }
    }

    // 3) Oyunu başlat!
    if (typeof window.startGame === 'function') {
      window.startGame();
    }
  }

  // ============================================================================
  // 11. OYUNCUYA LOADOUT UYGULAMA (STARTGAME ANINDA ÇAĞRILIR)
  // ============================================================================
  function applyActiveLoadout(player) {
    if (!player) return;

    state = loadProgression();
    const ship = SHIPS_CATALOG[state.selectedShip] || SHIPS_CATALOG.interceptor;
    const starterWeaponId = state.selectedWeapon || 'blaster';

    console.log(`[ZortexMetaProgression] Applying loadout: Ship=${ship.name}, StarterWeapon=${starterWeaponId}`);

    // A) Gemi Sınıfı Değerleri
    player.shipClassId = ship.id;
    player.shipClass = ship;
    player.maxHealth = Math.round(100 * ship.hpMod);
    player.health = player.maxHealth;
    player.maxShield = Math.round(50 * ship.shieldMod);
    player.shield = player.maxShield;
    const baseSpeed = 4.2;
    player.baseSpeed = baseSpeed;
    const techSpeed = (typeof hasTechNode === 'function' && hasTechNode('util_thruster')) ? 1.10 : 1.0;
    const hangarSpeed = (typeof getHangarBonus === 'function') ? (1 + getHangarBonus('speed')) : 1.0;
    player.speed = (baseSpeed * ship.speedMod) * hangarSpeed * techSpeed;
    player.critChance = (player.critChance || 0.05) + ship.critMod;

    // Özel Gemi Pasifleri
    if (ship.id === 'spectre') {
      player.hasShadowStrike = true;
    } else if (ship.id === 'tesla_storm') {
      player.hasTeslaAura = true;
    } else if (ship.id === 'hive_carrier') {
      player.hasCarrierSwarm = true;
      if (typeof player.addDrone === 'function') {
        player.addDrone();
        player.addDrone();
      }
    } else if (ship.id === 'cryo_warden') {
      player.hasCryoBullets = true;
    } else if (ship.id === 'overclocker') {
      player.hasOverclockerRage = true;
      player.fireRate = (player.fireRate || 0.16) * 0.74;
    } else if (ship.id === 'pyromancer') {
      player.hasInfernoTrail = true;
      player.hasBurnBullets = true;
    } else if (ship.id === 'scavenger') {
      player.scrapMultiplier = 2.0;
      player.pickupRadius = (player.pickupRadius || 100) * 1.45;
    } else if (ship.id === 'singularity') {
      player.hasVoidVortexCrit = true;
    }

    // B) Başlangıç Silahı Ayarlaması
    player.activeWeaponId = starterWeaponId;
    if (window.weaponManager && typeof window.weaponManager.selectWeapon === 'function') {
      window.weaponManager.selectWeapon(starterWeaponId);
    }

    // C) Donatılmış Nöral Yongaların Uygulanması
    player.equippedChips = [];
    ['offense', 'defense'].forEach(branch => {
      for (let t = 1; t <= 4; t++) {
        const chipId = state.equippedChips[branch][t];
        if (chipId && CHIPS_CATALOG[chipId]) {
          const chip = CHIPS_CATALOG[chipId];
          player.equippedChips.push(chip.id);
          try {
            chip.apply(player);
          } catch (err) {
            console.warn('[ZortexMetaProgression] Error applying chip:', chip.id, err);
          }
        }
      }
    });

    console.log(`[ZortexMetaProgression] Loadout applied with ${player.equippedChips.length} active neural chips.`);
  }

  // ============================================================================
  // 12. DIŞA AKTARMA (GLOBAL API)
  // ============================================================================
  const ZortexMetaProgression = {
    SHIPS_CATALOG,
    WEAPONS_CATALOG,
    CHIPS_CATALOG,
    getState: () => state,
    selectShip: (id) => {
      if (SHIPS_CATALOG[id]) {
        if (!state.unlockedShips.includes(id)) state.unlockedShips.push(id);
        state.selectedShip = id;
        saveProgression(state);
      }
    },
    selectWeapon: (id) => {
      if (WEAPONS_CATALOG[id]) {
        if (!state.unlockedWeapons.includes(id)) state.unlockedWeapons.push(id);
        state.selectedWeapon = id;
        saveProgression(state);
      }
    },
    getScrap,
    modifyScrap,
    openRunSetup,
    closeRunSetup,
    launchRun,
    switchTab,
    cycleTab,
    applyActiveLoadout,
    init: () => {
      createRunSetupOverlay();
      updateAllScrapDisplays(getScrap());
    }
  };

  window.ZortexMetaProgression = ZortexMetaProgression;

  // DOM hazır olduğunda başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ZortexMetaProgression.init());
  } else {
    ZortexMetaProgression.init();
  }

})(window);
