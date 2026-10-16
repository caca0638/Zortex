# ZORTEX: CYBER SURVIVOR - TESTING & VERIFICATION RUNBOOK

> **TOKEN OPTIMIZATION POLICY**: Consult this runbook before creating or running regression tests, benchmarks, or browser automation. Avoid re-inventing test harnesses.

---

## 1. AUTOMATED TEST ARCHITECTURE

Automated testing uses headless Chromium (`msedge.exe`, `chrome.exe`, or Playwright Chromium) with hardware WebGL acceleration enabled via Chrome DevTools Protocol (CDP) WebSocket communication:

```bash
# Flags used for accurate 144Hz WebGL execution:
--headless=new
--use-gl=angle
--enable-webgl
--enable-webgl2
--remote-debugging-port=9485
--window-size=1280,720
```

> **PROFILE & ISOLATION PROTOCOL (Faz B Onarımı):**
> - Test profilleri repo köküne ASLA yazılmaz; işletim sistemi geçici klasöründe (`tempfile.mkdtemp` / `tempfile.gettempdir()`) oluşturulur ve `finally` bloğunda `shutil.rmtree` ile silinir.
> - Makine genelinde `taskkill` kesinlikle çağrılmaz; kullanıcının açık tarayıcı sekmeleri korunur.
> - Regresyon doğrulaması için dış scratch/lib bağımlılığı yoktur; kanonik giriş noktası `scripts/sim_gate.py`'dır.

---

## 2. CANONICAL VERIFICATION SCRIPTS (`scripts/`)

| Script File | Purpose & Scope | Execution Command | Pass / Fail Criteria |
| :--- | :--- | :--- | :--- |
| **`sim_gate.py`** | **Kanonik Regresyon Kapısı:** 10 dalga headless simülasyon, 0 renderer yükü, console/loop hata takibi, heap & sahne node telemetrisi. | `python scripts/sim_gate.py` | `RESULT: PASS` (10 wave, 0 console/loop errors). |
| **`gfx_probe.py`** | **GPU Çizim & Dokusu Probe'u:** v8 geçişlerinde Graphics komut listesi ve doku instruction dump'ı alır. | `python scripts/gfx_probe.py <prefix>` | Doku boş çıkmamalı (>0 komut), stil sızıntısı 0. |
| **`bench_b2.py`** | **144Hz Performans Benchmarkı:** 600 kare boyunca p50, p95 ve kare süresi ölçümü. | `python scripts/bench_b2.py` | p50 < 7.0 ms, p95 < 8.0 ms. |
| **`update_codebase_map.mjs`** | **Dinamik Kod Haritası:** index.html ve zortex_fx.js satır haritasını yeniler. | `node scripts/update_codebase_map.mjs` | Exit code 0, `docs/CODEBASE_MAP.md` güncellenir. |
| **`verify_full_wave1.py`** | Yardımcı / Tek dalga testi (15 sn savaş, CDP hata kontrolü). | `python scripts/verify_full_wave1.py` | `errors.length === 0` and `warnings.length === 0`. |
| **`benchmark_item4_verified.py`** | Yardımcı / 60 sn 110 düşman stres testi. | `python scripts/benchmark_item4_verified.py` | p99 < 8.0 ms, sıfır spike. |

---

## 3. PERFORMANCE BUDGET & TELEMETRY THRESHOLDS

To pass delivery, tests must adhere to the following strict thresholds:

| Metric | Target / Threshold | Measurement Method |
| :--- | :--- | :--- |
| **Console Errors** | **0** | `window.__lastErrors` via CDP Runtime.evaluate |
| **Console Warnings** | **0** | `window.__lastWarnings` via CDP Runtime.evaluate |
| **Median Frame Time** | **< 7.2 ms** (144 FPS) | `window.__frameStats().median` |
| **p95 Frame Time** | **< 7.5 ms** | `window.__frameStats().p95` |
| **p99 Frame Time** | **< 8.0 ms** | `window.__frameStats().p99` |
| **Spikes > 20 ms** | **0** (during active combat) | `window.__frameStats().spikes20` (excluding boot 0-5s) |
| **Spikes > 33 ms** | **0** (during active combat) | `window.__frameStats().spikes33` (excluding boot 0-5s) |
| **Long Tasks (>50ms)** | **0** (during active combat) | PerformanceObserver `longtask` |
