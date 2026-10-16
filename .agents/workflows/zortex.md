---
description: zortex oyunu kuralları 
---

# ZORTEX PROJE KURALLARI

DOSYA VE BİÇİM
1. index.html CRLF'dir ve ~19k satırlık tek dosyadır. Baştan yazma, yalnızca ilgili satırları değiştir. Satır sonları bozulmamalı.
2. Satır numaralarına ve docs/CODEBASE_MAP.md'ye güvenme, eskiyebilir. Önce grep -n ile gerçek yeri bul.
3. Yeni dosya yalnızca js/, scripts/ veya docs/ altına. Kök dizine ve scratch/ altına dosya bırakma.
4. src/ ağacına dokunma ve silme (kullanılmıyor, karar sahibi verecek).

PIXIJS v8
5. Yalnızca v8 Graphics API: moveTo/lineTo/circle/rect + fill()/stroke(). YENİ beginFill/endFill/lineStyle/drawCircle/drawRect YAZMA. v7 çağrı sayıları (index.html + js/ toplam) artmamalı. Önce/sonra yaz ve sayım yöntemini belirt.
6. Değişmeyen veya yavaş değişen çizimi her kare yeniden üretme. Bir kez dokuya pişir (generateTexture), sprite veya TilingSprite kullan.
7. Çizim değiştirdiğinde scripts/gfx_probe.py ile talimat listesini kontrol et. v8 uyumluluk katmanında stroke() veya endFill() almayan çizgi ÇİZİLMEZ ve stil sonraki çizime sızar. Doku boş (0 talimat) çıkmamalı.
8. generateTexture çözünürlüğü ana düşmanlarla aynı olmalı (2x veya üstü).

PERFORMANS
9. Oyun döngüsünde (update/gameLoop/render) new, {}, [], .map/.filter/.forEach ile geçici nesne ve splice yok. Havuz kullan.
10. Süre ve hız dt ile ölçeklenir (dt 0.001-0.033 aralığına sıkıştırılır). Sabit kare varsayma. Hedef 144 FPS.
11. Performans iddiası ölçüme dayanır: en az 600 kare, p50 ve p95, ölçüm ortamı (gerçek GPU mu yazılım mı) belirtilir. Tahmin, ölçüm olarak sunulmaz.

RASTGELELİK
12. Oynanışı etkileyen rastgelelik (spawn, düşüş, kart, sandık) gameRng() kullanır. Efekt ve parçacıklar Math.random kullanır. Math.random'ı ASLA ezme veya değiştirme.

SUNUCU VE KAYIT
13. app.py: CORS yok, POST gövdesi en fazla 1 MB, JSON ve şema doğrulaması, yabancı Origin/Host için 403, kayıt klasörü servis edilen kökün dışında. Kayıt dosyalarını bozma, değişiklikten önce yedeğini al.

DOĞRULAMA (her görevde)
14. Bitirmeden: python scripts/sim_gate.py -> PASS (10 dalga, 0 hata). HAM çıktıyı yapıştır.
15. Görsel değişiklikte önce/sonra ekran görüntüsü ve talimat listesi diff'i ver. Görünümü DEĞİŞTİREN bir şeyi onay almadan uygulama.
16. Büyük değişiklikten sonra docs/CODEBASE_MAP.md (node scripts/update_codebase_map.mjs) ve AGENTS.md'deki satır sayıları güncel olmalı.

GIT
17. Ben açıkça istemeden git commit, push, reset --hard, force push veya geçmiş yeniden yazma yapma.
18. Commit'ten önce sim_gate.py PASS (ham çıktı) ve `git status` çıktısı göster. `git add .` kullanma; dosyaları tek tek ekle ve ne eklediğini listele.
19. .app_profile*, kayıt dosyaları, ekran görüntüsü çıktıları ve geçici dosyalar asla depoya girmez.
20. index.html ~19k satır. ASLA tamamını okuma veya yeniden yazma. Her zaman grep -n ve dar satır aralığı.
21. Çizim kontrolü için scripts/gfx_probe.py'ı sadece ilgili dokuyu/fonksiyonu hedefleyerek çalıştır; 52 dokunun hepsini her seferinde dökme.
22. Görsel kanıt için ekran görüntüsü: görevde istenen kadar (önce/sonra), fazlasını üretme. docs/ altında biriken görüntüleri görev bitince _archive/ altına taşı veya sil.
23. docs/CODEBASE_MAP.md güncelse önce onu oku; eskiyse önce yeniden üret (node scripts/update_codebase_map.mjs), sonra ara.