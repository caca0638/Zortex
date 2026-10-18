/**
 * ============================================================================
 * ZORTEX: CYBER SURVIVOR - LOCALIZATION & I18N ENGINE (FAZ 3 - 6 / GLOBAL AAA)
 * Module: js/core/localization.js
 * Architecture: Zero-overhead, reactive multi-language dictionary
 * Languages: TR (Türkçe), EN (English), ES (Español), DE (Deutsch)
 * ============================================================================
 */
(function() {
  'use strict';

  const SUPPORTED_LANGS = ['tr', 'en', 'es', 'de'];

  const DICTIONARY = {
    // =========================================================================
    // TÜRKÇE (TR)
    // =========================================================================
    tr: {
      // Dil ve Arayüz
      lang_code: 'TR',
      lang_name: 'TÜRKÇE',
      lang_toggle_badge: 'DİL: <b>TR</b>',
      crt_filter_on: 'RETRO FİLTRE: AÇIK',
      crt_filter_off: 'RETRO FİLTRE: KAPALI',

      // Ana Menü & Butonlar
      start_game: 'SEFERE BAŞLA (LOADOUT)',
      hangar: 'HANGAR',
      codex: 'FÜZYON KODEKSİ',
      tech_tree: 'YETENEK AĞACI',
      achievements: 'BAŞARIMLAR',
      settings: 'AYARLAR',
      retry: 'TEKRAR DENE',
      main_menu: 'ANA MENÜ / HANGAR',
      switch_pilot: 'AKTİF PİLOT:',
      change: '[DEĞİŞTİR]',
      menu_tagline: 'Sonsuz sibernetik uzayda hayatta kal! Düşman filolarını yok et, enerji kristalleri topla, gemini geliştir ve devasa boss mekanizmalarını alt et!',
      high_score_lbl: 'En Yüksek Skor:',
      scrap_lbl: 'Hurda:',
      heat_pacts_btn: 'PAKT DETAYLARI',
      menu_showcase_title: 'SİBER UZAY SAHASI',
      menu_showcase_hint: 'Meteora tıkla • Parçala & Hurda Topla',

      // Kontroller İpuçları
      ctrl_move: '<span class="key-badge">WASD / Oklar</span> Hareket',
      ctrl_aim: '<span class="key-badge">Mouse</span> Hedef Al / Ateş',
      ctrl_dash: '<span class="key-badge">Space / Sağ Tık</span> Siber Dash (Hızlı Kaçış)',
      ctrl_overdrive: '<span class="key-badge">E / Q</span> Overdrive / Ultimate Lazer',
      ctrl_decoy: '<span class="key-badge">C</span> Holo-Kopya (Hedef Şaşırtma)',
      ctrl_gamepad: '<span class="key-badge">Gamepad</span> Sol/Sağ Analog (Twin-Stick)',
      ctrl_autofire: '<span class="key-badge">F</span> Otomatik Ateş Aç/Kapat',
      ctrl_switch_weapon: '<span class="key-badge">1 - 4</span> Silah Değiştir (Açık Silahlar Arasında)',
      ctrl_pause: '<span class="key-badge">P / ESC</span> Oyunu Duraklat',
      ctrl_modal_title: 'SİBER KONTROLLER',
      close_btn: 'KAPAT',

      // Silah Evrimi Bannerı
      evo_banner_tag: 'SİLAH EVRİMİ',
      evo_banner_sub: 'KESİNTİSİZ HİPER DELİCİ PLAZMA IŞINI',

      // Sefer Hazırlığı (Loadout Bay)
      rso_title: 'SEFER HAZIRLIĞI',
      scrap_text: 'HURDA',
      rso_tab_ships: '1. GEMİ SEÇİMİ',
      rso_tab_weapons: '2. BAŞLANGIÇ SİLAHI',
      rso_tab_chips: '3. NÖRAL YONGA MATRİSİ',
      rso_back_btn: '◀ ANA MENÜ',
      rso_pill_ship: 'Gemi:',
      rso_pill_weapon: 'Silah:',
      rso_pill_chips: 'Yongalar:',
      rso_launch_btn: 'SEFERİ BAŞLAT',

      // Profil Yedekleme
      export_profiles_btn: 'YEDEĞİ İNDİR (JSON)',
      import_profiles_btn: 'YEDEK YÜKLE',

      // Gemi Sınıfı Seçimi
      ship_select_title: '⚡ SAVAŞ GEMİSİ SINIFI SEÇ:',
      interceptor_name: 'INTERCEPTOR',
      interceptor_role: 'Seri Avcı',
      interceptor_desc: 'Hız +%25, Kritik +%15, Can -%20<br><span class="ship-passive">Pasif:</span> Dash mermileri savurur',
      titan_name: 'TITAN',
      titan_role: 'Ağır Zırhlı Tank',
      titan_desc: 'Can +%60, Kalkan +%50, Hız -%15<br><span class="ship-passive">Pasif:</span> Kalkan kırılınca EMP Şok Dalgası',
      spectre_name: 'SPECTRE',
      spectre_role: 'Siber Hacker',
      spectre_desc: '+1 Dron, Hack %50 hızlı, Ulti +%30<br><span class="ship-passive">Pasif:</span> Başlangıç Dronu & Hızlı Hack',

      // Profil / Pilot Seçimi
      pilot_select_title: '👤 SİBERNETİK PİLOT SEÇİMİ',
      pilot_select_subtitle: 'BİR PİLOT KAYDI SEÇ YA DA YENİ SİBER AJAN OLUŞTUR',
      new_pilot_placeholder: 'Yeni Pilot Adı (örn: Ajan Beta)',
      new_pilot_btn: '➕ YENİ PROFİL',
      no_profiles_found: 'Kayıtlı pilot profili bulunamadı.',
      create_new_pilot_hint: 'Aşağıdaki alana isim girip "YENİ PROFİL" butonuna basarak bir pilot oluşturun.',
      gp_profile_select: 'Profil Seç',
      gp_login: 'Giriş Yap',
      gp_main_menu: 'Ana Menü',

      // Modlar & Heat
      mode_campaign_btn: 'MOD: <b>SEFER (10 DALGA)</b>',
      mode_endless_btn: 'MOD: <b>SONSUZ HAYATTA KALMA</b>',
      mode_daily_prefix: 'MOD: <b>GÜNLÜK KOŞU</b>',
      mode_hud_campaign: 'SEFER',
      mode_hud_endless: 'SONSUZ',
      mode_hud_daily: 'GÜNLÜK',
      heat_label: 'SİBER TEHLİKE:',
      heat_badge_0: 'NORMAL',
      heat_badge_1: 'HEAT I (+25%)',
      heat_badge_2: 'HEAT II (+50%)',
      heat_badge_3: 'HEAT III (+80%)',
      heat_badge_4: 'HEAT IV (KABUS)',
      heat_desc_0: 'Standart hayatta kalma tecrübesi.',
      heat_desc_1: 'Düşman Canı +%25, Hızı +%15 | +%30 Hurda Bonusu',
      heat_desc_2: 'Düşman Canı +%50, Çift Elit/Boss | +%60 Hurda Bonusu',
      heat_desc_3: 'Düşman Canı +%80, Hızlı Mermiler | +%100 Çift Hurda & Efsanevi Şans',
      heat_desc_4: 'Düşman Canı +%110, Hızı +%45, Mermiler +%40, Çifte Biyom Mini-Bossları! (Hurda ×3)',
      heat_modal_title: 'SİBER TEHLİKE VE CEZA PAKTLARI (PACT OF PUNISHMENT)',
      heat_modal_subtitle: 'Riskini modüler olarak seç, düşmanları güçlendir, ek hurda çarpanı kazan!',
      heat_modal_modular: 'MODÜLER CEZA PAKTLARI',
      heat_modal_confirm: 'ONAYLA & KAPAT',
      total_heat_pts: 'TOPLAM HEAT PUANI:',
      scrap_bonus: 'HURDA BONUSU:',
      pact_active: '✓ AKTİF',
      pact_enable: '+ ETKİNLEŞTİR',
      pact_selected: '● SEÇİLDİ',
      pact_select: 'SEÇ',

      // Pakt İsimleri & Açıklamaları
      pact_name_fast_swarm: 'Hızlı Sürü',
      pact_desc_fast_swarm: 'Düşman hızı +%15',
      pact_name_armored_army: 'Zırhlı Ordu',
      pact_desc_armored_army: 'Düşman canı +%25',
      pact_name_less_chests: 'Az Sandık',
      pact_desc_less_chests: 'Sandık düşme şansı -%30',
      pact_name_thick_shield: 'Kalın Kalkan',
      pact_desc_thick_shield: 'Düşman kalkanlı doğar (%20 şans)',
      pact_name_drought: 'Susuz Kalış',
      pact_desc_drought: 'Can yenileme kapalı',
      pact_name_double_elite: 'Çift Elit',
      pact_desc_double_elite: 'Elit düşman sayısı 2 kat',
      pact_name_single_chance: 'Tek Hak',
      pact_desc_single_chance: 'Yenile/Yasakla/Atla yok',
      pact_name_phantom_boss: 'Hayalet Boss',
      pact_desc_phantom_boss: 'Boss uyarı çizgisi yarı süre',

      // HUD & Oyun İçi
      level: 'SEVİYE',
      wave: 'DALGA',
      score: 'SKOR',
      scrap: 'HURDA',
      hp: 'CAN',
      shield: 'KALKAN',
      overdrive: 'OVERDRIVE',
      weapons: 'SİLAHLAR',
      passives: 'PASİFLER',

      // Hangar
      hangar_title: 'HANGAR',
      hangar_subtitle: 'KALICI GEMİ VE SİBERNETİK GELİŞTİRMELERİ',
      available_scrap: 'Mevcut Hurda:',
      thruster_cosmetics: 'İYON İTİCİ PLAZMA ALEVİ (KOZMETİK)',
      respec_all: 'TÜMÜNÜ SIFIRLA (RESPEC)',
      weapon_fusion_codex: 'SİLAH FÜZYON KODEKSİ',
      back_main_menu: 'ANA MENÜ',
      hangar_footer: 'Hurda düşmanlardan düşer; oyun sonunda skor/dalga bonusuyla birlikte kalıcı olarak kaydedilir.',
      hull_armor: 'GÖVDE ZIRHI',
      energy_shield: 'ENERJİ KALKANI',
      ion_speed: 'İYON MOTOR HIZI',
      magnet_range: 'MANYETİK ÇEKİM',
      crit_sensor: 'KRİTİK SENSÖRÜ',
      scrap_multiplier: 'HURDA ÇARPANI',
      range_suffix: 'MENZİL',
      current_stat: 'Şu an:',
      max_badge: 'MAKS',

      // Hangar Yükseltmeleri
      hangar_upg_hp_name: 'Güçlendirilmiş Gövde',
      hangar_upg_hp_desc: 'Maksimum canı seviye başına +15 artırır.',
      hangar_upg_shield_name: 'Kalkan Jeneratörü',
      hangar_upg_shield_desc: 'Başlangıç ve maksimum kalkanını seviye başına +12 artırır.',
      hangar_upg_speed_name: 'İyon Motorları',
      hangar_upg_speed_desc: 'Taban gemi hızını seviye başına %4 artırır.',
      hangar_upg_magnet_name: 'Manyetik Çapa',
      hangar_upg_magnet_desc: 'Kristal ve hurda çekim menzilini seviye başı %15 artırır.',
      hangar_upg_crit_name: 'Kritik Sensörü',
      hangar_upg_crit_desc: 'Kritik vuruş şansını seviye başı +%3 artırır.',
      hangar_upg_scrap_boost_name: 'Geri Dönüşüm İşlemcisi',
      hangar_upg_scrap_boost_desc: 'Düşmanlardan düşen hurda miktarını seviye başı %12 artırır.',
      hangar_upg_wave_repair_name: 'Tamir Nanitleri',
      hangar_upg_wave_repair_desc: 'Her dalga sonunda gemiye seviye başı +10 can tamir eder.',

      // İtici Plazma Renkleri
      trail_default: 'Gemiye Özel',
      trail_cyan: 'Siber Mavi',
      trail_violet: 'Kozmik Mor',
      trail_orange: 'Solar Alev',
      trail_matrix: 'Siber Matriks',
      trail_crimson: 'Kan Kırmızısı',

      // Yetenek Ağacı
      tech_tree_title: 'SİBERNETİK YETENEK AĞACI',
      tech_tree_subtitle: 'BAŞARIMLARLA KAZANILAN TEKNOLOJİ PUANLARIYLA (TP) GEMİ PROTOKOLLERİNİ GÜÇLENDİR',
      tp_avail: 'Kullanılabilir TP:',
      tp_total: 'Toplam Kazanılan:',
      reset_points: 'PUANLARI SIFIRLA (RESPEC)',
      node_locked: 'KİLİTLİ',
      node_active: 'AKTİF',
      node_unlock: 'AÇ',
      node_insufficient_tp: 'YETERSİZ TP',

      // Başarımlar
      achievements_title: 'SİBERNETİK BAŞARIMLAR',
      achievements_subtitle: 'KİLİDİ AÇILAN HER BAŞARIM YETENEK AĞACI İÇİN TEKNOLOJİ PUANI (TP) SAĞLAR',
      ach_unlocked: 'Açılan:',
      ach_total_reward: 'Toplam TP Getirisi:',
      ach_completed: 'TAMAMLANDI',
      ach_locked: 'KİLİTLİ',
      tp_reward: 'TP Ödül',

      // Ayarlar (Settings)
      settings_title: 'SİSTEM AYARLARI',
      settings_subtitle: 'SES, GÖRÜNTÜ, OYNANIŞ VE ERİŞİLEBİLİRLİK TERCİHLERİ',
      save_and_return: 'KAYDET VE GERİ DÖN',
      tab_audio: 'SES',
      tab_video: 'GÖRÜNTÜ',
      tab_gameplay: 'OYNANIŞ',
      tab_accessibility: 'ERİŞİLEBİLİRLİK',
      setting_language_name: 'Arayüz Dili',
      setting_language_desc: 'Oyun içi tüm metinler, menüler, kartlar ve arayüz için geçerli dil.',
      setting_fps_name: 'Hedef Kare Hızı',
      setting_fps_desc: 'OTOMATİK: Monitörünüzün en yüksek hızını kullanır. İsteğe göre kare hızı sınırlandırılabilir.',
      setting_showfps_name: 'Canlı Kare Hızı Sayacı',
      setting_showfps_desc: 'Oyun esnasında ekranın üst köşesinde anlık kare hızını gösterir.',
      setting_debug_telemetry_name: 'Geliştirici Telemetrisi',
      setting_debug_telemetry_desc: 'Köşede parçacık, mermi, düşman sayısı ve kare süresi gecikme istatistiklerini gösterir.',
      setting_fullscreen_name: 'Tam Ekran',
      setting_fullscreen_desc: 'Tarayıcı pencerelerini gizleyerek tam ekran modunda çalıştırır.',
      setting_graphics_name: 'Grafik Kalitesi',
      setting_graphics_desc: 'DÜŞÜK (Hafif), ORTA (Optimize), YÜKSEK (144Hz Dengeli), ULTRA (Maksimum Görsel Efekt).',
      setting_theme_name: 'Oyun Teması',
      setting_theme_desc: 'Cyberpunk (Mavi/Pembe), Matrix (Yeşil Siber), Blood Moon (Kırmızı Vahşi).',
      setting_screenshake_name: 'Ekran Sarsıntısı',
      setting_screenshake_desc: 'Patlama ve darbelerde kamera sarsıntı şiddeti.',
      setting_damagenumbers_name: 'Hasar Sayıları',
      setting_damagenumbers_desc: 'Düşmanlara verilen hasarın ve kritik vuruşların ekranda görünmesi.',
      setting_mastervolume_name: 'Genel Ses Düzeyi',
      setting_mastervolume_desc: 'Tüm oyun sesleri, müzik ve efektler için ana ses şiddeti.',
      setting_sfxvolume_name: 'Silah ve Patlamalar',
      setting_sfxvolume_desc: 'Lazer atışları, patlamalar, vuruşlar ve düşman ses seviyesi.',
      setting_musicvolume_name: 'Müzik Seviyesi',
      setting_musicvolume_desc: 'Synthwave arka plan müzikleri ve boss temaları ses şiddeti.',
      setting_shipvolume_name: 'Gemi ve Motor Sesleri',
      setting_shipvolume_desc: 'İyon iticiler, dash sıçramaları, decoy ve çapa yetenek sesleri.',
      setting_crt_name: 'CRT Retro Tarama Çizgileri',
      setting_crt_desc: 'Nostaljik atari salonu tarama çizgileri overlay filtresi.',
      setting_rumble_name: 'Gamepad Titreşimi',
      setting_rumble_desc: 'Desteklenen oyun kolları ve gamepadler için dokunsal titreşim.',
      setting_autoaim_name: 'Otomatik Hedef Alma Yardımı',
      setting_autoaim_desc: 'Nişan alırken en yakın düşmana hafif manyetik hedefleme.',
      setting_colorblind_name: 'Renk Körlüğü Filtresi',
      setting_colorblind_desc: 'Renk körlüğü spektrumu için optimize edilmiş yüksek ayırt edilebilirlik filtresi.',
      setting_largetext_name: 'Büyük Yazı ve Yüksek Kontrast',
      setting_largetext_desc: 'Arayüz yazı tiplerini büyüterek yüksek kontrastlı okunabilirlik sağlar.',

      // Değerler / Durumlar
      val_on: 'AÇIK',
      val_off: 'KAPALI',
      val_fullscreen: 'TAM EKRAN',
      val_windowed: 'PENCERELİ',
      val_low: 'DÜŞÜK',
      val_medium: 'ORTA',
      val_high: 'YÜKSEK',
      val_ultra: 'ULTRA',
      val_normal: 'NORMAL',
      val_strong: 'GÜÇLÜ',
      val_active: 'AKTİF',
      val_auto: 'OTOMATİK',
      delete_profile: 'Profili Sil',
      val_unlimited: 'SINIRSIZ (BENCHMARK)',

      // Duraklatma (Pause)
      pause_title: '⏸️ OYUN DURAKLATILDI',
      pause_subtitle: 'SİSTEM BEKLEMEDE',
      resume: 'DEVAM ET',

      // Kodeks (Codex)
      codex_title: 'SİBER FÜZYON KODEKSİ',
      codex_subtitle: 'HOLO-ŞEMA REHBERİ: GELİŞTİRME, EVRİM & FÜZYON BİRLEŞİM TARİFLERİ',
      codex_close: 'KODEKSİ KAPAT',
      codex_status_active: 'AKTİF (DEVREDE)',
      codex_status_ready: 'HAZIR (BİRLEŞTİRİLEBİLİR)',
      codex_status_locked: 'ŞEMA KİLİTLİ',

      // Seviye Atlama (Level Up / Upgrade)
      lvl_up_title: 'SEVİYE ATLADIN!',
      lvl_up_subtitle: 'BİR SİBER SİSTEM GELİŞTİRMESİ SEÇ',
      rarity_common: 'YAYGIN',
      rarity_rare: 'NADİR',
      rarity_epic: 'DESTANSI',
      rarity_legendary: 'EFSANEVİ',
      rarity_evolution: 'SİLAH EVRİMİ',
      rarity_fusion: 'EFSANEVİ FÜZYON',

      // Sandık & Çark
      chest_title: 'SİBER SANDIK ÇARKI',
      chest_spinning: 'ÖDÜL ÇARKLARI DÖNÜYOR...',
      chest_locked: 'TÜM ÖDÜLLER KİLİTLENDİ!',
      chest_claim: 'ÖDÜLLERİ AL [A / BOŞLUK]',
      chest_won: 'KAZANILAN ÖDÜLLER:',

      // Sonuç Ekranları (Game Over & Victory)
      system_critical: 'SİSTEM ÇÖKTÜ',
      ship_destroyed: 'GEMİ İMHA EDİLDİ',
      stat_score: 'Skor',
      stat_kills: 'İmha Edilen',
      stat_time: 'Süre',
      stat_wave: 'Dalga',
      stat_scrap: 'Hurda',
      combat_report_title: 'AYRINTILI SAVAŞ RAPORU',
      weapon_damage_title: 'SİLAH VE YETENEK HASAR DAĞILIMI',
      label_ship_class: 'Gemi Sınıfı:',
      label_total_damage: 'Toplam Hasar:',
      label_accuracy: 'İsabet Oranı:',
      label_max_crit: 'Maksimum Kritik:',
      label_max_combo: 'Maksimum Kombo:',
      label_relics: 'Siber Eserler:',
      label_hacks: 'Hack Görevi:',
      label_near_miss: 'Near-Miss Sıyırma:',
      label_elites: 'Seçkin (Elite) İmha:',
      label_scrap_earned: 'Kazanılan Hurda:',
      galaxy_saved: 'GALAKSİ KURTARILDI!',
      run_victory: 'SEFER ZAFERİ (RUN VICTORY)',
      victory_desc: 'Omega Dreadnought imha edildi ve sibernetik istila püskürtüldü! Galaksi senin sayende özgür.',
      victory_reward: 'SEFER ZAFERİ ÖDÜLÜ:',
      total_scrap_vic: 'Toplam Hurdan:',
      run_damage_breakdown: 'SEFER HASAR DAĞILIMI',
      continue_endless: 'SONSUZ MODDA DEVAM ET',

      // Gamepad Arayüz İpuçları
      gp_select_start: 'A Seç / Başla',
      gp_switch_ship: 'LB / RB Gemi Değiştir',
      gp_hangar: 'Y Hangar',
      gp_tech_tree: 'X Yetenek Ağacı',
      gp_select_buy: 'A Satın Al',
      gp_return_menu: 'B Ana Menüye Dön',

      // Ölüm Özeti & Başarım Arayüzü (Bölüm 11.3)
      death_killer_label: '☠️ ÖLÜMCÜL DARBE:',
      ach_completed: 'TAMAMLANDI',
      ach_locked: 'KİLİTLİ',
      tp_reward: 'TP Ödül',
      tp_points_badge: 'Teknoloji Puanı (TP)',

      // Başarımlar (37 Adet - 93 TP Tam Denge)
      ach_first_blood_title: 'İlk Kan',
      ach_first_blood_desc: 'İlk sibernetik düşmanı imha et.',
      ach_scrap_novice_title: 'Hurda Avcısı',
      ach_scrap_novice_desc: 'Toplam 50 hurda biriktir.',
      ach_scrap_master_title: 'Hurda Baronu',
      ach_scrap_master_desc: 'Toplam 250 hurda biriktir.',
      ach_wave_5_title: 'Hayatta Kalan I',
      ach_wave_5_desc: '5. Dalgaya ulaş.',
      ach_wave_10_title: 'Hayatta Kalan II',
      ach_wave_10_desc: '10. Dalgaya ulaş.',
      ach_slayer_50_title: 'Siber Katil',
      ach_slayer_50_desc: 'Tek koşuda 50 düşman yok et.',
      ach_slayer_200_title: 'Soykırım Protokolü',
      ach_slayer_200_desc: 'Tek koşuda 200 düşman yok et.',
      ach_boss_dreadnought_title: 'Dreadnought Katili',
      ach_boss_dreadnought_desc: 'Omega Dreadnought Boss mekanizmasını yok et.',
      ach_hack_zone_done_title: 'Siber Hacker',
      ach_hack_zone_done_desc: 'Bir dinamik Hack Bölgesi görevini başarıyla tamamla.',
      ach_combo_10_title: 'Kombo Çırağı',
      ach_combo_10_desc: '10x Kombo değerine ulaş.',
      ach_combo_25_title: 'Adrenalin Ustası',
      ach_combo_25_desc: '25x Kombo değerine ulaş.',
      ach_relic_collector_title: 'Antik Arkeolog',
      ach_relic_collector_desc: 'Bir oyunda en az 2 Siber Eser edin.',
      ach_weapon_evo_title: 'Teknolojik Zirve',
      ach_weapon_evo_desc: 'Bir silah evrimi sinerjisini tamamla.',
      ach_flame_runner_title: 'Alevli İtici',
      ach_flame_runner_desc: 'Alevli Dash yeteneğini etkinleştir.',
      ach_decoy_master_title: 'Holo-Taktisyen',
      ach_decoy_master_desc: 'Taktiksel Holo-Decoy (C) modülünü kullan.',
      ach_hangar_upgrade_5_title: 'Hangar Mühendisi',
      ach_hangar_upgrade_5_desc: 'Hangar yükseltmelerinde toplam 5 seviyeye ulaş.',
      ach_score_100k_title: 'Efsanevi Pilot',
      ach_score_100k_desc: '100.000 Skoru aş.',
      ach_six_upgrades_title: 'Aşırı Yüklü Sistem',
      ach_six_upgrades_desc: 'Tek bir koşuda 6 veya daha fazla yetenek topla.',
      ach_untouchable_boss_title: 'Dokunulmaz',
      ach_untouchable_boss_desc: 'Omega Dreadnought Boss savaşını hiç hasar almadan tamamla.',
      ach_pacifist_wave_title: 'Pasifist',
      ach_pacifist_wave_desc: 'İlk 3 dalgayı hiç ateş etmeden (çevre ve kaçışla) tamamla.',
      ach_cyber_frenzy_title: 'Siber Çılgınlık',
      ach_cyber_frenzy_desc: 'Aralıksız seri avlanmayla 100x Kombo değerine ulaş!',
      ach_gravity_trap_title: 'Olay Ufku',
      ach_gravity_trap_desc: 'Manyetik Çapa modülünü (E / Gamepad X) başarıyla konuşlandır.',
      ach_twin_stick_ace_title: 'Konsol Ası',
      ach_twin_stick_ace_desc: 'Gamepad kolu etkinken en az 2. Dalgaya ulaş.',
      ach_full_arsenal_title: 'Siber Cephanelik',
      ach_full_arsenal_desc: 'Tek bir koşuda tüm 4 silah sınıfını da kullan.',
      ach_speed_demon_title: 'Hiper Sıçrama',
      ach_speed_demon_desc: 'Tek bir koşuda 15 kez Dash atarak tehlikelerden sıyrıl.',
      ach_overdrive_legend_title: 'Aşırı Yükleme Ustası',
      ach_overdrive_legend_desc: 'Tek bir koşuda Overdrive Ultimate yeteneğini en az 3 kez etkinleştir.',
      ach_master_survivor_title: 'Yenilmez Filo',
      ach_master_survivor_desc: 'Hiç durmadan 7. Dalgaya kadar hayatta kal.',
      ach_nightmare_master_title: 'Kabusun Hakimi',
      ach_nightmare_master_desc: 'Oyunu Heat IV (Kabus) modunda tamamlayarak nihai zaferi kazan.',
      ach_colossus_slayer_title: 'Titan Katili',
      ach_colossus_slayer_desc: 'Sonsuz modda Dalga 20 Çifte Boss (Dual Boss) karşılaşmasını zaferle bitir.',
      ach_flawless_start_title: 'Kusursuz Refleks',
      ach_flawless_start_desc: 'İlk 5 dalgayı gemi gövdesine hiç hasar almadan (yalnızca kalkanla/kaçışla) tamamla.',
      ach_single_weapon_run_title: 'Minimalist As',
      ach_single_weapon_run_desc: 'İkincil silah almadan, tek bir silah sınıfıyla 10. Dalgaya ulaş.',
      ach_omni_evolution_title: 'Evrim Senfonisi',
      ach_omni_evolution_desc: 'Tek bir koşuda aynı anda en az 3 farklı silah evrimini aktif et.',
      ach_speed_cleanser_title: 'Işık Hızı İnfazı',
      ach_speed_cleanser_desc: 'Bir Boss savaşını 90 saniyeden kısa sürede zafere ulaştır.',
      ach_deaths_door_survivor_title: 'Ölümün Kıyısında',
      ach_deaths_door_survivor_desc: 'Gövde canın %15 altına inmişken en az 45 saniye hayatta kal ve dalgayı bitir.',
      ach_dual_affix_hunter_title: 'Hibrit Avcısı',
      ach_dual_affix_hunter_desc: 'Tek bir koşuda en az 10 adet çift yetenekli (Dual-Affix) elit düşman imha et.',
      ach_scrap_hoarder_title: 'Hurda Zengini',
      ach_scrap_hoarder_desc: 'Tek bir koşuda 500 veya daha fazla hurda topla.',
      ach_nemesis_slayer_title: 'İntikam Meleği',
      ach_nemesis_slayer_desc: 'Seni daha önce katleden İsimli İntikam Düşmanını (Nemesis) bul ve yok et.'
    },

    // =========================================================================
    // ENGLISH (EN)
    // =========================================================================
    en: {
      // Language and Interface
      lang_code: 'EN',
      lang_name: 'ENGLISH',
      lang_toggle_badge: 'LANG: <b>EN</b>',
      crt_filter_on: 'CRT FILTER: ON',
      crt_filter_off: 'CRT FILTER: OFF',

      // Main Menu & Buttons
      start_game: 'LAUNCH RUN (LOADOUT)',
      hangar: 'HANGAR',
      codex: 'FUSION CODEX',
      tech_tree: 'TECH TREE',
      achievements: 'ACHIEVEMENTS',
      settings: 'SETTINGS',
      retry: 'RETRY',
      main_menu: 'MAIN MENU / HANGAR',
      switch_pilot: 'ACTIVE PILOT:',
      change: '[CHANGE]',
      menu_tagline: 'Survive in infinite cybernetic space! Annihilate enemy fleets, harvest energy crystals, upgrade your ship, and conquer colossal boss mechs!',
      high_score_lbl: 'High Score:',
      scrap_lbl: 'Scrap:',
      heat_pacts_btn: 'PACT DETAILS',
      menu_showcase_title: 'CYBERSPACE SECTOR',
      menu_showcase_hint: 'Click asteroid • Shatter & Collect Scrap',

      // Controls Hints
      ctrl_move: '<span class="key-badge">WASD / Arrows</span> Movement',
      ctrl_aim: '<span class="key-badge">Mouse</span> Aim / Fire',
      ctrl_dash: '<span class="key-badge">Space / Right Click</span> Cyber Dash (Evasion)',
      ctrl_overdrive: '<span class="key-badge">E / Q</span> Overdrive / Ultimate Laser',
      ctrl_decoy: '<span class="key-badge">C</span> Holo-Decoy (Diversion)',
      ctrl_gamepad: '<span class="key-badge">Gamepad</span> Twin-Stick Analog',
      ctrl_autofire: '<span class="key-badge">F</span> Toggle Auto-Fire',
      ctrl_switch_weapon: '<span class="key-badge">1 - 4</span> Switch Weapon (Among Unlocked Weapons)',
      ctrl_pause: '<span class="key-badge">P / ESC</span> Pause Game',
      ctrl_modal_title: 'CYBER CONTROLS',
      close_btn: 'CLOSE',

      // Weapon Evolution Banner
      evo_banner_tag: 'WEAPON EVOLUTION',
      evo_banner_sub: 'CONTINUOUS HYPER PIERCING PLASMA BEAM',

      // Run Setup (Loadout Bay)
      rso_title: 'EXPEDITION LOADOUT',
      scrap_text: 'SCRAP',
      rso_tab_ships: '1. SHIP SELECTION',
      rso_tab_weapons: '2. PRIMARY WEAPON',
      rso_tab_chips: '3. NEURAL MATRIX',
      rso_back_btn: '◀ MAIN MENU',
      rso_pill_ship: 'Ship:',
      rso_pill_weapon: 'Weapon:',
      rso_pill_chips: 'Chips:',
      rso_launch_btn: 'LAUNCH EXPEDITION',

      // Profile Backup
      export_profiles_btn: 'DOWNLOAD BACKUP (JSON)',
      import_profiles_btn: 'LOAD BACKUP',

      // Warship Class Selection
      ship_select_title: 'SELECT WARSHIP CLASS:',
      interceptor_name: 'INTERCEPTOR',
      interceptor_role: 'Speed Hunter',
      interceptor_desc: 'Speed +25%, Crit +15%, HP -20%<br><span class="ship-passive">Passive:</span> Dash deflects bullets',
      titan_name: 'TITAN',
      titan_role: 'Armored Juggernaut',
      titan_desc: 'HP +60%, Shield +50%, Speed -15%<br><span class="ship-passive">Passive:</span> EMP Shockwave on shield break',
      spectre_name: 'SPECTRE',
      spectre_role: 'Cyber Hacker',
      spectre_desc: '+1 Drone, Hack 50% faster, Ult +30%<br><span class="ship-passive">Passive:</span> Starter Drone & Fast Hack',

      // Pilot Roster
      pilot_select_title: '👤 CYBERNETIC PILOT ROSTER',
      pilot_select_subtitle: 'SELECT A PILOT RECORD OR CREATE A NEW CYBER AGENT',
      new_pilot_placeholder: 'New Pilot Name (e.g. Agent Beta)',
      new_pilot_btn: '➕ NEW PROFILE',
      no_profiles_found: 'No saved pilot records found.',
      create_new_pilot_hint: 'Enter a name below and click "NEW PROFILE" to create a pilot.',
      gp_profile_select: 'Select Pilot',
      gp_login: 'Log In',
      gp_main_menu: 'Main Menu',

      // Modes & Cyber Heat
      mode_campaign_btn: 'MODE: <b>CAMPAIGN (10 WAVES)</b>',
      mode_endless_btn: 'MODE: <b>ENDLESS SURVIVAL</b>',
      mode_daily_prefix: 'MODE: <b>DAILY RUN</b>',
      mode_hud_campaign: 'CAMPAIGN',
      mode_hud_endless: 'ENDLESS',
      mode_hud_daily: 'DAILY',
      heat_label: 'CYBER HEAT:',
      heat_badge_0: 'NORMAL',
      heat_badge_1: 'HEAT I (+25%)',
      heat_badge_2: 'HEAT II (+50%)',
      heat_badge_3: 'HEAT III (+80%)',
      heat_badge_4: 'HEAT IV (NIGHTMARE)',
      heat_desc_0: 'Standard survival challenge.',
      heat_desc_1: 'Enemy HP +25%, Speed +15% | +30% Scrap Multiplier',
      heat_desc_2: 'Enemy HP +50%, Dual Elites/Boss | +60% Scrap Multiplier',
      heat_desc_3: 'Enemy HP +80%, Hyper Bullets | +100% Double Scrap & Legendary Drop',
      heat_desc_4: 'Enemy HP +110%, Speed +45%, Bullets +40%, Dual Biome Mini-Bosses! (Scrap ×3)',
      heat_modal_title: 'PACTS OF PUNISHMENT (CYBER HEAT)',
      heat_modal_subtitle: 'Choose modular risk, empower enemy hordes, reap massive scrap multipliers!',
      heat_modal_modular: 'MODULAR PUNISHMENT PACTS',
      heat_modal_confirm: 'CONFIRM & CLOSE',
      total_heat_pts: 'TOTAL HEAT POINTS:',
      scrap_bonus: 'SCRAP BONUS:',
      pact_active: 'ACTIVE',
      pact_enable: '+ ENABLE',
      pact_selected: 'SELECTED',
      pact_select: 'SELECT',

      // Pacts Names & Descriptions
      pact_name_fast_swarm: 'Fast Swarm',
      pact_desc_fast_swarm: 'Enemy movement speed +15%',
      pact_name_armored_army: 'Armored Fleet',
      pact_desc_armored_army: 'Enemy health pool +25%',
      pact_name_less_chests: 'Scarce Pods',
      pact_desc_less_chests: 'Chest spawn rate reduced by -30%',
      pact_name_thick_shield: 'Reinforced Shield',
      pact_desc_thick_shield: 'Enemies spawn with shields (20% chance)',
      pact_name_drought: 'Nanite Drought',
      pact_desc_drought: 'Health regeneration disabled',
      pact_name_double_elite: 'Twin Elites',
      pact_desc_double_elite: 'Elite enemy encounter count doubled',
      pact_name_single_chance: 'Iron Will',
      pact_desc_single_chance: 'Rerolls, skips, and bans disabled',
      pact_name_phantom_boss: 'Phantom Mech',
      pact_desc_phantom_boss: 'Boss telegraph duration reduced by half',

      // HUD & In-Game
      level: 'LEVEL',
      wave: 'WAVE',
      score: 'SCORE',
      scrap: 'SCRAP',
      hp: 'HP',
      shield: 'SHIELD',
      overdrive: 'OVERDRIVE',
      weapons: 'WEAPONS',
      passives: 'PASSIVES',

      // Hangar
      hangar_title: 'HANGAR',
      hangar_subtitle: 'PERMANENT WARSHIP & CYBERNETIC UPGRADES',
      available_scrap: 'Available Scrap:',
      thruster_cosmetics: 'ION THRUSTER PLASMA TRAIL (COSMETIC)',
      respec_all: 'RESET ALL (RESPEC)',
      weapon_fusion_codex: 'WEAPON FUSION CODEX',
      back_main_menu: 'MAIN MENU',
      hangar_footer: 'Scrap drops from defeated enemies; saved permanently after runs with score bonuses.',
      hull_armor: 'HULL ARMOR',
      energy_shield: 'ENERGY SHIELD',
      ion_speed: 'ION ENGINE SPEED',
      magnet_range: 'MAGNETIC RANGE',
      crit_sensor: 'CRITICAL SENSOR',
      scrap_multiplier: 'SCRAP MULTIPLIER',
      range_suffix: 'RANGE',
      current_stat: 'Current:',
      max_badge: 'MAX',

      // Hangar Upgrades
      hangar_upg_hp_name: 'Reinforced Hull',
      hangar_upg_hp_desc: 'Increases maximum hull points by +15 per level.',
      hangar_upg_shield_name: 'Shield Generator',
      hangar_upg_shield_desc: 'Increases initial and max energy shield by +12 per level.',
      hangar_upg_speed_name: 'Ion Thrusters',
      hangar_upg_speed_desc: 'Increases base engine speed by 4% per level.',
      hangar_upg_magnet_name: 'Magnetic Anchor',
      hangar_upg_magnet_desc: 'Expands scrap & crystal collection radius by 15% per level.',
      hangar_upg_crit_name: 'Targeting Sensor',
      hangar_upg_crit_desc: 'Boosts critical strike probability by +3% per level.',
      hangar_upg_scrap_boost_name: 'Scrap Processor',
      hangar_upg_scrap_boost_desc: 'Increases enemy scrap yield by 12% per level.',
      hangar_upg_wave_repair_name: 'Repair Nanites',
      hangar_upg_wave_repair_desc: 'Repairs +10 hull points at the conclusion of every wave.',

      // Thruster Trails
      trail_default: 'Ship Default',
      trail_cyan: 'Cyber Cyan',
      trail_violet: 'Cosmic Violet',
      trail_orange: 'Solar Flare',
      trail_matrix: 'Cyber Matrix',
      trail_crimson: 'Crimson Red',

      // Tech Tree
      tech_tree_title: 'CYBERNETIC TECH TREE',
      tech_tree_subtitle: 'EMPOWER SHIP PROTOCOLS WITH TECH POINTS (TP) EARNED FROM ACHIEVEMENTS',
      tp_avail: 'Available TP:',
      tp_total: 'Total Earned:',
      reset_points: 'RESET POINTS (RESPEC)',
      node_locked: 'LOCKED',
      node_active: 'ACTIVE',
      node_unlock: 'UNLOCK',
      node_insufficient_tp: 'INSUFFICIENT TP',

      // Achievements
      achievements_title: 'CYBER ACHIEVEMENTS',
      achievements_subtitle: 'EACH UNLOCKED ACHIEVEMENT GRANTS TECH POINTS (TP) FOR THE TECH TREE',
      ach_unlocked: 'Unlocked:',
      ach_total_reward: 'Total TP Yield:',
      ach_completed: 'COMPLETED',
      ach_locked: 'LOCKED',
      tp_reward: 'TP Reward',

      // Settings
      settings_title: 'SYSTEM SETTINGS',
      settings_subtitle: 'AUDIO, VIDEO, GAMEPLAY & ACCESSIBILITY PREFERENCES',
      save_and_return: 'SAVE & RETURN',
      tab_audio: 'AUDIO',
      tab_video: 'VIDEO',
      tab_gameplay: 'GAMEPLAY',
      tab_accessibility: 'ACCESSIBILITY',
      setting_language_name: 'Interface Language',
      setting_language_desc: 'Selected language for all in-game text, cards, menus, and settings.',
      setting_fps_name: 'Target Frame Rate',
      setting_fps_desc: 'AUTO: Uses native monitor refresh rate. Can be capped manually to save battery.',
      setting_showfps_name: 'Real-Time FPS Counter',
      setting_showfps_desc: 'Displays instantaneous frame rates at the top corner of the screen.',
      setting_debug_telemetry_name: 'Developer Telemetry',
      setting_debug_telemetry_desc: 'Displays particle, projectile, enemy counters and frame latency histograms in the corner.',
      setting_fullscreen_name: 'Fullscreen Mode',
      setting_fullscreen_desc: 'Hides browser interface for immersive borderless full-window mode.',
      setting_graphics_name: 'Graphics Quality',
      setting_graphics_desc: 'LOW (Lightweight), MEDIUM (Balanced), HIGH (144Hz Smooth), ULTRA (Max Visual Effects).',
      setting_theme_name: 'Visual Theme',
      setting_theme_desc: 'Cyberpunk (Cyan/Magenta), Matrix (Cyber Green), Blood Moon (Crimson).',
      setting_screenshake_name: 'Screen Shake Intensity',
      setting_screenshake_desc: 'Intensity of camera shake during explosions and direct impacts.',
      setting_damagenumbers_name: 'Floating Damage Numbers',
      setting_damagenumbers_desc: 'Renders dynamic damage digits and critical strikes over hit targets.',
      setting_mastervolume_name: 'Master Volume',
      setting_mastervolume_desc: 'Master volume for all gameplay audio, music, and sound effects.',
      setting_sfxvolume_name: 'Weapons & Explosions',
      setting_sfxvolume_desc: 'Laser blasts, detonations, impacts, and enemy sound effects.',
      setting_musicvolume_name: 'Music Volume',
      setting_musicvolume_desc: 'Synthwave background soundtracks and boss theme audio levels.',
      setting_shipvolume_name: 'Ship & Thrusters',
      setting_shipvolume_desc: 'Ion thrusters, evasive dash bursts, holo-decoy, and gravity anchor.',
      setting_crt_name: 'CRT Retro Scanlines',
      setting_crt_desc: 'Nostalgic arcade CRT scanline post-processing overlay filter.',
      setting_rumble_name: 'Gamepad Vibration',
      setting_rumble_desc: 'Tactile force feedback for supported gamepads and controllers.',
      setting_autoaim_name: 'Auto-Aim Assist',
      setting_autoaim_desc: 'Subtle magnetic reticle attraction toward nearest hostile targets.',
      setting_colorblind_name: 'Colorblind Filter',
      setting_colorblind_desc: 'Color matrix filter optimized for color vision deficiency spectrums.',
      setting_largetext_name: 'Large Text & High Contrast',
      setting_largetext_desc: 'Enlarges HUD fonts and adds high-contrast outlines for legibility.',

      // Setting Values
      val_on: 'ON',
      val_off: 'OFF',
      val_fullscreen: 'FULLSCREEN',
      val_windowed: 'WINDOWED',
      val_low: 'LOW',
      val_medium: 'MEDIUM',
      val_high: 'HIGH',
      val_ultra: 'ULTRA',
      val_normal: 'NORMAL',
      val_strong: 'STRONG',
      val_active: 'ACTIVE',
      val_auto: 'AUTO',
      delete_profile: 'Delete Profile',
      val_unlimited: 'UNLIMITED (BENCHMARK)',

      // Pause
      pause_title: '⏸️ GAME PAUSED',
      pause_subtitle: 'SYSTEM ON STANDBY',
      resume: 'RESUME',

      // Codex
      codex_title: 'CYBER FUSION CODEX',
      codex_subtitle: 'HOLO-BLUEPRINT GUIDE: UPGRADE, EVOLUTION & FUSION RECIPES',
      codex_close: 'CLOSE CODEX',
      codex_status_active: 'ACTIVE (ONLINE)',
      codex_status_ready: 'READY (CAN FUSE)',
      codex_status_locked: 'BLUEPRINT LOCKED',

      // Level Up & Rarity
      lvl_up_title: 'LEVEL UP!',
      lvl_up_subtitle: 'SELECT A CYBER SYSTEM UPGRADE',
      rarity_common: 'COMMON',
      rarity_rare: 'RARE',
      rarity_epic: 'EPIC',
      rarity_legendary: 'LEGENDARY',
      rarity_evolution: 'WEAPON EVOLUTION',
      rarity_fusion: 'MYTHIC FUSION',

      // Chest & Reels
      chest_title: 'CYBER CHEST REELS',
      chest_spinning: 'REELS ARE SPINNING...',
      chest_locked: 'ALL REWARDS LOCKED!',
      chest_claim: 'CLAIM REWARDS [A / SPACE]',
      chest_won: 'REWARDS WON:',

      // End Screens
      system_critical: 'SYSTEM CRITICAL',
      ship_destroyed: 'SHIP DESTROYED',
      stat_score: 'Score',
      stat_kills: 'Kills',
      stat_time: 'Time',
      stat_wave: 'Wave',
      stat_scrap: 'Scrap',
      combat_report_title: 'DETAILED COMBAT REPORT',
      weapon_damage_title: 'WEAPON & ABILITY DAMAGE BREAKDOWN',
      label_ship_class: 'Ship Class:',
      label_total_damage: 'Total Damage:',
      label_accuracy: 'Accuracy:',
      label_max_crit: 'Max Crit:',
      label_max_combo: 'Max Combo:',
      label_relics: 'Cyber Relics:',
      label_hacks: 'Hack Objectives:',
      label_near_miss: 'Near-Miss Grazes:',
      label_elites: 'Elite Kills:',
      label_scrap_earned: 'Scrap Collected:',
      galaxy_saved: 'GALAXY SAVED!',
      run_victory: 'CAMPAIGN VICTORY',
      victory_desc: 'The Omega Dreadnought has been eradicated and the cyber invasion repelled! The galaxy is free thanks to you.',
      victory_reward: 'CAMPAIGN VICTORY REWARD:',
      total_scrap_vic: 'Your Total Scrap:',
      run_damage_breakdown: 'CAMPAIGN DAMAGE BREAKDOWN',
      continue_endless: 'CONTINUE IN ENDLESS MODE',

      // Gamepad Prompts
      gp_select_start: 'A Select / Start',
      gp_switch_ship: 'LB / RB Switch Ship',
      gp_hangar: 'Y Hangar',
      gp_tech_tree: 'X Tech Tree',
      gp_select_buy: 'A Purchase',
      gp_return_menu: 'B Return to Menu',

      // Death Recap & Achievement UI
      death_killer_label: '☠️ FATAL BLOW:',
      ach_completed: 'COMPLETED',
      ach_locked: 'LOCKED',
      tp_reward: 'TP Reward',
      tp_points_badge: 'Tech Points (TP)',

      // Achievements (37 Total - 93 TP Exact Balance)
      ach_first_blood_title: 'First Blood',
      ach_first_blood_desc: 'Destroy your first cybernetic enemy.',
      ach_scrap_novice_title: 'Scrap Scavenger',
      ach_scrap_novice_desc: 'Accumulate 50 scrap.',
      ach_scrap_master_title: 'Scrap Baron',
      ach_scrap_master_desc: 'Accumulate 250 scrap.',
      ach_wave_5_title: 'Survivor I',
      ach_wave_5_desc: 'Reach Wave 5.',
      ach_wave_10_title: 'Survivor II',
      ach_wave_10_desc: 'Reach Wave 10.',
      ach_slayer_50_title: 'Cyber Slayer',
      ach_slayer_50_desc: 'Eliminate 50 enemies in a single run.',
      ach_slayer_200_title: 'Genocide Protocol',
      ach_slayer_200_desc: 'Eliminate 200 enemies in a single run.',
      ach_boss_dreadnought_title: 'Dreadnought Slayer',
      ach_boss_dreadnought_desc: 'Obliterate the Omega Dreadnought Boss.',
      ach_hack_zone_done_title: 'Cyber Hacker',
      ach_hack_zone_done_desc: 'Successfully complete a dynamic Hack Zone objective.',
      ach_combo_10_title: 'Combo Apprentice',
      ach_combo_10_desc: 'Reach a 10x Combo streak.',
      ach_combo_25_title: 'Adrenaline Master',
      ach_combo_25_desc: 'Reach a 25x Combo streak.',
      ach_relic_collector_title: 'Relic Archaeologist',
      ach_relic_collector_desc: 'Acquire at least 2 Cyber Relics in a single game.',
      ach_weapon_evo_title: 'Technological Pinnacle',
      ach_weapon_evo_desc: 'Complete a weapon evolution synergy.',
      ach_flame_runner_title: 'Flame Thruster',
      ach_flame_runner_desc: 'Activate the Flame Dash ability.',
      ach_decoy_master_title: 'Holo-Tactician',
      ach_decoy_master_desc: 'Deploy the tactical Holo-Decoy (C) module.',
      ach_hangar_upgrade_5_title: 'Hangar Engineer',
      ach_hangar_upgrade_5_desc: 'Reach a total of 5 levels across Hangar upgrades.',
      ach_score_100k_title: 'Legendary Pilot',
      ach_score_100k_desc: 'Surpass a score of 100,000.',
      ach_six_upgrades_title: 'Overcharged System',
      ach_six_upgrades_desc: 'Collect 6 or more upgrades in a single run.',
      ach_untouchable_boss_title: 'Untouchable',
      ach_untouchable_boss_desc: 'Defeat the Omega Dreadnought Boss without taking any damage.',
      ach_pacifist_wave_title: 'Pacifist',
      ach_pacifist_wave_desc: 'Complete the first 3 waves without firing a single shot.',
      ach_cyber_frenzy_title: 'Cyber Frenzy',
      ach_cyber_frenzy_desc: 'Reach a blistering 100x Combo streak!',
      ach_gravity_trap_title: 'Event Horizon',
      ach_gravity_trap_desc: 'Successfully deploy the Gravity Anchor module.',
      ach_twin_stick_ace_title: 'Twin-Stick Ace',
      ach_twin_stick_ace_desc: 'Reach Wave 2 or higher while using a Gamepad controller.',
      ach_full_arsenal_title: 'Cyber Arsenal',
      ach_full_arsenal_desc: 'Utilize all 4 weapon classes in a single run.',
      ach_speed_demon_title: 'Speed Demon',
      ach_speed_demon_desc: 'Evade hazards by dashing 15 times in a single run.',
      ach_overdrive_legend_title: 'Overdrive Legend',
      ach_overdrive_legend_desc: 'Activate the Overdrive Ultimate ability at least 3 times in a run.',
      ach_master_survivor_title: 'Invincible Fleet',
      ach_master_survivor_desc: 'Survive continuously up to Wave 7.',
      ach_nightmare_master_title: 'Nightmare Master',
      ach_nightmare_master_desc: 'Complete the game on Heat IV (Nightmare) mode to achieve victory.',
      ach_colossus_slayer_title: 'Colossus Slayer',
      ach_colossus_slayer_desc: 'Conquer the Wave 20 Dual Boss encounter in Endless mode.',
      ach_flawless_start_title: 'Flawless Reflexes',
      ach_flawless_start_desc: 'Clear the first 5 waves without taking any hull damage.',
      ach_single_weapon_run_title: 'Minimalist Ace',
      ach_single_weapon_run_desc: 'Reach Wave 10 using only a single weapon class without secondary guns.',
      ach_omni_evolution_title: 'Evolution Symphony',
      ach_omni_evolution_desc: 'Activate at least 3 distinct weapon evolutions in a single run.',
      ach_speed_cleanser_title: 'Speed Cleanser',
      ach_speed_cleanser_desc: 'Eliminate a Boss encounter in under 90 seconds.',
      ach_deaths_door_survivor_title: "Death's Door Survivor",
      ach_deaths_door_survivor_desc: 'Survive for at least 45 seconds with hull HP below 15% and complete the wave.',
      ach_dual_affix_hunter_title: 'Hybrid Hunter',
      ach_dual_affix_hunter_desc: 'Destroy at least 10 dual-affix elite enemies in a single run.',
      ach_scrap_hoarder_title: 'Scrap Hoarder',
      ach_scrap_hoarder_desc: 'Collect 500 or more scrap in a single run.',
      ach_nemesis_slayer_title: 'Nemesis Slayer',
      ach_nemesis_slayer_desc: 'Hunt down and destroy the Named Nemesis that previously killed you.'
    },

    // =========================================================================
    // ESPAÑOL (ES) - Alta fidelidad, términos gaming naturales
    // =========================================================================
    es: {
      // Idioma e Interfaz
      lang_code: 'ES',
      lang_name: 'ESPAÑOL',
      lang_toggle_badge: 'IDIOMA: <b>ES</b>',
      crt_filter_on: 'FILTRO RETRO: ACTIVADO',
      crt_filter_off: 'FILTRO RETRO: DESACTIVADO',

      // Menú Principal y Botones
      start_game: 'INICIAR SEFER (LOADOUT)',
      hangar: 'HANGAR',
      codex: 'CÓDICE DE FUSIÓN',
      tech_tree: 'ÁRBOL TECNOLÓGICO',
      achievements: 'LOGROS',
      settings: 'AJUSTES',
      retry: 'REINTENTAR',
      main_menu: 'MENÚ PRINCIPAL / HANGAR',
      switch_pilot: 'PILOTO ACTIVO:',
      change: '[CAMBIAR]',
      menu_tagline: '¡Sobrevive en el espacio cibernético infinito! Aniquila flotas enemigas, recolecta cristales de energía, mejora tu nave y derrota colosales mechas jefes.',
      high_score_lbl: 'Récord Máximo:',
      scrap_lbl: 'Chatarra:',
      heat_pacts_btn: 'DETALLES DEL PACTO',
      menu_showcase_title: 'SECTOR CIBERESPACIAL',
      menu_showcase_hint: 'Clic en asteroide • Destruye y recolecta chatarra',

      // Consejos de Control
      ctrl_move: '<span class="key-badge">WASD / Flechas</span> Moverse',
      ctrl_aim: '<span class="key-badge">Ratón</span> Apuntar / Disparar',
      ctrl_dash: '<span class="key-badge">Espacio / Clic Der.</span> Desplazamiento Ciber (Evasión)',
      ctrl_overdrive: '<span class="key-badge">E / Q</span> Sobremarcha / Láser Definitivo',
      ctrl_decoy: '<span class="key-badge">C</span> Señuelo Holográfico (Distracción)',
      ctrl_gamepad: '<span class="key-badge">Mando</span> Dos Palancas (Twin-Stick)',
      ctrl_autofire: '<span class="key-badge">F</span> Alternar Disparo Automático',
      ctrl_switch_weapon: '<span class="key-badge">1 - 4</span> Cambiar Arma (Entre Armas Desbloqueadas)',
      ctrl_pause: '<span class="key-badge">P / ESC</span> Pausar Juego',
      ctrl_modal_title: 'CONTROLES CIBERNÉTICOS',
      close_btn: 'CERRAR',

      // Pancarta de Evolución de Arma
      evo_banner_tag: 'EVOLUCIÓN DE ARMA',
      evo_banner_sub: 'RAYO DE PLASMA HIPERPERFORANTE CONTINUO',

      // Preparación de Expedición (Loadout Bay)
      rso_title: 'PREPARACIÓN DE EXPEDICIÓN',
      scrap_text: 'CHATARRA',
      rso_tab_ships: '1. SELECCIÓN DE NAVE',
      rso_tab_weapons: '2. ARMA PRINCIPAL',
      rso_tab_chips: '3. MATRIZ NEURONAL',
      rso_back_btn: '◀ MENÚ PRINCIPAL',
      rso_pill_ship: 'Nave:',
      rso_pill_weapon: 'Arma:',
      rso_pill_chips: 'Chips:',
      rso_launch_btn: 'INICIAR EXPEDICIÓN',

      // Respaldo de Perfiles
      export_profiles_btn: 'DESCARGAR COPIA (JSON)',
      import_profiles_btn: 'CARGAR COPIA',

      // Selección de Clase de Nave
      ship_select_title: '⚡ ELIGE CLASE DE NAVE DE GUERRA:',
      interceptor_name: 'INTERCEPTOR',
      interceptor_role: 'Cazador Rápido',
      interceptor_desc: 'Velocidad +25%, Crítico +15%, Vida -20%<br><span class="ship-passive">Pasiva:</span> El dash desvía proyectiles',
      titan_name: 'TITAN',
      titan_role: 'Tanque Blindado',
      titan_desc: 'Vida +60%, Escudo +50%, Velocidad -15%<br><span class="ship-passive">Pasiva:</span> Onda EMP al romperse el escudo',
      spectre_name: 'SPECTRE',
      spectre_role: 'Hacker Cibernético',
      spectre_desc: '+1 Dron, Hackeo 50% veloz, Definitiva +30%<br><span class="ship-passive">Pasiva:</span> Dron inicial y hackeo veloz',

      // Registro de Pilotos
      pilot_select_title: '👤 SELECCIÓN DE PILOTO CIBERNÉTICO',
      pilot_select_subtitle: 'ELIGE UN PERFIL DE PILOTO O CREA UN NUEVO AGENTE CIBERNÉTICO',
      new_pilot_placeholder: 'Nombre del Piloto (ej. Agente Beta)',
      new_pilot_btn: '➕ NUEVO PERFIL',
      no_profiles_found: 'No se encontraron perfiles de piloto guardados.',
      create_new_pilot_hint: 'Introduce un nombre abajo y pulsa "NUEVO PERFIL" para crear un piloto.',
      gp_profile_select: 'Elegir Piloto',
      gp_login: 'Iniciar Sesión',
      gp_main_menu: 'Menú Principal',

      // Modos y Peligro Cibernético
      mode_campaign_btn: 'MODO: <b>CAMPAÑA (10 OLEADAS)</b>',
      mode_endless_btn: 'MODO: <b>SUPERVIVENCIA INFINITA</b>',
      mode_daily_prefix: 'MODO: <b>MISIÓN DIARIA</b>',
      mode_hud_campaign: 'CAMPAÑA',
      mode_hud_endless: 'INFINITO',
      mode_hud_daily: 'DIARIO',
      heat_label: 'PELIGRO CIBERNÉTICO:',
      heat_badge_0: 'NORMAL',
      heat_badge_1: 'HEAT I (+25%)',
      heat_badge_2: 'HEAT II (+50%)',
      heat_badge_3: 'HEAT III (+80%)',
      heat_badge_4: 'HEAT IV (PESADILLA)',
      heat_desc_0: 'Desafío estándar de supervivencia.',
      heat_desc_1: 'Vida Enemiga +25%, Velocidad +15% | +30% Bono de Chatarra',
      heat_desc_2: 'Vida Enemiga +50%, Doble Élite/Jefe | +60% Bono de Chatarra',
      heat_desc_3: 'Vida Enemiga +80%, Balas Rápidas | +100% Chatarra Doble y Botín Legendario',
      heat_desc_4: 'Vida Enemiga +110%, Velocidad +45%, Balas +40%, ¡Mini-Jefes de Bioma Dobles! (Chatarra ×3)',
      heat_modal_title: 'PACTOS DE CASTIGO (PELIGRO CIBERNÉTICO)',
      heat_modal_subtitle: '¡Selecciona riesgos modulares, potencia hordas enemigas y multiplica tu chatarra!',
      heat_modal_modular: 'PACTOS MODULARES DE CASTIGO',
      heat_modal_confirm: 'CONFIRMAR Y CERRAR',
      total_heat_pts: 'PUNTOS TOTALES DE HEAT:',
      scrap_bonus: 'BONO DE CHATARRA:',
      pact_active: 'ACTIVO',
      pact_enable: '+ ACTIVAR',
      pact_selected: 'SELECCIONADO',
      pact_select: 'SELECCIONAR',

      // Nombres y Descripciones de Pactos
      pact_name_fast_swarm: 'Enjambre Veloz',
      pact_desc_fast_swarm: 'Velocidad enemiga +15%',
      pact_name_armored_army: 'Flota Blindada',
      pact_desc_armored_army: 'Vida enemiga +25%',
      pact_name_less_chests: 'Suministros Escasos',
      pact_desc_less_chests: 'Aparición de cofres reducida un -30%',
      pact_name_thick_shield: 'Escudo Reforzado',
      pact_desc_thick_shield: 'Los enemigos nacen con escudos (20% de probabilidad)',
      pact_name_drought: 'Sequía de Nanites',
      pact_desc_drought: 'Regeneración de vida desactivada',
      pact_name_double_elite: 'Élites Gemelos',
      pact_desc_double_elite: 'Número de enemigos élite duplicado',
      pact_name_single_chance: 'Destino Único',
      pact_desc_single_chance: 'Relanzamientos, saltos y bloqueos desactivados',
      pact_name_phantom_boss: 'Jefe Fantasma',
      pact_desc_phantom_boss: 'Línea de advertencia del jefe a mitad de tiempo',

      // HUD y En Juego
      level: 'NIVEL',
      wave: 'OLEADA',
      score: 'PUNTOS',
      scrap: 'CHATARRA',
      hp: 'VIDA',
      shield: 'ESCUDO',
      overdrive: 'SOBREMARCHA',
      weapons: 'ARMAS',
      passives: 'PASIVAS',

      // Hangar
      hangar_title: 'HANGAR',
      hangar_subtitle: 'MEJORAS PERMANENTES DE LA NAVE Y CIBERNÉTICA',
      available_scrap: 'Chatarra Disponible:',
      thruster_cosmetics: 'ESTELA DE PLASMA DE PROPULSIÓN (COSMÉTICO)',
      respec_all: 'REINICIAR TODO (RESPEC)',
      weapon_fusion_codex: 'CÓDICE DE FUSIÓN DE ARMAS',
      back_main_menu: 'MENÚ PRINCIPAL',
      hangar_footer: 'La chatarra se obtiene de enemigos; se guarda permanentemente tras la partida con multiplicadores.',
      hull_armor: 'BLINDAJE DE CASCO',
      energy_shield: 'ESCUDO DE ENERGÍA',
      ion_speed: 'VELOCIDAD IÓNICA',
      magnet_range: 'ALCANCE MAGNÉTICO',
      crit_sensor: 'SENSOR CRÍTICO',
      scrap_multiplier: 'MULTIPLICADOR DE CHATARRA',
      range_suffix: 'ALCANCE',
      current_stat: 'Actual:',
      max_badge: 'MÁX',

      // Mejoras del Hangar
      hangar_upg_hp_name: 'Casco Reforzado',
      hangar_upg_hp_desc: 'Aumenta los puntos máximos de casco en +15 por nivel.',
      hangar_upg_shield_name: 'Generador de Escudos',
      hangar_upg_shield_desc: 'Aumenta el escudo inicial y máximo en +12 por nivel.',
      hangar_upg_speed_name: 'Motores Iónicos',
      hangar_upg_speed_desc: 'Aumenta la velocidad base de la nave un 4% por nivel.',
      hangar_upg_magnet_name: 'Ancla Magnética',
      hangar_upg_magnet_desc: 'Expande el radio de recolección de chatarra un 15% por nivel.',
      hangar_upg_crit_name: 'Sensor de Disparo Crítico',
      hangar_upg_crit_desc: 'Aumenta la probabilidad de impacto crítico un +3% por nivel.',
      hangar_upg_scrap_boost_name: 'Procesador de Reciclaje',
      hangar_upg_scrap_boost_desc: 'Aumenta la chatarra obtenida de enemigos un 12% por nivel.',
      hangar_upg_wave_repair_name: 'Nanites de Reparación',
      hangar_upg_wave_repair_desc: 'Repara +10 puntos de casco al término de cada oleada.',

      // Estelas de Propulsión
      trail_default: 'Por Defecto',
      trail_cyan: 'Cian Ciber',
      trail_violet: 'Violeta Cósmico',
      trail_orange: 'Llama Solar',
      trail_matrix: 'Matriz Ciber',
      trail_crimson: 'Rojo Carmesí',

      // Árbol Tecnológico
      tech_tree_title: 'ÁRBOL TECNOLÓGICO CIBERNÉTICO',
      tech_tree_subtitle: 'POTENCIA PROTOCOLOS DE NAVE CON PUNTOS TECNOLÓGICOS (TP) DE LOGROS',
      tp_avail: 'TP Disponible:',
      tp_total: 'Total Obtenido:',
      reset_points: 'REINICIAR PUNTOS (RESPEC)',
      node_locked: 'BLOQUEADO',
      node_active: 'ACTIVO',
      node_unlock: 'DESBLOQUEAR',
      node_insufficient_tp: 'TP INSUFICIENTE',

      // Logros
      achievements_title: 'LOGROS CIBERNÉTICOS',
      achievements_subtitle: 'CADA LOGRO DESBLOQUEADO OTORGA PUNTOS TECNOLÓGICOS (TP) PARA EL ÁRBOL',
      ach_unlocked: 'Desbloqueados:',
      ach_total_reward: 'Rendimiento Total TP:',
      ach_completed: 'COMPLETADO',
      ach_locked: 'BLOQUEADO',
      tp_reward: 'Recompensa TP',

      // Ajustes
      settings_title: 'AJUSTES DEL SISTEMA',
      settings_subtitle: 'PREFERENCIAS DE AUDIO, VÍDEO, JUEGO Y ACCESIBILIDAD',
      save_and_return: 'GUARDAR Y VOLVER',
      tab_audio: 'AUDIO',
      tab_video: 'VÍDEO',
      tab_gameplay: 'JUEGO',
      tab_accessibility: 'ACCESIBILIDAD',
      setting_language_name: 'Idioma de Interfaz',
      setting_language_desc: 'Idioma seleccionado para todos los textos, menús, cartas y ajustes.',
      setting_fps_name: 'Tasa de Cuadros',
      setting_fps_desc: 'AUTO: Usa la tasa nativa de tu monitor. Se puede limitar para ahorrar energía.',
      setting_showfps_name: 'Contador de Cuadros en Vivo',
      setting_showfps_desc: 'Muestra la tasa instantánea de cuadros en la esquina superior.',
      setting_debug_telemetry_name: 'Telemetría de Desarrollador',
      setting_debug_telemetry_desc: 'Muestra contadores de partículas, proyectiles, enemigos e histograma de latencia.',
      setting_fullscreen_name: 'Pantalla Completa',
      setting_fullscreen_desc: 'Oculta la interfaz del navegador para una experiencia inmersiva.',
      setting_graphics_name: 'Calidad Gráfica',
      setting_graphics_desc: 'BAJA (Ligero), MEDIA (Optimizada), ALTA (144Hz Equilibrado), ULTRA (Máximo Efecto Visual).',
      setting_theme_name: 'Tema Visual',
      setting_theme_desc: 'Cyberpunk (Cian/Magenta), Matrix (Verde Ciber), Blood Moon (Carmesí).',
      setting_screenshake_name: 'Intensidad de Temblor',
      setting_screenshake_desc: 'Intensidad de sacudida de cámara en explosiones e impactos directos.',
      setting_damagenumbers_name: 'Números de Daño Flotantes',
      setting_damagenumbers_desc: 'Muestra cifras de daño dinámico y golpes críticos sobre los objetivos.',
      setting_mastervolume_name: 'Volumen Maestro',
      setting_mastervolume_desc: 'Volumen general para audio, música y efectos sonoros.',
      setting_sfxvolume_name: 'Armas y Explosiones',
      setting_sfxvolume_desc: 'Disparos láser, detonaciones, impactos y efectos de enemigos.',
      setting_musicvolume_name: 'Volumen de Música',
      setting_musicvolume_desc: 'Banda sonora synthwave y temas musicales de jefes.',
      setting_shipvolume_name: 'Motores y Nave',
      setting_shipvolume_desc: 'Propulsores de iones, dash evasivo, señuelo y ancla de gravedad.',
      setting_crt_name: 'Líneas de Escaneo CRT Retro',
      setting_crt_desc: 'Filtro superpuesto nostálgico de líneas de escaneo arcade CRT.',
      setting_rumble_name: 'Vibración de Mando',
      setting_rumble_desc: 'Vibración táctil para mandos y controladores compatibles.',
      setting_autoaim_name: 'Asistencia de Apuntado',
      setting_autoaim_desc: 'Atracción magnética sutil de la retícula hacia el enemigo más cercano.',
      setting_colorblind_name: 'Filtro para Daltonismo',
      setting_colorblind_desc: 'Filtro de matriz optimizado para espectros de deficiencia visual de color.',
      setting_largetext_name: 'Texto Grande y Alto Contraste',
      setting_largetext_desc: 'Agranda fuentes de interfaz y añade bordes de alto contraste.',

      // Valores de Ajustes
      val_on: 'ACTIVADO',
      val_off: 'DESACTIVADO',
      val_fullscreen: 'PANTALLA COMPLETA',
      val_windowed: 'EN VENTANA',
      val_low: 'BAJA',
      val_medium: 'MEDIA',
      val_high: 'ALTA',
      val_ultra: 'ULTRA',
      val_normal: 'NORMAL',
      val_strong: 'FUERTE',
      val_active: 'ACTIVO',
      val_auto: 'AUTOMÁTICO',
      delete_profile: 'Eliminar Perfil',
      val_unlimited: 'SIN LÍMITE (BENCHMARK)',

      // Pausa
      pause_title: '⏸️ JUEGO EN PAUSA',
      pause_subtitle: 'SISTEMA EN ESPERA',
      resume: 'CONTINUAR',

      // Códice
      codex_title: 'CÓDICE DE FUSIÓN CIBERNÉTICA',
      codex_subtitle: 'GUÍA DE PLANOS HOLO: RECETAS DE MEJORA, EVOLUCIÓN Y FUSIÓN',
      codex_close: 'CERRAR CÓDICE',
      codex_status_active: 'ACTIVO (EN LÍNEA)',
      codex_status_ready: 'LISTO (FUSIONABLE)',
      codex_status_locked: 'PLANO BLOQUEADO',

      // Subida de Nivel y Rareza
      lvl_up_title: '¡SUBIDA DE NIVEL!',
      lvl_up_subtitle: 'ELIGE UNA MEJORA DE SISTEMA CIBERNÉTICO',
      rarity_common: 'COMÚN',
      rarity_rare: 'RARO',
      rarity_epic: 'ÉPICO',
      rarity_legendary: 'LEGENDARIO',
      rarity_evolution: 'EVOLUCIÓN DE ARMA',
      rarity_fusion: 'FUSIÓN MÍTICA',

      // Cofre y Carretes
      chest_title: 'CARRETES DE COFRE CIBERNÉTICO',
      chest_spinning: 'LOS CARRETES ESTÁN GIRANDO...',
      chest_locked: '¡TODAS LAS RECOMPENSAS ASEGURADAS!',
      chest_claim: 'RECLAMAR RECOMPENSAS [A / ESPACIO]',
      chest_won: 'RECOMPENSAS OBTENIDAS:',

      // Pantallas de Fin
      system_critical: 'SISTEMA CRÍTICO',
      ship_destroyed: 'NAVE DESTRUIDA',
      stat_score: 'Puntos',
      stat_kills: 'Bajas',
      stat_time: 'Tiempo',
      stat_wave: 'Oleada',
      stat_scrap: 'Chatarra',
      combat_report_title: 'INFORME DETALLADO DE COMBATE',
      weapon_damage_title: 'DESGLOSE DE DAÑO DE ARMAS Y HABILIDADES',
      label_ship_class: 'Clase de Nave:',
      label_total_damage: 'Daño Total:',
      label_accuracy: 'Precisión:',
      label_max_crit: 'Crítico Máximo:',
      label_max_combo: 'Combo Máximo:',
      label_relics: 'Reliquias Ciber:',
      label_hacks: 'Objetivos de Hackeo:',
      label_near_miss: 'Rozaduras (Near-Miss):',
      label_elites: 'Bajas Élite:',
      label_scrap_earned: 'Chatarra Obtenida:',
      galaxy_saved: '¡GALAXIA SALVADA!',
      run_victory: 'VICTORIA EN CAMPAÑA',
      victory_desc: '¡El Omega Dreadnought ha sido aniquilado y la invasión cibernética repelida! La galaxia es libre gracias a ti.',
      victory_reward: 'RECOMPENSA DE VICTORIA:',
      total_scrap_vic: 'Tu Chatarra Total:',
      run_damage_breakdown: 'DESGLOSE DE DAÑO DE LA CAMPAÑA',
      continue_endless: 'CONTINUAR EN MODO INFINITO',

      // Avisos de Mando
      gp_select_start: 'A Seleccionar / Iniciar',
      gp_switch_ship: 'LB / RB Cambiar Nave',
      gp_hangar: 'Y Hangar',
      gp_tech_tree: 'X Árbol Tech',
      gp_select_buy: 'A Comprar',
      gp_return_menu: 'B Volver al Menú',

      // Resumen de Muerte y Logros
      death_killer_label: '☠️ GOLPE FATAL:',
      ach_completed: 'COMPLETADO',
      ach_locked: 'BLOQUEADO',
      tp_reward: 'Recompensa TP',
      tp_points_badge: 'Puntos de Tecnología (TP)',

      // Logros (37 en Total - 93 TP Equilibrio Exacto)
      ach_first_blood_title: 'Primera Sangre',
      ach_first_blood_desc: 'Destruye a tu primer enemigo cibernético.',
      ach_scrap_novice_title: 'Chatarrero Novato',
      ach_scrap_novice_desc: 'Acumula un total de 50 de chatarra.',
      ach_scrap_master_title: 'Barón de la Chatarra',
      ach_scrap_master_desc: 'Acumula un total de 250 de chatarra.',
      ach_wave_5_title: 'Superviviente I',
      ach_wave_5_desc: 'Alcanza la Oleada 5.',
      ach_wave_10_title: 'Superviviente II',
      ach_wave_10_desc: 'Alcanza la Oleada 10.',
      ach_slayer_50_title: 'Asesino Cibernético',
      ach_slayer_50_desc: 'Elimina 50 enemigos en una sola partida.',
      ach_slayer_200_title: 'Protocolo de Purga',
      ach_slayer_200_desc: 'Elimina 200 enemigos en una sola partida.',
      ach_boss_dreadnought_title: 'Destructor del Dreadnought',
      ach_boss_dreadnought_desc: 'Aniquila al Jefe Omega Dreadnought.',
      ach_hack_zone_done_title: 'Hacker Cibernético',
      ach_hack_zone_done_desc: 'Completa con éxito una zona dinámica de hackeo.',
      ach_combo_10_title: 'Aprendiz de Combo',
      ach_combo_10_desc: 'Alcanza una racha de Combo de 10x.',
      ach_combo_25_title: 'Maestro de la Adrenalina',
      ach_combo_25_desc: 'Alcanza una racha de Combo de 25x.',
      ach_relic_collector_title: 'Arqueólogo de Reliquias',
      ach_relic_collector_desc: 'Consigue al menos 2 Reliquias Cibernéticas en una partida.',
      ach_weapon_evo_title: 'Cúspide Tecnológica',
      ach_weapon_evo_desc: 'Completa una sinergia de evolución de armas.',
      ach_flame_runner_title: 'Propulsor Ígneo',
      ach_flame_runner_desc: 'Activa la habilidad de Dash Ígneo.',
      ach_decoy_master_title: 'Holo-Táctico',
      ach_decoy_master_desc: 'Despliega el módulo táctico Holo-Señuelo (C).',
      ach_hangar_upgrade_5_title: 'Ingeniero del Hangar',
      ach_hangar_upgrade_5_desc: 'Alcanza un total de 5 niveles en mejoras de hangar.',
      ach_score_100k_title: 'Piloto Legendario',
      ach_score_100k_desc: 'Supera los 100.000 puntos de puntuación.',
      ach_six_upgrades_title: 'Sistema Sobrecargado',
      ach_six_upgrades_desc: 'Consigue 6 o más mejoras en una sola partida.',
      ach_untouchable_boss_title: 'Intocable',
      ach_untouchable_boss_desc: 'Derrota al Jefe Omega Dreadnought sin sufrir ningún daño.',
      ach_pacifist_wave_title: 'Pacifista',
      ach_pacifist_wave_desc: 'Supera las primeras 3 oleadas sin disparar ni una sola vez.',
      ach_cyber_frenzy_title: 'Frenesí Cibernético',
      ach_cyber_frenzy_desc: '¡Alcanza un combo salvaje de 100x!',
      ach_gravity_trap_title: 'Horizonte de Sucesos',
      ach_gravity_trap_desc: 'Despliega con éxito el módulo de Ancla de Gravedad.',
      ach_twin_stick_ace_title: 'As del Mando',
      ach_twin_stick_ace_desc: 'Alcanza la Oleada 2 o superior jugando con mando.',
      ach_full_arsenal_title: 'Arsenal Cibernético',
      ach_full_arsenal_desc: 'Utiliza las 4 clases de armas en una sola partida.',
      ach_speed_demon_title: 'Demonio Veloz',
      ach_speed_demon_desc: 'Esquiva peligros usando Dash 15 veces en una sola partida.',
      ach_overdrive_legend_title: 'Leyenda del Overdrive',
      ach_overdrive_legend_desc: 'Activa la habilidad definitiva Overdrive al menos 3 veces.',
      ach_master_survivor_title: 'Flota Invencible',
      ach_master_survivor_desc: 'Sobrevive sin interrupciones hasta la Oleada 7.',
      ach_nightmare_master_title: 'Amo de la Pesadilla',
      ach_nightmare_master_desc: 'Completa la partida en modo Heat IV (Pesadilla) para alcanzar la victoria final.',
      ach_colossus_slayer_title: 'Asesino de Titanes',
      ach_colossus_slayer_desc: 'Vence el encuentro de Doble Jefe de la Oleada 20 en modo Infinito.',
      ach_flawless_start_title: 'Reflejos Impecables',
      ach_flawless_start_desc: 'Supera las primeras 5 oleadas sin recibir ningún daño en el casco.',
      ach_single_weapon_run_title: 'As Minimalista',
      ach_single_weapon_run_desc: 'Alcanza la Oleada 10 usando solo una clase de arma sin armas secundarias.',
      ach_omni_evolution_title: 'Sinfonía de Evolución',
      ach_omni_evolution_desc: 'Activa al menos 3 evoluciones de armas distintas en una sola partida.',
      ach_speed_cleanser_title: 'Ejecutor Veloz',
      ach_speed_cleanser_desc: 'Elimina a un Jefe en menos de 90 segundos.',
      ach_deaths_door_survivor_title: 'Al Borde de la Muerte',
      ach_deaths_door_survivor_desc: 'Sobrevive al menos 45 segundos con la vida del casco por debajo del 15% y supera la oleada.',
      ach_dual_affix_hunter_title: 'Cazador Híbrido',
      ach_dual_affix_hunter_desc: 'Destruye al menos 10 enemigos élite con afijos duales en una sola partida.',
      ach_scrap_hoarder_title: 'Acaparador de Chatarra',
      ach_scrap_hoarder_desc: 'Recolecta 500 o más de chatarra en una sola partida.',
      ach_nemesis_slayer_title: 'Vengador Némesis',
      ach_nemesis_slayer_desc: 'Caza y destruye al Némesis con nombre que te mató anteriormente.'
    },

    // =========================================================================
    // DEUTSCH (DE) - Präzise, stimmungsvolle Sci-Fi Terminologie
    // =========================================================================
    de: {
      // Sprache und Oberfläche
      lang_code: 'DE',
      lang_name: 'DEUTSCH',
      lang_toggle_badge: 'SPRACHE: <b>DE</b>',
      crt_filter_on: 'CRT-FILTER: AN',
      crt_filter_off: 'CRT-FILTER: AUS',

      // Hauptmenü und Schaltflächen
      start_game: 'EXPEDITION STARTEN (LOADOUT)',
      hangar: 'HANGAR',
      codex: 'FUSIONS-KODEX',
      tech_tree: 'TECH-BAUM',
      achievements: 'ERFOLGE',
      settings: 'EINSTELLUNGEN',
      retry: 'ERNEUT VERSUCHEN',
      main_menu: 'HAUPTMENÜ / HANGAR',
      switch_pilot: 'AKTIVER PILOT:',
      change: '[ÄNDERN]',
      menu_tagline: 'Überlebe im endlosen kybernetischen Weltraum! Vernichte feindliche Flotten, sammle Energiekristalle, verbessere dein Schiff und besiege kolossale Boss-Mechs!',
      high_score_lbl: 'Höchstpunktzahl:',
      scrap_lbl: 'Schrott:',
      heat_pacts_btn: 'PAKT-DETAILS',
      menu_showcase_title: 'CYBERRAUM-SEKTOR',
      menu_showcase_hint: 'Klicke Meteorit • Zerstöre & Sammle Schrott',

      // Steuerungshinweise
      ctrl_move: '<span class="key-badge">WASD / Pfeile</span> Bewegung',
      ctrl_aim: '<span class="key-badge">Maus</span> Zielen / Feuern',
      ctrl_dash: '<span class="key-badge">Leertaste / Rechtsklick</span> Cyber-Dash (Ausweichen)',
      ctrl_overdrive: '<span class="key-badge">E / Q</span> Overdrive / Ultimativer Laser',
      ctrl_decoy: '<span class="key-badge">C</span> Holo-Täuschkörper (Ablenkung)',
      ctrl_gamepad: '<span class="key-badge">Gamepad</span> Twin-Stick-Analog',
      ctrl_autofire: '<span class="key-badge">F</span> Dauerfeuer Umschalten',
      ctrl_switch_weapon: '<span class="key-badge">1 - 4</span> Waffe Wechseln (Aus Freigeschalteten Waffen)',
      ctrl_pause: '<span class="key-badge">P / ESC</span> Spiel Pausieren',
      ctrl_modal_title: 'CYBER-STEUERUNG',
      close_btn: 'SCHLIESSEN',

      // Waffen-Evolutions-Banner
      evo_banner_tag: 'WAFFEN-EVOLUTION',
      evo_banner_sub: 'KONTINUIERLICHER HYPER-DURCHDRINGENDER PLASMABRAHL',

      // Expeditions-Vorbereitung (Loadout Bay)
      rso_title: 'EXPEDITIONS-VORBEREITUNG',
      scrap_text: 'SCHROTT',
      rso_tab_ships: '1. SCHIFFSAUSWAHL',
      rso_tab_weapons: '2. PRIMÄRWAFFE',
      rso_tab_chips: '3. NEURALE MATRIX',
      rso_back_btn: '◀ HAUPTMENÜ',
      rso_pill_ship: 'Schiff:',
      rso_pill_weapon: 'Waffe:',
      rso_pill_chips: 'Chips:',
      rso_launch_btn: 'EXPEDITION STARTEN',

      // Profil-Sicherung
      export_profiles_btn: 'BACKUP HERUNTERLADEN (JSON)',
      import_profiles_btn: 'BACKUP LADEN',

      // Kriegsschiff-Klasse
      ship_select_title: 'KRIEGSSCHIFF-KLASSE WÄHLEN:',
      interceptor_name: 'INTERCEPTOR',
      interceptor_role: 'Schnelljäger',
      interceptor_desc: 'Geschw. +25%, Krit +15%, LP -20%<br><span class="ship-passive">Passiv:</span> Dash reflektiert Projektile',
      titan_name: 'TITAN',
      titan_role: 'Gepanzerter Koloss',
      titan_desc: 'LP +60%, Schild +50%, Geschw. -15%<br><span class="ship-passive">Passiv:</span> EMP-Schockwelle bei Schildbruch',
      spectre_name: 'SPECTRE',
      spectre_role: 'Cyber-Hacker',
      spectre_desc: '+1 Drohne, Hacken 50% schneller, Ulti +30%<br><span class="ship-passive">Passiv:</span> Starter-Drohne & Schnelles Hacken',

      // Piloten-Auswahl
      pilot_select_title: '👤 KYBERNETISCHE PILOTENAUSWAHL',
      pilot_select_subtitle: 'WÄHLE EIN PROFIL ODER ERSTELLE EINEN NEUEN AGENTEN',
      new_pilot_placeholder: 'Neuer Pilotname (z. B. Agent Beta)',
      new_pilot_btn: '➕ NEUES PROFIL',
      no_profiles_found: 'Keine gespeicherten Pilotenprofile gefunden.',
      create_new_pilot_hint: 'Gib unten einen Namen ein und drücke "NEUES PROFIL", um einen Piloten zu erstellen.',
      gp_profile_select: 'Pilot Wählen',
      gp_login: 'Anmelden',
      gp_main_menu: 'Hauptmenü',

      // Modi und Cyber-Hitze
      mode_campaign_btn: 'MODUS: <b>KAMPAGNE (10 WELLEN)</b>',
      mode_endless_btn: 'MODUS: <b>ENDLOSES ÜBERLEBEN</b>',
      mode_daily_prefix: 'MODUS: <b>TÄGLICHE MISSION</b>',
      mode_hud_campaign: 'KAMPAGNE',
      mode_hud_endless: 'ENDLOS',
      mode_hud_daily: 'TÄGLICH',
      heat_label: 'CYBER-HITZE:',
      heat_badge_0: 'NORMAL',
      heat_badge_1: 'HEAT I (+25%)',
      heat_badge_2: 'HEAT II (+50%)',
      heat_badge_3: 'HEAT III (+80%)',
      heat_badge_4: 'HEAT IV (ALBTRAUM)',
      heat_desc_0: 'Standard-Überlebensherausforderung.',
      heat_desc_1: 'Feind-LP +25%, Tempo +15% | +30% Schrott-Bonus',
      heat_desc_2: 'Feind-LP +50%, Doppel-Elite/Boss | +60% Schrott-Bonus',
      heat_desc_3: 'Feind-LP +80%, Hyper-Projektile | +100% Doppelter Schrott & Legendäre Beute',
      heat_desc_4: 'Feind-LP +110%, Tempo +45%, Projektile +40%, Duale Biom-Minibosse! (Schrott ×3)',
      heat_modal_title: 'BESTRAFUNGSPAKTE (CYBER-HITZE)',
      heat_modal_subtitle: 'Wähle modulare Risiken, verstärke Feinde und multipliziere deinen Schrott!',
      heat_modal_modular: 'MODULARE BESTRAFUNGSPAKTE',
      heat_modal_confirm: 'BESTÄTIGEN & SCHLIESSEN',
      total_heat_pts: 'GESAMTE HITZE-PUNKTE:',
      scrap_bonus: 'SCHROTT-BONUS:',
      pact_active: 'AKTIV',
      pact_enable: '+ AKTIVIEREN',
      pact_selected: 'GEWÄHLT',
      pact_select: 'WÄHLEN',

      // Pakt-Namen & Beschreibungen
      pact_name_fast_swarm: 'Schneller Schwarm',
      pact_desc_fast_swarm: 'Feindgeschwindigkeit +15%',
      pact_name_armored_army: 'Gepanzerte Flotte',
      pact_desc_armored_army: 'Feindliche Lebenspunkte +25%',
      pact_name_less_chests: 'Knappe Kapseln',
      pact_desc_less_chests: 'Truhen-Spawn-Rate um -30% reduziert',
      pact_name_thick_shield: 'Verstärkter Schild',
      pact_desc_thick_shield: 'Feinde spawnen mit Schilden (20% Chance)',
      pact_name_drought: 'Naniten-Dürre',
      pact_desc_drought: 'Lebensregeneration deaktiviert',
      pact_name_double_elite: 'Zwillings-Eliten',
      pact_desc_double_elite: 'Anzahl der Elite-Feinde verdoppelt',
      pact_name_single_chance: 'Eiserner Wille',
      pact_desc_single_chance: 'Neu-Würfeln, Überspringen und Sperren deaktiviert',
      pact_name_phantom_boss: 'Phantom-Boss',
      pact_desc_phantom_boss: 'Boss-Warnlinie um die Hälfte verkürzt',

      // HUD & Im Spiel
      level: 'STUFE',
      wave: 'WELLE',
      score: 'PUNKTE',
      scrap: 'SCHROTT',
      hp: 'LP',
      shield: 'SCHILD',
      overdrive: 'OVERDRIVE',
      weapons: 'WAFFEN',
      passives: 'PASSIVE',

      // Hangar
      hangar_title: 'HANGAR',
      hangar_subtitle: 'DAUERHAFTE SCHIFFS- & CYBER-UPGRADES',
      available_scrap: 'Verfügbarer Schrott:',
      thruster_cosmetics: 'IONEN-TRIEBWERK PLASMASCHWEIF (KOSMETISCH)',
      respec_all: 'ALLES ZURÜCKSETZEN (RESPEC)',
      weapon_fusion_codex: 'WAFFEN-FUSION-KODEX',
      back_main_menu: 'HAUPTMENÜ',
      hangar_footer: 'Schrott wird von Feinden fallen gelassen und nach dem Lauf dauerhaft gespeichert.',
      hull_armor: 'RUMPF-PANZERUNG',
      energy_shield: 'ENERGIESCHILD',
      ion_speed: 'IONEN-TEMPO',
      magnet_range: 'MAGNET-REICHWEITE',
      crit_sensor: 'KRIT-SENSOR',
      scrap_multiplier: 'SCHROTT-MULTIPLIKATOR',
      range_suffix: 'REICHWEITE',
      current_stat: 'Aktuell:',
      max_badge: 'MAX',

      // Hangar Upgrades
      hangar_upg_hp_name: 'Verstärkter Rumpf',
      hangar_upg_hp_desc: 'Erhöht maximale Rumpfpunkte um +15 pro Stufe.',
      hangar_upg_shield_name: 'Schild-Generator',
      hangar_upg_shield_desc: 'Erhöht Start- und Max-Schild um +12 pro Stufe.',
      hangar_upg_speed_name: 'Ionen-Triebwerke',
      hangar_upg_speed_desc: 'Erhöht Grundtempo des Schiffs um 4% pro Stufe.',
      hangar_upg_magnet_name: 'Magnetischer Anker',
      hangar_upg_magnet_desc: 'Erweitert Kristallsammelradius um 15% pro Stufe.',
      hangar_upg_crit_name: 'Krit-Sensor',
      hangar_upg_crit_desc: 'Erhöht kritische Trefferchance um +3% pro Stufe.',
      hangar_upg_scrap_boost_name: 'Schrott-Recycler',
      hangar_upg_scrap_boost_desc: 'Erhöht Schrottausbeute von Feinden um 12% pro Stufe.',
      hangar_upg_wave_repair_name: 'Reparatur-Naniten',
      hangar_upg_wave_repair_desc: 'Repariert +10 Rumpfpunkte am Ende jeder Welle.',

      // Triebwerksschweife
      trail_default: 'Schiffs-Standard',
      trail_cyan: 'Cyber-Cyan',
      trail_violet: 'Kosmisches Violett',
      trail_orange: 'Solare Flamme',
      trail_matrix: 'Cyber-Matrix',
      trail_crimson: 'Karmesinrot',

      // Tech-Baum
      tech_tree_title: 'KYBERNETISCHER TECHNOLOGIEBAUM',
      tech_tree_subtitle: 'VERSTÄRKE SCHIFFSPROTOKOLLE MIT DURCH ERFOLGE VERDIENTEN TECH-PUNKTEN (TP)',
      tp_avail: 'Verfügbare TP:',
      tp_total: 'Insgesamt Verdient:',
      reset_points: 'PUNKTE ZURÜCKSETZEN (RESPEC)',
      node_locked: 'GESPERRT',
      node_active: 'AKTIV',
      node_unlock: 'FREISCHALTEN',
      node_insufficient_tp: 'UNZUREICHENDE TP',

      // Erfolge
      achievements_title: 'CYBER-ERFOLGE',
      achievements_subtitle: 'JEDER FREIGESCHALTETE ERFOLG GEWÄHRT TECH-PUNKTE (TP) FÜR DEN TECH-BAUM',
      ach_unlocked: 'Freigeschaltet:',
      ach_total_reward: 'Gesamter TP-Ertrag:',
      ach_completed: 'ABGESCHLOSSEN',
      ach_locked: 'GESPERRT',
      tp_reward: 'TP-Belohnung',

      // Einstellungen
      settings_title: 'SYSTEMEINSTELLUNGEN',
      settings_subtitle: 'AUDIO-, VIDEO-, GAMEPLAY- UND BARRIEREFREIHEIT-EINSTELLUNGEN',
      save_and_return: 'SPEICHERN & ZURÜCK',
      tab_audio: 'AUDIO',
      tab_video: 'VIDEO',
      tab_gameplay: 'GAMEPLAY',
      tab_accessibility: 'BARRIEREFREIHEIT',
      setting_language_name: 'Oberflächensprache',
      setting_language_desc: 'Gewählte Sprache für alle Texte, Upgrade-Karten, Menüs und Einstellungen.',
      setting_fps_name: 'Ziel-Bildrate',
      setting_fps_desc: 'AUTO: Verwendet die Bildwiederholrate deines Monitors. Kann manuell begrenzt werden.',
      setting_showfps_name: 'Echtzeit-Bildratenzähler',
      setting_showfps_desc: 'Zeigt die aktuelle Bildrate in der oberen Ecke des Bildschirms an.',
      setting_debug_telemetry_name: 'Entwickler-Telemetrie',
      setting_debug_telemetry_desc: 'Zeigt Partikel-, Geschoss-, Feindzähler und Latenz-Histogramme in der Ecke an.',
      setting_fullscreen_name: 'Vollbildmodus',
      setting_fullscreen_desc: 'Blendet die Browser-Leisten für rahmenlosen Vollbildmodus aus.',
      setting_graphics_name: 'Grafikqualität',
      setting_graphics_desc: 'NIEDRIG (Leicht), MITTEL (Ausgewogen), HOCH (144Hz Flüssig), ULTRA (Maximale Effekte).',
      setting_theme_name: 'Visuelles Thema',
      setting_theme_desc: 'Cyberpunk (Cyan/Magenta), Matrix (Cyber-Grün), Blood Moon (Karmesinrot).',
      setting_screenshake_name: 'Bildschirm-Wackeln',
      setting_screenshake_desc: 'Intensität des Kamerawackelns bei Explosionen und Einschlägen.',
      setting_damagenumbers_name: 'Schadenszahlen',
      setting_damagenumbers_desc: 'Zeigt dynamische Schadenswerte und kritische Treffer über Zielen an.',
      setting_mastervolume_name: 'Hauptlautstärke',
      setting_mastervolume_desc: 'Gesamtlautstärke für Spieleffekte, Musik und Soundeffekte.',
      setting_sfxvolume_name: 'Waffen und Explosionen',
      setting_sfxvolume_desc: 'Lasergeschosse, Explosionen, Treffer und Feindeffekte.',
      setting_musicvolume_name: 'Musiklautstärke',
      setting_musicvolume_desc: 'Synthwave-Hintergrundmusik und Bosskampf-Soundtracks.',
      setting_shipvolume_name: 'Schiffs- und Triebwerksounds',
      setting_shipvolume_desc: 'Ionen-Triebwerke, Ausweich-Dash, Täuschkörper und Gravitationsanker.',
      setting_crt_name: 'CRT-Retro-Abtastzeilen',
      setting_crt_desc: 'Nostalgischer Retro-Abtastzeilen-Filter im Arcade-Stil.',
      setting_rumble_name: 'Controller-Vibration',
      setting_rumble_desc: 'Haptisches Force-Feedback für kompatible Controller.',
      setting_autoaim_name: 'Zielhilfe',
      setting_autoaim_desc: 'Sanfte magnetische Ausrichtung des Fadenkreuzes auf feindliche Ziele.',
      setting_colorblind_name: 'Farbenblindheits-Filter',
      setting_colorblind_desc: 'Farbfilter optimiert für verschiedene Sehschwächen.',
      setting_largetext_name: 'Großer Text und Hoher Kontrast',
      setting_largetext_desc: 'Vergrößert Schriftarten und erhöht den Kontrast für optimale Lesbarkeit.',

      // Einstellungswerte
      val_on: 'AN',
      val_off: 'AUS',
      val_fullscreen: 'VOLLBILD',
      val_windowed: 'FENSTER',
      val_low: 'NIEDRIG',
      val_medium: 'MITTEL',
      val_high: 'HOCH',
      val_ultra: 'ULTRA',
      val_normal: 'NORMAL',
      val_strong: 'STARK',
      val_active: 'AKTIV',
      val_auto: 'AUTOMATISCH',
      delete_profile: 'Profil Löschen',
      val_unlimited: 'UNBEGRENZT (BENCHMARK)',

      // Pause
      pause_title: '⏸️ SPIEL PAUSIERT',
      pause_subtitle: 'SYSTEM IM STANDBY',
      resume: 'WEITER',

      // Kodex
      codex_title: 'CYBER-FUSIONS-KODEX',
      codex_subtitle: 'HOLO-BAUPLAN-LEITFADEN: UPGRADE-, EVOLUTIONS- & FUSIONSREZEPTE',
      codex_close: 'KODEX SCHLIESSEN',
      codex_status_active: 'AKTIV (ONLINE)',
      codex_status_ready: 'BEREIT (FUSIONIERBAR)',
      codex_status_locked: 'BAUPLAN GESPERRT',

      // Levelaufstieg & Seltenheit
      lvl_up_title: 'LEVEL AUFGESTIEGEN!',
      lvl_up_subtitle: 'WÄHLE EIN KYBERNETISCHES SYSTEM-UPGRADE',
      rarity_common: 'GEWÖHNLICH',
      rarity_rare: 'SELTEN',
      rarity_epic: 'EPISCH',
      rarity_legendary: 'LEGENDÄR',
      rarity_evolution: 'WAFFEN-EVOLUTION',
      rarity_fusion: 'MYTHISCHE FUSION',

      // Kiste & Walzen
      chest_title: 'CYBER-TRUHEN-WALZEN',
      chest_spinning: 'DIE WALZEN DREHEN SICH...',
      chest_locked: 'ALLE BELOHNUNGEN GESICHERT!',
      chest_claim: 'BELOHNUNGEN EINSAMMELN [A / LEERTASTE]',
      chest_won: 'ERHALTENE BELOHNUNGEN:',

      // Endbildschirme
      system_critical: 'SYSTEM ABGESTÜRZT',
      ship_destroyed: 'SCHIFF ZERSTÖRT',
      stat_score: 'Punkte',
      stat_kills: 'Abschüsse',
      stat_time: 'Zeit',
      stat_wave: 'Welle',
      stat_scrap: 'Schrott',
      combat_report_title: 'DETAILLIERTER KAMPFBERICHT',
      weapon_damage_title: 'WAFFEN- & FÄHIGKEITEN-SCHADENSVERTEILUNG',
      label_ship_class: 'Schiffsklasse:',
      label_total_damage: 'Gesamtschaden:',
      label_accuracy: 'Treffgenauigkeit:',
      label_max_crit: 'Max. Krit:',
      label_max_combo: 'Max. Combo:',
      label_relics: 'Cyber-Relikte:',
      label_hacks: 'Hack-Ziele:',
      label_near_miss: 'Knappe Ausweichmanöver:',
      label_elites: 'Elite-Abschüsse:',
      label_scrap_earned: 'Gesammelter Schrott:',
      galaxy_saved: 'GALAXIE GERETTET!',
      run_victory: 'KAMPAGNEN-SIEG',
      victory_desc: 'Das Omega-Schlachtschiff wurde vernichtet und die Cyber-Invasion abgewehrt! Die Galaxie ist dank dir frei.',
      victory_reward: 'KAMPAGNEN-SIEG-BELOHNUNG:',
      total_scrap_vic: 'Dein Gesamtschrott:',
      run_damage_breakdown: 'KAMPAGNEN-SCHADENSVERTEILUNG',
      continue_endless: 'IM ENDLOS-MODUS WEITER',

      // Gamepad-Hinweise
      gp_select_start: 'A Wählen / Start',
      gp_switch_ship: 'LB / RB Schiff Wechseln',
      gp_hangar: 'Y Hangar',
      gp_tech_tree: 'X Tech-Baum',
      gp_select_buy: 'A Kaufen',
      gp_return_menu: 'B Zurück zum Menü',

      // Todesbericht & Erfolgs-Interface
      death_killer_label: '☠️ TÖDLICHER STOSS:',
      ach_completed: 'ABGESCHLOSSEN',
      ach_locked: 'GESPERRT',
      tp_reward: 'TP-Belohnung',
      tp_points_badge: 'Technologiepunkte (TP)',

      // Erfolge (37 Gesamt - 93 TP Exakte Balance)
      ach_first_blood_title: 'Erstes Blut',
      ach_first_blood_desc: 'Zerstöre deinen ersten kybernetischen Feind.',
      ach_scrap_novice_title: 'Schrott-Neuling',
      ach_scrap_novice_desc: 'Sammle insgesamt 50 Schrott.',
      ach_scrap_master_title: 'Schrott-Baron',
      ach_scrap_master_desc: 'Sammle insgesamt 250 Schrott.',
      ach_wave_5_title: 'Überlebender I',
      ach_wave_5_desc: 'Erreiche Welle 5.',
      ach_wave_10_title: 'Überlebender II',
      ach_wave_10_desc: 'Erreiche Welle 10.',
      ach_slayer_50_title: 'Cyber-Schlächter',
      ach_slayer_50_desc: 'Vernichte 50 Feinde in einem einzigen Lauf.',
      ach_slayer_200_title: 'Genozid-Protokoll',
      ach_slayer_200_desc: 'Vernichte 200 Feinde in einem einzigen Lauf.',
      ach_boss_dreadnought_title: 'Dreadnought-Zerstörer',
      ach_boss_dreadnought_desc: 'Vernichte den Omega Dreadnought Boss.',
      ach_hack_zone_done_title: 'Cyber-Hacker',
      ach_hack_zone_done_desc: 'Schließe ein dynamisches Hack-Zonen-Ziel erfolgreich ab.',
      ach_combo_10_title: 'Kombo-Lehrling',
      ach_combo_10_desc: 'Erreiche eine 10x Kombo-Serie.',
      ach_combo_25_title: 'Adrenalin-Meister',
      ach_combo_25_desc: 'Erreiche eine 25x Kombo-Serie.',
      ach_relic_collector_title: 'Relikt-Archäologe',
      ach_relic_collector_desc: 'Erlange mindestens 2 Cyber-Relikte in einem Spiel.',
      ach_weapon_evo_title: 'Technologische Spitze',
      ach_weapon_evo_desc: 'Vollende eine Waffen-Evolutions-Synergie.',
      ach_flame_runner_title: 'Flammen-Schub',
      ach_flame_runner_desc: 'Aktiviere die Flammen-Dash-Fähigkeit.',
      ach_decoy_master_title: 'Holo-Taktiker',
      ach_decoy_master_desc: 'Setze das taktische Holo-Köder (C) Modul ein.',
      ach_hangar_upgrade_5_title: 'Hangar-Ingenieur',
      ach_hangar_upgrade_5_desc: 'Erreiche insgesamt 5 Stufen bei Hangar-Verbesserungen.',
      ach_score_100k_title: 'Legendärer Pilot',
      ach_score_100k_desc: 'Überschreite eine Punktzahl von 100.000.',
      ach_six_upgrades_title: 'Überladenes System',
      ach_six_upgrades_desc: 'Sammle 6 oder mehr Upgrades in einem einzigen Lauf.',
      ach_untouchable_boss_title: 'Unantastbar',
      ach_untouchable_boss_desc: 'Besiege den Omega Dreadnought Boss ohne jeglichen Schaden.',
      ach_pacifist_wave_title: 'Pazifist',
      ach_pacifist_wave_desc: 'Beende die ersten 3 Wellen ohne einen einzigen Schuss abzufeuern.',
      ach_cyber_frenzy_title: 'Cyber-Raserei',
      ach_cyber_frenzy_desc: 'Erreiche eine atemberaubende 100x Kombo-Serie!',
      ach_gravity_trap_title: 'Ereignishorizont',
      ach_gravity_trap_desc: 'Setze das Gravitationsanker-Modul erfolgreich ein.',
      ach_twin_stick_ace_title: 'Twin-Stick-As',
      ach_twin_stick_ace_desc: 'Erreiche Welle 2 oder höher mit angeschlossenem Gamepad.',
      ach_full_arsenal_title: 'Cyber-Arsenal',
      ach_full_arsenal_desc: 'Nutze alle 4 Waffenklassen in einem einzigen Lauf.',
      ach_speed_demon_title: 'Hyper-Sprung',
      ach_speed_demon_desc: 'Weiche Gefahren durch 15 Dashes in einem einzigen Lauf aus.',
      ach_overdrive_legend_title: 'Überladungs-Legende',
      ach_overdrive_legend_desc: 'Aktiviere die Overdrive-Ultimativfähigkeit mindestens 3-mal.',
      ach_master_survivor_title: 'Unbesiegbare Flotte',
      ach_master_survivor_desc: 'Überlebe pausenlos bis Welle 7.',
      ach_nightmare_master_title: 'Meister des Albtraums',
      ach_nightmare_master_desc: 'Schließe den Lauf im Heat IV (Albtraum) Modus ab und siege.',
      ach_colossus_slayer_title: 'Koloss-Schlächter',
      ach_colossus_slayer_desc: 'BezwCommunitye die Welle 20 Doppel-Boss-Begegnung im Endlos-Modus.',
      ach_flawless_start_title: 'Makellose Reflexe',
      ach_flawless_start_desc: 'Überstehe die ersten 5 Wellen ohne Rumpfschaden.',
      ach_single_weapon_run_title: 'Minimalistisches As',
      ach_single_weapon_run_desc: 'Erreiche Welle 10 nur mit einer einzigen Waffenklasse ohne Sekundärwaffen.',
      ach_omni_evolution_title: 'Evolutions-Sinfonie',
      ach_omni_evolution_desc: 'Aktiviere mindestens 3 verschiedene Waffen-Evolutionen in einem Lauf.',
      ach_speed_cleanser_title: 'Lichtgeschwindigkeits-Vollstrecker',
      ach_speed_cleanser_desc: 'Besiege einen Boss in unter 90 Sekunden.',
      ach_deaths_door_survivor_title: 'An der Schwelle des Todes',
      ach_deaths_door_survivor_desc: 'Überlebe mindestens 45 Sekunden mit unter 15% Rumpf-LP und beende die Welle.',
      ach_dual_affix_hunter_title: 'Hybrid-Jäger',
      ach_dual_affix_hunter_desc: 'Zerstöre mindestens 10 Dual-Affix-Elitefeinde in einem einzigen Lauf.',
      ach_scrap_hoarder_title: 'Schrott-Sammler',
      ach_scrap_hoarder_desc: 'Sammle 500 oder mehr Schrott in einem einzigen Lauf.',
      ach_nemesis_slayer_title: 'Nemesis-Schlächter',
      ach_nemesis_slayer_desc: 'Jage und vernichte die benannte Nemesis, die dich zuvor getötet hat.'
    }
  };

  class LocalizationEngine {
    constructor() {
      let saved = 'tr';
      try {
        saved = localStorage.getItem('zortex_lang') || 'tr';
      } catch (e) {}
      if (!SUPPORTED_LANGS.includes(saved)) saved = 'tr';
      this.currentLang = saved;

      // DOM hazır olduğunda otomatik uygula
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.applyToDOM());
      } else {
        setTimeout(() => this.applyToDOM(), 0);
      }
    }

    getSupportedLanguages() {
      return [...SUPPORTED_LANGS];
    }

    t(key, fallback = '') {
      const dict = DICTIONARY[this.currentLang] || DICTIONARY.tr;
      if (dict && dict[key] !== undefined) return dict[key];
      const enDict = DICTIONARY.en;
      if (enDict && enDict[key] !== undefined) return enDict[key];
      const trDict = DICTIONARY.tr;
      if (trDict && trDict[key] !== undefined) return trDict[key];
      return fallback || key;
    }

    toggleLanguage() {
      const idx = SUPPORTED_LANGS.indexOf(this.currentLang);
      const next = SUPPORTED_LANGS[(idx + 1) % SUPPORTED_LANGS.length];
      this.setLanguage(next);
      return this.currentLang;
    }

    setLanguage(lang) {
      if (!SUPPORTED_LANGS.includes(lang)) lang = 'tr';
      this.currentLang = lang;
      try {
        localStorage.setItem('zortex_lang', this.currentLang);
        if (window.gameSettings) {
          window.gameSettings.language = this.currentLang;
          if (typeof window.saveSettings === 'function') window.saveSettings();
        }
      } catch (e) {}

      this.applyToDOM();

      if (window.audio && typeof window.audio.playPickup === 'function') {
        window.audio.playPickup();
      }
      return this.currentLang;
    }

    applyToDOM() {
      // 1. data-i18n nitelikli tüm elemanları dinamik güncelle
      const i18nElements = document.querySelectorAll('[data-i18n]');
      i18nElements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
          el.innerHTML = this.t(key, el.innerHTML);
        }
      });

      // 1b. data-i18n-ph nitelikli tüm input yer tutucularını güncelle
      const phElements = document.querySelectorAll('[data-i18n-ph]');
      phElements.forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        if (key) {
          el.placeholder = this.t(key, el.placeholder);
        }
      });

      // 2. Ana Menü Temel Butonları
      const updateEl = (id, key) => {
        const el = document.getElementById(id);
        if (el) {
          const target = el.querySelector('.btn-label') || el;
          target.innerHTML = this.t(key);
        }
      };

      updateEl('startBtn', 'start_game');
      updateEl('hangarBtn', 'hangar');
      updateEl('codexBtn', 'codex');
      updateEl('techTreeBtn', 'tech_tree');
      updateEl('achievementsBtn', 'achievements');
      updateEl('settingsBtn', 'settings');
      updateEl('restartBtn', 'retry');
      updateEl('menuFromGameOverBtn', 'main_menu');
      updateEl('heatPactsModalBtn', 'heat_pacts_btn');
      updateEl('resumeBtn', 'resume');
      updateEl('codexFromPauseBtn', 'weapon_fusion_codex');
      updateEl('restartFromPauseBtn', 'retry');
      updateEl('settingsFromPauseBtn', 'settings');
      updateEl('menuFromPauseBtn', 'main_menu');
      updateEl('codexCloseBtn', 'codex_close');
      updateEl('hangarRespecBtn', 'respec_all');
      updateEl('hangarCodexBtn', 'weapon_fusion_codex');
      updateEl('hangarBackBtn', 'back_main_menu');
      updateEl('respecTreeBtn', 'reset_points');
      updateEl('techTreeBackBtn', 'back_main_menu');
      updateEl('achievementsBackBtn', 'back_main_menu');
      updateEl('settingsBackBtn', 'save_and_return');
      updateEl('vicContinueEndlessBtn', 'continue_endless');
      updateEl('vicReturnMenuBtn', 'main_menu');

      // 3. Dil Değiştirme Butonu Rozeti
      const langBtn = document.getElementById('langToggleBtn');
      if (langBtn) {
        const target = langBtn.querySelector('.btn-label') || langBtn;
        target.innerHTML = this.t('lang_toggle_badge');
      }

      // 4. CRT Retro Filtre Butonu
      const crtBtn = document.getElementById('crtToggleBtn');
      if (crtBtn) {
        const isOn = (typeof window.crtEnabled !== 'undefined') ? window.crtEnabled : (window.gameSettings && window.gameSettings.crtEnabled);
        const target = crtBtn.querySelector('.btn-label') || crtBtn;
        target.innerHTML = isOn ? this.t('crt_filter_on') : this.t('crt_filter_off');
      }

      // 5. Ana Menü Tanıtım Metni (Tagline) & Kontroller
      const taglineEl = document.getElementById('menuTagline');
      if (taglineEl) {
        taglineEl.innerHTML = this.t('menu_tagline');
      }

      const ctrlContainer = document.getElementById('controlsHint');
      if (ctrlContainer) {
        ctrlContainer.innerHTML = `
          <div>${this.t('ctrl_move')}</div>
          <div>${this.t('ctrl_aim')}</div>
          <div>${this.t('ctrl_dash')}</div>
          <div>${this.t('ctrl_overdrive')}</div>
          <div>${this.t('ctrl_decoy')}</div>
          <div>${this.t('ctrl_gamepad')}</div>
          <div>${this.t('ctrl_autofire')}</div>
          <div>${this.t('ctrl_pause')}</div>
        `;
      }

      // 6. Savaş Gemisi Kartları (Interceptor, Titan, Spectre)
      const updateShipCard = (shipKey) => {
        const card = document.querySelector(`.ship-card[data-ship="${shipKey}"]`);
        if (!card) return;
        const nameEl = card.querySelector('.ship-card-name');
        const roleEl = card.querySelector('.ship-card-role');
        const descEl = card.querySelector('.ship-card-desc');
        if (nameEl) nameEl.textContent = this.t(shipKey + '_name');
        if (roleEl) roleEl.textContent = this.t(shipKey + '_role');
        if (descEl) descEl.innerHTML = this.t(shipKey + '_desc');
      };
      updateShipCard('interceptor');
      updateShipCard('titan');
      updateShipCard('spectre');

      // 7. Aktif Pilot Buton Etiketleri
      const activePilotBtn = document.getElementById('switchProfileBtn');
      if (activePilotBtn) {
        const lblPilot = activePilotBtn.querySelector('#lblActivePilot');
        if (lblPilot) lblPilot.textContent = this.t('switch_pilot');
        const lblChange = activePilotBtn.querySelector('#lblChangePilot');
        if (lblChange) lblChange.textContent = this.t('change');
      }

      // 8. GameMode & Cyber Heat Senkronizasyonu
      if (window.ZortexGameModes && typeof window.ZortexGameModes.syncUI === 'function') {
        window.ZortexGameModes.syncUI();
      }

      // 9. Envanter Başlıkları (Silahlar / Pasifler)
      const invLabels = document.querySelectorAll('.inv-label');
      if (invLabels.length >= 2) {
        invLabels[0].textContent = this.t('weapons');
        invLabels[1].textContent = this.t('passives');
      }

      // 10. Açık Olan Dinamik Panelleri Yeniden Oluştur
      const profileOverlay = document.getElementById('profileOverlay');
      if (profileOverlay && !profileOverlay.classList.contains('hidden') && typeof window.renderProfileList === 'function') {
        window.renderProfileList();
      }

      if (typeof window.applyCrtSetting === 'function') {
        window.applyCrtSetting();
      }

      const hangarOverlay = document.getElementById('hangarOverlay');
      if (hangarOverlay && !hangarOverlay.classList.contains('hidden') && typeof window.renderHangar === 'function') {
        window.renderHangar();
      }

      const settingsOverlay = document.getElementById('settingsOverlay');
      if (settingsOverlay && !settingsOverlay.classList.contains('hidden') && typeof window.renderSettings === 'function') {
        window.renderSettings();
      }

      const codexOverlay = document.getElementById('codexOverlay');
      if (codexOverlay && !codexOverlay.classList.contains('hidden') && typeof window.renderCodex === 'function') {
        window.renderCodex();
      }

      const achOverlay = document.getElementById('achievementsOverlay');
      if (achOverlay && !achOverlay.classList.contains('hidden') && typeof window.renderAchievements === 'function') {
        window.renderAchievements();
      }

      const techOverlay = document.getElementById('techTreeOverlay');
      if (techOverlay && !techOverlay.classList.contains('hidden') && typeof window.renderTechTree === 'function') {
        window.renderTechTree();
      }
    }
  }

  window.ZortexI18n = new LocalizationEngine();
})();
