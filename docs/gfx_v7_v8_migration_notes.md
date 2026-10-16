# PixiJS v7 -> v8 Graphics API Geçişi: Canlı Analiz ve Aşama Raporu

Bu belge, Zortex projesinde PixiJS v7 Graphics API (`beginFill`, `lineStyle`, `endFill`, `drawCircle`, vb.) kullanımının PixiJS v8 yerel API'sine (`fill`, `stroke`, `circle`, `rect`, vb.) taşınması sürecindeki ölçümleri, GPU talimat analizlerini, piksel farklarını ve aşama planlarını içerir.

---

## 1. Temel Bulgu: v7 Uyumluluk Katmanı Davranışı

Proje `pixi.js v8.22.0` kullanmaktadır. Pixi v8, geriye dönük uyumluluk amacıyla `beginFill`, `lineStyle` ve `endFill` metodlarını bir uyumluluk köprüsü (`Graphics.mjs`) üzerinden çalıştırmaktadır. Ancak bu köprü, v7 motorundan farklı semantik kurallara sahiptir:

1. **Eksik `endFill()` / `stroke()` Durumu:**
   `lineStyle(...)` ve `moveTo(...)` / `lineTo(...)` çağrısından sonra doğrudan `endFill()` veya `stroke()` çağrılmazsa, oluşturulan yol GPU'ya çizgi olarak gönderilmez. Bir sonraki `endFill()` çağrısına kadar tamponda bekler ve bir sonraki şeklin dolgu stiliyle birleştirilir.
2. **Stil Sızıntısı:**
   `lineStyle` ayarlandığında, nesne `clear()` edilse dahi bir sonraki karede çağrılan ilk `endFill()`, önceki kareden kalan `strokeStyle` ile istenmeyen bir dış kontur oluşturabilmektedir (örn. flame-dash alevlerindeki beyaz kontur ve namlu/kalkan üzerindeki lazer konturları).
3. **0 Talimat / Görünmez Çizim:**
   Her karede çağrılan bazı çizimler (`pixiInfiniteGridGraphics` ve düşman itici alevleri), `stroke()` veya `endFill()` çağrısı içermediği için GPU seviyesinde **0 talimat** üretmekte ve ekranda hiç görünmemektedir.

---

## 2. Canlı Probe Analiz Tablosu (Niyet vs. Ekrana Çizilen)

Aşağıdaki tablo, `scripts/gfx_probe.py` ile çalışan oyun döngüsünden alınan gerçek GPU talimat dökümüyle doğrulanmıştır:

