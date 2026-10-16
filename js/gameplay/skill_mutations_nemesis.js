/**
 * ============================================================================
 * ZORTEX: CYBER SURVIVOR - SKILL MUTATIONS, SHIP SIGNATURES & NEMESIS ENGINE
 * Module: js/gameplay/skill_mutations_nemesis.js
 * Architecture: Section 7 & 11.2 of AAA Design Document
 * 144Hz Zero-GC, Pure WebGL GPU Integration
 * ============================================================================
 */
(function() {
  'use strict';

  /* ==========================================================================
     1. GEMİ İMZA YETENEKLERİ (SHIP SIGNATURE ABILITIES - Bölüm 7.2)
     ========================================================================== */
  const ShipSignatureManager = {
    timeWarpTimer: 0,
    titanWallAngle: 0,
    spectreDrones: [],

    initSpectreDrones() {
      this.spectreDrones = [];
      for (let i = 0; i < 6; i++) {
        this.spectreDrones.push({
          angle: (i * Math.PI * 2) / 6,
          dist: 65,
          fireCooldown: 0.3 + i * 0.15
        });
      }
    },

    update(dt, player) {
      if (!player || player.dead) return;
      const shipId = player.shipClassId || 'interceptor';

      // A) INTERCEPTOR: Zaman Bükücü (Time Warp - 2 sn düşman hızını %50 düşürür)
      if (this.timeWarpTimer > 0) {
        this.timeWarpTimer -= dt;
        const enemiesList = window.enemies || [];
        for (let i = 0; i < enemiesList.length; i++) {
          const e = enemiesList[i];
          if (e && !e.dead) {
            e.x -= (e.vx || 0) * 0.5 * dt * 60;
            e.y -= (e.vy || 0) * 0.5 * dt * 60;
          }
        }
      }

      // B) TITAN: Kalkan Duvarı (Shield Wall - Mermi emen enerji duvarı)
      if (shipId === 'titan') {
        this.titanWallAngle = player.angle;
        const wallX = player.x + Math.cos(player.angle) * 55;
        const wallY = player.y + Math.sin(player.angle) * 55;
        const enemyBullets = window.enemyBullets || [];
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
          const b = enemyBullets[i];
          if (b && !b.dead) {
            const dist = Math.hypot(b.x - wallX, b.y - wallY);
            if (dist < 50) {
              b.dead = true;
              if (b.destroy) b.destroy();
              enemyBullets.splice(i, 1);
              if (window.particles) window.particles.emit(b.x, b.y, '#ffb300', 8, 4, 2, 0.4);
              if (window.audio && typeof window.audio.playShieldHit === 'function') window.audio.playShieldHit();
              // Titan kalkanını +2 yenile
              if (player.shield < player.maxShield) player.shield = Math.min(player.maxShield, player.shield + 2);
            }
          }
        }
      }

      // C) SPECTRE: Dron Ordusu (Drone Swarm - 6 hacker dron koruması ve atışı)
      if (shipId === 'spectre') {
        if (!this.spectreDrones || this.spectreDrones.length === 0) {
          this.initSpectreDrones();
        }
        for (let d = 0; d < this.spectreDrones.length; d++) {
          const drone = this.spectreDrones[d];
          drone.angle += dt * 2.8;
          drone.fireCooldown -= dt;
          if (drone.fireCooldown <= 0) {
            drone.fireCooldown = 0.85;
            const droneX = player.x + Math.cos(drone.angle) * drone.dist;
            const droneY = player.y + Math.sin(drone.angle) * drone.dist;
            const enemiesList = window.enemies || [];
            if (enemiesList.length > 0) {
              const target = enemiesList[Math.floor(Math.random() * enemiesList.length)];
              if (target && !target.dead && Math.hypot(target.x - droneX, target.y - droneY) < 380) {
                const aimAng = Math.atan2(target.y - droneY, target.x - droneX);
                if (typeof window.spawnPlayerBullet === 'function') {
                  window.spawnPlayerBullet(droneX, droneY, aimAng, 14);
                }
                if (window.particles) window.particles.emit(droneX, droneY, '#00f3ff', 3, 2, 1, 0.2);
              }
            }
          }
        }
      }
    },

    triggerInterceptorTimeWarp() {
      this.timeWarpTimer = 2.0;
      if (window.textManager && window.player) {
        window.textManager.add('⏳ ZAMAN BÜKÜCÜ: YAVAŞLATMA!', window.player.x, window.player.y - 45, '#00f3ff', 16, 1.2);
      }
      if (window.audio && typeof window.audio.playDash === 'function') window.audio.playDash();
    },

    drawPixi(g, player) {
      if (!g || !player || player.dead) return;
      const shipId = player.shipClassId || 'interceptor';

      // Titan Kalkan Duvarı GPU Çizimi
      if (shipId === 'titan') {
        const wallX = player.x + Math.cos(player.angle) * 55;
        const wallY = player.y + Math.sin(player.angle) * 55;
        g.lineStyle(4, 0xffb300, 0.88);
        g.arc(wallX, wallY, 36, player.angle - Math.PI / 3, player.angle + Math.PI / 3);
        g.lineStyle(1.5, 0xffffff, 0.9);
        g.arc(wallX, wallY, 32, player.angle - Math.PI / 3.5, player.angle + Math.PI / 3.5);
        g.lineStyle(0);
      }

      // Spectre 6 Hacker Dronu GPU Çizimi
      if (shipId === 'spectre' && this.spectreDrones) {
        for (let d = 0; d < this.spectreDrones.length; d++) {
          const drone = this.spectreDrones[d];
          const dx = player.x + Math.cos(drone.angle) * drone.dist;
          const dy = player.y + Math.sin(drone.angle) * drone.dist;
          g.beginFill(0x00f3ff, 0.9);
          g.drawCircle(dx, dy, 5.5);
          g.endFill();
          g.lineStyle(1.5, 0xffffff, 0.8);
          g.drawCircle(dx, dy, 8);
          g.lineStyle(0);
        }
      }

      // Interceptor Zaman Bükücü Siber Halkası
      if (this.timeWarpTimer > 0) {
        const radius = (2.0 - this.timeWarpTimer) * 220;
        g.lineStyle(2.5, 0x00f3ff, (this.timeWarpTimer / 2.0) * 0.75);
        g.drawCircle(player.x, player.y, radius);
        g.lineStyle(1.0, 0xffffff, (this.timeWarpTimer / 2.0) * 0.5);
        g.drawCircle(player.x, player.y, radius * 0.85);
        g.lineStyle(0);
      }
    }
  };

  /* ==========================================================================
     2. YETENEK MUTASYONLARI MOTORU (SKILL MUTATIONS - Bölüm 7.1)
     ========================================================================== */
  const MutationsManager = {
    activeMutations: {
      dash: null,        // 'ghost', 'shock', 'ram'
      decoy: null,       // 'explosive', 'triple', 'trap'
      anchor: null,      // 'singularity', 'rapid', 'stardust'
      overdrive: null    // 'bullet_storm', 'ironclad', 'chrono'
    },

    shockTrails: [],

    reset() {
      this.activeMutations = {
        dash: null,
        decoy: null,
        anchor: null,
        overdrive: null
      };
      this.shockTrails = [];
    },

    setMutation(skill, type) {
      if (this.activeMutations.hasOwnProperty(skill)) {
        this.activeMutations[skill] = type;
      }
    },

    onDash(player) {
      const mut = this.activeMutations.dash;
      // 1) Hayalet Dash: Dash boyunca tam hasar almazlık
      if (mut === 'ghost') {
        player.invulnerableTimer = 0.65;
        player.dashInvulnerableTimer = 0.65;
        if (window.textManager) {
          window.textManager.add('👻 HAYALET DASH!', player.x, player.y - 30, '#a855f7', 15, 0.8);
        }
      }
      // 2) Şok Dash: Arkada elektrikli şok izi bırakır
      else if (mut === 'shock') {
        this.shockTrails.push({
          x: player.x,
          y: player.y,
          duration: 2.5,
          radius: 38
        });
      }
      // 3) Çarpışma Dash: Düşmanları savurur ve sert hasar verir
      else if (mut === 'ram') {
        const enemiesList = window.enemies || [];
        for (let i = 0; i < enemiesList.length; i++) {
          const e = enemiesList[i];
          if (e && !e.dead && Math.hypot(e.x - player.x, e.y - player.y) < 85) {
            e.hp -= 85;
            const a = Math.atan2(e.y - player.y, e.x - player.x);
            e.x += Math.cos(a) * 140;
            e.y += Math.sin(a) * 140;
            if (window.particles) window.particles.emit(e.x, e.y, '#ffe600', 8, 4, 3, 0.3);
            if (e.hp <= 0 && typeof e.die === 'function') e.die();
          }
        }
        if (window.textManager) {
          window.textManager.add('💥 ÇARPIŞMA DASH!', player.x, player.y - 30, '#ffe600', 16, 0.8);
        }
      }

      // Interceptor imza zaman bükücü
      if (player.shipClassId === 'interceptor') {
        ShipSignatureManager.triggerInterceptorTimeWarp();
      }
    },

    onDecoyDeploy(player) {
      const mut = this.activeMutations.decoy;
      // Çoklu Yem Mutasyonu: Ek 2 mini yem daha bırakır
      if (mut === 'triple') {
        if (typeof window.HoloDecoy !== 'undefined') {
          const d1 = new window.HoloDecoy(player.x + 60, player.y - 30);
          const d2 = new window.HoloDecoy(player.x - 60, player.y + 30);
          d1.life = 3.5;
          d2.life = 3.5;
          if (window.activeDecoys) {
            window.activeDecoys.push(d1, d2);
          }
        }
      }
    },

    onDecoyExpire(decoy) {
      const mut = this.activeMutations.decoy;
      if (mut === 'explosive') {
        if (typeof window.ZortexFX !== 'undefined' && window.ZortexFX.triggerExplosion) {
          window.ZortexFX.triggerExplosion(decoy.x, decoy.y, '#00f3ff', 3);
        }
        const enemiesList = window.enemies || [];
        for (let i = 0; i < enemiesList.length; i++) {
          const e = enemiesList[i];
          if (e && !e.dead && Math.hypot(e.x - decoy.x, e.y - decoy.y) < 200) {
            e.hp -= 150;
            if (e.hp <= 0 && typeof e.die === 'function') e.die();
          }
        }
      }
    },

    onAnchorExpire(anchor) {
      const mut = this.activeMutations.anchor;
      if (mut === 'singularity') {
        // Kara delik çöküşü
        if (typeof window.ZortexFX !== 'undefined' && window.ZortexFX.triggerExplosion) {
          window.ZortexFX.triggerExplosion(anchor.x, anchor.y, '#a855f7', 3);
        }
        const enemiesList = window.enemies || [];
        for (let i = 0; i < enemiesList.length; i++) {
          const e = enemiesList[i];
          if (e && !e.dead && Math.hypot(e.x - anchor.x, e.y - anchor.y) < 240) {
            e.hp -= 160;
            if (e.hp <= 0 && typeof e.die === 'function') e.die();
          }
        }
      } else if (mut === 'stardust') {
        // Yıldız Tozu: Çapaya çekilen alana zengin XP kristalleri saçar
        if (typeof window.spawnXpGem === 'function') {
          for (let i = 0; i < 5; i++) {
            const rx = anchor.x + (Math.random() - 0.5) * 60;
            const ry = anchor.y + (Math.random() - 0.5) * 60;
            window.spawnXpGem(rx, ry, 12);
          }
        }
        if (window.textManager) {
          window.textManager.add('✨ YILDIZ TOZU XP ÇAĞLAYANI!', anchor.x, anchor.y - 30, '#ffe600', 16, 1.2);
        }
      }
    },

    update(dt) {
      // Şok izlerini güncelle
      for (let i = this.shockTrails.length - 1; i >= 0; i--) {
        const trail = this.shockTrails[i];
        trail.duration -= dt;
        if (trail.duration <= 0) {
          this.shockTrails.splice(i, 1);
          continue;
        }
        // Düşmanlara temas hasarı
        const enemiesList = window.enemies || [];
        for (let j = 0; j < enemiesList.length; j++) {
          const e = enemiesList[j];
          if (e && !e.dead && Math.hypot(e.x - trail.x, e.y - trail.y) < trail.radius) {
            e.hp -= 45 * dt;
            if (e.hp <= 0 && typeof e.die === 'function') e.die();
          }
        }
      }

      // Tuzak Yem (Yavaşlatma aurası)
      if (this.activeMutations.decoy === 'trap' && window.activeDecoy && !window.activeDecoy.dead) {
        const enemiesList = window.enemies || [];
        for (let i = 0; i < enemiesList.length; i++) {
          const e = enemiesList[i];
          if (e && !e.dead && Math.hypot(e.x - window.activeDecoy.x, e.y - window.activeDecoy.y) < 200) {
            e.x -= (e.vx || 0) * 0.45 * dt * 60;
            e.y -= (e.vy || 0) * 0.45 * dt * 60;
          }
        }
      }
    },

    drawPixi(g) {
      if (!g) return;
      for (let i = 0; i < this.shockTrails.length; i++) {
        const t = this.shockTrails[i];
        g.beginFill(0x00f3ff, (t.duration / 2.5) * 0.4);
        g.drawCircle(t.x, t.y, t.radius);
        g.endFill();
        g.lineStyle(1.5, 0xffffff, (t.duration / 2.5) * 0.8);
        g.drawCircle(t.x, t.y, t.radius * 0.6);
        g.lineStyle(0);
      }
    }
  };

  /* ==========================================================================
     3. ULTI SEÇİMİ VE İCRA MOTORU (ULTIMATE SELECTION & EXECUTION - Bölüm 7.3)
     ========================================================================== */
  const UltimateChoiceManager = {
    ultimates: [
      {
        id: 'orbital_barrage',
        name: '🛰️ ORBİTAL BARAJI',
        desc: 'Ekranın dört yanından sırayla gelen yıkıcı hiper-ışınlar tüm haritadaki düşmanları süpürür.',
        icon: '🛰️',
        color: '#00f3ff'
      },
      {
        id: 'black_hole_tempest',
        name: '🌀 KARA DELİK FIRTINASI',
        desc: 'Haritada 3 devasa yerçekimi tekilliği açarak düşmanları merkezine çeker ve ezer.',
        icon: '🌀',
        color: '#a855f7'
      },
      {
        id: 'time_stop',
        name: '⏳ ZAMAN DURDURMA',
        desc: '3 saniye boyunca tüm evren donar; serbestçe hareket edip biriken hasarı tek anda salarsınız.',
        icon: '⏳',
        color: '#ffe600'
      }
    ],

    timeStopTimer: 0,
    timeStopAccumDamage: 0,
    orbitalBeams: [],
    blackHoles: [],

    showChoiceModal(player) {
      if (document.getElementById('ultimateChoiceModal')) {
        document.getElementById('ultimateChoiceModal').remove();
      }
      window.gameState = 'UPGRADE';
      if (window.GamepadUI) window.GamepadUI.focusIndex = 0;

      const overlay = document.createElement('div');
      overlay.id = 'ultimateChoiceModal';
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.background = 'rgba(5, 7, 15, 0.94)';
      overlay.style.backdropFilter = 'blur(10px)';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.zIndex = '99999';
      overlay.style.fontFamily = "'Rajdhani', 'Segoe UI', sans-serif";

      overlay.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="font-size: 14px; letter-spacing: 4px; color: #00f3ff; font-weight: 700; text-transform: uppercase;">SEVİYE 10 KİLİT AÇILDI • NİHAİ PROTOKOL</div>
          <h2 style="font-size: 34px; margin: 6px 0; color: #fff; text-shadow: 0 0 25px rgba(0, 243, 255, 0.6); font-weight: 800;">NİHAİ ULTİ YETENEĞİNİ SEÇ</h2>
          <p style="color: #94a3b8; font-size: 15px; margin: 0;">Bu seçim koşu boyunca Overdrive gücünüzü şekillendirir (Bölüm 7.3).</p>
        </div>
        <div style="display: flex; gap: 20px; max-width: 960px; width: 90%; justify-content: center;">
          ${this.ultimates.map(u => `
            <div class="ulti-card" data-id="${u.id}" style="flex: 1; max-width: 280px; background: rgba(15, 23, 42, 0.85); border: 2px solid ${u.color}; border-radius: 12px; padding: 25px 20px; cursor: pointer; text-align: center; transition: all 0.25s ease; box-shadow: 0 0 20px rgba(0,0,0,0.5);">
              <div style="font-size: 48px; margin-bottom: 12px;">${u.icon}</div>
              <div style="font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 8px;">${u.name}</div>
              <div style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">${u.desc}</div>
              <div style="margin-top: 18px; padding: 8px 14px; background: ${u.color}; color: #05070f; font-weight: 800; border-radius: 6px; font-size: 13px; letter-spacing: 1px;">SEÇ VE DEVREYE AL</div>
            </div>
          `).join('')}
        </div>
      `;

      document.body.appendChild(overlay);

      const cards = overlay.querySelectorAll('.ulti-card');
      cards.forEach(c => {
        c.onmouseenter = () => {
          c.style.transform = 'translateY(-8px) scale(1.02)';
          if (window.audio && typeof window.audio.playCardHover === 'function') window.audio.playCardHover();
        };
        c.onmouseleave = () => {
          c.style.transform = 'translateY(0) scale(1)';
        };
        c.onclick = () => {
          const ultiId = c.getAttribute('data-id');
          this.selectUltimate(player, ultiId);
          overlay.remove();
        };
      });
    },

    selectUltimate(player, ultiId) {
      if (!player) return;
      player.chosenUltimate = ultiId;
      const found = this.ultimates.find(u => u.id === ultiId);
      if (window.textManager) {
        window.textManager.add('⚡ ULTİ SEÇİLDİ: ' + (found ? found.name : ultiId) + '!', player.x, player.y - 45, '#ffe600', 22, 2.5);
      }
      if (window.audio && typeof window.audio.playFanfare === 'function') window.audio.playFanfare();
      window.gameState = 'PLAYING';
    },

    castUltimate(player) {
      const ult = (player && player.chosenUltimate) || 'orbital_barrage';
      if (ult === 'orbital_barrage') {
        this.triggerOrbitalBarrage();
      } else if (ult === 'black_hole_tempest') {
        this.triggerBlackHoleTempest(player);
      } else if (ult === 'time_stop') {
        this.triggerTimeStop(player);
      }
    },

    triggerOrbitalBarrage() {
      if (window.textManager && window.player) {
        window.textManager.add('🛰️ ORBİTAL BARAJI DEVREDE! 🛰️', window.player.x, window.player.y - 50, '#00f3ff', 24, 2.0);
      }
      if (window.audio && typeof window.audio.playExplosion === 'function') {
        window.audio.playExplosion(2.5);
      }
      window.screenShake = Math.max(window.screenShake || 0, 20);

      // Haritadaki düşmanları süpür
      const enemiesList = window.enemies || [];
      for (let i = enemiesList.length - 1; i >= 0; i--) {
        const e = enemiesList[i];
        if (e && !e.dead) {
          e.hp -= 350;
          if (window.particles) window.particles.emit(e.x, e.y, '#00f3ff', 12, 6, 4, 0.6);
          if (e.hp <= 0 && typeof e.die === 'function') e.die();
        }
      }
      if (typeof window.addShockwave === 'function' && window.player) {
        window.addShockwave(window.player.x, window.player.y, 0x00f3ff, 450, 0.6, 6.0);
      }
    },

    triggerBlackHoleTempest(player) {
      if (window.textManager && player) {
        window.textManager.add('🌀 KARA DELİK FIRTINASI! 🌀', player.x, player.y - 50, '#a855f7', 24, 2.0);
      }
      if (window.audio && typeof window.audio.playExplosion === 'function') {
        window.audio.playExplosion(2.2);
      }
      window.screenShake = Math.max(window.screenShake || 0, 18);

      // 3 nokta etrafında düşmanları çek ve ez
      const offsets = [
        { x: -200, y: -100 },
        { x: 200, y: -100 },
        { x: 0, y: 220 }
      ];
      offsets.forEach(off => {
        const hx = player.x + off.x;
        const hy = player.y + off.y;
        if (typeof window.addShockwave === 'function') {
          window.addShockwave(hx, hy, 0xa855f7, 280, 0.7, 5.0);
        }
        const enemiesList = window.enemies || [];
        for (let i = enemiesList.length - 1; i >= 0; i--) {
          const e = enemiesList[i];
          if (e && !e.dead && Math.hypot(e.x - hx, e.y - hy) < 260) {
            e.hp -= 280;
            if (e.hp <= 0 && typeof e.die === 'function') e.die();
          }
        }
      });
    },

    triggerTimeStop(player) {
      this.timeStopTimer = 3.0;
      if (window.textManager && player) {
        window.textManager.add('⏳ EVREN DONDU: ZAMAN DURDURMA! ⏳', player.x, player.y - 50, '#ffe600', 24, 2.2);
      }
      if (window.audio && typeof window.audio.playTimeWarp === 'function') {
        window.audio.playTimeWarp();
      }
      window.screenShake = Math.max(window.screenShake || 0, 15);
    },

    update(dt) {
      if (this.timeStopTimer > 0) {
        this.timeStopTimer -= dt;
        // Düşmanları ve mermileri tamamen dondur
        const enemiesList = window.enemies || [];
        for (let i = 0; i < enemiesList.length; i++) {
          const e = enemiesList[i];
          if (e && !e.dead) {
            e.x -= (e.vx || 0) * dt * 60;
            e.y -= (e.vy || 0) * dt * 60;
          }
        }
        if (this.timeStopTimer <= 0) {
          if (window.textManager && window.player) {
            window.textManager.add('💥 ZAMAN ÇÖZÜLDÜ: KİNETİK PATLAMA!', window.player.x, window.player.y - 50, '#ffe600', 24, 2.0);
          }
          if (window.audio && typeof window.audio.playExplosion === 'function') {
            window.audio.playExplosion(2.0);
          }
          if (typeof window.addShockwave === 'function' && window.player) {
            window.addShockwave(window.player.x, window.player.y, 0xffe600, 380, 0.5, 5.0);
          }
        }
      }
    }
  };

  /* ==========================================================================
     4. İSİMLİ İNTİKAM DÜŞMANI MOTORU (NEMESIS REVENGE BOSS - Bölüm 11.2)
     ========================================================================== */
  const NemesisSystem = {
    nemesisSpawnedThisRun: false,

    recordKiller(killerName = 'GÖLGE İNFAZCI') {
      const nemesisData = {
        name: killerName.toUpperCase(),
        title: '☠️ İNTİKAM ELİTİ: ' + killerName.toUpperCase(),
        pending: true,
        bounty: 350
      };
      try {
        localStorage.setItem('zortex_nemesis', JSON.stringify(nemesisData));
      } catch (e) {}
    },

    getPendingNemesis() {
      try {
        const raw = localStorage.getItem('zortex_nemesis');
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return null;
    },

    clearNemesis() {
      try {
        localStorage.removeItem('zortex_nemesis');
      } catch (e) {}
    },

    checkSpawnNemesis(wave) {
      if (this.nemesisSpawnedThisRun || wave < 3) return null;
      const data = this.getPendingNemesis();
      if (!data || !data.pending) return null;

      this.nemesisSpawnedThisRun = true;
      const p = window.player;
      const x = p ? p.x + (Math.random() > 0.5 ? 500 : -500) : 600;
      const y = p ? p.y + (Math.random() > 0.5 ? 400 : -400) : 400;

      // Özel Nemesis Eliti oluştur (Tam Donanımlı Siber Savaş Gemisi)
      const BaseEnemy = window.Enemy || window.EnemyBase;
      let nemesis = null;

      if (BaseEnemy) {
        class NemesisEnemy extends BaseEnemy {
          constructor(nx, ny, nData, nWave) {
            super(nx, ny, 'nemesis');
            this.radius = 28;
            this.isElite = true;
            this.isNemesis = true;
            this.name = nData.title || nData.name || 'İNTİKAM AVCISI';
            this.maxHp = 320 + nWave * 45;
            this.hp = this.maxHp;
            this.speed = 2.2;
            this.color = '#dc2626';
            this.bounty = nData.bounty || 350;
            this.damage = 35;
            this.mass = 3.5;
            this.angle = 0;
          }

          behavior(dt) {
            const pl = window.player;
            if (!pl || pl.hp <= 0) return;
            const dtNorm = dt * 60;
            const dx = pl.x - this.x;
            const dy = pl.y - this.y;
            const dist = Math.hypot(dx, dy) || 1;
            const targetAngle = Math.atan2(dy, dx);

            // Yumuşak oyuncuya kilitlenme dönüşü
            let diff = (targetAngle - this.angle) % (Math.PI * 2);
            if (diff > Math.PI) diff -= Math.PI * 2;
            if (diff < -Math.PI) diff += Math.PI * 2;
            this.angle += diff * Math.min(1.0, dt * 6.0);

            // Taktiksel saldırı takibi (Yaklaştıkça koçbaşı hızı)
            const chaseSpeed = (dist < 220) ? (this.speed * 1.35) : this.speed;
            this.x += Math.cos(this.angle) * chaseSpeed * dtNorm;
            this.y += Math.sin(this.angle) * chaseSpeed * dtNorm;

            // Plazma itici partikülleri
            if (Math.random() < 0.35 && typeof particles !== 'undefined') {
              const rx = this.x - Math.cos(this.angle) * 24;
              const ry = this.y - Math.sin(this.angle) * 24;
              particles.emit(rx, ry, '#dc2626', 2, 2.5, 2.0, 0.2);
            }
          }

          die() {
            if (this.dead) return;
            if (window.NemesisSystem && typeof window.NemesisSystem.onNemesisKilled === 'function') {
              window.NemesisSystem.onNemesisKilled(this);
            }
            super.die();
          }

          drawPixi(g) {
            if (!g || this.dead) return;
            const t = performance.now() * 0.001;
            const a = this.angle || 0;
            const cosA = Math.cos(a), sinA = Math.sin(a);

            // 1. İkiz Plazma Alev İticileri (Twin Afterburners)
            const flameLen = 14 + 6 * Math.sin(t * 22);
            const t1X = this.x - cosA * 22 - sinA * 10;
            const t1Y = this.y - sinA * 22 + cosA * 10;
            const t2X = this.x - cosA * 22 + sinA * 10;
            const t2Y = this.y - sinA * 22 - cosA * 10;

            g.lineStyle(2.4, 0xdc2626, 0.85);
            g.moveTo(t1X, t1Y); g.lineTo(t1X - cosA * flameLen, t1Y - sinA * flameLen);
            g.moveTo(t2X, t2Y); g.lineTo(t2X - cosA * flameLen, t2Y - sinA * flameLen);

            g.lineStyle(1.4, 0xffea00, 0.95);
            g.moveTo(t1X, t1Y); g.lineTo(t1X - cosA * (flameLen * 0.6), t1Y - sinA * (flameLen * 0.6));
            g.moveTo(t2X, t2Y); g.lineTo(t2X - cosA * (flameLen * 0.6), t2Y - sinA * (flameLen * 0.6));
            g.lineStyle(0);

            // Sprite yoksa prosedürel gemi çizim garantisi (Full Cyber Corvette Fallback)
            if (!this.sprite) {
              const r = this.radius;
              g.beginFill(0x1a0505, 0.95);
              g.lineStyle(2.6, 0xdc2626, 1.0);
              const pTip = [this.x + cosA * (r * 1.3), this.y + sinA * (r * 1.3)];
              const pL = [this.x + Math.cos(a + 2.3) * (r * 1.15), this.y + Math.sin(a + 2.3) * (r * 1.15)];
              const pR = [this.x + Math.cos(a - 2.3) * (r * 1.15), this.y + Math.sin(a - 2.3) * (r * 1.15)];
              const pBack = [this.x - cosA * (r * 0.7), this.y - sinA * (r * 0.7)];
              g.moveTo(pTip[0], pTip[1]);
              g.lineTo(pL[0], pL[1]);
              g.lineTo(pBack[0], pBack[1]);
              g.lineTo(pR[0], pR[1]);
              g.closePath();
              g.endFill();

              // Zırh pahı ve akkor çekirdek
              g.lineStyle(2.0, 0xff0055, 0.95);
              g.moveTo(this.x + cosA * (r * 0.7), this.y + sinA * (r * 0.7));
              g.lineTo(this.x - cosA * (r * 0.4), this.y - sinA * (r * 0.4));
              g.lineStyle(0);
              g.beginFill(0xffe600, 0.95);
              g.drawCircle(this.x, this.y, 5);
              g.endFill();
            }
          }
        }
        nemesis = new NemesisEnemy(x, y, data, wave);
      } else {
        nemesis = {
          x,
          y,
          radius: 28,
          type: 'nemesis',
          isElite: true,
          name: data.title,
          maxHp: 320 + wave * 45,
          hp: 320 + wave * 45,
          speed: 2.2,
          color: '#dc2626',
          bounty: data.bounty || 350,
          dead: false,
          angle: 0,
          hit: function(dmg) {
            this.hp -= dmg;
            if (this.hp <= 0) { this.die(); return true; }
            return false;
          },
          update: function(dt) {
            if (this.dead) return;
            const pl = window.player;
            if (pl) {
              const a = Math.atan2(pl.y - this.y, pl.x - this.x);
              this.angle = a;
              this.x += Math.cos(a) * this.speed * dt * 60;
              this.y += Math.sin(a) * this.speed * dt * 60;
            }
          },
          die: () => {
            this.onNemesisKilled(nemesis);
          },
          drawPixi: function(g) {
            if (!g || this.dead) return;
            const t = performance.now() * 0.001;
            const a = this.angle || 0;
            const cosA = Math.cos(a), sinA = Math.sin(a);
            const r = this.radius;

            // İkiz İtici Alevleri
            const flameLen = 14 + 6 * Math.sin(t * 22);
            g.lineStyle(2.2, 0xdc2626, 0.9);
            g.moveTo(this.x - cosA * 20 - sinA * 8, this.y - sinA * 20 + cosA * 8);
            g.lineTo(this.x - cosA * (20 + flameLen) - sinA * 8, this.y - sinA * (20 + flameLen) + cosA * 8);
            g.moveTo(this.x - cosA * 20 + sinA * 8, this.y - sinA * 20 - cosA * 8);
            g.lineTo(this.x - cosA * (20 + flameLen) + sinA * 8, this.y - sinA * (20 + flameLen) - cosA * 8);

            // Açılı Siber Savaş Gemisi Şasisi
            g.beginFill(0x1a0505, 0.95);
            g.lineStyle(2.6, 0xdc2626, 1.0);
            const pTip = [this.x + cosA * (r * 1.3), this.y + sinA * (r * 1.3)];
            const pL = [this.x + Math.cos(a + 2.3) * (r * 1.15), this.y + Math.sin(a + 2.3) * (r * 1.15)];
            const pR = [this.x + Math.cos(a - 2.3) * (r * 1.15), this.y + Math.sin(a - 2.3) * (r * 1.15)];
            const pBack = [this.x - cosA * (r * 0.7), this.y - sinA * (r * 0.7)];
            g.moveTo(pTip[0], pTip[1]);
            g.lineTo(pL[0], pL[1]);
            g.lineTo(pBack[0], pBack[1]);
            g.lineTo(pR[0], pR[1]);
            g.closePath();
            g.endFill();
            g.stroke({ width: 2.2, color: 0xffe600, alpha: 0.95 });

            // Akkor Çekirdek
            g.lineStyle(0);
            g.beginFill(0xffe600, 0.95);
            g.drawCircle(this.x, this.y, 5);
            g.endFill();
          }
        };
      }

      if (window.enemies) window.enemies.push(nemesis);
      if (window.textManager) {
        window.textManager.add('⚠️ İNTİKAM DÜŞMANI YAKLAŞIYOR: ' + data.name + '!', x, y - 40, '#dc2626', 22, 3.5);
      }
      if (window.audio && typeof window.audio.playWarning === 'function') window.audio.playWarning();

      return nemesis;
    },

    onNemesisKilled(nemesis) {
      if (nemesis.dead) return;
      nemesis.dead = true;
      this.clearNemesis();
      const bounty = (nemesis && typeof nemesis.bounty === 'number') ? nemesis.bounty : 350;

      if (typeof window.runScrap !== 'undefined') {
        window.runScrap += bounty;
      } else if (typeof window.scrap !== 'undefined') {
        window.scrap += bounty;
      }

      if (window.runStats) {
        window.runStats.nemesisKilledThisRun = true;
      }
      if (typeof window.checkAchievements === 'function') {
        window.checkAchievements();
      }

      if (window.textManager) {
        window.textManager.add('⭐ İNTİKAM ALINDI! +' + bounty + ' HURDA ⭐', nemesis.x, nemesis.y - 40, '#ffe600', 22, 3.0);
      }
      if (window.audio && typeof window.audio.playFanfare === 'function') {
        window.audio.playFanfare();
      }
      if (window.ZortexFX && typeof window.ZortexFX.triggerExplosion === 'function') {
        window.ZortexFX.triggerExplosion(nemesis.x, nemesis.y, '#dc2626', 3);
      }
    }
  };

  // ==========================================================================
  // 5. YETENEK MUTASYONLARI KART KAYDI (MUTATION UPGRADES - Bölüm 7.1)
  // ==========================================================================
  function registerMutationUpgrades() {
    const pool = (typeof window.UPGRADES_POOL !== 'undefined') ? window.UPGRADES_POOL : (typeof UPGRADES_POOL !== 'undefined' ? UPGRADES_POOL : null);
    if (!pool || !Array.isArray(pool)) return;

    const mutationCards = [
      // 1) DASH MUTASYONLARI
      {
        id: 'mutation_dash_ghost',
        name: 'Hayalet Dash',
        desc: 'YETENEK MUTASYONU: Dash boyunca mutlak hasar almazlık kazandırır.',
        icon: '👻',
        rarity: 'epic',
        isMutation: true,
        condition: () => Boolean(window.player && (!window.player.mutatedSkills || !window.player.mutatedSkills.dash)),
        apply: () => {
          MutationsManager.setMutation('dash', 'ghost');
          if (window.player) {
            window.player.mutatedSkills = window.player.mutatedSkills || {};
            window.player.mutatedSkills.dash = 'ghost';
          }
          if (window.textManager) window.textManager.add('🧬 MUTASYON: Hayalet Dash!', window.player.x, window.player.y - 40, '#a855f7', 18, 1.5);
        }
      },
      {
        id: 'mutation_dash_shock',
        name: 'Şok Dash',
        desc: 'YETENEK MUTASYONU: Arkada 2.5 sn boyunca düşmanları çarpan elektrikli iz bırakır.',
        icon: '⚡',
        rarity: 'epic',
        isMutation: true,
        condition: () => Boolean(window.player && (!window.player.mutatedSkills || !window.player.mutatedSkills.dash)),
        apply: () => {
          MutationsManager.setMutation('dash', 'shock');
          if (window.player) {
            window.player.mutatedSkills = window.player.mutatedSkills || {};
            window.player.mutatedSkills.dash = 'shock';
          }
          if (window.textManager) window.textManager.add('🧬 MUTASYON: Şok Dash!', window.player.x, window.player.y - 40, '#00f3ff', 18, 1.5);
        }
      },
      {
        id: 'mutation_dash_ram',
        name: 'Çarpışma Dash',
        desc: 'YETENEK MUTASYONU: Dash temas ettiği düşmanları şiddetle savurur ve ağır hasar verir.',
        icon: '💥',
        rarity: 'epic',
        isMutation: true,
        condition: () => Boolean(window.player && (!window.player.mutatedSkills || !window.player.mutatedSkills.dash)),
        apply: () => {
          MutationsManager.setMutation('dash', 'ram');
          if (window.player) {
            window.player.mutatedSkills = window.player.mutatedSkills || {};
            window.player.mutatedSkills.dash = 'ram';
          }
          if (window.textManager) window.textManager.add('🧬 MUTASYON: Çarpışma Dash!', window.player.x, window.player.y - 40, '#ffe600', 18, 1.5);
        }
      },

      // 2) HOLO-DECOY MUTASYONLARI
      {
        id: 'mutation_decoy_explosive',
        name: 'Yıkıcı Yem',
        desc: 'YETENEK MUTASYONU: Holo-yem süresi dolunca termal patlamayla infilak eder.',
        icon: '💣',
        rarity: 'epic',
        isMutation: true,
        condition: () => Boolean(window.player && (!window.player.mutatedSkills || !window.player.mutatedSkills.decoy)),
        apply: () => {
          MutationsManager.setMutation('decoy', 'explosive');
          if (window.player) {
            window.player.mutatedSkills = window.player.mutatedSkills || {};
            window.player.mutatedSkills.decoy = 'explosive';
          }
          if (window.textManager) window.textManager.add('🧬 MUTASYON: Yıkıcı Yem!', window.player.x, window.player.y - 40, '#ff0055', 18, 1.5);
        }
      },
      {
        id: 'mutation_decoy_triple',
        name: 'Çoklu Yem',
        desc: 'YETENEK MUTASYONU: Tek seferde 3 adet holo-yem konuşlandırır.',
        icon: '👥',
        rarity: 'epic',
        isMutation: true,
        condition: () => Boolean(window.player && (!window.player.mutatedSkills || !window.player.mutatedSkills.decoy)),
        apply: () => {
          MutationsManager.setMutation('decoy', 'triple');
          if (window.player) {
            window.player.mutatedSkills = window.player.mutatedSkills || {};
            window.player.mutatedSkills.decoy = 'triple';
          }
          if (window.textManager) window.textManager.add('🧬 MUTASYON: Çoklu Yem!', window.player.x, window.player.y - 40, '#00f3ff', 18, 1.5);
        }
      },
      {
        id: 'mutation_decoy_trap',
        name: 'Tuzak Yem',
        desc: 'YETENEK MUTASYONU: Yem çevresindeki tüm düşmanları %45 yavaşlatır.',
        icon: '🕸️',
        rarity: 'epic',
        isMutation: true,
        condition: () => Boolean(window.player && (!window.player.mutatedSkills || !window.player.mutatedSkills.decoy)),
        apply: () => {
          MutationsManager.setMutation('decoy', 'trap');
          if (window.player) {
            window.player.mutatedSkills = window.player.mutatedSkills || {};
            window.player.mutatedSkills.decoy = 'trap';
          }
          if (window.textManager) window.textManager.add('🧬 MUTASYON: Tuzak Yem!', window.player.x, window.player.y - 40, '#38bdf8', 18, 1.5);
        }
      },

      // 3) MANYETİK ÇAPA MUTASYONLARI
      {
        id: 'mutation_anchor_singularity',
        name: 'Kara Delik Çapa',
        desc: 'YETENEK MUTASYONU: Çapa süresi bitince ekranı içine çeken tekillik açılır.',
        icon: '🌀',
        rarity: 'epic',
        isMutation: true,
        condition: () => Boolean(window.player && (!window.player.mutatedSkills || !window.player.mutatedSkills.anchor)),
        apply: () => {
          MutationsManager.setMutation('anchor', 'singularity');
          if (window.player) {
            window.player.mutatedSkills = window.player.mutatedSkills || {};
            window.player.mutatedSkills.anchor = 'singularity';
          }
          if (window.textManager) window.textManager.add('🧬 MUTASYON: Kara Delik Çapa!', window.player.x, window.player.y - 40, '#a855f7', 18, 1.5);
        }
      },
      {
        id: 'mutation_anchor_rapid',
        name: 'Hızlı Çapa',
        desc: 'YETENEK MUTASYONU: Manyetik çapanın bekleme süresini %50 kısaltır.',
        icon: '⚡',
        rarity: 'epic',
        isMutation: true,
        condition: () => Boolean(window.player && (!window.player.mutatedSkills || !window.player.mutatedSkills.anchor)),
        apply: () => {
          MutationsManager.setMutation('anchor', 'rapid');
          if (window.player) {
            window.player.mutatedSkills = window.player.mutatedSkills || {};
            window.player.mutatedSkills.anchor = 'rapid';
          }
          if (window.textManager) window.textManager.add('🧬 MUTASYON: Hızlı Çapa!', window.player.x, window.player.y - 40, '#00f3ff', 18, 1.5);
        }
      },
      {
        id: 'mutation_anchor_stardust',
        name: 'Yıldız Tozu',
        desc: 'YETENEK MUTASYONU: Çapa süresi dolunca alana zengin XP kristalleri saçar.',
        icon: '✨',
        rarity: 'epic',
        isMutation: true,
        condition: () => Boolean(window.player && (!window.player.mutatedSkills || !window.player.mutatedSkills.anchor)),
        apply: () => {
          MutationsManager.setMutation('anchor', 'stardust');
          if (window.player) {
            window.player.mutatedSkills = window.player.mutatedSkills || {};
            window.player.mutatedSkills.anchor = 'stardust';
          }
          if (window.textManager) window.textManager.add('🧬 MUTASYON: Yıldız Tozu!', window.player.x, window.player.y - 40, '#ffe600', 18, 1.5);
        }
      },

      // 4) OVERDRIVE MUTASYONLARI
      {
        id: 'mutation_overdrive_bullet_storm',
        name: 'Ateş Seli',
        desc: 'YETENEK MUTASYONU: Overdrive süresince silahların ateşleme hızını 2 katına çıkarır.',
        icon: '🔥',
        rarity: 'epic',
        isMutation: true,
        condition: () => Boolean(window.player && (!window.player.mutatedSkills || !window.player.mutatedSkills.overdrive)),
        apply: () => {
          MutationsManager.setMutation('overdrive', 'bullet_storm');
          if (window.player) {
            window.player.mutatedSkills = window.player.mutatedSkills || {};
            window.player.mutatedSkills.overdrive = 'bullet_storm';
          }
          if (window.textManager) window.textManager.add('🧬 MUTASYON: Ateş Seli!', window.player.x, window.player.y - 40, '#ff7700', 18, 1.5);
        }
      },
      {
        id: 'mutation_overdrive_ironclad',
        name: 'Zırh Modu',
        desc: 'YETENEK MUTASYONU: Overdrive süresince alınan tüm hasar %50 azalır.',
        icon: '🛡️',
        rarity: 'epic',
        isMutation: true,
        condition: () => Boolean(window.player && (!window.player.mutatedSkills || !window.player.mutatedSkills.overdrive)),
        apply: () => {
          MutationsManager.setMutation('overdrive', 'ironclad');
          if (window.player) {
            window.player.mutatedSkills = window.player.mutatedSkills || {};
            window.player.mutatedSkills.overdrive = 'ironclad';
          }
          if (window.textManager) window.textManager.add('🧬 MUTASYON: Zırh Modu!', window.player.x, window.player.y - 40, '#00ffcc', 18, 1.5);
        }
      },
      {
        id: 'mutation_overdrive_chrono',
        name: 'Zaman Dondurucu',
        desc: 'YETENEK MUTASYONU: Overdrive süresince tüm yeteneklerin bekleme sayaçları donar.',
        icon: '⏳',
        rarity: 'epic',
        isMutation: true,
        condition: () => Boolean(window.player && (!window.player.mutatedSkills || !window.player.mutatedSkills.overdrive)),
        apply: () => {
          MutationsManager.setMutation('overdrive', 'chrono');
          if (window.player) {
            window.player.mutatedSkills = window.player.mutatedSkills || {};
            window.player.mutatedSkills.overdrive = 'chrono';
          }
          if (window.textManager) window.textManager.add('🧬 MUTASYON: Zaman Dondurucu!', window.player.x, window.player.y - 40, '#c084fc', 18, 1.5);
        }
      }
    ];

    for (const card of mutationCards) {
      const idx = pool.findIndex(u => u.id === card.id);
      if (idx === -1) {
        pool.push(card);
      } else {
        pool[idx].desc = card.desc;
        pool[idx].name = card.name;
        pool[idx].icon = card.icon;
        pool[idx].condition = card.condition;
        pool[idx].apply = card.apply;
        pool[idx].isMutation = true;
      }
    }
  }

  MutationsManager.registerMutationUpgrades = registerMutationUpgrades;

  // Global erişim
  window.ShipSignatureManager = ShipSignatureManager;
  window.MutationsManager = MutationsManager;
  window.UltimateChoiceManager = UltimateChoiceManager;
  window.NemesisSystem = NemesisSystem;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerMutationUpgrades);
  } else {
    registerMutationUpgrades();
  }
})();
