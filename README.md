# ZORTEX: CYBER SURVIVOR - DESKTOP & CONSOLE EDITION

Neon Cyberpunk temalı, 144Hz (144 FPS) mekaniklere, tam Gamepad / Oyun Kolu desteğine, bağımsız masaüstü uygulama mimarisine, prosedürel Web Audio ses sentezleyicisine, rogue-lite siber kalıntılara (Relics), elit affikslere ve arcade hissine sahip 2D uzay savaşı oyunu.

---

## Nasil Baslatilir ve Derlenir? (Native EXE & Masaustu Mimarisi)

Zortex, hem dogrudan derlenmis **Native Windows (`Zortex.exe`)** paketi olarak hem de hafif masaustu sunucusu uzerinden calisabilir:

1. **Gercek Native Windows EXE (`Zortex.exe`):**
   - `dist\win-unpacked\Zortex.exe` dosyasini dogrudan calistirabilir veya kok dizindeki [`oyna.bat`](file:///C:/Users/user/Desktop/zort/oyna.bat) dosyasina cift tiklayabilirsiniz.
   - Tarayiciya veya Python kurulumuna ihtiyac duymaz; gomulu 144Hz GPU motoru, ozel Mecha ikonu, tam ekran kontrolu (`F11` / `Alt+Enter`) ve atomik kayit sistemi ile bagimsiz pencere olarak acilir.
2. **Native EXE ve Dagitim Paketlerini Yeniden Derleme (itch.io & CrazyGames):**
   ```bash
   npm run build:exe    # dist/win-unpacked/Zortex.exe uretir, ikonu gomer ve self-test yapar
   npm run build:itch   # itch.io (Windows ZIP) ve CrazyGames/itch.io (Web HTML5 ZIP) paketlerini uretir
   ```
3. **Python Gelistirici Sunucusu ile:**
   ```bash
   python app.py
   ```

---

## Konsol & Gamepad Deneyimi (%100 Kol ile Kontrol)

Oyun sadece oynanis esnasinda degil; Ana Menu, Hangar Yukseltmeleri, Seviye Atlama Kartlari, Duraklatma Menusu ve Oyun Sonu Savas Raporu dahil tum arayuzlerde fareye veya klavyeye dokunmadan yalnizca oyun koluyla kontrol edilebilir.

### Konsol Arayuz Gezinmesi (Virtual Focus & Haptics)
- **D-Pad (Yon Tuslari) / Sol Analog:** Menu butonlari ve yukseltme kartlari arasinda gezinir (odak cercevesi ve prosedurel sesli odak tiklari).
- **(A) / Cross (X):** Secili ogeyi onayla / tikla / yukseltmeyi satin al.
- **(B) / Circle (O):** Geri don / Menuyu kapat / Duraklatmayi devam ettir / Ana menuye don.
- **(Y) / Triangle:** Menude aninda Hangar ekranini acma kisayolu.
- **(X) / Square:** Menude aninda Retro CRT Filtresini acma/kapama kisayolu.
- **(LB) & (RB) / L1 & R1:** Ana menude gemi siniflari arasinda (Interceptor <-> Titan <-> Spectre) aninda dongusel gecis.
- **Dual-Rumble Haptik Titresim:** Web Gamepad API titresim motoru ile D-pad tiklari (`tick`), silah geri tepmesi (`recoil`), orta darbeler (`medium`) ve olumcul patlamalar/eser alimlari (`heavy`) kolda gercek zamanli hissedilir.

### Savas Alani Kontrolleri

| Eylem | Gamepad (Xbox / PS / Kol) | Klavye & Fare |
| :--- | :--- | :--- |
| **Gemi Hareketi (360°)** | **Sol Analog Cubuk / D-Pad** | **W, A, S, D / Yon Tuslari** |
| **Nisan Alma & Otomatik Ates** | **Sag Analog Cubuk (Twin-Stick)** | **Fare Imleci + Sol Tik** |
| **Manuel Atesleme** | **Sag Tetik (RT / R2)** | **Sol Tik (Basili Tutma)** |
| **Siber Dash** | **Sag Omuz (RB / R1) veya RT** | **Space veya Sag Tik** |
| **Taktiksel Holo-Decoy** | **Sol Omuz (LB / L1) veya LT** | **C Tusu** |
| **Overdrive / Ultimate Lazer** | **Sol Analog Basma (L3) veya Y** | **E / Q Tuslari** |
| **Duraklat / Menu** | **Start / Options Butonu** | **P / ESC Tuslari** |

---

## Cephanelik: Silah Evrimleri ve Sinerji Sistemi

Oyunda 13 adet farkli silah sistemi yer alir. Seviye 8'e ulasan ana silahlar ve modul silahlari, gerekli pasif bilesenlerle birlestiginde sandiklardan veya seviye atlamalardan evrim gecirir.

### 1. Dört Cekirdek Ana Silah (Iki Dalli Evrim)

| Ana Silah | Evrim Dali A (Gereksinim) | Evrim Dali B (Gereksinim) |
| :--- | :--- | :--- |
| **Blaster** | **Gatling Lazer** (Cekirdek Sogutucu)<br>Araliksiz kesintisiz foton isini. | **Kaos Salvosu** (Katliam Sayaci)<br>Mermiler duvardan/hedeften sekip ikiye ayrilir. |
| **Sacilma (Spread)** | **Spektrum Isini** (Optik Mercek)<br>Prizmatik kirilan genis konik lazer dalgasi. | **Supernova Cekirdegi** (Yanik Muhur)<br>Patlayip alev alani birakan termonukleer mermiler. |
| **Plazma Isini** | **Nova Hatti** (Lanetli Cip)<br>Ekran boyu delen, her hedefte katlanan hiper isin. | **Firtina Girdabi** (Tempest Rezonansi)<br>Hedefler arasinda sicrayan zincirleme elektrik firtinasi. |
| **Railgun** | **Hayalet Ray** (Hayalet Plaka)<br>Engelleri delen, arkasinda iyonik hasar izi birakan atis. | **Buzul Mizragi** (Kriyo Kalbi)<br>Hedefleri donduran ve kirilma aninda buz sarapneli sacan mizrak. |

### 2. Modul Silahlari (Tek Dalli Evrimler)

| Modul Silahi | Evrim (Gereken Pasif Ortak) | Aciklama |
| :--- | :--- | :--- |
| **Yorunge Bicaklari** | **Kesim Firtinasi** (Asiri Yuk Kondansatoru) | Donen 8 devasa plazma testeresi temas eden her seyi bicer. |
| **Mayin Birakici** | **Cekim Mayini** (Kuantum Miknatis) | Infilak ettiginde dusmanlari icine ceken mini tekillikler acar. |
| **Gudumlu Fuze Surusu** | **Kiyamet Salvosu** (Kritik Matris) | Kume bombasi birakan nukleer mikro fuzeler firlatir. |
| **Tesla Bobini** | **Faraday Kafesi** (Reaktif Kalkan) | Gemi cevresinde kesintisiz donen yuksek voltaj plazma bariyeri. |
| **Golge Klonu** | **Zaman Kaymasi** (Atalet Sonumleyici) | Iki golge klon olusturur ve zamani yavaslatirken cift atis yapar. |
| **Hologram Prizma** | **Kristal Kafes** (Yansitici Plaka) | 3 prizma olusturarak dusman mermilerini emip lazer olarak geri yansitir. |
| **Yercekimi Topu** | **Tekillik Cekirdegi** (Yercekimi Kaymasi) | Ekrandaki kucuk dusmanlari yutan devasa tekillik yaratir. |
| **Orbital Lazer Uydusu**| **Gunes Topu** (Evrim Odak Lensi) | Yeryuzunu eriten devasa termonukleer solar patlama sutunu indirir. |

### 3. Efsanevi Cift-Silah Fuzyonlari (Mythic Fusions)

- **Mutlak Sifir (Absolute Zero):** Gatling Lazer + Buzul Mizragi birlestiginde acilir. Delici supersonik lazer tum ekrani dondurur, olen dusmanlar buz sarapneli sacar.
- **Klaster Supernova (Cluster Nova):** Supernova Cekirdegi + Sacilma Atisi birlestiginde acilir. Her bomba 3 alt-cekirdege ayrilarak zincirleme termonukleer sok dalgalari sacar.
- **Tekillik Firtinasi (Void Tempest):** Firtina Girdabi + Railgun Manyetik Rezonans birlestiginde acilir. Yildirim arklarinin carptigi yerlerde mini yercekimi tekillikleri acilir.

---

## Siber Kalintilar (Relics & Artifacts System)

Elit dusmanlardan (%16 ihtimal) ve Boss'lardan (%100 garanti) dusen altin altigen bicimindeki siber eserler:

1. **Tekillik Cekirdegi (Singularity Core - Efsanevi):** Kara deliklerin yuttugu her dusman oyuncunun mermi hasarini kalici olarak +%3 artirir.
2. **Asiri Yukleme Reaktoru (Overclock Reactor - Destansi):** Ates hizini %25 artirir, Dash bekleme suresini %10 uzatir.
3. **Vampirik Nanitler (Vampiric Nanites - Efsanevi):** Kritik vurusla oldurulen her dusman oyuncuya 2 can yeniler.
4. **Kuantum Saptirici (Quantum Deflector - Destansi):** Kalkan kirildiginda 1.5 saniyelik hasarsiz faz kaymasi tetikler ve dusmanlari savurur.

---

## Kombo Sayaci & Siber Adrenalin (Adrenaline Rush)

Dusmanlari arka arkaya imha ettikce kombo sayaci yukselir:
- **Skor Carpani:** Her 10 komboda skor kazanimi artar (maksimum 4.0x carpan).
- **25x Adrenaline Rush:** Gemi hizi +%18, ates hizi +%22 artar, neon sari aura parlar.
- **50x Cyber Frenzy:** Gemi hizi +%32, ates hizi +%47 artar; gemi arkasinda gokkusagi renginde parcaciklar fiskirir.

---

## Sevk ve Seviye: 4 Seckin Dusman Affiksi (Elite Affixes)

Dalga 2'den itibaren ortaya cikan seckin dusmanlar ozel affikslere sahiptir:
- **Volatile (Patlayici):** Oldugunde 8 yone yuksek hizli mermi sacar.
- **Frostbite (Buzul Aura):** Yaklastiginda oyuncuyu dondurarak hizini %35 keser.
- **Tempest (Firtina Arki):** Belirli araliklarla oyuncuya dogru olumcul simsek arklari firlatir.
- **Aegis (Enerji Kalkani):** Kendisini saran doner bariyer ile ilk 80 hasari sogurur.

---

## Taktiksel Decoy (Holo-Kopya) & Dinamik Hack Bolgesi

- **Holo-Decoy (C Tusu / LB):** 5 saniye boyunca haritadaki tum dusmanlarin dikkatini uzerine ceken siber hologram birakir. Sure bitiminde 350 hasarli devasa EMP patlamasiyla infilak eder.
- **Dinamik Hack Alani (Risk-Reward Zone):** Her 45 saniyede bir cikan hack cemberinde kalindiginda dusman spawn hizi x2 olur. 8 saniye hayatta kalindiginda can tamamen dolar ve efsanevi bir yukseltme hediye edilir.
- **Near-Miss Bullet Time:** Dusman mermisi govdeyi teget gectiginde zaman 0.5 saniyeligne %50 yavaslar ve siber zaman bukulmesi sesi calar.

---

## Meta-Progression (Hangar Sistemi)

Dusmanlardan toplanan hurdalar yerel hafizaya kaydedilir:
- **Govde Takviyesi:** Baslangic Maksimum Canini kalici artirir.
- **Kalkan Jeneratoru:** Baslangic Enerji Kalkanini kalici artirir.
- **Iyon Iticileri:** Taban gemi hizini kalici artirir.

---

## Proje Dosya Yapisi

```
c:/Users/user/Desktop/zort/
├── index.html          # Bagimsiz cekirdek oyun ve arayuzler
├── desktop/            # Native Windows EXE motoru (main.cjs, preload.cjs, icon.ico)
├── js/                 # Moduler alt sistemler (audio, core, fx, gameplay)
│   ├── fx/zortex_fx.js # GPU Post-Process efekt motoru
│   ├── audio/          # Prosedurel Web Audio motoru ve broker
│   ├── core/           # Kamera, havuz, i18n (4 dil), profilleyici, gunluk RNG
│   └── gameplay/       # Boss'lar, dusmanlar, silah fuzyonlari, meta gelisim
├── app.py              # Yerel REST API ve masaustu sunucu baslaticisi
├── oyna.bat            # Cift tiklamali 1-tik masaustu baslatici (Once Zortex.exe'yi acar)
├── vendor/             # Cevrimdisi kutuphaneler (PixiJS v8, tweakpane, filters)
├── assets/             # SFX ve sprite dokulari
├── docs/               # Mimari ve test dokumanlari (CODEBASE_MAP.md, RUNBOOK vb.)
├── scripts/            # Kanonik test ve EXE/dagitim derleme betikleri
└── README.md           # Kapsamli sistem ve kullanim kilavuzu
```

---

## Kalite ve Guvenilirlik Testleri

Tum oyun mekanikleri headless Chromium CDP uzerinde kanonik regresyon kapisi (`scripts/sim_gate.py`) ile 10 dalga boyunca otomatik olarak simule edilir; 0 konsol hatasi ve 0 runtime exception dogrulamasi saglanir. Arayuz, silah atesleme ve boss asamalarinin dogrulamasi `scripts/verify_zortex_overhaul.py` ile yapilir.