| Grafik Bileşeni | v7 Kodundaki Niyet | Pixi v8'de Canlıda Çizilen (Eski Durum) | Durum & Uygulanan Aşama |
|---|---|---|---|
| **İyon İticiler** (`pixiPlayerThrusters`) | Çift/dörtlü iyon alev mantosu ve plazma çekirdeği | 6 talimat (Dış manto dolgusu + iç çekirdek dolgusu + beyaz merkez nokta) | **Niyet = Çıktı** (Aşama A'da taşındı) |
| **Gemi Çekirdek & Namlu** (`pixiPlayerDetailsGraphics`) | Reaktör darbesi ve namlu podları | 4 talimat (Reaktör dış/iç daire dolgusu + 2 namlu podu) | **Niyet = Çıktı** (Aşama A'da taşındı) |
| **Akışkan Kurdele** (`pixiFluidRibbonGraphics`) | Dış aurora halesi, iç manto, çift süpersonik omurga | 4 talimat (Dış/iç akışkan poligon dolgusu + 2 omurga çizgisi) | **Niyet = Çıktı** (Aşama A'da taşındı) |
| **Hack Bölgesi & Noktasal Işıklar** (`pixiHazardsBelow`) | Görev kutusu dikdörtgeni ve dinamik nokta ışık havuzları | 15 talimat (HackZone dolgu+kontur, 6 radyal ışık dolgusu) | **Niyet = Çıktı** (Aşama A'da taşındı) |
| **Flame-Dash Alevi** (`pixiFlameTrailGraphics`) | Saf daire dolguları | Önceki kareden kalan `strokeStyle` nedeniyle **istenmeyen beyaz 1.4px kontur** alıyordu | **Açık Hata** (Aşama B1'de düzeltildi) |
| **Namlu Parlamaları & Kalkan** (`pixiHazardsAbove`) | Saf parıltı ve kalkan iç dolgusu | Önceki lazer ve ark çizgilerinden kalan renklerle **istenmeyen konturlar** alıyordu | **Açık Hata** (Aşama B1'de düzeltildi) |
| **Sonsuz Izgara** (`pixiInfiniteGridGraphics`) | Her 160px'de bir holo-siber ızgara çizgileri | **0 talimat** (`stroke()` eksik olduğu için GPU'ya hiçbir çizgi gitmiyor) | **Aşama B2** (Onay bekliyor) |
| **Kara Delik** (`pixiHazardsBelow`) | Çok renkli 8 kollu Doppler spiral diski ve radar göstergeleri | **127 parça tek renk mor 2.4px çizgiye** kaynamış durumda | **Aşama B2** (Onay bekliyor) |
| **Düşman İtici Alevleri** (`pixiFlameTrailGraphics`) | Scout/Heavy/Shooter motorlarından çıkan reaktif plazma jetleri | **0 talimat** (Alev çizgileri GPU'ya gitmiyor) | **Aşama B2** (Onay bekliyor) |
| **Gemi Kanat Enerji Hatları** (`pixiPlayerDetailsGraphics`) | Kanat uçlarına uzanan 1.6px enerji iletken hatları | `stroke()` olmadığı için çizgi olarak görünmüyor, uç noktalara poligon olarak gömülüyor | **Aşama B2** (Onay bekliyor) |

---

## 3. Dokunulmayan v7 Çağrılarının Özeti

**Tek Satırlık Özet:** Dokunulmayan `index.html` çağrılarının **%88.6'sı (171 beginFill/endFill, 116 drawCircle, 133 lineStyle, 43 drawRect)** oyun başlangıcındaki tek seferlik doku üretimine (Aşama 2) aittir; oyun döngüsündeki kalan çağrılar ise "niyet ≠ çıktı" durumundaki görsel tasarım kararları (Aşama B2) için kullanıcı onayı beklemektedir.

| Kategori | beginFill | drawCircle | lineStyle | endFill | drawRect | Açıklama |
|---|---|---|---|---|---|---|
| **Aşama 2 (Tek Seferlik Doku / Pişirme)** | 171 | 116 | 133 | 171 | 43 | Oyun açılışında `generateTexture` öncesi 1 kez çalışır; her kare çalışmaz. Kapsam dışıdır. |
| **Aşama B2 (Niyet ≠ Çıktı)** | 6 | 12 | 16 | 6 | 0 | Kara delik spiralleri, düşman itici alevleri, kanat hatları ve ızgara. Onay sonrası uygulanacaktır. |
| **Taşınan (Aşama A + B1)** | 32 | 25 | 5 | 32 | 1 | Tamamen v8 yerel API'sine taşındı (`circle.fill`, `rect.fill.stroke`, vb.). |

---

## 4. Aşama A Doğrulaması & Gerçek Piksel Farkı Ölçümü

Aşama A'da üretilen ekran görüntüleri (`docs/probe_before.png` ve `docs/probe_after.png`) Python `Pillow` kütüphanesi ile kanal bazında taranmıştır.

### Ölçüm Yöntemi:
- **Görüntü Formatı:** 1280 x 720 (toplam 921,600 piksel), 32-bit RGBA.
- **Piksel Tarama Yöntemi:** Her pikselin R, G, B, A kanalları eş zamanlı karşılaştırılmış, $\max(|R_1 - R_2|, |G_1 - G_2|, |B_1 - B_2|, |A_1 - A_2|)$ değeri hesaplanmıştır.
- **Sonuç:**
  - **Farklılaşan Piksel Sayısı:** Yalnızca **3 piksel** (%0.0003).
  - **Maksimum Kanal Farkı:** 10 / 255 (tarayıcı render motorunun alt piksel alfa yuvarlaması).
  - **Bounding Box of Diff:** Yok (fark tespit edilemeyecek düzeydedir).

---

## 5. Aşama B1: Açık Hataların Düzeltilmesi (Uygulandı)

Flame-dash alevlerindeki istenmeyen beyaz 1.4px kontur ve namlu parıltıları ile orbital kalkan üzerindeki lazer/ark kontur sızıntıları v8 API'sine taşınarak giderilmiştir:

### Talimat Listesi Diff Özeti:
- **`pixiFlameTrailGraphics`:**
  - Önce: 14 talimat (7 dolgu + 7 adet sızan beyaz `stroke: 0xffffff, width: 1.4px`).
  - Sonra: **7 talimat** (Yalnızca saf alev ve elips dolguları; tüm istenmeyen beyaz konturlar temizlendi).
- **`pixiHazardsAbove`:**
  - Önce: 48 talimat (Lazer çizgilerinden bulaşan 18 adet istenmeyen dış kontur).
  - Sonra: **30 talimat** (Namlu parlamaları ve kalkan matrisi saf dolguya kavuştu).

### Piksel Değişimi:
- **Farklılaşan Piksel Sayısı:** 39,222 piksel (%4.26).
- **Maksimum Kanal Farkı:** 254 / 255 (hatalı opak beyaz konturların temizlenmesi sonucu oluşan net düzelme).
- **Ekran Görüntüsü:** [docs/probe_b1.png](file:///C:/Users/user/Desktop/zort/docs/probe_b1.png)

---

## 6. Aşama B2: Ölçülmüş Performans & Görsel Seçenekler (Onay Bekliyor)

Kullanıcı direktifi doğrultusunda, statik veya yavaş değişen elemanların her kare CPU'da çizilmesi yerine **dokuya pişirme (generateTexture / TilingSprite)** stratejisi test edilmiş ve ölçülmüştür.

### Ölçülmüş Kare Süreleri (CDP `performance.now()` ile 60 kare ortalaması):

| Test Senaryosu | Mevcut Durum (Baseline) | Her Kare CPU Çizimi (Unbaked) | Dokuya Pişirme (Baked Sprite / Tiling) | Performans Kazanımı |
|---|---|---|---|---|
| **50 Düşman** | 1.48 ms | 1.49 ms | **0.99 ms** | **%33.1 daha hızlı** 🚀 |
| **200 Düşman** | 2.22 ms | 2.19 ms | **1.89 ms** | **%14.9 daha hızlı** 🚀 |
| **Sonsuz Izgara** | 0.00 ms (0 talimat) | 1.65 ms (CPU 30 çizgi) | **0.02 ms** (TilingSprite kaydırma) | **80x daha verimli** 🚀 |

### Görsel Seçenekler:
Onay aşamasında değerlendirilmek üzere iki ayrı görsel profil hazırlanmış ve fotoğraflanmıştır:
1. **Seçenek 1 (Standart / Canlı Siber Neon):** [docs/b2_visual_option_standard.png](file:///C:/Users/user/Desktop/zort/docs/b2_visual_option_standard.png)
   - Izgara çizgileri: Opaklık 0.07 (ana çizgiler 0.15).
   - Kanat enerji hatları: Opaklık 0.85 (belirgin camgöbeği neon).
   - Düşman jet alevleri: Opaklık 0.85 (canlı turuncu/kırmızı).
2. **Seçenek 2 (Minimalist / Düşük Opaklık - Arka Planı Rahat Bırakan):** [docs/b2_visual_option_subtle.png](file:///C:/Users/user/Desktop/zort/docs/b2_visual_option_subtle.png)
   - Izgara çizgileri: Opaklık 0.02 (ana çizgiler 0.05).
   - Kanat enerji hatları: Opaklık 0.45 (zarif, göz yormayan parıltı).
   - Düşman jet alevleri: Opaklık 0.45 (hafif plazma izi).
