/* ==============================================================
   ZORTEX: CYBER SURVIVOR — FAZ 1 ÇEKİRDEK ENVANTER & SANDIK SİSTEMİ
   6 Silah + 6 Pasif Yuva Mimarisi & Slot Makinesi Sandık Çarkı
   Tasarım Belgesi Bölüm 4, 5, 6, 16.3 & 17 Standartlarına Tam Uyumlu
   12 Silah (4 Ana + 8 Modül) & 2 Dallı Evrim Mimarisi & 42 Pasif Eşya
   ============================================================== */

(() => {
  'use strict';

  // ==============================================================
  // 1. SİLAH VERİ TABLOSU (WEAPONS DATA - 4 ANA + 8 MODÜL = 12 SİLAH)
  // Bölüm 5 & Bölüm 16.3 İki Dallı Evrim Mimarisi
  // ==============================================================
  const WEAPONS_DATA = {
    // --- 4 ÇEKİRDEK ANA SİLAH (İKİ DALLI EVRİM) ---
    blaster: {
      id: 'blaster',
      name: 'Blaster',
      icon: '⚡',
      color: '#00f3ff',
      desc: 'Doğrusal seri plazma atışı.',
      maxLvl: 8,
      isCore: true,
      partner: 'core_cooler', // Varsayılan partner
      evoId: 'gatling_laser',
      evoName: 'Gatling Lazer',
      branchA: {
        evoId: 'gatling_laser',
        evoName: 'Gatling Lazer',
        partner: 'core_cooler',
        partnerName: 'Çekirdek Soğutucu',
        desc: 'Aralıksız kesintisiz foton ışını.'
      },
      branchB: {
        evoId: 'chaos_salvo',
        evoName: 'Kaos Salvosu',
        partner: 'kill_counter',
        partnerName: 'Katliam Sayacı',
        desc: 'Mermiler duvardan ve hedeften sekip ikiye ayrılır.'
      }
    },
    spread: {
      id: 'spread',
      name: 'Saçılma (Spread)',
      icon: '💥',
      color: '#ff0055',
      desc: 'Geniş konik alana yayılan çoklu mermi.',
      maxLvl: 8,
      isCore: true,
      partner: 'optic_lens',
      evoId: 'supernova_core',
      evoName: 'Süpernova Çekirdeği',
      branchA: {
        evoId: 'spectrum_beam',
        evoName: 'Spektrum Işını',
        partner: 'optic_lens',
        partnerName: 'Optik Mercek',
        desc: 'Prizmatik kırılan geniş konik lazer dalgası.'
      },
      branchB: {
        evoId: 'supernova_core',
        evoName: 'Süpernova Çekirdeği',
        partner: 'burn_sigil',
        partnerName: 'Yanık Mühür',
        desc: 'Patlayıp alev alanı bırakan termonükleer mermiler.'
      }
    },
    plasma_beam: {
      id: 'plasma_beam',
      name: 'Plazma Işını',
      icon: '🔥',
      color: '#ffaa00',
      desc: 'Düşmanları delip geçen yoğun foton akışı.',
      maxLvl: 8,
      isCore: true,
      partner: 'cursed_chip',
      evoId: 'thunder_tempest',
      evoName: 'Fırtına Girdabı',
      branchA: {
        evoId: 'nova_line',
        evoName: 'Nova Hattı',
        partner: 'cursed_chip',
        partnerName: 'Lanetli Çip',
        desc: 'Ekran boyu delen, her hedefte katlanan hiper ışın.'
      },
      branchB: {
        evoId: 'thunder_tempest',
        evoName: 'Fırtına Girdabı',
        partner: 'tempest_resonance',
        partnerName: 'Tempest Rezonansı',
        desc: 'Hedefler arasında sıçrayan zincirleme elektrik fırtınası.'
      }
    },
    railgun: {
      id: 'railgun',
      name: 'Railgun',
      icon: '🚀',
      color: '#9d00ff',
      desc: 'Yüksek delici hasarlı şarjlı manyetik atış.',
      maxLvl: 8,
      isCore: true,
      partner: 'phantom_plate',
      evoId: 'glacier_lance',
      evoName: 'Buzul Mızrağı',
      branchA: {
        evoId: 'phantom_rail',
        evoName: 'Hayalet Ray',
        partner: 'phantom_plate',
        partnerName: 'Hayalet Plaka',
        desc: 'Engelleri delen, arkasında 2 sn iyonik hasar izi bırakan atış.'
      },
      branchB: {
        evoId: 'glacier_lance',
        evoName: 'Buzul Mızrağı',
        partner: 'cryo_heart',
        partnerName: 'Kriyo Kalbi',
        desc: 'Hedefleri donduran ve kırılma anında buz şarapneli saçan mızrak.'
      }
    },

    // --- 8 MODÜL SİLAHI (OTOMATİK VE TEK EVRİM DALLI) ---
    orbit_blades: {
      id: 'orbit_blades',
      name: 'Yörünge Bıçakları',
      icon: '⚔️',
      color: '#00ffcc',
      desc: 'Gemiyi çevreleyen dönen enerji bıçakları.',
      maxLvl: 8,
      isCore: false,
      partner: 'overload_cap',
      evoId: 'rending_tempest',
      evoName: 'Kesim Fırtınası',
      branchA: {
        evoId: 'rending_tempest',
        evoName: 'Kesim Fırtınası',
        partner: 'overload_cap',
        partnerName: 'Aşırı Yük Kondansatörü',
        desc: 'Dönen 8 devasa plazma testeresi, temas eden her şeyi biçer.'
      }
    },
    mine_layer: {
      id: 'mine_layer',
      name: 'Mayın Bırakıcı',
      icon: '💣',
      color: '#ff3366',
      desc: 'Geride yaklaşana patlayan siber mayınlar bırakır.',
      maxLvl: 8,
      isCore: false,
      partner: 'quantum_magnet',
      evoId: 'vortex_mine',
      evoName: 'Çekim Mayını',
      branchA: {
        evoId: 'vortex_mine',
        evoName: 'Çekim Mayını',
        partner: 'quantum_magnet',
        partnerName: 'Kuantum Mıknatıs',
        desc: 'İnfilak ettiğinde düşmanları içine çeken mini tekillikler açar.'
      }
    },
    homing_missiles: {
      id: 'homing_missiles',
      name: 'Güdümlü Füze Sürüsü',
      icon: '🎯',
      color: '#ffff00',
      desc: 'En yakın hedeflere kilitlenen mikro roketler.',
      maxLvl: 8,
      isCore: false,
      partner: 'crit_matrix',
      evoId: 'apocalypse_salvo',
      evoName: 'Kıyamet Salvosu',
      branchA: {
        evoId: 'apocalypse_salvo',
        evoName: 'Kıyamet Salvosu',
        partner: 'crit_matrix',
        partnerName: 'Kritik Matris',
        desc: 'Küme bombası bırakan nükleer mikro füzeler fırlatır.'
      }
    },
    tesla_coil: {
      id: 'tesla_coil',
      name: 'Tesla Bobini',
      icon: '🌩️',
      color: '#00d0ff',
      desc: 'Çevredeki hedeflere zincirleme elektrik deşarjı.',
      maxLvl: 8,
      isCore: false,
      partner: 'reactive_shield',
      evoId: 'faraday_cage',
      evoName: 'Faraday Kafesi',
      branchA: {
        evoId: 'faraday_cage',
        evoName: 'Faraday Kafesi',
        partner: 'reactive_shield',
        partnerName: 'Reaktif Kalkan',
        desc: 'Gemi çevresinde kesintisiz dönen yüksek voltaj plazma bariyeri.'
      }
    },
    shadow_clone: {
      id: 'shadow_clone',
      name: 'Gölge Klonu',
      icon: '👥',
      color: '#818cf8',
      desc: 'Geminin hareketlerini ve atışlarını gecikmeyle tekrarlar.',
      maxLvl: 8,
      isCore: false,
      partner: 'inertia_dampener',
      evoId: 'time_shift',
      evoName: 'Zaman Kayması',
      branchA: {
        evoId: 'time_shift',
        evoName: 'Zaman Kayması',
        partner: 'inertia_dampener',
        partnerName: 'Atalet Sönümleyici',
        desc: 'İki gölge klon oluşturur ve zamanı yavaşlatırken çift atış yapar.'
      }
    },
    hologram_prism: {
      id: 'hologram_prism',
      name: 'Hologram Prizma',
      icon: '💠',
      color: '#38bdf8',
      desc: 'Düşman mermilerini saptıran ve emen taktiksel hologram.',
      maxLvl: 8,
      isCore: false,
      partner: 'reflect_plate',
      evoId: 'crystal_cage',
      evoName: 'Kristal Kafes',
      branchA: {
        evoId: 'crystal_cage',
        evoName: 'Kristal Kafes',
        partner: 'reflect_plate',
        partnerName: 'Yansıtıcı Plaka',
        desc: '3 prizma oluşturarak düşman mermilerini emip lazer olarak geri yansıtır.'
      }
    },
    gravity_cannon: {
      id: 'gravity_cannon',
      name: 'Yerçekimi Topu',
      icon: '🌌',
      color: '#c084fc',
      desc: 'Düşmanları içine çeken ve patlayan çekim küresi atar.',
      maxLvl: 8,
      isCore: false,
      partner: 'gravity_shift',
      evoId: 'singularity_core',
      evoName: 'Tekillik Çekirdeği',
      branchA: {
        evoId: 'singularity_core',
        evoName: 'Tekillik Çekirdeği',
        partner: 'gravity_shift',
        partnerName: 'Yerçekimi Kayması',
        desc: 'Tüm ekrandaki küçük düşmanları yutan devasa tekillik yaratır.'
      }
    },
    orbital_satellite: {
      id: 'orbital_satellite',
      name: 'Orbital Lazer Uydusu',
      icon: '🛰️',
      color: '#facc15',
      desc: 'Yörüngeden en yoğun düşman kümesine dikey lazer sütunu indirir.',
      maxLvl: 8,
      isCore: false,
      partner: 'focus_lens',
      evoId: 'solar_cannon',
      evoName: 'Güneş Topu',
      branchA: {
        evoId: 'solar_cannon',
        evoName: 'Güneş Topu',
        partner: 'focus_lens',
        partnerName: 'Evrim Odak Lensi',
        desc: 'Yeryüzünü eriten devasa termonükleer solar patlama sütunu indirir.'
      }
    }
  };

  // ==============================================================
  // 2. PASİF EŞYA VERİ TABLOSU (PASSIVES DATA - 42 EŞYA)
  // Tasarım Belgesi Bölüm 17 Standartlarına Tam Uyumlu
  // ==============================================================
  const PASSIVES_DATA = {
    // --- SALDIRI (OFFENSE) ---
    core_cooler: {
      id: 'core_cooler',
      name: 'Çekirdek Soğutucu',
      category: 'Saldırı',
      icon: '❄️',
      color: '#00f3ff',
      desc: 'Ateş hızını seviye başına +%8 artırır.',
      maxLvl: 5,
      partner: 'blaster'
    },
    kill_counter: {
      id: 'kill_counter',
      name: 'Katliam Sayacı',
      category: 'Saldırı',
      icon: '💀',
      color: '#ef4444',
      desc: 'Her 20 öldürmede +%1 kalıcı hasar verir (tavan +%30).',
      maxLvl: 5,
      partner: 'blaster'
    },
    armor_piercing: {
      id: 'armor_piercing',
      name: 'Delici Uç Mermi',
      category: 'Saldırı',
      icon: '🗡️',
      color: '#fb7185',
      desc: 'Mermi delme miktarını +1 ve zırhlı hedeflere hasarı +%25 artırır.',
      maxLvl: 5,
      partner: 'blaster'
    },
    overheat_barrel: {
      id: 'overheat_barrel',
      name: 'Aşırı Isınma Namlusu',
      category: 'Saldırı',
      icon: '🔥',
      color: '#f97316',
      desc: 'Aralıksız ateş ettikçe silah hasarı +%40 a kadar katlanır.',
      maxLvl: 5,
      partner: 'spread'
    },
    shrapnel_shell: {
      id: 'shrapnel_shell',
      name: 'Şarapnel Kabuğu',
      category: 'Saldırı',
      icon: '💥',
      color: '#ea580c',
      desc: 'Mermiler çarpışma noktasında 3 adet mini şarapnel saçar.',
      maxLvl: 5,
      partner: 'spread'
    },
    weakpoint_scanner: {
      id: 'weakpoint_scanner',
      name: 'Zayıf Nokta Tarayıcı',
      category: 'Saldırı',
      icon: '🔬',
      color: '#eab308',
      desc: 'Kritik vuruş hasar çarpanını x1.5 ten x2.2 ye çıkarır.',
      maxLvl: 5,
      partner: 'homing_missiles'
    },
    shield_breaker: {
      id: 'shield_breaker',
      name: 'Kalkan Delici',
      category: 'Saldırı',
      icon: '⚡',
      color: '#06b6d4',
      desc: 'Düşman kalkan ve enerji bariyerlerine 2 kat hasar verir.',
      maxLvl: 5,
      partner: 'plasma_beam'
    },

    // --- SİNERJİ & EVRİM KATALİZÖRLERİ (SYNERGY) ---
    optic_lens: {
      id: 'optic_lens',
      name: 'Optik Mercek',
      category: 'Sinerji',
      icon: '🔍',
      color: '#ff0077',
      desc: 'Mermi boyutunu +%10 ve menzilini +%15 artırır.',
      maxLvl: 5,
      partner: 'spread'
    },
    burn_sigil: {
      id: 'burn_sigil',
      name: 'Yanık Mühür',
      category: 'Sinerji',
      icon: '♨️',
      color: '#dc2626',
      desc: 'Ateş hasarını ve düşman yanma süresini +%30 artırır.',
      maxLvl: 5,
      partner: 'spread'
    },
    tempest_resonance: {
      id: 'tempest_resonance',
      name: 'Tempest Rezonansı',
      category: 'Sinerji',
      icon: '⚡',
      color: '#3b82f6',
      desc: 'Elektrik zincirleme hedefini +2 ve deşarj hasarını +%20 artırır.',
      maxLvl: 5,
      partner: 'plasma_beam'
    },
    cryo_heart: {
      id: 'cryo_heart',
      name: 'Kriyo Kalbi',
      category: 'Sinerji',
      icon: '🧊',
      color: '#38bdf8',
      desc: 'Düşman donma süresini +%40, donmuş hedeflere hasarı +%30 artırır.',
      maxLvl: 5,
      partner: 'railgun'
    },
    hack_carrier: {
      id: 'hack_carrier',
      name: 'Hack Taşıyıcı',
      category: 'Sinerji',
      icon: '👾',
      color: '#a855f7',
      desc: 'Yok edilen düşmanlar patlayıp yakındaki 2 düşmanı hackler.',
      maxLvl: 5,
      partner: 'plasma_beam'
    },
    drone_commander: {
      id: 'drone_commander',
      name: 'Dron Komutanı',
      category: 'Sinerji',
      icon: '🛸',
      color: '#10b981',
      desc: 'Tüm müttefik dronların saldırı hızını ve hasarını +%25 artırır.',
      maxLvl: 5,
      partner: 'orbital_satellite'
    },

    // --- SAVUNMA (DEFENSE) ---
    phantom_plate: {
      id: 'phantom_plate',
      name: 'Hayalet Plaka',
      category: 'Savunma',
      icon: '🛡️',
      color: '#6366f1',
      desc: 'Hasardan kaçınma şansını seviye başına +%4 artırır (tavan %20).',
      maxLvl: 5,
      partner: 'railgun'
    },
    reactive_shield: {
      id: 'reactive_shield',
      name: 'Reaktif Kalkan',
      category: 'Savunma',
      icon: '💠',
      color: '#06b6d4',
      desc: 'Maks. kalkanı +15 artırır ve dolum gecikmesini kısaltır.',
      maxLvl: 5,
      partner: 'tesla_coil'
    },
    reflect_plate: {
      id: 'reflect_plate',
      name: 'Yansıtıcı Plaka',
      category: 'Savunma',
      icon: '🪞',
      color: '#0284c7',
      desc: 'Kalkan aktifken düşman mermilerinin %20 sini geri yansıtır.',
      maxLvl: 5,
      partner: 'hologram_prism'
    },
    reactive_armor: {
      id: 'reactive_armor',
      name: 'Reaktif Zırh',
      category: 'Savunma',
      icon: '🛡️',
      color: '#475569',
      desc: 'Hasar alındığında çevredeki düşmanları iten şok dalgası salar.',
      maxLvl: 5,
      partner: 'tesla_coil'
    },
    emergency_repair_drone: {
      id: 'emergency_repair_drone',
      name: 'Acil Onarım Dronu',
      category: 'Savunma',
      icon: '🩺',
      color: '#22c55e',
      desc: 'Can <%25 olduğunda 5 sn içinde canın %30 unu onarır (60s CD).',
      maxLvl: 5,
      partner: 'orbit_blades'
    },
    titanium_core: {
      id: 'titanium_core',
      name: 'Titanyum Çekirdek',
      category: 'Savunma',
      icon: '💎',
      color: '#94a3b8',
      desc: 'Maks. canı +25 ve çarpışma hasarı direncini +%15 artırır.',
      maxLvl: 5,
      partner: 'orbit_blades'
    },
    cheap_escape: {
      id: 'cheap_escape',
      name: 'Ucuz Kaçış',
      category: 'Savunma',
      icon: '⚡',
      color: '#facc15',
      desc: 'Ölümcül darbede 1 HP ile hayatta kalır ve 2.0s dokunulmazlık verir (1 kez).',
      maxLvl: 5,
      partner: 'shadow_clone'
    },

    // --- HAREKET (MOBILITY) ---
    overload_cap: {
      id: 'overload_cap',
      name: 'Aşırı Yük Kondansatörü',
      category: 'Hareket',
      icon: '⚡',
      color: '#eab308',
      desc: 'Dash bekleme süresini -%8 azaltır ve arkada elektrik izi bırakır.',
      maxLvl: 5,
      partner: 'orbit_blades'
    },
    ghost_dash: {
      id: 'ghost_dash',
      name: 'Hayalet Dash',
      category: 'Hareket',
      icon: '👻',
      color: '#818cf8',
      desc: 'Dash esnasında içinden geçilen tüm düşmanlara 50 hasar vurur.',
      maxLvl: 5,
      partner: 'shadow_clone'
    },
    inertia_dampener: {
      id: 'inertia_dampener',
      name: 'Atalet Sönümleyici',
      category: 'Hareket',
      icon: '🎛️',
      color: '#64748b',
      desc: 'Gemi durma tepkisini ve manevra kabiliyetini +%50 hızlandırır.',
      maxLvl: 5,
      partner: 'shadow_clone'
    },
    gravity_shift: {
      id: 'gravity_shift',
      name: 'Yerçekimi Kayması',
      category: 'Hareket',
      icon: '🌀',
      color: '#a855f7',
      desc: 'Dash menzilini +%30 artırır ve dash bitiminde çekim alanı açar.',
      maxLvl: 5,
      partner: 'gravity_cannon'
    },

    // --- EKONOMİ & YARDIMCI (UTILITY) ---
    quantum_magnet: {
      id: 'quantum_magnet',
      name: 'Kuantum Mıknatıs',
      category: 'Ekonomi',
      icon: '🧲',
      color: '#38bdf8',
      desc: 'XP çekim alanını seviye başına +%20 artırır.',
      maxLvl: 5,
      partner: 'mine_layer'
    },
    scrap_converter: {
      id: 'scrap_converter',
      name: 'Hurda Dönüştürücü',
      category: 'Ekonomi',
      icon: '🔩',
      color: '#ca8a04',
      desc: 'Yok edilen her 50 düşmanda +15 ekstra siber hurda kazandırır.',
      maxLvl: 5,
      partner: 'mine_layer'
    },
    explorer_eye: {
      id: 'explorer_eye',
      name: 'Kâşif Gözü',
      category: 'Ekonomi',
      icon: '👁️',
      color: '#14b8a6',
      desc: 'Ganimet sandığı ve sağlık kapsülü düşme şansını +%25 artırır.',
      maxLvl: 5,
      partner: 'mine_layer'
    },
    miner_drone: {
      id: 'miner_drone',
      name: 'Madenci Dron',
      category: 'Ekonomi',
      icon: '🛸',
      color: '#059669',
      desc: 'Uzaktaki XP kristallerini otomatik toplayıp gemiye taşıyan dron.',
      maxLvl: 5,
      partner: 'orbital_satellite'
    },
    xp_interest: {
      id: 'xp_interest',
      name: 'XP Faizi',
      category: 'Ekonomi',
      icon: '📈',
      color: '#10b981',
      desc: 'Her dalga bitiminde toplam kazanılan XP nin %10 u kadar bonus verir.',
      maxLvl: 5,
      partner: 'orbital_satellite'
    },

    // --- RİSK / ÖDÜL & ŞANS (RISK/REWARD) ---
    cursed_chip: {
      id: 'cursed_chip',
      name: 'Lanetli Çip',
      category: 'Risk/Ödül',
      icon: '👾',
      color: '#a855f7',
      desc: 'Düşman sayısını +%6, kazanılan XP yi +%8 artırır.',
      maxLvl: 5,
      partner: 'plasma_beam'
    },
    blood_bond: {
      id: 'blood_bond',
      name: 'Kan Bağı',
      category: 'Risk/Ödül',
      icon: '🩸',
      color: '#b91c1c',
      desc: 'Can azaldıkça silah hasarı kademeli artar (maksimum +%50 hasar).',
      maxLvl: 5,
      partner: 'railgun'
    },
    cyber_gambler: {
      id: 'cyber_gambler',
      name: 'Siber Kumarbaz',
      category: 'Risk/Ödül',
      icon: '🎲',
      color: '#d946ef',
      desc: 'Her atışta %10 şansla 3 kat hasar, %5 şansla ıskalama.',
      maxLvl: 5,
      partner: 'homing_missiles'
    },
    double_bet: {
      id: 'double_bet',
      name: 'Çifte Bahis',
      category: 'Risk/Ödül',
      icon: '🎰',
      color: '#f59e0b',
      desc: 'Sandıklardan 2 kat ödül verir, ancak düşman canını +%20 artırır.',
      maxLvl: 5,
      partner: 'mine_layer'
    },
    crit_matrix: {
      id: 'crit_matrix',
      name: 'Kritik Matris',
      category: 'Risk/Ödül',
      icon: '🎯',
      color: '#f97316',
      desc: 'Kritik vuruş şansını seviye başına +%5 artırır.',
      maxLvl: 5,
      partner: 'homing_missiles'
    },
    focus_lens: {
      id: 'focus_lens',
      name: 'Evrim Odak Lensi',
      category: 'Risk/Ödül',
      icon: '🔭',
      color: '#facc15',
      desc: 'Seviye atlamada evrim ve efsanevi kart gelme şansını +%15 artırır.',
      maxLvl: 5,
      partner: 'orbital_satellite'
    },

    // --- TAMAMLAYICI PROTOKOLLER ---
    ammo_fabricator: {
      id: 'ammo_fabricator',
      name: 'Mermi Fabrikatörü',
      category: 'Saldırı',
      icon: '⚙️',
      color: '#06b6d4',
      desc: 'Mermi hızını seviye başına +%15 artırır.',
      maxLvl: 5,
      partner: 'railgun'
    },
    nanite_coating: {
      id: 'nanite_coating',
      name: 'Nanit Kaplama',
      category: 'Savunma',
      icon: '💉',
      color: '#10b981',
      desc: 'Saniyede +0.5 HP pasif zırh onarımı sağlar.',
      maxLvl: 5,
      partner: 'reactive_shield'
    },
    shield_battery: {
      id: 'shield_battery',
      name: 'Kalkan Bataryası',
      category: 'Savunma',
      icon: '🔋',
      color: '#0284c7',
      desc: 'Kalkan dolum bekleme süresini 4.5 sn den 3.0 sn ye düşürür.',
      maxLvl: 5,
      partner: 'reactive_shield'
    },
    static_discharge: {
      id: 'static_discharge',
      name: 'Statik Boşalma',
      category: 'Saldırı',
      icon: '⚡',
      color: '#00f3ff',
      desc: 'Her 10 mermide bir çevredeki düşmanları sersemleten mini EMP saçar.',
      maxLvl: 5,
      partner: 'tesla_coil'
    },
    cyber_instinct: {
      id: 'cyber_instinct',
      name: 'Siber İçgüdü',
      category: 'Savunma',
      icon: '🧠',
      color: '#8b5cf6',
      desc: 'Düşman mermisi teğet geçtiğinde 0.25 sn refleks zaman yavaşlaması verir.',
      maxLvl: 5,
      partner: 'shadow_clone'
    },
    overclock_module: {
      id: 'overclock_module',
      name: 'Hız Aşırtma Modülü',
      category: 'Sinerji',
      icon: '⏱️',
      color: '#f43f5e',
      desc: 'Tüm aktif yeteneklerin bekleme süresini -%15 kısaltır.',
      maxLvl: 5,
      partner: 'hologram_prism'
    },
    quantum_core: {
      id: 'quantum_core',
      name: 'Kuantum Çekirdek',
      category: 'Saldırı',
      icon: '⚛️',
      color: '#c084fc',
      desc: 'Tüm silahların genel hasarını seviye başına +%6 artırır.',
      maxLvl: 5,
      partner: 'gravity_cannon'
    }
  };

  // ==============================================================
  // 3. ENVANTER YÖNETİCİSİ (INVENTORY MANAGER)
  // 6 Silah + 6 Pasif Yuvası & İkincil Silah Motoru
  // ==============================================================
  class InventoryManager {
    constructor() {
      this.maxWeaponSlots = 6;
      this.maxPassiveSlots = 6;
      this.weapons = [
        { id: 'blaster', level: 1, evolved: false, evoBranch: null },
        { id: 'spread', level: 1, evolved: false, evoBranch: null },
        { id: 'plasma_beam', level: 1, evolved: false, evoBranch: null },
        { id: 'railgun', level: 1, evolved: false, evoBranch: null }
      ];
      this.passives = []; // Array of { id, level }

      // İkincil Silah Durum Hafızaları (Zero-GC Nesneleri)
      this.bladeAngle = 0;
      this.mineTimer = 0;
      this.activeMines = [];
      this.missileTimer = 0;
      this.teslaTimer = 0;

      // 4 Yeni Modül Silah Hafızası
      this.cloneHistory = []; // Konum geçmişi (ring buffer)
      this.cloneTimer = 0;
      this.prismTimer = 0;
      this.activePrisms = [];
      this.gravityTimer = 0;
      this.activeGravities = [];
      this.satelliteTimer = 0;
      this.activeSatellites = [];

      // Pasif Ekonomi / Durum Sayaçları
      this.killCountForPassive = 0;
      this.continuousFireTimer = 0;
      this.emergencyRepairCd = 0;
      this.cheapEscapeUsed = false;
      this.bulletCounterForEMP = 0;
    }

    reset() {
      this.weapons = [
        { id: 'blaster', level: 1, evolved: false, evoBranch: null },
        { id: 'spread', level: 1, evolved: false, evoBranch: null },
        { id: 'plasma_beam', level: 1, evolved: false, evoBranch: null },
        { id: 'railgun', level: 1, evolved: false, evoBranch: null }
      ];
      this.passives = [];
      this.bladeAngle = 0;
      this.mineTimer = 0;
      this.activeMines = [];
      this.missileTimer = 0;
      this.teslaTimer = 0;
      this.cloneHistory = [];
      this.cloneTimer = 0;
      this.prismTimer = 0;
      this.activePrisms = [];
      this.gravityTimer = 0;
      this.activeGravities = [];
      this.satelliteTimer = 0;
      this.activeSatellites = [];
      this.killCountForPassive = 0;
      this.continuousFireTimer = 0;
      this.emergencyRepairCd = 0;
      this.cheapEscapeUsed = false;
      this.bulletCounterForEMP = 0;

      this.syncPlayerWeaponManager();
      this.renderHUD();
    }

    hasWeapon(id) {
      return this.weapons.some(w => w.id === id);
    }

    getWeapon(id) {
      return this.weapons.find(w => w.id === id) || null;
    }

    getWeaponLevel(id) {
      const w = this.getWeapon(id);
      return w ? w.level : 0;
    }

    canAddWeapon() {
      return this.weapons.length < this.maxWeaponSlots;
    }

    addWeapon(id) {
      if (this.hasWeapon(id)) return this.upgradeWeapon(id);
      if (!this.canAddWeapon() || !WEAPONS_DATA[id]) return false;
      this.weapons.push({ id, level: 1, evolved: false, evoBranch: null });
      this.syncPlayerWeaponManager();
      this.renderHUD();
      return true;
    }

    upgradeWeapon(id) {
      const w = this.getWeapon(id);
      if (!w) return this.addWeapon(id);
      if (w.level < WEAPONS_DATA[id].maxLvl) {
        w.level++;
        this.renderHUD();
        return true;
      }
      return false;
    }

    evolveWeapon(id, branch = 'branchA') {
      const w = this.getWeapon(id);
      if (!w) return false;
      w.evolved = true;
      w.evoBranch = branch;
      const data = WEAPONS_DATA[id];
      const branchData = (branch === 'branchB' && data.branchB) ? data.branchB : data.branchA;
      if (branchData) {
        w.evoId = branchData.evoId;
      }

      // Oyuncu üzerindeki evrim bayraklarını tetikle
      if (typeof player !== 'undefined' && player) {
        if (w.evoId === 'gatling_laser') player.hasGatlingLaser = true;
        if (w.evoId === 'chaos_salvo') player.hasChaosSalvo = true;
        if (w.evoId === 'spectrum_beam') player.hasSpectrumBeam = true;
        if (w.evoId === 'supernova_core') player.hasSupernovaCore = true;
        if (w.evoId === 'nova_line') player.hasNovaLine = true;
        if (w.evoId === 'thunder_tempest') player.hasThunderTempest = true;
        if (w.evoId === 'phantom_rail') player.hasPhantomRail = true;
        if (w.evoId === 'glacier_lance') player.hasGlacierLance = true;
      }

      this.renderHUD();
      return true;
    }

    hasPassive(id) {
      return this.passives.some(p => p.id === id);
    }

    getPassive(id) {
      return this.passives.find(p => p.id === id) || null;
    }

    getPassiveLevel(id) {
      const p = this.getPassive(id);
      return p ? p.level : 0;
    }

    canAddPassive() {
      return this.passives.length < this.maxPassiveSlots;
    }

    addPassive(id) {
      if (this.hasPassive(id)) return this.upgradePassive(id);
      if (!this.canAddPassive() || !PASSIVES_DATA[id]) return false;
      this.passives.push({ id, level: 1 });
      this.applyPassiveModifiers();
      this.renderHUD();
      return true;
    }

    upgradePassive(id) {
      const p = this.getPassive(id);
      if (!p) return this.addPassive(id);
      if (p.level < PASSIVES_DATA[id].maxLvl) {
        p.level++;
        this.applyPassiveModifiers();
        this.renderHUD();
        return true;
      }
      return false;
    }

    // ==============================================================
    // 42 PASİF EŞYA ETKİLERİNİN OYUNCUYA UYGULANMASI (Zero-GC)
    // ==============================================================
    applyPassiveModifiers() {
      if (typeof player === 'undefined' || !player) return;

      // 1. Core Cooler -> Ateş Hızı
      const coolerLvl = this.getPassiveLevel('core_cooler');
      player.hasFireRate = coolerLvl > 0;
      player.fireRateModifier = Math.max(0.4, 1.0 - (coolerLvl * 0.08));

      // 2. Kill Counter -> Kalıcı hasar bonusu
      const killLvl = this.getPassiveLevel('kill_counter');
      player.killCounterBonus = killLvl > 0 ? Math.min(0.30, Math.floor(this.killCountForPassive / 20) * 0.01 * killLvl) : 0;

      // 3. Armor Piercing -> Delici Uç
      const apLvl = this.getPassiveLevel('armor_piercing');
      if (apLvl > 0) {
        player.pierceCount = Math.max(player.pierceCount || 0, apLvl);
        player.hasPiercing = true;
        player.antiArmorMultiplier = 1.0 + (apLvl * 0.25);
      }

      // 4. Overheat Barrel -> Sürekli ateş bonusu
      const heatLvl = this.getPassiveLevel('overheat_barrel');
      player.hasOverheatBarrel = heatLvl > 0;

      // 5. Shrapnel Shell
      const shrapnelLvl = this.getPassiveLevel('shrapnel_shell');
      player.hasShrapnel = shrapnelLvl > 0;

      // 6. Weakpoint Scanner
      const weakLvl = this.getPassiveLevel('weakpoint_scanner');
      player.critMultiplier = weakLvl > 0 ? (1.5 + weakLvl * 0.14) : 1.5;

      // 7. Shield Breaker
      const breakerLvl = this.getPassiveLevel('shield_breaker');
      player.shieldBreakerMultiplier = breakerLvl > 0 ? (1.0 + breakerLvl * 0.20) : 1.0;

      // 8. Optic Lens
      const lensLvl = this.getPassiveLevel('optic_lens');
      if (lensLvl > 0) {
        player.bulletScaleModifier = 1.0 + (lensLvl * 0.10);
      }

      // 9. Burn Sigil
      const burnLvl = this.getPassiveLevel('burn_sigil');
      player.burnDamageMultiplier = burnLvl > 0 ? (1.0 + burnLvl * 0.30) : 1.0;

      // 10. Tempest Resonance
      const tempestLvl = this.getPassiveLevel('tempest_resonance');
      player.tempestChainBonus = tempestLvl * 2;
      player.tempestDamageMultiplier = tempestLvl > 0 ? (1.0 + tempestLvl * 0.20) : 1.0;

      // 11. Cryo Heart
      const cryoLvl = this.getPassiveLevel('cryo_heart');
      player.cryoDurationMultiplier = cryoLvl > 0 ? (1.0 + cryoLvl * 0.40) : 1.0;
      player.cryoDamageMultiplier = cryoLvl > 0 ? (1.0 + cryoLvl * 0.30) : 1.0;

      // 12. Hack Carrier
      const hackLvl = this.getPassiveLevel('hack_carrier');
      player.hasHackCarrier = hackLvl > 0;

      // 13. Drone Commander
      const cmdrLvl = this.getPassiveLevel('drone_commander');
      player.droneMultiplier = cmdrLvl > 0 ? (1.0 + cmdrLvl * 0.25) : 1.0;

      // 14. Phantom Plate -> Kaçınma
      const plateLvl = this.getPassiveLevel('phantom_plate');
      player.dodgeChance = Math.min(0.20, plateLvl * 0.04);

      // 15. Reactive Shield -> Maks Kalkan
      const shieldLvl = this.getPassiveLevel('reactive_shield');
      const prevShieldBonus = player._appliedReactiveShield || 0;
      const newShieldBonus = shieldLvl * 15;
      if (newShieldBonus !== prevShieldBonus) {
        const diffS = newShieldBonus - prevShieldBonus;
        player.maxShield = Math.max(50, (player.maxShield || 50) + diffS);
        if (diffS > 0) player.shield = Math.min(player.maxShield, (player.shield || 0) + diffS);
        player._appliedReactiveShield = newShieldBonus;
      }

      // 16. Reflect Plate -> Mermi Yansıtma
      const reflectLvl = this.getPassiveLevel('reflect_plate');
      player.reflectChance = reflectLvl > 0 ? Math.min(0.40, reflectLvl * 0.08) : 0;

      // 17. Reactive Armor
      const armorLvl = this.getPassiveLevel('reactive_armor');
      player.hasReactiveArmor = armorLvl > 0;

      // 18. Emergency Repair Drone
      const repairLvl = this.getPassiveLevel('emergency_repair_drone');
      player.hasEmergencyRepair = repairLvl > 0;

      // 19. Titanium Core -> Maks Can
      const titanLvl = this.getPassiveLevel('titanium_core');
      const prevTitanBonus = player._appliedTitanCore || 0;
      const newTitanBonus = titanLvl * 25;
      if (newTitanBonus !== prevTitanBonus) {
        const diffH = newTitanBonus - prevTitanBonus;
        player.maxHealth = Math.max(100, (player.maxHealth || 100) + diffH);
        if (diffH > 0) player.health = Math.min(player.maxHealth, (player.health || 0) + diffH);
        player._appliedTitanCore = newTitanBonus;
      }
      player.contactResist = titanLvl > 0 ? Math.min(0.45, titanLvl * 0.15) : 0;

      // 20. Cheap Escape
      const escapeLvl = this.getPassiveLevel('cheap_escape');
      player.hasCheapEscape = escapeLvl > 0 && !this.cheapEscapeUsed;

      // 21. Overload Cap -> Dash CD & Alev İzi
      const capLvl = this.getPassiveLevel('overload_cap');
      if (capLvl > 0) {
        player.hasFlameDash = true;
        player.dashCooldownModifier = Math.max(0.5, 1.0 - (capLvl * 0.08));
      }

      // 22. Ghost Dash
      const ghostLvl = this.getPassiveLevel('ghost_dash');
      player.hasGhostDash = ghostLvl > 0;

      // 23. Inertia Dampener
      const inertiaLvl = this.getPassiveLevel('inertia_dampener');
      player.frictionModifier = inertiaLvl > 0 ? (1.0 + inertiaLvl * 0.50) : 1.0;

      // 24. Gravity Shift
      const gravShiftLvl = this.getPassiveLevel('gravity_shift');
      player.dashDistanceModifier = gravShiftLvl > 0 ? (1.0 + gravShiftLvl * 0.30) : 1.0;

      // 25. Quantum Magnet -> Çekim Alanı
      const magnetLvl = this.getPassiveLevel('quantum_magnet');
      if (magnetLvl > 0) {
        player.magnetRadius = 120 * (1 + (magnetLvl * 0.20));
      }

      // 26. Scrap Converter
      const scrapLvl = this.getPassiveLevel('scrap_converter');
      player.hasScrapConverter = scrapLvl > 0;

      // 27. Explorer Eye
      const expLvl = this.getPassiveLevel('explorer_eye');
      player.dropRateBonus = expLvl > 0 ? (expLvl * 0.25) : 0;

      // 28. Miner Drone
      const minerLvl = this.getPassiveLevel('miner_drone');
      player.hasMinerDrone = minerLvl > 0;

      // 29. XP Interest
      const interestLvl = this.getPassiveLevel('xp_interest');
      player.hasXpInterest = interestLvl > 0;

      // 30. Cursed Chip
      const cursedLvl = this.getPassiveLevel('cursed_chip');
      player.cursedChipBonus = cursedLvl > 0 ? (cursedLvl * 0.08) : 0;

      // 31. Blood Bond
      const bloodLvl = this.getPassiveLevel('blood_bond');
      player.hasBloodBond = bloodLvl > 0;

      // 32. Cyber Gambler
      const gambleLvl = this.getPassiveLevel('cyber_gambler');
      player.hasCyberGambler = gambleLvl > 0;

      // 33. Double Bet
      const betLvl = this.getPassiveLevel('double_bet');
      player.hasDoubleBet = betLvl > 0;

      // 34. Crit Matrix -> Kritik Şansı
      const critLvl = this.getPassiveLevel('crit_matrix');
      if (critLvl > 0) {
        player.critChance = 0.05 + (critLvl * 0.05);
      }

      // 35. Focus Lens -> Şans Artışı
      const focusLvl = this.getPassiveLevel('focus_lens');
      player.luckBonus = focusLvl > 0 ? (focusLvl * 15) : 0;

      // 36. Ammo Fabricator -> Mermi Hızı
      const ammoLvl = this.getPassiveLevel('ammo_fabricator');
      player.bulletSpeedMultiplier = ammoLvl > 0 ? (1.0 + ammoLvl * 0.15) : 1.0;

      // 37. Nanite Coating -> Can Yenilenmesi
      const naniteLvl = this.getPassiveLevel('nanite_coating');
      player.healthRegenRate = naniteLvl * 0.5;

      // 38. Shield Battery
      const batteryLvl = this.getPassiveLevel('shield_battery');
      player.shieldRechargeDelay = batteryLvl > 0 ? Math.max(2.0, 4.5 - (batteryLvl * 0.5)) : 4.5;

      // 39. Static Discharge
      const staticLvl = this.getPassiveLevel('static_discharge');
      player.hasStaticDischarge = staticLvl > 0;

      // 40. Cyber Instinct
      const instinctLvl = this.getPassiveLevel('cyber_instinct');
      player.hasCyberInstinct = instinctLvl > 0;

      // 41. Overclock Module
      const clockLvl = this.getPassiveLevel('overclock_module');
      player.ultimateCooldownMultiplier = clockLvl > 0 ? Math.max(0.5, 1.0 - (clockLvl * 0.15)) : 1.0;

      // 42. Quantum Core -> Tüm Silahlara Hasar
      const qCoreLvl = this.getPassiveLevel('quantum_core');
      player.globalDamageMultiplier = qCoreLvl > 0 ? (1.0 + qCoreLvl * 0.06) : 1.0;
    }

    syncPlayerWeaponManager() {
      if (typeof weaponManager === 'undefined' || !weaponManager) return;
      const coreIds = Object.keys(weaponManager.weapons);
      const equippedIds = this.weapons.map(w => w.id).filter(id => weaponManager.weapons[id]);
      const allIds = Array.from(new Set([...coreIds, ...equippedIds]));
      weaponManager.weaponList = allIds;
      if (!weaponManager.weapons[weaponManager.activeWeaponId]) {
        weaponManager.selectWeapon('blaster');
      }
    }

    // 6 Silah & 6 Pasif Sınırına Göre Kart Havuzunu Filtreleme
    filterPool(pool) {
      if (!Array.isArray(pool)) return pool;
      return pool.filter(card => {
        // Silah kartı mı?
        if (card.weaponId || WEAPONS_DATA[card.id]) {
          const wId = card.weaponId || card.id;
          const isOwned = this.hasWeapon(wId);
          if (!isOwned && !this.canAddWeapon()) return false;
          if (isOwned && this.getWeaponLevel(wId) >= WEAPONS_DATA[wId].maxLvl) return false;
        }
        // Pasif kartı mı?
        if (card.passiveId || PASSIVES_DATA[card.id]) {
          const pId = card.passiveId || card.id;
          const isOwned = this.hasPassive(pId);
          if (!isOwned && !this.canAddPassive()) return false;
          if (isOwned && this.getPassiveLevel(pId) >= PASSIVES_DATA[pId].maxLvl) return false;
        }
        return true;
      });
    }

    // ==============================================================
    // 8 MODÜL SİLAHININ PER-FRAME GÜNCELLEMESİ (Zero-GC)
    // ==============================================================
    updateSecondaryWeapons(dt, player, enemies) {
      if (!player || player.dead || gameState !== 'PLAYING') return;

      const enemiesArr = Array.isArray(enemies) ? enemies : [];
      const enemyCount = enemiesArr.length;

      // 1. YÖRÜNGE BIÇAKLARI (Orbit Blades & Rending Tempest)
      const bladeLvl = this.getWeaponLevel('orbit_blades');
      if (bladeLvl > 0) {
        const isEvo = this.getWeapon('orbit_blades')?.evolved;
        this.bladeAngle = (this.bladeAngle + dt * (isEvo ? 5.5 : (3.0 + bladeLvl * 0.3))) % (Math.PI * 2);
        const bladeCount = isEvo ? 8 : Math.min(6, 2 + Math.floor(bladeLvl / 2));
        const orbitRadius = (isEvo ? 100 : 75) + bladeLvl * 2;
        const bladeDmg = (isEvo ? 65 : 25) + bladeLvl * 12;

        for (let i = 0; i < bladeCount; i++) {
          const a = this.bladeAngle + (i * ((Math.PI * 2) / bladeCount));
          const bx = player.x + Math.cos(a) * orbitRadius;
          const by = player.y + Math.sin(a) * orbitRadius;

          for (let j = 0; j < enemyCount; j++) {
            const e = enemiesArr[j];
            if (e && !e.dead && Math.hypot(e.x - bx, e.y - by) < (e.radius || 15) + 16) {
              e.hit(bladeDmg * dt * 4, false);
              if (Math.random() < 0.25 && typeof particles !== 'undefined') {
                particles.emit(bx, by, isEvo ? '#ffe600' : '#00ffcc', 3, 3, 2, 0.4);
              }
            }
          }
        }
      }

      // 2. MAYIN BIRAKICI (Mine Layer & Vortex Mine)
      const mineLvl = this.getWeaponLevel('mine_layer');
      if (mineLvl > 0) {
        const isEvo = this.getWeapon('mine_layer')?.evolved;
        this.mineTimer += dt;
        const mineInterval = isEvo ? 0.7 : Math.max(0.65, 1.8 - mineLvl * 0.15);
        if (this.mineTimer >= mineInterval) {
          this.mineTimer = 0;
          if (this.activeMines.length < (isEvo ? 18 : 12)) {
            this.activeMines.push({
              x: player.x,
              y: player.y,
              life: 7.0,
              radius: isEvo ? 16 : 12,
              dmg: (isEvo ? 140 : 75) + mineLvl * 25,
              isVortex: isEvo
            });
            if (audio && typeof audio.playMineDrop === 'function') audio.playMineDrop();
          }
        }
      }

      // Mayın güncelleme
      if (this.activeMines.length > 0) {
        for (let i = this.activeMines.length - 1; i >= 0; i--) {
          const m = this.activeMines[i];
          m.life -= dt;
          let detonate = (m.life <= 0);

          if (!detonate) {
            for (let j = 0; j < enemyCount; j++) {
              const e = enemiesArr[j];
              if (e && !e.dead && Math.hypot(e.x - m.x, e.y - m.y) < (e.radius || 15) + 40) {
                detonate = true;
                break;
              }
            }
          }

          if (detonate) {
            const blastRadius = m.isVortex ? 150 : 90;
            for (let j = 0; j < enemyCount; j++) {
              const e = enemiesArr[j];
              if (e && !e.dead) {
                const dist = Math.hypot(e.x - m.x, e.y - m.y);
                if (dist < blastRadius) {
                  e.hit(m.dmg * (1 - dist / (blastRadius + 20)), true);
                  if (m.isVortex) {
                    // Vorteks çekimi
                    e.x += (m.x - e.x) * 0.35;
                    e.y += (m.y - e.y) * 0.35;
                  }
                }
              }
            }
            if (typeof audio !== 'undefined' && audio.playExplosion) audio.playExplosion(0.9, m.x, m.y);
            if (typeof particles !== 'undefined') particles.emit(m.x, m.y, m.isVortex ? '#a855f7' : '#ff3366', 28, 6, 4, 0.8);
            if (typeof addShockwave === 'function') addShockwave(m.x, m.y, m.isVortex ? 0xa855f7 : 0xff3366, blastRadius, 0.25, 3.0);
            if (typeof window.swapAndPop === 'function') window.swapAndPop(this.activeMines, i);
            else this.activeMines.splice(i, 1);
          }
        }
      }

      // 3. GÜDÜMLÜ FÜZELER (Homing Missiles & Apocalypse Salvo)
      const missileLvl = this.getWeaponLevel('homing_missiles');
      if (missileLvl > 0) {
        const isEvo = this.getWeapon('homing_missiles')?.evolved;
        this.missileTimer += dt;
        const missileInterval = isEvo ? 0.6 : Math.max(0.7, 1.6 - missileLvl * 0.12);
        if (this.missileTimer >= missileInterval) {
          this.missileTimer = 0;
          const count = (isEvo ? 3 : 1) + Math.floor(missileLvl / 2);
          for (let i = 0; i < count; i++) {
            if (typeof spawnHomingMissile === 'function') {
              const ang = player.angle + (Math.random() - 0.5) * 1.5;
              spawnHomingMissile(player.x, player.y, ang, (isEvo ? 85 : 45) + missileLvl * 15);
            }
          }
        }
      }

      // 4. TESLA BOBİNİ (Tesla Coil & Faraday Cage)
      const teslaLvl = this.getWeaponLevel('tesla_coil');
      if (teslaLvl > 0) {
        const isEvo = this.getWeapon('tesla_coil')?.evolved;
        this.teslaTimer += dt;
        const teslaInterval = isEvo ? 0.35 : Math.max(0.55, 1.3 - teslaLvl * 0.1);
        if (this.teslaTimer >= teslaInterval) {
          this.teslaTimer = 0;
          const targetCount = (isEvo ? 5 : 1) + Math.floor(teslaLvl / 2);
          const teslaRange = isEvo ? 400 : 320;
          const teslaDmg = (isEvo ? 85 : 45) + teslaLvl * 20;

          let hitCount = 0;
          for (let j = 0; j < enemyCount; j++) {
            const e = enemiesArr[j];
            if (e && !e.dead && Math.hypot(e.x - player.x, e.y - player.y) < teslaRange) {
              e.hit(teslaDmg, false);
              if (typeof particles !== 'undefined') {
                particles.emit((player.x + e.x) / 2, (player.y + e.y) / 2, isEvo ? '#00f3ff' : '#00d0ff', 12, 4, 3, 0.4);
              }
              hitCount++;
              if (hitCount >= targetCount) break;
            }
          }
          if (hitCount > 0 && typeof audio !== 'undefined' && audio.playLaser) {
            audio.playLaser();
          }
        }
      }

      // 5. GÖLGE KLONU (Shadow Clone & Time Shift)
      const cloneLvl = this.getWeaponLevel('shadow_clone');
      if (cloneLvl > 0) {
        const isEvo = this.getWeapon('shadow_clone')?.evolved;
        // Ring buffer konum geçmişi kaydı
        this.cloneHistory.push({ x: player.x, y: player.y, angle: player.angle });
        if (this.cloneHistory.length > 60) this.cloneHistory.shift();

        this.cloneTimer += dt;
        const cloneShootInterval = isEvo ? 0.35 : 0.75;
        if (this.cloneTimer >= cloneShootInterval && this.cloneHistory.length >= 25) {
          this.cloneTimer = 0;
          const pastPos = this.cloneHistory[0];
          // Klon en yakın düşmana ateş eder
          let closestEnemy = null;
          let minDist = 450;
          for (let j = 0; j < enemyCount; j++) {
            const e = enemiesArr[j];
            if (e && !e.dead) {
              const d = Math.hypot(e.x - pastPos.x, e.y - pastPos.y);
              if (d < minDist) {
                minDist = d;
                closestEnemy = e;
              }
            }
          }
          if (closestEnemy && typeof spawnBullet === 'function') {
            const fireAngle = Math.atan2(closestEnemy.y - pastPos.y, closestEnemy.x - pastPos.x);
            spawnBullet(pastPos.x, pastPos.y, fireAngle, 14, (isEvo ? 55 : 30) + cloneLvl * 8, '#818cf8');
            if (isEvo) {
              // Zaman kayması: 2. klon atışı
              spawnBullet(pastPos.x, pastPos.y, fireAngle + 0.15, 14, 55 + cloneLvl * 8, '#818cf8');
            }
          }
        }
      }

      // 6. HOLOGRAM PRİZMA (Hologram Prism & Crystal Cage)
      const prismLvl = this.getWeaponLevel('hologram_prism');
      if (prismLvl > 0) {
        const isEvo = this.getWeapon('hologram_prism')?.evolved;
        this.prismTimer += dt;
        const prismInterval = isEvo ? 4.0 : 7.0;
        if (this.prismTimer >= prismInterval) {
          this.prismTimer = 0;
          const prismCount = isEvo ? 3 : 1;
          for (let p = 0; p < prismCount; p++) {
            const offsetAngle = (p * (Math.PI * 2 / prismCount));
            this.activePrisms.push({
              x: player.x + Math.cos(offsetAngle) * 80,
              y: player.y + Math.sin(offsetAngle) * 80,
              life: isEvo ? 6.0 : 4.5,
              radius: 24,
              maxAbsorb: (isEvo ? 200 : 100) + prismLvl * 30
            });
          }
        }
      }

      // Prizmaları güncelle
      if (this.activePrisms.length > 0) {
        for (let i = this.activePrisms.length - 1; i >= 0; i--) {
          const pr = this.activePrisms[i];
          pr.life -= dt;
          if (pr.life <= 0) {
            // Prizma patlaması
            if (typeof addShockwave === 'function') addShockwave(pr.x, pr.y, 0x38bdf8, 120, 0.25, 2.5);
            if (typeof window.swapAndPop === 'function') window.swapAndPop(this.activePrisms, i);
            else this.activePrisms.splice(i, 1);
          }
        }
      }

      // 7. YERÇEKİMİ TOPU (Gravity Cannon & Singularity Core)
      const gravLvl = this.getWeaponLevel('gravity_cannon');
      if (gravLvl > 0) {
        const isEvo = this.getWeapon('gravity_cannon')?.evolved;
        this.gravityTimer += dt;
        const gravInterval = isEvo ? 2.0 : 3.5;
        if (this.gravityTimer >= gravInterval) {
          this.gravityTimer = 0;
          // En yakın yoğun noktaya doğru hareket eden küre
          this.activeGravities.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(player.angle) * (isEvo ? 140 : 100),
            vy: Math.sin(player.angle) * (isEvo ? 140 : 100),
            life: isEvo ? 4.0 : 2.8,
            pullRadius: isEvo ? 220 : 140,
            dmg: (isEvo ? 80 : 35) + gravLvl * 15,
            isSingularity: isEvo
          });
        }
      }

      // Yerçekimi kürelerini güncelle
      if (this.activeGravities.length > 0) {
        for (let i = this.activeGravities.length - 1; i >= 0; i--) {
          const g = this.activeGravities[i];
          g.x += g.vx * dt;
          g.y += g.vy * dt;
          g.life -= dt;

          // Etraftaki düşmanları merkeze çek ve ez
          for (let j = 0; j < enemyCount; j++) {
            const e = enemiesArr[j];
            if (e && !e.dead) {
              const dist = Math.hypot(e.x - g.x, e.y - g.y);
              if (dist < g.pullRadius) {
                e.x += (g.x - e.x) * dt * (g.isSingularity ? 4.5 : 2.5);
                e.y += (g.y - e.y) * dt * (g.isSingularity ? 4.5 : 2.5);
                e.hit(g.dmg * dt, false);
              }
            }
          }

          if (g.life <= 0) {
            if (typeof addShockwave === 'function') addShockwave(g.x, g.y, 0xc084fc, g.pullRadius * 1.2, 0.3, 3.5);
            if (typeof particles !== 'undefined') particles.emit(g.x, g.y, '#c084fc', 35, 7, 5, 1.0);
            if (typeof window.swapAndPop === 'function') window.swapAndPop(this.activeGravities, i);
            else this.activeGravities.splice(i, 1);
          }
        }
      }

      // 8. ORBİTAL LAZER UYDUSU (Orbital Satellite & Solar Cannon)
      const satLvl = this.getWeaponLevel('orbital_satellite');
      if (satLvl > 0) {
        const isEvo = this.getWeapon('orbital_satellite')?.evolved;
        this.satelliteTimer += dt;
        const satInterval = isEvo ? 2.2 : 4.0;
        if (this.satelliteTimer >= satInterval) {
          this.satelliteTimer = 0;
          // En yüksek canlı veya en yakın elit hedefe lazer sütunu indir
          let bestTarget = null;
          let maxHp = 0;
          for (let j = 0; j < enemyCount; j++) {
            const e = enemiesArr[j];
            if (e && !e.dead && e.hp > maxHp) {
              maxHp = e.hp;
              bestTarget = e;
            }
          }
          if (bestTarget) {
            const tx = bestTarget.x;
            const ty = bestTarget.y;
            const beamDmg = (isEvo ? 260 : 120) + satLvl * 35;
            const beamRadius = isEvo ? 90 : 50;

            for (let j = 0; j < enemyCount; j++) {
              const e = enemiesArr[j];
              if (e && !e.dead && Math.hypot(e.x - tx, e.y - ty) < beamRadius) {
                e.hit(beamDmg, true);
              }
            }

            if (typeof particles !== 'undefined') {
              particles.emit(tx, ty, isEvo ? '#ffe600' : '#facc15', 30, 8, 5, 0.9);
            }
            if (typeof addShockwave === 'function') {
              addShockwave(tx, ty, isEvo ? 0xffe600 : 0xfacc15, beamRadius * 1.5, 0.25, 3.0);
            }
            if (typeof audio !== 'undefined' && audio.playLaser) audio.playLaser();
          }
        }
      }
    }

    // 12 Slotlu HUD DOM Çizimi
    renderHUD() {
      const bar = document.getElementById('inventory12SlotsBar');
      if (!bar) return;

      // Silah Yuvaları
      const wSlotsContainer = document.getElementById('inventoryWeaponSlots');
      if (wSlotsContainer) {
        let html = '';
        for (let i = 0; i < this.maxWeaponSlots; i++) {
          const w = this.weapons[i];
          if (w && WEAPONS_DATA[w.id]) {
            const data = WEAPONS_DATA[w.id];
            const isActive = (typeof weaponManager !== 'undefined' && weaponManager.activeWeaponId === w.id);
            let pips = '';
            for (let p = 1; p <= data.maxLvl; p++) {
              pips += `<span class="slot-pip ${p <= w.level ? 'filled' : ''}"></span>`;
            }
            const evoLabel = w.evolved ? `👑 ${w.evoBranch === 'branchB' ? 'EVO-B' : 'EVO-A'}` : `Lv.${w.level}`;
            html += `
              <div class="inv-slot weapon-slot ${isActive ? 'active' : ''} ${w.evolved ? 'evolved' : ''}" 
                   onclick="if(window.weaponManager) window.weaponManager.selectWeapon('${w.id}');"
                   title="${data.name} (Seviye ${w.level}/${data.maxLvl})">
                <span class="slot-num">${i + 1}</span>
                <span class="slot-icon">${data.icon}</span>
                <span class="slot-lvl">${evoLabel}</span>
                <div class="slot-pips">${pips}</div>
              </div>
            `;
          } else {
            html += `
              <div class="inv-slot empty-slot" title="Boş Silah Yuvası">
                <span class="slot-empty-plus">+</span>
              </div>
            `;
          }
        }
        wSlotsContainer.innerHTML = html;
      }

      // Pasif Yuvaları
      const pSlotsContainer = document.getElementById('inventoryPassiveSlots');
      if (pSlotsContainer) {
        let html = '';
        for (let i = 0; i < this.maxPassiveSlots; i++) {
          const p = this.passives[i];
          if (p && PASSIVES_DATA[p.id]) {
            const data = PASSIVES_DATA[p.id];
            let pips = '';
            for (let pip = 1; pip <= data.maxLvl; pip++) {
              pips += `<span class="slot-pip passive-pip ${pip <= p.level ? 'filled' : ''}"></span>`;
            }
            html += `
              <div class="inv-slot passive-slot" title="${data.name} [${data.category}] (Seviye ${p.level}/${data.maxLvl})">
                <span class="slot-icon">${data.icon}</span>
                <span class="slot-lvl">Lv.${p.level}</span>
                <div class="slot-pips">${pips}</div>
              </div>
            `;
          } else {
            html += `
              <div class="inv-slot empty-slot passive-empty" title="Boş Pasif Yuvası">
                <span class="slot-empty-plus">+</span>
              </div>
            `;
          }
        }
        pSlotsContainer.innerHTML = html;
      }
    }

    drawPixi(g, player) {
      if (!g || !player || player.dead) return;

      // 1. Yörünge Bıçakları GPU Çizimi
      const bladeLvl = this.getWeaponLevel('orbit_blades');
      if (bladeLvl > 0) {
        const isEvo = this.getWeapon('orbit_blades')?.evolved;
        const bladeCount = isEvo ? 8 : Math.min(6, 2 + Math.floor(bladeLvl / 2));
        const orbitRadius = (isEvo ? 100 : 75) + bladeLvl * 2;
        const col = isEvo ? 0xffe600 : 0x00ffcc;

        for (let i = 0; i < bladeCount; i++) {
          const a = this.bladeAngle + (i * ((Math.PI * 2) / bladeCount));
          const bx = player.x + Math.cos(a) * orbitRadius;
          const by = player.y + Math.sin(a) * orbitRadius;

          g.beginFill(col, 0.85);
          g.drawCircle(bx, by, isEvo ? 9.0 : 6.5);
          g.endFill();
          g.stroke({ width: 2, color: 0xffffff, alpha: 0.9 });
        }
      }

      // 2. Mayınlar GPU Çizimi
      for (let i = 0; i < this.activeMines.length; i++) {
        const m = this.activeMines[i];
        const mCol = m.isVortex ? 0xa855f7 : 0xff3366;
        g.beginFill(mCol, 0.45);
        g.drawCircle(m.x, m.y, m.radius);
        g.endFill();
        g.stroke({ width: 2, color: mCol, alpha: 0.9 });
        g.beginFill(0xffffff, 0.9);
        g.drawCircle(m.x, m.y, 3);
        g.endFill();
      }

      // 3. Gölge Klonu Çizimi
      if (this.cloneHistory.length >= 25 && this.getWeaponLevel('shadow_clone') > 0) {
        const past = this.cloneHistory[0];
        g.beginFill(0x818cf8, 0.45);
        g.drawCircle(past.x, past.y, 16);
        g.endFill();
        g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.7 });
      }

      // 4. Hologram Prizmalar Çizimi
      for (let i = 0; i < this.activePrisms.length; i++) {
        const pr = this.activePrisms[i];
        g.beginFill(0x38bdf8, 0.4);
        g.drawCircle(pr.x, pr.y, pr.radius);
        g.endFill();
        g.stroke({ width: 2, color: 0x38bdf8, alpha: 0.85 });
      }

      // 5. Yerçekimi Küreleri Çizimi
      for (let i = 0; i < this.activeGravities.length; i++) {
        const gv = this.activeGravities[i];
        g.beginFill(0xc084fc, 0.55);
        g.drawCircle(gv.x, gv.y, gv.isSingularity ? 28 : 18);
        g.endFill();
        g.stroke({ width: 2.5, color: 0xffffff, alpha: 0.9 });
      }
    }
  }

  // ==============================================================
  // 4. SİBER SANDIK VARLIĞI (CYBER CHEST PICKUP)
  // ==============================================================
  class CyberChest {
    constructor(x, y, tier = 'elite') {
      this.x = x;
      this.y = y;
      this.tier = tier; // 'elite' (1 ödül), 'miniboss' (3 ödül), 'boss' (5 ödül)
      this.radius = 24;
      this.life = 60.0;
      this.bobTimer = 0;
      this.dead = false;
      this.color = tier === 'boss' ? '#ffe600' : (tier === 'miniboss' ? '#a855f7' : '#00f3ff');
    }

    update(dt) {
      this.bobTimer += dt * 3.5;
      this.life -= dt;
      if (this.life <= 0) this.dead = true;

      // Manyetik çekim
      if (typeof player !== 'undefined' && player && !player.dead) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < (player.radius || 18) + this.radius) {
          this.collect();
          return;
        }

        const pullRadius = Math.max(160, (player.magnetRadius || 120) * 1.2);
        if (dist < pullRadius) {
          const speed = (1 - dist / pullRadius) * 280;
          this.x += (dx / dist) * speed * dt;
          this.y += (dy / dist) * speed * dt;
        }
      }
    }

    collect() {
      if (this.dead) return;
      this.dead = true;
      if (typeof audio !== 'undefined' && audio.playPickup) audio.playPickup();
      if (typeof particles !== 'undefined') particles.emit(this.x, this.y, this.color, 35, 6, 4, 1.2);
      if (typeof triggerRumble === 'function') triggerRumble('heavy');
      ChestSystem.openChest(this.tier);
    }

    draw(ctx) {
      ctx.save();
      const bob = Math.sin(this.bobTimer) * 5;
      ctx.translate(this.x, this.y + bob);

      ctx.shadowColor = this.color;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.5;

      ctx.fillStyle = 'rgba(10, 20, 40, 0.85)';
      ctx.beginPath();
      ctx.roundRect(-16, -12, 32, 24, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.roundRect(-18, -16, 36, 8, 3);
      ctx.fill();

      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.tier === 'boss' ? '👑' : (this.tier === 'miniboss' ? '💎' : '📦'), 0, 1);

      ctx.restore();
    }

    drawPixi(g) {
      if (!g || this.dead) return;
      const bob = Math.sin(this.bobTimer) * 4;
      const cx = this.x;
      const cy = this.y + bob;
      const col = this.tier === 'boss' ? 0xffe600 : (this.tier === 'miniboss' ? 0xa855f7 : 0x00f3ff);

      g.beginFill(col, 0.35);
      g.drawRect(cx - 14, cy - 10, 28, 20);
      g.endFill();
      g.stroke({ width: 2.2, color: col, alpha: 0.95 });

      g.beginFill(0xffffff, 0.85);
      g.drawRect(cx - 16, cy - 14, 32, 6);
      g.endFill();

      g.beginFill(col, 0.95);
      g.drawCircle(cx, cy, 3.5);
      g.endFill();
    }
  }

  // ==============================================================
  // 5. SLOT MAKİNESİ SANDIK ÇARKI SİSTEMİ (CHEST SLOT MACHINE)
  // Bölüm 4.3 & 16.3 İki Dallı Evrim Entegrasyonu & Kötü Şans Koruması
  // ==============================================================
  const ChestSystem = {
    activeChests: [],
    rewardCount: 1,
    rewards: [],
    spinning: false,
    pityCounter: 0, // Kötü şans koruması (Pity System)

    init() {
      this.ensureChestOverlayDOM();
    },

    spawnChest(x, y, tier = 'elite') {
      const chest = new CyberChest(x, y, tier);
      this.activeChests.push(chest);
      return chest;
    },

    update(dt) {
      for (let i = this.activeChests.length - 1; i >= 0; i--) {
        const c = this.activeChests[i];
        c.update(dt);
        if (c.dead) {
          this.activeChests.splice(i, 1);
        }
      }
    },

    draw(ctx) {
      for (let i = 0; i < this.activeChests.length; i++) {
        this.activeChests[i].draw(ctx);
      }
    },

    drawPixi(g) {
      if (!g) return;
      for (let i = 0; i < this.activeChests.length; i++) {
        this.activeChests[i].drawPixi(g);
      }
    },

    openChest(tier = 'elite') {
      this.ensureChestOverlayDOM();
      const overlay = document.getElementById('chestRewardOverlay');
      if (!overlay) return;

      const prevGameState = (typeof gameState !== 'undefined') ? gameState : 'PLAYING';
      window.__prevGameStateBeforeChest = prevGameState;
      window.gameState = 'CHEST';
      if (typeof gameState !== 'undefined') gameState = 'CHEST';

      let count = 1;
      if (tier === 'boss') count = 5;
      else if (tier === 'miniboss') count = 3;
      this.rewardCount = count;

      // Çifte Bahis pasifi kontrolü (Double Bet)
      const activePlayer = (typeof player !== 'undefined' && player) ? player : window.player;
      if (activePlayer && activePlayer.hasDoubleBet && count < 5) {
        count = Math.min(5, count * 2);
        this.rewardCount = count;
      }

      this.rewards = this.generateRewards(count, tier);

      overlay.classList.remove('hidden');
      const reelsContainer = document.getElementById('chestReelsContainer');
      const claimBtn = document.getElementById('chestClaimBtn');
      const summaryBanner = document.getElementById('chestSummaryBanner');
      const subtitle = overlay.querySelector('.subtitle');
      if (claimBtn) claimBtn.style.display = 'none';
      if (summaryBanner) {
        summaryBanner.style.display = 'none';
        summaryBanner.innerHTML = '';
      }
      if (subtitle) {
        subtitle.innerHTML = '⚡ ÖDÜL ÇARKLARI DÖNÜYOR...';
        subtitle.style.color = '#00f3ff';
      }

      const TEASER_ITEMS = [
        { icon: '⚡', name: 'PLAZMA TÜFEĞİ', desc: 'Silah', color: '#00f3ff' },
        { icon: '🚀', name: 'GÜDÜMLÜ FÜZE', desc: 'Silah', color: '#f59e0b' },
        { icon: '🛡️', name: 'NANO KALKAN', desc: 'Pasif', color: '#10b981' },
        { icon: '🌀', name: 'ÇEKİM GİRDABI', desc: 'Silah', color: '#a855f7' },
        { icon: '🔩', name: 'SİBER HURDA', desc: 'Kaynak', color: '#ffe600' },
        { icon: '⚔️', name: 'TİTANYUM ZIRH', desc: 'Pasif', color: '#3b82f6' },
        { icon: '🔥', name: 'HİPER LAZER', desc: 'Silah', color: '#ef4444' },
        { icon: '🔋', name: 'AŞIRI YÜKLEME', desc: 'Pasif', color: '#06b6d4' },
        { icon: '💎', name: 'XP KRİSTALİ', desc: 'Kaynak', color: '#ec4899' },
        { icon: '👑', name: 'NİHAİ EVRİM', desc: 'Efsanevi Güç', color: '#ffe600' }
      ];

      const ITEM_HEIGHT = 160;
      const WIN_INDEX = 12;
      let reelsHtml = '';

      for (let i = 0; i < count; i++) {
        const reward = this.rewards[i];
        let stripItemsHtml = '';

        for (let t = 0; t < WIN_INDEX; t++) {
          const teaser = TEASER_ITEMS[(t + i * 3) % TEASER_ITEMS.length];
          stripItemsHtml += `
            <div class="reel-item teaser-item">
              <div class="reward-icon" style="color: ${teaser.color};">${teaser.icon}</div>
              <div class="reward-name" style="color: ${teaser.color};">${teaser.name}</div>
              <div class="reward-desc">${teaser.desc}</div>
            </div>
          `;
        }

        const isEvo = reward.type === 'evolution';
        stripItemsHtml += `
          <div class="reel-item winner-item" id="reelWinner_${i}">
            <div class="reward-icon" style="color: ${reward.color || '#00f3ff'};">${reward.icon}</div>
            <div class="reward-name" style="color: ${reward.color || '#fff'};">${reward.name}</div>
            <div class="reward-desc">${reward.desc}</div>
            <div class="reward-badge ${isEvo ? 'badge-evo' : ''}">${isEvo ? '👑 EVRİM KİLİTLENDİ' : '✓ KAZANILDI'}</div>
          </div>
        `;

        const buffer = TEASER_ITEMS[(WIN_INDEX + 1) % TEASER_ITEMS.length];
        stripItemsHtml += `
          <div class="reel-item teaser-item">
            <div class="reward-icon" style="color: ${buffer.color};">${buffer.icon}</div>
            <div class="reward-name" style="color: ${buffer.color};">${buffer.name}</div>
            <div class="reward-desc">${buffer.desc}</div>
          </div>
        `;

        const reelClass = count === 5 ? 'reel-5' : (count === 3 ? 'reel-3' : 'reel-1');
        reelsHtml += `
          <div class="chest-reel ${reelClass}" id="chestReel_${i}">
            <div class="reel-strip" id="reelStrip_${i}" style="transform: translateY(0px);">
              ${stripItemsHtml}
            </div>
          </div>
        `;
      }
      reelsContainer.innerHTML = reelsHtml;

      this.startSpinAnimation(count, ITEM_HEIGHT, WIN_INDEX);
    },

    // İki Dallı Evrim Uygunluğunu Belirleme (Bölüm 16.3)
    findEligibleEvolution(inv) {
      if (!inv) return null;
      for (const w of inv.weapons) {
        if (w.level >= 8 && !w.evolved) {
          const data = WEAPONS_DATA[w.id];
          if (!data) continue;

          // Dal B kontrolü (Öncelikli eğer Dal B ortağı varsa)
          if (data.branchB && inv.hasPassive(data.branchB.partner)) {
            return {
              type: 'evolution',
              weaponId: w.id,
              branch: 'branchB',
              evoId: data.branchB.evoId,
              name: `🔱 EVRİM (DAL B): ${data.branchB.evoName.toUpperCase()}!`,
              desc: data.branchB.desc,
              icon: '👑',
              color: '#ffe600'
            };
          }

          // Dal A kontrolü
          if (data.branchA && inv.hasPassive(data.branchA.partner)) {
            return {
              type: 'evolution',
              weaponId: w.id,
              branch: 'branchA',
              evoId: data.branchA.evoId,
              name: `🔱 EVRİM (DAL A): ${data.branchA.evoName.toUpperCase()}!`,
              desc: data.branchA.desc,
              icon: '👑',
              color: '#ffe600'
            };
          }
        }
      }
      return null;
    },

    generateRewards(count, tier) {
      const inv = window.inventoryManager;
      const rewards = [];
      const hasEvolutionRight = (tier === 'boss' || tier === 'miniboss');

      // Evrim Kontrolü & Kötü Şans Koruması (Pity System)
      let eligibleEvolution = null;
      if (hasEvolutionRight && inv) {
        eligibleEvolution = this.findEligibleEvolution(inv);
        if (!eligibleEvolution) {
          this.pityCounter++;
        } else {
          this.pityCounter = 0; // Garantilendi, sıfırla
        }
      }

      for (let i = 0; i < count; i++) {
        // Son slot evrim hakkına sahipse veya pity devreye girdiyse garanti evrim
        if (i === count - 1 && eligibleEvolution) {
          rewards.push(eligibleEvolution);
          continue;
        }

        const upgradeableWeapons = inv ? inv.weapons.filter(w => w.level < WEAPONS_DATA[w.id].maxLvl) : [];
        const upgradeablePassives = inv ? inv.passives.filter(p => p.level < PASSIVES_DATA[p.id].maxLvl) : [];

        const rng = (typeof gameRng === 'function') ? gameRng : Math.random;
        if (upgradeableWeapons.length > 0 && rng() < 0.52) {
          const chosen = upgradeableWeapons[Math.floor(rng() * upgradeableWeapons.length)];
          const data = WEAPONS_DATA[chosen.id];
          rewards.push({
            type: 'weapon_upgrade',
            id: chosen.id,
            name: `${data.name} +1`,
            desc: `Seviye ${chosen.level + 1}/${data.maxLvl}`,
            icon: data.icon,
            color: data.color
          });
        } else if (upgradeablePassives.length > 0) {
          const chosen = upgradeablePassives[Math.floor(rng() * upgradeablePassives.length)];
          const data = PASSIVES_DATA[chosen.id];
          rewards.push({
            type: 'passive_upgrade',
            id: chosen.id,
            name: `${data.name} +1`,
            desc: `Seviye ${chosen.level + 1}/${data.maxLvl}`,
            icon: data.icon,
            color: data.color
          });
        } else {
          const activePlayer = (typeof player !== 'undefined' && player) ? player : window.player;
          const betMult = (activePlayer && activePlayer.hasDoubleBet) ? 2 : 1;
          const scrapAmt = (tier === 'boss' ? 450 : (tier === 'miniboss' ? 250 : 150)) * betMult;
          rewards.push({
            type: 'scrap',
            amount: scrapAmt,
            name: `+${scrapAmt} SİBER HURDA`,
            desc: 'Geliştirme ve Hangar modifikasyonları için hurda.',
            icon: '🔩',
            color: '#ffe600'
          });
        }
      }
      return rewards;
    },

    startSpinAnimation(count, itemHeight = 160, winIndex = 12) {
      this.spinning = true;
      const targetY = winIndex * itemHeight;

      let tickInterval = null;
      if (typeof audio !== 'undefined' && audio.playTick) {
        audio.playTick();
        tickInterval = setInterval(() => {
          if (this.spinning) {
            audio.playTick(0.2);
          } else {
            clearInterval(tickInterval);
          }
        }, 90);
      }

      for (let i = 0; i < count; i++) {
        const strip = document.getElementById(`reelStrip_${i}`);
        const reel = document.getElementById(`chestReel_${i}`);
        if (!strip || !reel) continue;

        const duration = 1.2 + (i * 0.45);
        requestAnimationFrame(() => {
          strip.style.transition = `transform ${duration}s cubic-bezier(0.12, 0.85, 0.25, 1.02)`;
          strip.style.transform = `translateY(-${targetY}px)`;
        });

        setTimeout(() => {
          if (reel) {
            reel.classList.add('locked');
            if (this.rewards[i].type === 'evolution') {
              reel.classList.add('evolution-winner');
              if (typeof triggerHitStop === 'function') triggerHitStop(0.08);
              if (typeof audio !== 'undefined' && audio.playCardFanfare) audio.playCardFanfare();
            } else {
              if (typeof audio !== 'undefined' && audio.playPickup) audio.playPickup();
            }
            if (typeof triggerRumble === 'function') triggerRumble('medium');
          }

          if (i === count - 1) {
            this.finishSpin();
          }
        }, duration * 1000);
      }
    },

    finishSpin() {
      if (!this.spinning && this.finished) return;
      this.spinning = false;
      this.finished = true;
      if (this.tickInterval) clearInterval(this.tickInterval);

      const overlay = document.getElementById('chestRewardOverlay');
      const subtitle = overlay ? overlay.querySelector('.subtitle') : null;
      if (subtitle) {
        subtitle.innerHTML = '🎉 TÜM ÖDÜLLER KİLİTLENDİ!';
        subtitle.style.color = '#ffe600';
      }

      const summaryBanner = document.getElementById('chestSummaryBanner');
      if (summaryBanner) {
        let summaryHtml = '<div style="font-weight: bold; color: #ffe600; margin-bottom: 4px;">🎁 KAZANILAN ÖDÜLLER:</div>';
        for (let r = 0; r < this.rewards.length; r++) {
          const item = this.rewards[r];
          summaryHtml += `
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">${item.icon}</span>
              <strong style="color: ${item.color || '#fff'};">${item.name}</strong>
              <span style="color: #94a3b8; font-size: 11px;">(${item.desc})</span>
            </div>
          `;
        }
        summaryBanner.innerHTML = summaryHtml;
        summaryBanner.style.display = 'flex';
      }

      const claimBtn = document.getElementById('chestClaimBtn');
      if (claimBtn) {
        claimBtn.style.display = 'inline-block';
        claimBtn.focus();
      }
    },

    speedUpSpin() {
      if (!this.spinning) return;
      const targetY = (this.winIndex || 12) * (this.itemHeight || 160);
      for (let i = 0; i < this.rewardCount; i++) {
        const strip = document.getElementById(`reelStrip_${i}`);
        const reel = document.getElementById(`chestReel_${i}`);
        if (strip) {
          strip.style.transition = 'none';
          strip.style.transform = `translateY(-${targetY}px)`;
        }
        if (reel) {
          reel.classList.add('locked');
          if (this.rewards[i] && this.rewards[i].type === 'evolution') {
            reel.classList.add('evolution-winner');
          }
        }
      }
      this.finishSpin();
    },

    claimRewards() {
      const inv = window.inventoryManager;
      for (const r of this.rewards) {
        if (r.type === 'weapon_upgrade' && inv) {
          inv.upgradeWeapon(r.id);
        } else if (r.type === 'passive_upgrade' && inv) {
          inv.upgradePassive(r.id);
        } else if (r.type === 'evolution' && inv) {
          inv.evolveWeapon(r.weaponId, r.branch || 'branchA');
          const up = (typeof UPGRADES_POOL !== 'undefined') ? UPGRADES_POOL.find(u => u.id === r.evoId) : null;
          if (up && typeof up.apply === 'function') up.apply();
        } else if (r.type === 'scrap') {
          if (typeof scrap !== 'undefined') {
            scrap += r.amount;
            window.scrap = scrap;
          }
        }
      }

      const overlay = document.getElementById('chestRewardOverlay');
      if (overlay) overlay.classList.add('hidden');

      const prev = window.__prevGameStateBeforeChest || 'PLAYING';
      window.gameState = prev;
      if (typeof gameState !== 'undefined') gameState = prev;

      if (inv) inv.renderHUD();
      if (typeof audio !== 'undefined' && audio.playConfirm) audio.playConfirm();
    },

    ensureChestOverlayDOM() {
      if (document.getElementById('chestRewardOverlay')) return;

      const overlay = document.createElement('div');
      overlay.id = 'chestRewardOverlay';
      overlay.className = 'overlay hidden';
      overlay.innerHTML = `
        <div class="neon-box chest-box">
          <div class="chest-header">
            <span class="chest-title-icon">📦</span>
            <h1 class="title" style="font-size: 28px; margin: 0; color: #ffe600; text-shadow: 0 0 15px rgba(255,230,0,0.6);">
              SİBER SANDIK ÇARKI
            </h1>
          </div>
          <div class="subtitle" style="margin-bottom: 16px;">ÖDÜL ÇARKLARI DÖNÜYOR...</div>
          
          <div class="chest-reels-container" id="chestReelsContainer"></div>

          <div id="chestSummaryBanner" class="chest-summary-banner" style="display: none;"></div>

          <div class="chest-actions" style="margin-top: 20px;">
            <button id="chestClaimBtn" class="retro-btn start-btn" onclick="window.ChestSystem.claimRewards();" style="display: none; padding: 12px 36px; font-size: 18px;">
              ⚡ ÖDÜLLERİ AL [A / BOŞLUK]
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      window.addEventListener('keydown', (e) => {
        if (gameState === 'CHEST' && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE')) {
          if (this.spinning) {
            this.speedUpSpin();
          } else {
            const btn = document.getElementById('chestClaimBtn');
            if (btn && btn.style.display !== 'none') {
              this.claimRewards();
            }
          }
        }
      });
    }
  };

  // ==============================================================
  // 6. HAVUZA 12 SİLAH VE 42 PASİF EŞYA KAYDETME (POOL REGISTRATION)
  // ==============================================================
  function registerInventoryUpgrades() {
    const pool = (typeof window.UPGRADES_POOL !== 'undefined') ? window.UPGRADES_POOL : (typeof UPGRADES_POOL !== 'undefined' ? UPGRADES_POOL : null);
    if (!pool || !Array.isArray(pool)) return;

    // 8 Modül Silah Kartı
    const moduleWeaponCards = [
      {
        id: 'orbit_blades',
        name: 'Yörünge Bıçakları',
        icon: '⚔️',
        desc: 'Gemiyi çevreleyen dönen enerji bıçakları. Düşmanlara çarptıkça hasar verir.',
        rarity: 'rare',
        weaponId: 'orbit_blades',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.addWeapon('orbit_blades');
        }
      },
      {
        id: 'mine_layer',
        name: 'Mayın Bırakıcı',
        icon: '💣',
        desc: 'Geride yaklaşana patlayan siber mayınlar bırakır.',
        rarity: 'rare',
        weaponId: 'mine_layer',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.addWeapon('mine_layer');
        }
      },
      {
        id: 'homing_missiles',
        name: 'Güdümlü Füze Sürüsü',
        icon: '🎯',
        desc: 'En yakın hedeflere kilitlenen mikro roketler fırlatır.',
        rarity: 'rare',
        weaponId: 'homing_missiles',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.addWeapon('homing_missiles');
        }
      },
      {
        id: 'tesla_coil',
        name: 'Tesla Bobini',
        icon: '🌩️',
        desc: 'Çevredeki hedeflere zincirleme yüksek voltaj elektrik deşarjı saçar.',
        rarity: 'rare',
        weaponId: 'tesla_coil',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.addWeapon('tesla_coil');
        }
      },
      {
        id: 'shadow_clone',
        name: 'Gölge Klonu',
        icon: '👥',
        desc: 'Geminin hareketlerini ve atışlarını gecikmeyle tekrarlayan taktiksel siber klon.',
        rarity: 'rare',
        weaponId: 'shadow_clone',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.addWeapon('shadow_clone');
        }
      },
      {
        id: 'hologram_prism',
        name: 'Hologram Prizma',
        icon: '💠',
        desc: 'Düşman mermilerini emip saptıran prizmatik savunma projeksiyonu diker.',
        rarity: 'rare',
        weaponId: 'hologram_prism',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.addWeapon('hologram_prism');
        }
      },
      {
        id: 'gravity_cannon',
        name: 'Yerçekimi Topu',
        icon: '🌌',
        desc: 'Düşmanları içine çeken ve patlayan mikro tekillik küresi atar.',
        rarity: 'epic',
        weaponId: 'gravity_cannon',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.addWeapon('gravity_cannon');
        }
      },
      {
        id: 'orbital_satellite',
        name: 'Orbital Lazer Uydusu',
        icon: '🛰️',
        desc: 'Yörüngeden en yoğun düşman kümesine dikey hiper lazer sütunu indirir.',
        rarity: 'epic',
        weaponId: 'orbital_satellite',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.addWeapon('orbital_satellite');
        }
      }
    ];

    // 42 Pasif Eşya Kartı
    const passiveCards = Object.values(PASSIVES_DATA).map(p => {
      let r = 'common';
      if (['cursed_chip', 'blood_bond', 'cyber_gambler', 'focus_lens', 'quantum_core', 'emergency_repair_drone'].includes(p.id)) {
        r = 'rare';
      } else if (['cheap_escape', 'double_bet', 'singularity_core'].includes(p.id)) {
        r = 'epic';
      }
      return {
        id: p.id,
        name: p.name,
        icon: p.icon,
        desc: p.desc,
        rarity: r,
        passiveId: p.id,
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.addPassive(p.id);
        }
      };
    });

    // 16 Evrim Dalı Kartları (Bölüm 16.3)
    const evolutionCards = [
      {
        id: 'gatling_laser',
        name: 'Gatling Lazer',
        desc: 'SİLAH EVRİMİ (Dal A): Kesintisiz delici dev lazer ışını! Ateş bekleme süresi sıfırlanır.',
        icon: '🔱',
        rarity: 'legendary',
        isEvolution: true,
        weaponId: 'blaster',
        branch: 'branchA',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.evolveWeapon('blaster', 'branchA');
        }
      },
      {
        id: 'chaos_salvo',
        name: 'Kaos Salvosu',
        desc: 'SİLAH EVRİMİ (Dal B): Mermiler duvardan sekip 2 ye ayrılır ve her temasta katliam saçar.',
        icon: '💀',
        rarity: 'legendary',
        isEvolution: true,
        weaponId: 'blaster',
        branch: 'branchB',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.evolveWeapon('blaster', 'branchB');
        }
      },
      {
        id: 'spectrum_beam',
        name: 'Spektrum Işını',
        desc: 'SİLAH EVRİMİ (Dal A): Prizmatik kırılan geniş konik lazer dalgası tüm düşmanları biçer.',
        icon: '🌈',
        rarity: 'legendary',
        isEvolution: true,
        weaponId: 'spread',
        branch: 'branchA',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.evolveWeapon('spread', 'branchA');
        }
      },
      {
        id: 'supernova_core',
        name: 'Süpernova Çekirdeği',
        desc: 'SİLAH EVRİMİ (Dal B): Patlayıp alev alanı bırakan termonükleer mermiler.',
        icon: '☀️',
        rarity: 'legendary',
        isEvolution: true,
        weaponId: 'spread',
        branch: 'branchB',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.evolveWeapon('spread', 'branchB');
        }
      },
      {
        id: 'nova_line',
        name: 'Nova Hattı',
        desc: 'SİLAH EVRİMİ (Dal A): Ekran boyu delen, her düşmanda hasarı katlanan hiper ışın.',
        icon: '⚡',
        rarity: 'legendary',
        isEvolution: true,
        weaponId: 'plasma_beam',
        branch: 'branchA',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.evolveWeapon('plasma_beam', 'branchA');
        }
      },
      {
        id: 'thunder_tempest',
        name: 'Fırtına Girdabı',
        desc: 'SİLAH EVRİMİ (Dal B): Hedefler arasında sıçrayan zincirleme elektrik fırtınası.',
        icon: '🌪️',
        rarity: 'legendary',
        isEvolution: true,
        weaponId: 'plasma_beam',
        branch: 'branchB',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.evolveWeapon('plasma_beam', 'branchB');
        }
      },
      {
        id: 'phantom_rail',
        name: 'Hayalet Ray',
        desc: 'SİLAH EVRİMİ (Dal A): Engelleri delen, arkasında 2 sn kalıcı iyonik hasar izi bırakan atış.',
        icon: '👻',
        rarity: 'legendary',
        isEvolution: true,
        weaponId: 'railgun',
        branch: 'branchA',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.evolveWeapon('railgun', 'branchA');
        }
      },
      {
        id: 'glacier_lance',
        name: 'Buzul Mızrağı',
        desc: 'SİLAH EVRİMİ (Dal B): Hedefleri donduran ve kırılma anında buz şarapneli saçan mızrak.',
        icon: '🧊',
        rarity: 'legendary',
        isEvolution: true,
        weaponId: 'railgun',
        branch: 'branchB',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.evolveWeapon('railgun', 'branchB');
        }
      },
      {
        id: 'rending_tempest',
        name: 'Kesim Fırtınası',
        desc: 'SİLAH EVRİMİ: Dönen 8 dev plazma testeresi çevredeki tüm hedefleri biçer.',
        icon: '⚔️',
        rarity: 'legendary',
        isEvolution: true,
        weaponId: 'orbit_blades',
        branch: 'branchA',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.evolveWeapon('orbit_blades', 'branchA');
        }
      },
      {
        id: 'vortex_mine',
        name: 'Çekim Mayını',
        desc: 'SİLAH EVRİMİ: İnfilak ettiğinde düşmanları içine çeken mini tekillikler açar.',
        icon: '🌀',
        rarity: 'legendary',
        isEvolution: true,
        weaponId: 'mine_layer',
        branch: 'branchA',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.evolveWeapon('mine_layer', 'branchA');
        }
      },
      {
        id: 'apocalypse_salvo',
        name: 'Kıyamet Salvosu',
        desc: 'SİLAH EVRİMİ: Küme bombası bırakan nükleer mikro füzeler fırlatır.',
        icon: '🚀',
        rarity: 'legendary',
        isEvolution: true,
        weaponId: 'homing_missiles',
        branch: 'branchA',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.evolveWeapon('homing_missiles', 'branchA');
        }
      },
      {
        id: 'faraday_cage',
        name: 'Faraday Kafesi',
        desc: 'SİLAH EVRİMİ: Gemi çevresinde kesintisiz dönen yüksek voltaj plazma bariyeri.',
        icon: '🌩️',
        rarity: 'legendary',
        isEvolution: true,
        weaponId: 'tesla_coil',
        branch: 'branchA',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.evolveWeapon('tesla_coil', 'branchA');
        }
      },
      {
        id: 'time_shift',
        name: 'Zaman Kayması',
        desc: 'SİLAH EVRİMİ: İki gölge klon oluşturur ve hiper atış yapar.',
        icon: '👥',
        rarity: 'legendary',
        isEvolution: true,
        weaponId: 'shadow_clone',
        branch: 'branchA',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.evolveWeapon('shadow_clone', 'branchA');
        }
      },
      {
        id: 'crystal_cage',
        name: 'Kristal Kafes',
        desc: 'SİLAH EVRİMİ: 3 prizma oluşturarak düşman mermilerini emer ve geri yansıtır.',
        icon: '💠',
        rarity: 'legendary',
        isEvolution: true,
        weaponId: 'hologram_prism',
        branch: 'branchA',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.evolveWeapon('hologram_prism', 'branchA');
        }
      },
      {
        id: 'singularity_core',
        name: 'Tekillik Çekirdeği',
        desc: 'SİLAH EVRİMİ: Ekrandaki tüm küçük düşmanları içine çeken dev tekillik açar.',
        icon: '🌌',
        rarity: 'legendary',
        isEvolution: true,
        weaponId: 'gravity_cannon',
        branch: 'branchA',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.evolveWeapon('gravity_cannon', 'branchA');
        }
      },
      {
        id: 'solar_cannon',
        name: 'Güneş Topu',
        desc: 'SİLAH EVRİMİ: Yeryüzünü eriten devasa termonükleer solar sütun indirir.',
        icon: '🛰️',
        rarity: 'legendary',
        isEvolution: true,
        weaponId: 'orbital_satellite',
        branch: 'branchA',
        apply: () => {
          if (window.inventoryManager) window.inventoryManager.evolveWeapon('orbital_satellite', 'branchA');
        }
      }
    ];

    for (const card of [...moduleWeaponCards, ...passiveCards, ...evolutionCards]) {
      const idx = pool.findIndex(u => u.id === card.id);
      if (idx === -1) {
        pool.push(card);
      } else {
        pool[idx].desc = card.desc;
        pool[idx].name = card.name;
        pool[idx].icon = card.icon;
        pool[idx].apply = card.apply;
        if (card.isEvolution) pool[idx].isEvolution = true;
      }
    }
  }

  // ==============================================================
  // 7. GLOBAL DIŞA AKTARIM VE İLK KURULUM
  // ==============================================================
  const inventoryManager = new InventoryManager();
  window.InventoryManager = InventoryManager;
  window.inventoryManager = inventoryManager;
  window.WEAPONS_DATA = WEAPONS_DATA;
  window.PASSIVES_DATA = PASSIVES_DATA;
  window.ChestSystem = ChestSystem;
  window.CyberChest = CyberChest;
  window.InventoryChestSystem = {
    registerInventoryUpgrades,
    inventoryManager,
    ChestSystem,
    WEAPONS_DATA,
    PASSIVES_DATA
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ChestSystem.init();
      registerInventoryUpgrades();
    });
  } else {
    ChestSystem.init();
    registerInventoryUpgrades();
  }

})();
