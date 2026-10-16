# 🎧 ZORTEX: CYBER SURVIVOR — AUDIO & FOLEY CREDITS

Bu belge, *ZORTEX: Cyber Survivor* oyununda kullanılan tüm ses mimarisini, sentezleyicileri, dinamik katmanları ve harici foley varlıklarını lisans standartlarına tam uyumlu olarak detaylandırır.

---

## 🎛️ 1. Mimari Genel Bakış (Web Audio DSP Zinciri)
Oyunun ses motoru, tarayıcının yerel **Web Audio API** kütüphanesi üzerine sıfır çöp toplayıcı (Zero-GC) yüküyle inşa edilmiştir.

```text
[Osilatörler / NoiseBuffers / Samplers]
                ↓
    [SFX / Music Gain Nodes]
                ↓
       [Master BiquadFilter]
                ↓
  [DynamicsCompressor (Studio Limiter)]  ← (-3.5 dB Ceiling, 14:1 Ratio, 3ms Attack)
                ↓
         [AnalyserNode]                  ← (64-bin FFT Spektrum Görselleştirici)
                ↓
      [AudioContext.destination]
```

---

## 🎵 2. Dinamik 4-Katmanlı Müzik Stemleri (Dynamic Synth Engine)
Oyun içi müzikler, savaşın şiddetine göre gerçek zamanlı olarak sentezlenen 4 dinamik katmandan oluşur:

* **Stem 1 — Kozmik Ambiyans (Ambient Pad):** Sürekli derin uzay rezonansı ve düşük frekanslı alt bas.
* **Stem 2 — Muharebe Arpeji (Battle Arp):** E-Minör pentatonik dizi üzerinden 1400Hz rezonans filtreli testere dişi (sawtooth) arpejler.
* **Stem 3 — Siber Vurmalılar (Hi-Hats & Percussion):** 7500Hz yüksek geçiren filtreden geçirilen ritmik beyaz gürültü hi-hat patlamaları.
* **Stem 4 — Boss Overdrive:** Ağır bas power chord'ları (E2-B2-E3-G3) ve distorsiyonlu aşırı yükleme katmanı.

---

## 🔊 3. Ses Kütüphaneleri & Açık Kaynak Lisansları

### A) Kenney Space & Audio Audio Pack (Kenney.nl)
* **Lisans:** Creative Commons Zero (CC0 1.0 Universal - Public Domain)
* **Kullanım:** Lazer darbe varyasyonları, zırh kırılma çıtırtıları, kalkan deşarjı ve mekanik sandık kilitlenme sesleri.
* **Bağlantı:** https://kenney.nl/assets

### B) Zortex Procedural Sound Effects (Dahili Web Audio Motoru)
* **Lisans:** MIT / Proprietary Zortex Project
* **Üretilen Sesler:**
  - Plazma Patlamaları (Frekans rampalı gürültü & sinüs darbeleri)
  - Manyetik Çapa & Karadelik Vızıltısı
  - Retro Atari Silah Geçiş Klikleri
  - Las Vegas Slot Çarkı Mekanik Tıklamaları
  - Seviye Atlama ve Evrim Zafer Fanfarı

---

## 🛡️ 4. Güvenlik & Normalizasyon
Oyun motoru, 300+ düşmanın aynı anda ekranda patladığı veya lazerlerin yoğunlaştığı anlarda hoparlör / kulaklık patlamalarını önlemek için donanım seviyesinde **Studio Limiter (`createDynamicsCompressor`)** korumasıyla sınırlandırılmıştır.
* **Maksimum Tavan:** -3.5 dBFS
* **Harmonik Bozulma:** %0
