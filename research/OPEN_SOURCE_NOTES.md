# Açık Kaynak İnceleme ve Teknik Araştırma Notları (Madde 5)

Bu doküman, "ZORTEX: CYBER SURVIVOR" projesinde Madde 1-4 kapsamındaki mimari ve görsel iyileştirmeler için taranan açık kaynaklı depolardan derlenen teknik yöntemleri içerir. **Hiçbir harici kod doğrudan kopyalanmamıştır**; yalnızca mimari kalıplar ve algoritmalar PixiJS v8 motoruna uyarlanmıştır.

---

## 1. İncelenen Açık Kaynaklı Depolar Tablosu

| Depo Adı & Bağlantı | Lisans | Son Güncelleme | Pixi / Motor Sürümü | İncelenen & Öğrenilen Teknik | İlgili Madde |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`pixijs/pixijs` (Official Examples)** | MIT | 2024-2026 | PixiJS v8.x | `TilingSprite` tabanlı sonsuz akan lazer ışını (`tilePosition.x`), `Graphics.clear()` çağrılarından kaçınarak GPU batching kullanımı. | **Madde 3, Madde 4** |
| **`pixijs/filters`** | MIT | 2024-2026 | PixiJS v8.x | `GlProgram` tabanlı tek geçişli filtreler, render target tahsis maliyetini önlemek için filtre ön ısıtması (warm-up), silüet ayrıştırma. | **Madde 1, Madde 4** |
| **`lmcasella/cyber-survivors`** | MIT | 2023-2024 | PixiJS | Survivors türünde havuzlanmış mermi/ışın yönetimi, yoğunluk ölçekleme (`1/sqrt(n)` çoklu ışın sönümleme) ve GC-free yaşam döngüsü. | **Madde 3, Madde 4** |
| **`bsergean/pixi-space-shooter`** | MIT | 2022-2024 | PixiJS | Gemi gövde katmanı (`shipBodyLayer`) ile kalkan/aura katmanlarının ayrık tutulması; 'add' blend kalkanın gemiyi beyazlatmasını önleme. | **Madde 1** |
| **`kittykatattack/learningPixi`** | MIT | 2022-2023 | PixiJS | Her karede Graphics yeniden çiziminden kaçınma; sprite rotasyonlarında ani açı atamaları yerine görsel `lerp` rotasyon yumuşatma. | **Madde 4** |

---

## 2. Bize Uyan 5 Temel Teknik ve Kullanım Alanları

### Teknik 1: Ayrık Gövde ve Kalkan Katmanlama (Madde 1 İçin)
- **Problem**: `RimGlowFilter` kalkan ve gemiyi aynı `pixiPlayerContainer` üzerinde örneklediğinde, kalkan balonu (`shieldBubbleSprite`) tüm alanı kaplayıp opak neon diske dönüşüyor.
- **Çözüm**: `shipBodyLayer` oluşturularak `RimGlowFilter` yalnızca gemi gövdesine bağlanır. Kalkan balonu ve halkası filtrenin dışında, bağımsız additive katmanda düşük alfa ile tutulur.

### Teknik 2: CSS Chamfer ve Taşma İzolasyonu (Madde 2 İçin)
- **Problem**: Ebeveyn `.weapon-hud-slot` üzerindeki `clip-path: polygon(...)`, dışa taşan `-8px` tuş rozetlerini ve sağ üstteki butonlar skor metnini kesiyor.
- **Çözüm**: Rozetler slotun güvenli iç sınırlarına (`top: 2px, left: 4px`) çekilir veya `clip-path` yalnızca dekoratif pseudo-element (`::before`) arka planına uygulanarak çocuk elemanların kırpılması önlenir. `#top-controls` flex hizalaması ile `.hud-top-right` metninden ayrılır.

### Teknik 3: `TilingSprite` + Radyal Gradient Işın Mimarisi (Madde 3 İçin)
- **Problem**: Her karede `pixiHazardsAbove` Graphics'ine 3 kalın `stroke` ile çizilen düz lazer, çoklu ışında (multi-shot) sarı bir kütleye dönüşüyor ve performansı düşürüyor.
- **Çözüm**: Önceden üretilmiş radyal dikey gradyanlı doku (merkez parlak beyaz -> neon camgöbeği -> yumuşak saydam kenar) ile havuzlanmış `TilingSprite` kullanılır. `tilePosition.x` kaydırılarak akan enerji hissi verilir; `1/sqrt(n)` genişlik ve alfa ölçeklemesiyle üst üste binmeler engellenir.

### Teknik 4: Görsel Rotasyon Yumuşatma ve Işınlanma Artçı Görüntüsü (Madde 4 İçin)
- **Problem**: `PhantomEnemy.hit()` anında 28px ani sıçrama ve `Enemy.update` içindeki ani `angle = atan2(...)` atamaları mikro-titremelere yol açıyor.
- **Çözüm**: Düşman mantıksal açısı korunurken sprite rotasyonu kısa bir `lerp` sönümlemesiyle yumuşatılır; Phantom ışınlanması anlık zıplama yerine 120 ms'lik hızlı kayma + artçı silüet (afterimage) ile akıcı hale getirilir.

### Teknik 5: Filtre Isıtma (Warm-Up) ve Sıfır-GC Graphics Eliminasyonu (Madde 4 İçin)
- **Problem**: İlk hasar/dash anında `RGBSplit` veya `Shockwave` ilk kez eklendiğinde WebGL shader derleme ve FBO ayırma gecikmesi (jank) oluşuyor; her karede Graphics `clear()` çağrılıyor.
- **Çözüm**: Oyun yüklenirken filtreler 1 kare boş render ile önceden ısıtılır (`warm-up`); efekt anında yalnızca uniform parametreleri ve `filter.enabled` bayrağı değiştirilir. Sık güncellenen çizgiler havuzlu Sprite/Mesh yapılarına taşınır.
