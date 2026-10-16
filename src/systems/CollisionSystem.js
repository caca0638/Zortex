/**
 * ZORTEX: CYBER SURVIVOR - ÇARPIŞMA VE ETKİLEŞİM SİSTEMİ (CollisionSystem.js)
 * 2.5D derinlik ve perspektif yarıçaplarına duyarlı çarpışma algılama motoru.
 */

export class CollisionSystem {
  constructor() {
    this.hitstopTimer = 0;
  }

  triggerHitstop(duration = 0.05) {
    this.hitstopTimer = Math.max(this.hitstopTimer, duration);
  }

  update(dt, player, enemiesList, projectilesList, gemsList, scrapsList, particleSystem, assetLoader, onEnemyKilled) {
    // 1. Mermiler ile Düşmanlar Arası Çarpışma
    for (let pIdx = projectilesList.length - 1; pIdx >= 0; pIdx--) {
      const proj = projectilesList[pIdx];
      if (proj.isDead) continue;

      // Oyuncu mermileri sadece düşmanlara çarpar
      if (!proj.isEnemy) {
        for (let eIdx = enemiesList.length - 1; eIdx >= 0; eIdx--) {
          const enemy = enemiesList[eIdx];
          if (enemy.isDead || proj.hitSet.has(enemy)) continue;

          // 2.5D Dairesel Çarpışma Testi
          const dx = enemy.x - proj.x;
          const dy = enemy.y - proj.y;
          const hitRadius = (enemy.radius || 16) + (proj.radius || 4);

          if (dx * dx + dy * dy <= hitRadius * hitRadius) {
            proj.hitSet.add(enemy);

            // Geri tepme darbesi açısı
            const shotAngle = Math.atan2(proj.vy, proj.vx);
            const killed = enemy.hit(proj.damage, proj.isCrit, proj.knockbackPower, shotAngle);

            // Vuruş partikülleri ve sarsıntı
            if (particleSystem) {
              const partCount = proj.isCrit ? 16 : 6;
              particleSystem.emit(proj.x, proj.y, proj.color, partCount, 4, 2.5);
            }

            // Kritik vuruş veya ağır darbede Hitstop (Freeze Frame)
            if (proj.isCrit || enemy.type === 'heavy' || enemy.type === 'boss') {
              this.triggerHitstop(proj.isCrit ? 0.05 : 0.035);
            }

            if (killed) {
              if (onEnemyKilled) onEnemyKilled(enemy);
            }

            // Delme (Pierce) Kontrolü
            if (proj.pierce > 0) {
              proj.pierce--;
            } else {
              proj.isDead = true;
              break;
            }
          }
        }
      }
      // Düşman mermileri sadece oyuncuya çarpar
      else {
        const dx = player.x - proj.x;
        const dy = player.y - proj.y;
        const hitRadius = (player.radius || 18) + (proj.radius || 4);

        if (dx * dx + dy * dy <= hitRadius * hitRadius) {
          player.takeDamage(proj.damage, assetLoader);
          proj.isDead = true;
          if (particleSystem) {
            particleSystem.emit(player.x, player.y, '#ff0055', 12, 5, 2);
          }
        }
      }
    }

    // 2. Düşmanlar ile Oyuncu Gövde Teması (Kamikaze ve Çarpışma)
    for (let eIdx = enemiesList.length - 1; eIdx >= 0; eIdx--) {
      const enemy = enemiesList[eIdx];
      if (enemy.isDead) continue;

      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const hitRadius = (player.radius || 18) + (enemy.radius || 16);

      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        player.takeDamage(enemy.damage, assetLoader);
        enemy.hit(40, false, 12, Math.atan2(dy, dx) + Math.PI);

        if (enemy.detonated || enemy.type === 'kamikaze') {
          enemy.isDead = true;
          if (particleSystem) {
            particleSystem.emit(enemy.x, enemy.y, '#ff0055', 30, 7, 3);
          }
        }
      }
    }

    // 3. Ganimetlerin (XP Kristalleri & Hurda) Toplanması
    for (let gIdx = gemsList.length - 1; gIdx >= 0; gIdx--) {
      const gem = gemsList[gIdx];
      const dist = Math.hypot(player.x - gem.x, player.y - gem.y);
      if (dist < player.radius + gem.radius + 6) {
        gem.isDead = true;
        player.combo++;
        if (particleSystem) {
          particleSystem.emit(gem.x, gem.y, '#00ffcc', 4, 2, 1.5);
        }
      }
    }

    for (let sIdx = scrapsList.length - 1; sIdx >= 0; sIdx--) {
      const scrap = scrapsList[sIdx];
      const dist = Math.hypot(player.x - scrap.x, player.y - scrap.y);
      if (dist < player.radius + scrap.radius + 6) {
        scrap.isDead = true;
        if (particleSystem) {
          particleSystem.emit(scrap.x, scrap.y, '#ffd700', 6, 2, 1.5);
        }
      }
    }
  }
}
