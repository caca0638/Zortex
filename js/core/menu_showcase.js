/**
 * ============================================================================
 * ZORTEX: CYBER SURVIVOR - SEAMLESS CINEMATIC MENU SHOWCASE
 * Module: js/core/menu_showcase.js
 * Architecture:
 *   - Edge-to-edge cinematic deep-space cosmos with procedural celestial planet
 *   - Soft atmospheric nebula glows & multi-depth parallax starfield
 *   - Commanding hero ship showcase with volumetric ion thrusters & telemetry
 *   - 3D-shaded crystal-veined asteroids with realistic shatter & scrap bonus
 *   - Zero UI clutter, zero tutorial badges, seamless left-dock integration
 * ============================================================================
 */
(function() {
  'use strict';

  class MenuShowcaseEngine {
    constructor() {
      this.canvas = null;
      this.ctx = null;
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
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d', { alpha: false });
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
      if (!this.canvas || !this.ctx) return;
      const w = window.innerWidth || 1280;
      const h = window.innerHeight || 720;
      if (w <= 0 || h <= 0) return;

      const wasZero = (this.width <= 0 || this.height <= 0);
      this.width = w;
      this.height = h;

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
      const count = 75;
      for (let i = 0; i < count; i++) {
        this.starDust.push({
          x: Math.random() * (this.width || 1280),
          y: Math.random() * (this.height || 720),
          speed: 12 + Math.random() * 40,
          size: 0.6 + Math.random() * 1.8,
          alpha: 0.15 + Math.random() * 0.75,
          color: Math.random() > 0.45 ? '#00f3ff' : (Math.random() > 0.5 ? '#ffffff' : '#c084fc')
        });
      }
    }

    createAsteroid(spawnOutside = false) {
      const radius = 22 + Math.random() * 26;
      let x = 0, y = 0;

      // Restrict active asteroid corridor to the right 60% of screen so they don't crowd the left menu dock
      const minX = this.width > 960 ? this.width * 0.42 : 0;

      if (spawnOutside && this.width > 0 && this.height > 0) {
        if (Math.random() < 0.65) {
          x = this.width + radius + Math.random() * 80;
          y = Math.random() * this.height;
        } else {
          x = minX + Math.random() * (this.width - minX);
          y = -radius - Math.random() * 80;
        }
      } else {
        x = minX + Math.random() * ((this.width || 1280) - minX);
        y = Math.random() * (this.height || 720);
      }

      // Procedural chunky rock geometry
      const numPts = 10 + Math.floor(Math.random() * 4);
      const vertices = [];
      for (let i = 0; i < numPts; i++) {
        const ang = (i / numPts) * Math.PI * 2;
        const dist = radius * (0.75 + Math.random() * 0.35);
        vertices.push({ x: Math.cos(ang) * dist, y: Math.sin(ang) * dist });
      }

      // Craters with shadows
      const numCraters = 2 + Math.floor(Math.random() * 3);
      const craters = [];
      for (let i = 0; i < numCraters; i++) {
        craters.push({
          x: (Math.random() - 0.5) * (radius * 0.75),
          y: (Math.random() - 0.5) * (radius * 0.75),
          r: 3 + Math.random() * (radius * 0.22)
        });
      }

      const isRare = Math.random() < 0.22;

      return {
        x: x,
        y: y,
        vx: -(14 + Math.random() * 26),
        vy: (Math.random() - 0.4) * 16,
        radius: radius,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.5,
        vertices: vertices,
        craters: craters,
        isRare: isRare,
        neonColor: isRare ? '#ff0055' : '#00f3ff',
        baseColorDark: isRare ? '#160a1e' : '#08111e',
        baseColorLight: isRare ? '#381640' : '#1e293b'
      };
    }

    initAsteroids() {
      this.asteroids = [];
      const count = 5;
      for (let i = 0; i < count; i++) {
        this.asteroids.push(this.createAsteroid(false));
      }
    }

    onPointerMove(e) {
      if (!this.canvas) return;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
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
      const clickX = e.clientX;
      const clickY = e.clientY;

      // Do not handle clicks that fall inside the left dock panel
      if (this.width > 960 && clickX < 490) return;

      let hitTarget = null;
      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const a = this.asteroids[i];
        const dist = Math.hypot(clickX - a.x, clickY - a.y);
        if (dist <= a.radius + 14) {
          hitTarget = a;
          this.asteroids.splice(i, 1);
          break;
        }
      }

      if (hitTarget) {
        this.shatterAsteroid(hitTarget, clickX, clickY);
        this.asteroids.push(this.createAsteroid(true));
      } else {
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
      if (window.audio && typeof window.audio.playExplosion === 'function') {
        window.audio.playExplosion(0.85);
      }
      if (window.audio && typeof window.audio.playZap === 'function') {
        window.audio.playZap();
      }

      // Expanding Shockwave Ripple
      this.shockwaves.push({
        x: ast.x,
        y: ast.y,
        radius: 8,
        maxRadius: ast.radius * 2.8,
        color: ast.neonColor,
        life: 0.45,
        maxLife: 0.45
      });

      // Rock Shards & Fiery Plasma Sparks
      const shardCount = 24 + Math.floor(Math.random() * 10);
      for (let i = 0; i < shardCount; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 60 + Math.random() * 190;
        this.particles.push({
          x: ast.x,
          y: ast.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 12,
          color: Math.random() < 0.65 ? ast.neonColor : (Math.random() < 0.5 ? '#ffffff' : '#f97316'),
          size: 2 + Math.random() * (ast.radius * 0.24),
          life: 0.5 + Math.random() * 0.4,
          maxLife: 0.9,
          isShard: Math.random() < 0.5
        });
      }

      // Scrap increment & Sleek Floating Text
      const scrapBonus = ast.isRare ? 3 : 1;
      if (typeof meta !== 'undefined' && meta) {
        meta.scrap = (meta.scrap || 0) + scrapBonus;
        if (typeof updateMenuScrapDisplay === 'function') updateMenuScrapDisplay();
        if (typeof saveMeta === 'function') saveMeta();
      }

      this.floatingTexts.push({
        x: ast.x,
        y: ast.y - 12,
        text: `+${scrapBonus} 🔩 HURDA`,
        color: ast.isRare ? '#ff0055' : '#ffe600',
        life: 1.1,
        maxLife: 1.1
      });
    }

    update(dt) {
      if (!this.isInitialized) this.init();

      // Skip render if menu is not active
      const menuOverlay = document.getElementById('menuOverlay');
      if (!menuOverlay || menuOverlay.classList.contains('hidden')) return;

      if (!this.canvas || !this.ctx || this.width <= 0 || this.height <= 0) {
        this.handleResize();
        if (this.width <= 0 || this.height <= 0) return;
      }

      this.time += dt;

      // 1. Draw Deep Space Celestial Atmosphere
      this.drawDeepCosmos();

      // 2. Draw Parallax Star Dust
      this.updateAndDrawStarDust(dt);

      // 3. Draw Celestial Planet & Atmosphere
      this.drawCelestialPlanet();

      // 4. Draw Floating Player Ship
      this.drawShowcaseShip(dt);

      // 5. Update & Draw 3D-Shaded Asteroids
      this.updateAndDrawAsteroids(dt);

      // 6. Update & Draw FX Particles & Shockwaves
      this.updateAndDrawFX(dt);

      // 7. Draw Sleek Targeting Reticle
      this.drawCrosshair();
    }

    drawDeepCosmos() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;

      // Deep void background fill
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      // Atmospheric Nebula Clusters (Soft volumetric clouds)
      const grad1 = ctx.createRadialGradient(w * 0.75, h * 0.45, 40, w * 0.75, h * 0.45, w * 0.55);
      grad1.addColorStop(0, 'rgba(15, 23, 62, 0.45)');
      grad1.addColorStop(0.5, 'rgba(30, 15, 60, 0.20)');
      grad1.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, w, h);

      const grad2 = ctx.createRadialGradient(w * 0.40, h * 0.85, 20, w * 0.40, h * 0.85, w * 0.45);
      grad2.addColorStop(0, 'rgba(0, 243, 255, 0.08)');
      grad2.addColorStop(0.6, 'rgba(120, 10, 150, 0.06)');
      grad2.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, w, h);
    }

    drawCelestialPlanet() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;

      // Planet positioned in upper-right quadrant
      const px = w * 0.82;
      const py = h * 0.28;
      const pr = Math.min(125, w * 0.11);

      ctx.save();

      // Planet Rings - Back Arc
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-0.35);
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.22)';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.ellipse(0, 0, pr * 2.2, pr * 0.55, 0, Math.PI, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(192, 132, 252, 0.18)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(0, 0, pr * 2.45, pr * 0.62, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Planet Sphere Body with 3D Spherical Light Gradient
      const planetGrad = ctx.createRadialGradient(px - pr * 0.4, py - pr * 0.4, pr * 0.1, px, py, pr);
      planetGrad.addColorStop(0, '#1e293b');
      planetGrad.addColorStop(0.4, '#0f172a');
      planetGrad.addColorStop(0.85, '#040814');
      planetGrad.addColorStop(1, '#02040a');

      ctx.fillStyle = planetGrad;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();

      // Luminous Atmospheric Crescent Rim (Cyan Edge Glow)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const atmGrad = ctx.createRadialGradient(px - pr * 0.35, py - pr * 0.35, pr * 0.7, px, py, pr * 1.05);
      atmGrad.addColorStop(0, 'rgba(0, 243, 255, 0)');
      atmGrad.addColorStop(0.85, 'rgba(0, 243, 255, 0.35)');
      atmGrad.addColorStop(1, 'rgba(0, 243, 255, 0.75)');

      ctx.strokeStyle = atmGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Planet Rings - Front Arc
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-0.35);
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.32)';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.ellipse(0, 0, pr * 2.2, pr * 0.55, 0, 0, Math.PI);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(192, 132, 252, 0.28)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(0, 0, pr * 2.45, pr * 0.62, 0, 0, Math.PI);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
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
        ctx.globalAlpha = s.alpha * (0.65 + 0.35 * Math.sin(this.time * 2.5 + s.x));
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

      // Ship anchor coordinates (balanced in the open space of the right side)
      const cx = this.width > 960 ? this.width * 0.66 : this.width * 0.50;
      const cy = this.height * 0.52;

      // Gentle floating kinematics
      const floatY = Math.sin(this.time * 1.8) * 9;
      const rollAngle = Math.sin(this.time * 1.4) * 0.04;

      const sx = cx;
      const sy = cy + floatY;

      // --- Holographic Base Telemetry Ring ---
      ctx.save();
      ctx.translate(cx, cy + 95);
      const ringPulse = 0.45 + 0.25 * Math.sin(this.time * 2.2);
      ctx.strokeStyle = `rgba(0, 243, 255, ${ringPulse * 0.45})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 125, 28, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 243, 255, 0.18)';
      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -this.time * 18;
      ctx.beginPath();
      ctx.ellipse(0, 0, 90, 20, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // --- Volumetric Thruster Light Glow ---
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const glowGrad = ctx.createRadialGradient(sx - 45, sy, 5, sx - 45, sy, 90);
      glowGrad.addColorStop(0, 'rgba(0, 243, 255, 0.35)');
      glowGrad.addColorStop(0.5, 'rgba(0, 153, 255, 0.12)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(sx - 45, sy, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // --- Thruster Sparks ---
      if (Math.random() < 0.70) {
        this.thrusterParticles.push({
          x: sx - 48,
          y: sy + (Math.random() - 0.5) * 12,
          vx: -(130 + Math.random() * 90),
          vy: (Math.random() - 0.5) * 22,
          size: 1.5 + Math.random() * 2.5,
          color: Math.random() < 0.75 ? shipStats.color || '#00f3ff' : '#ffffff',
          life: 0.28,
          maxLife: 0.28
        });
      }

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

      // --- Render Ship Vector Geometry (Majestic 2.2x Scale) ---
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(rollAngle);
      ctx.scale(2.2, 2.2);

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

      // --- Holographic Minimalist Telemetry Below Ship ---
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = shipStats.color || '#00f3ff';
      ctx.shadowColor = shipStats.color || '#00f3ff';
      ctx.shadowBlur = 8;
      const shipDisplayName = (shipStats.name || shipClass).toUpperCase();
      ctx.fillText(`⚡ ${shipDisplayName} // SAVAŞ DÜZENİ`, cx, cy + 130);

      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
      ctx.shadowBlur = 0;
      ctx.fillText('SEKTÖR-07 // TELEMETRİ SENKRONİZE', cx, cy + 146);
      ctx.restore();
    }

    updateAndDrawAsteroids(dt) {
      const ctx = this.ctx;
      this.lockedAsteroid = null;

      const minX = this.width > 960 ? this.width * 0.42 : 0;

      for (let i = 0; i < this.asteroids.length; i++) {
        const a = this.asteroids[i];
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.rot += a.rotSpeed * dt;

        // Wrap around boundaries
        if (a.x < minX - a.radius - 20) {
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

        // Draw 3D Shaded Asteroid
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rot);

        // Spherical ambient lighting (lit from top-right planet light, shadowed bottom-left)
        const rockGrad = ctx.createRadialGradient(
          a.radius * 0.35, -a.radius * 0.35, a.radius * 0.1,
          0, 0, a.radius * 1.05
        );
        rockGrad.addColorStop(0, a.baseColorLight);
        rockGrad.addColorStop(0.55, a.baseColorDark);
        rockGrad.addColorStop(1, '#020408');

        ctx.fillStyle = rockGrad;
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

        // Craters with shadows
        for (const c of a.craters) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.restore();

        // Minimalist Target Corners if Hovered (No tacky text)
        if (isHovered) {
          ctx.save();
          ctx.translate(a.x, a.y);
          ctx.strokeStyle = a.neonColor;
          ctx.lineWidth = 1.5;
          const boxSize = a.radius + 10;
          const len = 8;

          ctx.beginPath();
          // Top-Left
          ctx.moveTo(-boxSize, -boxSize + len); ctx.lineTo(-boxSize, -boxSize); ctx.lineTo(-boxSize + len, -boxSize);
          // Top-Right
          ctx.moveTo(boxSize - len, -boxSize); ctx.lineTo(boxSize, -boxSize); ctx.lineTo(boxSize, -boxSize + len);
          // Bottom-Right
          ctx.moveTo(boxSize, boxSize - len); ctx.lineTo(boxSize, boxSize); ctx.lineTo(boxSize - len, boxSize);
          // Bottom-Left
          ctx.moveTo(-boxSize + len, boxSize); ctx.lineTo(-boxSize, boxSize); ctx.lineTo(-boxSize, boxSize - len);
          ctx.stroke();
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
        ft.y -= 35 * dt;
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
      if (this.width > 960 && this.mouse.x < 490) return; // Do not draw crosshair over the dock
      const ctx = this.ctx;
      const mx = this.mouse.x;
      const my = this.mouse.y;

      ctx.save();
      ctx.strokeStyle = this.lockedAsteroid ? '#ff0055' : 'rgba(0, 243, 255, 0.70)';
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.arc(mx, my, 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(mx - 13, my); ctx.lineTo(mx - 4, my);
      ctx.moveTo(mx + 4, my); ctx.lineTo(mx + 13, my);
      ctx.moveTo(mx, my - 13); ctx.lineTo(mx, my - 4);
      ctx.moveTo(mx, my + 4); ctx.lineTo(mx, my + 13);
      ctx.stroke();

      ctx.restore();
    }
  }

  window.ZortexMenuShowcase = new MenuShowcaseEngine();
})();
