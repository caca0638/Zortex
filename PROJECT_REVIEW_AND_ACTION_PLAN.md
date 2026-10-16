# ZORTEX: CYBER SURVIVOR — BAĞIMSIZ İNCELEME, DURUM RAPORU VE EYLEM PLANI

| Alan | Değer |
| :--- | :--- |
| **Belge Tarihi** | 16 Ekim 2026 |
| **İnceleyen** | Cline (bağımsız kod incelemesi) |
| **İnceleme Türü** | **SALT-OKUNUR** — Depoda hiçbir kod/ayar değişikliği YAPILMAMIŞTIR |
| **Hedef Kitle** | Antigravity AI Agent (görev yürütücü) + Proje Sahibi (karar verici) |
| **Kapsam** | Tüm depo: `index.html`, `js/`, `scripts/`, `app.py`, `docs/`, `vendor/`, `src/`, `assets/`, kök dosyalar |
| **Referans Anayasa** | `AGENTS.md` (kısıtların özeti Bölüm 6'da korunmuştur) |

> **Bu belge nasıl kullanılır?** Bölüm 2–3'teki bulgular kanıt referanslıdır (`dosya:satır`). Bölüm 5'teki fazlar, Antigravity'ye sırayla iş olarak verilebilir; her fazın "Kabul Kriterleri" ve Bölüm 7'deki "Doğrulama Komutları" tamamlanmadan sonraki faza geçilmez. Bölüm 8'deki karar soruları, proje sahibiyle mutabakat olmadan açılmamalıdır.
>
> **Token politikası notu:** Bu belge, `AGENTS.md`'deki token optimizasyon politikasıyla uyumlu yazılmıştır; monolit `index.html`'in tamamı yüklenmemiş, hedefli bölümler okunmuştur.

---

## 0. YÖNETİCİ ÖZETİ (TL;DR)

Proje teknik olarak **üstün zanaat** seviyesindedir (144Hz oyun döngüsü, zero-GC FX mimarisi, güvenlik sertleştirilmiş launcher) ancak **operasyonel borç** kritik eşiğe ulaşmıştır:

1. 🔴 **Git reposu başlatılmış ama SIFIR commit var** (kanıt F1). Tek güvenlik ağı elle tutulan `.git_snapshot/` klasörleri. Tek disk kazası = 19.038 satırlık katedralin kaybı.
2. 🔴 **Doğrulama paketi kendi kendine yetmiyor:** `verify_full_wave1.py`, projenin *dışındaki* bir AI scratch dizininden (`C:\Users\user\.gemini\antigravity\brain\7b599a49-...\scratch`) modül import ediyor (kanıt F2). Başka makinede / temizlenmiş dizinde tekrarlanamaz.
3. 🟠 Her test koşusu depo köküne bir `.app_profile_*` klasörü yazıyor → **≈190 birikmiş klasör** (kanıt F4).
4. 🟠 **Dokümanlar sapmış durumda:** `index.html` fiziksel satır sayısı **19.038**; AGENTS.md (~12.8k) ve CODEBASE_MAP (17.555) eksik, AI_HANDOVER (~19k) isabetli. Otomatik kod haritası ~1.500 satır kaymış durumda (kanıt F5).
5. 🟠 `src/` klasörü (16 dosya + 96KB `bundle.js`) **ölü iskelet**; `package.json` `"main"` alanı hâlâ ona işaret ediyor (kanıt F7).
6. 🟢 **İyi haber:** Monolitten çıkış *zaten başlamış* — `index.html`, satır 3170–3207 arasında **18 proje modülü + 3 kütüphane** yüklemekte. Modülerleştirme bilinçli ve sağlıklı ilerliyor (kanıt P1).

**Önerilen 5 adımlık sıra:** (A) İlk git commit'i → (B) Test altyapısı onarımı → (C) Doküman senkronizasyonu → (D) Onaylı temizlik/arşivleme → (E) Opsiyonel: birim test + kademeli modülerleştirme. Detaylar Bölüm 5'te.

---
## 1. DURUM ANLIK GÖRÜNTÜSÜ (16 Ekim 2026 ölçümleri)

### 1.1 Gerçek Ölçümler vs Doküman İddiaları

| Öğe | Gerçek (bu incelemede ölçüldü) | Doküman iddiası | Değerlendirme |
| :--- | :--- | :--- | :--- |
| `index.html` satır sayısı (fiziksel) | **19.038** (1.256 boş satır dahil) | AGENTS.md: ~12.8k · CODEBASE_MAP: 17.555 · AI_HANDOVER: ~19k | ❌ AGENTS ve MAP sapmış; ✅ AI_HANDOVER isabetli |
| `js/fx/zortex_fx.js` satır sayısı (fiziksel) | **2.366** (264 boş satır dahil) | CODEBASE_MAP: 2.367 | ✅ Harita bu dosya için fiilen isabetli |
| `app.py` satır sayısı (fiziksel) | **467** | — | ✅ |
| `index.html` script etiketleri | 21 toplam = 18 proje modülü + pixi + 2 vendor (satır 8, 3170–3207) | README: "tek dosya formatında tüm oyun" | ❌ README artık gerçeği yansıtmıyor |
| Lokalizasyon dilleri | **4** (tr, en, es, de — `localization.js:12`) | AI_HANDOVER: "TR/EN çift dil" | ❌ Gerçek kapsam daha geniş |
| Oyun içeriği | 10 gemi şasisi, 13 silah, 16 nöral çip, 11 füzyon, 4 oyun modu (AI_HANDOVER:2) | README: 3 gemi, 4 silah | ❌ README birden fazla sürüm geride |
| FPS hedefi | 144Hz (AGENTS.md, TESTING_RUNBOOK) | README: "60+ FPS" | ❌ README hedefi küçümsüyor |
| `gameLoop()` konumu | `index.html:15921` (≈1.467 satır; 15921→17388 fiziksel) | CODEBASE_MAP: satır 14.405 | ❌ Harita ~1.500 satır kaymış |

### 1.2 Versiyon Kontrolü Durumu

- `git log` çıktısı: **`fatal: your current branch 'master' does not have any commits yet`** → repo `git init` edilmiş ama **tek commit yok** (detay F1).
- `.gitignore` kalitesi **iyi**: `.app_profile*/`, `app_profile_*/`, `.test_cm/`, `scratch/`, `/scratch_*.png|json`, `.git_snapshot/`, `__pycache__/`, `/phase*_verified.png`, `docs/probe_*.png`, `*.log` kapsanmış.
- **Boşluk tespiti:** `zortex_oyun_ve_kod_akisi.zip` (29.717 KB) `.gitignore`'da **YOK** → ilk `git add -A` yapılırsa 30MB dosya depoya girer. Faz A'da commit'ten önce eklenmelidir (karar sorusu B8.1).
- `.gitattributes` mevcut (0,2 KB), `.git_snapshot/` klasörü dolu (elle snapshot disiplini işletiliyor).

### 1.3 Disk Kirliliği Envanteri

| Öğe | Miktar/Boyut | Gitignore? | Öneri |
| :--- | :--- | :--- | :--- |
| `.app_profile_*` test profilleri | ≈190 klasör (binlerce dosya) | ✅ | Faz D'de diski temizle (kalıcı kayıp yok — test artefaktı) |
| `.test_cm/` | 1 klasör | ✅ | Temizlik adayı |
| `app_profile_flight_1791849839` (dotsuz!) | 1 klasör | ✅ (`app_profile_*/` kuralı) | Temizlik adayı |
| `index.html.bak_endless` | 741,6 KB | ❌ | Arşivle (Faz D) |
| `zortex_oyun_ve_kod_akisi.zip` | 29.717 KB | ❌ **(risk!)** | Önce ignore et, sonra arşivle (Faz A+D) |
| Kök `scratch_before/dbg` .png/.json | ≈2,7 MB | ✅ | Arşiv/sil (Faz D) |
| `scripts/__pycache__/` | 4 .pyc | ✅ | Silinebilir |
| `vendor/` kaynak paketleri | 769 dosya / ~3,8 MB toplam | ❌ | Runtime'da yalnız `tweakpane.min.js` + `pixi-filters.min.js` kullanılıyor (`index.html:3170-3171`); `package/` alt dizinleri + `.tgz` arşivleri dev-zaman artefaktı (Faz D) |
| `phase*_verified.png` (kök) | ≈2,7 MB | ✅ | Arşiv/sil (Faz D) |

### 1.4 Aktif / Sağlıklı Olduğu Doğrulanan Varlıklar

| Varlık | Durum | Kanıt |
| :--- | :--- | :--- |
| `assets/` (ses + sprite paketleri) | ✅ **AKTİF — ölü kod DEĞİL** | Headless test cache'lerinde `assets/sprites/cyber_fleet/cyber_enemy_scout.png` ve `assets/audio/sci-fi-sounds/Audio/laserLarge_003.ogg` istekleri görüldü; `js/core/asset_loader_core.js` prosedürel fallback ile yüklüyor |
| 18 modül yüklemesi | ✅ Aktif | `index.html:3170–3207` |
| `// [FX]` kanca disiplini | ✅ 44 kanca | `index.html` içinde regex sayımı |
| Oyun döngüsü, FX motoru, launcher | ✅ Bölüm 2'de ayrıntılı | — |

---
## 2. GÜÇLÜ YÖNLER (Korunması Zorunlu Varlıklar — P Serisi)

| # | Güçlü Yön | Kanıt | Neden Değerli |
| :--- | :--- | :--- | :--- |
| **P1** | **Hibrit modüler migrasyon zaten başlamış** | `index.html:3170–3207` → 18 modül (fx:1, gameplay:9, audio:2, core:6) | Monolit riski bilinçli yönetiliyor; her modül IIFE + `'use strict'` + window.global deseniyle koparılmış. Modülerleştirme *yeni* bir karar değil, *devam eden* bir süreç |
| **P2** | **Profesyonel oyun döngüsü** | `index.html:15921–15995` | FPS sınırlayıcı + 1,2ms jitter payı (15925–15933), delta clamp 0.001–0.033s (15937), hit-stop (15967–15971), bullet-time timeScale yönetimi (15977–15988), tüm modül kancaları `if (window.X)` guard'lı → modül eksilse bile döngü çökmez |
| **P3** | **FX motoru event-bus mimarisi** | `zortex_fx.js:9–129` QualityManager; BloomManager/NebulaManager/LightFXManager `qualityChanged` dinliyor (satır 214, 433, 1087) | 4 kalite kademesi + adaptif hysteresis bekçisi (<48↓, ≥58↑, satır 105–128). Gerçek event bus deseni |
| **P4** | **Erişilebilirlik fiilen uygulanıyor** | `reduceFlashing` kontrolleri: `zortex_fx.js:256, 485, 954, 977` | `AGENTS.md`'deki seizure-risk kuralı tek bir ayar değil, her manager'da tek tek denetleniyor |
| **P5** | **Güvenlik sertleştirilmiş launcher** | `app.py`: DNS rebinding koruması (176–208), Origin doğrulama, path-traversal engeli (237–245), **atomik save** (tmp + `os.replace` + `threading.Lock`, 346–353), sema doğrulama (89–102), 1MB limit, Content-Type zorunluluğu, `127.0.0.1` binding | Bir oyun launcher'ında DNS rebinding koruması görmek istisnai; save bütünlüğü (AGENTS.md kuralı) donanım seviyesinde garanti altında |
| **P6** | **Lisans ve kaynak bilinci** | `research/OPEN_SOURCE_NOTES.md` | Hangi açık kaynak repodan hangi mimari kalıp öğrenilmiş, lisanslarıyla tablolaştırılmış; "kod kopyalanmadı" ibaresi mevcut |
| **P7** | **Ölçülmüş changelog kültürü** | `CHANGELOG_FX.md` Faz 0–9+: her fazda tarih, snapshot yolu, ölçülmüş FPS (144.3, min 143), "0 konsol hatası" kanıtı | İddia + ölçüm + kanıt görseli üçlüsü işletiliyor |
| **P8** | **Oyun içeriği derinliği** | AI_HANDOVER:2: 10 gemi, 13 silah, 16 çip, 11 füzyon, 12 olay düşmanı, 4 mod (Arcade/Endless/Daily/Heat), Nemesis AI, 12-slot envanter | README'nin anlattığından kat kat büyük bir oyun; i18n 4 dilde |

---
## 3. BULGULAR (Kanıtlı Sorunlar — F Serisi)

> Şiddet skalası: 🔴 KRİTİK · 🟠 YÜKSEK · 🟡 ORTA · ⚪ DÜŞÜK

### F1 🔴 Git reposunda sıfır commit (versiyon kontrolü teatral durumda)
- **Kanıt:** `git log` → `fatal: your current branch 'master' does not have any commits yet`. `.git` dizini mevcut, `.gitignore`/`.gitattributes` yazılmış — altyapı hazır ama hiç işletilmemiş.
- **Etki:** Tek güvenlik ağı elle tutulan `.git_snapshot/` klasörleri. Bu klasörler versiyonlanmıyor (gitignore'lu), tarihlendirilmiyor, geri döndürme/diff yeteneği yok. 19.038 satırlık çekirdek + 18 modül tek disk/klasör kazasıyla gidebilir.
- **Not:** Projenin anayasası (`AGENTS.md` Bölüm 5.5) "Snapshot Discipline" şart koşuyor; disiplin var, araç yanlış seçilmiş.

### F2 🔴 Test paketi projenin DIŞINA bağımlı (tekrarlanabilirlik yok)
- **Kanıt:** `scripts/verify_full_wave1.py:8-10`:
  ```python
  SCRATCH_DIR = r"C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\scratch"
  sys.path.insert(0, SCRATCH_DIR)
  from test_144hz_delta_time import MinimalWebSocket, find_browser
  ```
- **Etki:** "0 hata / 0 uyarı" doğrulaması, Gemini/Antigravity aracının scratch klasöründeki `test_144hz_delta_time.py` olmadan koşamaz. Başka makine, temizlenen cache veya aracın klasör planı değişimi = **regression paketinin tamamı çöker**. `AGENTS.md` Bölüm 5.3'teki "Headless Verification" şartı bu haliyle kırılgan.
- **Ek:** `docs/TESTING_RUNBOOK.md` bu dış bağımlılıktan hiç bahsetmiyor → runbook eksik belgeliyor.

### F3 🟠 Test scripti kullanıcının tüm Edge pencerelerini öldürüyor
- **Kanıt:** `scripts/verify_full_wave1.py:16`: `os.system("taskkill /F /IM msedge.exe /T 2>nul")`
- **Etki:** Test koşusu, kullanıcının açık tarayıcı oturumlarını (form verileri, sekmeler) kayıpsız kapatır. Test araçları makine genelinde süreç öldürmemeli; izole port + izole user-data-dir zaten mevcut, taskkill gereksiz.
- **Not:** Muhtemelen yapışkan Edge debug-port çakışmalarına karşı pratik çözüm olarak eklenmiş; kök neden (port yönetimi) çözülmeli, semptom değil.

### F4 🟠 Her test koşusu depo köküne kalıcı profil klasörü yazıyor
- **Kanıt:** `scripts/verify_full_wave1.py:14`: `USER_DATA = rf"C:\Users\user\Desktop\zort\.app_profile_wave1_check_{int(time.time())}"` + depoda **≈190** `.app_profile_*` klasörü (test adlarıyla: chk0..chk6, regression×16, phase2..5, boss_test, foley×4...).
- **Etki:** Binlerce gereksiz dosya; kod taramalarını şişiriyor (bu inceleme sırasında bile arama sorguları bu klasörlerdeki tarayıcı cache'lerine takıldı), disk doluluğu, gürültü. `.gitignore` koruması var ama **disk temizliği** yapmıyor.
- **Kök neden:** Test scriptleri profil dizinini `tempfile.gettempdir()` yerine proje köküne alıyor; temizlik (`finally` bloğunda silme) yok.

### F5 🟠 Dokümantasyon sürüklenmesi (çelişen rakamlar + kayan harita)
- **Kanıt:** `docs/CODEBASE_MAP.md:6` "Last Generated: 2026-10-12" iken `gameLoop` haritada 14.405, gerçekte 15.921 (≈1.516 satır kayma) ve `index.html` haritada 17.555, gerçekte 19.038 (≈1.483 satır eksik). `zortex_fx.js` için harita (2.367) isabetli (gerçek 2.366 fiziksel). AGENTS.md'deki "~12.8k" ise iki kat eksik.
- **Etki:** `AGENTS.md`'in "Targeted Reading" protokolü bu haritaya dayanıyor → AI ajanları **yanlış satır aralıklarını okuyup** yanlış kodu değiştirme riskiyle karşı karşıya. Proje içi en tehlikeli sessiz hata kaynaklarından biri.
- **Not:** `scripts/update_codebase_map.mjs` (12,7 KB) mevcut — araç var, süreç işletilmiyor.

### F6 🟡 README'nin kapsamı ve mimari anlatımı iki sürüm geride
- **Kanıt:** `README.md:3` "60+ FPS" (hedef 144Hz); `README.md:104-119` dosya yapısı bölümü var olmayan dosyalardan bahsediyor (`src/audio.js`, `src/gamepad.js`, `src/entities.js`, `src/relics.js`, `src/ui.js` — `src/` içindeki gerçek içerik `core/Game.js`, `entities/Player.js` vb.); "tek dosya formatında tüm oyun" (satır 109) — gerçek: 18 modüllü hibrit; 3 gemi/4 silah anlatımı — gerçek: 10/13.
- **Etki:** Yeni geliştirici/AI ajan README ile başlarsa yanlış zihinsel model kurar. Kimlik dokümanı olarak da zayıf.
### F7 🟡 `src/` klasörü ölü iskelet; `package.json.main` ona işaret ediyor
- **Kanıt:** `src/` içinde 16 dosya + `bundle.js` (96,2 KB) var (`core/Game.js`, `entities/*`, `systems/*`, `shaders/crt.*`). **`index.html` içinde `src/` referansı: SIFIR** (tarama boş döndü). `package.json:6` → `"main": "src/core/Game.js"`.
- **Etki:** İki paralel mimari izlenimi yaratıyor; AI ajanları yanlış dosyada çalışabilir. `"main"` alanı hatalı bir giriş noktası gösteriyor. `bundle.js`'in nereden üretildiği (esbuild?) belgelenmemiş.
- **Tespit:** Kullanılıp kullanılmadığına dair tek ihtimal dış bağımlılık olabilir; taramada bulunamadı (karar sorusu B8.2).

### F8 🟡 Kök dizindeki yedek/arşiv kalıntıları (disk + depo riski)
- **Kanıt:** `index.html.bak_endless` (741,6 KB, gitignore DIŞI), `zortex_oyun_ve_kod_akisi.zip` (29.717 KB, gitignore DIŞI), kök `scratch_before.png/.json` + `scratch_dbg.png/.json` (≈2,7 MB, gitignore'lu), `phase*_verified.png` ×4 (gitignore'lu).
- **Etki:** Gitignore DIŞI olanlar ilk commit'te depoya girerek repoyu şişirir (özellikle 30MB zip). Gitignore'lular diskte gürültü üretir.

### F9 ⚪ `vendor/` içinde runtime'ın kullanmadığı kaynak paketler
- **Kanıt:** Toplam 769 dosya / ~3,8 MB. Runtime yüklemesi yalnızca `vendor/tweakpane.min.js` + `vendor/pixi-filters.min.js` (`index.html:3170-3171`). `vendor/pixi-filters/package/` ve `vendor/tweakpane/package/` tam kaynak ağaçları + `pixi-filters-6.1.5.tgz` + `tweakpane-4.0.5.tgz` arşivleri fazlası.
- **Etki:** Düşük — offline kuralı bozulmuyor; yalnız depo hacmi ve tarama gürültüsü. `CHANGELOG_FX.md` Faz 0-1 bu paketlerin build geçmişini belgeliyor, bu yüzden arşivleme (silme değil) önerilir.

### F10 🟡 Saf mantık modüllerinde birim test sıfırı
- **Kanıt:** `scripts/` içindeki 50+ dosyanın tamamı headless CDP entegrasyon tipi. `js/core/daily_run_rng.js` (mulberry32 PRNG — deterministik, test için ideal), `object_pool.js`, `localization.js` sözlük bütünlüğü, `zortex_meta_progression.js` ekonomi formülleri için tek bir birim test yok.
- **Etki:** Entegrasyon testleri "oyun açılıyor mu"u doğrular ama "PRNG tohum tutarlı mı / meta ekonomisi dengeli mi"yi doğrulamaz. Regresyonlar ancak oynanışta yakalanır.

### F11 ⚪ `scripts/` klasörü tek-seferlik script birikimi (kanonik set belirsiz)
- **Kanıt:** 50+ dosya; `verify_phase0..7`, `test_item1..3`, `run_phase0/1_check`, `test_frag`, `test_frag_step` gibi art arda üretilmiş varyantlar. `docs/TESTING_RUNBOOK.md` yalnız 5 scripti "standart" olarak listeliyor.
- **Etki:** Yeni ajan hangi scriptin güncel/güvenilir olduğunu bilemez; yanlış script koşulup eski bir faza ait doğrulama "geçti" sanılabilir.

### F12 ⚪ Monolit çekirdek hâlâ 19.038 satır (yapısal borç, acil değil)
- **Kanıt:** `gameLoop()` ≈1.467 satır (fiziksel: `index.html:15921 → 17388`), Player mimarisi eski haritada 1.786 satır. AGENTS.md'in "Monolithic Restraint" kuralı bu gerçeğin kendisi tarafından gerekçelendirilmiş durumda.
- **Etki:** Kod incelemesi ve hedefli test zor; her düzenleme yan etki riski taşıyor. Ancak P1'deki modüler migrasyon doğru yönde — bu bir "yap" değil, "devam et" maddesidir. Faz E'de yol haritası var.

---

## 4. SKOR KARTI

| Boyut | Puan | Gerekçe |
| :--- | :---: | :--- |
| Oyun döngüsü & performans mühendisliği | **9/10** | Frame pacing, delta clamp, zero-GC, spatial grid — ders kitabı seviyesi (P2) |
| FX mimarisi | **9/10** | Event bus + adaptif kalite + erişilebilirlik entegrasyonu (P3, P4) |
| Güvenlik (launcher/save) | **9/10** | DNS rebinding + atomik yazım — bu ölçekte olağanüstü (P5) |
| Oyun içeriği & platform desteği | **8,5/10** | 10 gemi, 13 silah, 4 mod, i18n×4, gamepad+haptics (P8) |
| Dokümantasyon kültürü | **6/10** | Kapsam 9, doğruluk 3 — çelişen satır sayıları, bayat README (F5, F6) |
| Test altyapısı | **4/10** | Dış bağımlılık + yıkıcı taskkill + birim test sıfırı (F2, F3, F10) |
| Versiyon kontrolü & depo hijyeni | **2/10** | 0 commit, ≈190 profil çöpü, ignore dışı 30MB zip (F1, F4, F8) |
| **GENEL** | **7/10** | Üstün zanaat + yönetimsel borç |

> **Tek cümlelik hüküm:** "Yazılım mühendisliği öğrenirken oyun yapmış birinin" projesi — zanaat istisnai, operasyon (git, test tekrarlanabilirliği, doküman tazeliği) üretim hızının gerisinde kalmış; Bölüm 5'teki fazlar bu farkı kapatır.
## 5. EYLEM PLANI (Öncelik Sıralı Fazlar — Antigravity Görev Paketleri)

> **Genel kurallar:** Her faz kendi commit'iyle bitirir (Faz A'dan itibaren). Her fazdan sonra Bölüm 7'deki doğrulama komutları koşulur; `errors: []` ve `warnings: []` şartı korunur. Bölüm 6'daki kısıtlar (AGENTS.md) tüm fazlarda geçerlidir. Karar gerektiren adımlar "⏸ ONAY" işaretlidir (Bölüm 8'e bağlanır).

### FAZ A — Versiyon Kontrolü Güvenlik Ağı (öncelik 1, ~15 dk, çözer: F1 + F8/depoyu şişirme riski)

**Amaç:** Mevcut tarihi tek bir geri döndürülebilir noktaya sabitlemek.

**Adımlar:**
1. Durum tespiti: `git -C c:\Users\user\Desktop\zort status --short --untracked-files=normal`
2. ⏸ ONAY: `.gitignore`'a tek satır ekle → `/zortex_oyun_ve_kod_akisi.zip` (30MB zip depoya girmesin; dosya diskte kalır) *(B8.1)*
3. İlk commit:
   ```powershell
   git add -A
   git commit -m "chore: baseline — bagimsiz inceleme oncesi tam depo anlik goruntusu (2026-10-16)"
   git tag v2.5.0-baseline
   ```
4. ⏸ ONAY (opsiyonel): Uzak yedek (`git remote add origin <url>` + push) — runtime offline kuralını bozmaz, yalnızca geliştirici altyapısıdır *(B8.3)*

**Kabul Kriterleri:**
- `git log --oneline -1` başarılı; `git status` temiz (ignore edilenler hariç)
- `git check-ignore zortex_oyun_ve_kod_akisi.zip` → ignored döner
- `python app.py` ile oyun normal açılır (commit hiçbir şeyi değiştirmediği için garantili)

**Risk:** Pratikte yok — işlemler additive'dir. Tek dikkat: commit'ten önce zip ignore edilmelidir.

---

### FAZ B — Test Altyapısı Onarımı (öncelik 2, ~1-2 saat, çözer: F2 + F3 + F4)

**Amaç:** Doğrulama paketini projeye kendine yeterli, yıkıcı olmayan ve çöp üretmeyen hale getirmek.

**Adımlar:**
1. Dış bağımlılığı projeye al:
   ```powershell
   New-Item -ItemType Directory -Force c:\Users\user\Desktop\zort\scripts\lib
   Copy-Item "C:\Users\user\.gemini\antigravity\brain\7b599a49-461e-4fc6-ac6e-e0b48c54c950\scratch\test_144hz_delta_time.py" c:\Users\user\Desktop\zort\scripts\lib\
   ```
   *(Kopyalanacak dosya mevcut değilse: F2'nin kök nedeni — Antigravity scratch dizininden güncel sürüm bulunmalı; bulunamazsa MinimalWebSocket/find_browser sınıfları TESTING_RUNBOOK'taki CDP şemasına göre yeniden yazılır.)*
2. `scripts/verify_full_wave1.py:8-10` değiştir:
   ```python
   SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
   sys.path.insert(0, os.path.join(SCRIPT_DIR, "lib"))
   from test_144hz_delta_time import MinimalWebSocket, find_browser
   ```
3. `:16` taskkill satırını **kaldır**. Port çakışması gerekiyorsa: `DEBUG_PORT` için 9485–9500 arası boş port taraması ekle (asla makine genelinde süreç öldürme).
4. `:14` profil dizinini proje dışına al:
   ```python
   USER_DATA = os.path.join(tempfile.gettempdir(), f"zortex_test_{int(time.time())}")
   ```
5. `finally` bloğuna profil temizliği ekle: `shutil.rmtree(USER_DATA, ignore_errors=True)` — kalıcı hata ayıklama artefaktı gerekiyorsa önce kopyala, sonra sil.
6. Aynı üç düzeltmeyi (lib import, temp profil, taskkill yok) **kanonik** testlere uygula: `benchmark_item4_verified.py`, `verify_zortex_overhaul.py`, `run_full_regression.py` *(kanonik set kararı için B8.5; diğerleri Faz D'de arşivlenir)*

**Kabul Kriterleri:**
- `Select-String -Path scripts\*.py -Pattern "antigravity|taskkill"` → **0 sonuç**
- `python scripts/verify_full_wave1.py` → `errors: []`, `warnings: []` ve **proje kökünde yeni `.app_profile_*` oluşmaz**
- Test, Edge pencerelerini kapatmadan koşar

**Risk:** Düşük — yalnızca test scriptleri değişir, oyun koduna dokunulmaz. CDP şeması (`window.__lastErrors`, `__frameStats`) korunmalıdır.
### FAZ C — Doküman Senkronizasyonu (öncelik 3, ~1 saat, çözer: F5 + F6 + F11'in belge yüzü)

**Amaç:** "Targeted Reading" protokolünün temeli olan haritayı ve kimlik dokümanlarını gerçeğe oturtmak. **Faz B'den SONRA koşulmalı** (test onarımı olmadan doğrulama yapılamaz).

**Adımlar:**
1. Haritayı tazele: `node scripts/update_codebase_map.mjs`
2. `docs/CODEBASE_MAP.md` doğrula: `gameLoop` satır numarası gerçek değerle (≈15921) eşleşmeli; `zortex_fx.js` satır sayısı 2.366 (fiziksel) yazmalı
3. `AGENTS.md`: "~12.8k LOC" ibaresini güncel ölçümle değiştir; "Repository Anatomy" bölümündeki dosya listesini 18 modüllü gerçek yapıya göre revize et
4. `README.md`: (a) "60+ FPS" → 144Hz hedefi; (b) dosya yapısı bölümünü gerçek ağaçla değiştir (18 modül + vendor + assets + scripts); (c) içerik anlatımını AI_HANDOVER'deki gerçek kapsamla (10 gemi, 13 silah, 4 mod) hizala; (d) `src/` bölümünü kaldır veya "arşiv iskeleti" olarak işaretle
5. `AI_HANDOVER_AND_CODEFLOW.md`: "~19k satır" → gerçek; "TR/EN" → "TR/EN/ES/DE"
6. `docs/TESTING_RUNBOOK.md`: Faz B'deki lib düzeni + temp-profil davranışını belgele; kanonik test setini listele

**Kabul Kriterleri:**
- Üç dokümanda (AGENTS, MAP, HANDOVER) index.html için **tek ve aynı** satır sayısı
- Haritadaki en az 3 rastgele sembolün satır numarası gerçekle eşleşir (örnek doğrulama: `Select-String -Path index.html -Pattern "function gameLoop"`)

**Risk:** Yok — doküman değişikliği. Tek dikkat: harita üretimi oyunu değiştirmez.

---

### FAZ D — Onaylı Temizlik / Arşivleme (öncelik 4, ~30 dk, çözer: F4 artıkları + F7 + F8 + F9)

**Amaç:** Diski ve depoyu gürültüden arındırmak — **silme yerine taşıma** (geri döndürülebilir).

**Adımlar:**
1. ⏸ ONAY: Arşiv kökü oluştur: `_archive/2026-10-16/` *(B8.1 — sil mi, arşivle mi?)*
2. Taşı (önerilen):
   ```powershell
   $a="c:\Users\user\Desktop\zort\_archive\2026-10-16"
   Move-Item c:\Users\user\Desktop\zort\src $a\src
   Move-Item c:\Users\user\Desktop\zort\index.html.bak_endless $a\
   Move-Item c:\Users\user\Desktop\zort\zortex_oyun_ve_kod_akisi.zip $a\
   Move-Item c:\Users\user\Desktop\zort\scratch_before.* , c:\Users\user\Desktop\zort\scratch_dbg.* $a\
   Move-Item c:\Users\user\Desktop\zort\phase*_verified.png $a\
   Move-Item c:\Users\user\Desktop\zort\vendor\pixi-filters-6.1.5.tgz , c:\Users\user\Desktop\zort\vendor\tweakpane-4.0.5.tgz $a\vendor_tgz\
   # vendor/*/package kaynak ağaçları için: önce boyut ölç, sonra onayla taşı
   ```
3. ⏸ ONAY: `.app_profile_*`, `.test_cm`, `app_profile_flight_*`, `scripts/__pycache__` — bunlar **kalıcı kayıpsız silinebilir** (test artefaktı); silmeden önce toplam boyut raporla *(B8.6)*
4. `package.json` düzenle: `"main": "src/core/Game.js"` alanını kaldır veya `"scripts.start"`/`"scripts.dev"` zaten `python app.py`'ye işaret ettiği için main'i sil
5. `.gitignore`'a ekle: `_archive/`

**Kabul Kriterleri:**
- `python app.py` → oyun açılır, `/api/health` 200 döner
- `python scripts/verify_full_wave1.py` → `errors: []`, `warnings: []` (assets/ DOKUNULMADI — aktiftir, Bölüm 1.4)
- `git status` temiz; commit mesajı: `chore: archive legacy skeleton and test artifacts`

**Risk:** ORTA — taşıma listesi yanlış kurulursa aktif dosya taşınabilir. **Koruma:** `assets/`, `docs/`, `js/`, `vendor/*.min.js`, `pixi.v8.min.js` taşıma listesinde ASLA yok. Taşıma öncesi Faz A commit'i mevcut olmalıdır (geri alma garantisi).

---

### FAZ E — Opsiyonel / İleri: Birim Test + Kademeli Modülerleştirme (öncelik 5, çözer: F10 + F12)

**E.1 Birim test (düşük risk, yüksek değer):**
- Çerçeve: `node:test` (Node gömülü, ek bağımlılık yok — offline kuralına uygun)
- İlk hedefler: `daily_run_rng.js` (tohum → deterministik çıktı tablosu), `object_pool.js` (havuz tükenmesi/geri dönüş), `localization.js` (4 dilde anahtar eksiksizliği: tr'de olan anahtar en/es/de'de de olmalı)
- Not: Modüller IIFE + `window.*` deseni kullandığı için Node altında yüklemek için mini shim gerekebilir (`globalThis.window = globalThis`) — Faz E başlangıcında 30 dk'lık bir "modül yükleyici shim" işi çıkar
- ⏸ ONAY: Çerçeve tercihi *(B8.4)*

**E.2 Modülerleştirme devamı (P1'in sürdürülmesi):**
- Sıradaki adaylar (düşük risk → yüksek değer): (1) **Profiles/Save** bloğu — `app.py` API'si zaten atomik, blok nispeten bağımsız; (2) **Audio Engine** bloğu — `js/audio/` modülleri hazır, kalan index.html içi audio katmanı taşınabilir
- Yöntem: Faz C sonrası **güncel** CODEBASE_MAP'ten satır aralığı al; bloğu `js/<kategori>/<ad>.js`'e taşı; `index.html`'e tek `<script>` ekle + `// [FX]`/`// [CORE]` kancalarını koru
- **Her taşıma sonrası zorunlu:** `verify_full_wave1.py` + `benchmark_item4_verified.py` (p99 < 8.0ms) + tek commit
- Kural: Tek seferde TEK blok taşınır; iki blok asla aynı commit'te olmaz
---

## 6. TÜM AJANLAR İÇİN GEÇERLİ KISITLAR (AGENTS.md Özeti — Fazlar Sırasında Bağlayıcıdır)

| Kural | Uygulama |
| :--- | :--- |
| `index.html` ASLA yeniden yazılmaz/yeniden üretilmez | Yalnız hedefli, cerrahi satır-bloğu düzenlemeleri; Faz E taşımalarında bile dosyanın tamamı tek seferde üretilemez |
| PixiJS **v8 API** zorunlu | `new Filter(vert, frag)` ve legacy `PIXI.Text` yasak; `GlProgram.from`, modern `Filter`, `MeshRope`, `TilingSprite` |
| FX ayrımı | Görsel/post-process eklemeler `js/fx/zortex_fx.js`'te; `index.html`'e yalnız minimal `// [FX]` kanca |
| Save verisi kutsal | `save_data.json` şeması, `zortex_profiles` / `getActiveProfile()` / `loadMeta()` sözleşmeleri bozulamaz; `app.py` atomik save API'si korunur |
| Donanım & kontrol | Gamepad eşlemeleri, dokunmatik kontroller, `sfxVolume`/`musicVolume` korunur |
| Erişilebilirlik | Her yeni flaş/bloom/evrim sinematiğinde `reduceFlashing` denetlenir |
| Konsol temizliği | 0 hata, 0 uyarı — her fazın sonunda doğrulanır (Bölüm 7) |
| %100 offline | Runtime'da CDN/ağ isteği yasak (git remote, yalnız geliştirici tarafı istisnadır) |
| Harita tazeliği | `index.html` veya `zortex_fx.js` değişen her işten sonra `node scripts/update_codebase_map.mjs` koşulur |

---

## 7. DOĞRULAMA KOMUTLARI (Her Fazdan Sonra Koşulacak Set)

```powershell
# 1. Oyun açılışı + sunucu sağlığı (Faz A/D sonrası zorunlu)
python app.py --no-browser        # /api/health → 200 beklenir

# 2. Headless regression (Faz B onarımından SONRA geçerli)
python scripts/verify_full_wave1.py      # Beklenti: errors: [] , warnings: []

# 3. Performans bütçesi (Faz E taşımalarında zorunlu)
python scripts/benchmark_item4_verified.py   # Beklenti: p99 < 8.0ms, spike yok

# 4. Doküman/harita tazeliği (Faz C ve her kod değişimi sonrası)
node scripts/update_codebase_map.mjs

# 5. Versiyon kontrolü sağlığı (Faz A'dan itibaren her fazda)
git log --oneline -5
git status --short
```

---

## 8. ANTIGRAVITY İLE KARAR SORULARI (⏸ ONAY Maddeleri)

> Bu sorular cevaplanmadan ilgili faz adımı başlatılmaz. Cevaplar bu belgeye işlenerek "karar günlüğü" oluşturulabilir.

| # | Soru | İlgili Faz | İncelemenin Önerisi |
| :--- | :--- | :--- | :--- |
| **B8.1** | 30MB zip, `src/`, yedekler: **arşivle mi, sil mi?** | A (ignore), D (taşıma) | Arşivle (`_archive/2026-10-16/`); silme kararı en az 30 gün ertelensin |
| **B8.2** | `src/` gerçekten terk edilmiş mi? (`bundle.js`'i üreten esbuild akışı hâlâ gerekli mi?) | D | İncelemede hiçbir referans bulunamadı → arşivle; `package.json.main`'i kaldır |
| **B8.3** | Uzak git remote (GitHub/Gitea/özel sunucu) kurulacak mı? | A | Kurulmalı — tek diskta baseline commit bile tek hata noktasıdır |
| **B8.4** | Birim test çerçevesi: `node:test` uygun mu, yoksa mevcut Python harness'a JS runner mı eklenmeli? | E | `node:test` — sıfır bağımlılık, offline uyumlu |
| **B8.5** | `scripts/` içindeki kanonik set hangisi? (Öneri: `verify_full_wave1`, `benchmark_item4_verified`, `verify_zortex_overhaul`, `run_full_regression`, `generate_single_pdf_chat_only`) | B, C, D | TESTING_RUNBOOK'taki 5'li sete dördüncü madde olarak `verify_zortex_overhaul.py` eklensin; kalan ~45 script arşivlensin |
| **B8.6** | ≈190 `.app_profile_*` klasörünün kalıcı silinmesi onaylı mı? (İçinde `save_data.json` YOKTUR — gerçek profil `%APPDATA%\ZortexCyberSurvivor`'dadır, `app.py:34-42`) | D | Silinebilir; öncesinde toplam boyut raporlanmalı |
| **B8.7** | Faz E bu döngüde kapsam içinde mi? İlk taşınacak blok hangisi (Profiles/Save vs Audio)? | E | Bu döngüde yalnız E.1 (birim test); modülerleştirme ayrı döngüye |

### 8.1 Karar Günlüğü (16 Ekim 2026 Kullanıcı Kararları)

1. **Faz A (Versiyon Kontrolü):** Bu oturumda commit atılmayacak. Baseline commit, kullanıcının 7 adımlı talimatıyla ayrıca gerçekleştirilecek (tek tek ekleme, `*.bak*` ve `*.zip` ignore, LFS kaldırma, `.agents/` kontrolü, `git add -A` yok, etiket: `baseline-2026-10-16`).
2. **Faz B (Test Altyapısı):** Yalnızca F3 (`taskkill` kaldırılması) ve F4 (test profillerinin sistem temp klasörüne taşınması ve bitince temizlenmesi) uygulandı. F2 için `scripts/lib` kopyalaması yapılmadı; kanonik doğrulama `scripts/sim_gate.py` olarak belirlendi.
3. **Faz C (Doküman Senkronizasyonu):** `index.html` satır sayısı `(Get-Content index.html).Count` ile ölçüldü (**19.038** satır). `docs/CODEBASE_MAP.md` (`node scripts/update_codebase_map.mjs`), `AGENTS.md`, `README.md`, `AI_HANDOVER_AND_CODEFLOW.md` ve `docs/TESTING_RUNBOOK.md` bu ölçüm ve kanonik test setine göre senkronize edildi.
4. **Faz D (Temizlik / Arşivleme):** Baseline commit atıldıktan ve `%APPDATA%\Roaming\ZortexCyberSurvivor` yedeklendikten sonraya bırakıldı. Taşıma/silme listesi kullanıcı onayına sunulacak.
5. **Faz E (Birim Test & Modülerleştirme):** Bu döngüde kapsam dışı bırakıldı.
6. **B8.5 (Kanonik Test Seti):** `scripts/sim_gate.py`, `scripts/gfx_probe.py`, `scripts/bench_b2.py`, `scripts/update_codebase_map.mjs`. Kalan ~45 script arşivlenmeden önce kullanıcı onayına listelenecek.

---

## 9. İNCELEME YÖNTEMİ (Şeffaflık / Tekrarlanabilirlik)

**Okunan dosyalar (tam):** `README.md`, `package.json`, `docs/` 6 doküman, `AI_HANDOVER_AND_CODEFLOW.md` (ilk 120 satır), `research/OPEN_SOURCE_NOTES.md`, `app.py` (tamamı, 420 satır), `scripts/verify_full_wave1.py` (tamamı), `js/fx/zortex_fx.js` (1–130 + sembol taraması), `js/gameplay/enemy_registry.js` (1–60), `js/core/localization.js` (1–55), `oyna.bat`, `.gitignore`.

**Hedefli okunan bölümler (`index.html`, 19.038 fiziksel satır):** 1–90 (HTML/CSS kabuk), 17690–17787 (kart seçim/yasakla/skip akışı) + `Select-String` sembol taraması (script etiketleri, `[FX]` kancaları, sınıf/fonksiyon tanımları). Monolitin tamamı yüklenmedi — `AGENTS.md` token politikası gereği.

**Koşulan komutlar:** satır sayımı (`Measure-Object -Line`), dizin envanteri (`.app_profile*` hariç tutmalı), `git log` (0 commit tespiti), sembol taramaları (`Select-String`), assets referans taraması.

**Ölçüm tarihi:** 16 Ekim 2026. **Ölçüm düzeltmesi (v1.1):** İlk sayımda `Measure-Object -Line` kullanılmıştı; bu yöntem boş satırları saymadığından index.html 17.787 çıkmıştı. Fiziksel sayım (`[IO.File]::ReadAllLines`) ile düzeltildi: index.html **19.038** (1.256 boş), zortex_fx.js **2.366** (264 boş), app.py **467** (48 boş). Dosya son yazım 15.10.2026 03:47 olduğundan iki ölçüm arasında oyun kodu DEĞİŞMEDİ — sapma tamamen sayım yönteminden kaynaklanıyordu. Not: Depo canlı geliştirildiği için satır sayıları bu belgenin tarihinden itibaren kayabilir — bu durumda önce Bölüm 5 Faz C işletilir.

---

## 10. BELGE BİLGİSİ

- **Üretim:** Cline bağımsız inceleme oturumu, 16 Ekim 2026 — depoda bu belge dışında **hiçbir dosya oluşturulmadı/değiştirilmedi**.
- **Sürüm:** 1.1 *(v1.0 → v1.1: satır sayım yöntemi düzeltildi — fiziksel satır sayılarına geçildi; bkz. Bölüm 9 "Ölçüm düzeltmesi")*
- **Sonraki adım:** Bölüm 8'deki soruları proje sahibiyle cevapla → Faz A'yı Antigravity'ye görev olarak ver → her faz sonunda Bölüm 7 setini koş ve sonuçları `CHANGELOG_FX.md` kültürüne uygun şekilde işle.







