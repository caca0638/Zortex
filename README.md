# ZORTEX: CYBER SURVIVOR - DESKTOP & CONSOLE EDITION

Neon Cyberpunk temalı, 144Hz (144 FPS) mekaniklere, tam Gamepad / Oyun Kolu desteğine, bağımsız masaüstü uygulama mimarisine, prosedürel Web Audio ses sentezleyicisine, rogue-lite siber kalıntılara (Relics), elit affikslere ve arcade hissine sahip 2D uzay savaşı oyunu.

---

## Nasıl Başlatılır ve Derlenir? (Native EXE & Masaüstü Mimarisi)

Zortex, hem doğrudan derlenmiş **Native Windows (`Zortex.exe`)** paketi olarak hem de hafif masaüstü sunucusu üzerinden çalışabilir:

1. **Gerçek Native Windows EXE (`Zortex.exe`):**
   - `dist\win-unpacked\Zortex.exe` dosyasını doğrudan çalıştırabilir veya kök dizindeki [`oyna.bat`](file:///C:/Users/user/Desktop/zort/oyna.bat) dosyasına çift tıklayabilirsiniz.
   - Tarayıcıya veya Python kurulumuna ihtiyaç duymaz; gömülü 144Hz GPU motoru, özel Mecha ikonu, tam ekran kontrolü (`F11` / `Alt+Enter`) ve atomik kayıt sistemi ile bağımsız pencere olarak açılır.
2. **Native EXE ve Dağıtım Paketlerini Yeniden Derleme (itch.io & CrazyGames):**
   ```bash
   npm run build:exe    # dist/win-unpacked/Zortex.exe üretir, ikonu gömer ve self-test yapar
   npm run build:itch   # itch.io (Windows ZIP) ve CrazyGames/itch.io (Web HTML5 ZIP) paketlerini üretir
   ```
3. **Python Geliştirici Sunucusu ile:**
   ```bash
   python app.py
   ```

---

## Konsol & Gamepad Deneyimi (%100 Kol ile Kontrol)

Oyun sadece oynanış esnasında değil; Ana Menü, Hangar Yükseltmeleri, Seviye Atlama Kartları, Duraklatma Menüsü ve Oyun Sonu Savaş Raporu dahil tüm arayüzlerde fareye veya klavyeye dokunmadan yalnızca oyun koluyla kontrol edilebilir.

### Konsol Arayüz Gezinmesi (Virtual Focus & Haptics)
- **D-Pad (Yön Tuşları) / Sol Analog:** Menü butonları ve yükseltme kartları arasında gezinir (odak çerçevesi ve prosedürel sesli odak tıkları).
- **(A) / Cross (X):** Seçili öğeyi onayla / tıkla / yükseltmeyi satın al.
- **(B) / Circle (O):** Geri dön / Menüyü kapat / Duraklatmayı devam ettir / Ana menüye dön.
- **(Y) / Triangle:** Menüde anında Hangar ekranını açma kısayolu.
- **(X) / Square:** Menüde anında Retro CRT Filtresini açma/kapama kısayolu.
- **(LB) & (RB) / L1 & R1:** Ana menüde gemi sınıfları arasında (Interceptor <-> Titan <-> Spectre) anında döngüsel geçiş.
- **Dual-Rumble Haptik Titreşim:** Web Gamepad API titreşim motoru ile D-pad tıkları (`tick`), silah geri tepmesi (`recoil`), orta darbeler (`medium`) ve ölümcül patlamalar/eser alımları (`heavy`) kolda gerçek zamanlı hissedilir.

### Savaş Alanı Kontrolleri

| Eylem | Gamepad (Xbox / PS / Kol) | Klavye & Fare |
| :--- | :--- | :--- |
| **Gemi Hareketi (360°)** | **Sol Analog Çubuk / D-Pad** | **W, A, S, D / Yön Tuşları** |
| **Nişan Alma & Otomatik Ateş** | **Sağ Analog Çubuk (Twin-Stick)** | **Fare İmleci + Sol Tık** |
| **Manuel Ateşleme** | **Sağ Tetik (RT / R2)** | **Sol Tık (Basılı Tutma)** |
| **Siber Dash** | **Sağ Omuz (RB / R1) veya RT** | **Space veya Sağ Tık** |
| **Taktiksel Holo-Decoy** | **Sol Omuz (LB / L1) veya LT** | **C Tuşu** |
| **Overdrive / Ultimate Lazer** | **Sol Analog Basma (L3) veya Y** | **E / Q Tuşları** |
| **Duraklat / Menü** | **Start / Options Butonu** | **P / ESC Tuşları** |

---

## Cephanelik: Silah Evrimleri ve Sinerji Sistemi

Oyunda 13 adet farklı silah sistemi yer alır. Seviye 8'e ulaşan ana silahlar ve modül silahları, gerekli pasif bileşenlerle birleştiğinde sandıklardan veya seviye atlamalardan evrim geçirir.

### 1. Dört Çekirdek Ana Silah (İki Dallı Evrim)

| Ana Silah | Evrim Dalı A (Gereksinim) | Evrim Dalı B (Gereksinim) |
| :--- | :--- | :--- |
| **Blaster** | **Gatling Lazer** (Çekirdek Soğutucu)<br>Aralıksız kesintisiz foton ışını. | **Kaos Salvosu** (Katliam Sayacı)<br>Mermiler duvardan/hedeften sekip ikiye ayrılır. |
| **Saçılma (Spread)** | **Spektrum Işını** (Optik Mercek)<br>Prizmatik kırılan geniş konik lazer dalgası. | **Süpernova Çekirdeği** (Yanık Mühür)<br>Patlayıp alev alanı bırakan termonükleer mermiler. |
| **Plazma Işını** | **Nova Hattı** (Lanetli Çip)<br>Ekran boyu delen, her hedefte katlanan hiper ışın. | **Fırtına Girdabı** (Tempest Rezonansı)<br>Hedefler arasında sıçrayan zincirleme elektrik fırtınası. |
| **Railgun** | **Hayalet Ray** (Hayalet Plaka)<br>Engelleri delen, arkasında iyonik hasar izi bırakan atış. | **Buzul Mızrağı** (Kriyo Kalbi)<br>Hedefleri donduran ve kırılma anında buz şarapneli saçan mızrak. |

### 2. Modül Silahları (Tek Dallı Evrimler)

| Modül Silahı | Evrim (Gereken Pasif Ortak) | Açıklama |
| :--- | :--- | :--- |
| **Yörünge Bıçakları** | **Kesim Fırtınası** (Aşırı Yük Kondansatörü) | Dönen 8 devasa plazma testeresi temas eden her şeyi biçer. |
| **Mayın Bırakıcı** | **Çekim Mayını** (Kuantum Mıknatıs) | İnfilak ettiğinde düşmanları içine çeken mini tekillikler açar. |
| **Güdümlü Füze Sürüsü** | **Kıyamet Salvosu** (Kritik Matris) | Küme bombası bırakan nükleer mikro füzeler fırlatır. |
| **Tesla Bobini** | **Faraday Kafesi** (Reaktif Kalkan) | Gemi çevresinde kesintisiz dönen yüksek voltaj plazma bariyeri. |
| **Gölge Klonu** | **Zaman Kayması** (Atalet Sönümleyici) | İki gölge klon oluşturur ve zamanı yavaşlatırken çift atış yapar. |
| **Hologram Prizma** | **Kristal Kafes** (Yansıtıcı Plaka) | 3 prizma oluşturarak düşman mermilerini emip lazer olarak geri yansıtır. |
| **Yerçekimi Topu** | **Tekillik Çekirdeği** (Yerçekimi Kayması) | Ekrandaki küçük düşmanları yutan devasa tekillik yaratır. |
| **Orbital Lazer Uydusu**| **Güneş Topu** (Evrim Odak Lensi) | Yeryüzünü eriten devasa termonükleer solar patlama sütunu indirir. |

### 3. Efsanevi Çift-Silah Füzyonları (Mythic Fusions)

- **Mutlak Sıfır (Absolute Zero):** Gatling Lazer + Buzul Mızrağı birleştiğinde açılır. Delici süpersonik lazer tüm ekranı dondurur, ölen düşmanlar buz şarapneli saçar.
- **Klaster Süpernova (Cluster Nova):** Süpernova Çekirdeği + Saçılma Atışı birleştiğinde açılır. Her bomba 3 alt-çekirdeğe ayrılarak zincirleme termonükleer şok dalgaları saçar.
- **Tekillik Fırtınası (Void Tempest):** Fırtına Girdabı + Railgun Manyetik Rezonans birleştiğinde açılır. Yıldırım arklarının çarptığı yerlerde mini yerçekimi tekillikleri açılır.

---

## Siber Kalıntılar (Relics & Artifacts System)

Elit düşmanlardan (%16 ihtimal) ve Boss'lardan (%100 garanti) düşen altın altıgen biçimindeki siber eserler:

1. **Tekillik Çekirdeği (Singularity Core - Efsanevi):** Kara deliklerin yuttuğu her düşman oyuncunun mermi hasarını kalıcı olarak +%3 artırır.
2. **Aşırı Yükleme Reaktörü (Overclock Reactor - Destansı):** Ateş hızını %25 artırır, Dash bekleme süresini %10 uzatır.
3. **Vampirik Nanitler (Vampiric Nanites - Efsanevi):** Kritik vuruşla öldürülen her düşman oyuncuya 2 can yeniler.
4. **Kuantum Saptırıcı (Quantum Deflector - Destansı):** Kalkan kırıldığında 1.5 saniyelik hasarsız faz kayması tetikler ve düşmanları savurur.

---

## Kombo Sayacı & Siber Adrenalin (Adrenaline Rush)

Düşmanları arka arkaya imha ettikçe kombo sayacı yükselir:
- **Skor Çarpanı:** Her 10 komboda skor kazanımı artar (maksimum 4.0x çarpan).
- **25x Adrenaline Rush:** Gemi hızı +%18, ateş hızı +%22 artar, neon sarı aura parlar.
- **50x Cyber Frenzy:** Gemi hızı +%32, ateş hızı +%47 artar; gemi arkasında gökkuşağı renginde parçacıklar fışkırır.

---

## Sevk ve Seviye: 4 Seçkin Düşman Affiksi (Elite Affixes)

Dalga 2'den itibaren ortaya çıkan seçkin düşmanlar özel affikslere sahiptir:
- **Volatile (Patlayıcı):** Öldüğünde 8 yöne yüksek hızlı mermi saçar.
- **Frostbite (Buzul Aura):** Yaklaştığında oyuncuyu dondurarak hızını %35 keser.
- **Tempest (Fırtına Arkı):** Belirli aralıklarla oyuncuya doğru ölümcül şimşek arkları fırlatır.
- **Aegis (Enerji Kalkanı):** Kendisini saran döner bariyer ile ilk 80 hasarı soğurur.

---

## Taktiksel Decoy (Holo-Kopya) & Dinamik Hack Bölgesi

- **Holo-Decoy (C Tuşu / LB):** 5 saniye boyunca haritadaki tüm düşmanların dikkatini üzerine çeken siber hologram bırakır. Süre bitiminde 350 hasarlı devasa EMP patlamasıyla infilak eder.
- **Dinamik Hack Alanı (Risk-Reward Zone):** Her 45 saniyede bir çıkan hack çemberinde kalındığında düşman spawn hızı x2 olur. 8 saniye hayatta kalındığında can tamamen dolar ve efsanevi bir yükseltme hediye edilir.
- **Near-Miss Bullet Time:** Düşman mermisi gövdeyi teğet geçtiğinde zaman 0.5 saniyeliğine %50 yavaşlar ve siber zaman bükülmesi sesi çalar.

---

## Meta-Progression (Hangar Sistemi)

Düşmanlardan toplanan hurdalar yerel hafızaya kaydedilir:
- **Gövde Takviyesi:** Başlangıç Maksimum Canını kalıcı artırır.
- **Kalkan Jeneratörü:** Başlangıç Enerji Kalkanını kalıcı artırır.
- **İyon İticileri:** Taban gemi hızını kalıcı artırır.

---

## Proje Dosya Yapısı

```
c:/Users/user/Desktop/zort/
├── index.html          # Bağımsız çekirdek oyun ve arayüzler
├── desktop/            # Native Windows EXE motoru (main.cjs, preload.cjs, icon.ico)
├── js/                 # Modüler alt sistemler (audio, core, fx, gameplay)
│   ├── fx/zortex_fx.js # GPU Post-Process efekt motoru
│   ├── audio/          # Prosedürel Web Audio motoru ve broker
│   ├── core/           # Kamera, havuz, i18n (4 dil), profilleyici, günlük RNG
│   └── gameplay/       # Boss'lar, düşmanlar, silah füzyonları, meta gelişim
├── app.py              # Yerel REST API ve masaüstü sunucu başlatıcısı
├── oyna.bat            # Çift tıklamalı 1-tık masaüstü başlatıcı (Önce Zortex.exe'yi açar)
├── vendor/             # Çevrimdışı kütüphaneler (PixiJS v8, tweakpane, filters)
├── assets/             # SFX ve sprite dokuları
├── docs/               # Mimari ve test dokümanları (CODEBASE_MAP.md, RUNBOOK vb.)
├── scripts/            # Kanonik test ve EXE/dağıtım derleme betikleri
└── README.md           # Kapsamlı sistem ve kullanım kılavuzu
```

---

## Kalite ve Güvenilirlik Testleri

Tüm oyun mekanikleri headless Chromium CDP üzerinde kanonik regresyon kapısı (`scripts/sim_gate.py`) ile 10 dalga boyunca otomatik olarak simüle edilir; 0 konsol hatası ve 0 runtime exception doğrulaması sağlanır. Arayüz, silah ateşleme ve boss aşamalarının doğrulaması `scripts/verify_zortex_overhaul.py` ile yapılır.

---

## Lisans (License)

Bu proje ikili (dual/split) bir lisans modeli kullanır:

- **Kaynak Kod (Yazılım Motoru, Betikler, HTML/JS/CSS):** [GNU General Public License v3.0 (GPL-3.0)](LICENSE) altında lisanslanmıştır. Kod incelenebilir, değiştirilebilir ve katkı sağlanabilir; ancak koddan türetilen tüm projeler de açık kaynak ve GPL-3.0 olmak zorundadır. Kapatılıp gizli satılamaz.
- **Oyun Varlıkları, Sesler, Marka & Tasarımlar (Assets & Branding):** **Tüm Hakları Saklıdır (All Rights Reserved)**.
  - "ZORTEX: Cyber Survivor" adı, logoları, gemi/düşman/boss sprite çizimleri, prosedürel ses sentezleri, oyun hikayesi ve görsel tasarım varlıkları yazılı izin olmaksızın klonlanamaz, ticari platformlarda (Steam, Play Store vb.) satılamaz veya yeniden dağıtılamaz.

Ayrıntılı şartlar ve tam yasal metin için [`LICENSE`](LICENSE) dosyasını inceleyebilirsiniz.
