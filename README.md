# 🚀 ZORTEX: CYBER SURVIVOR - DESKTOP & CONSOLE EDITION

Neon Cyberpunk temalı, ultra akıcı 144Hz (144 FPS) mekaniklere, %100 Gamepad / Oyun Kolu desteğine, bağımsız masaüstü uygulama mimarisine, prosedürel Web Audio ses sentezleyicisine, rogue-lite siber kalıntılara (Relics), elit affikslere ve arcade hissine ("Game Juice") sahip gelişmiş 2D uzay savaşı oyunu.

---

## 🎮 Nasıl Başlatılır? (Bağımsız Masaüstü Uygulaması)

Zortex, harici ağır framework'lere (Electron vb.) ihtiyaç duymadan **doğrudan bağımsız bir yerel masaüstü uygulaması (Standalone Desktop App)** olarak çalışacak şekilde optimize edilmiştir:

1. **🚀 1-Tıkla Masaüstü Başlatıcı (Önerilen):**
   - Masaüstünüzdeki `zort` klasöründe yer alan [`oyna.bat`](file:///C:/Users/user/Desktop/zort/oyna.bat) dosyasına çift tıklayın.
   - Bilgisayarınızda Python varsa [`app.py`](file:///C:/Users/user/Desktop/zort/app.py) üzerinden yerel bir çekirdek kurarak tarayıcı çubukları, sekmeler ve menüler olmadan tam ekran bir pencerede başlatır.
   - Python yoksa doğrudan Microsoft Edge Uygulama Modu (`--app`) ile başlatılır.
2. **🐍 Python Launcher ile:**
   ```bash
   python app.py
   ```
3. **🌐 Bağımsız Tek Dosya (Offline):**
   - [`index.html`](file:///C:/Users/user/Desktop/zort/index.html) dosyasını herhangi bir web tarayıcısında açmanız yeterlidir (sıfır internet / sıfır harici dosya bağımlılığı).

---

## 🕹️ Konsol & Gamepad Deneyimi (100% Kol ile Kontrol)

Oyun sadece oynanış esnasında değil; **Ana Menü, Hangar Yükseltmeleri, Seviye Atlama Kartları, Duraklatma Menüsü ve Oyun Sonu Savaş Raporu dahil tüm arayüzlerde** fareye veya klavyeye dokunmadan yalnızca oyun koluyla kontrol edilebilir (Steam Deck / Big Picture deneyimi).

### 🎯 Konsol Arayüz Gezinmesi (Virtual Focus & Haptics)
- **D-Pad (Yön Tuşları) / Sol Analog:** Menü butonları ve yükseltme kartları arasında gezinir (neon odak çerçevesi ve prosedürel sesli odak tıkları).
- **(A) / Cross (X):** Seçili öğeyi onayla / tıkla / yükseltmeyi satın al.
- **(B) / Circle (O):** Geri dön / Menüyü kapat / Duraklatmayı devam ettir / Ana menüye dön.
- **(Y) / Triangle (Δ):** Menüde anında **Hangar** ekranını açma kısayolu.
- **(X) / Square (□):** Menüde anında **Retro CRT Filtresini** açma/kapama kısayolu.
- **(LB) & (RB) / L1 & R1:** Ana menüde gemi sınıfları arasında (Interceptor ⟷ Titan ⟷ Spectre) anında döngüsel geçiş.
- **📳 Dual-Rumble Haptik Titreşim:** Web Gamepad API titreşim motoru ile D-pad tıkları (`tick`), silah geri tepmesi (`recoil`), orta darbeler (`medium`) ve ölümcül patlamalar/eser alımları (`heavy`) kolda gerçek zamanlı hissedilir.

### ⚔️ Savaş Alanı Kontrolleri

| Eylem | Gamepad (Xbox / PS / Kol) | Klavye & Fare |
| :--- | :--- | :--- |
| **Gemi Hareketi (360°)** | **Sol Analog Çubuk / D-Pad** | **W, A, S, D / Yön Tuşları** |
| **Nişan Alma & Otomatik Ateş** | **Sağ Analog Çubuk (Twin-Stick)** | **Fare İmleci + Sol Tık** |
| **Manuel Ateşleme** | **Sağ Tetik (RT / R2)** | **Sol Tık** (Basılı Tutma) |
| **Siber Dash** | **Sağ Omuz (RB / R1) veya RT** | **Space** veya **Sağ Tık** |
| **Taktiksel Holo-Decoy** | **Sol Omuz (LB / L1) veya LT** | **C Tuşu** |
| **Overdrive / Ultimate Lazer** | **Sol Analog Basma (L3) veya Y** | **E / Q Tuşları** |
| **Duraklat / Menü** | **Start / Options Butonu** | **P / ESC Tuşları** |

---

## 💎 Siber Kalıntılar (Relics & Artifacts System)

Elit düşmanlardan (%16 ihtimal) ve Boss'lardan (%100 garanti) düşen altın altıgen biçimindeki efsanevi siber eserler:

1. **🌀 Tekillik Çekirdeği (Singularity Core - Efsanevi):** Kara deliklerin yuttuğu her düşman oyuncunun mermi hasarını kalıcı olarak +%3 artırır.
2. **⚡ Aşırı Yükleme Reaktörü (Overclock Reactor - Destansı):** Ateş hızını %25 artırır, Dash bekleme süresini %10 uzatır.
3. **🩸 Vampirik Nanitler (Vampiric Nanites - Efsanevi):** Kritik vuruşla öldürülen her düşman oyuncuya 2 can yeniler.
4. **🛡️ Kuantum Saptırıcı (Quantum Deflector - Destansı):** Kalkan kırıldığında 1.5 saniyelik hasarsız faz kayması tetikler ve düşmanları savurur.

---

## 🔥 Kombo Sayacı & Siber Adrenalin (Adrenaline Rush)

Düşmanları arka arkaya imha ettikçe kombo sayacı yükselir:
- **Skor Çarpanı:** Her 10 komboda skor kazanımı artar (maksimum 4.0x çarpan).
- **25x Adrenaline Rush:** Gemi hızı +%18, ateş hızı +%22 artar, neon sarı aura parlar.
- **50x Cyber Frenzy:** Gemi hızı +%32, ateş hızı +%47 artar; gemi arkasında gökkuşağı renginde parçacıklar fışkırır.

---

## 👾 Sevk ve Seviye: 4 Seçkin Düşman Affiksi (Elite Affixes)

Dalga 2'den itibaren ortaya çıkan seçkin düşmanlar özel affikslere sahiptir:
- **💥 Volatile (Patlayıcı):** Öldüğünde 8 yöne yüksek hızlı mermi saçar.
- **❄️ Frostbite (Buzul Aura):** Yaklaştığında oyuncuyu dondurarak hızını %35 keser.
- **⚡ Tempest (Fırtına Arkı):** Belirli aralıklarla oyuncuya doğru ölümcül şimşek arkları fırlatır.
- **🛡️ Aegis (Enerji Kalkanı):** Kendisini saran döner bariyer ile ilk 80 hasarı soğurur.

---

## 🔱 Silah Evrimi (Synergy) - Gatling Lazer

- Oyuncu hem **"Hızlı Tetik" (fire_rate)** hem de **"Çoklu Plazma" (multi_shot)** yükseltmelerine sahip olduğunda, sonraki seviye atlama ekranında efsanevi **Gatling Lazer** garanti çıkar. Mermiler kesintisiz bir plazma ışınına dönüşür ve atış bekleme süresi sıfırlanır.

---

## 📡 Taktiksel Decoy (Holo-Kopya) & Dinamik Hack Bölgesi

- **Holo-Decoy (C Tuşu / LB):** 5 saniye boyunca haritadaki tüm düşmanların dikkatini üzerine çeken siber hologram bırakır. Süre bitiminde 350 hasarlı devasa EMP patlamasıyla infilak eder.
- **Dinamik Hack Alanı (Risk-Reward Zone):** Her 45 saniyede bir çıkan yeşil hack çemberinde kalındığında düşman spawn hızı x2 olur. 8 saniye hayatta kalındığında can tamamen dolar ve efsanevi bir yükseltme hediye edilir.
- **Near-Miss Bullet Time:** Düşman mermisi gövdeyi teğet geçtiğinde zaman 0.5 saniyeliğine %50 yavaşlar ve siber zaman bükülmesi sesi çalar.

---

## 🛠️ Meta-Progression (Hangar Sistemi)

Düşmanlardan toplanan hurdalar (🔩) yerel hafızaya kaydedilir:
- **❤️ Gövde Takviyesi:** Başlangıç Maksimum Canını kalıcı artırır.
- **🛡️ Kalkan Jeneratörü:** Başlangıç Enerji Kalkanını kalıcı artırır.
- **⚡ İyon İticileri:** Taban gemi hızını kalıcı artırır.

---

## 📁 Proje Dosya Yapısı

```
c:/Users/user/Desktop/zort/
├── index.html          # Bağımsız çekirdek oyun (19.038 satır)
├── js/                 # 18 modüler alt sistem (audio, core, fx, gameplay)
│   ├── fx/zortex_fx.js # GPU Post-Process efekt motoru (2.367 satır)
│   ├── audio/          # Prosedürel Web Audio motoru ve broker
│   ├── core/           # Kamera, havuz, i18n (4 dil), profilleyici, günlük RNG
│   └── gameplay/       # Boss'lar, düşmanlar, silah füzyonları, meta gelişim
├── app.py              # Yerel REST API ve masaüstü sunucu başlatıcısı
├── oyna.bat            # Çift tıklamalı 1-tık masaüstü başlatıcı
├── vendor/             # Çevrimdışı kütüphaneler (PixiJS v8, tweakpane, filters)
├── assets/             # SFX ve sprite dokuları
├── docs/               # Mimari ve test dokümanları (CODEBASE_MAP.md, RUNBOOK vb.)
├── scripts/            # Kanonik test paketi (sim_gate.py, gfx_probe.py, bench_b2.py)
├── src/                # [Arşiv İskeleti] Eski modüler deneme (kullanılmıyor)
└── README.md           # Kapsamlı sistem ve kullanım kılavuzu
```

---

## 🧪 Kalite ve Güvenilirlik Testleri

Tüm oyun mekanikleri headless Playwright/Chromium CDP üzerinde kanonik regresyon kapısı (`scripts/sim_gate.py`) ile 10 dalga boyunca otomatik olarak simüle edilir; 0 konsol hatası ve 0 runtime exception doğrulaması sağlanır. Performans kriterleri (`scripts/bench_b2.py`) ile 144 FPS / ~6.94 ms kare bütçesi kontrol edilir.
