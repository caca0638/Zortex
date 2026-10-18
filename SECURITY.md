# Güvenlik Politikası (Security Policy)

## Desteklenen Sürümler (Supported Versions)

Aşağıdaki tabloda güvenlik güncellemeleri alan sürümler belirtilmiştir:

| Sürüm | Destek Durumu |
| :--- | :--- |
| 2.5.x | :white_check_mark: Destekleniyor |
| < 2.5.0 | :x: Desteklenmiyor |

---

## Güvenlik Açığı Bildirimi (Reporting a Vulnerability)

Projede herhangi bir güvenlik açığı, hassas veri/anahtar sızıntısı veya kötüye kullanım potansiyeli fark ederseniz:

1. **Lütfen Açık Issue (Herkese Açık Bildirim) AÇMAYIN.**
2. Bunun yerine doğrudan şu kanallardan özel olarak iletişime geçin:
   - **GitHub:** Proje sayfasındaki **Security > Report a vulnerability** (Özel Açık Bildirimi) sekmesini kullanın.
   - **E-posta:** `cagataykendir1@gmail.com` adresine konu kısmına `[SECURITY VULNERABILITY - ZORTEX]` yazarak detayları iletin.
3. Raporunuzda lütfen:
   - Açığın türü ve etki alanı,
   - Yeniden üretme (reproduce) adımları veya kavram kanıtı (PoC) bilgilerini paylaşın.

Bildirilen açıklar en geç 48 saat içinde incelenecek ve gerekli yama yayınlanacaktır.

---

## İstemci Tarafı (Client-Side) Güvenlik Notu

Zortex bir HTML5 WebGL / Electron tabanlı 2D arcade oyunudur. Oyunun tüm istemci kodları (JavaScript) kullanıcının cihazında çalışmaktadır. Bu nedenle:
- İstemci kodları içerisine hiçbir zaman gizli API anahtarı, sunucu şifresi veya özel token gömülmemelidir.
- Çevrimdışı save verileri yerel depolamada saklanmakta olup kritik kullanıcı kimlik bilgisi barındırmaz.
