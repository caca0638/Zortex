import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const indexPath = path.join(rootDir, 'index.html');
const fxPath = path.join(rootDir, 'js', 'fx', 'zortex_fx.js');
const outputPath = path.join(rootDir, 'docs', 'CODEBASE_MAP.md');

function findBraceEnd(lines, startIdx) {
  let depth = 0;
  let started = false;
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      // Skip commented characters if simple single line comment
      if (char === '/' && line[j + 1] === '/') break;
      if (char === '{') {
        depth++;
        started = true;
      } else if (char === '}') {
        depth--;
        if (started && depth === 0) {
          return i + 1;
        }
      }
    }
  }
  return -1;
}

function parseClasses(content) {
  const lines = content.split('\n');
  const classes = [];
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const match = line.match(/^\s*class\s+([A-Za-z0-9_]+)(?:\s+extends\s+([A-Za-z0-9_]+))?/);
    if (match) {
      const start = idx + 1;
      const end = findBraceEnd(lines, idx);
      classes.push({
        name: match[1],
        extends: match[2] || null,
        start,
        end: end !== -1 ? end : start,
        lines: end !== -1 ? end - start + 1 : 1
      });
    }
  }
  return classes;
}

function parseFunctions(content, targetFunctions) {
  const lines = content.split('\n');
  const results = [];
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    for (const fnName of targetFunctions) {
      const regex = new RegExp(`^\\s*(?:async\\s+)?function\\s+${fnName}\\s*\\(`);
      if (regex.test(line)) {
        const start = idx + 1;
        const end = findBraceEnd(lines, idx);
        results.push({
          name: fnName,
          start,
          end: end !== -1 ? end : start,
          lines: end !== -1 ? end - start + 1 : 1
        });
      }
    }
  }
  return results.sort((a, b) => a.start - b.start);
}

