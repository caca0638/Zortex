/**
 * ZORTEX: CYBER SURVIVOR - KAYIT VE META-PROGRESSION SİSTEMİ (SaveSystem.js)
 * Persistent JSON tabanlı profil, hangar yükseltmeleri ve başarımlar motoru.
 * Yerel Python /api/save uç noktası ve localStorage çift yönlü senkronizasyonu.
 */

export class SaveSystem {
  constructor() {
    this.storageKey = 'zortex_cyber_save_v2';
    this.activeProfileName = 'Ajan Alpha';
    this.profiles = {
      'Ajan Alpha': this.createNewProfile('Ajan Alpha')
    };
    this.load();
  }

  createNewProfile(name) {
    return {
      name,
      createdAt: Date.now(),
      lastPlayed: Date.now(),
      highScore: 0,
      maxWave: 1,
      totalKills: 0,
      scrap: 150,
      hangarUpgrades: {
        speed: 0,
        hp: 0,
        shield: 0,
        crit: 0,
        magnet: 0
      },
      techNodes: [],
      achievements: []
    };
  }

  get activeProfile() {
    if (!this.profiles[this.activeProfileName]) {
      this.profiles[this.activeProfileName] = this.createNewProfile(this.activeProfileName);
    }
    return this.profiles[this.activeProfileName];
  }

  selectProfile(name) {
    if (!this.profiles[name]) {
      this.profiles[name] = this.createNewProfile(name);
    }
    this.activeProfileName = name;
    this.save();
  }

  // Hangar Yükseltmesi Satın Alma
  upgradeHangar(statKey, cost) {
    const p = this.activeProfile;
    if (p.scrap >= cost) {
      p.scrap -= cost;
      p.hangarUpgrades[statKey] = (p.hangarUpgrades[statKey] || 0) + 1;
      this.save();
      return true;
    }
    return false;
  }

  // Kaydetme İşlemi (Python API + localStorage)
  async save() {
    const payload = {
      activeProfileName: this.activeProfileName,
      profiles: this.profiles,
      version: '2.5.0',
      timestamp: Date.now()
    };

    // 1. Tarayıcı Yerel Belleğine Kaydet
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('localStorage save hatası:', e);
    }

    // 2. Python Masaüstü API'sine Atomik POST (/api/save)
    try {
      if (window.location.protocol.startsWith('http')) {
        await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
    } catch (err) {
      // Çevrimdışı modda sessizce devam et
    }
  }

  // Yükleme İşlemi
  async load() {
    // 1. Önce localStorage'dan oku
    try {
      const localData = localStorage.getItem(this.storageKey);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed && parsed.profiles) {
          this.profiles = parsed.profiles;
          if (parsed.activeProfileName) this.activeProfileName = parsed.activeProfileName;
        }
      }
    } catch (e) {
      console.warn('localStorage load hatası:', e);
    }

    // 2. Python Backend'den (/api/save) daha güncel veri varsa birleştir
    try {
      if (window.location.protocol.startsWith('http')) {
        const resp = await fetch('/api/save');
        if (resp.ok) {
          const res = await resp.json();
          if (res.status === 'ok' && res.data && res.data.profiles) {
            this.profiles = res.data.profiles;
            if (res.data.activeProfileName) this.activeProfileName = res.data.activeProfileName;
          }
        }
      }
    } catch (err) {
      // Çevrimdışı modda fallback
    }
  }
}
