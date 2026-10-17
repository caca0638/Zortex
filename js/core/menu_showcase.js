/**
 * ============================================================================
 * ZORTEX: CYBER SURVIVOR - MAIN MENU INTERACTIVE SHOWCASE (FAZ 2.5)
 * Module: js/core/menu_showcase.js
 * Architecture:
 *   - Holographic live player ship presentation (idle float & thruster jets)
 *   - Drifting cyber-asteroids with procedural polygonal geometry & glowing veins
 *   - Interactive shatter & click explosion mechanics with audio & scrap collection
 *   - High-DPI hardware accelerated 2D Canvas with zero overhead outside menu
 * ============================================================================
 */
(function() {
  'use strict';

  class MenuShowcaseEngine {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.container = null;
      this.width = 0;
      this.height = 0;
      this.dpr = 1;

      this.shipClassId = 'interceptor';
      this.time = 0;

      this.mouse = { x: -1000, y: -1000, isHovering: false };
      this.lockedAsteroid = null;

      // Entities
      this.asteroids = [];
      this.particles = [];
      this.shockwaves = [];
      this.floatingTexts = [];
      this.starDust = [];
      this.thrusterParticles = [];

      this.isInitialized = false;
    }

    init() {
      this.canvas = document.getElementById('menuShowcaseCanvas');
      this.container = document.getElementById('menuShowcaseContainer');
      if (!this.canvas || !this.container) return;

      this.ctx = this.canvas.getContext('2d', { alpha: true });
      this.dpr = Math.min(2, window.devicePixelRatio || 1);

      this.handleResize();
      window.addEventListener('resize', () => this.handleResize());

      // Pointer interactions
      this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
      this.canvas.addEventListener('pointerleave', () => this.onPointerLeave());
      this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));

      // Star dust initialization
      this.initStarDust();

      // Asteroid population
      this.initAsteroids();

      this.isInitialized = true;
    }

    handleResize() {
      if (!this.container || !this.canvas || !this.ctx) return;
      const rect = this.container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const wasZero = (this.width <= 0 || this.height <= 0);
      this.width = rect.width;
      this.height = rect.height;

      this.canvas.width = Math.floor(this.width * this.dpr);
      this.canvas.height = Math.floor(this.height * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      if (wasZero) {
        this.initStarDust();
        this.initAsteroids();
      }
    }

    setShip(shipId) {
      if (shipId) this.shipClassId = shipId;
    }

    initStarDust() {
      this.starDust = [];
      for (let i = 0; i < 40; i++) {
        this.starDust.push({
          x: Math.random() * (this.width || 800),
          y: Math.random() * (this.height || 600),
          speed: 15 + Math.random() * 45,
          size: 0.8 + Math.random() * 1.8,
          alpha: 0.2 + Math.random() * 0.6,
          color: Math.random() > 0.4 ? '#00f3ff' : '#94a3b8'
        });
      }
    }

    createAsteroid(spawnOutside = false) {
      const radius = 18 + Math.random() * 26;
      let x = 0, y = 0;

      if (spawnOutside && this.width > 0 && this.height > 0) {
        // Spawn from top or right edge
        if (Math.random() < 0.6) {
          x = this.width + radius + Math.random() * 60;
          y = Math.random() * this.height;
        } else {
          x = Math.random() * this.width;
          y = -radius - Math.random() * 60;
        }
      } else {
        x = Math.random() * (this.width || 600);
        y = Math.random() * (this.height || 500);
      }

      // Procedural rock jagged polygon
      const numPts = 9 + Math.floor(Math.random() * 5);
      const vertices = [];
      for (let i = 0; i < numPts; i++) {
        const ang = (i / numPts) * Math.PI * 2;
        const dist = radius * (0.75 + Math.random() * 0.35);
        vertices.push({ x: Math.cos(ang) * dist, y: Math.sin(ang) * dist });
      }

      // Craters
      const numCraters = 2 + Math.floor(Math.random() * 3);
      const craters = [];
      for (let i = 0; i < numCraters; i++) {
        craters.push({
          x: (Math.random() - 0.5) * (radius * 0.8),
          y: (Math.random() - 0.5) * (radius * 0.8),
          r: 3 + Math.random() * (radius * 0.25)
        });
      }

      const isRare = Math.random() < 0.25;

      return {
        x: x,
        y: y,
        vx: -(18 + Math.random() * 32),
        vy: (Math.random() - 0.4) * 20,
        radius: radius,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.8,
        vertices: vertices,
        craters: craters,
        isRare: isRare,
        neonColor: isRare ? '#ff0055' : '#00f3ff',
        baseColor: isRare ? '#1e1124' : '#0f172a'
      };
    }

    initAsteroids() {
      this.asteroids = [];
      const count = 6;
      for (let i = 0; i < count; i++) {
        this.asteroids.push(this.createAsteroid(false));
      }
    }

    onPointerMove(e) {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.isHovering = true;
    }

    onPointerLeave() {
      this.mouse.isHovering = false;
      this.mouse.x = -1000;
      this.mouse.y = -1000;
      this.lockedAsteroid = null;
    }

    onPointerDown(e) {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      let hitTarget = null;
      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const a = this.asteroids[i];
        const dist = Math.hypot(clickX - a.x, clickY - a.y);
        if (dist <= a.radius + 12) {
          hitTarget = a;
          this.asteroids.splice(i, 1);
          break;
        }
      }

      if (hitTarget) {
        this.shatterAsteroid(hitTarget, clickX, clickY);
        // Replace with new asteroid outside view
        this.asteroids.push(this.createAsteroid(true));
      } else {
        // Laser spark on empty space click
        this.spawnLaserSpark(clickX, clickY);
      }
    }

    spawnLaserSpark(x, y) {
      if (window.audio && typeof window.audio.playLaser === 'function') {
        window.audio.playLaser(1.4);
      }
      for (let i = 0; i < 8; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 40 + Math.random() * 80;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          color: '#00f3ff',
          size: 2,
          life: 0.25,
          maxLife: 0.25
        });
      }
    }

    shatterAsteroid(ast, hitX, hitY) {
      // Audio trigger
      if (window.audio && typeof window.audio.playExplosion === 'function') {
        window.audio.playExplosion(0.85);
      }
      if (window.audio && typeof window.audio.playZap === 'function') {
        window.audio.playZap();
      }

      // Shockwave
      this.shockwaves.push({
        x: ast.x,
        y: ast.y,
        radius: 6,
        maxRadius: ast.radius * 2.8,
        color: ast.neonColor,
        life: 0.45,
        maxLife: 0.45
      });

      // Rock Shards & Spark Particles
      const shardCount = 20 + Math.floor(Math.random() * 12);
      for (let i = 0; i < shardCount; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 50 + Math.random() * 180;
        this.particles.push({
          x: ast.x,
          y: ast.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 12,
          color: Math.random() < 0.6 ? ast.neonColor : (Math.random() < 0.5 ? '#ffffff' : '#475569'),
          size: 2 + Math.random() * (ast.radius * 0.22),
          life: 0.5 + Math.random() * 0.4,
          maxLife: 0.9,
          isShard: Math.random() < 0.5
        });
      }

      // Scrap increment & Floating Text
      const scrapBonus = ast.isRare ? 3 : 1;
      if (typeof meta !== 'undefined' && meta) {
        meta.scrap = (meta.scrap || 0) + scrapBonus;
        if (typeof updateMenuScrapDisplay === 'function') updateMenuScrapDisplay();
        if (typeof saveMeta === 'function') saveMeta();
      }

      this.floatingTexts.push({
        x: ast.x,
        y: ast.y - 10,
        text: `+${scrapBonus} 🔩 HURDA`,
        color: ast.isRare ? '#ff0055' : '#ffb300',
        life: 1.1,
        maxLife: 1.1
      });
    }

    update(dt) {
      if (!this.isInitialized) this.init();

      // Skip render if menu is not visible
      const menuOverlay = document.getElementById('menuOverlay');
      if (!menuOverlay || menuOverlay.classList.contains('hidden')) return;

      if (!this.canvas || !this.ctx || this.width <= 0 || this.height <= 0) {
        this.handleResize();
        if (this.width <= 0 || this.height <= 0) return;
      }

      this.time += dt;

      // Clear Canvas
      this.ctx.clearRect(0, 0, this.width, this.height);

      // 1. Draw Star Dust
      this.updateAndDrawStarDust(dt);

      // 2. Draw Floating Player Ship
      this.drawShowcaseShip(dt);

      // 3. Update & Draw Asteroids
      this.updateAndDrawAsteroids(dt);

      // 4. Update & Draw Particles & Shockwaves
      this.updateAndDrawFX(dt);

      // 5. Draw Sci-Fi Crosshair & Reticle
      this.drawCrosshair();
    }

    updateAndDrawStarDust(dt) {
      const ctx = this.ctx;
      for (const s of this.starDust) {
        s.x -= s.speed * dt;
        if (s.x < -10) {
          s.x = this.width + 10;
          s.y = Math.random() * this.height;
        }

        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha * (0.7 + 0.3 * Math.sin(this.time * 3 + s.x));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    }

    drawShowcaseShip(dt) {
      const ctx = this.ctx;
      const shipClass = (typeof selectedShipClass !== 'undefined' && selectedShipClass) ? selectedShipClass : this.shipClassId;
      const shipStats = (typeof SHIP_CLASSES !== 'undefined' && SHIP_CLASSES[shipClass]) ? SHIP_CLASSES[shipClass] : { name: 'İntihar Avcısı', color: '#00f3ff' };

      // Ship anchor coordinates (center of showcase area)
      const cx = this.width * 0.50;
      const cy = this.height * 0.48;

      // Gentle floating sine motion
      const floatY = Math.sin(this.time * 2.0) * 8;
      const rollAngle = Math.sin(this.time * 1.5) * 0.04;

      const sx = cx;
      const sy = cy + floatY;

      // --- Holographic Base Platform (Concentric Neon Rings) ---
      ctx.save();
      ctx.translate(cx, cy + 90);
      const ringPulse = 0.5 + 0.25 * Math.sin(this.time * 2.5);
      ctx.strokeStyle = `rgba(0, 243, 255, ${ringPulse * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 110, 26, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -this.time * 20;
      ctx.beginPath();
      ctx.ellipse(0, 0, 80, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // --- Thruster Fire & Exhaust Particles ---
      if (Math.random() < 0.65) {
        this.thrusterParticles.push({
          x: sx - 45,
          y: sy + (Math.random() - 0.5) * 10,
          vx: -(120 + Math.random() * 80),
          vy: (Math.random() - 0.5) * 20,
          size: 1.5 + Math.random() * 2.5,
          color: Math.random() < 0.7 ? shipStats.color || '#00f3ff' : '#ffffff',
          life: 0.25,
          maxLife: 0.25
        });
      }

      // Update & render thruster sparks
      for (let i = this.thrusterParticles.length - 1; i >= 0; i--) {
        const tp = this.thrusterParticles[i];
        tp.life -= dt;
        tp.x += tp.vx * dt;
        tp.y += tp.vy * dt;
        if (tp.life <= 0) {
          this.thrusterParticles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = tp.color;
        ctx.globalAlpha = tp.life / tp.maxLife;
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, tp.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // --- Render Ship Vector Mesh ---
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(rollAngle);
      ctx.scale(1.7, 1.7); // Showcase zoom scale

      const t = this.time;
      const flicker = 0.85 + 0.15 * Math.sin(t * 35);
      const flameBaseLen = 22 * flicker;

      const drawFlame = (fx, fy, flen, fwidth, outerCol, innerCol) => {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = outerCol;
        ctx.beginPath();
        ctx.moveTo(fx, fy - fwidth * 0.5);
        ctx.lineTo(fx - flen, fy);
        ctx.lineTo(fx, fy + fwidth * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = innerCol;
        ctx.beginPath();
        ctx.moveTo(fx, fy - fwidth * 0.25);
        ctx.lineTo(fx - flen * 0.55, fy);
        ctx.lineTo(fx, fy + fwidth * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };

      if (shipClass === 'titan') {
        drawFlame(-16, -11, flameBaseLen * 0.85, 6, '#ff5500', '#ffe600');
        drawFlame(-18, -4, flameBaseLen * 1.1, 7, '#ff7700', '#ffffff');
        drawFlame(-18, 4, flameBaseLen * 1.1, 7, '#ff7700', '#ffffff');
        drawFlame(-16, 11, flameBaseLen * 0.85, 6, '#ff5500', '#ffe600');

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#ffb300';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = '#ffb300';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(22, 0); ctx.lineTo(16, -9); ctx.lineTo(6, -18); ctx.lineTo(-6, -21); ctx.lineTo(-17, -15);
        ctx.lineTo(-14, -8); ctx.lineTo(-19, 0); ctx.lineTo(-14, 8); ctx.lineTo(-17, 15); ctx.lineTo(-6, 21);
        ctx.lineTo(6, 18); ctx.lineTo(16, 9); ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#ffe600';
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      } else if (shipClass === 'spectre') {
        drawFlame(-13, -6, flameBaseLen * 0.9, 5, '#a855f7', '#00ffcc');
        drawFlame(-15, 0, flameBaseLen * 1.25, 7, '#c084fc', '#ffffff');
        drawFlame(-13, 6, flameBaseLen * 0.9, 5, '#a855f7', '#00ffcc');

        ctx.fillStyle = '#0a0518';
        ctx.strokeStyle = '#bd00ff';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = '#bd00ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(27, 0); ctx.lineTo(12, -7); ctx.lineTo(18, -21); ctx.lineTo(8, -17); ctx.lineTo(-5, -12);
        ctx.lineTo(-14, -8); ctx.lineTo(-10, 0); ctx.lineTo(-14, 8); ctx.lineTo(-5, 12); ctx.lineTo(8, 17);
        ctx.lineTo(18, 21); ctx.lineTo(12, 7); ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#00ffcc';
        ctx.beginPath(); ctx.ellipse(4, 0, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      } else {
        // Interceptor / default
        drawFlame(-15, -6, flameBaseLen * 0.8, 4.5, '#0099ff', '#00f3ff');
        drawFlame(-17, 0, flameBaseLen * 1.3, 8, '#00f3ff', '#ffffff');
        drawFlame(-15, 6, flameBaseLen * 0.8, 4.5, '#0099ff', '#00f3ff');

        ctx.fillStyle = '#060e20';
        ctx.strokeStyle = shipStats.color || '#00f3ff';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = shipStats.color || '#00f3ff';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.moveTo(27, 0); ctx.lineTo(8, -6); ctx.lineTo(4, -18); ctx.lineTo(-15, -16); ctx.lineTo(-10, -7);
        ctx.lineTo(-17, 0); ctx.lineTo(-10, 7); ctx.lineTo(-15, 16); ctx.lineTo(4, 18); ctx.lineTo(8, 6);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#ff007f';
        ctx.beginPath(); ctx.ellipse(3, 0, 8, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      }

      ctx.restore();

      // --- Holographic Info Badge Below Ship ---
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = shipStats.color || '#00f3ff';
      ctx.shadowColor = shipStats.color || '#00f3ff';
      ctx.shadowBlur = 8;
      const shipDisplayName = (shipStats.name || shipClass).toUpperCase();
      ctx.fillText(`⚡ ${shipDisplayName} • SAVAŞ DÜZENİ`, cx, cy + 125);

      ctx.font = '10px monospace';
      ctx.fillStyle = '#64748b';
      ctx.shadowBlur = 0;
      ctx.fillText('AKTİF PİLOT GEMİSİ SİBERNETİK BAĞLANTI: SENKRONİZE', cx, cy + 140);
      ctx.restore();
    }

    updateAndDrawAsteroids(dt) {
      const ctx = this.ctx;
      this.lockedAsteroid = null;

      for (let i = 0; i < this.asteroids.length; i++) {
        const a = this.asteroids[i];
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.rot += a.rotSpeed * dt;

        // Wrap around boundaries
        if (a.x < -a.radius - 20) {
          a.x = this.width + a.radius + 20;
          a.y = Math.random() * this.height;
        }
        if (a.y < -a.radius - 20) a.y = this.height + a.radius + 20;
        if (a.y > this.height + a.radius + 20) a.y = -a.radius - 20;

        // Check hover
        const distToMouse = Math.hypot(this.mouse.x - a.x, this.mouse.y - a.y);
        const isHovered = this.mouse.isHovering && distToMouse <= a.radius + 14;
        if (isHovered && !this.lockedAsteroid) {
          this.lockedAsteroid = a;
        }

        // Draw Asteroid
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rot);

        ctx.fillStyle = a.baseColor;
        ctx.strokeStyle = isHovered ? '#ffffff' : a.neonColor;
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        if (isHovered) {
          ctx.shadowColor = a.neonColor;
          ctx.shadowBlur = 14;
        }

        ctx.beginPath();
        for (let p = 0; p < a.vertices.length; p++) {
          const pt = a.vertices[p];
          if (p === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Craters
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        for (const c of a.craters) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Target Reticle if hovered
        if (isHovered) {
          ctx.save();
          ctx.translate(a.x, a.y);
          ctx.strokeStyle = a.neonColor;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.arc(0, 0, a.radius + 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = a.neonColor;
          ctx.textAlign = 'center';
          ctx.fillText('[ HEDEF KİLİTLENDİ ]', 0, a.radius + 22);
          ctx.restore();
        }
      }
    }

    updateAndDrawFX(dt) {
      const ctx = this.ctx;

      // Shockwaves
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.life -= dt;
        if (sw.life <= 0) {
          this.shockwaves.splice(i, 1);
          continue;
        }
        const progress = 1 - sw.life / sw.maxLife;
        const curRadius = sw.radius + (sw.maxRadius - sw.radius) * progress;
        ctx.save();
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = Math.max(1, 3 * (1 - progress));
        ctx.globalAlpha = sw.life / sw.maxLife;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, curRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Shard & Spark Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94;
        p.vy *= 0.94;
        if (p.isShard) p.rot += p.rotSpeed * dt;

        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        if (p.isShard) {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot || 0);
          ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Floating Texts (+1 🔩 HURDA)
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.life -= dt;
        ft.y -= 35 * dt; // Float upwards
        if (ft.life <= 0) {
          this.floatingTexts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = ft.life / ft.maxLife;
        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 6;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }
    }

    drawCrosshair() {
      if (!this.mouse.isHovering) return;
      const ctx = this.ctx;
      const mx = this.mouse.x;
      const my = this.mouse.y;

      ctx.save();
      ctx.strokeStyle = this.lockedAsteroid ? '#ff0055' : 'rgba(0, 243, 255, 0.65)';
      ctx.lineWidth = 1.2;

      // Reticle circle
      ctx.beginPath();
      ctx.arc(mx, my, 10, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshair ticks
      ctx.beginPath();
      ctx.moveTo(mx - 15, my); ctx.lineTo(mx - 5, my);
      ctx.moveTo(mx + 5, my); ctx.lineTo(mx + 15, my);
      ctx.moveTo(mx, my - 15); ctx.lineTo(mx, my - 5);
      ctx.moveTo(mx, my + 5); ctx.lineTo(mx, my + 15);
      ctx.stroke();

      ctx.restore();
    }
  }

  window.ZortexMenuShowcase = new MenuShowcaseEngine();
})();