function generateMap() {
  if (!fs.existsSync(indexPath)) {
    console.error(`Error: index.html not found at ${indexPath}`);
    process.exit(1);
  }

  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const indexLines = indexContent.split('\n');
  const totalIndexLines = indexLines.length;

  let fxLinesCount = 0;
  let fxClasses = [];
  if (fs.existsSync(fxPath)) {
    const fxContent = fs.readFileSync(fxPath, 'utf8');
    fxLinesCount = fxContent.split('\n').length;
    fxClasses = parseClasses(fxContent);
  }

  // Anchor definitions for index.html subsystems
  const subsystemAnchors = [
    { id: 'HTML_CSS', title: 'HTML Shell, CSS Styling & HUD Dock', matcher: l => l.includes('<!DOCTYPE html>'), desc: 'DOM markup, CRT filters, chamfered HUD slots, styles.' },
    { id: 'AUDIO', title: 'Audio Engine & Retro SFX', matcher: l => l.includes('class AudioEngine'), desc: 'Web Audio synthesizer, retro procedural laser & explosion sounds.' },
    { id: 'TEXTURES', title: 'Pixi Procedural Textures', matcher: l => l.includes('function initPixiTextures'), desc: '2x resolution canvas textures for player ships & enemies.' },
    { id: 'LAYERS', title: 'Scene Containers & Layer Hierarchy', matcher: l => l.includes('function setupPixiContainers'), desc: '5-layer setup (background, entities, player, emissive, text).' },
    { id: 'VIEWPORT', title: 'Viewport & Screen Scaling', matcher: l => l.includes('function resize(') || l.includes('function resize()'), desc: 'Responsive canvas sizing and DPR limits.' },
    { id: 'INPUT_HAPTICS', title: 'Gamepad, Input & Rumble Haptics', matcher: l => l.includes('function triggerRumble'), desc: 'Gamepad polling, vibration effects, keyboard/mouse hooks.' },
    { id: 'HITSTOP', title: 'Hit-Stop & Screen Shake', matcher: l => l.includes('function triggerHitStop'), desc: 'Zero-jank micro freezes for heavy impacts and evolutions.' },
    { id: 'SPATIAL_GRID', title: 'Spatial Grid Partitioning', matcher: l => l.includes('class SpatialGrid'), desc: '2D spatial hash grid for high-speed collision lookups.' },
    { id: 'SETTINGS', title: 'Settings & Graphics Presets', matcher: l => l.includes('function loadSettings'), desc: 'Graphics tiers, reduceFlashing, audio and bloom toggles.' },
    { id: 'STORAGE', title: 'Profiles & Meta Save System', matcher: l => l.includes('function createDefaultProfileData'), desc: 'localStorage & save_data.json persistence, scrap banking.' },
    { id: 'ACHIEVEMENTS', title: 'Achievements & Badges', matcher: l => l.includes('function checkAchievements') || l.includes('const ACHIEVEMENTS'), desc: 'Unlock criteria, toast alerts, reward tracking.' },
    { id: 'TECH_TREE', title: 'Tech Tree & Progression Upgrades', matcher: l => l.includes('const TECH_TREE') || l.includes('function hasTechNode'), desc: 'Meta upgrade nodes, stat multipliers, scrap costs.' },
    { id: 'BACKGROUND', title: 'Starfield & Parallax Layers', matcher: l => l.includes('class Starfield'), desc: 'Multi-layer 2.5D stars and warp hyperspace streaks.' },
    { id: 'PARTICLES', title: 'Particle System (Pooled)', matcher: l => l.includes('class ParticleSystem'), desc: 'Zero-GC smoke, spark, burst, and ring emitter pools.' },
    { id: 'FLOATING_TEXT', title: 'Damage Floating Text (BitmapFont)', matcher: l => l.includes('class TextManager'), desc: 'Pooled damage numbers with dark contrast outline.' },
    { id: 'PLAYER', title: 'Player Ship Architecture', matcher: l => l.includes('class Player'), desc: 'Ship body layer, shield corona, dash mechanics, weapons.' },
    { id: 'BULLETS', title: 'Projectiles & Bullet Pooling', matcher: l => l.includes('class Bullet'), desc: 'High-speed bullets, penetration, hit detection.' },
    { id: 'WEAPONS', title: 'Weapons & Evolution Logic', matcher: l => l.includes('class WeaponBase'), desc: 'Weapon slots, cooldown timers, levelup evolutions.' },
    { id: 'ENEMIES', title: 'Enemy Hierarchy & AI States', matcher: l => l.includes('class EnemyBase'), desc: 'Enemy types (Scout, Swarm, Phantom, Aegis, Boss) & behaviors.' },
    { id: 'WAVES', title: 'Wave Spawner & Progression', matcher: l => l.includes('class WaveManager'), desc: 'Wave progression, spawn timer pacing, boss phases.' },
    { id: 'PICKUPS', title: 'Pickups, XP Gems & Black Holes', matcher: l => l.includes('class XpGem'), desc: 'Gems, scrap, magnet physics, gravitational vortex.' },
    { id: 'HAZARDS', title: 'Turrets, Area Hazards & Decoys', matcher: l => l.includes('class LaserTurret'), desc: 'Environmental hazards, laser turrets, hack zones.' },
    { id: 'HUD', title: 'HUD Rendering & Indicators', matcher: l => l.includes('function updateDOMHUD'), desc: 'Real-time HP/Shield bars, combo meters, weapon slots.' },
    { id: 'GAMELOOP', title: 'Main Game Loop (144Hz Physics)', matcher: l => l.includes('function gameLoop('), desc: 'Delta timing, spatial queries, collision & render dispatch.' },
    { id: 'GAME_STATE', title: 'Game State & Session Management', matcher: l => l.includes('function startGame(') || l.includes('function startGame()'), desc: 'Run starts, game over flow, card selection, pause.' },
    { id: 'MODALS', title: 'Hangar, Tech Tree & Meta Menus', matcher: l => l.includes('function renderHangar'), desc: 'Hangar ship selector, tech tree view, settings menu.' }
  ];

  const locatedSubsystems = [];
  subsystemAnchors.forEach(sub => {
    const idx = indexLines.findIndex(sub.matcher);
    if (idx !== -1) {
      locatedSubsystems.push({
        ...sub,
        startLine: idx + 1
      });
    }
  });

  locatedSubsystems.sort((a, b) => a.startLine - b.startLine);

  for (let i = 0; i < locatedSubsystems.length; i++) {
    const current = locatedSubsystems[i];
    const next = locatedSubsystems[i + 1];
    current.endLine = next ? next.startLine - 1 : totalIndexLines;
    current.lineSpan = current.endLine - current.startLine + 1;
  }

  // Parse classes in index.html
  const indexClasses = parseClasses(indexContent);

  // Key function tracking in index.html
  const keyFunctionsToTrack = [
    'initPixiTextures',
    'setupPixiContainers',
    'clearEntityContainers',
    'resize',
    'triggerRumble',
    'updateGamepad',
    'triggerHitStop',
    'resetRunStats',
    'loadSettings',
    'saveSettings',
    'applyGraphicsPreset',
    'loadAllProfiles',
    'saveAllProfiles',
    'checkAchievements',
    'updateDOMHUD',
    'drawHUD',
    'gameLoop',
    'startGame',
    'gameOver',
    'renderHangar',
    'renderTechTree'
  ];
  const indexFunctions = parseFunctions(indexContent, keyFunctionsToTrack);

  // Generate Markdown
  let md = `# ZORTEX: CYBER SURVIVOR - DYNAMIC CODEBASE MAP\n\n`;
  md += `> **AUTO-GENERATED**: Run \`node scripts/update_codebase_map.mjs\` after code changes.\n`;
  md += `> **TOKEN OPTIMIZATION RULE**: Never load the entire file into context. Use the exact line ranges below with \`view_file\` (e.g. \`StartLine=${locatedSubsystems[15]?.startLine || 6804}, EndLine=${locatedSubsystems[15]?.endLine || 8244}\`).\n\n`;
  md += `*Last Generated:* \`${new Date().toISOString()}\` | *index.html Lines:* **${totalIndexLines.toLocaleString()}** | *zortex_fx.js Lines:* **${fxLinesCount.toLocaleString()}**\n\n`;
  md += `---\n\n`;

  md += `## 1. \`index.html\` Subsystems Overview\n\n`;
  md += `| Subsystem | Exact Line Range | Span | Purpose & Responsibilities |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  locatedSubsystems.forEach(s => {
    md += `| **${s.title}** | \`${s.startLine.toLocaleString()} - ${s.endLine.toLocaleString()}\` | ${s.lineSpan} l | ${s.desc} |\n`;
  });
  md += `\n---\n\n`;

  md += `## 2. \`index.html\` Class Hierarchy (${indexClasses.length} Classes)\n\n`;
  md += `| Class Name | Inheritance | Exact Range | Lines | Quick Reference |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;
  indexClasses.forEach(c => {
    const ext = c.extends ? ('extends ' + c.extends) : '-';
    md += `| \`${c.name}\` | \`${ext}\` | \`${c.start.toLocaleString()} - ${c.end.toLocaleString()}\` | ${c.lines} | [Line ${c.start}](file:///index.html#L${c.start}) |\n`;
  });
  md += `\n---\n\n`;

  md += `## 3. \`index.html\` Core Engine Functions\n\n`;
  md += `| Function | Exact Range | Span | Context |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  indexFunctions.forEach(f => {
    md += `| \`${f.name}()\` | \`${f.start.toLocaleString()} - ${f.end.toLocaleString()}\` | ${f.lines} l | Core Engine |\n`;
  });
  md += `\n---\n\n`;

  md += `## 4. \`js/fx/zortex_fx.js\` Visual FX Subsystems (${fxClasses.length} Modules)\n\n`;
  md += `| Module / Manager | Line Range | Lines | Visual Functionality |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  const fxDescs = {
    QualityManager: 'Adaptive performance tier controller (<45 fps downshift, >=58 fps upshift).',
    FXRegistry: 'Subsystem lifecycle registry, debug toggles and status inspection.',
    BloomManager: 'Pixi v8 AdvancedBloomFilter bound strictly to pixiEmissiveLayer.',
    NebulaManager: 'Procedural 4-octave FBM GLSL background nebula shader.',
    TrailFXManager: 'MeshRope GPU weapon trails and ship propulsion exhaust.',
    ExplosionFXManager: 'Zero-GC 5-stage explosion pooling (flash, ring, sparks, smoke, light).',
    PostProcessFXManager: 'Unified fullscreen post-process (CRT, RGBSplit, shockwave, vignette).',
    LightFXManager: '32-sprite pooled radial additive point lights.',
    RimGlowManager: 'GlProgram RimGlowFilter applied strictly to shipBodyLayer.',
    GatlingBeamFXManager: 'TilingSprite energy beams, spool-up dynamics and heat gradient.',
    WeaponEvolutionCinematicManager: 'Weapon evolution hit-stop, shockwave, flash and HUD banner.',
    DebugPanel: 'Tweakpane v4 (F2) live runtime shader and layer debugger.'
  };

  fxClasses.forEach(c => {
    const desc = fxDescs[c.name] || 'Visual effect manager.';
    md += `| \`${c.name}\` | \`${c.start.toLocaleString()} - ${c.end.toLocaleString()}\` | ${c.lines} l | ${desc} |\n`;
  });
  md += `\n---\n`;

  fs.writeFileSync(outputPath, md, 'utf8');
  console.log(`[OK] Successfully updated CODEBASE_MAP.md -> ${outputPath}`);
  console.log(`- Subsystems indexed: ${locatedSubsystems.length}`);
  console.log(`- Classes indexed: ${indexClasses.length}`);
  console.log(`- Key functions indexed: ${indexFunctions.length}`);
  console.log(`- FX modules indexed: ${fxClasses.length}`);
}

generateMap();

if (process.argv.includes('--watch')) {
  console.log('[WATCH] Watching index.html and js/fx/zortex_fx.js for changes...');
  let timer = null;
  const onChange = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log('\n[EVENT] File change detected, regenerating map...');
      generateMap();
    }, 300);
  };
  fs.watch(indexPath, onChange);
  if (fs.existsSync(fxPath)) {
    fs.watch(fxPath, onChange);
  }
}
